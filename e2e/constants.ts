/** Share link seed trong `e2e/global-setup.ts` — import từ spec, không import `global-setup.ts` (tránh bundle Prisma vào test). */

/** Quiz HI/HAND/AIR — dùng cho `crossword-basic.spec.ts` (có test POST từ khóa). */
export const E2E_SHARE_BASIC = "e2e-share-basic";

/** Clone HI — chỉ dùng test sai từ khóa (không POST đúng trong suite). */
export const E2E_SHARE_WRONG = "e2e-share-wrong";

/** Clone HI — hai context spectator (A sai, B đúng). */
export const E2E_SHARE_SPECTATOR = "e2e-share-spectator";

/** Đáp án có space trong hàng ngang. */
export const E2E_SHARE_SPACE = "e2e-share-space";

/** Từ khóa có dấu / khoảng trắng (chuẩn hóa). */
export const E2E_SHARE_ACCENT = "e2e-share-accent";

/** ASCII từ khóa ngắn. */
export const E2E_SHARE_EN = "e2e-share-en";

/** Từ khóa BANANA (6 câu). */
export const E2E_SHARE_BANANA = "e2e-share-banana";

/** Crossword advanced — lưới ảnh + seed cố định (`global-setup`). */
export const E2E_SHARE_ADVANCED = "e2e-share-advanced";

/** Advanced — chỉ dùng test POST đoán đúng từ khóa (ghi `CrosswordPublicKeywordSolve`). */
export const E2E_SHARE_ADVANCED_KEYWORD = "e2e-share-advanced-keyword";

/** Advanced — chỉ test sai từ khóa (không POST đúng trong suite). */
export const E2E_SHARE_ADVANCED_WRONG = "e2e-share-advanced-wrong";

/** Advanced — hai context spectator (A sai, B đúng từ khóa). */
export const E2E_SHARE_ADVANCED_SPECTATOR = "e2e-share-advanced-spectator";

/** Multiple choice — task-004 (`global-setup`). */
export const E2E_SHARE_MC = "e2e-share-mc";
