import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answersMatch } from "@/modules/quiz/lib/text";

/**
 * GET — trạng thái từ khóa đã được giải đúng trên link public (poll §3.3.6).
 * POST — gửi đoán từ khóa (chỉ khi đúng mới ghi DB; sai do client xử lý, server có thể gọi để xác thực).
 */
export async function GET(
  _request: Request,
  { params }: { params: { shareLink: string } }
) {
  const shareLink = params.shareLink;
  if (!shareLink) {
    return NextResponse.json({ solved: false }, { status: 400 });
  }

  const row = await prisma.crosswordPublicKeywordSolve.findUnique({
    where: { shareLink },
    select: { id: true },
  });

  return NextResponse.json({ solved: row !== null });
}

export async function POST(
  request: Request,
  { params }: { params: { shareLink: string } }
) {
  const shareLink = params.shareLink;
  if (!shareLink) {
    return NextResponse.json({ ok: false, message: "Thiếu shareLink." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body không hợp lệ." }, { status: 400 });
  }

  const guess =
    typeof body === "object" && body !== null && "guess" in body
      ? String((body as { guess?: unknown }).guess ?? "")
      : "";

  const quiz = await prisma.quiz.findFirst({
    where: { shareLink },
    select: { id: true, type: true, verticalWord: true, secretWord: true },
  });

  const isBasic =
    quiz?.type === "crossword_basic" && Boolean(quiz.verticalWord?.trim());
  const isAdvanced =
    quiz?.type === "crossword_advanced" && Boolean(quiz.secretWord?.trim());

  if (!quiz || (!isBasic && !isAdvanced)) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy quiz." }, { status: 404 });
  }

  const existing = await prisma.crosswordPublicKeywordSolve.findUnique({
    where: { shareLink },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadySolved: true });
  }

  const keyword = isBasic ? quiz.verticalWord! : quiz.secretWord!;
  if (!answersMatch(keyword, guess)) {
    return NextResponse.json({ ok: false, message: "Sai từ khóa." }, { status: 200 });
  }

  try {
    await prisma.crosswordPublicKeywordSolve.create({
      data: {
        shareLink,
        quizId: quiz.id,
      },
    });
  } catch {
    return NextResponse.json({ ok: true, alreadySolved: true });
  }

  return NextResponse.json({ ok: true });
}
