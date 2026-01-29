"use client";

import { Calendar, Plus, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data voor demonstratie
const mockProjects = [
  {
    id: "1",
    name: "Badkamer Renovatie Fam. De Vries",
    startDate: "2024-01-22",
    endDate: "2024-02-09",
    status: "active",
    progress: 65,
  },
  {
    id: "2",
    name: "Keuken Verbouwing Dhr. Jansen",
    startDate: "2024-02-01",
    endDate: "2024-02-28",
    status: "scheduled",
    progress: 0,
  },
  {
    id: "3",
    name: "Dakkapel Mevr. Bakker",
    startDate: "2024-02-15",
    endDate: "2024-03-01",
    status: "scheduled",
    progress: 0,
  },
];

const statusConfig = {
  active: { label: "Actief", color: "bg-green-500" },
  scheduled: { label: "Gepland", color: "bg-blue-500" },
  completed: { label: "Afgerond", color: "bg-gray-500" },
};

export default function PlanningPage() {
  const currentMonth = "Januari 2024";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">
            Projectplanning en capaciteitsbeheer
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuw Project Plannen
        </Button>
      </div>

      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertTitle>Estimator Pro Feature</AlertTitle>
        <AlertDescription>
          Projectplanning is exclusief beschikbaar in de Estimator Pro editie.
        </AlertDescription>
      </Alert>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projectkalender</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">{currentMonth}</span>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Overzicht van geplande en actieve projecten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple Gantt-like view */}
          <div className="space-y-4">
            <div className="grid grid-cols-[200px_1fr] gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Project</div>
              <div className="grid grid-cols-5 gap-1">
                <div>Week 4</div>
                <div>Week 5</div>
                <div>Week 6</div>
                <div>Week 7</div>
                <div>Week 8</div>
              </div>
            </div>

            {mockProjects.map((project) => {
              const status = statusConfig[project.status as keyof typeof statusConfig];
              return (
                <div key={project.id} className="grid grid-cols-[200px_1fr] gap-4 items-center">
                  <div>
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-8">
                    {/* Simplified timeline visualization */}
                    {project.id === "1" && (
                      <div className="col-span-3 bg-green-200 rounded flex items-center px-2">
                        <div
                          className="h-full bg-green-500 rounded-l"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    )}
                    {project.id === "2" && (
                      <>
                        <div />
                        <div className="col-span-4 bg-blue-200 rounded" />
                      </>
                    )}
                    {project.id === "3" && (
                      <>
                        <div className="col-span-2" />
                        <div className="col-span-3 bg-blue-200 rounded" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actieve Projecten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">1</div>
            <p className="text-sm text-muted-foreground mt-1">momenteel in uitvoering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gepland</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">2</div>
            <p className="text-sm text-muted-foreground mt-1">projecten ingepland</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capaciteit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">75%</div>
            <p className="text-sm text-muted-foreground mt-1">bezettingsgraad deze maand</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Aankomende Mijlpalen</CardTitle>
          <CardDescription>Belangrijke deadlines en opleveringen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Badkamer tegelwerk gereed</div>
                <div className="text-sm text-muted-foreground">Fam. De Vries</div>
              </div>
              <Badge>28 jan</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Start keuken verbouwing</div>
                <div className="text-sm text-muted-foreground">Dhr. Jansen</div>
              </div>
              <Badge variant="outline">1 feb</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Oplevering badkamer</div>
                <div className="text-sm text-muted-foreground">Fam. De Vries</div>
              </div>
              <Badge variant="outline">9 feb</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
