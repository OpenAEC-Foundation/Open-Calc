import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsPDF } from "jspdf";

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
    let yPos = 20;

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
    doc.text("OFFERTE", pageWidth - 20, yPos, { align: "right" });

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

    // Chapter Summary - Simple table without autoTable
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
    doc.text("Omschrijving", 50, yPos);
    doc.text("Bedrag", pageWidth - 25, yPos, { align: "right" });

    // Table rows
    yPos += 8;
    doc.setFont("helvetica", "normal");

    for (const chapter of estimate.chapters) {
      const chapterTotal = chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0);

      doc.setDrawColor(230);
      doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);

      doc.text(chapter.code, 25, yPos);
      doc.text(chapter.name.substring(0, 50), 50, yPos);
      doc.text(formatCurrency(chapterTotal), pageWidth - 25, yPos, { align: "right" });

      yPos += 7;

      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
    }

    // Add unassigned lines total if any
    if (estimate.lines && estimate.lines.length > 0) {
      const unassignedTotal = estimate.lines.reduce((sum, line) => sum + line.totalPrice, 0);
      doc.setDrawColor(230);
      doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
      doc.text("-", 25, yPos);
      doc.text("Overige posten", 50, yPos);
      doc.text(formatCurrency(unassignedTotal), pageWidth - 25, yPos, { align: "right" });
      yPos += 7;
    }

    // Subtotal row
    yPos += 3;
    doc.setDrawColor(200);
    doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);
    doc.setFont("helvetica", "bold");
    doc.text("Subtotaal", 50, yPos + 3);
    doc.text(formatCurrency(estimate.subtotal), pageWidth - 25, yPos + 3, { align: "right" });

    // Summary Section
    yPos += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Background for summary
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

    // Total line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(labelX, yPos, valueX, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Totaal incl. BTW", labelX, yPos);
    doc.text(formatCurrency(estimate.totalInclVat), valueX, yPos, { align: "right" });

    // Footer on first page
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);

    let footerText = "";
    if (user?.companyName) footerText += user.companyName;
    if (user?.kvkNumber) footerText += ` | KvK: ${user.kvkNumber}`;
    if (user?.btwNumber) footerText += ` | BTW: ${user.btwNumber}`;
    doc.text(footerText, 20, footerY);

    if (user?.ibanNumber) {
      doc.text(`IBAN: ${user.ibanNumber}`, pageWidth - 20, footerY, { align: "right" });
    }

    // =============================================
    // PAGE 2: OFFERTESPECIFICATIE
    // =============================================
    // Only add if any specification fields are filled
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

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 204);
      doc.text("Offertespecificatie", 20, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Behorend bij offerte ${estimate.project.projectNumber || estimate.version}`, 20, yPos);

      yPos += 10;
      doc.setDrawColor(200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Helper function to add a section
      const addSection = (title: string, content: string | null, isList: boolean = true) => {
        if (!content) return;

        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
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
          // Split by newlines and add bullet points
          const lines = content.split("\n").filter(line => line.trim());
          for (const line of lines) {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`•  ${line.trim()}`, 25, yPos);
            yPos += 5;
          }
        } else {
          // Regular paragraph text - wrap long lines
          const splitText = doc.splitTextToSize(content, pageWidth - 50);
          for (const line of splitText) {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
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

      // Work description
      if (estimate.offerWorkDescription) {
        addSection("De uit te voeren werkzaamheden bestaan uit", estimate.offerWorkDescription);
      }

      // Materials
      if (estimate.offerMaterials) {
        addSection("Ten tijde van de montage worden de volgende materialen toegepast", estimate.offerMaterials);
      }

      // Equipment
      if (estimate.offerEquipment) {
        addSection("Ten tijde van de montage wordt het volgende materieel toegepast", estimate.offerEquipment);
      }

      // Exclusions
      if (estimate.offerExclusions) {
        addSection("De offerte is exclusief", estimate.offerExclusions);
      }

      // Extra work / Meerwerk
      if (estimate.offerExtraWorkTerms || estimate.offerExtraWorkRate) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
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
              doc.addPage();
              yPos = 20;
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

      // Payment terms
      if (estimate.offerPaymentTerms) {
        addSection("Betalingsvoorwaarden", estimate.offerPaymentTerms);
      }

      // Planning
      if (estimate.offerPlanningNotes || estimate.offerValidityWeeks) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Planning", 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);

        doc.text(`•  Geldigheid offerte betreft ${estimate.offerValidityWeeks} weken`, 25, yPos);
        yPos += 5;

        if (estimate.offerPlanningNotes) {
          const lines = estimate.offerPlanningNotes.split("\n").filter(line => line.trim());
          for (const line of lines) {
            doc.text(`•  ${line.trim()}`, 25, yPos);
            yPos += 5;
          }
        }
      }

      // Footer on specification page
      const specFooterY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(footerText, 20, specFooterY);
      if (user?.ibanNumber) {
        doc.text(`IBAN: ${user.ibanNumber}`, pageWidth - 20, specFooterY, { align: "right" });
      }
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Create filename
    const safeName = estimate.project.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const filename = `${safeName}_offerte_v${estimate.version}.pdf`;

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
