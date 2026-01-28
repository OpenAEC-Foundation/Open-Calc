import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";
import { generateCufXml, CufEstimate, CufChapter, CufLine } from "@/lib/cuf-xml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const { id: projectId, estimateId } = await params;
    const userId = await getDefaultUserId();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch estimate with all related data
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, projectId },
      include: {
        chapters: {
          include: {
            lines: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    // Calculate totals
    let totalExclVat = 0;
    const chapters: CufChapter[] = estimate.chapters.map((chapter, index) => {
      const lines: CufLine[] = chapter.lines.map((line) => {
        const lineTotal = line.quantity * line.unitPrice;
        totalExclVat += lineTotal;
        return {
          code: line.code || undefined,
          description: line.description,
          unit: line.unit,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: lineTotal,
          lineType: "NORMAL" as const,
        };
      });

      return {
        code: chapter.code || String(index + 1).padStart(2, "0"),
        name: chapter.name,
        lines,
      };
    });

    const vatPercentage = estimate.vatPercent || 21;
    const totalInclVat = totalExclVat * (1 + vatPercentage / 100);

    // Build CUF estimate object
    const cufEstimate: CufEstimate = {
      project: {
        name: project.name,
        number: project.projectNumber || undefined,
        description: project.description || undefined,
        client: project.client?.name,
        address: project.address || undefined,
        city: project.city || undefined,
      },
      chapters,
      totalExclVat,
      vatPercentage,
      totalInclVat,
      createdAt: estimate.createdAt.toISOString(),
      exportedBy: "OpenCalc SBO",
    };

    // Generate XML
    const xml = generateCufXml(cufEstimate);

    // Return as downloadable XML file
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_${estimate.name.replace(/[^a-zA-Z0-9]/g, "_")}.cuf.xml`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CUF-XML:", error);
    return NextResponse.json(
      { error: "Failed to export CUF-XML" },
      { status: 500 }
    );
  }
}
