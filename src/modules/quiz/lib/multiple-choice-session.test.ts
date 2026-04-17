import { describe, expect, it } from "vitest";
import {
  buildMultipleChoiceSession,
  computeBucketCounts,
  difficultyForPosition,
  evaluateMcRound,
  type McBankRow,
} from "./multiple-choice-session";

describe("computeBucketCounts", () => {
  it("L=8 matches Hamilton 3+2+2+1", () => {
    expect(computeBucketCounts(8)).toEqual({
      easy: 3,
      medium: 2,
      hard: 2,
      extreme: 1,
    });
  });

  it("L=13 is 4+4+4+1", () => {
    expect(computeBucketCounts(13)).toEqual({
      easy: 4,
      medium: 4,
      hard: 4,
      extreme: 1,
    });
  });

  it("L=20 extends extreme only", () => {
    expect(computeBucketCounts(20)).toEqual({
      easy: 4,
      medium: 4,
      hard: 4,
      extreme: 8,
    });
  });

  it("L=1 assigns one bucket via remainder", () => {
    const c = computeBucketCounts(1);
    expect(c.easy + c.medium + c.hard + c.extreme).toBe(1);
  });
});

describe("difficultyForPosition", () => {
  it("maps positions for L=8", () => {
    const c = computeBucketCounts(8);
    expect(difficultyForPosition(1, c)).toBe("easy");
    expect(difficultyForPosition(3, c)).toBe("easy");
    expect(difficultyForPosition(4, c)).toBe("medium");
    expect(difficultyForPosition(8, c)).toBe("extreme");
  });
});

function bankFixture(): McBankRow[] {
  const mk = (
    id: string,
    d: McBankRow["difficulty"],
    letter: string
  ): McBankRow => ({
    id,
    question: `Q-${id}`,
    options: [`${letter}0`, `${letter}1`, `${letter}2`, `${letter}3`],
    answer: 0,
    difficulty: d,
  });
  return [
    mk("e1", "easy", "E"),
    mk("e2", "easy", "F"),
    mk("m1", "medium", "M"),
    mk("m2", "medium", "N"),
    mk("h1", "hard", "H"),
    mk("h2", "hard", "I"),
    mk("x1", "extreme", "X"),
    mk("x2", "extreme", "Y"),
  ];
}

describe("buildMultipleChoiceSession", () => {
  it("is deterministic for same seedKey", () => {
    const b = bankFixture();
    const a = buildMultipleChoiceSession(4, b, "seed-a");
    const b2 = buildMultipleChoiceSession(4, b, "seed-a");
    expect(a.items).toEqual(b2.items);
    expect(a.correctDisplayIndices).toEqual(b2.correctDisplayIndices);
  });

  it("allows repeat when pool exhausted (single easy)", () => {
    const oneEasy: McBankRow[] = [
      {
        id: "only",
        question: "Lonely",
        options: ["a", "b", "c", "d"],
        answer: 2,
        difficulty: "easy",
      },
    ];
    const s = buildMultipleChoiceSession(3, oneEasy, "repeat-seed");
    expect(s.items).toHaveLength(3);
  });
});

describe("evaluateMcRound", () => {
  it("detects wrong answer", () => {
    const b = bankFixture();
    const key = "eval-seed-1";
    const built = buildMultipleChoiceSession(2, b, key);
    const wrong = (built.correctDisplayIndices[0]! + 1) % 4;
    const r = evaluateMcRound(2, b, key, 0, wrong);
    expect(r.isCorrect).toBe(false);
    expect(r.gameOver).toBe(true);
    expect(r.won).toBe(false);
  });

  it("detects win on last question", () => {
    const one: McBankRow[] = [
      {
        id: "a",
        question: "Only",
        options: ["a", "b", "c", "d"],
        answer: 1,
        difficulty: "easy",
      },
    ];
    const key = "win-seed";
    const built = buildMultipleChoiceSession(1, one, key);
    const good = built.correctDisplayIndices[0]!;
    const r = evaluateMcRound(1, one, key, 0, good);
    expect(r.isCorrect).toBe(true);
    expect(r.gameOver).toBe(false);
    expect(r.won).toBe(true);
  });
});
