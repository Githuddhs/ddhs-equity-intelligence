// @vitest-environment node
/**
 * Client access rules for the handoff, on an isolated in-memory Postgres (PGlite) — never touches live data.
 * The row-level security statements are read from the project's own migration files, so the test follows the real rules.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { executeHandoff, type HandoffStore } from "./recruitment-handoff";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VAC_A = "11111111-1111-4111-8111-111111111111";
const CAND_A = "22222222-2222-4222-8222-222222222222";
const TABLES = /public\.(recruitment_vacancies|recruitment_candidates|workforce_foundation_periods|workforce_snapshots)\b/;

/** Every ENABLE RLS / CREATE / DROP POLICY statement for the four tables, in migration order. */
function migrationRules(): string[] {
  const dir = join(process.cwd(), "drizzle/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    .flatMap((f) => readFileSync(join(dir, f), "utf8").split(/;\s*(?:\r?\n|$)/))
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter((s) => /^(CREATE|DROP) POLICY|^ALTER TABLE .* ROW LEVEL SECURITY/i.test(s) && TABLES.test(s));
}

const SCHEMA = `
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create type public.app_role as enum ('admin','user','manager');
create table public.user_roles(user_id uuid, role public.app_role);
create function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create table public.workforce_snapshots(id uuid primary key default gen_random_uuid(), user_id uuid not null, snapshot_date date not null, source text not null, total_headcount int not null default 0, counts jsonb not null default '{}', disability jsonb not null default '{}', units jsonb not null default '[]', notes text, updated_at timestamptz default now());
create table public.workforce_foundation_periods(id uuid primary key default gen_random_uuid(), user_id uuid not null, period_start date not null, period_end date not null, snapshot_date date not null, organisation jsonb not null, employees jsonb not null, remuneration jsonb not null, movements jsonb not null, warnings jsonb not null default '[]', snapshot_id uuid references public.workforce_snapshots(id), updated_at timestamptz default now(), unique(user_id, period_start, period_end));
create table public.recruitment_vacancies(id uuid primary key, user_id uuid not null, title text, occupational_level text, organisation text, division text, department text, section text, province text);
create table public.recruitment_candidates(id uuid primary key, vacancy_id uuid references public.recruitment_vacancies(id), user_id uuid not null, full_name text, race text, gender text, disability boolean, foreign_national boolean, stage text, handover jsonb not null default '{}');
grant usage on schema public, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public, auth to authenticated;
CREATE FUNCTION public.save_workforce_foundation(p_record jsonb, p_snapshot jsonb) RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_id uuid; v_snapshot uuid; v_old_snapshot uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT id, snapshot_id INTO v_id, v_old_snapshot FROM public.workforce_foundation_periods WHERE user_id=auth.uid() AND period_start=(p_record->>'period_start')::date AND period_end=(p_record->>'period_end')::date FOR UPDATE;
 IF v_old_snapshot IS NOT NULL THEN
  UPDATE public.workforce_snapshots SET snapshot_date=(p_record->>'snapshot_date')::date, source='employee_profile', counts=p_snapshot->'counts', disability=p_snapshot->'disability', units=p_snapshot->'units', total_headcount=(p_snapshot->>'total_headcount')::integer, updated_at=now() WHERE id=v_old_snapshot AND user_id=auth.uid();
  v_snapshot := v_old_snapshot;
 ELSE
  INSERT INTO public.workforce_snapshots(user_id,snapshot_date,source,total_headcount,counts,disability,units,notes) VALUES(auth.uid(),(p_record->>'snapshot_date')::date,'employee_profile',(p_snapshot->>'total_headcount')::integer,p_snapshot->'counts',p_snapshot->'disability',p_snapshot->'units','Derived from Employee Profiles') RETURNING id INTO v_snapshot;
 END IF;
 INSERT INTO public.workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements,warnings,snapshot_id) VALUES(auth.uid(),(p_record->>'period_start')::date,(p_record->>'period_end')::date,(p_record->>'snapshot_date')::date,p_record->'organisation',p_record->'employees',p_record->'remuneration',p_record->'movements',p_record->'warnings',v_snapshot)
 ON CONFLICT(user_id,period_start,period_end) DO UPDATE SET snapshot_date=EXCLUDED.snapshot_date,organisation=EXCLUDED.organisation,employees=EXCLUDED.employees,remuneration=EXCLUDED.remuneration,movements=EXCLUDED.movements,warnings=EXCLUDED.warnings,snapshot_id=EXCLUDED.snapshot_id,updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END $function$;
grant execute on function public.save_workforce_foundation(jsonb, jsonb) to authenticated;
`;

let db: PGlite;
const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

/** Runs statements as a signed-in client, with row-level security applied. */
async function as<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user]);
    await tx.query(`set local role authenticated`);
    return (await tx.query<T>(sql, params)).rows;
  });
}
const store = (user: string): HandoffStore => ({
  loadCandidate: async (id) => ((await as(user, `select c.*, to_jsonb(v) as vacancy from recruitment_candidates c join recruitment_vacancies v on v.id=c.vacancy_id where c.id=$1`, [id]))[0] as never) ?? null,
  loadPeriods: async () => (await as(user, `select * from workforce_foundation_periods`))
    .map((p) => ({ ...p, period_start: iso(p["period_start"]), period_end: iso(p["period_end"]), snapshot_date: iso(p["snapshot_date"]) })) as never,
  saveFoundation: async (r, s) => { await as(user, `select save_workforce_foundation($1::jsonb, $2::jsonb)`, [JSON.stringify(r), JSON.stringify(s)]); },
  stampHandover: async (id, h) => { await as(user, `update recruitment_candidates set handover=$2::jsonb where id=$1`, [id, JSON.stringify(h)]); },
});
const input = { candidateId: CAND_A, employeeId: "E100", startDate: "2026-03-01", contractType: "Permanent", workPattern: "Full-time", manager: "M001" };
const periodOf = async (user: string) => (await db.query<{ employees: unknown[]; movements: unknown[] }>(`select employees, movements from workforce_foundation_periods where user_id=$1`, [user])).rows;

describe("handoff client access rules — isolated database", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(SCHEMA);
    const rules = migrationRules();
    expect(rules.filter((r) => /ENABLE ROW LEVEL SECURITY/i.test(r))).toHaveLength(4);
    for (const r of rules) await db.exec(r);
    await db.exec(`insert into recruitment_vacancies values('${VAC_A}','${A}','HR Officer','Skilled Technical','Org A','Ops','HR','Payroll','Western Cape');
      insert into recruitment_candidates values('${CAND_A}','${VAC_A}','${A}','N. Dlamini','African','Female',false,false,'appointed','{}');`);
    for (const u of [A, B]) await as(u, `insert into workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements) values($1,'2025-10-01','2026-09-30','2026-09-30','{}','[]','[]','[]')`, [u]);
    await executeHandoff(store(A), input);
  });

  it("the owning client's handoff saves under the access rules", async () => {
    expect((await periodOf(A))[0]!.employees).toHaveLength(1);
    expect((await periodOf(A))[0]!.movements).toHaveLength(1);
  });

  it("another client cannot read the owner's employee profiles, periods, snapshots or recruitment records", async () => {
    expect(await as(B, `select * from workforce_foundation_periods where user_id=$1`, [A])).toHaveLength(0);
    expect(await as(B, `select * from workforce_snapshots where user_id=$1`, [A])).toHaveLength(0);
    expect(await as(B, `select * from recruitment_vacancies`)).toHaveLength(0);
    expect(await as(B, `select * from recruitment_candidates`)).toHaveLength(0);
  });

  it("another client cannot send the owner's appointment into any Employee Profile", async () => {
    await expect(executeHandoff(store(B), { ...input, employeeId: "X1" })).rejects.toThrow(/Candidate not found/);
    expect((await periodOf(B))[0]!.employees).toHaveLength(0);
    expect((await periodOf(A))[0]!.employees).toHaveLength(1);
  });

  it("another client cannot change or delete the owner's records", async () => {
    expect(await as(B, `update workforce_foundation_periods set employees='[]' where user_id=$1 returning id`, [A])).toHaveLength(0);
    expect(await as(B, `delete from workforce_snapshots where user_id=$1 returning id`, [A])).toHaveLength(0);
    expect(await as(B, `update recruitment_candidates set stage='rejected' where id=$1 returning id`, [CAND_A])).toHaveLength(0);
    expect(await as(B, `delete from recruitment_vacancies where id=$1 returning id`, [VAC_A])).toHaveLength(0);
    // Saving through the period function only ever writes the caller's own period.
    await as(B, `select save_workforce_foundation($1::jsonb, '{"counts":{},"disability":{},"units":[],"total_headcount":0}'::jsonb)`,
      [JSON.stringify({ period_start: "2025-10-01", period_end: "2026-09-30", snapshot_date: "2026-09-30", organisation: {}, employees: [], remuneration: [], movements: [], warnings: [] })]);
    expect((await periodOf(A))[0]!.employees).toHaveLength(1);
    expect((await db.query(`select 1 from recruitment_candidates where id=$1 and stage='appointed'`, [CAND_A])).rows).toHaveLength(1);
  });

  it("another client cannot create records in the owner's name", async () => {
    await expect(as(B, `insert into workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements) values($1,'2024-10-01','2025-09-30','2025-09-30','{}','[]','[]','[]')`, [A])).rejects.toThrow(/row-level security/);
    await expect(as(B, `insert into workforce_snapshots(user_id,snapshot_date,source) values($1,'2026-01-01','employee_profile')`, [A])).rejects.toThrow(/row-level security/);
    await expect(as(B, `insert into recruitment_vacancies(id,user_id,title) values(gen_random_uuid(),$1,'Fake')`, [A])).rejects.toThrow(/row-level security/);
    await expect(as(B, `insert into recruitment_candidates(id,vacancy_id,user_id,full_name) values(gen_random_uuid(),$1,$2,'Fake')`, [VAC_A, B])).rejects.toThrow(/row-level security/);
  });
});
