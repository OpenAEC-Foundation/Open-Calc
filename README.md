# OpenCalc

<p align="center">
  <img src="public/icons/icon-192x192.png" alt="OpenCalc Logo" width="80"/>
</p>

<p align="center">
  <strong>Open-source begrotingssoftware voor de bouwsector</strong>
</p>

<p align="center">
  <a href="#product-varianten">Varianten</a> •
  <a href="#features">Features</a> •
  <a href="#installatie">Installatie</a> •
  <a href="#api">API</a> •
  <a href="#technologie">Technologie</a> •
  <a href="#bijdragen">Bijdragen</a>
</p>

---

## Over OpenCalc

OpenCalc is een moderne, open-source webapplicatie voor het maken van bouwkostenbegrotingen. Ontworpen voor de Nederlandse bouwsector, van ZZP'ers tot professionele calculatiekantoren.

## Product Varianten

OpenCalc is beschikbaar in verschillende edities:

| Editie | Doelgroep | Interface | Status |
|--------|-----------|-----------|--------|
| **OpenCalc-SBO** | ZZP'ers, kleine aannemers | Card-based, wizard | Actief |
| **OpenCalc Extended** | MKB bedrijven | Grid/Excel-achtig | In ontwikkeling |
| **OpenCalc Estimator** | Professionele calculators | Grid/Excel-achtig | Gepland |
| **OpenCalc API/CLI** | Developers | REST API + Python | Gepland |

### OpenCalc-SBO (Small Business Owners)
De huidige versie - eenvoudig te gebruiken voor kleine bedrijven. Card-based interface met wizard-achtige flows.

### OpenCalc Extended
Uitgebreide versie met Excel-achtige grid interface. Volledig keyboard-navigeerbaar (Tab, pijltjes), Excel export, geavanceerde rapportage.

### OpenCalc Estimator
Volledige professionele versie met IFC/BIM integratie, team samenwerking, multi-valuta en onbeperkte features.

### OpenCalc API/CLI
Python SDK en command-line interface voor automatisering en integratie met andere systemen.

> Zie [docs/ROADMAP.md](docs/ROADMAP.md) voor de volledige product roadmap en implementatie planning.

## Features

### Begrotingen
- **Projectbeheer** - Organiseer begrotingen per project met klantgegevens
- **Hoofdstukken** - Structureer begrotingen met NL-SfB of STABU codering
- **Kostenposten** - Gedetailleerde regels met arbeid, materiaal en onderaanneming
- **Automatische berekeningen** - Subtotalen, opslagen, BTW en eindtotalen
- **Versies** - Meerdere versies per begroting

### Kostenbibliotheek
- **NL-SfB** - Nederlandse SfB elementenmethode
- **STABU** - STABU werksoorten systematiek
- **RAW** - RAW GWW systematiek
- **Eigen posten** - Maak je eigen kostenbibliotheek
- **Specificatieteksten** - Gedetailleerde technische specificaties
- **Offerteteksten** - Rich text met afbeeldingen voor offertes

### Export & Rapportage
- **PDF Export** - Professionele offertes met bedrijfslogo
- **ODS Export** - LibreOffice/Excel spreadsheet
- **IFC Export** - BIM-compatibel kostenmodel
- **Rapportpreview** - Bekijk en print direct vanuit de browser

### Integraties
- **ERPNext** - Importeer projecten en klanten uit ERPNext
- **REST API** - Volledige API voor externe koppelingen

### Installatie
- **PWA** - Installeerbaar als desktop app op Windows en Linux
- **Offline** - Werkt offline na installatie (basis functies)

## Installatie

### Vereisten
- Node.js 18 of hoger
- npm of pnpm

### Stappen

1. **Clone de repository**
   ```bash
   git clone https://github.com/OpenAEC-Foundation/Open-Calc.git
   cd Open-Calc
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Configureer environment**
   ```bash
   cp .env.example .env
   # Pas de DATABASE_URL en AUTH_SECRET aan
   ```

4. **Initialiseer database**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Als PWA installeren

1. Open de app in Chrome of Edge
2. Klik op het installeer-icoon in de adresbalk
3. OpenCalc verschijnt als desktop applicatie

## API

OpenCalc biedt een RESTful API voor alle functionaliteit.

### Endpoints

#### Projecten
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | `/api/projects` | Lijst alle projecten |
| POST | `/api/projects` | Maak nieuw project |
| GET | `/api/projects/:id` | Haal project op |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Verwijder project |

#### Begrotingen
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | `/api/projects/:id/estimates` | Lijst begrotingen |
| POST | `/api/projects/:id/estimates` | Maak begroting |
| GET | `/api/projects/:id/estimates/:estimateId` | Haal begroting op |
| PATCH | `/api/projects/:id/estimates/:estimateId` | Update begroting |

#### Export
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | `/api/projects/:id/estimates/:estimateId/export/ods` | Export ODS |
| GET | `/api/projects/:id/estimates/:estimateId/export/ifc` | Export IFC |

## Technologie

- **[Next.js 15](https://nextjs.org/)** - React framework met App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[SQLite](https://www.sqlite.org/)** - Database (ontwikkeling)
- **[NextAuth.js v5](https://next-auth.js.org/)** - Authenticatie
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - UI componenten

## Ondersteunde Standaarden

- **NL-SfB** - Nederlandse SfB elementenmethode
- **STABU** - STABU werksoorten systematiek
- **RAW** - RAW GWW systematiek
- **IFC** - Industry Foundation Classes (BIM)

## Bijdragen

Bijdragen zijn welkom!

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/nieuwe-feature`)
3. Commit je wijzigingen (`git commit -m 'Voeg nieuwe feature toe'`)
4. Push naar de branch (`git push origin feature/nieuwe-feature`)
5. Open een Pull Request

## Licentie

Dit project is gelicenseerd onder de MIT License.

---

<p align="center">
  Gemaakt met ❤️ voor de Nederlandse bouwsector
</p>
