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

// POST /api/brands/[id]/files — two-step upload
// Step 1 (action=sign): validate & return signed upload URL
// Step 2 (action=confirm): parse content & save to DB
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

    const body = await request.json();
    const { action } = body;

    if (action === "sign") {
      return handleSign(body, id);
    } else if (action === "confirm") {
      return handleConfirm(body, id, user.userId);
    }

    return NextResponse.json({ error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/brands/[id]/files error:", error);
    const message = error instanceof Error ? error.message : "未知錯誤";
    return NextResponse.json({ error: `操作失敗：${message}` }, { status: 500 });
  }
}

// Step 1: Validate file & return signed upload URL
async function handleSign(
  body: { fileName: string; fileSize: number; fileType: string },
  brandId: string
) {
  const { fileName, fileSize, fileType } = body;

  if (!fileName) {
    return NextResponse.json({ error: "缺少檔案名稱" }, { status: 400 });
  }

  const { getFileExtension, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } =
    await import("@/lib/file-parser");
  const ext = getFileExtension(fileName);

  if (!ALLOWED_FILE_TYPES.includes(ext)) {
    return NextResponse.json(
      { error: `不支援的檔案格式。允許：${ALLOWED_FILE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "檔案大小不可超過 10MB" },
      { status: 400 }
    );
  }

  const { supabase } = await import("@/lib/supabase");
  const storagePath = `${brandId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("brand-files")
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "無法產生上傳連結" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    ext,
  });
}

// Step 2: Download from storage, parse content, save to DB
async function handleConfirm(
  body: { storagePath: string; fileName: string; fileSize: number; contentType: string },
  brandId: string,
  userId: string
) {
  const { storagePath, fileName, fileSize, contentType } = body;

  if (!storagePath || !fileName) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const { getFileExtension } = await import("@/lib/file-parser");
  const ext = getFileExtension(fileName);

  // Download file from Supabase to parse content
  const { supabase } = await import("@/lib/supabase");
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("brand-files")
    .download(storagePath);

  let extractedText = "";
  if (downloadError) {
    console.error("Download for parsing error:", downloadError);
    extractedText = "[無法解析檔案內容]";
  } else {
    const { parseFileContent } = await import("@/lib/file-parser");
    const buffer = Buffer.from(await fileData.arrayBuffer());
    try {
      extractedText = await parseFileContent(buffer, ext);
    } catch (parseError) {
      console.error("File parse error:", parseError);
      extractedText = "[無法解析檔案內容]";
    }
  }

  // Save to DB
  const [newFile] = await db
    .insert(brandFiles)
    .values({
      brandId,
      fileName,
      fileType: ext,
      fileSize: fileSize || 0,
      storagePath,
      extractedText,
      uploadedBy: userId,
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
}
