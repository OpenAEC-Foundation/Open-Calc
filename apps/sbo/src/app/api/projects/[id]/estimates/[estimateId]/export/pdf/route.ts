import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsPDF } from "jspdf";

// Export types:
// 1. complete - Complete begroting met alle details per regel
// 2. summary - Begroting samengevat (alleen hoofdstukken)
// 3. offer - Offerte (samenvatting + offertespecificatie)
// 4. offer-summary - Offerte en begroting samengevat
// 5. offer-complete - Offerte, complete begroting en begroting samengevat

type ExportType = "complete" | "summary" | "offer" | "offer-summary" | "offer-complete";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Get export type from query parameter
    const url = new URL(request.url);
    const exportType = (url.searchParams.get("type") || "summary") as ExportType;

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
            postalCode: true,
            client: {
              select: {
                name: true,
                contactPerson: true,
                address: true,
                city: true,
                postalCode: true,
                email: true,
                phone: true,
              },
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

    // Fetch user/company info for letterhead
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        companyName: true,
        companyAddress: true,
        companyCity: true,
        companyPostalCode: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        companyLogo: true,
        kvkNumber: true,
        btwNumber: true,
        ibanNumber: true,
      },
    });

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Determine what to include based on export type
    const includeOffer = ["offer", "offer-summary", "offer-complete"].includes(exportType);
    const includeSummary = ["summary", "offer", "offer-summary", "offer-complete"].includes(exportType);
    const includeComplete = ["complete", "offer-complete"].includes(exportType);

    // Document title based on type
    const documentTitle = includeOffer ? "OFFERTE" : "BEGROTING";

    // Footer text
    let footerText = "";
    if (user?.companyName) footerText += user.companyName;
    if (user?.kvkNumber) footerText += ` | KvK: ${user.kvkNumber}`;
    if (user?.btwNumber) footerText += ` | BTW: ${user.btwNumber}`;

    // Helper function to add page footer
    const addFooter = () => {
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(footerText, 20, footerY);
      if (user?.ibanNumber) {
        doc.text(`IBAN: ${user.ibanNumber}`, pageWidth - 20, footerY, { align: "right" });
      }
    };

    // Helper function to add page header (for continuation pages)
    const addPageHeader = (title: string) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`${estimate.name} - ${title}`, 20, 15);
      doc.setDrawColor(200);
      doc.line(20, 18, pageWidth - 20, 18);
      return 25;
    };

    let yPos = 20;

    // =============================================
    // COVER PAGE / SUMMARY PAGE
    // =============================================

    // Header - Company Info (right aligned)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(user?.companyName || "OpenCalc", pageWidth - 20, yPos, { align: "right" });
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    if (user?.companyAddress) {
      doc.text(user.companyAddress, pageWidth - 20, yPos, { align: "right" });
      yPos += 4;
    }
    if (user?.companyPostalCode || user?.companyCity) {
      doc.text(`${user.companyPostalCode || ""} ${user.companyCity || ""}`.trim(), pageWidth - 20, yPos, { align: "right" });
      yPos += 4;
    }
    if (user?.companyPhone) {
      doc.text(`Tel: ${user.companyPhone}`, pageWidth - 20, yPos, { align: "right" });
      yPos += 4;
    }
    if (user?.companyEmail) {
      doc.text(user.companyEmail, pageWidth - 20, yPos, { align: "right" });
    }

    // Title
    yPos = 50;
    doc.setTextColor(0, 102, 204); // Blue
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(documentTitle, pageWidth - 20, yPos, { align: "right" });

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Datum: ${formatDate(new Date())}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 5;
    if (estimate.project.projectNumber) {
      doc.text(`Projectnr: ${estimate.project.projectNumber}`, pageWidth - 20, yPos, { align: "right" });
      yPos += 5;
    }
    doc.text(`Versie: ${estimate.version}`, pageWidth - 20, yPos, { align: "right" });

    // Horizontal line
    yPos = 75;
    doc.setDrawColor(200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Client Info (left) and Project Info (right)
    yPos = 85;
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("OPDRACHTGEVER", 20, yPos);
    doc.text("PROJECTLOCATIE", pageWidth / 2 + 10, yPos);

    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    // Client details
    let clientYPos = yPos;
    if (estimate.project.client) {
      doc.setFont("helvetica", "bold");
      doc.text(estimate.project.client.name, 20, clientYPos);
      doc.setFont("helvetica", "normal");
      clientYPos += 5;
      if (estimate.project.client.contactPerson) {
        doc.text(`t.a.v. ${estimate.project.client.contactPerson}`, 20, clientYPos);
        clientYPos += 5;
      }
      if (estimate.project.client.address) {
        doc.text(estimate.project.client.address, 20, clientYPos);
        clientYPos += 5;
      }
      if (estimate.project.client.postalCode || estimate.project.client.city) {
        doc.text(`${estimate.project.client.postalCode || ""} ${estimate.project.client.city || ""}`.trim(), 20, clientYPos);
      }
    } else {
      doc.setTextColor(150);
      doc.text("Geen opdrachtgever gekoppeld", 20, clientYPos);
    }

    // Project details (right column)
    let projectYPos = yPos;
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(estimate.project.name, pageWidth / 2 + 10, projectYPos);
    doc.setFont("helvetica", "normal");
    projectYPos += 5;
    if (estimate.project.address) {
      doc.text(estimate.project.address, pageWidth / 2 + 10, projectYPos);
      projectYPos += 5;
    }
    if (estimate.project.postalCode || estimate.project.city) {
      doc.text(`${estimate.project.postalCode || ""} ${estimate.project.city || ""}`.trim(), pageWidth / 2 + 10, projectYPos);
    }

    // Estimate name and description
    yPos = 125;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(estimate.name, 20, yPos);

    if (estimate.description) {
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(estimate.description, 20, yPos);
    }

    // =============================================
    // SUMMARY TABLE (Chapter totals)
    // =============================================
    if (includeSummary) {
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text("SAMENVATTING PER HOOFDSTUK", 20, yPos);

      // Table header
      yPos += 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 4, pageWidth - 40, 8, "F");
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Code", 25, yPos);
      doc.text("Omschrijving", 45, yPos);
      doc.text("Uren", 130, yPos, { align: "right" });
      doc.text("Bedrag", pageWidth - 25, yPos, { align: "right" });

      // Table rows
      yPos += 8;
      doc.setFont("helvetica", "normal");

      let totalHours = 0;
      for (const chapter of estimate.chapters) {
        const chapterTotal = chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0);
        const chapterHours = chapter.lines.reduce((sum, line) => sum + (line.laborHours * line.quantity), 0);
        totalHours += chapterHours;

        doc.setDrawColor(230);
        doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);

        doc.text(chapter.code, 25, yPos);
        doc.text(chapter.name.substring(0, 40), 45, yPos);
        doc.text(chapterHours.toFixed(1), 130, yPos, { align: "right" });
        doc.text(formatCurrency(chapterTotal), pageWidth - 25, yPos, { align: "right" });

        yPos += 7;

        if (yPos > 260) {
          addFooter();
          doc.addPage();
          yPos = addPageHeader("Samenvatting");
        }
      }

      // Add unassigned lines total if any
      if (estimate.lines && estimate.lines.length > 0) {
        const unassignedTotal = estimate.lines.reduce((sum, line) => sum + line.totalPrice, 0);
        const unassignedHours = estimate.lines.reduce((sum, line) => sum + (line.laborHours * line.quantity), 0);
        totalHours += unassignedHours;
        doc.setDrawColor(230);
        doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
        doc.text("-", 25, yPos);
        doc.text("Overige posten", 45, yPos);
        doc.text(unassignedHours.toFixed(1), 130, yPos, { align: "right" });
        doc.text(formatCurrency(unassignedTotal), pageWidth - 25, yPos, { align: "right" });
        yPos += 7;
      }

      // Subtotal row
      yPos += 3;
      doc.setDrawColor(200);
      doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);
      doc.setFont("helvetica", "bold");
      doc.text("Subtotaal", 45, yPos + 3);
      doc.text(totalHours.toFixed(1), 130, yPos + 3, { align: "right" });
      doc.text(formatCurrency(estimate.subtotal), pageWidth - 25, yPos + 3, { align: "right" });
    }

    // =============================================
    // TOTALS SUMMARY BOX
    // =============================================
    yPos += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const summaryHeight = 50 +
      (estimate.generalCostsPercent > 0 ? 7 : 0) +
      (estimate.profitPercent > 0 ? 7 : 0) +
      (estimate.riskPercent > 0 ? 7 : 0);

    doc.setFillColor(248, 248, 248);
    doc.rect(pageWidth / 2, yPos - 5, pageWidth / 2 - 20, summaryHeight, "F");

    const labelX = pageWidth / 2 + 10;
    const valueX = pageWidth - 25;

    doc.text("Subtotaal", labelX, yPos);
    doc.text(formatCurrency(estimate.subtotal), valueX, yPos, { align: "right" });
    yPos += 7;

    if (estimate.generalCostsPercent > 0) {
      doc.text(`Algemene kosten (${estimate.generalCostsPercent}%)`, labelX, yPos);
      doc.text(formatCurrency(estimate.generalCostsAmount), valueX, yPos, { align: "right" });
      yPos += 7;
    }

    if (estimate.profitPercent > 0) {
      doc.text(`Winst & risico (${estimate.profitPercent}%)`, labelX, yPos);
      doc.text(formatCurrency(estimate.profitAmount), valueX, yPos, { align: "right" });
      yPos += 7;
    }

    if (estimate.riskPercent > 0) {
      doc.text(`Onvoorzien (${estimate.riskPercent}%)`, labelX, yPos);
      doc.text(formatCurrency(estimate.riskAmount), valueX, yPos, { align: "right" });
      yPos += 7;
    }

    yPos += 3;
    doc.setDrawColor(180);
    doc.line(labelX, yPos - 2, valueX, yPos - 2);

    doc.setFont("helvetica", "bold");
    doc.text("Totaal excl. BTW", labelX, yPos + 3);
    doc.text(formatCurrency(estimate.totalExclVat), valueX, yPos + 3, { align: "right" });
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.text(`BTW (${estimate.vatPercent}%)`, labelX, yPos);
    doc.text(formatCurrency(estimate.vatAmount), valueX, yPos, { align: "right" });
    yPos += 7;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(labelX, yPos, valueX, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Totaal incl. BTW", labelX, yPos);
    doc.text(formatCurrency(estimate.totalInclVat), valueX, yPos, { align: "right" });

    addFooter();

    // =============================================
    // COMPLETE ESTIMATE (All line details)
    // =============================================
    if (includeComplete) {
      doc.addPage();
      yPos = 20;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 204);
      doc.text("Gedetailleerde Begroting", 20, yPos);
      yPos += 15;

      for (const chapter of estimate.chapters) {
        // Calculate chapter stats
        const chapterTotal = chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0);
        const chapterHours = chapter.lines.reduce((sum, line) => sum + (line.laborHours * line.quantity), 0);

        // Check if chapter fits on page, if not start new page
        const estimatedChapterHeight = 15 + (chapter.lines.length * 10);
        if (yPos > 240 || (yPos + Math.min(estimatedChapterHeight, 60) > 270)) {
          addFooter();
          doc.addPage();
          yPos = addPageHeader("Gedetailleerde Begroting");
        }

        // Chapter header with background
        doc.setFillColor(230, 240, 250);
        doc.rect(20, yPos - 5, pageWidth - 40, 10, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`${chapter.code} ${chapter.name}`, 25, yPos);

        // Chapter totals (hours and amount)
        doc.setFontSize(9);
        doc.text(`${chapterHours.toFixed(1)} uur`, 140, yPos, { align: "right" });
        doc.setFontSize(11);
        doc.text(formatCurrency(chapterTotal), pageWidth - 25, yPos, { align: "right" });
        yPos += 12;

        // Table header for lines - improved column positions
        // Columns: Code(20-35), Omschrijving(37-95), Aantal(97-112), Eenh(114-125), Prijs(127-155), Totaal(157-190)
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("Code", 22, yPos);
        doc.text("Omschrijving", 37, yPos);
        doc.text("Aantal", 112, yPos, { align: "right" });
        doc.text("Eenh.", 116, yPos);
        doc.text("Prijs/eenh.", 155, yPos, { align: "right" });
        doc.text("Totaal", pageWidth - 22, yPos, { align: "right" });
        yPos += 5;

        doc.setDrawColor(200);
        doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);

        // Lines
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);

        for (const line of chapter.lines) {
          if (yPos > 270) {
            addFooter();
            doc.addPage();
            yPos = addPageHeader("Gedetailleerde Begroting");
          }

          doc.setFontSize(8);
          doc.text(line.code || "-", 22, yPos);
          // Truncate description to fit column width
          const maxDescLength = 35;
          const truncatedDesc = line.description.length > maxDescLength
            ? line.description.substring(0, maxDescLength) + "..."
            : line.description;
          doc.text(truncatedDesc, 37, yPos);
          doc.text(line.quantity.toString(), 112, yPos, { align: "right" });
          doc.text(line.unit, 116, yPos);
          doc.text(formatCurrency(line.unitPrice), 155, yPos, { align: "right" });
          doc.text(formatCurrency(line.totalPrice), pageWidth - 22, yPos, { align: "right" });
          yPos += 5;

          // Show cost breakdown if significant
          if (line.laborCost > 0 || line.materialCost > 0) {
            doc.setFontSize(7);
            doc.setTextColor(120);
            let breakdown = "";
            if (line.laborCost > 0) breakdown += `Arbeid: ${formatCurrency(line.laborCost)}`;
            if (line.materialCost > 0) breakdown += `${breakdown ? " | " : ""}Materiaal: ${formatCurrency(line.materialCost)}`;
            if (line.equipmentCost > 0) breakdown += `${breakdown ? " | " : ""}Materieel: ${formatCurrency(line.equipmentCost)}`;
            doc.text(breakdown, 37, yPos);
            doc.setTextColor(0);
            yPos += 4;
          }
        }

        yPos += 5;
      }

      // Unassigned lines
      if (estimate.lines && estimate.lines.length > 0) {
        if (yPos > 240) {
          addFooter();
          doc.addPage();
          yPos = addPageHeader("Gedetailleerde Begroting");
        }

        doc.setFillColor(230, 240, 250);
        doc.rect(20, yPos - 4, pageWidth - 40, 8, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Overige posten", 25, yPos);

        const unassignedTotal = estimate.lines.reduce((sum, line) => sum + line.totalPrice, 0);
        doc.text(formatCurrency(unassignedTotal), pageWidth - 25, yPos, { align: "right" });
        yPos += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        for (const line of estimate.lines) {
          if (yPos > 270) {
            addFooter();
            doc.addPage();
            yPos = addPageHeader("Gedetailleerde Begroting");
          }

          doc.text(line.code || "-", 22, yPos);
          const maxDescLength = 35;
          const truncatedDesc = line.description.length > maxDescLength
            ? line.description.substring(0, maxDescLength) + "..."
            : line.description;
          doc.text(truncatedDesc, 37, yPos);
          doc.text(line.quantity.toString(), 112, yPos, { align: "right" });
          doc.text(line.unit, 116, yPos);
          doc.text(formatCurrency(line.unitPrice), 155, yPos, { align: "right" });
          doc.text(formatCurrency(line.totalPrice), pageWidth - 22, yPos, { align: "right" });
          yPos += 5;
        }
      }

      addFooter();
    }

    // =============================================
    // OFFER SPECIFICATION PAGE
    // =============================================
    if (includeOffer) {
      const hasSpecification =
        estimate.offerWorkDescription ||
        estimate.offerMaterials ||
        estimate.offerEquipment ||
        estimate.offerExclusions ||
        estimate.offerExtraWorkTerms ||
        estimate.offerPaymentTerms ||
        estimate.offerPlanningNotes;

      if (hasSpecification) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 102, 204);
        doc.text("Offertespecificatie", 20, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Behorend bij offerte ${estimate.project.projectNumber || `versie ${estimate.version}`}`, 20, yPos);

        yPos += 10;
        doc.setDrawColor(200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // Helper function to add a section
        const addSection = (title: string, content: string | null, isList: boolean = true) => {
          if (!content) return;

          if (yPos > 250) {
            addFooter();
            doc.addPage();
            yPos = addPageHeader("Offertespecificatie");
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0);
          doc.text(title, 20, yPos);
          yPos += 6;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60);

          if (isList) {
            const lines = content.split("\n").filter(line => line.trim());
            for (const line of lines) {
              if (yPos > 270) {
                addFooter();
                doc.addPage();
                yPos = addPageHeader("Offertespecificatie");
              }
              doc.text(`•  ${line.trim()}`, 25, yPos);
              yPos += 5;
            }
          } else {
            const splitText = doc.splitTextToSize(content, pageWidth - 50);
            for (const line of splitText) {
              if (yPos > 270) {
                addFooter();
                doc.addPage();
                yPos = addPageHeader("Offertespecificatie");
              }
              doc.text(line, 25, yPos);
              yPos += 5;
            }
          }
          yPos += 5;
        };

        // Intro text
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);
        doc.text("Tot de genoemde offerte behoren de hieronder omschreven werkzaamheden en toe te passen materialen.", 20, yPos);
        yPos += 10;

        if (estimate.offerWorkDescription) {
          addSection("De uit te voeren werkzaamheden bestaan uit", estimate.offerWorkDescription);
        }

        if (estimate.offerMaterials) {
          addSection("Ten tijde van de montage worden de volgende materialen toegepast", estimate.offerMaterials);
        }

        if (estimate.offerEquipment) {
          addSection("Ten tijde van de montage wordt het volgende materieel toegepast", estimate.offerEquipment);
        }

        if (estimate.offerExclusions) {
          addSection("De offerte is exclusief", estimate.offerExclusions);
        }

        if (estimate.offerExtraWorkTerms || estimate.offerExtraWorkRate) {
          if (yPos > 250) {
            addFooter();
            doc.addPage();
            yPos = addPageHeader("Offertespecificatie");
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0);
          doc.text("Meerwerk en aanvullende kosten", 20, yPos);
          yPos += 6;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60);

          if (estimate.offerExtraWorkTerms) {
            const splitText = doc.splitTextToSize(estimate.offerExtraWorkTerms, pageWidth - 50);
            for (const line of splitText) {
              if (yPos > 270) {
                addFooter();
                doc.addPage();
                yPos = addPageHeader("Offertespecificatie");
              }
              doc.text(line, 25, yPos);
              yPos += 5;
            }
          }

          if (estimate.offerExtraWorkRate) {
            yPos += 2;
            doc.text(`Uurtarief meerwerk: ${formatCurrency(estimate.offerExtraWorkRate)} (exclusief BTW)`, 25, yPos);
            yPos += 5;
          }
          yPos += 5;
        }

        if (estimate.offerPaymentTerms) {
          addSection("Betalingsvoorwaarden", estimate.offerPaymentTerms);
        }

        if (estimate.offerPlanningNotes || estimate.offerValidityWeeks) {
          if (yPos > 250) {
            addFooter();
            doc.addPage();
            yPos = addPageHeader("Offertespecificatie");
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0);
          doc.text("Planning en geldigheid", 20, yPos);
          yPos += 6;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60);

          doc.text(`•  Geldigheid offerte: ${estimate.offerValidityWeeks} weken`, 25, yPos);
          yPos += 5;

          if (estimate.offerPlanningNotes) {
            const lines = estimate.offerPlanningNotes.split("\n").filter(line => line.trim());
            for (const line of lines) {
              doc.text(`•  ${line.trim()}`, 25, yPos);
              yPos += 5;
            }
          }
        }

        addFooter();
      }
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Create filename based on type
    const safeName = estimate.project.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    const typeLabel = {
      complete: "begroting_compleet",
      summary: "begroting_samenvatting",
      offer: "offerte",
      "offer-summary": "offerte_met_samenvatting",
      "offer-complete": "offerte_compleet",
    }[exportType] || "begroting";

    const filename = `${safeName}_${typeLabel}_v${estimate.version}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het exporteren" },
      { status: 500 }
    );
  }
}
