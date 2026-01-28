import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const costs = await prisma.actualCost.findMany({
      where: { projectId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(costs);
  } catch (error) {
    console.error("Error fetching actual costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch actual costs" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const userId = await getDefaultUserId();
    const body = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const cost = await prisma.actualCost.create({
      data: {
        projectId,
        category: body.category,
        description: body.description,
        budgetAmount: body.budgetAmount || 0,
        actualAmount: body.actualAmount || 0,
        variance: body.variance || (body.actualAmount || 0) - (body.budgetAmount || 0),
        date: body.date ? new Date(body.date) : new Date(),
      },
    });

    return NextResponse.json(cost, { status: 201 });
  } catch (error) {
    console.error("Error creating actual cost:", error);
    return NextResponse.json(
      { error: "Failed to create actual cost" },
      { status: 500 }
    );
  }
}
