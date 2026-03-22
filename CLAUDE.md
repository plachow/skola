# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Školníček** — Czech language learning app for primary school children. Focuses on paired consonants (párové souhlásky: b/p, d/t, g/k, v/f, h/ch, z/s) with gamification (XP, levels, badges, streaks).

## Running the App

**With Docker (recommended):**
```bash
docker-compose up        # Start at http://localhost:8080
docker-compose build     # Rebuild image after changes
docker-compose down      # Stop
```

**Without Docker:** Open `app/index.html` directly in a browser. No build step needed.

There are no tests or linting configured.

## Architecture

Vanilla JavaScript SPA with hash-based routing (`#home`, `#practice`, `#test`, `#dictation`). No frameworks, no build tools, no backend.

**Key files:**
- `app/js/app.js` — Screen management, routing, game logic, event handlers (~1,160 lines)
- `app/js/data.js` — All exercise words (70+), 6 consonant categories, 8 XP levels, 13 badge definitions
- `app/js/storage.js` — All persistence via a single `skola_v1` localStorage key
- `app/js/speech.js` — Web Speech API wrapper; prioritizes Czech voices, falls back to Slovak/European

**Game flow:**
1. Practice mode → unlocks Test at 70% completion
2. Test mode → unlocks Dictation
3. XP earned from correct answers drives level/badge progression

**CSS** uses custom properties (design tokens) defined at `:root` in `style.css`. Mobile-first, no external CSS framework.

## Deployment

Docker image: `nginx:alpine` serving static files from `app/` with gzip enabled. Port mapping: host `8080` → container `80`.
