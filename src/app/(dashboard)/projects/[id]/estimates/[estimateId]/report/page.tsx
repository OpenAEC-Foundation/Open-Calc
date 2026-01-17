import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Settings } from "lucide-react";
import { ReportPreview } from "./report-preview";

async function getEstimate(estimateId: string, projectId: string, userId: string) {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      projectId,
      project: { userId },
    },
    include: {
      project: {
        include: {
          client: true,
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

  return estimate;
}

async function getUserSettings(userId: string) {
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

  return user;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string; estimateId: string }>;
}) {
  const session = await auth();
  const { id: projectId, estimateId } = await params;

  if (!session?.user?.id) {
    return null;
  }

  const [estimate, userSettings] = await Promise.all([
    getEstimate(estimateId, projectId, session.user.id),
    getUserSettings(session.user.id),
  ]);

  if (!estimate) {
    notFound();
  }

  // Calculate totals
  const allLines = [
    ...estimate.lines,
    ...estimate.chapters.flatMap((c) => c.lines),
  ];

  const calculatedTotals = {
    labor: allLines.reduce((sum, line) => sum + (line.laborCost * line.quantity), 0),
    material: allLines.reduce((sum, line) => sum + (line.materialCost * line.quantity), 0),
    equipment: allLines.reduce((sum, line) => sum + (line.equipmentCost * line.quantity), 0),
    subcontr: allLines.reduce((sum, line) => sum + (line.subcontrCost * line.quantity), 0),
  };

  const subtotal =
    calculatedTotals.labor +
    calculatedTotals.material +
    calculatedTotals.equipment +
    calculatedTotals.subcontr;

  const generalCosts = subtotal * (estimate.generalCostsPercent / 100);
  const profit = (subtotal + generalCosts) * (estimate.profitPercent / 100);
  const risk = (subtotal + generalCosts + profit) * (estimate.riskPercent / 100);
  const totalExclVat = subtotal + generalCosts + profit + risk;
  const vat = totalExclVat * (estimate.vatPercent / 100);
  const totalInclVat = totalExclVat + vat;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}/estimates/${estimateId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Rapportvoorbeeld</h1>
            <p className="text-sm text-muted-foreground">{estimate.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Bedrijfsinstellingen
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Printen
          </Button>
          <Button asChild>
            <Link href={`/api/projects/${projectId}/estimates/${estimateId}/export/pdf`}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <ReportPreview
        estimate={estimate}
        company={userSettings}
        totals={{
          ...calculatedTotals,
          subtotal,
          generalCosts,
          profit,
          risk,
          totalExclVat,
          vat,
          totalInclVat,
        }}
      />
    </div>
  );
}
