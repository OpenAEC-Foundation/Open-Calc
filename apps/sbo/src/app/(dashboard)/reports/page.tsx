"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Euro,
  Users,
  FolderKanban,
  Clock,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  budget?: number;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalActual: number;
  totalHours: number;
  totalInvoiced: number;
  totalPaid: number;
  openInvoices: number;
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    totalActual: 0,
    totalHours: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    openInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      let totalHours = 0;
      let totalInvoiced = 0;
      let totalPaid = 0;
      let openInvoices = 0;
      let totalActual = 0;

      for (const project of projectsData) {
        try {
          const timeRes = await fetch(`/api/projects/${project.id}/time-entries`);
          if (timeRes.ok) {
            const timeData = await timeRes.json();
            totalHours += timeData.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);
          }
        } catch {
          // Skip
        }

        try {
          const invoicesRes = await fetch(`/api/projects/${project.id}/invoices`);
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            for (const inv of invoicesData) {
              totalInvoiced += inv.total;
              if (inv.status === "PAID") totalPaid += inv.total;
              else if (inv.status === "SENT" || inv.status === "OVERDUE") openInvoices++;
            }
          }
        } catch {
          // Skip
        }

        try {
          const costsRes = await fetch(`/api/projects/${project.id}/actual-costs`);
          if (costsRes.ok) {
            const costsData = await costsRes.json();
            totalActual += costsData.reduce((sum: number, c: { actualAmount: number }) => sum + c.actualAmount, 0);
          }
        } catch {
          // Skip
        }
      }

      const totalBudget = projectsData.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);

      setStats({
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter((p: Project) => p.status === "IN_PROGRESS").length,
        totalBudget,
        totalActual,
        totalHours,
        totalInvoiced,
        totalPaid,
        openInvoices,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const budgetUsagePercent = stats.totalBudget > 0 ? (stats.totalActual / stats.totalBudget) * 100 : 0;
  const invoicedPercent = stats.totalInvoiced > 0 ? (stats.totalPaid / stats.totalInvoiced) * 100 : 0;

  const reports = [
    { title: "Projectoverzicht", description: "Volledig overzicht van alle projecten", icon: FolderKanban },
    { title: "Financieel rapport", description: "Omzet, kosten en winstmarge", icon: Euro },
    { title: "Urenrapport", description: "Overzicht van geregistreerde uren", icon: Clock },
    { title: "Facturatieoverzicht", description: "Status van alle facturen", icon: FileText },
    { title: "Nacalculatie rapport", description: "Begroot vs werkelijk", icon: BarChart3 },
    { title: "Klantenrapport", description: "Omzet en projecten per klant", icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapportages & KPIs</h1>
          <p className="text-muted-foreground">Inzicht in bedrijfsprestaties</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Deze week</SelectItem>
            <SelectItem value="month">Deze maand</SelectItem>
            <SelectItem value="quarter">Dit kwartaal</SelectItem>
            <SelectItem value="year">Dit jaar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve projecten</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">van {stats.totalProjects} totaal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gefactureerd</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">EUR {stats.totalInvoiced.toLocaleString("nl-NL")}</div>
            <p className="text-xs text-muted-foreground">EUR {stats.totalPaid.toLocaleString("nl-NL")} ontvangen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">uren totaal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open facturen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openInvoices}</div>
            <p className="text-xs text-muted-foreground">EUR {(stats.totalInvoiced - stats.totalPaid).toLocaleString("nl-NL")} open</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {budgetUsagePercent <= 100 ? <TrendingDown className="h-5 w-5 text-green-600" /> : <TrendingUp className="h-5 w-5 text-red-600" />}
              Budgetgebruik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verbruikt</span>
                <span className={budgetUsagePercent > 100 ? "text-red-600" : "text-green-600"}>{budgetUsagePercent.toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(budgetUsagePercent, 100)} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Budget</span><div className="font-medium">EUR {stats.totalBudget.toLocaleString("nl-NL")}</div></div>
              <div><span className="text-muted-foreground">Werkelijk</span><div className="font-medium">EUR {stats.totalActual.toLocaleString("nl-NL")}</div></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5" />Facturatie voortgang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Betaald</span>
                <span className="text-green-600">{invoicedPercent.toFixed(0)}%</span>
              </div>
              <Progress value={invoicedPercent} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Gefactureerd</span><div className="font-medium">EUR {stats.totalInvoiced.toLocaleString("nl-NL")}</div></div>
              <div><span className="text-muted-foreground">Ontvangen</span><div className="font-medium text-green-600">EUR {stats.totalPaid.toLocaleString("nl-NL")}</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beschikbare rapporten</CardTitle>
          <CardDescription>Genereer gedetailleerde rapporten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.title} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1">
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                      <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
