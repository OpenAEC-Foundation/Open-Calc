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

    const changeOrder = await prisma.changeOrder.findFirst({
      where: { id: changeOrderId, projectId: id },
      include: { lines: true },
    });

    if (!changeOrder) {
      return NextResponse.json(
        { error: "Meer/minderwerk niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error("Error fetching change order:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const changeOrder = await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        type: body.type,
      },
      include: { lines: true },
    });

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error("Error updating change order:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete lines first
    await prisma.changeOrderLine.deleteMany({
      where: { changeOrderId },
    });

    await prisma.changeOrder.delete({
      where: { id: changeOrderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting change order:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
