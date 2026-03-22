/**
 * data.js – Data loader for Školníček
 *
 * Architecture:
 *   app/data/catalogue.json  – lists all available modules (add a new subject here)
 *   app/data/game.json       – levels and badges (game-wide config)
 *   app/data/cs-parovky.json – Czech: paired consonants
 *   app/data/<id>.json       – future subjects (math, grammar, …)
 *
 * All exports are ES module live bindings – importers always see the current
 * value, so a single `await loadData()` in init() is enough.
 */

/* ---- live-binding exports (populated by loadData) ---- */

export let CATEGORIES  = [];
export let CATEGORY_MAP = {};
export let WORD_MAP    = {};
export let LEVELS      = [];
export let BADGES      = [];
export let BADGE_MAP   = {};

let _loaded = false;

/**
 * Fetch game config and the active module, then populate all exports.
 * Safe to call multiple times – subsequent calls are no-ops.
 *
 * @param {string} moduleId  which module to load (default: first in catalogue)
 */
export async function loadData(moduleId = null) {
  if (_loaded) return;

  const base = 'data/';

  const [catalogue, game] = await Promise.all([
    fetch(base + 'catalogue.json').then(r => r.json()),
    fetch(base + 'game.json').then(r => r.json()),
  ]);

  // Resolve module to load
  const targetId = moduleId ?? catalogue.modules[0].id;
  const moduleMeta = catalogue.modules.find(m => m.id === targetId);
  if (!moduleMeta) throw new Error(`Module "${targetId}" not found in catalogue`);

  const moduleData = await fetch(base + moduleMeta.file).then(r => r.json());

  // Populate exports (live bindings – all importers see the updated values)
  CATEGORIES  = moduleData.categories;
  CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  WORD_MAP    = Object.fromEntries(
    CATEGORIES.flatMap(cat => cat.words.map(w => [w.id, { ...w, categoryId: cat.id }]))
  );
  LEVELS  = game.levels;
  BADGES  = game.badges;
  BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

  _loaded = true;
}

/** Get current level info from total XP */
export function getLevelInfo(xp) {
  let current = LEVELS[0] ?? { level: 1, name: '', emoji: '', xpRequired: 0 };
  let next = LEVELS[1] ?? null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
      break;
    }
  }
  const xpInLevel = xp - current.xpRequired;
  const xpForNext = next ? next.xpRequired - current.xpRequired : 0;
  const progress  = next ? Math.min(1, xpInLevel / xpForNext) : 1;
  return { current, next, xpInLevel, xpForNext, progress };
}
