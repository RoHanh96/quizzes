import { test, expect } from "@playwright/test";
import {
  E2E_SHARE_ACCENT,
  E2E_SHARE_EN,
  E2E_SHARE_SPACE,
} from "./constants";

test.describe("Task 002 — chuẩn hóa & chơi (E-§1)", () => {
  test("E-§1-01: từ khóa có dấu / khoảng — độ dài chuẩn hóa + đoán đúng", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_ACCENT}`);
    await expect(page.getByRole("heading", { name: "E2E Accent keyword" })).toBeVisible();
    await expect(page.getByText(/Từ khóa — 2 ký tự/)).toBeVisible();

    await page.getByText("Câu 1:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("NAM");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();

    await page.getByText("Câu 2:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("LOC");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();

    await page.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("  n ở  ");
    await page.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(page.getByTestId("keyword-strip")).toHaveText("Nở");
    await expect(page.getByText(/Từ khóa — đã giải/)).toBeVisible();
  });

  test("E-§1-02: đáp án có space — (N chữ) + nhập có/không space đều đúng", async ({
    page,
  }) => {
    await page.goto(`/play/${E2E_SHARE_SPACE}`);
    await expect(page.getByText(/Từ khóa — 2 ký tự/)).toBeVisible();

    await page.getByText("Câu 1:").click();
    await expect(page.getByText("(2 chữ)")).toBeVisible();

    await page.getByPlaceholder("Nhập câu trả lời...").fill("XX");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(
      page.getByText("Đáp án không chính xác, vui lòng thử lại!")
    ).toBeVisible();

    await page.getByPlaceholder("Nhập câu trả lời...").fill("AH");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(page.getByPlaceholder("Nhập câu trả lời...")).toHaveCount(0);

    await page.getByText("Câu 2:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("A I R");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await expect(page.getByRole("button", { name: "Trả lời từ khóa" })).toBeVisible();
  });

  test("E-§1-03: từ khóa EN ASCII — không lỗi console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto(`/play/${E2E_SHARE_EN}`);
    await page.getByText("Câu 1:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("OKAY");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await page.getByText("Câu 2:").click();
    await page.getByPlaceholder("Nhập câu trả lời...").fill("TOKEN");
    await page.getByRole("button", { name: "Trả lời", exact: true }).click();
    await page.getByRole("button", { name: "Trả lời từ khóa" }).click();
    await page.getByRole("checkbox", { name: /Tôi đã hiểu và muốn gửi đoán/ }).check();
    await page.getByPlaceholder("Nhập từ khóa đầy đủ…").fill("ok");
    await page.getByRole("button", { name: "Gửi đoán" }).click();
    await expect(page.getByTestId("keyword-strip")).toHaveText("OK");

    expect(consoleErrors, `Console errors: ${consoleErrors.join("\n")}`).toEqual([]);
  });
});
