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

  // Known female Czech voice names across platforms:
  //   macOS/iOS: "Zuzana"
  //   Windows:   "Helena", "Microsoft Helena"
  //   Google:    "Google čeština" (female)
  const FEMALE_NAMES = ['zuzana', 'helena', 'vlasta', 'šárka', 'google češt'];

  const isFemale = v => FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n));

  const czVoices = voices.filter(v => v.lang.startsWith('cs'));
  if (czVoices.length) {
    _voice =
      czVoices.find(v => isFemale(v) && v.localService) ??  // female + local
      czVoices.find(v => isFemale(v)) ??                    // female remote
      czVoices.find(v => v.localService) ??                 // any local Czech
      czVoices[0];                                          // any Czech
  } else {
    // Fallback: Slovak (sk) sounds reasonably close
    const skVoice = voices.find(v => v.lang.startsWith('sk'));
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
 * Speak text, then repeat it at 75% of the original rate (same pitch).
 * Useful for dictation: hear it naturally, then slowly.
 */
export function speakWithRepeat(text, rate = 0.85, pitch = 1.0, lang = 'cs-CZ') {
  const utt = speak(text, rate, pitch, lang);
  if (!utt) return;
  utt.onend = () => {
    speak(text, rate * 0.75, pitch, lang);
  };
}

/**
 * Check whether speech synthesis is available in this browser
 */
export function isSpeechAvailable() {
  return 'speechSynthesis' in window;
}
