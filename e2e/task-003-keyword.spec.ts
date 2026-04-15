import { test, expect } from "@playwright/test";
import {
  E2E_SHARE_ADVANCED,
  E2E_SHARE_ADVANCED_KEYWORD,
  E2E_SHARE_ADVANCED_SPECTATOR,
  E2E_SHARE_ADVANCED_WRONG,
} from "./constants";

test.describe("Task 003 — từ khóa advanced (E3-§4, parity basic)", () => {
  test("E3-03: dải từ khóa + mở modal có checkbox và ô nhập", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED}`);
    const strip = page.getByTestId("keyword-strip-advanced");
    await strip.scrollIntoViewIfNeeded();
    await expect(strip).toBeVisible();
    await strip.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trả lời từ khóa" })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Nhập từ khóa đầy đủ…")).toBeVisible();
  });

  test("E3-§4.1: đoán đúng từ khóa (chuẩn hóa khoảng trắng) → strip lộ ABC + thông báo thắng", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ADVANCED_KEYWORD}`);
    await page
      .getByTestId("keyword-strip-advanced")
      .getByRole("button", { name: "Trả lời từ khóa" })
      .click();
    await page
      .getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
      .check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("  a b c  ");
    await page.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(
      page.getByText(/Từ khóa bí ẩn — đã giải/)
    ).toBeVisible();
    await expect(page.getByTestId("keyword-strip-advanced")).toContainText(
      "ABC"
    );
    await expect(
      page.getByText("Chúc mừng! Bạn đã đoán đúng từ khóa.")
    ).toBeVisible();
  });

  test("E3-§4.2: sai từ khóa — khóa UI + sessionStorage", async ({ page }) => {
    const key = `crossword-basic-eliminated:${E2E_SHARE_ADVANCED_WRONG}`;
    await page.addInitScript((k) => {
      sessionStorage.removeItem(k);
    }, key);
    await page.goto(`/play/${E2E_SHARE_ADVANCED_WRONG}`);
    await page
      .getByTestId("keyword-strip-advanced")
      .getByRole("button", { name: "Trả lời từ khóa" })
      .click();
    await page
      .getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
      .check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("XX");
    await page.getByRole("button", { name: "Gửi đoán" }).click();

    await expect(
      page.getByText(/đoán sai từ khóa và không còn quyền trả lời/)
    ).toBeVisible();
    await expect(
      page.getByTestId("keyword-strip-advanced").getByRole("button", {
        name: "Trả lời từ khóa",
      })
    ).toHaveCount(0);
    expect(await page.evaluate((k) => sessionStorage.getItem(k), key)).toBe(
      "1"
    );

    await page.getByText("Câu 1:").click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toHaveCount(0);
  });

  test("E3-§4.3: spectator — A sai từ khóa, B POST đúng, A poll thấy đáp án", async ({
    browser,
    baseURL,
  }) => {
    const key = `crossword-basic-eliminated:${E2E_SHARE_ADVANCED_SPECTATOR}`;
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await pageA.addInitScript((k) => {
      sessionStorage.removeItem(k);
    }, key);
    await pageA.goto(`${baseURL}/play/${E2E_SHARE_ADVANCED_SPECTATOR}`);

    await pageA
      .getByTestId("keyword-strip-advanced")
      .getByRole("button", { name: "Trả lời từ khóa" })
      .click();
    await pageA
      .getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
      .check();
    await pageA.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("ZZ");
    await pageA.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(
      pageA.getByText(/đoán sai từ khóa và không còn quyền trả lời/)
    ).toBeVisible();

    await pageB.goto(`${baseURL}/play/${E2E_SHARE_ADVANCED_SPECTATOR}`);
    await pageB
      .getByTestId("keyword-strip-advanced")
      .getByRole("button", { name: "Trả lời từ khóa" })
      .click();
    await pageB
      .getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
      .check();
    await pageB.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("ABC");
    await pageB.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(pageB.getByTestId("keyword-strip-advanced")).toContainText(
      "ABC"
    );

    await expect(pageA.getByText(/Từ khóa đã được giải/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(pageA.getByTestId("keyword-strip-advanced")).toContainText(
      "ABC"
    );

    await ctxA.close();
    await ctxB.close();
  });
});
