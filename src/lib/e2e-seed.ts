import type { Prisma } from "@prisma/client";

/** User tạo quiz seed trong `e2e/global-setup.ts` — trùng email trong setup. */
export const E2E_SEED_USER_EMAIL = "e2e-seed@example.com" as const;

/** Prefix `shareLink` của mọi bài seed Playwright (`e2e/constants.ts`). */
export const E2E_SHARE_LINK_PREFIX = "e2e-share-" as const;

/**
 * Loại quiz seed E2E khỏi danh sách dashboard (admin `/` và `/quizzes`).
 * Dùng khi dev.db còn bản ghi test hoặc khi DB dev/e2e dùng chung nhầm.
 * Playwright bật `SHOW_E2E_SEED_IN_DASHBOARD_LIST=1` trên `next start` để spec vẫn thấy thẻ seed.
 */
export const whereQuizExcludingE2eSeed: Prisma.QuizWhereInput = {
  NOT: {
    OR: [
      { creator: { email: E2E_SEED_USER_EMAIL } },
      { shareLink: { startsWith: E2E_SHARE_LINK_PREFIX } },
    ],
  },
};
