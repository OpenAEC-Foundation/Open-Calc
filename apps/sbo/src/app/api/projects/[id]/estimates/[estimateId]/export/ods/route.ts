import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

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
            client: {
              select: { name: true },
            },
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

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Project Info
    const projectInfo = [
      ["BEGROTING"],
      [],
      ["Project:", estimate.project.name],
      ["Projectnummer:", estimate.project.projectNumber || "-"],
      ["Adres:", estimate.project.address || "-"],
      ["Plaats:", estimate.project.city || "-"],
      ["Klant:", estimate.project.client?.name || "-"],
      [],
      ["Begroting:", estimate.name],
      ["Versie:", estimate.version],
      ["Status:", estimate.status],
      [],
      ["Aangemaakt:", new Date(estimate.createdAt).toLocaleDateString("nl-NL")],
      ["Laatst gewijzigd:", new Date(estimate.updatedAt).toLocaleDateString("nl-NL")],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(projectInfo);
    wsInfo["!cols"] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Projectinfo");

    // Sheet 2: Detailed Lines
    const detailHeaders = [
      "Hoofdstuk",
      "Code",
      "Omschrijving",
      "Aantal",
      "Eenheid",
      "Uren",
      "Uurtarief",
      "Arbeidskosten",
      "Materiaalkosten",
      "Materieel",
      "Onderaanneming",
      "Eenheidsprijs",
      "Totaal",
    ];

    const detailRows: (string | number)[][] = [detailHeaders];

    // Add all chapters and lines
    for (const chapter of estimate.chapters) {
      // Add chapter row
      detailRows.push([
        `${chapter.code} ${chapter.name}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0),
      ]);

      // Add lines
      for (const line of chapter.lines) {
        detailRows.push([
          "",
          line.code || "",
          line.description,
          line.quantity,
          line.unit,
          line.laborHours,
          line.laborRate,
          line.laborCost,
          line.materialCost,
          line.equipmentCost,
          line.subcontrCost,
          line.unitPrice,
          line.totalPrice,
        ]);
      }
    }

    // Add unassigned lines
    if (estimate.lines && estimate.lines.length > 0) {
      detailRows.push(["Overige regels", "", "", "", "", "", "", "", "", "", "", "", ""]);
      for (const line of estimate.lines) {
        detailRows.push([
          "",
          line.code || "",
          line.description,
          line.quantity,
          line.unit,
          line.laborHours,
          line.laborRate,
          line.laborCost,
          line.materialCost,
          line.equipmentCost,
          line.subcontrCost,
          line.unitPrice,
          line.totalPrice,
        ]);
      }
    }

    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    wsDetail["!cols"] = [
      { wch: 25 }, // Hoofdstuk
      { wch: 12 }, // Code
      { wch: 40 }, // Omschrijving
      { wch: 10 }, // Aantal
      { wch: 8 },  // Eenheid
      { wch: 8 },  // Uren
      { wch: 10 }, // Uurtarief
      { wch: 12 }, // Arbeidskosten
      { wch: 12 }, // Materiaalkosten
      { wch: 12 }, // Materieel
      { wch: 12 }, // Onderaanneming
      { wch: 12 }, // Eenheidsprijs
      { wch: 12 }, // Totaal
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Begrotingsregels");

    // Sheet 3: Summary
    const summaryData = [
      ["KOSTENOVERZICHT"],
      [],
      ["Kostensoort", "Bedrag"],
      ["Arbeidskosten", estimate.totalLabor],
      ["Materiaalkosten", estimate.totalMaterial],
      ["Materieel", estimate.totalEquipment],
      ["Onderaanneming", estimate.totalSubcontr],
      [],
      ["Subtotaal", estimate.subtotal],
      [],
      [`Algemene kosten (${estimate.generalCostsPercent}%)`, estimate.generalCostsAmount],
      [`Winst (${estimate.profitPercent}%)`, estimate.profitAmount],
      [`Risico (${estimate.riskPercent}%)`, estimate.riskAmount],
      [],
      ["Totaal excl. BTW", estimate.totalExclVat],
      [`BTW (${estimate.vatPercent}%)`, estimate.vatAmount],
      [],
      ["TOTAAL INCL. BTW", estimate.totalInclVat],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Samenvatting");

    // Sheet 4: Per Chapter Summary
    const chapterSummary = [
      ["OVERZICHT PER HOOFDSTUK"],
      [],
      ["Code", "Hoofdstuk", "Totaal"],
    ];

    for (const chapter of estimate.chapters) {
      const chapterTotal = chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0);
      chapterSummary.push([chapter.code, chapter.name, chapterTotal as unknown as string]);
    }

    chapterSummary.push(["", "", ""]);
    chapterSummary.push(["", "TOTAAL", estimate.subtotal as unknown as string]);

    const wsChapters = XLSX.utils.aoa_to_sheet(chapterSummary);
    wsChapters["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsChapters, "Per Hoofdstuk");

    // Generate XLSX file (Excel format supports formulas better than ODS)
    const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // Create filename
    const safeName = estimate.project.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const filename = `${safeName}_begroting_v${estimate.version}.xlsx`;

    return new Response(xlsxBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting ODS:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het exporteren" },
      { status: 500 }
    );
  }
}
