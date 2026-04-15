import type { FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/** Cố định — test Playwright dùng `/play/${E2E_SHARE_LINK}`. */
export const E2E_SHARE_LINK = "e2e-share-basic";

async function globalSetup(_config: FullConfig) {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email: "e2e-seed@example.com" },
      update: {},
      create: { email: "e2e-seed@example.com", name: "E2E Seed", isAdmin: false },
    });

    await prisma.quiz.deleteMany({ where: { shareLink: E2E_SHARE_LINK } });

    const verticalWord = "HI";
    await prisma.quiz.create({
      data: {
        title: "E2E Crossword Basic",
        type: "crossword_basic",
        verticalWord,
        shareLink: E2E_SHARE_LINK,
        creatorId: user.id,
        crosswordQuestions: {
          create: [
            {
              question: "E2E câu 1",
              answer: "HAND",
              order: 1,
              position: 1,
              letterIndex: 1,
            },
            {
              question: "E2E câu 2",
              answer: "AIR",
              order: 2,
              position: 2,
              letterIndex: 2,
            },
          ],
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
