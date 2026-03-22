# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Školníček** — Czech language learning app for primary school children. Focuses on paired consonants (párové souhlásky: b/p, d/t, g/k, v/f, h/ch, z/s) with gamification (XP, levels, badges, streaks). Deployed at `skola.plachy.cz`.

## Running the App

**Locally (no Docker):** Open `app/index.html` directly in a browser. `version.json` nebude existovat — footer se nezobrazí, vše ostatní funguje.

**With Docker:**
```bash
docker-compose up        # http://localhost:8080 (builds from source)
docker-compose build     # Rebuild after changes
```

No build step, no tests, no linting.

## Architecture

Vanilla JS SPA, hash-based routing, no frameworks, no backend.

### Key files

| Soubor | Co dělá |
|--------|---------|
| `app/js/app.js` | Routing, screen management, game logic, event handlers |
| `app/js/data.js` | Async loader — fetchuje JSON z `app/data/`, exportuje live bindings |
| `app/js/storage.js` | Veškerá persistence přes jediný klíč `skola_v1` v localStorage |
| `app/js/speech.js` | Web Speech API wrapper; preferuje ženský český hlas (Zuzana/Helena) |
| `app/css/style.css` | Mobile-first, CSS custom properties (design tokens) v `:root` |

### Data architektura

Všechna herní data jsou v `app/data/` jako JSON — **nikoli** v JS souborech:

```
app/data/
  catalogue.json     ← seznam modulů; přidání nového předmětu = jeden záznam sem
  game.json          ← levely (8) a badges (13) — herní konfigurace
  cs-parovky.json    ← 6 kategorií párových souhlásek, ~85 slov s větami
  version.json       ← generuje CI (není v gitu), tvar: {"version":"2026.03.42"}
```

**Přidání nového předmětu** (např. matematika):
1. Vytvoř `app/data/math-nasobilek.json` ve stejné struktuře jako `cs-parovky.json`
2. Přidej záznam do `catalogue.json`
3. Zavolej `loadData('math-nasobilek')` — vše ostatní funguje beze změn

`data.js` exportuje `let` bindings (ES module live bindings) — po `await loadData()` v `init()` vidí všechny importéry aktuální hodnoty.

### Game flow

1. Practice → odemyká Test při 70 % splnění
2. Test → odemyká Dictation
3. XP → 8 levelů, 13 badges
4. Dictation TTS: přečte celou větu normální rychlostí (bez opakování)

### Sentence / blank formát

```json
{ "word": "strop", "blank": "stro_", "answer": "p", "proof": "stropu",
  "sentence": "Na stro_u muzea visí model letadla." }
```

- `blank` je vždy přítomný v `sentence` jako substring (pád se přidává za `_`)
- `renderSentenceHtml` zvýrazní `blank` + navazující písmena celého slovního tvaru
- TTS: `sentence.replace(blank, word)` → přečte celou větu s doplněným slovem

## Deployment stack

```
Internet → Cloudflare (TLS, DDoS) → CF Tunnel → cloudflared na atlasu
  → Traefik :80 (routing dle Host hlavičky)
    → kontejner skola:80 (nginx:alpine, statické soubory)
```

- Traefik dashboard: `traefik.plachy.cz` → `traefik:8080`
- Veškerý app provoz: `*.plachy.cz` → `traefik:80`
- Server nemá otevřený žádný port (tunel je outbound)

Server compose soubor: `deploy/docker-compose.yml` (ne root, ten je pro lokální dev).

## CI/CD

**GitHub Actions** (`.github/workflows/deploy.yml`):
1. Vygeneruje `app/data/version.json` s CalVer verzí: `YYYY.MM.run_number`
2. Pushne image do `ghcr.io/plachow/skola:latest` + `ghcr.io/plachow/skola:VERZE`
3. Watchtower na serveru stáhne nový image automaticky (poll každých 5 minut)

**Verzování:** `2026.03.42` = rok.měsíc.číslo_běhu_Actions. Každý tag v registru = rollback bod.

## nginx cache

`nginx.conf` posílá `Cache-Control: no-cache, must-revalidate` — browser vždy validuje (ETag/304), nikdy nenačte stale verzi po deployi. Ctrl+F5 není potřeba.
