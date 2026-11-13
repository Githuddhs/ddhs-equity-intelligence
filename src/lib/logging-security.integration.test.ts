// @vitest-environment node
// Executes the real migration in isolated Postgres; never accesses live data.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
async function asRole(role: string, sql: string) {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
  try { return await db.exec(sql); }
  finally { await db.exec("ROLLBACK;"); }
}

describe("selected logging permission fixes", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE public.ai_usage (id uuid DEFAULT gen_random_uuid(), user_id uuid, feature text NOT NULL, model text NOT NULL, created_at timestamptz DEFAULT now());
      CREATE TABLE public.site_events (id uuid DEFAULT gen_random_uuid(), event text NOT NULL, path text NOT NULL DEFAULT '', detail text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
      GRANT INSERT ON public.ai_usage, public.site_events TO anon, authenticated;
      GRANT SELECT ON public.ai_usage, public.site_events TO authenticated;
      GRANT ALL ON public.ai_usage, public.site_events TO service_role;
      ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Anyone can log AI usage" ON public.ai_usage FOR INSERT TO anon, authenticated WITH CHECK (true);
      CREATE POLICY "Anyone can record events" ON public.site_events FOR INSERT TO anon, authenticated WITH CHECK (true);
      CREATE POLICY "Admins read AI usage" ON public.ai_usage FOR SELECT TO authenticated USING (false);
      CREATE POLICY "Staff read events" ON public.site_events FOR SELECT TO authenticated USING (false);
    `);
    await db.exec(readFileSync("drizzle/migrations/0042_restrict_selected_logging_inserts.sql", "utf8"));
  });
  afterAll(async () => { await db.close(); });

  it.each(["anon", "authenticated"])("%s can record each supported public event", async (role) => {
    for (const event of ["visit", "tour_complete", "assessment_download", "demo_request", "app_install", "readiness_check"]) {
      await expect(asRole(role, `INSERT INTO public.site_events(event,path,detail) VALUES ('${event}','/readiness-check','50%');`)).resolves.toBeDefined();
    }
  });

  it.each([
    "('invented','/','')",
    "('visit','https://example.test','')",
    "('visit','','')",
    "('visit',repeat('/',201),'')",
    "('visit','/',repeat('x',201))",
    "('visit',E'/bad\\npath','')",
    "('visit','/',E'bad\\ndetail')",
  ])("rejects invalid event input %s", async (values) => {
    await expect(asRole("anon", `INSERT INTO public.site_events(event,path,detail) VALUES ${values};`)).rejects.toThrow();
  });

  it.each(["anon", "authenticated"])("%s cannot forge generated event fields or AI usage", async (role) => {
    await expect(asRole(role, "INSERT INTO public.site_events(event,path,created_at) VALUES ('visit','/','2000-01-01');")).rejects.toThrow(/permission denied/);
    await expect(asRole(role, "INSERT INTO public.site_events(id,event,path) VALUES (gen_random_uuid(),'visit','/');")).rejects.toThrow(/permission denied/);
    await expect(asRole(role, "INSERT INTO public.ai_usage(feature,model) VALUES ('fake','fake');")).rejects.toThrow(/permission denied/);
  });

  it("preserves server-side AI logging and existing read policies", async () => {
    await expect(asRole("service_role", "INSERT INTO public.ai_usage(feature,model) VALUES ('eea12_insights','model');")).resolves.toBeDefined();
    const policies = await db.query<{ policyname: string }>("SELECT policyname FROM pg_policies WHERE cmd='SELECT' AND tablename IN ('ai_usage','site_events') ORDER BY policyname");
    expect(policies.rows.map((p) => p.policyname)).toEqual(["Admins read AI usage", "Staff read events"]);
  });
});