import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const { id: projectId, costId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const cost = await prisma.actualCost.findFirst({
      where: { id: costId, projectId },
    });

    if (!cost) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 });
    }

    return NextResponse.json(cost);
  } catch (error) {
    console.error("Error fetching actual cost:", error);
    return NextResponse.json(
      { error: "Failed to fetch actual cost" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const { id: projectId, costId } = await params;
    const userId = await getDefaultUserId();
    const body = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const cost = await prisma.actualCost.update({
      where: { id: costId },
      data: {
        category: body.category,
        description: body.description,
        budgetAmount: body.budgetAmount,
        actualAmount: body.actualAmount,
        variance: body.variance,
        date: body.date ? new Date(body.date) : undefined,
      },
    });

    return NextResponse.json(cost);
  } catch (error) {
    console.error("Error updating actual cost:", error);
    return NextResponse.json(
      { error: "Failed to update actual cost" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const { id: projectId, costId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.actualCost.delete({
      where: { id: costId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting actual cost:", error);
    return NextResponse.json(
      { error: "Failed to delete actual cost" },
      { status: 500 }
    );
  }
}
