"use client";

import { TrendingUp, TrendingDown, BarChart3, AlertCircle, CheckCircle, Euro } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Mock data voor demonstratie
const mockProjects = [
  {
    id: "1",
    name: "Badkamer Renovatie Fam. De Vries",
    budgetted: 15528.58,
    actual: 14850.00,
    variance: -678.58,
    variancePercent: -4.4,
    status: "under_budget",
  },
  {
    id: "2",
    name: "Verbouwing Woning Kerkstraat",
    budgetted: 45000.00,
    actual: 48500.00,
    variance: 3500.00,
    variancePercent: 7.8,
    status: "over_budget",
  },
  {
    id: "3",
    name: "Dakisolatie Appartementencomplex",
    budgetted: 28000.00,
    actual: 27200.00,
    variance: -800.00,
    variancePercent: -2.9,
    status: "under_budget",
  },
];

const categoryAnalysis = [
  { category: "Materiaal", budgetted: 8500, actual: 8200, variance: -300 },
  { category: "Arbeid", budgetted: 5500, actual: 5100, variance: -400 },
  { category: "Onderaannemers", budgetted: 1200, actual: 1250, variance: 50 },
  { category: "Overige kosten", budgetted: 328.58, actual: 300, variance: -28.58 },
];

export default function NacalculatiePage() {
  const totalBudgetted = mockProjects.reduce((sum, p) => sum + p.budgetted, 0);
  const totalActual = mockProjects.reduce((sum, p) => sum + p.actual, 0);
  const totalVariance = totalActual - totalBudgetted;
  const averageVariancePercent = (totalVariance / totalBudgetted) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nacalculatie</h1>
        <p className="text-muted-foreground">
          Vergelijk begrotingen met werkelijke kosten en analyseer afwijkingen
        </p>
      </div>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Estimator Pro Feature</AlertTitle>
        <AlertDescription>
          Nacalculatie is exclusief beschikbaar in de Estimator Pro editie.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Begroot</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EUR {totalBudgetted.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Werkelijk</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EUR {totalActual.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Afwijking</CardTitle>
            {totalVariance > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance > 0 ? "text-red-600" : "text-green-600"}`}>
              {totalVariance > 0 ? "+" : ""}EUR {totalVariance.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Afwijking</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${averageVariancePercent > 0 ? "text-red-600" : "text-green-600"}`}>
              {averageVariancePercent > 0 ? "+" : ""}{averageVariancePercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overzicht</CardTitle>
          <CardDescription>Nacalculatie per afgerond project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Begroot: EUR {project.budgetted.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={project.status === "under_budget" ? "default" : "destructive"}>
                      {project.status === "under_budget" ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Binnen budget</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" />Over budget</>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Werkelijk: EUR {project.actual.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</span>
                    <span className={project.variance < 0 ? "text-green-600" : "text-red-600"}>
                      {project.variance > 0 ? "+" : ""}EUR {project.variance.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} ({project.variancePercent > 0 ? "+" : ""}{project.variancePercent}%)
                    </span>
                  </div>
                  <Progress
                    value={Math.min((project.actual / project.budgetted) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse per Categorie</CardTitle>
          <CardDescription>
            Laatste project: Badkamer Renovatie Fam. De Vries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryAnalysis.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">{cat.category}</div>
                  <div className="text-sm text-muted-foreground">
                    Begroot: EUR {cat.budgetted.toLocaleString("nl-NL")} |
                    Werkelijk: EUR {cat.actual.toLocaleString("nl-NL")}
                  </div>
                </div>
                <div className={`font-medium ${cat.variance < 0 ? "text-green-600" : "text-red-600"}`}>
                  {cat.variance > 0 ? "+" : ""}EUR {cat.variance.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Inzichten</CardTitle>
          <CardDescription>Automatisch gegenereerde analyse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-800">Arbeidskosten consistent lager</div>
                <div className="text-sm text-green-700">
                  Uw schattingen voor arbeidskosten zijn gemiddeld 7% hoger dan werkelijk.
                  Overweeg om uw uurtarieven of tijdsinschattingen aan te passen.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Onderaannemers vaak duurder</div>
                <div className="text-sm text-yellow-700">
                  Kosten voor onderaannemers wijken regelmatig af.
                  Vraag actuele offertes op voordat u begrotingen finaliseert.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
