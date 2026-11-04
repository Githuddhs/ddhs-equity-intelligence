// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

const STAFF = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLIENT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DEMO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TEAM = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const migrations = ["0035_subscribed_staff_client_workspaces", "0036_subscribed_client_team_members", "0037_staff_demo_company_registry", "0038_client_administration_handover", "0039_enforce_delegated_client_boundaries", "0040_client_owner_team_administration"].map((name) => readFileSync(new URL(`../../drizzle/migrations/${name}.sql`, import.meta.url), "utf8")).join("\n");
let db: PGlite;
const tables = ["eea12_analyses", "barrier_responses", "barrier_survey_links", "client_share_links", "ee_plans", "dg_reviews", "dg_outcome_analyses", "evidence_extractions", "plan_gap_analyses", "portal_documents", "recruitment_vacancies", "recruitment_candidates", "doel_submissions", "reminder_settings", "invoices"];

async function actor(id: string, scope?: string) {
  await db.exec("RESET ROLE");
  await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.headers',$2,false)", [id, JSON.stringify(scope ? { "x-ddhs-client": scope } : {})]);
  await db.exec("SET ROLE authenticated");
}
async function permission(id: string, sensitive = false) {
  const result = await db.query<{ allowed: boolean }>("select public.can_manage_client($1,$2) allowed", [id, sensitive]);
  return result.rows[0]?.allowed;
}

describe("subscribed client workspaces — isolated database", () => {
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA public,auth,storage TO authenticated;
      CREATE TYPE public.app_role AS ENUM ('admin','user','manager');
      CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
      CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
      INSERT INTO user_roles VALUES('${STAFF}','admin');
      CREATE TABLE public.subscriptions(user_id uuid,status text,plan text);
      GRANT SELECT ON public.subscriptions TO authenticated;
      ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY own_subs ON subscriptions FOR SELECT TO authenticated USING(user_id=auth.uid());
      INSERT INTO subscriptions VALUES('${CLIENT}','active','professional'),('${OTHER}','pending','professional');
      CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
      CREATE TABLE public.workforce_snapshots(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid DEFAULT auth.uid(),snapshot_date date,source text,total_headcount int,counts jsonb,disability jsonb,units jsonb,notes text,updated_at timestamptz DEFAULT now());
      CREATE TABLE public.workforce_foundation_periods(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid DEFAULT auth.uid(),period_start date,period_end date,snapshot_date date,organisation jsonb,employees jsonb,remuneration jsonb,movements jsonb,warnings jsonb,snapshot_id uuid,updated_at timestamptz DEFAULT now(),UNIQUE(user_id,period_start,period_end));
      CREATE FUNCTION public.save_workforce_foundation(jsonb,jsonb) RETURNS uuid LANGUAGE sql AS $$ SELECT auth.uid() $$;
      CREATE FUNCTION public.delete_workforce_foundation(uuid) RETURNS void LANGUAGE sql AS $$ DELETE FROM workforce_foundation_periods WHERE id=$1 AND user_id=auth.uid() $$;
      ${tables.map((table) => `CREATE TABLE public.${table}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL DEFAULT auth.uid(),label text DEFAULT '');`).join("\n")}
      ${[...tables,"workforce_snapshots","workforce_foundation_periods"].map((table) => `GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated; ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY; CREATE POLICY owner_policy ON public.${table} FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());`).join("\n")}`);
    await db.exec(migrations);
    await db.exec(`INSERT INTO staff_demo_companies(id,company) VALUES('${DEMO}','Fictional demo'); INSERT INTO client_team_members(client_id,user_id,email,created_by) VALUES('${CLIENT}','${TEAM}','team@example.invalid','${STAFF}');`);
  });
  afterEach(async () => { await db.close(); });

  it("requires an active platform subscription, not a pending or DG-only payment", async () => {
    await actor(STAFF);
    expect(await permission(CLIENT)).toBe(true);
    expect(await permission(OTHER)).toBe(false);
    await db.exec("RESET ROLE"); await db.exec(`UPDATE subscriptions SET status='active',plan='dg_review' WHERE user_id='${OTHER}'`);
    await actor(STAFF); expect(await permission(OTHER)).toBe(false);
  });
  it("requires client consent for individual salary and disability records", async () => {
    await actor(STAFF); expect(await permission(CLIENT,true)).toBe(false);
    await actor(CLIENT); await db.exec(`INSERT INTO client_staff_permissions(user_id,sensitive_access) VALUES('${CLIENT}',true)`);
    await actor(STAFF); expect(await permission(CLIENT,true)).toBe(true);
    await actor(CLIENT); await db.exec("UPDATE client_staff_permissions SET sensitive_access=false");
    await actor(STAFF); expect(await permission(CLIENT,true)).toBe(false);
  });
  it("does not let staff grant consent for another client", async () => {
    await actor(STAFF);
    await expect(db.exec(`INSERT INTO client_staff_permissions(user_id,sensitive_access) VALUES('${CLIENT}',true)`)).rejects.toThrow();
  });
  it("rejects an arbitrary client scope from a non-staff non-member account", async () => {
    await actor(OTHER,CLIENT);
    expect(await permission(CLIENT)).toBe(false);
    await expect(db.exec("INSERT INTO ee_plans(label) VALUES('unauthorised')")).rejects.toThrow();
  });
  it("saves only under the chosen client and records the staff actor", async () => {
    await actor(STAFF,CLIENT);
    await db.exec("INSERT INTO ee_plans(label) VALUES('client plan')");
    const rows = await db.query<{ user_id: string }>("SELECT user_id FROM ee_plans");
    expect(rows.rows.map((row) => row.user_id)).toEqual([CLIENT]);
    const audit = await db.query<{ staff_id: string; client_id: string }>("SELECT staff_id,client_id FROM client_staff_audit");
    expect(audit.rows).toEqual([{ staff_id: STAFF, client_id: CLIENT }]);
    await expect(db.exec(`INSERT INTO ee_plans(user_id,label) VALUES('${OTHER}','wrong client')`)).rejects.toThrow();
  });
  it("isolates selected-client reads and immediately blocks suspended subscriptions", async () => {
    await db.exec(`INSERT INTO ee_plans(user_id,label) VALUES('${CLIENT}','client'),('${OTHER}','other')`);
    await actor(STAFF,CLIENT); expect((await db.query("SELECT * FROM ee_plans")).rows).toHaveLength(1);
    await db.exec("RESET ROLE"); await db.exec(`UPDATE subscriptions SET status='cancelled' WHERE user_id='${CLIENT}'`);
    await actor(STAFF,CLIENT); expect((await db.query("SELECT * FROM ee_plans")).rows).toHaveLength(0);
  });
  it("allows multiple team users without granting staff roles or sensitive access", async () => {
    await actor(TEAM,CLIENT); expect(await permission(CLIENT)).toBe(true); expect(await permission(CLIENT,true)).toBe(false);
    await db.exec("INSERT INTO ee_plans(label) VALUES('team plan')");
    await db.exec("RESET ROLE"); await db.exec(`UPDATE client_team_members SET active=false WHERE user_id='${TEAM}'`);
    await actor(TEAM,CLIENT); expect(await permission(CLIENT)).toBe(false);
  });
  it("makes the fictional demo available only to staff, without a paid subscription", async () => {
    await actor(STAFF,DEMO); expect(await permission(DEMO,true)).toBe(true);
    await db.exec("INSERT INTO ee_plans(label) VALUES('demo plan')");
    await actor(TEAM,DEMO); expect(await permission(DEMO)).toBe(false);
    expect((await db.query("SELECT * FROM ee_plans")).rows).toHaveLength(0);
  });
  it("only the client owner can accept handover", async () => {
    await actor(STAFF); await db.query("select request_client_handover($1,'Ready')", [CLIENT]);
    await expect(db.exec("select accept_client_handover()")).rejects.toThrow();
    await actor(TEAM); await expect(db.exec("select accept_client_handover()")).rejects.toThrow();
    await actor(CLIENT); await db.exec("select accept_client_handover()");
    expect((await db.query<{ notes: string }>("select notes from client_handovers")).rows[0]?.notes).toBe("Ready");
  });
  it("acceptance ends delegated staff access and consent without deleting client data or team access", async () => {
    await actor(CLIENT); await db.exec(`INSERT INTO client_staff_permissions VALUES('${CLIENT}',true,now()); INSERT INTO ee_plans(label) VALUES('Retain me')`);
    await actor(STAFF); await db.query("select request_client_handover($1,'Ready')", [CLIENT]);
    await actor(CLIENT); await db.exec("select accept_client_handover()");
    expect((await db.query("select * from ee_plans")).rows).toHaveLength(1);
    await actor(STAFF,CLIENT); expect(await permission(CLIENT)).toBe(false); expect(await permission(CLIENT,true)).toBe(false);
    await actor(TEAM,CLIENT); expect(await permission(CLIENT)).toBe(true);
    await actor(CLIENT); await db.exec("select set_client_support(true)");
    await actor(STAFF,CLIENT); expect(await permission(CLIENT)).toBe(true); expect(await permission(CLIENT,true)).toBe(false);
  });
  it("blocks staff header omission and team access to individual candidate information", async () => {
    await db.exec(`CREATE POLICY blanket_staff ON ee_plans FOR ALL TO authenticated USING(has_role(auth.uid(),'admin')) WITH CHECK(has_role(auth.uid(),'admin')); INSERT INTO ee_plans(user_id,label) VALUES('${CLIENT}','client')`);
    await actor(STAFF); await db.query("select request_client_handover($1,'Ready')", [CLIENT]);
    await actor(CLIENT); await db.exec("select accept_client_handover()");
    await actor(STAFF); expect((await db.query("select * from ee_plans")).rows).toHaveLength(0);
    await actor(TEAM,CLIENT); await expect(db.exec("insert into recruitment_candidates(label) values('private')")).rejects.toThrow();
  });
  it("retains two team users and their saved records through a full handover", async () => {
    await db.exec(`INSERT INTO client_team_members(client_id,user_id,email,created_by) VALUES('${CLIENT}','${OTHER}','second@example.invalid','${STAFF}'); INSERT INTO ee_plans(user_id,label) VALUES('${OTHER}','Other company private plan')`);
    await actor(STAFF,CLIENT); await db.exec("INSERT INTO ee_plans(label) VALUES('Fictional handover plan')");
    await actor(STAFF); await db.query("select request_client_handover($1,'All setup complete')",[CLIENT]);
    await actor(CLIENT); await db.exec("select accept_client_handover()");
    for (const member of [TEAM,OTHER]) {
      await actor(member,CLIENT);
      expect(await permission(CLIENT)).toBe(true);
      expect((await db.query<{ label: string }>("select label from ee_plans")).rows).toEqual([{label:'Fictional handover plan'}]);
      await db.exec("UPDATE ee_plans SET label='Fictional handover plan'");
    }
    await actor(CLIENT);
    expect((await db.query("select * from client_team_members where active")).rows).toHaveLength(2);
  });
  it("blocks cross-client read, insert, update and delete after acceptance", async () => {
    await db.exec(`INSERT INTO ee_plans(user_id,label) VALUES('${OTHER}','Other company private plan')`);
    await actor(STAFF); await db.query("select request_client_handover($1,'Ready')",[CLIENT]);
    await actor(CLIENT); await db.exec("select accept_client_handover()");
    for (const who of [CLIENT,TEAM,STAFF]) {
      await actor(who,who===TEAM ? CLIENT : undefined);
      expect((await db.query("select * from ee_plans where user_id=$1",[OTHER])).rows).toHaveLength(0);
      expect((await db.query("update ee_plans set label='tamper' where user_id=$1 returning id",[OTHER])).rows).toHaveLength(0);
      expect((await db.query("delete from ee_plans where user_id=$1 returning id",[OTHER])).rows).toHaveLength(0);
      await expect(db.query("insert into ee_plans(user_id,label) values($1,'tamper')",[OTHER])).rejects.toThrow();
    }
    await db.exec("RESET ROLE");
    expect((await db.query<{label:string}>("select label from ee_plans where user_id=$1",[OTHER])).rows[0]?.label).toBe('Other company private plan');
  });
  it("revoking renewed support immediately blocks staff reads and writes", async () => {
    await actor(STAFF,CLIENT); await db.exec("INSERT INTO ee_plans(label) VALUES('Retained plan')");
    await actor(STAFF); await db.query("select request_client_handover($1,'Ready')",[CLIENT]);
    await actor(CLIENT); await db.exec("select accept_client_handover(); select set_client_support(true)");
    await actor(STAFF,CLIENT); expect((await db.query("select * from ee_plans")).rows).toHaveLength(1);
    await actor(CLIENT); await db.exec("select set_client_support(false)");
    await actor(STAFF,CLIENT); expect((await db.query("select * from ee_plans")).rows).toHaveLength(0);
    await expect(db.exec("INSERT INTO ee_plans(label) VALUES('forbidden')")).rejects.toThrow();
  });
});