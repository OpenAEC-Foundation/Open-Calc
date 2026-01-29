import { BarChart3, Building, TrendingUp, Database, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function KengetallenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kengetallen</h1>
        <p className="text-muted-foreground">
          Referentiecijfers en benchmarks voor bouwkosten
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Extended Feature</AlertTitle>
        <AlertDescription>
          Kengetallen is beschikbaar in de Extended en Estimator Pro edities.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Bouwkosten per m2
            </CardTitle>
            <CardDescription>
              Referentiecijfers per gebouwtype
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vergelijk uw begroting met gemiddelde bouwkosten per vierkante meter voor verschillende gebouwtypes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Indexering
            </CardTitle>
            <CardDescription>
              Actuele prijsindexen en trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pas uw begrotingen automatisch aan op basis van actuele bouwkostenindexen (BDB index).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Historische Data
            </CardTitle>
            <CardDescription>
              Leer van eerdere projecten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyseer uw eigen projecthistorie om nauwkeurigere schattingen te maken.
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
            De Kengetallen module biedt toegang tot referentiecijfers uit diverse bronnen:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>BDB Bouwkosten Kompas</li>
            <li>CBS Bouwstatistieken</li>
            <li>Eigen projecthistorie analyse</li>
            <li>Regionale kostenverschillen</li>
            <li>Seizoensgebonden prijsfluctuaties</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Voorbeeld: Woningbouw</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rijwoning</span>
                <span className="font-medium">EUR 1.450 - 1.850 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Twee-onder-een-kap</span>
                <span className="font-medium">EUR 1.550 - 1.950 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vrijstaand</span>
                <span className="font-medium">EUR 1.650 - 2.200 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appartement</span>
                <span className="font-medium">EUR 1.750 - 2.400 /m2</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Indicatieve prijzen excl. BTW, prijspeil 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voorbeeld: Utiliteitsbouw</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kantoor (basis)</span>
                <span className="font-medium">EUR 1.200 - 1.600 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kantoor (hoogwaardig)</span>
                <span className="font-medium">EUR 1.800 - 2.500 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bedrijfshal</span>
                <span className="font-medium">EUR 450 - 750 /m2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">School</span>
                <span className="font-medium">EUR 1.400 - 1.900 /m2</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Indicatieve prijzen excl. BTW, prijspeil 2024
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
