import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Task 002 — admin play back (E-§3.4)", () => {
  test("E-§3.4-01: /quizzes/[id] — một liên kết quay lại danh sách", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/quizzes");
    await page
      .locator(".border.rounded-lg")
      .filter({ hasText: "E2E Crossword Basic" })
      .getByRole("link", { name: "Chơi (admin)" })
      .click();

    await expect(page.getByRole("heading", { name: "E2E Crossword Basic" })).toBeVisible();
    const backLinks = page.getByRole("link", { name: "Quay lại danh sách" });
    await expect(backLinks).toHaveCount(1);
  });
});
