import { test, expect } from "@playwright/test";
import { E2E_SHARE_MC } from "./constants";

const SESSION_QS = "?sessionSeed=playwright-session";

async function findWinningOptionIndex(
  baseURL: string,
  request: import("@playwright/test").APIRequestContext
): Promise<number> {
  const gr = await request.get(
    `${baseURL}/api/play/${E2E_SHARE_MC}/multiple-choice-session${SESSION_QS}`
  );
  expect(gr.ok()).toBeTruthy();
  const body = (await gr.json()) as { sessionSeed: string };
  const sessionSeed = body.sessionSeed;
  for (let i = 0; i < 4; i++) {
    const pr = await request.post(
      `${baseURL}/api/play/${E2E_SHARE_MC}/multiple-choice-session`,
      {
        data: { sessionSeed, roundIndex: 0, selectedIndex: i },
      }
    );
    expect(pr.ok()).toBeTruthy();
    const r = (await pr.json()) as { isCorrect: boolean };
    if (r.isCorrect) return i;
  }
  throw new Error("No correct option index");
}

test.describe("Task 004 — MC play", () => {
  test("T004-play-01: GET session không lộ đáp án", async ({ request, baseURL }) => {
    const res = await request.get(
      `${baseURL}/api/play/${E2E_SHARE_MC}/multiple-choice-session${SESSION_QS}`
    );
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as Record<string, unknown>;
    expect(j).not.toHaveProperty("answer");
    expect(j).not.toHaveProperty("correctIndex");
    expect(j).not.toHaveProperty("correctOption");
    const qs = j.questions as unknown[];
    expect(Array.isArray(qs)).toBeTruthy();
    expect(qs).toHaveLength(1);
    const q0 = qs[0] as Record<string, unknown>;
    expect(q0).not.toHaveProperty("answer");
    expect(Array.isArray(q0.options)).toBeTruthy();
    expect((q0.options as unknown[]).length).toBe(4);
  });

  test("T004-play-02: thắng sau khi chọn đúng (có chờ reveal)", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(25_000);
    const winIx = await findWinningOptionIndex(baseURL!, request);
    await page.goto(`/play/${E2E_SHARE_MC}`);
    await expect(page.getByTestId("mc-title")).toContainText("E2E Multiple Choice");
    await page.getByTestId(`mc-option-${winIx}`).click();
    await expect(page.getByTestId("mc-win")).toBeVisible({ timeout: 12_000 });
    await page.getByTestId("mc-play-again").click();
    await expect(page.getByTestId("mc-question-text")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("T004-play-03: sai → reveal đáp án đúng (xanh) → thua + Chơi lại", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(35_000);
    const winIx = await findWinningOptionIndex(baseURL!, request);
    const wrongIx = (winIx + 1) % 4;
    await page.goto(`/play/${E2E_SHARE_MC}`);
    await page.getByTestId(`mc-option-${wrongIx}`).click();
    const correctReveal = page.locator('[data-mc-correct-reveal="true"]');
    await expect(correctReveal).toBeVisible({ timeout: 12_000 });
    await expect(correctReveal).toHaveClass(/mc-blink-green/);
    await expect(page.getByTestId("mc-game-over")).toBeVisible({ timeout: 8_000 });
    await page.getByTestId("mc-play-again").click();
    await expect(page.getByTestId("mc-question-text")).toBeVisible({ timeout: 10_000 });
  });
});
