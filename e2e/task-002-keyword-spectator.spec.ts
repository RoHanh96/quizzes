import { test, expect } from "@playwright/test";
import { E2E_SHARE_SPECTATOR, E2E_SHARE_WRONG } from "./constants";

test.describe("Task 002 — từ khóa & spectator (E-§3.3)", () => {
  test("E-§3.3-03: sai từ khóa — khóa UI + sessionStorage", async ({ page }) => {
    const key = "crossword-basic-eliminated:e2e-share-wrong";
    await page.addInitScript((k) => {
      sessionStorage.removeItem(k);
    }, key);
    await page.goto(`/play/${E2E_SHARE_WRONG}`);
    await page.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("XX");
    await page.getByRole("button", { name: "Gửi đoán" }).click();

    await expect(
      page.getByText(/đoán sai từ khóa và không còn quyền trả lời/)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Trả lời từ khóa" })).toHaveCount(0);
    expect(await page.evaluate((k) => sessionStorage.getItem(k), key)).toBe("1");

    await page.getByText("Câu 1:").click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toHaveCount(0);
  });

  test("E-§3.3.6-01: A sai từ khóa, B đoán đúng, A poll thấy đáp án", async ({
    browser,
    baseURL,
  }) => {
    const key = "crossword-basic-eliminated:e2e-share-spectator";
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await pageA.addInitScript((k) => sessionStorage.removeItem(k), key);
    await pageA.goto(`${baseURL}/play/${E2E_SHARE_SPECTATOR}`);

    await pageA.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await pageA.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await pageA.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("ZZ");
    await pageA.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(
      pageA.getByText(/đoán sai từ khóa và không còn quyền trả lời/)
    ).toBeVisible();

    await pageB.goto(`${baseURL}/play/${E2E_SHARE_SPECTATOR}`);
    await pageB.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await pageB.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await pageB.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("HI");
    await pageB.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(pageB.getByTestId("keyword-strip")).toHaveText("HI");

    await expect(pageA.getByText(/Từ khóa đã được giải/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(pageA.getByTestId("keyword-strip")).toHaveText("HI");

    await ctxA.close();
    await ctxB.close();
  });
});
