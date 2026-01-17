import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FolderOpen, Euro } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
  SENT: "bg-blue-50 text-blue-700 border border-blue-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  EXPIRED: "bg-amber-50 text-amber-700 border border-amber-200",
  FINAL: "bg-violet-50 text-violet-700 border border-violet-200",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
  FINAL: "Definitief",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

async function getEstimates(userId: string) {
  return prisma.estimate.findMany({
    where: { project: { userId } },
    orderBy: { updatedAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectNumber: true,
          client: { select: { name: true } },
        },
      },
    },
  });
}

export default async function EstimatesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const estimates = await getEstimates(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Begrotingen</h1>
          <p className="text-muted-foreground">
            Overzicht van al je begrotingen
          </p>
        </div>
      </div>

      {estimates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nog geen begrotingen</h3>
            <p className="text-muted-foreground text-center mb-4">
              Maak eerst een project aan en voeg daar een begroting aan toe.
            </p>
            <Button asChild>
              <Link href="/projects">Ga naar projecten</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {estimates.map((estimate) => (
            <Link
              key={estimate.id}
              href={`/projects/${estimate.project.id}/estimates/${estimate.id}`}
              className="block"
            >
              <Card className="group hover:shadow-lg transition-all duration-200 hover:border-emerald-200 overflow-hidden cursor-pointer h-full">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate group-hover:text-emerald-600 transition-colors">
                            {estimate.name}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground">
                            Versie {estimate.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[estimate.status]}>
                      {statusLabels[estimate.status] || estimate.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {estimate.project.name}
                      {estimate.project.projectNumber && (
                        <span className="font-mono ml-1">#{estimate.project.projectNumber}</span>
                      )}
                    </span>
                  </div>
                  {estimate.project.client?.name && (
                    <CardDescription className="mb-3">
                      {estimate.project.client.name}
                    </CardDescription>
                  )}
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatCurrency(estimate.totalInclVat)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      incl. BTW
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
