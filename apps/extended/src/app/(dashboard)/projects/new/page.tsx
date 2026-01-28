"use client";

import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      projectNumber: formData.get("projectNumber") as string || undefined,
      description: formData.get("description") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      postalCode: formData.get("postalCode") as string || undefined,
      status: formData.get("status") as string,
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
    <div className="max-w-2xl mx-auto space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Projectgegevens</CardTitle>
          <CardDescription>
            Vul de basisgegevens van het project in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="DRAFT">
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Annuleren</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Bezig met opslaan..." : "Project aanmaken"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
