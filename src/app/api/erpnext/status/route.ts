import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For now, return a basic status
  // In a real implementation, this would check the ERPNext connection
  // The MCP tools are available via Claude Code, not directly in the API
  return NextResponse.json({
    status: "available",
    message: "ERPNext integration beschikbaar via Claude Code MCP",
  });
}
