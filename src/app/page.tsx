import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Library, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">OpenCalc</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/login">Inloggen</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25">
            <Link href="/dashboard">Naar applicatie</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Open source & gratis te gebruiken
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Begrotingssoftware voor de{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">bouwsector</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            OpenCalc is een eenvoudig en krachtig web-based begrotingsprogramma
            speciaal ontworpen voor kleine aannemers en ZZP&apos;ers in de bouw.
            Maak professionele offertes in enkele minuten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 h-12 px-8">
              <Link href="/dashboard">Start nu gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 border-2 hover:bg-blue-50">
              <Link href="/library">Bekijk kostenbibliotheek</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg shadow-blue-500/5 border border-white/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Snelle calculatie</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Maak binnen minuten een professionele begroting met onze
              intuïtieve interface en uitgebreide kostenbibliotheek.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg shadow-emerald-500/5 border border-white/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
            <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Library className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Kostenbibliotheek</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Inclusief NL-SfB, STABU en RAW bibliotheken met actuele
              richtprijzen. Voeg eenvoudig je eigen posten toe.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg shadow-violet-500/5 border border-white/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 group">
            <div className="h-14 w-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">PDF Offertes</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Genereer professionele PDF offertes met je bedrijfsgegevens.
              Direct klaar om naar je klanten te versturen.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg shadow-amber-500/5 border border-white/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group">
            <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cloud-based</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Toegang tot je begrotingen vanaf elke locatie en elk apparaat.
              Altijd up-to-date, altijd beschikbaar.
            </p>
          </div>
        </div>

        {/* Supported Standards */}
        <div className="mt-24 text-center">
          <p className="text-sm font-medium text-blue-600 mb-2">Compatibel met</p>
          <h2 className="text-2xl font-bold mb-8">Nederlandse bouwstandaarden</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/80 backdrop-blur border border-blue-100 text-blue-700 px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
              NL-SfB Elementenmethode
            </div>
            <div className="bg-white/80 backdrop-blur border border-emerald-100 text-emerald-700 px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
              STABU Werksoorten
            </div>
            <div className="bg-white/80 backdrop-blur border border-amber-100 text-amber-700 px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow">
              RAW GWW Systematiek
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-100 mt-20 py-8 bg-white/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <Calculator className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-gray-700">OpenCalc</span>
          </div>
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Open source begrotingssoftware voor de bouwsector</p>
        </div>
      </footer>
    </div>
  );
}
