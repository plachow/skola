/**
 * speech.js – Web Speech API wrapper for Czech TTS
 */

let _voice = null;
let _voicesLoaded = false;

/**
 * Load and cache a Czech voice (or best available fallback).
 * Must be called after voiceschanged fires on mobile.
 */
function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  // Prefer Czech voices
  const czVoices = voices.filter(v => v.lang.startsWith('cs'));
  if (czVoices.length) {
    // Prefer local (non-remote) voice if available
    _voice = czVoices.find(v => v.localService) || czVoices[0];
  } else {
    // Fallback: Slovak (sk) sounds reasonably close
    const skVoice = voices.find(v => v.lang.startsWith('sk'));
    // Or any European voice that might handle diacritics
    _voice = skVoice || voices.find(v => v.localService) || voices[0] || null;
  }
  _voicesLoaded = true;
}

// Load voices immediately and on the voiceschanged event (required by Chrome)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Get the cached voice (may be null if TTS not available)
 */
export function getVoice() {
  if (!_voicesLoaded) loadVoices();
  return _voice;
}

/**
 * Cancel any ongoing speech
 */
export function cancel() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speak text in Czech.
 * IMPORTANT: on iOS Safari this MUST be called from within a user gesture handler.
 *
 * @param {string} text
 * @param {number} rate  speech rate (default 0.85 – slightly slower for children)
 * @param {number} pitch pitch (default 1.0)
 * @param {string} lang  BCP-47 language tag (default 'cs-CZ')
 * @returns {SpeechSynthesisUtterance|null}
 */
export function speak(text, rate = 0.85, pitch = 1.0, lang = 'cs-CZ') {
  if (!('speechSynthesis' in window)) {
    console.warn('[speech] speechSynthesis not supported');
    return null;
  }

  // iOS Safari bug: synthesis gets stuck if not cancelled first
  cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = lang;
  utt.rate  = rate;
  utt.pitch = pitch;

  if (!_voicesLoaded) loadVoices();
  if (_voice) utt.voice = _voice;

  // iOS Safari workaround: wrap in a tiny timeout
  // The utterance must be created AND spoken within the same call stack
  // as the user gesture, so we keep timeout to 0.
  window.speechSynthesis.speak(utt);

  utt.onerror = (e) => {
    // 'interrupted' is normal when cancel() is called before a new speak()
    if (e.error !== 'interrupted') {
      console.warn('[speech] Error:', e.error);
    }
  };

  return utt;
}

/**
 * Check whether speech synthesis is available in this browser
 */
export function isSpeechAvailable() {
  return 'speechSynthesis' in window;
}
