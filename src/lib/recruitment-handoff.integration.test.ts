/**
 * Integration test on an isolated in-memory Postgres (PGlite) — never touches the live database.
 * Uses the real save_workforce_foundation SQL and the same executeHandoff the server runs.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { executeHandoff, type HandoffStore } from "./recruitment-handoff";

const UID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CAND = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SCHEMA = `
create schema auth;
create function auth.uid() returns uuid language sql as $$ select '${UID}'::uuid $$;
create table workforce_snapshots(id uuid primary key default gen_random_uuid(), user_id uuid not null, snapshot_date date not null, source text not null, total_headcount int not null default 0, counts jsonb not null default '{}', disability jsonb not null default '{}', units jsonb not null default '[]', notes text, updated_at timestamptz default now());
create table workforce_foundation_periods(id uuid primary key default gen_random_uuid(), user_id uuid not null, period_start date not null, period_end date not null, snapshot_date date not null, organisation jsonb not null, employees jsonb not null, remuneration jsonb not null, movements jsonb not null, warnings jsonb not null default '[]', snapshot_id uuid references workforce_snapshots(id), updated_at timestamptz default now(), unique(user_id, period_start, period_end));
create table recruitment_vacancies(id uuid primary key, title text, occupational_level text, organisation text, division text, department text, section text, province text);
create table recruitment_candidates(id uuid primary key, vacancy_id uuid references recruitment_vacancies(id), full_name text, race text, gender text, disability boolean, foreign_national boolean, stage text, handover jsonb not null default '{}');
CREATE OR REPLACE FUNCTION save_workforce_foundation(p_record jsonb, p_snapshot jsonb) RETURNS uuid LANGUAGE plpgsql AS $function$
DECLARE v_id uuid; v_snapshot uuid; v_old_snapshot uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT id, snapshot_id INTO v_id, v_old_snapshot FROM workforce_foundation_periods WHERE user_id=auth.uid() AND period_start=(p_record->>'period_start')::date AND period_end=(p_record->>'period_end')::date FOR UPDATE;
 IF v_old_snapshot IS NOT NULL THEN
  UPDATE workforce_snapshots SET snapshot_date=(p_record->>'snapshot_date')::date, source='employee_profile', counts=p_snapshot->'counts', disability=p_snapshot->'disability', units=p_snapshot->'units', total_headcount=(p_snapshot->>'total_headcount')::integer, updated_at=now() WHERE id=v_old_snapshot AND user_id=auth.uid();
  v_snapshot := v_old_snapshot;
 ELSE
  INSERT INTO workforce_snapshots(user_id,snapshot_date,source,total_headcount,counts,disability,units,notes) VALUES(auth.uid(),(p_record->>'snapshot_date')::date,'employee_profile',(p_snapshot->>'total_headcount')::integer,p_snapshot->'counts',p_snapshot->'disability',p_snapshot->'units','Derived from Employee Profiles') RETURNING id INTO v_snapshot;
 END IF;
 INSERT INTO workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements,warnings,snapshot_id) VALUES(auth.uid(),(p_record->>'period_start')::date,(p_record->>'period_end')::date,(p_record->>'snapshot_date')::date,p_record->'organisation',p_record->'employees',p_record->'remuneration',p_record->'movements',p_record->'warnings',v_snapshot)
 ON CONFLICT(user_id,period_start,period_end) DO UPDATE SET snapshot_date=EXCLUDED.snapshot_date,organisation=EXCLUDED.organisation,employees=EXCLUDED.employees,remuneration=EXCLUDED.remuneration,movements=EXCLUDED.movements,warnings=EXCLUDED.warnings,snapshot_id=EXCLUDED.snapshot_id,updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END $function$;
insert into recruitment_vacancies values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','HR Officer','Skilled Technical','Org','Ops','HR','Payroll','Western Cape');
insert into recruitment_candidates values('${CAND}','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','N. Dlamini','African','Female',true,false,'appointed','{"start_date":"2026-03-01"}');
`;
const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

let db: PGlite;
const store = (): HandoffStore => ({
  loadCandidate: async (id) => {
    const r = await db.query<Record<string, unknown>>(`select c.*, to_jsonb(v) as vacancy from recruitment_candidates c join recruitment_vacancies v on v.id=c.vacancy_id where c.id=$1`, [id]);
    return (r.rows[0] as never) ?? null;
  },
  loadPeriods: async () => (await db.query<Record<string, unknown>>(`select * from workforce_foundation_periods where user_id=$1`, [UID])).rows
    .map((p) => ({ ...p, period_start: iso(p["period_start"]), period_end: iso(p["period_end"]), snapshot_date: iso(p["snapshot_date"]) })) as never,
  saveFoundation: async (record, snapshot) => { await db.query(`select save_workforce_foundation($1::jsonb, $2::jsonb)`, [JSON.stringify(record), JSON.stringify(snapshot)]); },
  stampHandover: async (id, h) => { await db.query(`update recruitment_candidates set handover=$2::jsonb where id=$1`, [id, JSON.stringify(h)]); },
});
const addPeriod = (start: string, end: string) => db.query(`insert into workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements) values($1,$2,$3,$3,'{"name":"Org"}','[]','[]','[]')`, [UID, start, end]);
const input = { candidateId: CAND, employeeId: "E100", startDate: "2026-03-01", contractType: "Permanent", workPattern: "Full-time", manager: "M001" };
const period = async (start: string) => (await db.query<{ employees: { employeeId: string; level: string; startDate: string }[]; movements: { employeeId: string; type: string; date: string }[]; snapshot_id: string | null }>(`select employees, movements, snapshot_id from workforce_foundation_periods where period_start=$1`, [start])).rows[0]!;

describe("recruitment handoff — isolated database", () => {
  beforeEach(async () => { db = new PGlite(); await db.exec(SCHEMA); });

  it("saves the Employee Profile and recruitment record in the period covering the start date", async () => {
    await addPeriod("2024-10-01", "2025-09-30");
    await addPeriod("2025-10-01", "2026-09-30");
    const r = await executeHandoff(store(), input);
    expect(r.period).toBe("2025-10-01 to 2026-09-30");
    const p = await period("2025-10-01");
    expect(p.employees).toHaveLength(1);
    expect(p.employees[0]).toMatchObject({ employeeId: "E100", level: "Skilled Technical", startDate: "2026-03-01" });
    expect(p.movements).toEqual([expect.objectContaining({ employeeId: "E100", type: "Recruitment", date: "2026-03-01" })]);
    expect((await period("2024-10-01")).employees).toHaveLength(0);
    const snap = (await db.query<{ total_headcount: number; source: string }>(`select total_headcount, source from workforce_snapshots where id=$1`, [p.snapshot_id])).rows[0]!;
    expect(snap).toEqual({ total_headcount: 1, source: "employee_profile" });
    const h = (await db.query<{ handover: Record<string, unknown> }>(`select handover from recruitment_candidates where id=$1`, [CAND])).rows[0]!.handover;
    expect(h).toMatchObject({ employee_id: "E100", profile_period: "2025-10-01 to 2026-09-30" });
  });

  it("a repeat submission is refused and creates no duplicate profile or movement", async () => {
    await addPeriod("2025-10-01", "2026-09-30");
    await executeHandoff(store(), input);
    await expect(executeHandoff(store(), input)).rejects.toThrow(/already on the Employee Profile/);
    await expect(executeHandoff(store(), { ...input, employeeId: "E200" })).rejects.toThrow(/already on the Employee Profile/);
    const p = await period("2025-10-01");
    expect(p.employees).toHaveLength(1);
    expect(p.movements).toHaveLength(1);
    expect((await db.query(`select 1 from workforce_foundation_periods`)).rows).toHaveLength(1);
    expect((await db.query(`select 1 from workforce_snapshots`)).rows).toHaveLength(1);
  });

  it("saves nothing when no reporting period exists", async () => {
    await expect(executeHandoff(store(), input)).rejects.toThrow(/reporting period first/);
    expect((await db.query(`select 1 from workforce_foundation_periods`)).rows).toHaveLength(0);
    const h = (await db.query<{ handover: Record<string, unknown> }>(`select handover from recruitment_candidates`)).rows[0]!.handover;
    expect(h["profile_sent_at"]).toBeUndefined();
  });
});
