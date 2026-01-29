# OpenCalc MCP Server

MCP (Model Context Protocol) server voor OpenCalc waarmee je via AI prompts begrotingen kunt aanmaken en beheren.

## Installatie

```bash
# Vanuit de root van het project
npm install
npm run mcp:build
```

## Configuratie voor Claude Desktop

Voeg de volgende configuratie toe aan je Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "opencalc": {
      "command": "node",
      "args": ["C:/Users/MartijnvanderKolk/Documents/GitHub/Open-Calc/packages/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "file:C:/Users/MartijnvanderKolk/Documents/GitHub/Open-Calc/prisma/dev.db"
      }
    }
  }
}
```

> **Let op:** Pas het pad aan naar de locatie van jouw OpenCalc installatie.

## Beschikbare Tools

### Project Management
- `create_project` - Maak een nieuw project aan
- `list_projects` - Toon alle projecten

### Begroting Management
- `create_estimate` - Maak een nieuwe begroting
- `list_estimates` - Toon alle begrotingen voor een project
- `get_estimate` - Haal begroting details op
- `update_estimate_settings` - Wijzig opslagpercentages en BTW
- `duplicate_estimate` - Kopieer een begroting
- `get_estimate_summary` - Krijg een samenvatting met totalen

### Hoofdstukken
- `create_chapter` - Maak een hoofdstuk aan (NL-SfB/STABU)

### Begrotingsregels
- `create_estimate_line` - Voeg een regel toe
- `create_bulk_lines` - Voeg meerdere regels tegelijk toe
- `update_estimate_line` - Wijzig een regel
- `delete_estimate_line` - Verwijder een regel

### Bibliotheek
- `search_library` - Zoek in de kostenbibliotheek
- `add_library_item_to_estimate` - Voeg bibliotheekitem toe aan begroting

## Voorbeeldprompts

### Nieuwe begroting aanmaken
```
Maak een nieuw project "Verbouwing Keuken" aan met een begroting "Hoofdbegroting".
Voeg de volgende posten toe:
- Sloopwerk bestaande keuken: 8 uur arbeid, uurtarief 45
- Nieuwe keukenkasten: materiaal 3500 euro
- Plaatsen keuken: 16 uur arbeid
- Elektrisch werk: onderaannemer 800 euro
- Schilderwerk: 12 uur arbeid, materiaal 150 euro
```

### Bestaande begroting uitbreiden
```
Voeg aan begroting [id] een hoofdstuk "Installaties" toe met de volgende regels:
- Leidingwerk water: 6m, 45 euro per meter materiaal, 0.5 uur arbeid per meter
- Afvoer aansluiten: 3 uur arbeid
```

### Begroting samenvatting
```
Geef me een overzicht van begroting [id] met alle totalen en opslagen.
```

## Eenheden

Ondersteunde eenheden:
- `st` - stuks
- `m` - meter
- `m2` - vierkante meter
- `m3` - kubieke meter
- `kg` - kilogram
- `uur` - uur

## Kostensoorten

Elke begrotingsregel kan de volgende kostensoorten bevatten:
- **Arbeid** - uren x uurtarief
- **Materiaal** - materiaalkosten per eenheid
- **Materieel** - gereedschap/machines per eenheid
- **Onderaanneming** - uitbesteed werk per eenheid

## Opslagen

Begrotingen ondersteunen cascading opslagen:
1. **Algemene kosten** (%) - op subtotaal
2. **Winst** (%) - op subtotaal + AK
3. **Risico** (%) - op subtotaal + AK + W&R
4. **BTW** (%) - op eindtotaal excl. BTW

## Development

```bash
# Build de MCP server
npm run mcp:build

# Start de server (voor testing)
npm run mcp:start
```
