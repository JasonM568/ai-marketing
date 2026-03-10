import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session token against DB (single-device enforcement)
    if (user.sessionToken) {
      const [dbUser] = await db
        .select({ sessionToken: adminUsers.sessionToken })
        .from(adminUsers)
        .where(eq(adminUsers.id, user.userId))
        .limit(1);

      if (!dbUser || dbUser.sessionToken !== user.sessionToken) {
        return NextResponse.json(
          { error: "session_invalid", message: "您的帳號已在其他裝置登入" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
