import { describe, expect, it } from "vitest";
import { CULTURE_SURVEY_PACKAGES as P, CULTURE_SUBSCRIPTIONS as S, CULTURE_SURVEY_FROM, zar } from "./culture-survey-pricing";

describe("culture survey packages (excl. VAT)", () => {
  it.each([
    [0, 100, 35000], [1, 300, 55000], [2, 750, 95000], [3, 1500, 125000],
  ])("package %i covers up to %i employees for R%i", (i, max, fee) => {
    expect(P[i]).toMatchObject({ maxEmployees: max, fee });
  });
  it("enterprise starts from R175,000", () => expect(P[4]).toMatchObject({ fee: 175000, from: true }));
  it("advertises surveys from R35,000", () => expect(zar(CULTURE_SURVEY_FROM)).toBe("R35,000"));
});

describe("culture subscriptions", () => {
  it.each([[0, 12500, 150000], [1, 18500, 222000], [2, 25000, 300000]])("tier %i is R%i/month, R%i/year", (i, m, a) => {
    expect(S[i]).toMatchObject({ monthly: m, annual: a });
  });
});
