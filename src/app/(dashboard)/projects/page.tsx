import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, FileText } from "lucide-react";
import { ProjectCardMenu } from "@/components/project-card-menu";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border border-blue-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  TEMPLATE: "bg-violet-50 text-violet-700 border border-violet-200",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  ACTIVE: "Actief",
  COMPLETED: "Afgerond",
  CANCELLED: "Geannuleerd",
  TEMPLATE: "Template",
};

async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { name: true } },
      _count: { select: { estimates: true } },
    },
  });
}

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const projects = await getProjects(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projecten</h1>
          <p className="text-muted-foreground">
            Beheer al je projecten en begrotingen
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nog geen projecten</h3>
            <p className="text-muted-foreground text-center mb-4">
              Begin met het aanmaken van je eerste project om begrotingen te maken.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Eerste project aanmaken
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className="group hover:shadow-lg transition-all duration-200 hover:border-blue-200 overflow-hidden cursor-pointer h-full">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </CardTitle>
                          {project.projectNumber && (
                            <span className="text-xs text-muted-foreground font-mono">#{project.projectNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ProjectCardMenu projectId={project.id} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {project.client?.name || "Geen klant gekoppeld"}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{project._count.estimates} begroting(en)</span>
                    </div>
                    <Badge variant="outline" className={statusColors[project.status]}>
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>
                  {project.address && (
                    <p className="text-xs text-muted-foreground mt-3 truncate border-t pt-3">
                      {project.address}, {project.city}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
