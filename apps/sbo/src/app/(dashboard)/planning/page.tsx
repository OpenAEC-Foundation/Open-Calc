"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { nl } from "date-fns/locale";

interface Milestone {
  id: string;
  projectId: string;
  project?: { name: string };
  name: string;
  description?: string;
  dueDate: string;
  completedAt?: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Gepland", color: "secondary", icon: Clock },
  IN_PROGRESS: { label: "Bezig", color: "default", icon: Clock },
  COMPLETED: { label: "Voltooid", color: "default", icon: CheckCircle },
  OVERDUE: { label: "Te laat", color: "destructive", icon: AlertTriangle },
};

export default function PlanningPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchMilestones();
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

  const fetchMilestones = async () => {
    try {
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allMilestones: Milestone[] = [];
      for (const project of projectsData) {
        try {
          const milestonesRes = await fetch(`/api/projects/${project.id}/milestones`);
          if (milestonesRes.ok) {
            const milestonesData = await milestonesRes.json();
            allMilestones.push(
              ...milestonesData.map((m: Milestone) => ({
                ...m,
                project: { name: project.name },
              }))
            );
          }
        } catch {
          // Skip projects without milestones
        }
      }

      // Sort by due date
      allMilestones.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setMilestones(allMilestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setName("");
    setDescription("");
    setDueDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      name,
      description: description || null,
      dueDate,
    };

    try {
      await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      resetForm();
      fetchMilestones();
    } catch (error) {
      console.error("Error creating milestone:", error);
    }
  };

  const handleComplete = async (milestone: Milestone) => {
    try {
      await fetch(`/api/projects/${milestone.projectId}/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });
      fetchMilestones();
    } catch (error) {
      console.error("Error completing milestone:", error);
    }
  };

  const getEffectiveStatus = (milestone: Milestone): string => {
    if (milestone.status === "COMPLETED") return "COMPLETED";
    if (isPast(new Date(milestone.dueDate)) && milestone.status !== "COMPLETED") return "OVERDUE";
    return milestone.status;
  };

  const stats = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "COMPLETED").length,
    upcoming: milestones.filter(
      (m) => m.status !== "COMPLETED" && isFuture(new Date(m.dueDate))
    ).length,
    overdue: milestones.filter(
      (m) => m.status !== "COMPLETED" && isPast(new Date(m.dueDate))
    ).length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projectplanning</h1>
          <p className="text-muted-foreground">Beheer mijlpalen en deadlines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe mijlpaal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe mijlpaal</DialogTitle>
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
                <Label>Naam</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Oplevering fase 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Omschrijving</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optionele omschrijving"
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal mijlpalen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voltooid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aankomend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Te laat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress card */}
      <Card>
        <CardHeader>
          <CardTitle>Voortgang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Totale voortgang</span>
              <span>{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Milestones list */}
      <Card>
        <CardHeader>
          <CardTitle>Mijlpalen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : milestones.length === 0 ? (
            <p className="text-muted-foreground">Geen mijlpalen gevonden</p>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const effectiveStatus = getEffectiveStatus(milestone);
                const config = STATUS_CONFIG[effectiveStatus];
                const daysUntil = differenceInDays(new Date(milestone.dueDate), new Date());
                const StatusIcon = config.icon;

                return (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          effectiveStatus === "COMPLETED"
                            ? "bg-green-100"
                            : effectiveStatus === "OVERDUE"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <StatusIcon
                          className={`h-5 w-5 ${
                            effectiveStatus === "COMPLETED"
                              ? "text-green-600"
                              : effectiveStatus === "OVERDUE"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{milestone.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {milestone.project?.name}
                          {milestone.description && ` - ${milestone.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {format(new Date(milestone.dueDate), "d MMM yyyy", { locale: nl })}
                        </div>
                        {effectiveStatus !== "COMPLETED" && (
                          <div
                            className={`text-xs ${
                              effectiveStatus === "OVERDUE" ? "text-red-600" : "text-muted-foreground"
                            }`}
                          >
                            {daysUntil === 0
                              ? "Vandaag"
                              : daysUntil > 0
                              ? `Nog ${daysUntil} dagen`
                              : `${Math.abs(daysUntil)} dagen te laat`}
                          </div>
                        )}
                      </div>
                      <Badge variant={config.color as "default" | "secondary" | "destructive"}>
                        {config.label}
                      </Badge>
                      {effectiveStatus !== "COMPLETED" && (
                        <Button size="sm" variant="outline" onClick={() => handleComplete(milestone)}>
                          Voltooien
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
