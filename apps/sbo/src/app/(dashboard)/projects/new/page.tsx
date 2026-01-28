"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Plus, Building2, MapPin, FolderOpen } from "lucide-react";

interface Client {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientTab, setClientTab] = useState<string>("existing");
  const [loadingClients, setLoadingClients] = useState(true);

  // Fetch existing clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    let clientId = selectedClientId || undefined;

    // If creating a new client, create it first
    if (clientTab === "new" && formData.get("clientName")) {
      try {
        const clientResponse = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("clientName"),
            contactPerson: formData.get("clientContactPerson") || undefined,
            email: formData.get("clientEmail") || undefined,
            phone: formData.get("clientPhone") || undefined,
            address: formData.get("clientAddress") || undefined,
            city: formData.get("clientCity") || undefined,
            postalCode: formData.get("clientPostalCode") || undefined,
          }),
        });

        if (clientResponse.ok) {
          const newClient = await clientResponse.json();
          clientId = newClient.id;
        } else {
          setError("Fout bij het aanmaken van de klant");
          setLoading(false);
          return;
        }
      } catch {
        setError("Fout bij het aanmaken van de klant");
        setLoading(false);
        return;
      }
    }

    const data = {
      name: formData.get("name") as string,
      projectNumber: formData.get("projectNumber") as string || undefined,
      description: formData.get("description") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      postalCode: formData.get("postalCode") as string || undefined,
      status: formData.get("status") as string,
      clientId: clientId || undefined,
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Er is een fout opgetreden");
        return;
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nieuw project</h1>
          <p className="text-muted-foreground">
            Maak een nieuw project aan om begrotingen te maken
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projectgegevens
            </CardTitle>
            <CardDescription>
              Vul de basisgegevens van het project in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Projectnaam *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nieuwbouw woning Van der Berg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectNumber">Projectnummer</Label>
                <Input
                  id="projectNumber"
                  name="projectNumber"
                  placeholder="2024-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Korte omschrijving van het project..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Concept</SelectItem>
                  <SelectItem value="ACTIVE">Actief</SelectItem>
                  <SelectItem value="COMPLETED">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Project Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Projectlocatie
            </CardTitle>
            <CardDescription>
              Waar wordt het project uitgevoerd?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                name="address"
                placeholder="Hoofdstraat 1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postcode</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="1234 AB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Plaats</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Amsterdam"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Klantgegevens
            </CardTitle>
            <CardDescription>
              Koppel een bestaande klant of maak een nieuwe aan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={clientTab} onValueChange={setClientTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none">Geen klant</TabsTrigger>
                <TabsTrigger value="existing">Bestaande klant</TabsTrigger>
                <TabsTrigger value="new">
                  <Plus className="h-4 w-4 mr-1" />
                  Nieuwe klant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="none" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Je kunt later een klant aan dit project koppelen.
                </p>
              </TabsContent>

              <TabsContent value="existing" className="mt-4 space-y-4">
                {loadingClients ? (
                  <p className="text-sm text-muted-foreground">Klanten laden...</p>
                ) : clients.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Nog geen klanten aangemaakt
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setClientTab("new")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Eerste klant aanmaken
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="clientSelect">Selecteer klant</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een klant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              {client.contactPerson && (
                                <span className="text-xs text-muted-foreground">
                                  {client.contactPerson}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedClientId && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        {(() => {
                          const client = clients.find(c => c.id === selectedClientId);
                          if (!client) return null;
                          return (
                            <div className="text-sm space-y-1">
                              <p className="font-medium">{client.name}</p>
                              {client.contactPerson && (
                                <p className="text-muted-foreground">{client.contactPerson}</p>
                              )}
                              {client.email && (
                                <p className="text-muted-foreground">{client.email}</p>
                              )}
                              {client.phone && (
                                <p className="text-muted-foreground">{client.phone}</p>
                              )}
                              {(client.address || client.city) && (
                                <p className="text-muted-foreground">
                                  {[client.address, client.postalCode, client.city].filter(Boolean).join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="new" className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Bedrijfsnaam / Naam *</Label>
                    <Input
                      id="clientName"
                      name="clientName"
                      placeholder="Bedrijf B.V. of Fam. Jansen"
                      required={clientTab === "new"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientContactPerson">Contactpersoon</Label>
                    <Input
                      id="clientContactPerson"
                      name="clientContactPerson"
                      placeholder="Jan Jansen"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">E-mailadres</Label>
                    <Input
                      id="clientEmail"
                      name="clientEmail"
                      type="email"
                      placeholder="info@bedrijf.nl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Telefoonnummer</Label>
                    <Input
                      id="clientPhone"
                      name="clientPhone"
                      placeholder="06-12345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Adres</Label>
                  <Input
                    id="clientAddress"
                    name="clientAddress"
                    placeholder="Klantenstraat 1"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientPostalCode">Postcode</Label>
                    <Input
                      id="clientPostalCode"
                      name="clientPostalCode"
                      placeholder="1234 AB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCity">Plaats</Label>
                    <Input
                      id="clientCity"
                      name="clientCity"
                      placeholder="Amsterdam"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/projects">Annuleren</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Building2 className="mr-2 h-4 w-4" />
            {loading ? "Bezig met opslaan..." : "Project aanmaken"}
          </Button>
        </div>
      </form>
    </div>
  );
}
