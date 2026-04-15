/**
 * Lưới gợi ý ảnh crossword advanced (task-003).
 * Cùng seed + N → cùng layout (deterministic cho CI / E2E).
 */

export type AdvancedCellLabel = {
  flatIndex: number;
  /** 1…N theo thứ tự câu (`order`), null = ô đệm */
  label: number | null;
};

/** PRNG [0, 1) — Mulberry32 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIndices(length: number, rand: () => number): number[] {
  const a = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/**
 * Chọn **R×C = N** (lưới phủ kín ảnh, không ô đệm): trong các cặp ước số (R,C) của N,
 * ưu tiên **|R−C|** nhỏ nhất (gần vuông); hòa thì ưu **R** nhỏ hơn (thường hợp ảnh ngang).
 */
export function computeRC(n: number): { R: number; C: number } {
  if (n < 1) {
    throw new Error("N phải >= 1");
  }
  let bestR = 1;
  let bestC = n;
  let bestDiff = Infinity;
  for (let R = 1; R <= n; R++) {
    if (n % R !== 0) continue;
    const C = n / R;
    const diff = Math.abs(R - C);
    if (diff < bestDiff || (diff === bestDiff && R < bestR)) {
      bestDiff = diff;
      bestR = R;
      bestC = C;
    }
  }
  return { R: bestR, C: bestC };
}

/**
 * N = số câu. Với **R×C = N**, gán nhãn 1…N lên **tất cả** ô (mỗi ô đúng một nhãn, vị trí shuffle).
 */
export function buildAdvancedCellLabels(n: number, seed: number): AdvancedCellLabel[] {
  const { R, C } = computeRC(n);
  const rc = R * C;
  const rand = mulberry32(seed);
  const order = shuffleIndices(rc, rand);
  const chosen = order.slice(0, n);
  const labelByFlat = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    labelByFlat.set(chosen[i]!, i + 1);
  }
  const out: AdvancedCellLabel[] = [];
  for (let flat = 0; flat < rc; flat++) {
    out.push({ flatIndex: flat, label: labelByFlat.get(flat) ?? null });
  }
  return out;
}

export function flatToRC(flat: number, C: number): { r: number; c: number } {
  return { r: Math.floor(flat / C), c: flat % C };
}

/** Fallback nếu DB thiếu seed (không nên xảy ra sau migration task-003). */
export function effectiveAdvancedSeed(quiz: {
  id: string;
  advancedLayoutSeed: number | null;
}): number {
  if (quiz.advancedLayoutSeed != null) {
    return quiz.advancedLayoutSeed >>> 0;
  }
  let h = 2166136261;
  for (let i = 0; i < quiz.id.length; i++) {
    h ^= quiz.id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function backgroundPositionPercent(
  r: number,
  c: number,
  R: number,
  C: number
): { x: string; y: string } {
  const x =
    C <= 1 ? "50%" : `${(c / (C - 1)) * 100}%`;
  const y =
    R <= 1 ? "50%" : `${(r / (R - 1)) * 100}%`;
  return { x, y };
}
