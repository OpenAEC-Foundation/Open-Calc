import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; changeOrderId: string; lineId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, changeOrderId, lineId } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const line = await prisma.changeOrderLine.findFirst({
      where: { id: lineId, changeOrderId },
    });

    if (!line) {
      return NextResponse.json(
        { error: "Regel niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error("Error fetching change order line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; changeOrderId: string; lineId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, changeOrderId, lineId } = await params;

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

    const line = await prisma.changeOrderLine.update({
      where: { id: lineId },
      data: {
        description: body.description,
        quantity: body.quantity,
        unit: body.unit,
        unitPrice: body.unitPrice,
        totalPrice,
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

    return NextResponse.json(line);
  } catch (error) {
    console.error("Error updating change order line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; changeOrderId: string; lineId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, changeOrderId, lineId } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    await prisma.changeOrderLine.delete({
      where: { id: lineId },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting change order line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
