import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADVANCED_IMAGE_MIN_BYTES } from "@/modules/quiz/validation/crossword-advanced";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length < ADVANCED_IMAGE_MIN_BYTES) {
      return NextResponse.json(
        {
          message: `File quá nhỏ: tối thiểu ${ADVANCED_IMAGE_MIN_BYTES / 1024} KB (ảnh gợi ý advanced).`,
        },
        { status: 400 }
      );
    }

    // Tạo tên file duy nhất để tránh trùng lặp
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;

    // Lưu file vào thư mục public/uploads
    const path = join(process.cwd(), "public/uploads", filename);
    await writeFile(path, buffer);

    // Trả về URL của file đã upload
    return NextResponse.json({
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new NextResponse("Error uploading file", { status: 500 });
  }
}
