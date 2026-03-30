/**
 * storage.js – localStorage persistence layer
 * All data under key 'skola_v1'
 */

import { getLevelInfo, LEVELS } from './data.js';

const STORAGE_KEY = 'skola_v1';

/** Default state shape */
function defaultState() {
  return {
    user: null,             // string | null
    xp: 0,
    streak: {
      count: 0,
      lastDate: null,       // ISO date string YYYY-MM-DD
    },
    badges: [],             // array of badge ids
    progress: {},           // { [categoryId]: { practice, test, dictation } }
  };
}

/** Progress entry shape for a single mode */
function defaultModeProgress() {
  return {
    bestScore:       0,     // 0–1 float (first-attempt correct rate)
    bestStars:       0,     // 0–3
    completions:     0,     // times completed
    lastCompleted:   null,  // ISO timestamp
  };
}

/** Default category progress */
function defaultCatProgress() {
  return {
    practice:  defaultModeProgress(),
    test:      defaultModeProgress(),
    dictation: defaultModeProgress(),
    game:      defaultModeProgress(),
  };
}

/* -------- raw read/write ---------------------------------- */

export function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Merge with default to handle new fields in future
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

/* -------- user ------------------------------------------- */

export function getUser() {
  return getAll().user;
}

export function saveUser(name) {
  const data = getAll();
  data.user = name.trim();
  saveAll(data);
}

/* -------- XP & levels ------------------------------------ */

export function getXP() {
  return getAll().xp || 0;
}

/**
 * addXP – add amount, returns { newXP, oldLevel, newLevel, didLevelUp }
 */
export function addXP(amount) {
  const data    = getAll();
  const oldXP   = data.xp || 0;
  const oldInfo = getLevelInfo(oldXP);
  data.xp       = oldXP + amount;
  const newInfo = getLevelInfo(data.xp);
  saveAll(data);
  return {
    newXP:      data.xp,
    oldLevel:   oldInfo.current.level,
    newLevel:   newInfo.current.level,
    levelInfo:  newInfo,
    didLevelUp: newInfo.current.level > oldInfo.current.level,
    newLevelData: newInfo.current,
  };
}

/* -------- streak ----------------------------------------- */

export function getStreak() {
  const data = getAll();
  return data.streak || { count: 0, lastDate: null };
}

/**
 * updateStreak – call once per session completion.
 * Returns updated streak count.
 */
export function updateStreak() {
  const data  = getAll();
  if (!data.streak) data.streak = { count: 0, lastDate: null };

  const today     = todayString();
  const last      = data.streak.lastDate;

  if (last === today) {
    // Already counted today
  } else if (last === yesterdayString()) {
    data.streak.count += 1;
    data.streak.lastDate = today;
  } else {
    // Streak broken or first day
    data.streak.count = 1;
    data.streak.lastDate = today;
  }
  saveAll(data);
  return data.streak.count;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* -------- badges ----------------------------------------- */

export function getBadges() {
  return getAll().badges || [];
}

/**
 * awardBadge – returns true if newly awarded, false if already had it
 */
export function awardBadge(id) {
  const data = getAll();
  if (!data.badges) data.badges = [];
  if (data.badges.includes(id)) return false;
  data.badges.push(id);
  saveAll(data);
  return true;
}

/* -------- progress --------------------------------------- */

export function getProgress(categoryId) {
  const data = getAll();
  if (!data.progress) data.progress = {};
  return data.progress[categoryId] || defaultCatProgress();
}

/**
 * saveProgress – merge new fields into the stored progress for a category/mode.
 * modeData: Partial<ModeProgress>
 */
export function saveProgress(categoryId, mode, modeData) {
  const data = getAll();
  if (!data.progress)              data.progress = {};
  if (!data.progress[categoryId]) data.progress[categoryId] = defaultCatProgress();
  const existing = data.progress[categoryId][mode] || defaultModeProgress();
  data.progress[categoryId][mode] = {
    ...existing,
    ...modeData,
    bestScore: Math.max(existing.bestScore, modeData.bestScore ?? 0),
    bestStars: Math.max(existing.bestStars, modeData.bestStars ?? 0),
    completions: (existing.completions || 0) + 1,
    lastCompleted: new Date().toISOString(),
  };
  saveAll(data);
}

/* -------- reset (debugging) ------------------------------ */

export function reset() {
  localStorage.removeItem(STORAGE_KEY);
  console.info('[storage] State reset.');
}

// Expose reset on window for dev convenience
if (typeof window !== 'undefined') {
  window.__skolaReset = reset;
}
