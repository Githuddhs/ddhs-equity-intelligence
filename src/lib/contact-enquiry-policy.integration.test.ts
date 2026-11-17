// @vitest-environment node
// Real anonymous inserts against the live booking policy migration in isolated in-memory Postgres; never touches live data or sends email.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
async function insertAsAnon(message: string) {
  await db.exec("BEGIN; SET LOCAL ROLE anon;");
  try {
    await db.query(
      "INSERT INTO public.contact_enquiries(full_name,email,company,message) VALUES ('Test Person','test@example.com','Test Co',$1)",
      [message],
    );
  } finally {
    await db.exec("ROLLBACK;");
  }
}

describe("booking enquiry insert policy", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
    const create = readFileSync("drizzle/migrations/0000_create_contact_enquiries.sql", "utf8").split("CREATE POLICY")[0] ?? "";
    await db.exec(create);
    await db.exec(`CREATE POLICY "Anyone can submit a valid enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);`);
    await db.exec(readFileSync("drizzle/migrations/0050_allow_short_enquiry_message.sql", "utf8"));
  });
  afterAll(async () => { await db.close(); });

  it("accepts a blank message", async () => { await expect(insertAsAnon("")).resolves.toBeUndefined(); });
  it("accepts a short message", async () => { await expect(insertAsAnon("Hi")).resolves.toBeUndefined(); });
  it("accepts exactly 2000 characters", async () => { await expect(insertAsAnon("x".repeat(2000))).resolves.toBeUndefined(); });
  it("rejects 2001 characters", async () => { await expect(insertAsAnon("x".repeat(2001))).rejects.toThrow(/row-level security/); });
  it("leaves no rows behind", async () => {
    const r = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM public.contact_enquiries");
    expect(r.rows[0]?.n).toBe(0);
  });
});
