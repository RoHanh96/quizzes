import { test, expect } from "@playwright/test";
import { E2E_SHARE_ADVANCED } from "./constants";

test.describe("Task 003 — advanced play / lưới ảnh (E3-§2–3)", () => {
  test("E3-01: có lưới ảnh và ô câu 1 covered trước khi trả lời", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED}`);
    await expect(
      page.getByRole("heading", { name: "E2E Crossword Advanced" })
    ).toBeVisible();
    await expect(page.getByTestId("advanced-image-grid")).toBeVisible();
    await expect(page.getByTestId("advanced-cell-1")).toHaveAttribute(
      "data-state",
      "covered"
    );
    // Hồi quy fix-bug 2026-04-15: ô covered không render slice ảnh (không lộ pixel §3.1).
    await expect(
      page.getByTestId("advanced-cell-1").locator("[style*='background-image']")
    ).toHaveCount(0);
    await expect(
      page.getByTestId("advanced-cell-2").locator("[style*='background-image']")
    ).toHaveCount(0);
  });

  test("E3-02: trả lời đúng câu 1 → chỉ ô số 1 revealed, ô 2 vẫn covered", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED}`);
    await page.getByTestId("crossword-question-1").click();
    const answerBox = page.getByRole("textbox", { name: "Đáp án câu 1" });
    await answerBox.waitFor({ state: "visible", timeout: 15_000 });
    await answerBox.fill("ONE");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(page.getByTestId("advanced-cell-1")).toHaveAttribute(
      "data-state",
      "revealed"
    );
    await expect(page.getByTestId("advanced-cell-2")).toHaveAttribute(
      "data-state",
      "covered"
    );
    await expect(
      page.getByTestId("advanced-cell-1").locator("[style*='background-image']")
    ).toHaveCount(1);
    await expect(
      page.getByTestId("advanced-cell-2").locator("[style*='background-image']")
    ).toHaveCount(0);
  });

  test("E3-§3.3: sai đáp án hàng ngang → báo lỗi → nhập lại đúng được", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED}`);
    await page.getByTestId("crossword-question-1").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("BAD");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(
      page.getByText("Đáp án không chính xác, vui lòng thử lại!")
    ).toBeVisible();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("ONE");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toHaveCount(0);
    await expect(page.getByTestId("advanced-cell-1")).toHaveAttribute(
      "data-state",
      "revealed"
    );
  });

  test("E3-04 (+ E3-FIX-03): N=3 — lưới 1×3 không ô đệm; sau 3 câu đúng có đủ 3 tile ảnh", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED}`);
    const grid = page.getByTestId("advanced-image-grid");

    await expect(grid.locator('[data-testid^="advanced-pad-"]')).toHaveCount(0);

    for (const { order, answer } of [
      { order: 1, answer: "ONE" },
      { order: 2, answer: "TWO" },
      { order: 3, answer: "THREE" },
    ] as const) {
      await page.getByTestId(`crossword-question-${order}`).click();
      const answerBox = page.getByRole("textbox", {
        name: `Đáp án câu ${order}`,
      });
      await answerBox.waitFor({ state: "visible", timeout: 15_000 });
      await answerBox.fill(answer);
      await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    }

    await expect(grid.locator("[style*='background-image']")).toHaveCount(3);
  });
});
