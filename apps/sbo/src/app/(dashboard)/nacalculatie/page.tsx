"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Plus, GitCompare, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface ActualCost {
  id: string;
  projectId: string;
  project?: { name: string };
  category: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  date: string;
}

interface Project {
  id: string;
  name: string;
}

interface NacalculatieData {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  categories: {
    name: string;
    budget: number;
    actual: number;
    variance: number;
  }[];
}

const CATEGORIES = [
  "Arbeid",
  "Materiaal",
  "Onderaanneming",
  "Materieel",
  "Overige kosten",
];

export default function NacalculatiePage() {
  const [costs, setCosts] = useState<ActualCost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [nacalculatieData, setNacalculatieData] = useState<NacalculatieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("ALL");

  // Form state
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchProjects();
    fetchCosts();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchCosts = async () => {
    try {
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allCosts: ActualCost[] = [];
      const nacData: NacalculatieData[] = [];

      for (const project of projectsData) {
        try {
          const costsRes = await fetch(`/api/projects/${project.id}/actual-costs`);
          if (costsRes.ok) {
            const costsData = await costsRes.json();
            const projectCosts = costsData.map((c: ActualCost) => ({
              ...c,
              project: { name: project.name },
            }));
            allCosts.push(...projectCosts);

            // Calculate nacalculatie per project
            const categoryTotals = new Map<string, { budget: number; actual: number }>();
            for (const cost of projectCosts) {
              const existing = categoryTotals.get(cost.category) || { budget: 0, actual: 0 };
              categoryTotals.set(cost.category, {
                budget: existing.budget + cost.budgetAmount,
                actual: existing.actual + cost.actualAmount,
              });
            }

            const totalBudget = projectCosts.reduce(
              (sum: number, c: ActualCost) => sum + c.budgetAmount,
              0
            );
            const totalActual = projectCosts.reduce(
              (sum: number, c: ActualCost) => sum + c.actualAmount,
              0
            );

            if (projectCosts.length > 0) {
              nacData.push({
                projectId: project.id,
                projectName: project.name,
                totalBudget,
                totalActual,
                variance: totalActual - totalBudget,
                variancePercent:
                  totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0,
                categories: Array.from(categoryTotals.entries()).map(([name, totals]) => ({
                  name,
                  budget: totals.budget,
                  actual: totals.actual,
                  variance: totals.actual - totals.budget,
                })),
              });
            }
          }
        } catch {
          // Skip projects without actual costs
        }
      }

      setCosts(allCosts);
      setNacalculatieData(nacData);
    } catch (error) {
      console.error("Error fetching costs:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setCategory("");
    setDescription("");
    setBudgetAmount("");
    setActualAmount("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const budget = parseFloat(budgetAmount);
    const actual = parseFloat(actualAmount);

    const body = {
      category,
      description,
      budgetAmount: budget,
      actualAmount: actual,
      variance: actual - budget,
      date,
    };

    try {
      await fetch(`/api/projects/${projectId}/actual-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      resetForm();
      fetchCosts();
    } catch (error) {
      console.error("Error creating cost:", error);
    }
  };

  const filteredData =
    selectedProject === "ALL"
      ? nacalculatieData
      : nacalculatieData.filter((d) => d.projectId === selectedProject);

  const totalBudget = filteredData.reduce((sum, d) => sum + d.totalBudget, 0);
  const totalActual = filteredData.reduce((sum, d) => sum + d.totalActual, 0);
  const totalVariance = totalActual - totalBudget;
  const overallVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600";
    if (variance < 0) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nacalculatie</h1>
          <p className="text-muted-foreground">Vergelijk begrote vs werkelijke kosten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Werkelijke kosten
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Werkelijke kosten toevoegen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Omschrijving</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Omschrijving van de kosten"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Begroot (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="1000.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Werkelijk (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(e.target.value)}
                      placeholder="1200.00"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                {budgetAmount && actualAmount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between">
                      <span>Verschil</span>
                      <span
                        className={getVarianceColor(
                          parseFloat(actualAmount) - parseFloat(budgetAmount)
                        )}
                      >
                        €
                        {(parseFloat(actualAmount) - parseFloat(budgetAmount)).toFixed(2)}
                        {parseFloat(budgetAmount) > 0 && (
                          <span className="ml-1">
                            (
                            {(
                              ((parseFloat(actualAmount) - parseFloat(budgetAmount)) /
                                parseFloat(budgetAmount)) *
                              100
                            ).toFixed(1)}
                            %)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit">Toevoegen</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter op project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle projecten</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal begroot</CardTitle>
            <GitCompare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalBudget.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal werkelijk</CardTitle>
            <GitCompare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalActual.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verschil</CardTitle>
            {getVarianceIcon(totalVariance)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVarianceColor(totalVariance)}`}>
              €{Math.abs(totalVariance).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
              {totalVariance > 0 ? " over" : totalVariance < 0 ? " onder" : ""}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afwijking %</CardTitle>
            {getVarianceIcon(overallVariancePercent)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVarianceColor(overallVariancePercent)}`}>
              {overallVariancePercent >= 0 ? "+" : ""}
              {overallVariancePercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget usage */}
      <Card>
        <CardHeader>
          <CardTitle>Budgetgebruik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verbruikt van budget</span>
              <span>
                {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <Progress
              value={totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0}
              className={`h-3 ${totalActual > totalBudget ? "[&>div]:bg-red-500" : ""}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project overview */}
      <Card>
        <CardHeader>
          <CardTitle>Projectoverzicht</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-muted-foreground">
              Geen nacalculatie data gevonden. Voeg werkelijke kosten toe om te beginnen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Begroot</TableHead>
                  <TableHead className="text-right">Werkelijk</TableHead>
                  <TableHead className="text-right">Verschil</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((data) => (
                  <TableRow key={data.projectId}>
                    <TableCell className="font-medium">{data.projectName}</TableCell>
                    <TableCell className="text-right">
                      €{data.totalBudget.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.totalActual.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right ${getVarianceColor(data.variance)}`}>
                      €{Math.abs(data.variance).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                      {data.variance > 0 ? " over" : data.variance < 0 ? " onder" : ""}
                    </TableCell>
                    <TableCell className={`text-right ${getVarianceColor(data.variancePercent)}`}>
                      {data.variancePercent >= 0 ? "+" : ""}
                      {data.variancePercent.toFixed(1)}%
                    </TableCell>
                    <TableCell>{getVarianceIcon(data.variance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
