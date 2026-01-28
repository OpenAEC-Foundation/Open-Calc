import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateMilestoneSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  durationDays: z.number().int().min(0).optional(),
  color: z.string().nullable().optional(),
  dependsOnId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  completedAt: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, milestoneId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
      include: {
        dependsOn: true,
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Mijlpaal niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de mijlpaal" },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, milestoneId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, milestoneId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const existingMilestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Mijlpaal niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateMilestoneSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    // Validate dependsOnId if provided
    if (validated.data.dependsOnId) {
      if (validated.data.dependsOnId === milestoneId) {
        return NextResponse.json(
          { error: "Een mijlpaal kan niet afhankelijk zijn van zichzelf" },
          { status: 400 }
        );
      }

      const dependency = await prisma.milestone.findFirst({
        where: { id: validated.data.dependsOnId, projectId },
      });

      if (!dependency) {
        return NextResponse.json(
          { error: "Afhankelijke mijlpaal niet gevonden in dit project" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.description !== undefined) updateData.description = validated.data.description;
    if (validated.data.durationDays !== undefined) updateData.durationDays = validated.data.durationDays;
    if (validated.data.color !== undefined) updateData.color = validated.data.color;
    if (validated.data.status !== undefined) updateData.status = validated.data.status;
    if (validated.data.sortOrder !== undefined) updateData.sortOrder = validated.data.sortOrder;
    if (validated.data.dependsOnId !== undefined) updateData.dependsOnId = validated.data.dependsOnId;
    if (validated.data.dueDate !== undefined) {
      updateData.dueDate = validated.data.dueDate ? new Date(validated.data.dueDate) : null;
    }
    if (validated.data.startDate !== undefined) {
      updateData.startDate = validated.data.startDate ? new Date(validated.data.startDate) : null;
    }
    if (validated.data.completedAt !== undefined) {
      updateData.completedAt = validated.data.completedAt ? new Date(validated.data.completedAt) : null;
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        dependsOn: true,
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de mijlpaal" },
      { status: 500 }
    );
  }
}