import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Task 003 — admin tạo advanced (E3-§2.1–2.2)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  async function gotoAdvancedCreateWithBasics(page: Page) {
    await page.goto("/quizzes/create");
    await page.locator("#type").selectOption("crossword_advanced");
    await page.locator("#title").fill("E2E Advanced §2 admin");
    await page.locator("#secretWord").fill("XYZ");
    const q1 = page
      .locator("div.border.rounded-lg.p-4")
      .filter({ hasText: "Câu hỏi #1" });
    await q1.locator("input").first().fill("Câu 1 e2e");
    await q1.locator("input").nth(1).fill("ONE");
  }

  test("E3-§2.1: advanced thiếu ảnh (không URL, không file) → lỗi, không rời create", async ({
    page,
  }) => {
    await gotoAdvancedCreateWithBasics(page);
    await page.getByRole("button", { name: "Tạo Quiz" }).click();
    await expect(page.locator(".bg-red-50")).toContainText(
      /Crossword advanced cần URL hình ảnh/
    );
    await expect(page).toHaveURL(/\/quizzes\/create/);
  });

  test("E3-§2.2: advanced upload ảnh dưới 500 KB → báo lỗi, không rời create", async ({
    page,
  }) => {
    await gotoAdvancedCreateWithBasics(page);
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
      name: "tiny-e2e.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024, 0x2f),
    });
    await page.getByRole("button", { name: "Tạo Quiz" }).click();
    await expect(page.locator(".bg-red-50")).toContainText(
      /Ảnh gợi ý phải từ 500 KB trở lên/
    );
    await expect(page).toHaveURL(/\/quizzes\/create/);
  });
});
