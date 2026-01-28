import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: projectId, orderId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, projectId },
      include: {
        supplier: { select: { name: true } },
        lines: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: projectId, orderId } = await params;
    const userId = await getDefaultUserId();
    const body = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const order = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        supplierId: body.supplierId,
        status: body.status,
        totalAmount: body.totalAmount,
        expectedDelivery: body.expectedDeliveryDate
          ? new Date(body.expectedDeliveryDate)
          : undefined,
        deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : undefined,
        notes: body.notes,
      },
      include: {
        supplier: { select: { name: true } },
        lines: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: projectId, orderId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete lines first (cascade should handle this, but being explicit)
    await prisma.purchaseOrderLine.deleteMany({
      where: { purchaseOrderId: orderId },
    });

    await prisma.purchaseOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}
