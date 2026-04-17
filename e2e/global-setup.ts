import type { FullConfig } from "@playwright/test";
import { execFileSync } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { E2E_SEED_USER_EMAIL } from "../src/lib/e2e-seed";
import { assignLetterIndexesForBasic } from "../src/modules/quiz/validation/crossword-basic";
import { ADVANCED_IMAGE_MIN_BYTES } from "../src/modules/quiz/validation/crossword-advanced";
import {
  E2E_SHARE_ACCENT,
  E2E_SHARE_ADVANCED,
  E2E_SHARE_ADVANCED_KEYWORD,
  E2E_SHARE_ADVANCED_SPECTATOR,
  E2E_SHARE_ADVANCED_WRONG,
  E2E_SHARE_BANANA,
  E2E_SHARE_BASIC,
  E2E_SHARE_EN,
  E2E_SHARE_MC,
  E2E_SHARE_SPACE,
  E2E_SHARE_SPECTATOR,
  E2E_SHARE_WRONG,
} from "./constants";

const ALL_SEED_SHARE_LINKS = [
  E2E_SHARE_BASIC,
  E2E_SHARE_WRONG,
  E2E_SHARE_SPECTATOR,
  E2E_SHARE_SPACE,
  E2E_SHARE_ACCENT,
  E2E_SHARE_EN,
  E2E_SHARE_BANANA,
  E2E_SHARE_ADVANCED,
  E2E_SHARE_ADVANCED_KEYWORD,
  E2E_SHARE_ADVANCED_WRONG,
  E2E_SHARE_ADVANCED_SPECTATOR,
  E2E_SHARE_MC,
];

const E2E_ADVANCED_QUESTIONS = [
  {
    question: "E2E adv câu 1",
    answer: "ONE",
    order: 1,
    position: 1,
    letterIndex: 0,
  },
  {
    question: "E2E adv câu 2",
    answer: "TWO",
    order: 2,
    position: 2,
    letterIndex: 0,
  },
  {
    question: "E2E adv câu 3",
    answer: "THREE",
    order: 3,
    position: 3,
    letterIndex: 0,
  },
] as const;

/** Tách khỏi `dev.db` — Playwright chỉ seed/xóa theo shareLink trên file này. */
const E2E_DATABASE_URL = "file:./e2e.db";

function assertAssign(
  verticalWord: string,
  drafts: Parameters<typeof assignLetterIndexesForBasic>[1]
) {
  const r = assignLetterIndexesForBasic(verticalWord, drafts);
  if (!r.ok) {
    throw new Error(`Seed assign failed (${verticalWord}): ${r.message}`);
  }
  return r.questions;
}

async function globalSetup(_config: FullConfig) {
  process.env.DATABASE_URL = E2E_DATABASE_URL;
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });

  const prisma = new PrismaClient();
  try {
    const uploadsDir = join(process.cwd(), "public/uploads");
    await mkdir(uploadsDir, { recursive: true });
    const advancedStub = join(uploadsDir, "e2e-advanced-stub.jpg");
    await writeFile(advancedStub, Buffer.alloc(ADVANCED_IMAGE_MIN_BYTES, 0x2f));
    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: { isAdmin: true },
      create: {
        email: "admin@example.com",
        name: "Admin E2E",
        isAdmin: true,
      },
    });

    const seedUser = await prisma.user.upsert({
      where: { email: E2E_SEED_USER_EMAIL },
      update: {},
      create: { email: E2E_SEED_USER_EMAIL, name: "E2E Seed", isAdmin: false },
    });

    await prisma.quiz.deleteMany({
      where: { shareLink: { in: ALL_SEED_SHARE_LINKS } },
    });

    const hiQuestions = assertAssign("HI", [
      {
        question: "E2E câu 1",
        answer: "HAND",
        order: 1,
        position: 1,
      },
      {
        question: "E2E câu 2",
        answer: "AIR",
        order: 2,
        position: 2,
      },
    ]);

    const mkHiClone = (shareLink: string, title: string) =>
      prisma.quiz.create({
        data: {
          title,
          type: "crossword_basic",
          verticalWord: "HI",
          shareLink,
          creatorId: seedUser.id,
          crosswordQuestions: {
            create: hiQuestions.map((q) => ({
              question: q.question,
              answer: q.answer,
              order: q.order,
              position: q.position,
              letterIndex: q.letterIndex,
            })),
          },
        },
      });

    await mkHiClone(E2E_SHARE_BASIC, "E2E Crossword Basic");
    await mkHiClone(E2E_SHARE_WRONG, "E2E Wrong keyword");
    await mkHiClone(E2E_SHARE_SPECTATOR, "E2E Spectator poll");

    const spaceQs = assertAssign("HI", [
      { question: "Hàng có space", answer: "A H", order: 1, position: 1 },
      { question: "E2E câu 2", answer: "AIR", order: 2, position: 2 },
    ]);
    await prisma.quiz.create({
      data: {
        title: "E2E Space row",
        type: "crossword_basic",
        verticalWord: "HI",
        shareLink: E2E_SHARE_SPACE,
        creatorId: seedUser.id,
        crosswordQuestions: {
          create: spaceQs.map((q) => ({
            question: q.question,
            answer: q.answer,
            order: q.order,
            position: q.position,
            letterIndex: q.letterIndex,
          })),
        },
      },
    });

    const accentQs = assertAssign("Nở", [
      { question: "Chữ N", answer: "NAM", order: 1, position: 1 },
      { question: "Chữ O", answer: "LOC", order: 2, position: 2 },
    ]);
    await prisma.quiz.create({
      data: {
        title: "E2E Accent keyword",
        type: "crossword_basic",
        verticalWord: "  Nở  ",
        shareLink: E2E_SHARE_ACCENT,
        creatorId: seedUser.id,
        crosswordQuestions: {
          create: accentQs.map((q) => ({
            question: q.question,
            answer: q.answer,
            order: q.order,
            position: q.position,
            letterIndex: q.letterIndex,
          })),
        },
      },
    });

    const enQs = assertAssign("OK", [
      { question: "EN 1", answer: "OKAY", order: 1, position: 1 },
      { question: "EN 2", answer: "TOKEN", order: 2, position: 2 },
    ]);
    await prisma.quiz.create({
      data: {
        title: "E2E EN ASCII",
        type: "crossword_basic",
        verticalWord: "OK",
        shareLink: E2E_SHARE_EN,
        creatorId: seedUser.id,
        crosswordQuestions: {
          create: enQs.map((q) => ({
            question: q.question,
            answer: q.answer,
            order: q.order,
            position: q.position,
            letterIndex: q.letterIndex,
          })),
        },
      },
    });

    const bananaDrafts = [
      { question: "B1", answer: "BOX", order: 1, position: 1 },
      { question: "B2", answer: "AXE", order: 2, position: 2 },
      { question: "B3", answer: "NIX", order: 3, position: 3 },
      { question: "B4", answer: "AIM", order: 4, position: 4 },
      { question: "B5", answer: "NOR", order: 5, position: 5 },
      { question: "B6", answer: "ASK", order: 6, position: 6 },
    ];
    const bananaQs = assertAssign("BANANA", bananaDrafts);
    await prisma.quiz.create({
      data: {
        title: "E2E Banana",
        type: "crossword_basic",
        verticalWord: "BANANA",
        shareLink: E2E_SHARE_BANANA,
        creatorId: seedUser.id,
        crosswordQuestions: {
          create: bananaQs.map((q) => ({
            question: q.question,
            answer: q.answer,
            order: q.order,
            position: q.position,
            letterIndex: q.letterIndex,
          })),
        },
      },
    });

    const seedAdvancedE2e = (shareLink: string, title: string) =>
      prisma.quiz.create({
        data: {
          title,
          type: "crossword_advanced",
          secretWord: "ABC",
          imageUrl: "/uploads/e2e-advanced-stub.jpg",
          advancedLayoutSeed: 123456789,
          shareLink,
          creatorId: seedUser.id,
          crosswordQuestions: {
            create: [...E2E_ADVANCED_QUESTIONS],
          },
        },
      });

    await seedAdvancedE2e(E2E_SHARE_ADVANCED, "E2E Crossword Advanced");
    await seedAdvancedE2e(E2E_SHARE_ADVANCED_KEYWORD, "E2E Advanced Keyword");
    await seedAdvancedE2e(E2E_SHARE_ADVANCED_WRONG, "E2E Advanced Wrong");
    await seedAdvancedE2e(
      E2E_SHARE_ADVANCED_SPECTATOR,
      "E2E Advanced Spectator"
    );

    await prisma.quiz.create({
      data: {
        title: "E2E Multiple Choice",
        type: "multiple_choice",
        shareLink: E2E_SHARE_MC,
        playLength: 1,
        creatorId: seedUser.id,
        multipleChoiceQuestions: {
          create: [
            {
              question: "E2E MC câu 1?",
              options: JSON.stringify(["Đáp án đúng", "Sai 1", "Sai 2", "Sai 3"]),
              answer: 0,
              difficulty: "easy",
              order: 1,
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
