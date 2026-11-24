import { describe, expect, it } from "vitest";
import { DEFAULT_DUTIES, DEFAULT_FLOW, mergeConfig } from "./ee-workflow";

describe("workflow config", () => {
  it("falls back to defaults when nothing is saved", () => {
    expect(mergeConfig(null).flow).toEqual(DEFAULT_FLOW);
  });
  it("keeps a saved handoff and ignores invalid roles", () => {
    const c = mergeConfig({ flow: [{ decide: [3, 99], handoff: [2, 4, "Data pack"] }], duties: [["", "Edited"]] });
    expect(c.flow[0]).toEqual({ decide: [3], handoff: [2, 4, "Data pack"] });
    expect(c.duties[0]?.[1]).toBe("Edited");
    expect(c.duties[0]?.[0]).toBe(DEFAULT_DUTIES[0]?.[0]);
  });
});
