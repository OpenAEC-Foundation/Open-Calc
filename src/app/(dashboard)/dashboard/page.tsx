import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Library, Plus, TrendingUp } from "lucide-react";

async function getDashboardStats(userId: string) {
  const [projectCount, estimateCount, recentProjects] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.estimate.count({
      where: { project: { userId } },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { estimates: true } },
        client: { select: { name: true } },
      },
    }),
  ]);

  return { projectCount, estimateCount, recentProjects };
}

export default async function DashboardPage() {
  const userId = await getDefaultUserId();

  const { projectCount, estimateCount, recentProjects } = await getDashboardStats(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom bij OpenCalc!
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw project
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Projecten</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <FolderOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectCount}</div>
            <p className="text-xs text-blue-100 mt-1">
              Totaal aantal projecten
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Begrotingen</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estimateCount}</div>
            <p className="text-xs text-emerald-100 mt-1">
              Totaal aantal begrotingen
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-100">Bibliotheek</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <Library className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-violet-100 mt-1">
              Beschikbare bibliotheken
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Actief</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {recentProjects.filter((p) => p.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-amber-100 mt-1">
              Actieve projecten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Projects */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Snelle acties</CardTitle>
            <CardDescription>
              Begin direct met je meest voorkomende taken
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start h-12 border-dashed hover:border-blue-300 hover:bg-blue-50/50" asChild>
              <Link href="/projects/new">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 mr-3">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <span>Nieuw project aanmaken</span>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12 border-dashed hover:border-violet-300 hover:bg-violet-50/50" asChild>
              <Link href="/library">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 mr-3">
                  <Library className="h-4 w-4 text-violet-600" />
                </div>
                <span>Kostenbibliotheek bekijken</span>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12 border-dashed hover:border-emerald-300 hover:bg-emerald-50/50" asChild>
              <Link href="/projects">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 mr-3">
                  <FolderOpen className="h-4 w-4 text-emerald-600" />
                </div>
                <span>Alle projecten bekijken</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recente projecten</CardTitle>
            <CardDescription>
              Je laatst bewerkte projecten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">Nog geen projecten</p>
                <p className="text-sm mt-1">Begin met je eerste begroting</p>
                <Button variant="default" size="sm" asChild className="mt-4">
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Project aanmaken
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.client?.name || "Geen klant"} · {project._count.estimates} begroting(en)
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {new Date(project.updatedAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
