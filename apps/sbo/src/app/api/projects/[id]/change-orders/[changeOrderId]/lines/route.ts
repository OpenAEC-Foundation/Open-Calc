import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, changeOrderId } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const lines = await prisma.changeOrderLine.findMany({
      where: { changeOrderId },
    });

    return NextResponse.json(lines);
  } catch (error) {
    console.error("Error fetching change order lines:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, changeOrderId } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const totalPrice = (body.unitPrice || 0) * (body.quantity || 0);

    const line = await prisma.changeOrderLine.create({
      data: {
        description: body.description,
        quantity: body.quantity || 0,
        unit: body.unit || "st",
        unitPrice: body.unitPrice || 0,
        totalPrice,
        estimateLineId: body.estimateLineId || null,
        changeOrderId,
      },
    });

    // Recalculate change order totalAmount
    const allLines = await prisma.changeOrderLine.findMany({
      where: { changeOrderId },
      select: { totalPrice: true },
    });

    const totalAmount = allLines.reduce((sum, l) => sum + l.totalPrice, 0);

    await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: { totalAmount },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error("Error creating change order line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
