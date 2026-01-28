import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateIFC, type EstimateData } from "@/lib/ifc";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Fetch estimate with all related data
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId },
      },
      include: {
        project: {
          select: {
            name: true,
            projectNumber: true,
            address: true,
            city: true,
          },
        },
        chapters: {
          orderBy: { sortOrder: "asc" },
          include: {
            lines: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        lines: {
          where: { chapterId: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Begroting niet gevonden" },
        { status: 404 }
      );
    }

    // Transform to IFC format
    const estimateData: EstimateData = {
      id: estimate.id,
      name: estimate.name,
      version: estimate.version,
      project: {
        name: estimate.project.name,
        projectNumber: estimate.project.projectNumber,
        address: estimate.project.address,
        city: estimate.project.city,
      },
      chapters: estimate.chapters.map((chapter) => ({
        id: chapter.id,
        code: chapter.code,
        name: chapter.name,
        subtotal: chapter.subtotal,
        lines: chapter.lines.map((line) => ({
          id: line.id,
          code: line.code,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          laborCost: line.laborCost,
          materialCost: line.materialCost,
          equipmentCost: line.equipmentCost,
          subcontrCost: line.subcontrCost,
        })),
      })),
      totals: {
        totalLabor: estimate.totalLabor,
        totalMaterial: estimate.totalMaterial,
        totalEquipment: estimate.totalEquipment,
        totalSubcontr: estimate.totalSubcontr,
        subtotal: estimate.subtotal,
        generalCostsPercent: estimate.generalCostsPercent,
        generalCostsAmount: estimate.generalCostsAmount,
        profitPercent: estimate.profitPercent,
        profitAmount: estimate.profitAmount,
        riskPercent: estimate.riskPercent,
        riskAmount: estimate.riskAmount,
        totalExclVat: estimate.totalExclVat,
        vatPercent: estimate.vatPercent,
        vatAmount: estimate.vatAmount,
        totalInclVat: estimate.totalInclVat,
      },
    };

    // Add unassigned lines as a special chapter if any exist
    if (estimate.lines && estimate.lines.length > 0) {
      estimateData.chapters.push({
        id: "unassigned",
        code: "XX",
        name: "Overige regels",
        subtotal: estimate.lines.reduce((sum, line) => sum + line.totalPrice, 0),
        lines: estimate.lines.map((line) => ({
          id: line.id,
          code: line.code,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          laborCost: line.laborCost,
          materialCost: line.materialCost,
          equipmentCost: line.equipmentCost,
          subcontrCost: line.subcontrCost,
        })),
      });
    }

    // Generate IFC content
    const ifcContent = generateIFC(estimateData);

    // Create filename
    const safeName = estimate.project.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const filename = `${safeName}_begroting_v${estimate.version}.ifc`;

    // Return as downloadable file
    return new Response(ifcContent, {
      headers: {
        "Content-Type": "application/x-step",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting IFC:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het exporteren" },
      { status: 500 }
    );
  }
}
