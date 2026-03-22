/**
 * app.js – Školníček main application
 * Vanilla JS ES modules, hash-based routing
 */

import { CATEGORIES, CATEGORY_MAP, WORD_MAP, BADGES, BADGE_MAP, getLevelInfo } from './data.js';
import {
  getAll, saveAll,
  getUser, saveUser,
  getXP, addXP,
  getStreak, updateStreak,
  getBadges, awardBadge,
  getProgress, saveProgress,
} from './storage.js';
import { speak, cancel, isSpeechAvailable } from './speech.js';

/* ============================================================
   ROUTING
   ============================================================ */

const SCREENS = {
  welcome:  document.getElementById('screen-welcome'),
  home:     document.getElementById('screen-home'),
  category: document.getElementById('screen-category'),
  exercise: document.getElementById('screen-exercise'),
  results:  document.getElementById('screen-results'),
};

/** Navigate to a hash route, e.g. navigate('home') or navigate('category', { categoryId: 'b-p' }) */
function navigate(route, params = {}) {
  const query = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  window.location.hash = route + query;
}

function getRouteParams() {
  const hash = window.location.hash.slice(1); // remove #
  const [route, queryStr] = hash.split('?');
  const params = queryStr ? Object.fromEntries(new URLSearchParams(queryStr)) : {};
  return { route: route || 'welcome', params };
}

function showScreen(name) {
  Object.entries(SCREENS).forEach(([key, el]) => {
    if (el) el.classList.toggle('hidden', key !== name);
  });
}

window.addEventListener('hashchange', handleRoute);

function handleRoute() {
  const { route, params } = getRouteParams();
  switch (route) {
    case 'welcome':  renderWelcome();               break;
    case 'home':     renderHome();                  break;
    case 'category': renderCategory(params);        break;
    case 'exercise': renderExercise(params);        break;
    case 'results':
      // Results are rendered directly by finishSession().
      // On a hard refresh with #results hash, redirect home.
      navigate(getUser() ? 'home' : 'welcome');
      break;
    default:
      navigate(getUser() ? 'home' : 'welcome');
  }
}

/* ============================================================
   INIT
   ============================================================ */

function init() {
  const user = getUser();
  const { route } = getRouteParams();

  if (!user) {
    // First launch – always show welcome.
    // If hash is already #welcome, hashchange won't fire, so call directly.
    if (route === 'welcome' || !route) {
      renderWelcome();
    } else {
      navigate('welcome');
    }
  } else {
    // Returning user
    if (!route || route === 'welcome') {
      // Redirect away from welcome; if hash is already #home hashchange won't fire
      if (route === 'home') {
        renderHome();
      } else {
        navigate('home');
      }
    } else {
      // The current hash is meaningful – render it directly (no hashchange needed)
      handleRoute();
    }
  }
}

/* ============================================================
   WELCOME SCREEN
   ============================================================ */

let _welcomeInitialized = false;

function renderWelcome() {
  showScreen('welcome');
  const input    = document.getElementById('name-input');
  const btnStart = document.getElementById('btn-welcome-start');

  // Reset field state
  input.value       = '';
  btnStart.disabled = true;

  // Attach listeners only once (the form lives for the app lifetime)
  if (!_welcomeInitialized) {
    _welcomeInitialized = true;

    input.addEventListener('input', () => {
      btnStart.disabled = input.value.trim().length === 0;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim().length > 0) {
        submitWelcome();
      }
    });

    btnStart.addEventListener('click', submitWelcome);
  }

  input.focus();

  function submitWelcome() {
    const name = input.value.trim();
    if (!name) return;
    saveUser(name);
    navigate('home');
  }
}

/* ============================================================
   HOME SCREEN
   ============================================================ */

function renderHome() {
  showScreen('home');

  const user      = getUser();
  const xp        = getXP();
  const streak    = getStreak();
  const levelInfo = getLevelInfo(xp);
  const badges    = getBadges();

  // Header
  document.getElementById('home-username').textContent   = user || '';
  document.getElementById('home-streak-count').textContent = streak.count;
  document.getElementById('home-level-emoji').textContent  = levelInfo.current.emoji;
  document.getElementById('home-level-name').textContent   = levelInfo.current.name;
  document.getElementById('home-xp-label').textContent     = `${xp} XP`;

  // XP bar
  const xpBar = document.getElementById('home-xp-bar');
  xpBar.style.width = `${Math.round(levelInfo.progress * 100)}%`;

  // Rename button
  const btnRename  = document.getElementById('btn-rename');
  const nameEl     = document.getElementById('home-username');
  const renameInput = document.getElementById('rename-input');

  btnRename.onclick = () => {
    renameInput.value = getUser() || '';
    nameEl.style.display    = 'none';
    btnRename.style.display = 'none';
    renameInput.style.display = '';
    renameInput.focus();
    renameInput.select();

    const commit = () => {
      const val = renameInput.value.trim();
      if (val) {
        saveUser(val);
        nameEl.textContent = val;
      }
      renameInput.style.display   = 'none';
      nameEl.style.display        = '';
      btnRename.style.display     = '';
      renameInput.removeEventListener('blur', commit);
    };

    renameInput.addEventListener('blur', commit);
    renameInput.onkeydown = (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); renameInput.blur(); }
      if (e.key === 'Escape') {
        renameInput.removeEventListener('blur', commit);
        renameInput.style.display = 'none';
        nameEl.style.display      = '';
        btnRename.style.display   = '';
      }
    };
  };

  // Module button → category list
  const btnModule = document.getElementById('btn-module-parovky');
  btnModule.onclick = () => {
    const grid = document.getElementById('section-categories');
    grid.scrollIntoView({ behavior: 'smooth' });
  };

  // Categories grid
  renderCategoriesGrid();

  // Badge showcase (last earned badge)
  const sectionBadges = document.getElementById('section-badges');
  if (badges.length > 0) {
    sectionBadges.style.display = '';
    const lastId   = badges[badges.length - 1];
    const badgeDef = BADGE_MAP[lastId];
    if (badgeDef) {
      document.getElementById('home-badge-showcase').innerHTML = `
        <span class="badge-item-emoji">${badgeDef.emoji}</span>
        <div class="badge-item-info">
          <div class="badge-name">${badgeDef.name}</div>
          <div class="badge-desc">${badgeDef.desc}</div>
        </div>`;
    }
  } else {
    sectionBadges.style.display = 'none';
  }
}

function renderCategoriesGrid() {
  const grid = document.getElementById('home-categories-grid');
  grid.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const prog    = getProgress(cat.id);
    const locked  = isCategoryLocked(cat);
    const btn     = document.createElement('button');
    btn.className = 'cat-card';
    btn.style.setProperty('--cat-color', cat.color);

    // Progress dots: practice, test, dictation
    const modes = ['practice', 'test', 'dictation'];
    const dotsHtml = modes.map(m => {
      const p = prog[m];
      let cls = 'dot locked';
      if (!locked) {
        if (p.completions > 0) {
          cls = p.bestStars >= 3 ? 'dot done' : 'dot active';
        } else {
          cls = 'dot';
        }
      }
      return `<span class="${cls}"></span>`;
    }).join('');

    btn.innerHTML = `
      ${locked ? '<span class="cat-card-locked" aria-hidden="true">🔒</span>' : ''}
      <span class="cat-card-emoji">${cat.emoji}</span>
      <div class="cat-card-name">${cat.name}</div>
      <div class="cat-card-dots">${dotsHtml}</div>
    `;

    btn.setAttribute('aria-label', `${cat.name}${locked ? ' – zamčeno' : ''}`);
    btn.disabled = locked;

    if (!locked) {
      btn.addEventListener('click', () => navigate('category', { categoryId: cat.id }));
    }

    grid.appendChild(btn);
  });
}

function isCategoryLocked(cat) {
  if (!cat.unlockAfter) return false;
  const prereqProg = getProgress(cat.unlockAfter);
  // Unlock when practice mode has at least one completion
  return prereqProg.practice.completions === 0;
}

/* ============================================================
   CATEGORY SCREEN
   ============================================================ */

function renderCategory({ categoryId }) {
  if (!categoryId || !CATEGORY_MAP[categoryId]) {
    navigate('home');
    return;
  }

  showScreen('category');
  const cat  = CATEGORY_MAP[categoryId];
  const prog = getProgress(categoryId);

  // Header color
  const header = document.getElementById('cat-header');
  header.style.setProperty('--cat-color-header', cat.color);
  header.style.background = cat.color;

  document.getElementById('cat-title').textContent      = cat.name;
  document.getElementById('cat-hero-emoji').textContent = cat.emoji;
  document.getElementById('cat-hero-name').textContent  = cat.name + ' – Párové souhlásky';
  document.getElementById('cat-hero-count').textContent = `${cat.words.length} slov`;

  // Back
  document.getElementById('cat-back').onclick = () => navigate('home');

  // Mode unlock logic
  const practiceScore = prog.practice.bestScore;
  const testDone      = prog.test.completions > 0;
  const testLocked    = practiceScore < 0.7;
  const dictLocked    = !testDone;

  // Mode dots helper
  function makeDots(modeKey) {
    const p = prog[modeKey];
    return Array.from({ length: 3 }, (_, i) => {
      let cls = 'dot';
      if (p.completions > 0) {
        cls = i < p.bestStars ? 'dot done' : 'dot';
      }
      return `<span class="${cls}"></span>`;
    }).join('');
  }

  document.getElementById('mode-dots-practice').innerHTML  = makeDots('practice');
  document.getElementById('mode-dots-test').innerHTML      = makeDots('test');
  document.getElementById('mode-dots-dictation').innerHTML = makeDots('dictation');

  // Lock icons
  const lockTest = document.getElementById('mode-lock-test');
  const lockDict = document.getElementById('mode-lock-dictation');
  lockTest.style.display = testLocked ? '' : 'none';
  lockDict.style.display = dictLocked ? '' : 'none';

  const btnTest = document.getElementById('mode-btn-test');
  const btnDict = document.getElementById('mode-btn-dictation');
  btnTest.disabled = testLocked;
  btnDict.disabled = dictLocked;

  // Lock messages
  const msgTest = document.getElementById('lock-message');
  const msgDict = document.getElementById('lock-message-dict');
  msgTest.classList.toggle('hidden', !testLocked);
  msgDict.classList.toggle('hidden', !dictLocked);

  // Mode buttons
  const btnPractice = document.getElementById('mode-btn-practice');
  btnPractice.onclick = () => navigate('exercise', { categoryId, mode: 'practice' });
  btnTest.onclick     = testLocked ? null : () => navigate('exercise', { categoryId, mode: 'test' });
  btnDict.onclick     = dictLocked ? null : () => navigate('exercise', { categoryId, mode: 'dictation' });
}

/* ============================================================
   SESSION STATE
   ============================================================ */

/** Current active session (null when no exercise running) */
let session = null;

function createSession(categoryId, mode) {
  const cat   = CATEGORY_MAP[categoryId];
  const words = [...cat.words];

  return {
    mode,
    categoryId,
    cat,
    // Shuffle words at start
    queue: shuffleArray(words.slice()),
    // For test/dictation: fixed ordered list
    testList: mode !== 'practice' ? shuffleArray(words.slice()) : null,
    testIndex: 0,
    wordPerf: Object.fromEntries(words.map(w => [w.id, 0])),
    answered: [],        // { wordId, correct, firstAttempt }
    xpEarned: 0,
    answerStreak: 0,     // consecutive correct answers (for streak bonus)
    currentWord: null,
    pendingAdvance: null,
  };
}

/* ============================================================
   EXERCISE SCREEN
   ============================================================ */

function renderExercise({ categoryId, mode }) {
  if (!categoryId || !mode || !CATEGORY_MAP[categoryId]) {
    navigate('home');
    return;
  }

  cancel(); // Stop any ongoing speech
  showScreen('exercise');

  session = createSession(categoryId, mode);

  // Back button
  document.getElementById('ex-back').onclick = () => {
    cancel();
    clearPendingAdvance();
    navigate('category', { categoryId });
  };

  if (mode === 'dictation') {
    startDictationMode();
  } else {
    startQuizMode();
  }
}

/* ---- Quiz Mode (practice & test) ----------------------- */

function startQuizMode() {
  document.getElementById('ex-main-quiz').classList.remove('hidden');
  document.getElementById('ex-main-dictation').classList.add('hidden');
  showNextQuizWord();
}

function showNextQuizWord() {
  const s = session;
  let word;

  if (s.mode === 'practice') {
    if (s.queue.length === 0) {
      finishSession();
      return;
    }
    word = s.queue[0];
  } else {
    // test
    if (s.testIndex >= s.testList.length) {
      finishSession();
      return;
    }
    word = s.testList[s.testIndex];
  }

  s.currentWord = word;
  renderQuizWord(word);
}

function renderQuizWord(word) {
  const s   = session;
  const cat = s.cat;

  // Sentence
  const sentenceEl = document.getElementById('ex-sentence');
  sentenceEl.innerHTML = renderSentenceHtml(word.sentence, word.blank);

  // Word with blank
  const wordEl = document.getElementById('ex-word');
  wordEl.innerHTML = renderBlankWord(word.blank);

  // Hint (practice only)
  const hintBar   = document.getElementById('ex-hint-bar');
  const hintPanel = document.getElementById('hint-panel');
  const btnHint   = document.getElementById('btn-hint');

  if (s.mode === 'practice') {
    hintBar.style.display = '';
    hintPanel.classList.add('hidden');
    hintPanel.textContent = '';
    btnHint.onclick = () => {
      hintPanel.textContent = `💡 Pomůže ti: ${word.proof}`;
      hintPanel.classList.remove('hidden');
    };
  } else {
    hintBar.style.display = 'none';
  }

  // Feedback area
  const feedback = document.getElementById('ex-feedback');
  feedback.textContent = '';
  feedback.className   = 'ex-feedback';

  // Option buttons – always two choices: the pair letters
  const optionsEl = document.getElementById('ex-options');
  optionsEl.innerHTML = '';

  // Shuffle so correct answer isn't always in same position
  const pair = [...cat.pair];
  shuffleArray(pair);

  pair.forEach(letter => {
    const btn = document.createElement('button');
    btn.className   = 'option-btn';
    btn.textContent = letter;
    btn.setAttribute('aria-label', `Písmeno ${letter}`);
    btn.addEventListener('click', () => onQuizAnswer(letter, word));
    optionsEl.appendChild(btn);
  });

  // Progress
  updateQuizProgress();
  updateStreakDisplay();
}

function onQuizAnswer(chosenLetter, word) {
  const s = session;
  if (s.pendingAdvance) return; // Debounce – ignore taps during feedback

  const isCorrect = chosenLetter.toLowerCase() === word.answer.toLowerCase();
  const isFirstAttempt = !s.answered.find(a => a.wordId === word.id);

  // Record answer
  s.answered.push({ wordId: word.id, correct: isCorrect, firstAttempt: isFirstAttempt });

  // Update streak counter
  if (isCorrect) {
    s.answerStreak++;
  } else {
    s.answerStreak = 0;
  }

  updateStreakDisplay();

  // Show visual feedback
  const optionBtns = document.querySelectorAll('.option-btn');
  const wordEl     = document.getElementById('ex-word');
  const hintPanel  = document.getElementById('hint-panel');

  // Disable all options
  optionBtns.forEach(btn => { btn.disabled = true; });

  // Mark correct/wrong on buttons
  optionBtns.forEach(btn => {
    if (btn.textContent.toLowerCase() === word.answer.toLowerCase()) {
      btn.classList.add('correct');
    } else if (btn.textContent.toLowerCase() === chosenLetter.toLowerCase() && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  // Fill the blank in the word display
  const blankEl = wordEl.querySelector('.blank');
  if (blankEl) {
    blankEl.textContent = isCorrect ? chosenLetter : word.answer;
    blankEl.classList.add(isCorrect ? 'filled-correct' : 'filled-wrong');
  }

  // Animate word
  wordEl.classList.remove('bounce', 'shake');
  // Force reflow
  void wordEl.offsetWidth;
  wordEl.classList.add(isCorrect ? 'bounce' : 'shake');

  // Feedback text
  const feedbackEl = document.getElementById('ex-feedback');
  if (isCorrect) {
    feedbackEl.textContent = randomCorrectMessage();
    feedbackEl.className   = 'ex-feedback correct';
  } else {
    feedbackEl.textContent = `Správně je: ${word.word}`;
    feedbackEl.className   = 'ex-feedback wrong';
    // Show proof hint automatically on wrong in practice
    if (s.mode === 'practice') {
      hintPanel.textContent = `💡 Pomůže ti: ${word.proof}`;
      hintPanel.classList.remove('hidden');
    }
  }

  // XP calculation (deferred to graduation / test answer)
  if (s.mode === 'practice') {
    handlePracticeQueue(word, isCorrect);
  } else if (s.mode === 'test') {
    // XP for test: 20 per correct, with streak bonus
    if (isCorrect) {
      let xp = 20;
      if (s.answerStreak >= 3) xp += 5;
      s.xpEarned += xp;
    }
    s.testIndex++;
  }

  // Schedule advance
  const delay = isCorrect ? 1200 : 2000;
  s.pendingAdvance = setTimeout(() => {
    s.pendingAdvance = null;
    showNextQuizWord();
  }, delay);
}

function handlePracticeQueue(word, isCorrect) {
  const s = session;
  // Remove current word from front of queue
  s.queue.shift();

  if (isCorrect) {
    s.wordPerf[word.id] = (s.wordPerf[word.id] || 0) + 1;
    if (s.wordPerf[word.id] >= 2) {
      // Graduated – XP reward
      let xp = 10;
      if (s.answerStreak >= 3) xp += 5;
      s.xpEarned += xp;
      showXpFlash(`+${xp} XP`);
      // Don't add back to queue
    } else {
      // Re-insert at middle of remaining queue
      const mid = Math.max(1, Math.floor(s.queue.length / 2));
      s.queue.splice(mid, 0, word);
    }
  } else {
    s.wordPerf[word.id] = 0;
    // Re-insert near end (but not last to avoid always being last)
    const pos = Math.max(0, s.queue.length - 1);
    s.queue.splice(pos, 0, word);
  }
}

function updateQuizProgress() {
  const s = session;
  let current, total;

  if (s.mode === 'practice') {
    // Count unique graduated words
    const graduated = Object.values(s.wordPerf).filter(streak => streak >= 2).length;
    const totalWords = s.cat.words.length;
    current = graduated;
    total   = totalWords;
    document.getElementById('ex-progress-label').textContent = `Zvládnuto: ${current} / ${total}`;
  } else {
    current = s.testIndex;
    total   = s.testList.length;
    document.getElementById('ex-progress-label').textContent = `Otázka ${current + 1} / ${total}`;
  }

  const pct = total > 0 ? (current / total) * 100 : 0;
  document.getElementById('ex-progress-fill').style.width = `${pct}%`;
}

/* ---- Dictation Mode ------------------------------------- */

function startDictationMode() {
  document.getElementById('ex-main-quiz').classList.add('hidden');
  document.getElementById('ex-main-dictation').classList.remove('hidden');
  showNextDictationWord();
}

function showNextDictationWord() {
  const s = session;

  if (s.queue.length === 0) {
    finishSession();
    return;
  }

  const word = s.queue[0];
  s.currentWord = word;
  renderDictationWord(word);
}

function renderDictationWord(word) {
  const s = session;

  // Sentence (shown without blank – gives context)
  const sentEl = document.getElementById('ex-dict-sentence');
  sentEl.innerHTML = renderSentenceHtml(word.sentence, word.blank);

  // Clear input
  const inputEl = document.getElementById('dict-input');
  inputEl.value = '';
  inputEl.disabled = false;

  const feedbackEl = document.getElementById('ex-dict-feedback');
  feedbackEl.textContent = '';
  feedbackEl.className   = 'ex-feedback';

  const submitBtn = document.getElementById('btn-dict-submit');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Zkontrolovat ✓';

  // Speaker button – speak word on load (safe on desktop; iOS needs tap)
  const speakerBtn = document.getElementById('btn-speaker');
  // Remove old listener by cloning
  const newSpeaker = speakerBtn.cloneNode(true);
  speakerBtn.parentNode.replaceChild(newSpeaker, speakerBtn);
  const fullSentence = word.sentence.replace(word.blank, word.word);
  newSpeaker.addEventListener('click', () => {
    speak(fullSentence);
  });

  // Auto-speak on desktop/Android (not iOS – no user gesture yet for initial load)
  // We try to speak; it will silently fail on iOS until a gesture is made
  setTimeout(() => speak(fullSentence), 300);

  // Submit handler
  const newSubmit = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
  newSubmit.addEventListener('click', () => onDictationSubmit(word));

  // Enter key on input
  inputEl.onkeydown = (e) => {
    if (e.key === 'Enter') onDictationSubmit(word);
  };

  // Progress
  const graduated = Object.values(s.wordPerf).filter(v => v >= 2).length;
  const total     = s.cat.words.length;
  document.getElementById('ex-progress-label').textContent = `Zvládnuto: ${graduated} / ${total}`;
  const pct = total > 0 ? (graduated / total) * 100 : 0;
  document.getElementById('ex-progress-fill').style.width = `${pct}%`;

  updateStreakDisplay();

  // Focus input
  inputEl.focus();
}

function onDictationSubmit(word) {
  const s = session;
  if (s.pendingAdvance) return;

  const inputEl    = document.getElementById('dict-input');
  const feedbackEl = document.getElementById('ex-dict-feedback');
  const submitBtn  = document.getElementById('btn-dict-submit');

  const userInput  = inputEl.value.trim();
  if (!userInput) return;

  // Case-insensitive comparison, but diacritics must match
  const isCorrect = userInput.toLowerCase() === word.word.toLowerCase();

  const isFirstAttempt = !s.answered.find(a => a.wordId === word.id);
  s.answered.push({ wordId: word.id, correct: isCorrect, firstAttempt: isFirstAttempt });

  if (isCorrect) {
    s.answerStreak++;
    feedbackEl.textContent = `✓ Správně! ${word.word}`;
    feedbackEl.className   = 'ex-feedback correct';
  } else {
    s.answerStreak = 0;
    feedbackEl.textContent = `✗ Správně je: ${word.word}`;
    feedbackEl.className   = 'ex-feedback wrong';
  }

  updateStreakDisplay();

  inputEl.disabled  = true;
  submitBtn.disabled = true;

  // Queue management (same as practice)
  s.queue.shift();
  if (isCorrect) {
    s.wordPerf[word.id] = (s.wordPerf[word.id] || 0) + 1;
    if (s.wordPerf[word.id] >= 2) {
      let xp = 30;
      if (s.answerStreak >= 3) xp += 5;
      s.xpEarned += xp;
      showXpFlash(`+${xp} XP`);
    } else {
      const mid = Math.max(1, Math.floor(s.queue.length / 2));
      s.queue.splice(mid, 0, word);
    }
  } else {
    s.wordPerf[word.id] = 0;
    const pos = Math.max(0, s.queue.length - 1);
    s.queue.splice(pos, 0, word);
  }

  // Update progress bar
  const graduated = Object.values(s.wordPerf).filter(v => v >= 2).length;
  const total     = s.cat.words.length;
  const pct = total > 0 ? (graduated / total) * 100 : 0;
  document.getElementById('ex-progress-fill').style.width = `${pct}%`;
  document.getElementById('ex-progress-label').textContent = `Zvládnuto: ${graduated} / ${total}`;

  s.pendingAdvance = setTimeout(() => {
    s.pendingAdvance = null;
    showNextDictationWord();
  }, isCorrect ? 1200 : 2000);
}

function clearPendingAdvance() {
  if (session && session.pendingAdvance) {
    clearTimeout(session.pendingAdvance);
    session.pendingAdvance = null;
  }
}

/* ============================================================
   SESSION FINISH
   ============================================================ */

function finishSession() {
  const s = session;
  cancel();

  // Calculate results
  const totalWords      = s.cat.words.length;
  const firstAttempts   = s.answered.filter(a => a.firstAttempt);
  const correctFirst    = firstAttempts.filter(a => a.correct);
  const score           = firstAttempts.length > 0 ? correctFirst.length / firstAttempts.length : 0;
  const stars           = calcStars(score);
  const wrongAnswers    = firstAttempts
    .filter(a => !a.correct)
    .map(a => WORD_MAP[a.wordId])
    .filter(Boolean);

  // 3-star bonus XP
  if (stars === 3) s.xpEarned += 50;

  // Save progress
  saveProgress(s.categoryId, s.mode, {
    bestScore: score,
    bestStars: stars,
  });

  // Update streak
  updateStreak();

  // Add XP
  const xpResult = addXP(s.xpEarned);

  // Check and award badges
  const newlyEarnedBadges = checkAndAwardBadges(s, score, stars, wrongAnswers.length);

  // Navigate to results
  renderResults({
    mode:       s.mode,
    categoryId: s.categoryId,
    cat:        s.cat,
    score,
    stars,
    totalWords: firstAttempts.length || totalWords,
    correctCount: correctFirst.length,
    xpEarned:   s.xpEarned,
    xpResult,
    wrongAnswers,
    newlyEarnedBadges,
  });
}

function calcStars(score) {
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  if (score >= 0.5) return 1;
  return 0;
}

function checkAndAwardBadges(s, score, stars, wrongCount) {
  const newBadges = [];

  function tryAward(id) {
    if (awardBadge(id)) newBadges.push(id);
  }

  // First session ever
  tryAward('first-session');

  // 3-star
  if (stars === 3) tryAward('three-stars');

  // Never give up (completed despite 3+ wrongs)
  if (wrongCount >= 3) tryAward('never-give-up');

  // Perfect test
  if (s.mode === 'test' && score === 1) tryAward('perfect-test');

  // Dictation
  if (s.mode === 'dictation') tryAward('first-dictation');

  // Hot streak (5 correct in a row during session)
  if (s.answerStreak >= 5 || maxStreakInSession(s.answered) >= 5) tryAward('hot-streak');

  // Category master badges
  const catProgress = getProgress(s.categoryId);
  const allModeDone = ['practice', 'test', 'dictation'].every(
    m => catProgress[m].completions > 0
  );
  if (allModeDone) {
    const masterMap = {
      'b-p': 'master-bp', 'd-t': 'master-dt', 'g-k': 'master-gk',
      'v-f': 'master-vf', 'h-ch': 'master-hch', 'z-s': 'master-zs',
    };
    if (masterMap[s.categoryId]) tryAward(masterMap[s.categoryId]);
  }

  // Champion: all master badges earned
  const masterBadgeIds = ['master-bp','master-dt','master-gk','master-vf','master-hch','master-zs'];
  const earnedBadges   = getBadges();
  if (masterBadgeIds.every(id => earnedBadges.includes(id))) {
    tryAward('champion');
  }

  return newBadges;
}

function maxStreakInSession(answered) {
  let max = 0, cur = 0;
  for (const a of answered) {
    if (a.correct) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

/* ============================================================
   RESULTS SCREEN
   ============================================================ */

function renderResults({ mode, categoryId, cat, score, stars, totalWords, correctCount, xpEarned, xpResult, wrongAnswers, newlyEarnedBadges }) {
  showScreen('results');

  // Title
  const titles = { practice: 'Procvičování', test: 'Test', dictation: 'Diktát' };
  document.getElementById('results-title').textContent = titles[mode] || 'Výsledky';

  // Stars (animate with delays)
  const starEls = [
    document.getElementById('star-1'),
    document.getElementById('star-2'),
    document.getElementById('star-3'),
  ];
  starEls.forEach((el, i) => {
    el.className = 'star-item';
    el.textContent = '⭐';
    el.style.animationDelay = '';
  });

  setTimeout(() => {
    starEls.forEach((el, i) => {
      if (i < stars) {
        el.style.animationDelay = `${i * 200}ms`;
        el.classList.add('earned');
      } else {
        el.classList.add('empty');
        el.style.opacity = '0.25';
        el.style.transform = 'scale(1)';
        el.style.filter = 'grayscale(1)';
      }
    });
  }, 100);

  // Score
  document.getElementById('results-score').textContent =
    stars === 0
      ? `${correctCount} z ${totalWords} správně – Zkus to znovu!`
      : `${correctCount} z ${totalWords} správně`;

  // XP gained
  document.getElementById('xp-gained').textContent = `+${xpEarned} XP získáno!`;

  // Level up banner
  const levelBanner = document.getElementById('level-up-banner');
  if (xpResult.didLevelUp) {
    levelBanner.classList.remove('hidden');
    document.getElementById('level-up-emoji').textContent = xpResult.newLevelData.emoji;
    document.getElementById('level-up-name').textContent  = xpResult.newLevelData.name;
    // Confetti for level up
    setTimeout(() => launchConfetti(), 400);
  } else {
    levelBanner.classList.add('hidden');
  }

  // Confetti for 3 stars
  if (stars === 3 && !xpResult.didLevelUp) {
    setTimeout(() => launchConfetti(), 600);
  }

  // New badges
  const badgesEl = document.getElementById('new-badges');
  badgesEl.innerHTML = '';
  if (newlyEarnedBadges.length > 0) {
    newlyEarnedBadges.forEach((badgeId, i) => {
      const def = BADGE_MAP[badgeId];
      if (!def) return;
      const item = document.createElement('div');
      item.className = 'new-badge-item';
      item.style.animationDelay = `${i * 100 + 300}ms`;
      item.innerHTML = `
        <span class="new-badge-emoji">${def.emoji}</span>
        <div>
          <div class="new-badge-name">🎉 ${def.name}</div>
          <div class="new-badge-desc">${def.desc}</div>
        </div>`;
      badgesEl.appendChild(item);
    });
  }

  // Wrong answers review
  const reviewEl = document.getElementById('wrong-review');
  reviewEl.innerHTML = '';
  if (wrongAnswers.length > 0) {
    const title = document.createElement('div');
    title.className     = 'wrong-review-title';
    title.textContent   = 'Chybné odpovědi';
    reviewEl.appendChild(title);

    wrongAnswers.forEach(w => {
      const item = document.createElement('div');
      item.className = 'wrong-item';
      item.innerHTML = `
        <span>${w.blank.replace('_', '<span style="color:var(--error-dk)">_</span>')}</span>
        <span class="wrong-item-answer">→ ${w.word}</span>`;
      reviewEl.appendChild(item);
    });
  }

  // Buttons
  document.getElementById('btn-results-back').onclick = () => {
    session = null;
    navigate('home');
  };
  document.getElementById('btn-results-retry').onclick = () => {
    navigate('exercise', { categoryId, mode });
  };

  // "Přejít na Test" if test newly unlocked
  const btnNext = document.getElementById('btn-results-next');
  const catProgress   = getProgress(categoryId);
  const testJustUnlocked =
    mode === 'practice' &&
    catProgress.practice.bestScore >= 0.7 &&
    catProgress.test.completions === 0;

  if (testJustUnlocked) {
    btnNext.classList.remove('hidden');
    btnNext.onclick = () => navigate('exercise', { categoryId, mode: 'test' });
  } else if (mode === 'test' && catProgress.dictation.completions === 0) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = 'Přejít na Diktát 🎙️';
    btnNext.onclick = () => navigate('exercise', { categoryId, mode: 'dictation' });
  } else {
    btnNext.classList.add('hidden');
  }
}

/* ============================================================
   HELPERS – HTML rendering
   ============================================================ */

/**
 * Render blank word as HTML with a styled <span class="blank">
 * e.g. "chle_" → "chle<span class='blank'>_</span>"
 */
function renderBlankWord(blank) {
  return blank.replace('_', '<span class="blank">_</span>');
}

/**
 * Render sentence with the blank word highlighted.
 * The blank placeholder _ in the sentence stays as underscore styled text.
 */
function renderSentenceHtml(sentence, blank) {
  // Escape HTML first
  const safe = escapeHtml(sentence);
  // Replace the blank pattern in sentence (e.g. "chle_") with a bolded version
  const blankEscaped = escapeHtml(blank);
  // Build regex that replaces the blank in the sentence with highlighted version
  const highlighted = safe.replace(
    blankEscaped,
    `<strong style="color:var(--primary)">${blankEscaped}</strong>`
  );
  return highlighted;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Streak display */
function updateStreakDisplay() {
  const s   = session;
  const el  = document.getElementById('ex-streak-display');
  if (!el) return;
  if (s.answerStreak >= 3) {
    el.textContent = `🔥 ${s.answerStreak}`;
    el.style.animation = 'pulse 0.5s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  } else if (s.answerStreak > 0) {
    el.textContent = `✓ ${s.answerStreak}`;
  } else {
    el.textContent = '';
  }
}

/** Show floating XP gain */
function showXpFlash(text) {
  const el = document.createElement('div');
  el.className   = 'xp-flash';
  el.textContent = text;
  // Position near top-center
  el.style.left = '50%';
  el.style.top  = '120px';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/** Random encouraging messages */
const CORRECT_MESSAGES = [
  'Výborně! 🎉', 'Správně! ✓', 'Skvělé! 🌟', 'Přesně tak! 👍',
  'Bravo! 🏆', 'Super! 💪', 'Perfektní! ⭐', 'Úžasné! 🎊',
];
function randomCorrectMessage() {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}

/** Fisher-Yates shuffle (in-place, returns array) */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   CONFETTI
   ============================================================ */

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#4F8EF7','#FF7E5F','#52C97A','#FFB800','#FF5252','#a78bfa','#34d399'];
  const PIECES = 120;

  const particles = Array.from({ length: PIECES }, () => ({
    x:    Math.random() * canvas.width,
    y:    -Math.random() * canvas.height * 0.5,
    r:    Math.random() * 6 + 4,
    d:    Math.random() * PIECES,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngleInc: (Math.random() * 0.07) + 0.05,
    tiltAngle: 0,
    vx:   (Math.random() - 0.5) * 3,
    vy:   Math.random() * 3 + 2,
  }));

  let angle  = 0;
  let frameId;
  const start = performance.now();
  const DURATION = 3000;

  function draw(now) {
    const elapsed = now - start;
    if (elapsed > DURATION) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(frameId);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;

    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleInc;
      p.x += p.vx + Math.cos(angle + p.d) * 0.5;
      p.y += p.vy;
      p.tilt = Math.sin(p.tiltAngle - p.d / 2) * 15;

      // Fade out near end
      const alpha = elapsed > DURATION * 0.7
        ? 1 - (elapsed - DURATION * 0.7) / (DURATION * 0.3)
        : 1;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      // Wrap around
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    });

    ctx.globalAlpha = 1;
    frameId = requestAnimationFrame(draw);
  }

  frameId = requestAnimationFrame(draw);
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */

init();
