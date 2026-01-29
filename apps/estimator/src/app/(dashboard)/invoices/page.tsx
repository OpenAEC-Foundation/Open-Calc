"use client";

import { useState } from "react";
import { Receipt, Plus, Search, Filter, Euro, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data voor demonstratie
const mockInvoices = [
  {
    id: "INV-2024-001",
    project: "Badkamer Renovatie Fam. De Vries",
    client: "Familie De Vries",
    amount: 15528.58,
    status: "paid",
    dueDate: "2024-01-15",
    paidDate: "2024-01-12",
  },
  {
    id: "INV-2024-002",
    project: "Keuken Verbouwing",
    client: "Dhr. Jansen",
    amount: 8750.00,
    status: "pending",
    dueDate: "2024-02-01",
    paidDate: null,
  },
  {
    id: "INV-2024-003",
    project: "Dakkapel Plaatsing",
    client: "Mevr. Bakker",
    amount: 12500.00,
    status: "overdue",
    dueDate: "2024-01-20",
    paidDate: null,
  },
];

const statusConfig = {
  paid: { label: "Betaald", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
  pending: { label: "Openstaand", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
  overdue: { label: "Verlopen", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = mockInvoices.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = mockInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOverdue = mockInvoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturatie</h1>
          <p className="text-muted-foreground">
            Beheer facturen en betalingen voor uw projecten
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Factuur
        </Button>
      </div>

      <Alert>
        <Receipt className="h-4 w-4" />
        <AlertTitle>Estimator Pro Feature</AlertTitle>
        <AlertDescription>
          Facturatie is exclusief beschikbaar in de Estimator Pro editie.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Openstaand</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EUR {totalOutstanding.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockInvoices.filter((inv) => inv.status !== "paid").length} facturen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verlopen</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              EUR {totalOverdue.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockInvoices.filter((inv) => inv.status === "overdue").length} facturen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betaald deze maand</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              EUR {mockInvoices
                .filter((inv) => inv.status === "paid")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockInvoices.filter((inv) => inv.status === "paid").length} facturen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op factuurnummer, project of klant..."
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

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Facturen</CardTitle>
          <CardDescription>
            Overzicht van alle facturen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const status = statusConfig[invoice.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-muted ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{invoice.id}</div>
                      <div className="text-sm text-muted-foreground">{invoice.project}</div>
                      <div className="text-xs text-muted-foreground">{invoice.client}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        EUR {invoice.amount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Vervaldatum: {new Date(invoice.dueDate).toLocaleDateString("nl-NL")}
                      </div>
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
