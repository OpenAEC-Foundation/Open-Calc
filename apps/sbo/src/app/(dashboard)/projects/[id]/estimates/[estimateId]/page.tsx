import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileText,
  Calculator,
  Download,
  FileSpreadsheet,
  Box,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateEditor } from "./estimate-editor";
import { EstimateSettings } from "./estimate-settings";
import { EstimateVersions } from "./estimate-versions";
import { OfferSpecification } from "./offer-specification";
import { EstimateHeader } from "./estimate-header";

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

async function getVersions(estimateName: string, projectId: string, userId: string) {
  const versions = await prisma.estimate.findMany({
    where: {
      projectId,
      name: estimateName,
      project: { userId },
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      status: true,
      createdAt: true,
    },
  });

  return versions;
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
  const userId = await getDefaultUserId();
  const { id: projectId, estimateId } = await params;

  const estimate = await getEstimate(estimateId, projectId, userId);

  if (!estimate) {
    notFound();
  }

  // Get all versions of this estimate
  const versions = await getVersions(estimate.name, projectId, userId);

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
            <EstimateHeader
              estimateId={estimateId}
              projectId={projectId}
              name={estimate.name}
              status={estimate.status}
            />
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Link href={`/projects/${projectId}`} className="hover:underline">
                {estimate.project.name}
              </Link>
              {estimate.project.projectNumber && (
                <span>&middot; #{estimate.project.projectNumber}</span>
              )}
              <span>&middot;</span>
              <EstimateVersions
                estimateId={estimateId}
                projectId={projectId}
                currentVersion={estimate.version}
                versions={versions.map((v) => ({
                  ...v,
                  createdAt: v.createdAt.toISOString(),
                }))}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/estimates/${estimateId}/report`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporteren
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Exportformaat</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/api/projects/${projectId}/estimates/${estimateId}/export/pdf`}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF Exporteren
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/api/projects/${projectId}/estimates/${estimateId}/export/ods`}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  ODS Spreadsheet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/api/projects/${projectId}/estimates/${estimateId}/export/ifc`}>
                  <Box className="mr-2 h-4 w-4" />
                  IFC (BIM)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <OfferSpecification
            estimateId={estimateId}
            projectId={projectId}
            initialData={{
              offerWorkDescription: estimate.offerWorkDescription ?? null,
              offerMaterials: estimate.offerMaterials ?? null,
              offerEquipment: estimate.offerEquipment ?? null,
              offerExclusions: estimate.offerExclusions ?? null,
              offerExtraWorkRate: estimate.offerExtraWorkRate ?? null,
              offerExtraWorkTerms: estimate.offerExtraWorkTerms ?? null,
              offerPaymentTerms: estimate.offerPaymentTerms ?? null,
              offerValidityWeeks: estimate.offerValidityWeeks ?? 4,
              offerPlanningNotes: estimate.offerPlanningNotes ?? null,
            }}
          />
          <EstimateSettings
            estimateId={estimateId}
            projectId={projectId}
            initialData={{
              generalCostsPercent: estimate.generalCostsPercent,
              profitPercent: estimate.profitPercent,
              riskPercent: estimate.riskPercent,
              vatPercent: estimate.vatPercent,
              notes: estimate.notes,
            }}
          />
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
