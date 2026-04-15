/** Bỏ dấu kết hợp (Unicode NFD) */
export function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Từ khóa: bỏ dấu, bỏ mọi khoảng trắng, in hoa — dùng để đếm N và so khớp ký tự */
export function normalizeKeyword(input: string): string {
  return stripDiacritics(input).replace(/\s+/g, "").toUpperCase();
}

/** So khớp hai đáp án đầy đủ (bỏ dấu, bỏ space, không phân biệt hoa thường) */
export function answersMatch(expected: string, userInput: string): boolean {
  return normalizeKeyword(expected) === normalizeKeyword(userInput);
}
