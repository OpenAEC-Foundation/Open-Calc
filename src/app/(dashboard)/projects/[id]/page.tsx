import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  Pencil,
  MoreHorizontal,
  FileText,
  MapPin,
  User,
  Calendar,
  Building2,
  Copy,
  Trash2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  ACTIVE: "Actief",
  COMPLETED: "Afgerond",
  CANCELLED: "Geannuleerd",
};

const estimateStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

const estimateStatusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
};

async function getProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      client: true,
      estimates: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return project;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return null;
  }

  const project = await getProject(id, session.user.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.projectNumber && (
              <p className="text-muted-foreground">#{project.projectNumber}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/projects/${project.id}/estimates/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe begroting
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Location Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.address || project.city ? (
              <div className="text-sm">
                {project.address && <p>{project.address}</p>}
                {(project.postalCode || project.city) && (
                  <p>
                    {project.postalCode} {project.city}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen adres opgegeven</p>
            )}
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Klant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.client ? (
              <div className="text-sm">
                <p className="font-medium">{project.client.name}</p>
                {project.client.contactPerson && (
                  <p className="text-muted-foreground">{project.client.contactPerson}</p>
                )}
                {project.client.email && (
                  <p className="text-muted-foreground">{project.client.email}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Geen klant gekoppeld</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}/edit`}>Klant koppelen</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {project.startDate ? (
                <p>
                  <span className="text-muted-foreground">Start:</span>{" "}
                  {formatDate(project.startDate)}
                </p>
              ) : null}
              {project.endDate ? (
                <p>
                  <span className="text-muted-foreground">Einde:</span>{" "}
                  {formatDate(project.endDate)}
                </p>
              ) : null}
              {!project.startDate && !project.endDate && (
                <p className="text-muted-foreground">Geen planning opgegeven</p>
              )}
              <p className="text-muted-foreground pt-2">
                Aangemaakt: {formatDate(project.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Omschrijving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Estimates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Begrotingen</CardTitle>
              <CardDescription>
                {project.estimates.length === 0
                  ? "Nog geen begrotingen voor dit project"
                  : `${project.estimates.length} begroting(en)`}
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/projects/${project.id}/estimates/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe begroting
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.estimates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nog geen begrotingen</h3>
              <p className="text-muted-foreground text-center mb-4">
                Maak je eerste begroting aan voor dit project.
              </p>
              <Button asChild>
                <Link href={`/projects/${project.id}/estimates/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Eerste begroting aanmaken
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Versie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Excl. BTW</TableHead>
                    <TableHead className="text-right">Incl. BTW</TableHead>
                    <TableHead>Gewijzigd</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.estimates.map((estimate) => (
                    <TableRow key={estimate.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}/estimates/${estimate.id}`}
                          className="font-medium hover:underline"
                        >
                          {estimate.name}
                        </Link>
                        {estimate.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {estimate.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>v{estimate.version}</TableCell>
                      <TableCell>
                        <Badge className={estimateStatusColors[estimate.status]}>
                          {estimateStatusLabels[estimate.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(estimate.totalExclVat)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(estimate.totalInclVat)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(estimate.updatedAt).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}/estimates/${estimate.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Openen
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}/estimates/${estimate.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Bewerken
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Dupliceren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
