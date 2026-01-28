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
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Eye, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Invoice {
  id: string;
  projectId: string;
  project?: { name: string };
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: string;
  paidAt?: string;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  PAID: "Betaald",
  OVERDUE: "Te laat",
  CANCELLED: "Geannuleerd",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "default",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [subtotal, setSubtotal] = useState("");
  const [vatPercentage, setVatPercentage] = useState("21");

  useEffect(() => {
    fetchProjects();
    fetchInvoices();
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

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allInvoices: Invoice[] = [];
      for (const project of projectsData) {
        try {
          const invoicesRes = await fetch(`/api/projects/${project.id}/invoices`);
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            allInvoices.push(
              ...invoicesData.map((i: Invoice) => ({
                ...i,
                project: { name: project.name },
              }))
            );
          }
        } catch {
          // Skip projects without invoices
        }
      }

      // Sort by issue date descending
      allInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      setInvoices(allInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setIssueDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
    setSubtotal("");
    setVatPercentage("21");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sub = parseFloat(subtotal);
    const vat = parseFloat(vatPercentage);
    const vatAmount = sub * (vat / 100);

    const body = {
      issueDate,
      dueDate,
      subtotal: sub,
      vatAmount,
      total: sub + vatAmount,
    };

    try {
      await fetch(`/api/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "PAID") {
        body.paidAt = new Date().toISOString();
      }

      await fetch(`/api/projects/${invoice.projectId}/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  const totalOpen = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturatie</h1>
          <p className="text-muted-foreground">Beheer facturen en betalingen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe factuur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe factuur</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Factuurdatum</Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vervaldatum</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bedrag excl. BTW (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    placeholder="1000.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>BTW %</Label>
                  <Select value={vatPercentage} onValueChange={setVatPercentage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {subtotal && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotaal</span>
                    <span>€{parseFloat(subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>BTW ({vatPercentage}%)</span>
                    <span>
                      €{(parseFloat(subtotal) * (parseFloat(vatPercentage) / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Totaal</span>
                    <span>
                      €
                      {(
                        parseFloat(subtotal) *
                        (1 + parseFloat(vatPercentage) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">Aanmaken</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal facturen</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalOpen.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betaald</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totalPaid.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      <Card>
        <CardHeader>
          <CardTitle>Facturen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground">Geen facturen gevonden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factuurnummer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Factuurdatum</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.project?.name}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      €{invoice.total.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[invoice.status] as "default" | "secondary" | "destructive"}>
                        {STATUS_LABELS[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Bekijken">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === "DRAFT" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Verzenden"
                            onClick={() => handleStatusChange(invoice, "SENT")}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.status === "SENT" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Markeer als betaald"
                            onClick={() => handleStatusChange(invoice, "PAID")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
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
