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

    const orders = await prisma.purchaseOrder.findMany({
      where: { projectId },
      include: {
        supplier: { select: { name: true } },
        lines: true,
      },
      orderBy: { orderDate: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
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

    // Generate order number
    const count = await prisma.purchaseOrder.count({ where: { projectId } });
    const orderNumber = `PO-${String(count + 1).padStart(5, "0")}`;

    const order = await prisma.purchaseOrder.create({
      data: {
        projectId,
        orderNumber,
        supplierId: body.supplierId,
        status: "DRAFT",
        totalAmount: body.totalAmount || 0,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDelivery: body.expectedDeliveryDate
          ? new Date(body.expectedDeliveryDate)
          : null,
        notes: body.notes,
      },
      include: { supplier: { select: { name: true } } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
