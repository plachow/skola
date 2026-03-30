/**
 * data.js – Data loader for Školníček
 *
 * Architecture:
 *   app/data/catalogue.json  – lists all available modules (add a new subject here)
 *   app/data/game.json       – levels and badges (game-wide config)
 *   app/data/cs-parovky.json – Czech: paired consonants
 *   app/data/math-nasobilek.json – Math: multiplication & division tables
 *
 * All exports are ES module live bindings – importers always see the current
 * value, so a single `await loadData()` in init() is enough.
 */

/* ---- live-binding exports (populated by loadData) ---- */

export let CATEGORIES   = [];   // CS categories (backward compat)
export let CATEGORY_MAP = {};   // ALL categories from all subjects, merged
export let WORD_MAP     = {};   // ALL items (words + facts) by id
export let SUBJECTS     = [];   // [{ id, name, emoji, desc, categories }]
export let SUBJECTS_MAP = {};   // { [subjectId]: subject }
export let LEVELS       = [];
export let BADGES       = [];
export let BADGE_MAP    = {};

let _loaded = false;

/**
 * Fetch game config and all modules, then populate all exports.
 * Safe to call multiple times – subsequent calls are no-ops.
 */
export async function loadData() {
  if (_loaded) return;

  const base = 'data/';

  const [catalogue, game] = await Promise.all([
    fetch(base + 'catalogue.json').then(r => r.json()),
    fetch(base + 'game.json').then(r => r.json()),
  ]);

  // Load all module files in parallel
  const moduleDataArr = await Promise.all(
    catalogue.modules.map(m => fetch(base + m.file).then(r => r.json()))
  );

  // Build merged CATEGORY_MAP and WORD_MAP from all modules
  CATEGORY_MAP = {};
  WORD_MAP     = {};

  catalogue.modules.forEach((meta, i) => {
    const moduleData = moduleDataArr[i];
    moduleData.categories.forEach(cat => {
      // Stamp subjectId so back-buttons know where to return
      cat.subjectId = meta.subjectId;
      CATEGORY_MAP[cat.id] = cat;

      // Add items (facts for math, words for CS) to unified map
      const items = cat.facts ?? cat.words ?? [];
      items.forEach(item => {
        WORD_MAP[item.id] = { ...item, categoryId: cat.id };
      });
    });
  });

  // Build SUBJECTS list
  SUBJECTS = catalogue.modules.map((meta, i) => ({
    id:         meta.subjectId,
    name:       meta.subject,
    emoji:      meta.emoji,
    desc:       meta.desc ?? '',
    categories: moduleDataArr[i].categories,
  }));
  SUBJECTS_MAP = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));

  // Backward compat: CATEGORIES = first CS module's categories
  const csIdx = catalogue.modules.findIndex(m => m.subjectId === 'cs');
  CATEGORIES = csIdx >= 0 ? moduleDataArr[csIdx].categories : [];

  // Game config
  LEVELS    = game.levels;
  BADGES    = game.badges;
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
