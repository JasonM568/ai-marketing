import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel Hobby serverless body limit)
const MAX_FILES = 10;

// POST /api/upload — upload one or more images to Vercel Blob
// Accepts "file" (single) or "files" (multiple) form fields
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const formData = await request.formData();

    // Collect files from both "file" (single) and "files" (multiple) fields
    const files: File[] = [];
    const singleFile = formData.get("file") as File | null;
    if (singleFile) files.push(singleFile);
    for (const entry of formData.getAll("files")) {
      if (entry instanceof File) files.push(entry);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "請選擇檔案" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `最多只能上傳 ${MAX_FILES} 張圖片` },
        { status: 400 }
      );
    }

    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${file.name}：僅支援 JPG、PNG、WebP、GIF 圖片格式` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${file.name}：圖片大小不能超過 4.5MB` },
          { status: 400 }
        );
      }
    }

    // Upload all files
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `schedule/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });
      urls.push(blob.url);
    }

    // Return single url for backward compat + urls array
    return NextResponse.json({ url: urls[0], urls });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "上傳失敗";
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Blob Storage 尚未設定，請確認 BLOB_READ_WRITE_TOKEN 環境變數" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: `上傳失敗：${message}` }, { status: 500 });
  }
}