import { NextResponse } from "next/server";

export async function GET() {
  // For now, return a basic status
  // In a real implementation, this would check the ERPNext connection
  // The MCP tools are available via Claude Code, not directly in the API
  return NextResponse.json({
    status: "available",
    message: "ERPNext integration beschikbaar via Claude Code MCP",
  });
}
