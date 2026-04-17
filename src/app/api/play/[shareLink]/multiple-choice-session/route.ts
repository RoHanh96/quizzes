import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import {
  buildMultipleChoiceSession,
  evaluateMcRound,
  type McBankRow,
} from "@/modules/quiz/lib/multiple-choice-session";
import { isMcDifficulty } from "@/modules/quiz/validation/multiple-choice-questions";

function toBankRows(
  rows: {
    id: string;
    question: string;
    options: string;
    answer: number;
    difficulty: string;
  }[]
): McBankRow[] {
  return rows.map((q) => {
    let opts: unknown;
    try {
      opts = JSON.parse(q.options);
    } catch {
      throw new Error("Invalid options JSON");
    }
    if (!Array.isArray(opts) || opts.length !== 4) {
      throw new Error("Options must be array of 4");
    }
    const strs = opts.map((x) => String(x ?? "").trim());
    if (strs.some((s) => !s)) {
      throw new Error("Empty option");
    }
    if (!isMcDifficulty(q.difficulty)) {
      throw new Error("Invalid difficulty");
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      throw new Error("Invalid answer index");
    }
    return {
      id: q.id,
      question: q.question,
      options: [strs[0]!, strs[1]!, strs[2]!, strs[3]!],
      answer: q.answer,
      difficulty: q.difficulty,
    };
  });
}

export async function GET(
  request: Request,
  { params }: { params: { shareLink: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { shareLink: params.shareLink },
      include: {
        multipleChoiceQuestions: { orderBy: { order: "asc" } },
      },
    });
    if (!quiz || quiz.type !== "multiple_choice") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const pl = quiz.playLength;
    if (!pl || pl < 1) {
      return NextResponse.json(
        { message: "Quiz missing playLength" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const qpSeed = url.searchParams.get("sessionSeed");
    const sessionSeed =
      quiz.shareLink?.startsWith("e2e-") && qpSeed && qpSeed.length > 0
        ? qpSeed
        : nanoid();

    const bank = toBankRows(quiz.multipleChoiceQuestions);
    const seedKey = `${params.shareLink}:${sessionSeed}`;
    const session = buildMultipleChoiceSession(pl, bank, seedKey);

    return NextResponse.json({
      sessionSeed,
      title: quiz.title,
      questions: session.items,
    });
  } catch (e) {
    console.error("[MC_SESSION_GET]", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { shareLink: string } }
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionSeed = typeof body.sessionSeed === "string" ? body.sessionSeed : "";
    const roundIndex =
      typeof body.roundIndex === "number"
        ? body.roundIndex
        : parseInt(String(body.roundIndex ?? ""), 10);
    const selectedIndex =
      typeof body.selectedIndex === "number"
        ? body.selectedIndex
        : parseInt(String(body.selectedIndex ?? ""), 10);

    if (!sessionSeed) {
      return NextResponse.json({ message: "Missing sessionSeed" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { shareLink: params.shareLink },
      include: {
        multipleChoiceQuestions: { orderBy: { order: "asc" } },
      },
    });
    if (!quiz || quiz.type !== "multiple_choice") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const pl = quiz.playLength;
    if (!pl || pl < 1) {
      return NextResponse.json(
        { message: "Quiz missing playLength" },
        { status: 500 }
      );
    }

    const bank = toBankRows(quiz.multipleChoiceQuestions);
    const seedKey = `${params.shareLink}:${sessionSeed}`;

    let result;
    try {
      result = evaluateMcRound(pl, bank, seedKey, roundIndex, selectedIndex);
    } catch {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({
      correctDisplayIndex: result.correctDisplayIndex,
      isCorrect: result.isCorrect,
      gameOver: result.gameOver,
      won: result.won,
    });
  } catch (e) {
    console.error("[MC_SESSION_POST]", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
