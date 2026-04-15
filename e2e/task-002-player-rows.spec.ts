import { test, expect } from "@playwright/test";
import { E2E_SHARE_SPACE } from "./constants";

test.describe("Task 002 — hàng ngang (E-§3.1)", () => {
  test("E-§3.1-01: click hàng → (N chữ) khớp số ô không space", async ({ page }) => {
    await page.goto(`/play/${E2E_SHARE_SPACE}`);
    await page.getByText("Câu 1:").click();
    await expect(page.getByText("(2 chữ)")).toBeVisible();
    await page.getByText("Câu 2:").click();
    await expect(page.getByText("(3 chữ)")).toBeVisible();
  });

  test("E-§3.1-02: sai rồi đúng một câu", async ({ page }) => {
    await page.goto(`/play/${E2E_SHARE_SPACE}`);
    await page.getByText("Câu 1:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("bad");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(
      page.getByText("Đáp án không chính xác, vui lòng thử lại!")
    ).toBeVisible();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("A H");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toHaveCount(0);
  });

  test("E-§3.1-03: căn cột từ khóa — tùy chọn (E2E_LAYOUT=1)", async ({ page }) => {
    test.skip(
      process.env.E2E_LAYOUT !== "1",
      "Đặt E2E_LAYOUT=1 để chạy assert layout tùy chọn (screenshot baseline có thể bổ sung sau)."
    );
    await page.goto(`/play/${E2E_SHARE_SPACE}`);
    await expect(
      page.locator('[style*="margin-left"]').filter({ has: page.locator(".w-8.h-8") })
    ).not.toHaveCount(0);
  });
});
