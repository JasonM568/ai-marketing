import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel Hobby serverless body limit)

// POST /api/upload — upload image to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "請選擇檔案" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "僅支援 JPG、PNG、WebP、GIF 圖片格式" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "圖片大小不能超過 4.5MB" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `schedule/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上傳失敗" }, { status: 500 });
  }
}
