import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { E2E_SHARE_BANANA } from "./constants";

test.describe("Task 002 — form admin (E-§2)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("E-§2-01: số câu ≠ N — lỗi inline, không chuyển trang", async ({ page }) => {
    await page.goto("/quizzes/create");
    await page.locator("#type").selectOption("crossword_basic");
    await page.locator("#title").fill("E2E §2-01 invalid count");
    await page.locator("#verticalWord").fill("HI");
    const q1 = page.locator("div.border.rounded-lg.p-4").filter({ hasText: "Câu hỏi #1" });
    await q1.locator("input").first().fill("Câu 1");
    await q1.locator("input").nth(1).fill("HAND");
    await page.getByRole("button", { name: "Tạo Quiz" }).click();
    await expect(page.getByText(/cần đúng 2 câu hỏi/i)).toBeVisible();
    await expect(page).toHaveURL(/\/quizzes\/create/);
  });

  test("E-§2-02: đáp án thiếu ký tự slot — thông báo đúng câu", async ({ page }) => {
    await page.goto("/quizzes/create");
    await page.locator("#type").selectOption("crossword_basic");
    await page.locator("#title").fill("E2E §2-02 slot");
    await page.locator("#verticalWord").fill("HI");
    await page.getByRole("button", { name: "+ Thêm câu hỏi" }).click();

    const q1 = page.locator("div.border.rounded-lg.p-4").filter({ hasText: "Câu hỏi #1" });
    const q2 = page.locator("div.border.rounded-lg.p-4").filter({ hasText: "Câu hỏi #2" });
    await q1.locator("input").first().fill("Q1");
    await q1.locator("input").nth(1).fill("HAND");
    await q2.locator("input").first().fill("Q2");
    await q2.locator("input").nth(1).fill("XYZ");

    await expect(
      page.getByRole("alert").filter({ hasText: /chứa ký tự "I"/ })
    ).toBeVisible();
    await page.getByRole("button", { name: "Tạo Quiz" }).click();
    await expect(
      page.locator(".bg-red-50").filter({ hasText: /Câu 2:.*chứa ký tự "I"/ })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/quizzes\/create/);
  });

  test("E-§2-03: BANANA — 6 ô từ khóa + có thể mở hàng đầu", async ({ page }) => {
    await page.goto(`/play/${E2E_SHARE_BANANA}`);
    await expect(page.getByRole("heading", { name: "E2E Banana" })).toBeVisible();
    await expect(page.getByText(/Từ khóa — 6 ký tự/)).toBeVisible();
    const stripCells = page.locator('[data-testid="keyword-strip"] > div');
    await expect(stripCells).toHaveCount(6);
    await page.getByText("Câu 1:").click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toBeVisible();
  });

  test("E-§2-04: basic khi sửa — không có ô nhập letterIndex tay", async ({ page }) => {
    await page.goto("/quizzes");
    await page
      .locator(".border.rounded-lg")
      .filter({ hasText: "E2E Crossword Basic" })
      .getByRole("link", { name: "Chỉnh sửa" })
      .click();
    await expect(page.getByRole("heading", { name: "Chỉnh sửa Quiz" })).toBeVisible();
    await expect(page.getByText("Vị trí chữ cái đóng góp")).toHaveCount(0);
    await expect(page.locator('input[type="number"]')).toHaveCount(0);
  });
});
