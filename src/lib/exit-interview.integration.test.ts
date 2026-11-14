// @vitest-environment node
// Executes the real migration in isolated Postgres; never accesses live data.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const TOKEN = "a".repeat(48);

async function asRole(role: string, sql: string, uid = OWNER) {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role}; SET LOCAL request.jwt.claims = '{"sub":"${uid}"}';`);
  try { return await db.query(sql); }
  finally { await db.exec("ROLLBACK;"); }
}

describe("exit interview links and responses", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
      CREATE FUNCTION public.has_role(_user uuid, _role text) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
    `);
    await db.exec(readFileSync("drizzle/migrations/0043_exit_interview_links.sql", "utf8"));
    await db.query(`
      INSERT INTO public.exit_interview_links (user_id, token, employee_label, org_name, expires_at)
      VALUES ('${OWNER}', '${TOKEN}', 'Staff no. 1042', 'Demo (Pty) Ltd', now() + interval '14 days');
    `);
  });
  afterAll(async () => { await db.close(); });

  it("owner creates a link and reads it back", async () => {
    const { rows } = await asRole("authenticated", `SELECT employee_label FROM public.exit_interview_links WHERE token = '${TOKEN}'`);
    expect(rows).toEqual([{ employee_label: "Staff no. 1042" }]);
  });

  it("anonymous visitors cannot read links or responses directly", async () => {
    await expect(asRole("anon", "SELECT * FROM public.exit_interview_links")).rejects.toThrow(/permission denied/);
    await expect(asRole("anon", "SELECT * FROM public.exit_interview_responses")).rejects.toThrow(/permission denied/);
  });

  it("another signed-in user cannot see the owner's links or responses", async () => {
    const links = await asRole("authenticated", "SELECT * FROM public.exit_interview_links", OTHER);
    expect(links.rows).toEqual([]);
    const responses = await asRole("authenticated", "SELECT * FROM public.exit_interview_responses", OTHER);
    expect(responses.rows).toEqual([]);
  });

  it("link info is visible only through the token function", async () => {
    const { rows } = await asRole("anon", `SELECT public.exit_interview_link_info('${TOKEN}') AS info`);
    expect(((rows as Array<{ info: { org_name: string } }>)[0]!.info).org_name).toBe("Demo (Pty) Ltd");
    const bad = await asRole("anon", "SELECT public.exit_interview_link_info('short') AS info");
    expect((bad.rows as Array<{ info: unknown }>)[0]!.info).toBeNull();
  });

  it("a departing employee submits once through the token and the link closes", async () => {
    const ok = await db.query(`SELECT public.submit_exit_interview('${TOKEN}', '{"reasons":["Retirement"]}'::jsonb) AS done`);
    expect((ok.rows as Array<{ done: boolean }>)[0]!.done).toBe(true);
    const again = await asRole("anon", `SELECT public.submit_exit_interview('${TOKEN}', '{}'::jsonb) AS done`);
    expect((again.rows as Array<{ done: boolean }>)[0]!.done).toBe(false);
    const { rows } = await asRole("authenticated", "SELECT answers ->> 'reasons' AS reasons FROM public.exit_interview_responses");
    expect(rows).toEqual([{ reasons: '["Retirement"]' }]);
  });

  it("anonymous visitors cannot insert responses directly", async () => {
    await expect(asRole("anon", "INSERT INTO public.exit_interview_responses (user_id, answers) VALUES ('" + OWNER + "', '{}')")).rejects.toThrow(/permission denied/);
  });
});
