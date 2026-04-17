import type { McDifficulty } from "../validation/multiple-choice-questions";

export const MC_BUCKET_ORDER: McDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "extreme",
];

export type McBankRow = {
  id: string;
  question: string;
  /** Canonical four strings (slot A–D). */
  options: [string, string, string, string];
  /** 0..3 index into canonical options. */
  answer: number;
  difficulty: McDifficulty;
};

export type McPublicQuestion = {
  question: string;
  options: string[];
};

export type McBuiltSession = {
  playLength: number;
  items: McPublicQuestion[];
  /** Parallel to items — not sent to client. */
  correctDisplayIndices: number[];
};

/** Largest remainder (Hamilton) for L < 13; fixed bands for L ≥ 13. */
export function computeBucketCounts(L: number): {
  easy: number;
  medium: number;
  hard: number;
  extreme: number;
} {
  if (!Number.isInteger(L) || L < 1) {
    throw new Error("playLength must be a positive integer");
  }
  if (L >= 13) {
    return { easy: 4, medium: 4, hard: 4, extreme: L - 12 };
  }
  const weights = [4, 4, 4, 1] as const;
  const W = 13;
  const raw = weights.map((w) => (L * w) / W);
  const floors = raw.map((x) => Math.floor(x));
  const counts = [...floors] as [number, number, number, number];
  let remainder = L - floors.reduce((a, b) => a + b, 0);
  const orderIdx = [0, 1, 2, 3].sort((a, b) => {
    const fa = raw[a] - floors[a];
    const fb = raw[b] - floors[b];
    if (fb !== fa) return fb - fa;
    return a - b;
  });
  for (let k = 0; k < remainder; k++) {
    counts[orderIdx[k]!] += 1;
  }
  return {
    easy: counts[0]!,
    medium: counts[1]!,
    hard: counts[2]!,
    extreme: counts[3]!,
  };
}

/** 1-based position → bucket difficulty. */
export function difficultyForPosition(
  positionOneBased: number,
  counts: ReturnType<typeof computeBucketCounts>
): McDifficulty {
  if (positionOneBased <= counts.easy) return "easy";
  if (positionOneBased <= counts.easy + counts.medium) return "medium";
  if (
    positionOneBased <=
    counts.easy + counts.medium + counts.hard
  ) {
    return "hard";
  }
  return "extreme";
}

export function hashSeedToUint32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed: string): () => number {
  let a = hashSeedToUint32(seed);
  if (a === 0) a = 0x9e3779b9;
  return function mulberry32() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleOptions(
  canonicalFour: [string, string, string, string],
  correctIndex: number,
  rng: () => number
): { displayOptions: string[]; correctDisplayIndex: number } {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const displayOptions = order.map((ix) => canonicalFour[ix]!);
  const correctDisplayIndex = order.indexOf(correctIndex);
  return { displayOptions, correctDisplayIndex };
}

function pickQuestionForBucket(
  bank: McBankRow[],
  difficulty: McDifficulty,
  usedIds: Set<string>,
  rng: () => number
): McBankRow {
  let pool = bank.filter((q) => q.difficulty === difficulty);
  /** Spec: không bắt buộc đủ pool — nếu bucket trống thì lấy từ toàn bộ ngân hàng. */
  if (pool.length === 0) {
    pool = [...bank];
  }
  if (pool.length === 0) {
    throw new Error("No questions in bank");
  }
  const available = pool.filter((q) => !usedIds.has(q.id));
  const source = available.length > 0 ? available : pool;
  const pick = source[Math.floor(rng() * source.length)]!;
  if (available.length > 0) {
    usedIds.add(pick.id);
  }
  return pick;
}

/**
 * @param seedKey — stable string (e.g. shareLink + ":" + sessionSeed) so GET/POST can recompute the same session.
 */
export function buildMultipleChoiceSession(
  playLength: number,
  bank: McBankRow[],
  seedKey: string
): McBuiltSession {
  const rng = createSeededRng(seedKey);
  const counts = computeBucketCounts(playLength);
  const usedIds = new Set<string>();
  const picks: McBankRow[] = [];
  for (let pos = 1; pos <= playLength; pos++) {
    const diff = difficultyForPosition(pos, counts);
    picks.push(pickQuestionForBucket(bank, diff, usedIds, rng));
  }

  const items: McPublicQuestion[] = [];
  const correctDisplayIndices: number[] = [];
  for (const row of picks) {
    const { displayOptions, correctDisplayIndex } = shuffleOptions(
      row.options,
      row.answer,
      rng
    );
    items.push({ question: row.question, options: displayOptions });
    correctDisplayIndices.push(correctDisplayIndex);
  }

  return { playLength, items, correctDisplayIndices };
}

export function evaluateMcRound(
  playLength: number,
  bank: McBankRow[],
  seedKey: string,
  roundIndex: number,
  selectedIndex: number
): {
  correctDisplayIndex: number;
  isCorrect: boolean;
  gameOver: boolean;
  won: boolean;
} {
  if (
    !Number.isInteger(roundIndex) ||
    roundIndex < 0 ||
    roundIndex >= playLength
  ) {
    throw new Error("Invalid roundIndex");
  }
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) {
    throw new Error("Invalid selectedIndex");
  }
  const built = buildMultipleChoiceSession(playLength, bank, seedKey);
  const correctDisplayIndex = built.correctDisplayIndices[roundIndex]!;
  const isCorrect = selectedIndex === correctDisplayIndex;
  const isLast = roundIndex === built.items.length - 1;
  return {
    correctDisplayIndex,
    isCorrect,
    gameOver: !isCorrect,
    won: isCorrect && isLast,
  };
}
