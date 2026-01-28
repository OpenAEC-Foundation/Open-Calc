"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewEstimatePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      generalCostsPercent: parseFloat(formData.get("generalCostsPercent") as string) || 0,
      profitPercent: parseFloat(formData.get("profitPercent") as string) || 0,
      riskPercent: parseFloat(formData.get("riskPercent") as string) || 0,
      vatPercent: parseFloat(formData.get("vatPercent") as string) || 21,
    };

    try {
      const response = await fetch(`/api/projects/${projectId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Er is een fout opgetreden");
        return;
      }

      const estimate = await response.json();
      router.push(`/projects/${projectId}/estimates/${estimate.id}`);
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
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nieuwe begroting</h1>
          <p className="text-muted-foreground">
            Maak een nieuwe begroting aan voor dit project
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Begrotingsgegevens</CardTitle>
          <CardDescription>
            Vul de basisgegevens van de begroting in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam begroting *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Hoofdbegroting"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Omschrijving</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Korte omschrijving van de begroting..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Opslagen</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="generalCostsPercent">Algemene kosten (%)</Label>
                  <Input
                    id="generalCostsPercent"
                    name="generalCostsPercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profitPercent">Winst & risico (%)</Label>
                  <Input
                    id="profitPercent"
                    name="profitPercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskPercent">Extra risico (%)</Label>
                  <Input
                    id="riskPercent"
                    name="riskPercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatPercent">BTW percentage (%)</Label>
              <Input
                id="vatPercent"
                name="vatPercent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                defaultValue="21"
                className="w-32"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/projects/${projectId}`}>Annuleren</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aanmaken...
                  </>
                ) : (
                  "Begroting aanmaken"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
