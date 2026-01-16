import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Library, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold">OpenCalc</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Inloggen</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Gratis starten</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Begrotingssoftware voor de{" "}
            <span className="text-blue-600">bouwsector</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            OpenCalc is een eenvoudig en krachtig web-based begrotingsprogramma
            speciaal ontworpen voor kleine aannemers en ZZP&apos;ers in de bouw.
            Maak professionele offertes in enkele minuten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Gratis account aanmaken</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Snelle calculatie</h3>
            <p className="text-gray-600">
              Maak binnen minuten een professionele begroting met onze
              intuïtieve interface en uitgebreide kostenbibliotheek.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Library className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Kostenbibliotheek</h3>
            <p className="text-gray-600">
              Inclusief NL-SfB, STABU en RAW bibliotheken met actuele
              richtprijzen. Voeg eenvoudig je eigen posten toe.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">PDF Offertes</h3>
            <p className="text-gray-600">
              Genereer professionele PDF offertes met je bedrijfsgegevens.
              Direct klaar om naar je klanten te versturen.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cloud-based</h3>
            <p className="text-gray-600">
              Toegang tot je begrotingen vanaf elke locatie en elk apparaat.
              Altijd up-to-date, altijd beschikbaar.
            </p>
          </div>
        </div>

        {/* Supported Standards */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8">Ondersteunde standaarden</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-full font-medium">
              NL-SfB Elementenmethode
            </div>
            <div className="bg-green-50 text-green-700 px-6 py-3 rounded-full font-medium">
              STABU Werksoorten
            </div>
            <div className="bg-orange-50 text-orange-700 px-6 py-3 rounded-full font-medium">
              RAW GWW Systematiek
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} OpenCalc - Open source begrotingssoftware</p>
        </div>
      </footer>
    </div>
  );
}
