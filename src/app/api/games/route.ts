import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, type } = body;

    if (!name || !description || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        name,
        description,
        type,
        creatorId: session.user.id,
      },
      include: {
        creator: true,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("[GAMES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const games = await prisma.game.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: true,
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("[GAMES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
