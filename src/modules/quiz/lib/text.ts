/** Bỏ dấu kết hợp (Unicode NFD) */
export function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Từ khóa: bỏ dấu, bỏ mọi khoảng trắng, in hoa — dùng để đếm N và so khớp ký tự */
export function normalizeKeyword(input: string): string {
  return stripDiacritics(input).replace(/\s+/g, "").toUpperCase();
}

/** Các ký tự non-space theo thứ tự trong `source` (giữ dấu, giữ hoa/thường) — hiển thị từ khóa đã lộ trên dải ô. */
export function keywordLettersPreserveSource(source: string): string[] {
  const out: string[] = [];
  for (const ch of source) {
    if (!/\s/.test(ch)) out.push(ch);
  }
  return out;
}

/** So khớp hai đáp án đầy đủ (bỏ dấu, bỏ space, không phân biệt hoa thường) */
export function answersMatch(expected: string, userInput: string): boolean {
  return normalizeKeyword(expected) === normalizeKeyword(userInput);
}

/** Ký tự hiển thị trong từng ô hàng ngang: bỏ mọi khoảng trắng (đồng bộ đếm ô + gợi ý §3.1). */
export function answerLettersStripSpaces(answer: string): string {
  return [...answer].filter((c) => !/\s/.test(c)).join("");
}

/** Số chữ (ô) hiển thị / gợi ý bên câu hỏi — không tính space. */
export function answerLetterCountDisplay(answer: string): number {
  return answerLettersStripSpaces(answer).length;
}
