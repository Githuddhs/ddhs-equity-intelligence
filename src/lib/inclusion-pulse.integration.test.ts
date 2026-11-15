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
const answers = (value = 4) => JSON.stringify({ ratings: { belong_accepted: value, voice_safe: 4 }, barriers: ["None of these"] });

describe("inclusion pulse surveys — isolated workspace privacy and permissions", () => {
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
    await db.exec(readFileSync(new URL('../../drizzle/migrations/0047_inclusion_pulse_surveys.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../../drizzle/migrations/0048_inclusion_pulse_email_invitations.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../../drizzle/migrations/0049_restrict_pulse_invitation_links_to_staff.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO staff_demo_companies(id,company) VALUES('${DEMO}','Fictional demo'); INSERT INTO client_team_members(client_id,user_id,email,created_by) VALUES('${CLIENT}','${TEAM}','team@example.invalid','${STAFF}');`);
  });
  afterEach(async () => { await db.close(); });

  it("staff creates a private pulse link under the selected fictional client", async () => {
    await actor(STAFF,DEMO);
    await db.exec(`INSERT INTO inclusion_pulse_links(user_id,token,expires_at) VALUES('${DEMO}','${'a'.repeat(48)}',now()+interval '14 days')`);
    expect((await db.query<{user_id:string}>('SELECT user_id FROM inclusion_pulse_links')).rows).toEqual([{user_id:DEMO}]);
  });
  it("staff prepares one recipient-specific link per employee email", async () => {
    await actor(STAFF,DEMO);
    const recipients = ['one@example.invalid','two@example.invalid','three@example.invalid'];
    for (const [index,email] of recipients.entries()) {
      await db.query("INSERT INTO inclusion_pulse_links(user_id,token,recipient_email,expires_at) VALUES($1,$2,$3,now()+interval '14 days')",[DEMO,String(index+1).repeat(48),email]);
    }
    const rows=(await db.query<{recipient_email:string;token:string}>('SELECT recipient_email,token FROM inclusion_pulse_links ORDER BY recipient_email')).rows;
    expect(rows.map((row)=>row.recipient_email).sort()).toEqual([...recipients].sort());
    expect(new Set(rows.map((row)=>row.token)).size).toBe(3);
  });
  it("clients cannot record invitation delivery themselves", async () => {
    await actor(STAFF,DEMO);
    await db.query("INSERT INTO inclusion_pulse_links(user_id,token,recipient_email,expires_at) VALUES($1,$2,'employee@example.invalid',now()+interval '14 days')",[DEMO,'9'.repeat(48)]);
    await actor(CLIENT,DEMO);
    await expect(db.query("UPDATE inclusion_pulse_links SET invitation_sent_at=now() WHERE token=$1",['9'.repeat(48)])).rejects.toThrow();
    expect((await db.query('SELECT recipient_email,token FROM inclusion_pulse_links')).rows).toHaveLength(0);
  });
  it("clients cannot create pulse links", async () => {
    await actor(CLIENT);
    await expect(db.exec(`INSERT INTO inclusion_pulse_links(token,expires_at) VALUES('${'b'.repeat(48)}',now()+interval '14 days')`)).rejects.toThrow();
  });
  it("owners cannot read individual rows but receive aggregate results", async () => {
    for (let index=0; index<3; index++) await db.query(`INSERT INTO inclusion_pulse_responses(user_id,answers) VALUES('${CLIENT}',$1)`,[answers(index+3)]);
    await actor(CLIENT);
    expect((await db.query('SELECT * FROM inclusion_pulse_responses')).rows).toHaveLength(0);
    const summary=(await db.query<{result:{total:number;suppressed:boolean;items:unknown[]}}>('SELECT inclusion_pulse_summary() result')).rows[0]?.result;
    expect(summary).toMatchObject({total:3,suppressed:false});
    expect(summary?.items.length).toBe(2);
  });
  it("active client team members receive aggregates but never individual rows", async () => {
    for (let index=0; index<3; index++) await db.query(`INSERT INTO inclusion_pulse_responses(user_id,answers) VALUES('${CLIENT}',$1)`,[answers()]);
    await actor(TEAM,CLIENT);
    expect((await db.query('SELECT * FROM inclusion_pulse_responses')).rows).toHaveLength(0);
    expect((await db.query<{result:{total:number}}>('SELECT inclusion_pulse_summary() result')).rows[0]?.result.total).toBe(3);
  });
  it("staff need client consent for both individual responses and the aggregate summary", async () => {
    await db.exec(`INSERT INTO inclusion_pulse_responses(user_id) VALUES('${CLIENT}')`);
    await actor(STAFF,CLIENT);
    expect((await db.query('SELECT * FROM inclusion_pulse_responses')).rows).toHaveLength(0);
    await expect(db.query('SELECT inclusion_pulse_summary()')).rejects.toThrow();
    await db.exec('RESET ROLE'); await db.exec(`INSERT INTO client_staff_permissions(user_id,sensitive_access) VALUES('${CLIENT}',true)`);
    await actor(STAFF,CLIENT);
    expect((await db.query('SELECT * FROM inclusion_pulse_responses')).rows).toHaveLength(1);
    expect((await db.query('SELECT inclusion_pulse_summary()')).rows).toHaveLength(1);
  });
  it("switching workspaces prevents cross-client results", async () => {
    for (let index=0; index<3; index++) await db.query(`INSERT INTO inclusion_pulse_responses(user_id,answers) VALUES('${DEMO}',$1)`,[answers()]);
    await actor(CLIENT,DEMO);
    await expect(db.query('SELECT inclusion_pulse_summary()')).rejects.toThrow();
    expect((await db.query('SELECT * FROM inclusion_pulse_responses')).rows).toHaveLength(0);
  });
  it("scores and barriers stay suppressed below three responses", async () => {
    for (let index=0; index<2; index++) await db.query(`INSERT INTO inclusion_pulse_responses(user_id,answers) VALUES('${CLIENT}',$1)`,[answers()]);
    await actor(CLIENT);
    const summary=(await db.query<{result:{total:number;suppressed:boolean;items:unknown[];barriers:unknown[]}}>('SELECT inclusion_pulse_summary() result')).rows[0]?.result;
    expect(summary).toMatchObject({total:2,suppressed:true,items:[],barriers:[]});
  });
  it("expired and revoked links reject lookup and submission", async () => {
    for (const [token,expiry,revoked] of [['d'.repeat(48),'-1 day',false],['e'.repeat(48),'14 days',true]] as const) {
      await db.query(`INSERT INTO inclusion_pulse_links(user_id,created_by,token,expires_at,revoked) VALUES($1,'${STAFF}',$2,now()+$3::interval,$4)`,[DEMO,token,expiry,revoked]);
      await db.exec('SET ROLE anon');
      expect((await db.query<{info:unknown}>('SELECT inclusion_pulse_link_info($1) info',[token])).rows[0]?.info).toBeNull();
      expect((await db.query<{done:boolean}>('SELECT submit_inclusion_pulse($1,$2::jsonb) done',[token,answers()])).rows[0]?.done).toBe(false);
      await db.exec('RESET ROLE');
    }
  });
  it("a submitted link remains consumed after staff delete its response", async () => {
    const token='f'.repeat(48);
    await actor(STAFF,DEMO);
    await db.query("INSERT INTO inclusion_pulse_links(user_id,token,expires_at) VALUES($1,$2,now()+interval '14 days')",[DEMO,token]);
    await db.exec('SET ROLE anon');
    expect((await db.query<{done:boolean}>('SELECT submit_inclusion_pulse($1,$2::jsonb) done',[token,answers()])).rows[0]?.done).toBe(true);
    await actor(STAFF,DEMO);
    expect((await db.query('DELETE FROM inclusion_pulse_responses RETURNING id')).rows).toHaveLength(1);
    await db.exec('SET ROLE anon');
    expect((await db.query<{done:boolean}>('SELECT submit_inclusion_pulse($1,$2::jsonb) done',[token,answers()])).rows[0]?.done).toBe(false);
  });
  it("public submission strips identifying extras and rejects invalid ratings", async () => {
    const first='g'.repeat(48), second='h'.repeat(48);
    await actor(STAFF,DEMO);
    await db.query("INSERT INTO inclusion_pulse_links(user_id,token,expires_at) VALUES($1,$2,now()+interval '14 days'),($1,$3,now()+interval '14 days')",[DEMO,first,second]);
    await db.exec('SET ROLE anon');
    await db.query('SELECT submit_inclusion_pulse($1,$2::jsonb)',[first,JSON.stringify({ratings:{belong_accepted:4},name:'Secret Name',open:{comment:'private'}})]);
    await db.exec('RESET ROLE');
    const stored=(await db.query<{answers:Record<string,unknown>}>('SELECT answers FROM inclusion_pulse_responses')).rows[0]?.answers;
    expect(stored).not.toHaveProperty('name');
    expect(stored).not.toHaveProperty('open');
    await db.exec('SET ROLE anon');
    await expect(db.query('SELECT submit_inclusion_pulse($1,$2::jsonb)',[second,JSON.stringify({ratings:{belong_accepted:9}})])).rejects.toThrow();
  });
});
