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

describe("stay interviews — isolated workspace permissions", () => {
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
    await db.exec(readFileSync(new URL('../../drizzle/migrations/0046_stay_interviews.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO staff_demo_companies(id,company) VALUES('${DEMO}','Fictional demo'); INSERT INTO client_team_members(client_id,user_id,email,created_by) VALUES('${CLIENT}','${TEAM}','team@example.invalid','${STAFF}');`);
  });
  afterEach(async () => { await db.close(); });

  it("staff creates a stay link under the selected fictional client", async () => {
    await actor(STAFF,DEMO);
    await db.exec(`INSERT INTO stay_interview_links(user_id,token,expires_at) VALUES('${DEMO}','${'a'.repeat(48)}',now()+interval '14 days')`);
    expect((await db.query<{user_id:string}>('SELECT user_id FROM stay_interview_links')).rows).toEqual([{user_id:DEMO}]);
  });
  it("switching workspaces hides other clients' stay responses", async () => {
    await db.exec(`INSERT INTO stay_interview_responses(user_id,employee_label) VALUES('${CLIENT}','Fictional A'),('${DEMO}','Fictional B')`);
    await actor(STAFF,DEMO);
    expect((await db.query<{employee_label:string}>('SELECT employee_label FROM stay_interview_responses')).rows).toEqual([{employee_label:'Fictional B'}]);
  });
  it("clients cannot create stay links", async () => {
    await actor(CLIENT);
    await expect(db.exec(`INSERT INTO stay_interview_links(token,expires_at) VALUES('${'b'.repeat(48)}',now()+interval '14 days')`)).rejects.toThrow();
  });
  it("owner reads stay feedback but cannot delete it or close links", async () => {
    await db.exec(`INSERT INTO stay_interview_links(user_id,created_by,token,expires_at) VALUES('${CLIENT}','${STAFF}','${'c'.repeat(48)}',now()+interval '14 days'); INSERT INTO stay_interview_responses(user_id,employee_label) VALUES('${CLIENT}','Fictional feedback')`);
    await actor(CLIENT);
    expect((await db.query('SELECT * FROM stay_interview_responses')).rows).toHaveLength(1);
    expect((await db.query('DELETE FROM stay_interview_responses RETURNING id')).rows).toHaveLength(0);
    expect((await db.query('UPDATE stay_interview_links SET revoked=true RETURNING id')).rows).toHaveLength(0);
  });
  it("staff cannot read private stay feedback without client consent or outside a workspace", async () => {
    await db.exec(`INSERT INTO stay_interview_responses(user_id) VALUES('${CLIENT}')`);
    await actor(STAFF,CLIENT);
    expect((await db.query('SELECT * FROM stay_interview_responses')).rows).toHaveLength(0);
    await db.exec('RESET ROLE'); await db.exec(`INSERT INTO client_staff_permissions(user_id,sensitive_access) VALUES('${CLIENT}',true)`);
    await actor(STAFF,CLIENT); expect((await db.query('SELECT * FROM stay_interview_responses')).rows).toHaveLength(1);
    await actor(STAFF); expect((await db.query('SELECT * FROM stay_interview_responses')).rows).toHaveLength(0);
  });
  it("clients cannot read another workspace's stay feedback", async () => {
    await db.exec(`INSERT INTO stay_interview_responses(user_id) VALUES('${DEMO}')`);
    await actor(CLIENT,DEMO);
    expect((await db.query('SELECT * FROM stay_interview_responses')).rows).toHaveLength(0);
  });
  it("expired and revoked stay links reject both lookup and submission", async () => {
    for (const [token,expiry,revoked] of [['d'.repeat(48),'-1 day',false],['e'.repeat(48),'14 days',true]] as const) {
      await db.query(`INSERT INTO stay_interview_links(user_id,created_by,token,expires_at,revoked) VALUES($1,'${STAFF}',$2,now()+$3::interval,$4)`,[DEMO,token,expiry,revoked]);
      await db.exec('SET ROLE anon');
      expect((await db.query<{info:unknown}>('SELECT stay_interview_link_info($1) info',[token])).rows[0]?.info).toBeNull();
      expect((await db.query<{done:boolean}>('SELECT submit_stay_interview($1,$2::jsonb) done',[token,'{}'])).rows[0]?.done).toBe(false);
      await db.exec('RESET ROLE');
    }
  });
  it("a submitted stay link remains consumed after staff delete its response", async () => {
    const token = 'f'.repeat(48);
    await actor(STAFF,DEMO);
    await db.query("INSERT INTO stay_interview_links(user_id,token,expires_at) VALUES($1,$2,now()+interval '14 days')",[DEMO,token]);
    await db.exec('SET ROLE anon');
    expect((await db.query<{done:boolean}>('SELECT submit_stay_interview($1,$2::jsonb) done',[token,'{"reasons":["Meaningful work"]}'])).rows[0]?.done).toBe(true);
    await actor(STAFF,DEMO);
    expect((await db.query('DELETE FROM stay_interview_responses RETURNING id')).rows).toHaveLength(1);
    await db.exec('SET ROLE anon');
    expect((await db.query<{done:boolean}>('SELECT submit_stay_interview($1,$2::jsonb) done',[token,'{}'])).rows[0]?.done).toBe(false);
  });
});
