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
import { Plus, Clock, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TimeEntry {
  id: string;
  projectId: string;
  project?: { name: string };
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  hourlyRate: number;
}

interface Project {
  id: string;
  name: string;
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("75");

  useEffect(() => {
    fetchProjects();
    fetchEntries();
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

  const fetchEntries = async () => {
    try {
      // Fetch entries for all projects
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allEntries: TimeEntry[] = [];
      for (const project of projectsData) {
        try {
          const entriesRes = await fetch(`/api/projects/${project.id}/time-entries`);
          if (entriesRes.ok) {
            const entriesData = await entriesRes.json();
            allEntries.push(
              ...entriesData.map((e: TimeEntry) => ({
                ...e,
                project: { name: project.name },
              }))
            );
          }
        } catch {
          // Skip projects without time entries
        }
      }

      // Sort by date descending
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(allEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setHours("");
    setDescription("");
    setBillable(true);
    setHourlyRate("75");
    setEditingEntry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      date,
      hours: parseFloat(hours),
      description,
      billable,
      hourlyRate: parseFloat(hourlyRate),
    };

    try {
      if (editingEntry) {
        await fetch(`/api/projects/${editingEntry.projectId}/time-entries/${editingEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch(`/api/projects/${projectId}/time-entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setProjectId(entry.projectId);
    setDate(format(new Date(entry.date), "yyyy-MM-dd"));
    setHours(entry.hours.toString());
    setDescription(entry.description);
    setBillable(entry.billable);
    setHourlyRate(entry.hourlyRate.toString());
    setDialogOpen(true);
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("Weet je zeker dat je deze uren wilt verwijderen?")) return;

    try {
      await fetch(`/api/projects/${entry.projectId}/time-entries/${entry.id}`, {
        method: "DELETE",
      });
      fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);
  const totalAmount = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours * e.hourlyRate, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Urenregistratie</h1>
          <p className="text-muted-foreground">Registreer en beheer gewerkte uren</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Uren toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Uren bewerken" : "Nieuwe uren"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingEntry && (
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
              )}
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Aantal uren</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="8"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Omschrijving</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Werkzaamheden beschrijving"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Factureerbaar</Label>
                  <Select
                    value={billable ? "true" : "false"}
                    onValueChange={(v) => setBillable(v === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ja</SelectItem>
                      <SelectItem value="false">Nee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Uurtarief (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">{editingEntry ? "Opslaan" : "Toevoegen"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal uren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)} uur</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factureerbare uren</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toFixed(1)} uur</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Te factureren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalAmount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Urenregistraties</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">Geen uren geregistreerd</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="text-right">Uren</TableHead>
                  <TableHead className="text-right">Uurtarief</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Factureerbaar</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.date), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>{entry.project?.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell className="text-right">{entry.hours}</TableCell>
                    <TableCell className="text-right">€{entry.hourlyRate}</TableCell>
                    <TableCell className="text-right">
                      €{(entry.hours * entry.hourlyRate).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {entry.billable ? (
                        <span className="text-green-600">Ja</span>
                      ) : (
                        <span className="text-gray-400">Nee</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
