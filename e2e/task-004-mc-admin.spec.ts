import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Task 004 — MC admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("T004-admin-01: tạo quiz multiple choice + playLength — lưu thành công", async ({
    page,
  }) => {
    await page.goto("/quizzes/create");
    await expect(page.locator("#type")).toHaveValue("multiple_choice");
    await page.locator("#title").fill("E2E T004 MC create");
    await page.locator("#playLength").fill("1");

    const block = page.locator("div.border.rounded-lg.p-4").first();
    await block.locator('input[type="text"]').first().fill("Câu hỏi E2E?");
    await block.locator("input").nth(1).fill("Một");
    await block.locator("input").nth(2).fill("Hai");
    await block.locator("input").nth(3).fill("Ba");
    await block.locator("input").nth(4).fill("Bốn");

    await page.getByRole("button", { name: "Tạo Quiz" }).click();
    await expect(page).toHaveURL(/\/quizzes$/);
    await expect(
      page.getByRole("heading", { name: "E2E T004 MC create" }).first()
    ).toBeVisible();
  });
});
