import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Pencil,
  FileText,
  Calculator,
  Download,
} from "lucide-react";
import { EstimateEditor } from "./estimate-editor";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
};

async function getEstimate(estimateId: string, projectId: string, userId: string) {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      projectId,
      project: { userId },
    },
    include: {
      project: {
        select: { id: true, name: true, projectNumber: true },
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string; estimateId: string }>;
}) {
  const session = await auth();
  const { id: projectId, estimateId } = await params;

  if (!session?.user?.id) {
    return null;
  }

  const estimate = await getEstimate(estimateId, projectId, session.user.id);

  if (!estimate) {
    notFound();
  }

  // Calculate totals
  const allLines = [
    ...estimate.lines,
    ...estimate.chapters.flatMap((c) => c.lines),
  ];

  const calculatedTotals = {
    labor: allLines.reduce((sum, line) => sum + line.laborCost, 0),
    material: allLines.reduce((sum, line) => sum + line.materialCost, 0),
    equipment: allLines.reduce((sum, line) => sum + line.equipmentCost, 0),
    subcontr: allLines.reduce((sum, line) => sum + line.subcontrCost, 0),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{estimate.name}</h1>
              <Badge className={statusColors[estimate.status]}>
                {statusLabels[estimate.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              <Link href={`/projects/${projectId}`} className="hover:underline">
                {estimate.project.name}
              </Link>
              {estimate.project.projectNumber && (
                <span> &middot; #{estimate.project.projectNumber}</span>
              )}
              <span> &middot; Versie {estimate.version}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporteren
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/estimates/${estimateId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Instellingen
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content - Estimate Lines */}
        <div className="lg:col-span-3 space-y-4">
          <EstimateEditor
            estimateId={estimateId}
            projectId={projectId}
            chapters={estimate.chapters}
            unassignedLines={estimate.lines}
          />
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Kostenoverzicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arbeid</span>
                  <span>{formatCurrency(calculatedTotals.labor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materiaal</span>
                  <span>{formatCurrency(calculatedTotals.material)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materieel</span>
                  <span>{formatCurrency(calculatedTotals.equipment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Onderaanneming</span>
                  <span>{formatCurrency(calculatedTotals.subcontr)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Subtotaal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="space-y-2 text-sm">
                {estimate.generalCostsPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Algemene kosten ({estimate.generalCostsPercent}%)
                    </span>
                    <span>{formatCurrency(generalCosts)}</span>
                  </div>
                )}
                {estimate.profitPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Winst ({estimate.profitPercent}%)
                    </span>
                    <span>{formatCurrency(profit)}</span>
                  </div>
                )}
                {estimate.riskPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Risico ({estimate.riskPercent}%)
                    </span>
                    <span>{formatCurrency(risk)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Totaal excl. BTW</span>
                <span>{formatCurrency(totalExclVat)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  BTW ({estimate.vatPercent}%)
                </span>
                <span>{formatCurrency(vat)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(totalInclVat)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Statistieken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hoofdstukken</span>
                <span>{estimate.chapters.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Regels</span>
                <span>{allLines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Totaal uren</span>
                <span>
                  {allLines.reduce((sum, line) => sum + (line.laborHours * line.quantity), 0).toFixed(1)} u
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
