"use client";

import { useState } from "react";
import { FileSpreadsheet, Plus, Search, Filter, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data voor demonstratie
const mockOffertes = [
  {
    id: "OFF-2024-001",
    project: "Badkamer Renovatie",
    client: "Familie De Vries",
    amount: 15528.58,
    status: "accepted",
    sentDate: "2024-01-05",
    validUntil: "2024-02-05",
  },
  {
    id: "OFF-2024-002",
    project: "Keuken Verbouwing",
    client: "Dhr. Jansen",
    amount: 8750.00,
    status: "pending",
    sentDate: "2024-01-18",
    validUntil: "2024-02-18",
  },
  {
    id: "OFF-2024-003",
    project: "Dakkapel Plaatsing",
    client: "Mevr. Bakker",
    amount: 14200.00,
    status: "draft",
    sentDate: null,
    validUntil: null,
  },
  {
    id: "OFF-2024-004",
    project: "Aanbouw Woonkamer",
    client: "Fam. Visser",
    amount: 45000.00,
    status: "rejected",
    sentDate: "2024-01-10",
    validUntil: "2024-02-10",
  },
];

const statusConfig = {
  draft: { label: "Concept", variant: "outline" as const, icon: FileSpreadsheet, color: "text-gray-600" },
  pending: { label: "Verzonden", variant: "secondary" as const, icon: Send, color: "text-blue-600" },
  accepted: { label: "Geaccepteerd", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
  rejected: { label: "Afgewezen", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
};

export default function OffertesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOffertes = mockOffertes.filter(
    (offerte) =>
      offerte.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offerte.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offerte.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = mockOffertes
    .filter((off) => off.status === "pending")
    .reduce((sum, off) => sum + off.amount, 0);

  const conversionRate = Math.round(
    (mockOffertes.filter((off) => off.status === "accepted").length /
      mockOffertes.filter((off) => off.status !== "draft").length) *
      100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offertes</h1>
          <p className="text-muted-foreground">
            Maak en beheer offertes vanuit uw begrotingen
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Offerte
        </Button>
      </div>

      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertTitle>Estimator Pro Feature</AlertTitle>
        <AlertDescription>
          Offertebeheer is exclusief beschikbaar in de Estimator Pro editie.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concepten</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOffertes.filter((off) => off.status === "draft").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uitstaand</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EUR {totalPending.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockOffertes.filter((off) => off.status === "pending").length} offertes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geaccepteerd</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockOffertes.filter((off) => off.status === "accepted").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversie</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">acceptatiegraad</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op offertenummer, project of klant..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Offertes List */}
      <Card>
        <CardHeader>
          <CardTitle>Offertes</CardTitle>
          <CardDescription>
            Overzicht van alle offertes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOffertes.map((offerte) => {
              const status = statusConfig[offerte.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={offerte.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-muted ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{offerte.id}</div>
                      <div className="text-sm text-muted-foreground">{offerte.project}</div>
                      <div className="text-xs text-muted-foreground">{offerte.client}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        EUR {offerte.amount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                      </div>
                      {offerte.validUntil && (
                        <div className="text-xs text-muted-foreground">
                          Geldig tot: {new Date(offerte.validUntil).toLocaleDateString("nl-NL")}
                        </div>
                      )}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
