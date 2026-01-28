"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  Loader2,
  Download,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface ERPNextProject {
  name: string;
  project_name: string;
  status: string;
  customer: string | null;
  expected_start_date: string | null;
  expected_end_date: string | null;
  company: string | null;
}

interface ERPNextQuotation {
  name: string;
  party_name: string | null;
  grand_total: number;
  status: string;
  transaction_date: string;
}

export function ERPNextImport() {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ERPNextProject[]>([]);
  const [quotations, setQuotations] = useState<ERPNextQuotation[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");

  async function checkConnection() {
    try {
      const response = await fetch("/api/erpnext/status");
      if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
      }
    } catch {
      setConnectionStatus("error");
    }
  }

  async function searchERPNext() {
    setSearching(true);
    setError(null);

    try {
      const [projectsRes, quotationsRes] = await Promise.all([
        fetch(`/api/erpnext/projects?search=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/erpnext/quotations?search=${encodeURIComponent(searchQuery)}`),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      if (quotationsRes.ok) {
        const data = await quotationsRes.json();
        setQuotations(data.quotations || []);
      }

      setConnectionStatus("connected");
    } catch (err) {
      setError("Kon geen verbinding maken met ERPNext. Controleer de instellingen.");
      setConnectionStatus("error");
    } finally {
      setSearching(false);
    }
  }

  function toggleProject(projectName: string) {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectName)) {
      newSelected.delete(projectName);
    } else {
      newSelected.add(projectName);
    }
    setSelectedProjects(newSelected);
  }

  async function importSelected() {
    if (selectedProjects.size === 0) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/erpnext/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: Array.from(selectedProjects),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${data.imported} project(en) succesvol geimporteerd`);
        setSelectedProjects(new Set());
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Import mislukt");
      }
    } catch (err) {
      setError("Er is een fout opgetreden bij het importeren");
    } finally {
      setImporting(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            ERPNext Verbinding
          </CardTitle>
          <CardDescription>
            Importeer projecten en offertes uit je ERPNext omgeving
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verbonden
                </Badge>
              )}
              {connectionStatus === "error" && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Niet verbonden
                </Badge>
              )}
              {connectionStatus === "unknown" && (
                <Badge variant="secondary">Status onbekend</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={checkConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test verbinding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zoeken in ERPNext</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchERPNext();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op projectnaam, klantnaam of nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Zoeken"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fout</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Projects Results */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projecten</CardTitle>
            <CardDescription>
              {projects.length} project(en) gevonden
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Projectnaam</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Startdatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.name}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProjects.has(project.name)}
                        onCheckedChange={() => toggleProject(project.name)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{project.customer || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {project.expected_start_date
                        ? new Date(project.expected_start_date).toLocaleDateString(
                            "nl-NL"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quotations Results */}
      {quotations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offertes</CardTitle>
            <CardDescription>
              {quotations.length} offerte(s) gevonden
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offertenummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.name}>
                    <TableCell className="font-medium">
                      {quotation.name}
                    </TableCell>
                    <TableCell>{quotation.party_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{quotation.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(quotation.grand_total)}
                    </TableCell>
                    <TableCell>
                      {new Date(quotation.transaction_date).toLocaleDateString(
                        "nl-NL"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {selectedProjects.size > 0 && (
        <div className="flex justify-end">
          <Button onClick={importSelected} disabled={importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importeren...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {selectedProjects.size} project(en) importeren
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
