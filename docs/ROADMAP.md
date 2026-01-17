# OpenCalc Product Roadmap

> Open source begrotingssoftware voor de Nederlandse bouwsector

## Product Varianten

OpenCalc bestaat uit meerdere product varianten, elk gericht op een specifieke doelgroep:

### OpenCalc-SBO (Small Business Owners)
**Doelgroep:** ZZP'ers en kleine aannemers

De basis versie van OpenCalc. Eenvoudig te gebruiken met een card-based interface en wizard-achtige flows. Perfect voor kleine bedrijven die snel professionele offertes willen maken.

**Kenmerken:**
- Maximaal 10 projecten
- Maximaal 5 begrotingen per project
- Card-based editor
- Basis bibliotheek browser
- PDF export
- 3 templates

### OpenCalc Extended
**Doelgroep:** MKB bedrijven

Uitgebreide versie met een Excel-achtige grid interface voor sneller werken. Volledig keyboard-navigeerbaar.

**Kenmerken:**
- Onbeperkt projecten
- Maximaal 20 begrotingen per project
- High-performance grid editor
- Volledige keyboard navigatie (Tab, pijltjes, Enter)
- Bibliotheek bewerken
- Excel/ODS export
- Geavanceerde rapportage
- Bulk operaties
- Onbeperkt templates
- 10 revisies geschiedenis

### OpenCalc Estimator
**Doelgroep:** Professionele calculators

De complete professionele versie voor grote aannemers en calculatiekantoren.

**Kenmerken:**
- Alle Extended features
- Onbeperkte begrotingen en revisies
- IFC import/export (BIM integratie)
- Multi-valuta ondersteuning
- Team samenwerking
- Volledige API toegang
- Onbeperkte revisie geschiedenis

### OpenCalc API/CLI
**Doelgroep:** Developers en automatisering

Programmatische toegang tot OpenCalc via REST API en Python SDK.

**Kenmerken:**
- REST API met OpenAPI documentatie
- Python SDK (`pip install opencalc`)
- Command-line interface
- Bulk import/export
- Integratie met andere systemen

---

## Feature Matrix

| Feature | SBO | Extended | Estimator |
|---------|:---:|:--------:|:---------:|
| Max projecten | 10 | - | - |
| Max begrotingen/project | 5 | 20 | - |
| Card-based editor | Y | Y | Y |
| Grid editor | - | Y | Y |
| Keyboard navigatie | Basis | Volledig | Volledig |
| Bibliotheek bewerken | - | Y | Y |
| Multi-valuta | - | - | Y |
| Geavanceerde rapportage | - | Y | Y |
| PDF export | Y | Y | Y |
| Excel/ODS export | - | Y | Y |
| IFC import/export | - | - | Y |
| Team samenwerking | - | - | Y |
| API toegang | - | - | Y |
| Bulk operaties | - | Y | Y |
| Templates | 3 | - | - |
| Revisie geschiedenis | - | 10 | - |

*Y = Ja, - = Onbeperkt of niet beschikbaar*

---

## Technische Architectuur

### Repository Structuur (Monorepo)

```
opencalc/
├── apps/
│   ├── sbo/                    # OpenCalc-SBO
│   ├── extended/               # OpenCalc Extended
│   ├── estimator/              # OpenCalc Estimator
│   └── api/                    # Shared API Server
│
├── packages/
│   ├── core/                   # Gedeelde business logic
│   ├── database/               # Prisma schema & client
│   ├── ui-shared/              # Gedeelde UI componenten
│   ├── ui-grid/                # High-performance grid
│   └── feature-flags/          # Feature differentiatie
│
├── python/
│   ├── opencalc/               # Python SDK
│   └── cli/                    # CLI tool
│
└── docs/                       # Documentatie
```

### Technologie Stack

| Component | Technologie |
|-----------|-------------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI Components | shadcn/ui, Tailwind CSS |
| Grid | TanStack Virtual (virtualisatie) |
| Database | Prisma ORM, SQLite/PostgreSQL |
| Auth | NextAuth.js v5 |
| Build | Turborepo |
| Python SDK | httpx, Pydantic, Click |

### Performance Targets

- Grid: 10.000+ rijen @ 60fps
- API response: < 200ms
- Initial page load: < 3s (LCP)
- Time to Interactive: < 5s

---

## Implementatie Roadmap

### Fase 1: Foundation (Week 1-4)
- [ ] Turborepo monorepo structuur opzetten
- [ ] Packages extracten uit huidige codebase
  - [ ] `packages/core` - Business logic
  - [ ] `packages/database` - Prisma schema
  - [ ] `packages/ui-shared` - Gedeelde componenten
- [ ] TypeScript configuratie
- [ ] CI/CD pipeline (GitHub Actions)

### Fase 2: SBO Refinement (Week 5-8)
- [ ] Huidige app migreren naar `apps/sbo`
- [ ] Feature flags systeem implementeren
- [ ] Usage limits toevoegen
- [ ] API standaardiseren met OpenAPI

### Fase 3: Grid Component (Week 9-14)
- [ ] `packages/ui-grid` bouwen
- [ ] TanStack Virtual integratie
- [ ] Keyboard navigatie implementeren
  - [ ] Tab/Shift+Tab tussen cellen
  - [ ] Pijltjes navigatie
  - [ ] Enter om te bewerken
  - [ ] Escape om te annuleren
  - [ ] F2 om editing te starten
- [ ] Copy/paste ondersteuning
- [ ] Undo/redo functionaliteit
- [ ] Batch updates met optimistic UI
- [ ] Performance optimalisatie

### Fase 4: Extended Edition (Week 15-18)
- [ ] `apps/extended` bouwen
- [ ] Grid editor integreren
- [ ] Advanced features implementeren
  - [ ] Excel/ODS export
  - [ ] Geavanceerde rapportage
  - [ ] Bulk operaties
- [ ] Template management

### Fase 5: Estimator Edition (Week 19-24)
- [ ] `apps/estimator` bouwen
- [ ] IFC import/export
- [ ] Team collaboration
  - [ ] Organisatie model
  - [ ] User rollen
  - [ ] Gedeelde projecten
- [ ] Multi-currency ondersteuning
- [ ] Volledige revisie geschiedenis
- [ ] API key management

### Fase 6: Python SDK & CLI (Week 25-28)
- [ ] Python package structuur
- [ ] API client implementatie
- [ ] Pydantic models
- [ ] CLI met Click + Rich
- [ ] Documentatie
- [ ] PyPI publicatie

---

## Database Schema Uitbreidingen

Voor de volledige feature set worden de volgende uitbreidingen toegevoegd:

```prisma
// Organisaties voor team samenwerking
model Organization {
  id        String   @id @default(cuid())
  name      String
  edition   String   @default("ESTIMATOR")
  members   User[]
  projects  Project[]
}

// API keys voor programmatische toegang
model ApiKey {
  id          String    @id @default(cuid())
  key         String    @unique
  name        String
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  userId      String
  user        User      @relation(...)
}

// Revisie geschiedenis
model EstimateRevision {
  id          String   @id @default(cuid())
  version     Int
  data        Json
  changedBy   String
  changeNote  String?
  estimateId  String
  estimate    Estimate @relation(...)
}
```

---

## Voortgang

### Huidige Status: Fase 1 (Foundation)

**Voltooid:**
- [x] Basis Next.js 15 applicatie
- [x] Prisma database schema
- [x] Authenticatie met NextAuth
- [x] Project en begroting CRUD
- [x] Bibliotheek browser
- [x] ODS export
- [x] PWA ondersteuning

**In Progress:**
- [ ] Monorepo structuur opzetten
- [ ] Packages extracten

---

## Contributing

We verwelkomen bijdragen! Zie [CONTRIBUTING.md](./CONTRIBUTING.md) voor richtlijnen.

### Prioriteiten

1. Grid component performance
2. Keyboard navigatie
3. Python SDK
4. Documentatie

---

## Licentie

OpenCalc is open source software onder de MIT licentie.

---

*Laatst bijgewerkt: Januari 2026*
