import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { parseQuizCreateBody } from "@/modules/quiz/validation/quiz-create-body";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseQuizCreateBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const { data } = parsed;
    const shareLink = nanoid();

    if (data.type === "multiple_choice") {
      const norm = data.normalizedMcQuestions!;
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          type: data.type,
          shareLink,
          playLength: data.playLength!,
          creatorId: session.user.id,
          multipleChoiceQuestions: {
            create: norm.map((q) => ({
              question: q.question,
              options: JSON.stringify(q.options),
              answer: q.answer,
              difficulty: q.difficulty,
              order: q.order,
            })),
          },
        },
        include: {
          multipleChoiceQuestions: true,
          crosswordQuestions: true,
        },
      });
      return NextResponse.json(quiz);
    }

    if (data.type === "crossword_basic" || data.type === "crossword_advanced") {
      const norm = data.normalizedCrosswordQuestions!;
      const layoutSeed =
        data.type === "crossword_advanced"
          ? Math.floor(Math.random() * 0x7fffffff)
          : null;
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          type: data.type,
          verticalWord: data.verticalWord ?? undefined,
          secretWord: data.secretWord ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          advancedLayoutSeed: layoutSeed ?? undefined,
          shareLink,
          creatorId: session.user.id,
          crosswordQuestions: {
            create: norm.map((q) => ({
              question: q.question,
              answer: q.answer,
              order: q.order,
              position: q.position,
              letterIndex: q.letterIndex,
            })),
          },
        },
        include: {
          crosswordQuestions: true,
        },
      });
      return NextResponse.json(quiz);
    }

    return NextResponse.json(
      { message: "Loại quiz không được hỗ trợ." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[QUIZ_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof (body as { id?: unknown }).id === "string" ? (body as { id: string }).id : "";
    if (!id) {
      return new NextResponse("Missing quiz id", { status: 400 });
    }

    const parsed = parseQuizCreateBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const d = parsed.data;

    await prisma.crosswordQuestion.deleteMany({ where: { quizId: id } });
    await prisma.multipleChoiceQuestion.deleteMany({ where: { quizId: id } });

    const updateData: Prisma.QuizUpdateInput = {
      title: d.title,
      type: d.type,
      verticalWord: d.verticalWord ?? null,
      secretWord: d.secretWord ?? null,
      imageUrl: d.imageUrl ?? null,
      playLength: d.type === "multiple_choice" ? d.playLength! : null,
    };

    if (d.type === "crossword_basic" || d.type === "crossword_advanced") {
      const norm = d.normalizedCrosswordQuestions!;
      if (d.type === "crossword_advanced") {
        updateData.advancedLayoutSeed = Math.floor(Math.random() * 0x7fffffff);
      }
      updateData.crosswordQuestions = {
        create: norm.map((q) => ({
          question: q.question,
          answer: q.answer,
          order: q.order,
          position: q.position,
          letterIndex: q.letterIndex,
        })),
      };
    } else if (d.type === "multiple_choice") {
      const norm = d.normalizedMcQuestions!;
      updateData.multipleChoiceQuestions = {
        create: norm.map((q) => ({
          question: q.question,
          options: JSON.stringify(q.options),
          answer: q.answer,
          difficulty: q.difficulty,
          order: q.order,
        })),
      };
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        crosswordQuestions: true,
        multipleChoiceQuestions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
