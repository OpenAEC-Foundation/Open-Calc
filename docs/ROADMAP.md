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
- Handmatige hoeveelheden invoer
- Basis klantenbeheer

### OpenCalc Extended
**Doelgroep:** MKB bedrijven en adviesbureaus

Uitgebreide versie met BIM-integratie en kennisgetallen berekening. Gebaseerd op de methodiek uit de presentatie "BIM & €" van Gortemaker Algra Feenstra.

**Kenmerken:**
- Onbeperkt projecten
- Maximaal 20 begrotingen per project
- **High-performance grid editor** (Excel-achtig)
- Volledige keyboard navigatie (Tab, pijltjes, Enter, F2)
- Bibliotheek bewerken en eigen posten
- Excel/ODS import en export

**BIM-integratie (uit PDF "888.888 bim & €"):**
- **Kennisgetallen berekening:** Automatische kostenraming op basis van BVO (Bruto Vloer Oppervlakte)
- **BIM hoeveelheden import:** Hoeveelheden uit IFC/Revit modellen importeren
- **Hybride calculatie:** Combinatie van kengetallen en BIM hoeveelheden
- **Voortgangspercentage:** Visueel inzicht in hoeveel % gemodelleerd vs. beredeneerd is
- **Shape factors:** Gebouwvormfactoren voor nauwkeurigere ramingen
- **Departement factoren:** Afdelingspecifieke kostenfactoren
- **Indexering:** Automatische prijsindexatie, landfactor, duurzaamheidsfactor
- **SfB-sortering:** Calculaties gesorteerd volgens NL-SfB elementenmethode

**Geavanceerde functies:**
- Geavanceerde rapportage met grafieken
- Bulk operaties
- Onbeperkt templates
- 10 revisies geschiedenis
- CUF-export (Calculatie Uitwisselings Formaat)

### OpenCalc Estimator
**Doelgroep:** Professionele calculators, grote aannemers (BAM, Dura Vermeer niveau)

De complete enterprise versie voor professionele calculatiekantoren en grote bouwbedrijven. Gemodelleerd naar de functionaliteit van IBIS Calculeren en Cleopatra Enterprise.

**Alle Extended features plus:**

**Enterprise Calculatie:**
- Onbeperkte begrotingen en revisies
- Multi-project portfolio overzicht
- Vergelijkende kostenanalyse tussen projecten
- Benchmark database met afgeronde projecten
- As-built data terugkoppeling

**Werkbegroting & Nacalculatie:**
- Werkbegroting genereren uit calculatie
- MAMO-structuur (Materiaal, Arbeid, Materieel, Onderaanneming)
- Bewakingscodes voor nacalculatie
- Afwijkingsanalyse (voorcalculatie vs. nacalculatie)
- Productiestanden registratie

**Onderaannemers & Inkoop:**
- Offerte aanvragen naar onderaannemers
- Vergelijking leveranciersprijzen
- Automatische prijsopname in calculatie
- Inkooporders genereren
- Onderaannemerscontracten beheer

**Meerwerk & Wijzigingen:**
- Meerwerkbeheer met goedkeuringsworkflow
- Wijzigingsorders (Change Orders)
- Impact analyse op totaalprijs
- Klant communicatie voor meerwerk
- Verrekenstaten

**Planning & Uitvoering:**
- 4D Planning koppeling (tijd)
- Fasering per bouwdeel
- Materiaalplanning per fase
- Capaciteitsplanning personeel/materieel
- Mijlpalen bewaking

**Risico & Onzekerheid:**
- Monte Carlo risico-analyse
- Bandbreedte calculatie (+/- 10%, 20%)
- Risicoreservering per post
- AACE classificatie (Class 1-5)
- Contingency berekening

**Team & Organisatie:**
- Multi-user samenwerking
- Organisatie model met afdelingen
- Gebruikersrollen (Calculator, Projectleider, Admin)
- Gedeelde projecten en bibliotheken
- Audit trail (wie wijzigde wat)

**Integraties:**
- Volledige REST API met OpenAPI docs
- CUF import/export (IBIS compatibel)
- ERP koppelingen (AFAS, Exact, 4PS)
- BIM/IFC import (volledig)
- CO2 calculatie (zoals Dura Vermeer BLCM)

### OpenCalc API/CLI
**Doelgroep:** Developers en automatisering

Programmatische toegang tot OpenCalc via REST API en Python SDK.

**Kenmerken:**
- REST API met OpenAPI documentatie
- Python SDK (`pip install opencalc`)
- Command-line interface
- Bulk import/export
- Integratie met andere systemen
- Webhooks voor events

---

## Feature Matrix

| Feature | SBO | Extended | Estimator |
|---------|:---:|:--------:|:---------:|
| **Basis** |
| Max projecten | 10 | - | - |
| Max begrotingen/project | 5 | 20 | - |
| Card-based editor | Y | Y | Y |
| Grid editor | - | Y | Y |
| Keyboard navigatie | Basis | Volledig | Volledig |
| PDF export | Y | Y | Y |
| **Bibliotheek** |
| Bibliotheek browser | Y | Y | Y |
| Bibliotheek bewerken | - | Y | Y |
| Eigen posten toevoegen | - | Y | Y |
| Gedeelde bibliotheken | - | - | Y |
| **BIM & Kengetallen** |
| Handmatige hoeveelheden | Y | Y | Y |
| Kennisgetallen (BVO-based) | - | Y | Y |
| BIM hoeveelheden import | - | Y | Y |
| Hybride calculatie | - | Y | Y |
| Voortgangspercentage | - | Y | Y |
| Shape/departement factors | - | Y | Y |
| Volledige IFC import | - | - | Y |
| **Export/Import** |
| Excel/ODS export | - | Y | Y |
| CUF export | - | Y | Y |
| CUF import | - | - | Y |
| IFC export | - | - | Y |
| **Rapportage** |
| Basis rapportage | Y | Y | Y |
| Geavanceerde rapportage | - | Y | Y |
| Vergelijkende analyse | - | - | Y |
| Benchmark database | - | - | Y |
| **Werkbegroting** |
| Werkbegroting genereren | - | - | Y |
| Bewakingscodes | - | - | Y |
| Nacalculatie | - | - | Y |
| MAMO structuur | - | - | Y |
| **Onderaannemers** |
| Onderaannemers beheer | - | - | Y |
| Offerte aanvragen | - | - | Y |
| Prijsvergelijking | - | - | Y |
| **Meerwerk** |
| Meerwerkbeheer | - | - | Y |
| Goedkeuringsworkflow | - | - | Y |
| Verrekenstaten | - | - | Y |
| **Planning** |
| 4D Planning koppeling | - | - | Y |
| Materiaalplanning | - | - | Y |
| Capaciteitsplanning | - | - | Y |
| **Risico** |
| Risicoreservering | - | Y | Y |
| Monte Carlo analyse | - | - | Y |
| Bandbreedte calculatie | - | Y | Y |
| **Team** |
| Multi-user | - | - | Y |
| Gebruikersrollen | - | - | Y |
| Audit trail | - | - | Y |
| **Integratie** |
| API toegang | - | - | Y |
| ERP koppelingen | - | - | Y |
| Webhooks | - | - | Y |
| **Overig** |
| Templates | 3 | - | - |
| Revisie geschiedenis | - | 10 | - |
| Multi-valuta | - | - | Y |
| CO2 calculatie | - | - | Y |

*Y = Ja, - = Onbeperkt of niet beschikbaar*

---

## Technische Architectuur

### Repository Structuur (Monorepo)

```
opencalc/
├── apps/
│   ├── sbo/                    # OpenCalc-SBO (basis)
│   ├── extended/               # OpenCalc Extended (BIM + Grid)
│   ├── estimator/              # OpenCalc Estimator (Enterprise)
│   └── api/                    # Shared API Server
│
├── packages/
│   ├── core/                   # Gedeelde business logic
│   │   ├── calculations/       # Kostencalculatie logica
│   │   ├── kennisgetallen/     # BVO-based berekeningen
│   │   └── validators/         # Business rules
│   │
│   ├── database/               # Prisma schema & client
│   │
│   ├── ui-shared/              # Gedeelde UI componenten
│   │   ├── components/         # Buttons, Cards, etc.
│   │   ├── layouts/            # Page layouts
│   │   └── forms/              # Form componenten
│   │
│   ├── ui-grid/                # High-performance grid
│   │   ├── VirtualGrid/        # Virtualized scrolling
│   │   ├── CellEditors/        # Inline editors
│   │   └── KeyboardNav/        # Keyboard navigation
│   │
│   ├── bim/                    # BIM integratie
│   │   ├── ifc-parser/         # IFC bestand parser
│   │   ├── quantity-takeoff/   # Hoeveelheden extractie
│   │   └── shape-factors/      # Vormfactoren
│   │
│   ├── feature-flags/          # Feature differentiatie
│   │   └── editions/           # SBO, Extended, Estimator
│   │
│   └── integrations/           # Externe koppelingen
│       ├── cuf/                # CUF import/export
│       ├── erp/                # ERP connectors
│       └── webhooks/           # Event webhooks
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
| BIM/IFC | IFC.js, web-ifc |
| Python SDK | httpx, Pydantic, Click |

### Performance Targets

- Grid: 10.000+ rijen @ 60fps
- API response: < 200ms
- Initial page load: < 3s (LCP)
- Time to Interactive: < 5s
- IFC import: < 30s voor 50MB bestand

---

## Implementatie Roadmap

### Fase 1: Foundation (Week 1-4) ✅ VOLTOOID
- [x] Turborepo monorepo structuur opzetten
- [x] apps/sbo folder aangemaakt
- [x] packages/database package aangemaakt
- [ ] Packages extracten uit huidige codebase
  - [x] `packages/database` - Prisma schema
  - [ ] `packages/core` - Business logic
  - [ ] `packages/ui-shared` - Gedeelde componenten
- [ ] TypeScript configuratie voor alle packages
- [ ] CI/CD pipeline (GitHub Actions)

### Fase 2: Extended Edition Prep (Week 5-8)
- [ ] `apps/extended` opzetten (kopie van sbo met extended features)
- [ ] Feature flags systeem implementeren
- [ ] Edition switcher in UI
- [ ] `packages/ui-grid` basis bouwen

### Fase 3: BIM Integratie - Extended (Week 9-14)
Gebaseerd op "BIM & €" presentatie:
- [ ] `packages/bim` bouwen
- [ ] Kennisgetallen module
  - [ ] BVO-based kostenraming
  - [ ] SfB categorie mapping
  - [ ] Referentiemodellen database
- [ ] Shape factors implementatie
- [ ] Hybride calculatie (kengetallen + BIM)
- [ ] Voortgangspercentage visualisatie
- [ ] Indexering (prijsindex, landfactor, duurzaamheid)

### Fase 4: Grid Component (Week 15-18)
- [ ] `packages/ui-grid` volledig bouwen
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

### Fase 5: Estimator Edition (Week 19-28)
- [ ] `apps/estimator` opzetten
- [ ] Werkbegroting module
  - [ ] Werkbegroting uit calculatie
  - [ ] MAMO structuur
  - [ ] Bewakingscodes
- [ ] Onderaannemers module
  - [ ] Leveranciersbeheer
  - [ ] Offerte aanvragen
  - [ ] Prijsvergelijking
- [ ] Meerwerk module
  - [ ] Wijzigingsbeheer
  - [ ] Goedkeuringsworkflow
- [ ] Team collaboration
  - [ ] Organisatie model
  - [ ] User rollen
  - [ ] Gedeelde projecten
- [ ] Risico analyse
  - [ ] Monte Carlo simulatie
  - [ ] Bandbreedte berekening
- [ ] Nacalculatie
  - [ ] Afwijkingsanalyse
  - [ ] As-built terugkoppeling

### Fase 6: Integraties (Week 29-32)
- [ ] CUF import/export (IBIS compatibel)
- [ ] ERP connectors
  - [ ] AFAS koppeling
  - [ ] Exact koppeling
- [ ] Volledige IFC import
- [ ] API key management
- [ ] Webhooks

### Fase 7: Python SDK & CLI (Week 33-36)
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
// ============================================
// EDITION & ORGANIZATIONS
// ============================================

model Organization {
  id        String   @id @default(cuid())
  name      String
  edition   Edition  @default(ESTIMATOR)

  members   OrganizationMember[]
  projects  Project[]
  libraries CostLibrary[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(cuid())
  role           MemberRole   @default(CALCULATOR)

  userId         String
  user           User         @relation(...)
  organizationId String
  organization   Organization @relation(...)

  @@unique([userId, organizationId])
  @@map("organization_members")
}

enum Edition {
  SBO
  EXTENDED
  ESTIMATOR
}

enum MemberRole {
  ADMIN
  PROJECT_MANAGER
  CALCULATOR
  VIEWER
}

// ============================================
// WERKBEGROTING & NACALCULATIE
// ============================================

model WorkBudget {
  id          String   @id @default(cuid())
  estimateId  String
  estimate    Estimate @relation(...)

  status      WorkBudgetStatus @default(DRAFT)
  approvedAt  DateTime?
  approvedBy  String?

  lines       WorkBudgetLine[]
  actuals     ActualCost[]

  @@map("work_budgets")
}

model WorkBudgetLine {
  id              String     @id @default(cuid())
  workBudgetId    String
  workBudget      WorkBudget @relation(...)

  // MAMO breakdown
  bewakingscode   String
  description     String
  materialBudget  Float @default(0)
  laborBudget     Float @default(0)
  equipmentBudget Float @default(0)
  subcontrBudget  Float @default(0)

  @@map("work_budget_lines")
}

model ActualCost {
  id            String     @id @default(cuid())
  workBudgetId  String
  workBudget    WorkBudget @relation(...)

  bewakingscode String
  costType      CostType
  amount        Float
  description   String?
  invoiceRef    String?
  recordedAt    DateTime   @default(now())
  recordedBy    String

  @@map("actual_costs")
}

enum CostType {
  MATERIAL
  LABOR
  EQUIPMENT
  SUBCONTRACTOR
}

// ============================================
// ONDERAANNEMERS
// ============================================

model Subcontractor {
  id          String   @id @default(cuid())
  name        String
  contactName String?
  email       String?
  phone       String?
  specialty   String?  // e.g., "Elektra", "Stucwerk"

  quotes      SubcontractorQuote[]
  contracts   SubcontractorContract[]

  userId      String?  // null for organization-level
  user        User?    @relation(...)

  @@map("subcontractors")
}

model SubcontractorQuote {
  id              String       @id @default(cuid())
  subcontractorId String
  subcontractor   Subcontractor @relation(...)

  estimateId      String
  estimate        Estimate     @relation(...)

  description     String
  amount          Float
  validUntil      DateTime?
  status          QuoteStatus  @default(PENDING)

  requestedAt     DateTime     @default(now())
  receivedAt      DateTime?

  @@map("subcontractor_quotes")
}

enum QuoteStatus {
  PENDING
  RECEIVED
  ACCEPTED
  REJECTED
  EXPIRED
}

// ============================================
// MEERWERK
// ============================================

model ChangeOrder {
  id          String   @id @default(cuid())
  number      String   // CO-001, CO-002, etc.
  projectId   String
  project     Project  @relation(...)

  description String
  reason      String?

  laborCost     Float @default(0)
  materialCost  Float @default(0)
  equipmentCost Float @default(0)
  subcontrCost  Float @default(0)
  totalCost     Float @default(0)

  status      ChangeOrderStatus @default(DRAFT)

  requestedBy String
  requestedAt DateTime @default(now())
  approvedBy  String?
  approvedAt  DateTime?

  @@map("change_orders")
}

enum ChangeOrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  INVOICED
}

// ============================================
// RISICO ANALYSE
// ============================================

model RiskItem {
  id          String   @id @default(cuid())
  estimateId  String
  estimate    Estimate @relation(...)

  description String
  category    String?  // e.g., "Grondwerk", "Weer"

  probability Float    // 0-100%
  impactLow   Float    // min cost impact
  impactHigh  Float    // max cost impact

  mitigationPlan String?

  @@map("risk_items")
}

// ============================================
// KENNISGETALLEN & BIM
// ============================================

model BuildingReference {
  id          String   @id @default(cuid())
  name        String
  type        String   // "Kantoor", "Woning", etc.
  bvo         Float    // Bruto Vloer Oppervlakte

  // Shape factors
  gevelOpp    Float?   // Geveloppervlakte
  dakOpp      Float?   // Dakoppervlakte
  omtrek      Float?   // Omtrek

  // Department breakdown
  departments Json     // { "Kantoor": 60%, "Vergaderruimte": 20%, ... }

  // Cost per SfB
  sfbCosts    Json     // { "21": 150, "22": 80, ... } per m²

  year        Int      // Prijspeil jaar
  location    String?  // Voor landfactor

  @@map("building_references")
}

model PriceIndex {
  id        String   @id @default(cuid())
  year      Int
  quarter   Int      // 1-4
  index     Float    // e.g., 1.05 for 5% increase
  category  String   // "BOUW", "INFRA", etc.

  @@unique([year, quarter, category])
  @@map("price_indices")
}

// ============================================
// API & INTEGRATIE
// ============================================

model ApiKey {
  id          String    @id @default(cuid())
  key         String    @unique
  name        String

  permissions Json      // ["read:projects", "write:estimates", ...]

  lastUsedAt  DateTime?
  expiresAt   DateTime?

  userId      String
  user        User      @relation(...)

  createdAt   DateTime  @default(now())

  @@map("api_keys")
}

model Webhook {
  id        String   @id @default(cuid())
  url       String
  events    String[] // ["estimate.created", "project.updated", ...]
  secret    String
  active    Boolean  @default(true)

  userId    String
  user      User     @relation(...)

  @@map("webhooks")
}

// ============================================
// REVISIE GESCHIEDENIS
// ============================================

model EstimateRevision {
  id          String   @id @default(cuid())
  version     Int
  data        Json     // Snapshot of estimate at this version

  changedBy   String
  changeNote  String?

  estimateId  String
  estimate    Estimate @relation(...)

  createdAt   DateTime @default(now())

  @@map("estimate_revisions")
}
```

---

## Edition Switching

Gebruikers kunnen eenvoudig schakelen tussen edities via de instellingen. De applicatie detecteert automatisch welke features beschikbaar zijn op basis van de actieve editie.

### URL Structuur
- **SBO:** `app.opencalc.nl` of `localhost:3000`
- **Extended:** `extended.opencalc.nl` of `localhost:3001`
- **Estimator:** `pro.opencalc.nl` of `localhost:3002`

### Feature Detection
```typescript
// packages/feature-flags/src/editions.ts
export const EDITION_FEATURES = {
  SBO: {
    maxProjects: 10,
    maxEstimatesPerProject: 5,
    gridEditor: false,
    bimImport: false,
    kennisgetallen: false,
    // ...
  },
  EXTENDED: {
    maxProjects: Infinity,
    maxEstimatesPerProject: 20,
    gridEditor: true,
    bimImport: true,
    kennisgetallen: true,
    // ...
  },
  ESTIMATOR: {
    maxProjects: Infinity,
    maxEstimatesPerProject: Infinity,
    gridEditor: true,
    bimImport: true,
    kennisgetallen: true,
    werkbegroting: true,
    onderaannemers: true,
    meerwerk: true,
    risicoAnalyse: true,
    // ...
  }
};
```

---

## Voortgang

### Huidige Status: Fase 1 (Foundation) - 60% Voltooid

**Voltooid:**
- [x] Basis Next.js 15 applicatie
- [x] Prisma database schema
- [x] Authenticatie met NextAuth
- [x] Project en begroting CRUD
- [x] Bibliotheek browser
- [x] ODS export
- [x] PWA ondersteuning
- [x] Turborepo monorepo structuur
- [x] apps/sbo opgezet
- [x] packages/database opgezet

**In Progress:**
- [ ] packages/core extracten
- [ ] packages/ui-shared extracten
- [ ] apps/extended voorbereiden
- [ ] apps/estimator voorbereiden

---

## Referenties

- [BIM & € Presentatie (GAF)](./references/888.888-bim-euro.pdf) - Basis voor kennisgetallen en BIM integratie
- [IBIS Calculeren](https://www.ibis.nl/) - Referentie voor enterprise features
- [CUF Formaat](https://www.ibis.nl/kennisbank/wat-is-calculatie-uitwisselings-formaat-cuf) - Standaard uitwisselingsformaat
- [NL-SfB](https://ketenstandaard.nl/standaard/nl-sfb/) - Elementenmethode classificatie

---

## Contributing

We verwelkomen bijdragen! Zie [CONTRIBUTING.md](./CONTRIBUTING.md) voor richtlijnen.

### Prioriteiten

1. BIM/Kennisgetallen module
2. Grid component performance
3. Werkbegroting functionaliteit
4. Python SDK
5. Documentatie

---

## Licentie

OpenCalc is open source software onder de MIT licentie.

---

*Laatst bijgewerkt: Januari 2026*
