import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, brandFiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser, isSubscriber } from "@/lib/auth";

// GET /api/brands/[id]/files — list files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (isSubscriber(user)) {
      const [brand] = await db
        .select({ createdBy: brands.createdBy })
        .from(brands)
        .where(eq(brands.id, id))
        .limit(1);
      if (!brand || brand.createdBy !== user.userId) {
        return NextResponse.json({ error: "權限不足" }, { status: 403 });
      }
    }

    const files = await db
      .select({
        id: brandFiles.id,
        fileName: brandFiles.fileName,
        fileType: brandFiles.fileType,
        fileSize: brandFiles.fileSize,
        createdAt: brandFiles.createdAt,
      })
      .from(brandFiles)
      .where(eq(brandFiles.brandId, id))
      .orderBy(desc(brandFiles.createdAt));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("GET /api/brands/[id]/files error:", error);
    return NextResponse.json({ error: "取得檔案列表失敗" }, { status: 500 });
  }
}

// POST /api/brands/[id]/files — upload file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (isSubscriber(user)) {
      const [brand] = await db
        .select({ createdBy: brands.createdBy })
        .from(brands)
        .where(eq(brands.id, id))
        .limit(1);
      if (!brand || brand.createdBy !== user.userId) {
        return NextResponse.json({ error: "權限不足" }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "請選擇檔案" }, { status: 400 });
    }

    const { getFileExtension, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } =
      await import("@/lib/file-parser");
    const ext = getFileExtension(file.name);

    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      return NextResponse.json(
        { error: `不支援的檔案格式。允許：${ALLOWED_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "檔案大小不可超過 10MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file content
    const { parseFileContent } = await import("@/lib/file-parser");
    let extractedText = "";
    try {
      extractedText = await parseFileContent(buffer, ext);
    } catch (parseError) {
      console.error("File parse error:", parseError);
      extractedText = "[無法解析檔案內容]";
    }

    // Upload to Supabase Storage
    const { supabase } = await import("@/lib/supabase");
    const storagePath = `${id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "檔案上傳失敗" }, { status: 500 });
    }

    // Save to DB
    const [newFile] = await db
      .insert(brandFiles)
      .values({
        brandId: id,
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
        storagePath,
        extractedText,
        uploadedBy: user.userId,
      })
      .returning();

    return NextResponse.json(
      {
        file: {
          id: newFile.id,
          fileName: newFile.fileName,
          fileType: newFile.fileType,
          fileSize: newFile.fileSize,
          createdAt: newFile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/brands/[id]/files error:", error);
    return NextResponse.json({ error: "檔案上傳失敗" }, { status: 500 });
  }
}
