# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Školníček** — Czech + Math learning app for primary school children. Subjects: Český jazyk (párové souhlásky b/p, d/t, g/k, v/f, h/ch, z/s) a Matematika (násobilka & dělení 2–10). Gamification: XP, levels, badges, streaks. Deployed at `skola.plachy.cz`.

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
  catalogue.json        ← seznam modulů; přidání nového předmětu = jeden záznam sem
  game.json             ← levely (8) a badges (16) — herní konfigurace
  cs-parovky.json       ← 7 kategorií párových souhlásek, ~85 slov s větami
  math-nasobilek.json   ← 18 kategorií (násobilka 2–10 + dělení 2–10), 180 příkladů
  version.json          ← generuje CI (není v gitu), tvar: {"version":"2026.03.42"}
```

**Přidání nového předmětu:**
1. Vytvoř `app/data/<id>.json` s klíčem `categories[]`
2. Každá kategorie: `{ id, name, emoji, color, unlockAfter, type, subjectId, words[] | facts[] }`
   - CS: `type` není, `words[]` obsahuje `{ id, word, blank, answer, proof, sentence }`
   - Math: `type: "multiply"|"divide"`, `facts[]` obsahuje `{ id, a, b, product }` nebo `{ id, dividend, divisor, quotient }`
3. Přidej záznam do `catalogue.json` (pole `modules`)
4. `loadData()` načte všechny moduly automaticky — vše ostatní funguje beze změn

`data.js` exportuje: `CATEGORY_MAP` (všechny kategorie z všech předmětů), `SUBJECTS` + `SUBJECTS_MAP` (seznam předmětů), `WORD_MAP` (všechny items).

### Game flow

**Routing:** `#home` → výběr předmětu → `#subject?id=cs|math` → `#category?categoryId=...` → `#exercise?...` nebo `#game?...`

**CS (Český jazyk):**
1. Practice → odemyká Test při 70 % splnění
2. Test → odemyká Diktát
3. Diktát: TTS přečte větu normální rychlostí

**Matematika:**
1. Practice → odemyká Test při 70 % splnění (4 možnosti výběru, 2× správně = zvládnuto)
2. Test → odemyká Rychlostní hru
3. Rychlostní hra: 20 otázek, 8s časovač, combo bonus (×2 při 3 v řadě, ×3 při 5)

**Progression:** nasob-2 (always) → nasob-3 (after nasob-2) → ... → nasob-10; deleni-N unlocks after nasob-N

**XP:** 8 levelů, 16 badges (13 CS + 3 math)

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
