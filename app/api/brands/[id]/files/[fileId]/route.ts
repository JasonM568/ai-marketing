import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, brandFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser, isSubscriber } from "@/lib/auth";

// DELETE /api/brands/[id]/files/[fileId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fileId } = await params;

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

    const [file] = await db
      .select()
      .from(brandFiles)
      .where(and(eq(brandFiles.id, fileId), eq(brandFiles.brandId, id)))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: "檔案不存在" }, { status: 404 });
    }

    // Delete from Supabase Storage
    const { supabase } = await import("@/lib/supabase");
    await supabase.storage.from("brand-files").remove([file.storagePath]);

    // Delete from DB
    await db.delete(brandFiles).where(eq(brandFiles.id, fileId));

    return NextResponse.json({ message: "檔案已刪除" });
  } catch (error) {
    console.error("DELETE /api/brands/[id]/files/[fileId] error:", error);
    return NextResponse.json({ error: "刪除檔案失敗" }, { status: 500 });
  }
}
