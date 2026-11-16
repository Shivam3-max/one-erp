import { describe, it, expect } from "vitest";
import { LIFECYCLE, stageIndex, STAGE_META } from "@/lib/lifecycle";

describe("lifecycle", () => {
  it("orders are unique and contiguous from 0", () => {
    const orders = LIFECYCLE.map((s) => s.order).sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    orders.forEach((o, i) => expect(o).toBe(i));
  });

  it("stageIndex returns the stage order", () => {
    expect(stageIndex("lead")).toBe(0);
    expect(stageIndex("manufacturing")).toBe(STAGE_META["manufacturing"].order);
    expect(stageIndex("manufacturing")).toBeGreaterThan(stageIndex("quotation"));
  });

  it("every stage has a STAGE_META entry", () => {
    for (const s of LIFECYCLE) {
      expect(STAGE_META[s.key]).toBeDefined();
      expect(STAGE_META[s.key].label).toBe(s.label);
    }
  });
});
