import type { Page } from "@playwright/test";

/** Dev: `admin@example.com` chấp nhận mọi mật khẩu (xem `src/lib/auth.ts`). */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email-address").fill("admin@example.com");
  await page.locator("#password").fill("e2e-test-password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
}
