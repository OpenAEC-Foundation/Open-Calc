import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createEstimateSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional(),
  generalCostsPercent: z.number().min(0).max(100).default(0),
  profitPercent: z.number().min(0).max(100).default(0),
  riskPercent: z.number().min(0).max(100).default(0),
  vatPercent: z.number().min(0).max(100).default(21),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId } = await params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project niet gevonden" }, { status: 404 });
    }

    const estimates = await prisma.estimate.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { chapters: true, lines: true } },
      },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Error fetching estimates:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId } = await params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project niet gevonden" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createEstimateSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    // Get current highest version for this project
    const latestEstimate = await prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = (latestEstimate?.version || 0) + 1;

    const estimate = await prisma.estimate.create({
      data: {
        ...validated.data,
        version: newVersion,
        projectId,
      },
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error("Error creating estimate:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de begroting" },
      { status: 500 }
    );
  }
}
