/**
 * sound.js – Web Audio API sound effects for Školníček
 * No external files — all sounds generated via oscillators.
 */

const MUTE_KEY = 'skola_muted';

let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function isMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

/** Returns new muted state */
export function toggleMute() {
  const next = !isMuted();
  localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  return next;
}

/**
 * Schedule a single oscillator tone with a fast attack / exponential decay envelope.
 * @param {number} freq  - Hz
 * @param {number} start - seconds from now
 * @param {number} dur   - seconds
 * @param {number} gain  - peak gain 0–1
 * @param {'sine'|'triangle'|'sawtooth'} type
 */
function tone(freq, start, dur, gain = 0.25, type = 'sine') {
  const ac  = ctx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.connect(g);
  g.connect(ac.destination);
  osc.type          = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now + start);
  g.gain.linearRampToValueAtTime(gain, now + start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
  osc.start(now + start);
  osc.stop(now + start + dur + 0.01);
}

/** Short double-ping: C5 → G5 */
export function playCorrect() {
  if (isMuted()) return;
  tone(523, 0,    0.10, 0.25);
  tone(784, 0.09, 0.14, 0.20);
}

/** Soft descending thud: E4 → C4 */
export function playWrong() {
  if (isMuted()) return;
  tone(330, 0,    0.09, 0.18, 'triangle');
  tone(262, 0.08, 0.18, 0.14, 'triangle');
}

/** Ascending 3-note fanfare for combo: C5 → E5 → G5 */
export function playCombo() {
  if (isMuted()) return;
  tone(523, 0,    0.08, 0.22);
  tone(659, 0.07, 0.08, 0.25);
  tone(784, 0.14, 0.20, 0.30);
}

/** Triumphant 4-note fanfare: C5 → E5 → G5 → C6 */
export function playVictory() {
  if (isMuted()) return;
  tone(523,  0,    0.14, 0.22);
  tone(659,  0.13, 0.14, 0.22);
  tone(784,  0.26, 0.14, 0.22);
  tone(1047, 0.39, 0.32, 0.28);
}

/** Sparkle arpeggio for badge: G5 → B5 → D6 → E6 */
export function playBadge() {
  if (isMuted()) return;
  tone(784,  0,    0.10, 0.20);
  tone(988,  0.09, 0.10, 0.20);
  tone(1175, 0.18, 0.10, 0.20);
  tone(1319, 0.27, 0.24, 0.25);
}

/** Descending alarm for speed-game timeout: G4 → C4 */
export function playTimeout() {
  if (isMuted()) return;
  tone(392, 0,    0.12, 0.20, 'triangle');
  tone(262, 0.11, 0.24, 0.16, 'triangle');
}
