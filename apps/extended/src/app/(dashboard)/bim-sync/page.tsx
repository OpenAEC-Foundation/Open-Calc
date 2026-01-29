import { Building2, ArrowUpDown, FileJson, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BimSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BIM Sync</h1>
        <p className="text-muted-foreground">
          Synchroniseer hoeveelheden vanuit BIM-modellen (IFC)
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Extended Feature</AlertTitle>
        <AlertDescription>
          BIM Sync is beschikbaar in de Extended en Estimator Pro edities.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-purple-600" />
              IFC Import
            </CardTitle>
            <CardDescription>
              Importeer IFC bestanden en extraheer hoeveelheden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload een IFC bestand om automatisch elementen en hoeveelheden te extraheren voor uw begroting.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-purple-600" />
              Synchronisatie
            </CardTitle>
            <CardDescription>
              Houd begrotingen gesynchroniseerd met BIM wijzigingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Wanneer het BIM-model wijzigt, worden de hoeveelheden in uw begroting automatisch bijgewerkt.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Element Mapping
            </CardTitle>
            <CardDescription>
              Koppel BIM elementen aan kostenregels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Definieer mappings tussen IFC element types en uw kostenbibliotheek items.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Binnenkort beschikbaar</CardTitle>
          <CardDescription>
            Deze functionaliteit wordt momenteel ontwikkeld
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            BIM Sync maakt het mogelijk om hoeveelheden direct uit IFC modellen te halen en te koppelen aan uw begrotingsregels.
            De functionaliteit ondersteunt IFC2x3 en IFC4 formaten en kan hoeveelheden extraheren op basis van:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>Element types (wanden, vloeren, daken, etc.)</li>
            <li>Property sets en quantities</li>
            <li>Ruimtes en zones</li>
            <li>Materiaal toewijzingen</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
