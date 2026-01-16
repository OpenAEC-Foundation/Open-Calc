import { auth } from "@/lib/auth";
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
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { projectCount, estimateCount, recentProjects } = await getDashboardStats(
    session.user.id
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom terug, {session.user.name?.split(" ")[0] || "gebruiker"}!
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projecten</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">
              Totaal aantal projecten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Begrotingen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimateCount}</div>
            <p className="text-xs text-muted-foreground">
              Totaal aantal begrotingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bibliotheek</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Beschikbare bibliotheken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actief</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentProjects.filter((p) => p.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Actieve projecten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Projects */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Snelle acties</CardTitle>
            <CardDescription>
              Begin direct met je meest voorkomende taken
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Nieuw project aanmaken
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/library">
                <Library className="mr-2 h-4 w-4" />
                Kostenbibliotheek bekijken
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/projects">
                <FolderOpen className="mr-2 h-4 w-4" />
                Alle projecten bekijken
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recente projecten</CardTitle>
            <CardDescription>
              Je laatst bewerkte projecten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FolderOpen className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Nog geen projecten</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/projects/new">Maak je eerste project aan</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {project.client?.name || "Geen klant"} &middot;{" "}
                        {project._count.estimates} begroting(en)
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
