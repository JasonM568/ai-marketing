import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = db
      .select()
      .from(agents)
      .orderBy(asc(agents.sortOrder));

    const allAgents = await query;

    // Filter by category if specified
    const filtered = category
      ? allAgents.filter((a) => a.category === category)
      : allAgents;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      agentCode,
      name,
      role,
      category,
      description,
      icon,
      systemPrompt,
      capabilities,
      outputFormats,
      sortOrder,
    } = body;

    if (!agentCode || !name || !role || !category || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newAgent] = await db
      .insert(agents)
      .values({
        agentCode,
        name,
        role,
        category,
        description: description || "",
        icon: icon || "🤖",
        systemPrompt,
        capabilities: capabilities || [],
        outputFormats: outputFormats || [],
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
