import { describe, expect, it } from "vitest";
import {
  buildAdvancedCellLabels,
  computeRC,
  mulberry32,
} from "./crossword-advanced-grid";

describe("computeRC", () => {
  it("uses R×C = N and prefers near-square (then smaller R)", () => {
    expect(computeRC(1)).toEqual({ R: 1, C: 1 });
    expect(computeRC(2)).toEqual({ R: 1, C: 2 });
    expect(computeRC(3)).toEqual({ R: 1, C: 3 });
    expect(computeRC(4)).toEqual({ R: 2, C: 2 });
    expect(computeRC(5)).toEqual({ R: 1, C: 5 });
    expect(computeRC(6)).toEqual({ R: 2, C: 3 });
    expect(computeRC(7)).toEqual({ R: 1, C: 7 });
    expect(computeRC(8)).toEqual({ R: 2, C: 4 });
    expect(computeRC(9)).toEqual({ R: 3, C: 3 });
    expect(computeRC(12)).toEqual({ R: 3, C: 4 });
  });
});

describe("buildAdvancedCellLabels", () => {
  it("is deterministic for same N and seed", () => {
    const a = buildAdvancedCellLabels(4, 42_424_242);
    const b = buildAdvancedCellLabels(4, 42_424_242);
    expect(a).toEqual(b);
  });

  it("places labels 1..N on exactly N cells", () => {
    const cells = buildAdvancedCellLabels(5, 99_001);
    const labels = cells.map((c) => c.label).filter((l): l is number => l != null);
    expect(labels.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(cells.length).toBe(computeRC(5).R * computeRC(5).C);
  });

  it("mulberry32 stays in [0,1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
