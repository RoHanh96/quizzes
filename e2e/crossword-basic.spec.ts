import { test, expect } from "@playwright/test";
import { E2E_SHARE_LINK } from "./global-setup";

test.describe("Crossword basic — public play (task-002)", () => {
  test("§3.2–3.3: có dải từ khóa và nút Trả lời từ khóa khi mở link", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_LINK}`);
    await expect(page.getByRole("heading", { name: "E2E Crossword Basic" })).toBeVisible();
    await expect(page.getByText(/Từ khóa — 2 ký tự/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Trả lời từ khóa" })
    ).toBeVisible();
  });

  test("§3.3: sau khi trả lời đúng cả hai hàng ngang, nút Trả lời từ khóa vẫn hiện", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_LINK}`);

    await page.getByText("Câu 1:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("HAND");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();

    await page.getByText("Câu 2:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("AIR");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Trả lời từ khóa" })
    ).toBeVisible();
  });

  test("§3.3: mở modal từ khóa có checkbox xác nhận và ô nhập", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_LINK}`);
    await page.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trả lời từ khóa" })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Nhập từ khóa đầy đủ…")).toBeVisible();
  });

  test("§3.2 mục 3: đoán đúng từ khóa → dải ô hiện đủ chữ (chuẩn hóa)", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_LINK}`);
    await page.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("HI");
    await page.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(page.getByTestId("keyword-strip")).toHaveText("HI");
    await expect(page.getByText(/Từ khóa — đã giải/)).toBeVisible();
  });
});
