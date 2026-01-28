# Plan van Eisen - OpenCalc

## Doelgroepen & Versies

| Versie | Doelgroep | Complexiteit |
|--------|-----------|--------------|
| **V1** | ZZP-er / Kleine aannemer | Eenvoudig |
| **V2** | Gemiddelde aannemer / Werkvoorbereider / Calculator | Gemiddeld |
| **V3** | Professionele calculator (BAM-niveau) | Geavanceerd |

> **WP-Calc** positioneert zich tussen V2 en V3.

---

## Focus: Versie 1 (MVP)

### Kernprincipe
Combinatie van **begroting** en **offerte** in één workflow.

### Begrotingsregel Structuur

```
31 Aluminium kozijn
├── Omschrijving/Offerte tekst
├── Materiaal:      € 30.500,-
├── Arbeid:         16 uur plaatsen
└── Onderaannemer:  (optioneel)
```

Elke regel bevat:
- **Code** (bijv. 31)
- **Omschrijving** (korte titel)
- **Offerte tekst** (uitgebreide tekst voor klant)
- **Kostenopbouw:**
  - Materiaalkosten
  - Arbeid (uren × tarief)
  - Onderaannemer/Derden

---

## Uitdraai Mogelijkheden

### 1. Begroting Export

| Type | Omschrijving |
|------|--------------|
| **Open begroting** | Volledige kostenspecificatie zichtbaar (materiaal, arbeid, onderaannemer apart) |
| **Gesloten begroting** | Opslagen verwerkt in eenheidsprijzen (alleen totalen zichtbaar) |

### 2. Offerte Export

- Professionele opmaak met bedrijfsgegevens
- Offerte teksten per regel
- Totalen met/zonder BTW
- PDF export

---

## Roadmap

### Fase 1: MVP (V1)
- [x] Projectbeheer
- [x] Begrotingen aanmaken
- [x] Hoofdstukken en regels
- [x] Kostenbibliotheek (NL-SfB, STABU, RAW)
- [ ] Offerte tekst per regel
- [ ] Open/gesloten begroting export
- [ ] Offerte PDF export

### Fase 2: Uitbreiding (V2)
- [ ] Meerdere gebruikers
- [ ] Versiebeheer begrotingen
- [ ] Kopieren/dupliceren templates
- [ ] Geavanceerde opslagstructuur (AK, W&R)
- [ ] Import/export (Excel, UBL)

### Fase 3: Professional (V3)
- [ ] Multi-project dashboard
- [ ] Nacalculatie
- [ ] ERPNext integratie
- [ ] BIM/IFC koppeling
- [ ] API voor externe systemen
