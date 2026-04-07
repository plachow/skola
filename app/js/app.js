/**
 * app.js – Školníček main application
 * Vanilla JS ES modules, hash-based routing
 */

import { CATEGORY_MAP, WORD_MAP, SUBJECTS, SUBJECTS_MAP, BADGES, BADGE_MAP, getLevelInfo, loadData } from './data.js';
import {
  getAll, saveAll,
  getUser, saveUser,
  getXP, addXP,
  getStreak, updateStreak,
  getBadges, awardBadge,
  getProgress, saveProgress,
} from './storage.js';
import { speak, cancel } from './speech.js';

/* ============================================================
   ROUTING
   ============================================================ */

const SCREENS = {
  welcome:  document.getElementById('screen-welcome'),
  home:     document.getElementById('screen-home'),
  subject:  document.getElementById('screen-subject'),
  category: document.getElementById('screen-category'),
  exercise: document.getElementById('screen-exercise'),
  game:     document.getElementById('screen-game'),
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
    case 'subject':  renderSubject(params);         break;
    case 'category': renderCategory(params);        break;
    case 'exercise': renderExercise(params);        break;
    case 'game':     renderGame(params);            break;
    case 'results':
      // Results are rendered directly by finishSession()/finishGame().
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

function loadFooterVersion() {
  fetch('data/version.json')
    .then(r => r.json())
    .then(({ version }) => {
      document.getElementById('app-footer').innerHTML =
        `Školníček ${version} &copy; Ing. Zdeněk Plachý, <a href="mailto:zdenek@plachy.cz">zdenek@plachy.cz</a>`;
    })
    .catch(() => { /* version.json chybí v lokálním vývoji */ });
}

async function init() {
  await loadData();
  loadFooterVersion();
  const user = getUser();
  const { route } = getRouteParams();

  if (!user) {
    if (route === 'welcome' || !route) {
      renderWelcome();
    } else {
      navigate('welcome');
    }
  } else {
    if (!route || route === 'welcome') {
      if (route === 'home') {
        renderHome();
      } else {
        navigate('home');
      }
    } else {
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

  input.value       = '';
  btnStart.disabled = true;

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
   HOME SCREEN – subject picker
   ============================================================ */

function renderHome() {
  showScreen('home');

  const user      = getUser();
  const xp        = getXP();
  const streak    = getStreak();
  const levelInfo = getLevelInfo(xp);
  const badges    = getBadges();

  // Header
  document.getElementById('home-username').textContent     = user || '';
  document.getElementById('home-streak-count').textContent = streak.count;
  document.getElementById('home-level-emoji').textContent  = levelInfo.current.emoji;
  document.getElementById('home-level-name').textContent   = levelInfo.current.name;
  document.getElementById('home-xp-label').textContent     = `${xp} XP`;

  // XP bar
  const xpBar = document.getElementById('home-xp-bar');
  xpBar.style.width = `${Math.round(levelInfo.progress * 100)}%`;

  // Rename button
  const btnRename   = document.getElementById('btn-rename');
  const nameEl      = document.getElementById('home-username');
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
      renameInput.style.display = 'none';
      nameEl.style.display      = '';
      btnRename.style.display   = '';
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

  // Subject cards
  renderSubjectCards();

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

function renderSubjectCards() {
  const container = document.getElementById('home-subject-cards');
  container.innerHTML = '';

  SUBJECTS.forEach(subject => {
    // Count completions across all categories for this subject
    const totalCats = subject.categories.length;
    const doneCats  = subject.categories.filter(cat => {
      const p = getProgress(cat.id);
      return p.practice.completions > 0;
    }).length;

    const card = document.createElement('button');
    card.className = 'subject-card';
    card.innerHTML = `
      <span class="subject-card-emoji">${subject.emoji}</span>
      <div class="subject-card-info">
        <div class="subject-card-name">${subject.name}</div>
        <div class="subject-card-desc">${subject.desc}</div>
      </div>
      <div class="subject-card-right">
        <div class="subject-card-progress">${doneCats} / ${totalCats}</div>
        <span class="subject-card-arrow" aria-hidden="true">›</span>
      </div>`;
    card.setAttribute('aria-label', `${subject.name} – otevřít`);
    card.addEventListener('click', () => navigate('subject', { id: subject.id }));
    container.appendChild(card);
  });
}

/* ============================================================
   SUBJECT SCREEN – category list for one subject
   ============================================================ */

function renderSubject({ id }) {
  if (!id || !SUBJECTS_MAP[id]) { navigate('home'); return; }

  showScreen('subject');
  const subject = SUBJECTS_MAP[id];

  document.getElementById('subj-title').textContent = subject.name;
  document.getElementById('subj-back').onclick = () => navigate('home');

  // Header color per subject
  const header = document.getElementById('subj-header');
  if (id === 'math') {
    header.style.background = 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)';
  } else {
    header.style.background = '';
  }

  const grid = document.getElementById('subj-categories-grid');
  grid.innerHTML = '';

  const modes = id === 'math' ? ['practice', 'test', 'game'] : ['practice', 'test', 'dictation'];

  subject.categories.forEach(cat => {
    const prog   = getProgress(cat.id);
    const locked = isCategoryLocked(cat);
    const btn    = document.createElement('button');
    btn.className = 'cat-card';
    btn.style.setProperty('--cat-color', cat.color);

    const dotsHtml = modes.map(m => {
      const p = prog[m] || { completions: 0, bestStars: 0 };
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
  return false;
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
  const cat     = CATEGORY_MAP[categoryId];
  const prog    = getProgress(categoryId);
  const isMath  = cat.subjectId === 'math';

  // Header color
  const header = document.getElementById('cat-header');
  header.style.background = cat.color;

  document.getElementById('cat-title').textContent      = cat.name;
  document.getElementById('cat-hero-emoji').textContent = cat.emoji;
  document.getElementById('cat-hero-name').textContent  = cat.name;
  document.getElementById('cat-hero-count').textContent = isMath
    ? `${cat.facts.filter(f => f.product !== undefined).length} × násobení  ·  ${cat.facts.filter(f => f.quotient !== undefined).length} ÷ dělení`
    : `${cat.words.length} slov`;

  // Back → subject screen
  document.getElementById('cat-back').onclick = () =>
    navigate('subject', { id: cat.subjectId });

  // Mode unlock logic — all modes open from the start
  const testLocked  = false;
  const thirdLocked = false;

  // Mode dots helper
  function makeDots(modeKey) {
    const p = prog[modeKey] || { completions: 0, bestStars: 0 };
    return Array.from({ length: 3 }, (_, i) => {
      let cls = 'dot';
      if (p.completions > 0) {
        cls = i < p.bestStars ? 'dot done' : 'dot';
      }
      return `<span class="${cls}"></span>`;
    }).join('');
  }

  document.getElementById('mode-dots-practice').innerHTML = makeDots('practice');
  document.getElementById('mode-dots-test').innerHTML     = makeDots('test');

  // Show correct 3rd button based on subject
  const btnDictation = document.getElementById('mode-btn-dictation');
  const btnGame      = document.getElementById('mode-btn-game');

  if (isMath) {
    btnDictation.classList.add('hidden');
    btnGame.classList.remove('hidden');

    document.getElementById('mode-dots-game').innerHTML = makeDots('game');
    const lockGame = document.getElementById('mode-lock-game');
    lockGame.style.display = thirdLocked ? '' : 'none';
    btnGame.disabled = thirdLocked;
    btnGame.onclick = thirdLocked ? null : () => navigate('game', { categoryId });

    // Lock messages
    document.getElementById('lock-message').classList.toggle('hidden', !testLocked);
    document.getElementById('lock-message-dict').classList.add('hidden');
    document.getElementById('lock-message-game').classList.toggle('hidden', testLocked || !thirdLocked);
  } else {
    btnDictation.classList.remove('hidden');
    btnGame.classList.add('hidden');

    document.getElementById('mode-dots-dictation').innerHTML = makeDots('dictation');
    const lockDict = document.getElementById('mode-lock-dictation');
    lockDict.style.display = thirdLocked ? '' : 'none';
    btnDictation.disabled = thirdLocked;
    btnDictation.onclick = thirdLocked ? null : () => navigate('exercise', { categoryId, mode: 'dictation' });

    document.getElementById('lock-message').classList.toggle('hidden', !testLocked);
    document.getElementById('lock-message-dict').classList.toggle('hidden', testLocked || !thirdLocked);
    document.getElementById('lock-message-game').classList.add('hidden');
  }

  // Lock icons & buttons for test
  const lockTest = document.getElementById('mode-lock-test');
  const btnTest  = document.getElementById('mode-btn-test');
  lockTest.style.display = testLocked ? '' : 'none';
  btnTest.disabled = testLocked;

  // Mode buttons
  const btnPractice = document.getElementById('mode-btn-practice');
  btnPractice.onclick = () => navigate('exercise', { categoryId, mode: 'practice' });
  btnTest.onclick     = testLocked ? null : () => navigate('exercise', { categoryId, mode: 'test' });
}

/* ============================================================
   SESSION STATE
   ============================================================ */

/** Current active exercise session (null when no exercise running) */
let session = null;

function buildTestList(mode, items) {
  if (mode === 'practice') return null;
  if (mode !== 'test') return shuffleArray(items.slice()); // dictation uses queue, not testList
  // Test: always exactly 20 questions, repeat items if category has fewer
  const list = [];
  while (list.length < 20) list.push(...shuffleArray(items.slice()));
  return list.slice(0, 20);
}

function createSession(categoryId, mode) {
  const cat   = CATEGORY_MAP[categoryId];
  const isMath = cat.subjectId === 'math';
  const items = isMath ? cat.facts : cat.words;

  return {
    mode,
    categoryId,
    cat,
    isMath,
    queue:     shuffleArray(items.slice()),
    testList:  buildTestList(mode, items),
    testIndex: 0,
    wordPerf:  Object.fromEntries(items.map(w => [w.id, 0])),
    answered:  [],
    xpEarned:  0,
    answerStreak:  0,
    currentWord:   null,
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

  cancel();
  showScreen('exercise');
  session = createSession(categoryId, mode);

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

  const sentenceEl = document.getElementById('ex-sentence');
  const wordWrap   = document.getElementById('ex-word-wrap');
  const wordEl     = document.getElementById('ex-word');
  const hintBar    = document.getElementById('ex-hint-bar');
  const hintPanel  = document.getElementById('hint-panel');
  const btnHint    = document.getElementById('btn-hint');
  const feedbackEl = document.getElementById('ex-feedback');
  const optionsEl  = document.getElementById('ex-options');

  feedbackEl.textContent = '';
  feedbackEl.className   = 'ex-feedback';

  if (s.isMath) {
    // ---- Math layout ----
    // Randomly swap operand order for multiply to train operation awareness
    const swapped = word.product !== undefined && Math.random() < 0.5;
    const question = getMathQuestion(word, swapped);
    const correct  = getMathAnswer(word);

    sentenceEl.innerHTML = `<span class="math-question-display">${question}</span>`;
    wordWrap.style.display = 'none';
    hintBar.style.display  = 'none';

    const options = generateMathOptions(correct, word);
    optionsEl.innerHTML = '';
    optionsEl.className = 'ex-options math-options';

    options.forEach(num => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = num;
      btn.setAttribute('aria-label', `Odpověď ${num}`);
      btn.addEventListener('click', () => onMathQuizAnswer(num, word));
      optionsEl.appendChild(btn);
    });

  } else {
    // ---- CS layout ----
    wordWrap.style.display = '';
    hintBar.style.display  = '';

    sentenceEl.innerHTML = renderSentenceHtml(word.sentence, word.blank);
    wordEl.innerHTML     = renderBlankWord(word.blank);
    optionsEl.className  = 'ex-options';

    hintPanel.classList.add('hidden');
    hintPanel.textContent = '';

    if (s.mode === 'practice') {
      btnHint.onclick = () => {
        hintPanel.textContent = `💡 Pomůže ti: ${word.proof}`;
        hintPanel.classList.remove('hidden');
      };
    } else {
      hintBar.style.display = 'none';
    }

    const pair = [...cat.pair];
    shuffleArray(pair);
    optionsEl.innerHTML = '';

    pair.forEach(letter => {
      const btn = document.createElement('button');
      btn.className   = 'option-btn';
      btn.textContent = letter;
      btn.setAttribute('aria-label', `Písmeno ${letter}`);
      btn.addEventListener('click', () => onQuizAnswer(letter, word));
      optionsEl.appendChild(btn);
    });
  }

  updateQuizProgress();
  updateStreakDisplay();
}

/* ---- Math quiz answer ----------------------------------- */

function onMathQuizAnswer(chosen, word) {
  const s = session;
  if (s.pendingAdvance) return;

  const correct        = getMathAnswer(word);
  const isCorrect      = chosen === correct;
  const isFirstAttempt = !s.answered.find(a => a.wordId === word.id);

  s.answered.push({ wordId: word.id, correct: isCorrect, firstAttempt: isFirstAttempt });

  if (isCorrect) s.answerStreak++;
  else           s.answerStreak = 0;

  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => { btn.disabled = true; });

  if (s.mode === 'test') {
    // No feedback in test mode — advance quickly without revealing answer
    if (isCorrect) s.xpEarned += 20;
    s.testIndex++;
    s.pendingAdvance = setTimeout(() => { s.pendingAdvance = null; showNextQuizWord(); }, 300);
    return;
  }

  // Practice mode: full visual feedback
  updateStreakDisplay();
  const feedbackEl = document.getElementById('ex-feedback');
  const wordEl     = document.getElementById('ex-word');

  optionBtns.forEach(btn => {
    if (Number(btn.textContent) === correct) btn.classList.add('correct');
    else if (Number(btn.textContent) === chosen && !isCorrect) btn.classList.add('wrong');
  });

  wordEl.classList.remove('bounce', 'shake');
  void wordEl.offsetWidth;
  wordEl.classList.add(isCorrect ? 'bounce' : 'shake');

  if (isCorrect) {
    feedbackEl.textContent = randomCorrectMessage();
    feedbackEl.className   = 'ex-feedback correct';
  } else {
    feedbackEl.textContent = `Správně je: ${correct}`;
    feedbackEl.className   = 'ex-feedback wrong';
  }

  handlePracticeQueue(word, isCorrect);

  s.pendingAdvance = setTimeout(() => {
    s.pendingAdvance = null;
    showNextQuizWord();
  }, isCorrect ? 1200 : 2000);
}

/* ---- CS quiz answer ------------------------------------- */

function onQuizAnswer(chosenLetter, word) {
  const s = session;
  if (s.pendingAdvance) return;

  const isCorrect      = chosenLetter.toLowerCase() === word.answer.toLowerCase();
  const isFirstAttempt = !s.answered.find(a => a.wordId === word.id);

  s.answered.push({ wordId: word.id, correct: isCorrect, firstAttempt: isFirstAttempt });

  if (isCorrect) s.answerStreak++;
  else           s.answerStreak = 0;

  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => { btn.disabled = true; });

  if (s.mode === 'test') {
    // No feedback in test mode — advance quickly without revealing answer
    if (isCorrect) s.xpEarned += 20;
    s.testIndex++;
    s.pendingAdvance = setTimeout(() => { s.pendingAdvance = null; showNextQuizWord(); }, 300);
    return;
  }

  // Practice mode: full visual feedback
  updateStreakDisplay();
  const wordEl    = document.getElementById('ex-word');
  const hintPanel = document.getElementById('hint-panel');

  optionBtns.forEach(btn => {
    if (btn.textContent.toLowerCase() === word.answer.toLowerCase()) btn.classList.add('correct');
    else if (btn.textContent.toLowerCase() === chosenLetter.toLowerCase() && !isCorrect) btn.classList.add('wrong');
  });

  const blankEl = wordEl.querySelector('.blank');
  if (blankEl) {
    blankEl.textContent = isCorrect ? chosenLetter : word.answer;
    blankEl.classList.add(isCorrect ? 'filled-correct' : 'filled-wrong');
  }

  wordEl.classList.remove('bounce', 'shake');
  void wordEl.offsetWidth;
  wordEl.classList.add(isCorrect ? 'bounce' : 'shake');

  const feedbackEl = document.getElementById('ex-feedback');
  if (isCorrect) {
    feedbackEl.textContent = randomCorrectMessage();
    feedbackEl.className   = 'ex-feedback correct';
  } else {
    feedbackEl.textContent = `Správně je: ${word.word}`;
    feedbackEl.className   = 'ex-feedback wrong';
    hintPanel.textContent  = `💡 Pomůže ti: ${word.proof}`;
    hintPanel.classList.remove('hidden');
  }

  handlePracticeQueue(word, isCorrect);

  s.pendingAdvance = setTimeout(() => {
    s.pendingAdvance = null;
    showNextQuizWord();
  }, isCorrect ? 1200 : 2000);
}

function handlePracticeQueue(word, isCorrect) {
  const s = session;
  s.queue.shift();

  if (isCorrect) {
    s.wordPerf[word.id] = (s.wordPerf[word.id] || 0) + 1;
    if (s.wordPerf[word.id] >= 2) {
      let xp = 10;
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
}

function updateQuizProgress() {
  const s = session;
  let current, total;

  if (s.mode === 'practice') {
    const graduated = Object.values(s.wordPerf).filter(v => v >= 2).length;
    const totalItems = s.isMath ? s.cat.facts.length : s.cat.words.length;
    current = graduated;
    total   = totalItems;
    document.getElementById('ex-progress-label').textContent = `Zvládnuto: ${current} / ${total}`;
  } else {
    current = s.testIndex;
    total   = s.testList.length;
    document.getElementById('ex-progress-label').textContent = `Otázka ${current + 1} / ${total}`;
  }

  const pct = total > 0 ? (current / total) * 100 : 0;
  document.getElementById('ex-progress-fill').style.width = `${pct}%`;
}

/* ---- Dictation Mode (CS only) -------------------------- */

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

  const sentEl = document.getElementById('ex-dict-sentence');
  sentEl.innerHTML = renderSentenceHtml(word.sentence, word.blank);

  const inputEl = document.getElementById('dict-input');
  inputEl.value = '';
  inputEl.disabled = false;

  const feedbackEl = document.getElementById('ex-dict-feedback');
  feedbackEl.textContent = '';
  feedbackEl.className   = 'ex-feedback';

  const submitBtn = document.getElementById('btn-dict-submit');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Zkontrolovat ✓';

  const speakerBtn = document.getElementById('btn-speaker');
  const newSpeaker = speakerBtn.cloneNode(true);
  speakerBtn.parentNode.replaceChild(newSpeaker, speakerBtn);
  const fullSentence = word.sentence.replace(word.blank, word.word).replace(/_/g, word.answer);
  newSpeaker.addEventListener('click', () => { speak(fullSentence); });

  setTimeout(() => speak(fullSentence), 300);

  const newSubmit = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
  newSubmit.addEventListener('click', () => onDictationSubmit(word));

  inputEl.onkeydown = (e) => {
    if (e.key === 'Enter') onDictationSubmit(word);
  };

  const graduated = Object.values(s.wordPerf).filter(v => v >= 2).length;
  const total     = s.cat.words.length;
  document.getElementById('ex-progress-label').textContent = `Zvládnuto: ${graduated} / ${total}`;
  const pct = total > 0 ? (graduated / total) * 100 : 0;
  document.getElementById('ex-progress-fill').style.width = `${pct}%`;

  updateStreakDisplay();
  inputEl.focus();
}

function onDictationSubmit(word) {
  const s = session;
  if (s.pendingAdvance) return;

  const inputEl    = document.getElementById('dict-input');
  const feedbackEl = document.getElementById('ex-dict-feedback');
  const submitBtn  = document.getElementById('btn-dict-submit');

  const userInput = inputEl.value.trim();
  if (!userInput) return;

  const wordFormRe = new RegExp(word.blank.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-záčďéěíňóřšťúůýž]*', 'i');
  const wordFormMatch   = word.sentence.match(wordFormRe);
  const wordInSentence  = wordFormMatch ? wordFormMatch[0].replace('_', word.answer) : word.word;
  const isCorrect = userInput.toLowerCase() === word.word.toLowerCase()
                 || userInput.toLowerCase() === wordInSentence.toLowerCase();

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
  inputEl.disabled   = true;
  submitBtn.disabled = true;

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

  const items = s.isMath ? s.cat.facts : s.cat.words;
  const firstAttempts  = s.answered.filter(a => a.firstAttempt);
  const correctFirst   = firstAttempts.filter(a => a.correct);
  const score          = firstAttempts.length > 0 ? correctFirst.length / firstAttempts.length : 0;
  const stars          = calcStars(score);

  // For test mode: grade by total wrong answers across all 20 questions
  const isTest     = s.mode === 'test';
  const wrongTotal = isTest ? s.answered.filter(a => !a.correct).length : null;
  const grade      = isTest ? calcGrade(wrongTotal) : null;

  // Wrong answers (unique items that failed on first attempt — for review list)
  const wrongAnswers = firstAttempts
    .filter(a => !a.correct)
    .map(a => WORD_MAP[a.wordId])
    .filter(Boolean);

  if (stars === 3) s.xpEarned += 50;

  saveProgress(s.categoryId, s.mode, { bestScore: score, bestStars: stars });
  updateStreak();
  const xpResult = addXP(s.xpEarned);

  const newlyEarnedBadges = checkAndAwardBadges(s, score, stars, wrongAnswers.length);

  renderResults({
    mode:       s.mode,
    categoryId: s.categoryId,
    cat:        s.cat,
    isMath:     s.isMath,
    score,
    stars,
    grade,
    wrongTotal,
    totalWords:   isTest ? s.answered.length : (firstAttempts.length || items.length),
    correctCount: isTest ? s.answered.filter(a => a.correct).length : correctFirst.length,
    xpEarned:     s.xpEarned,
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

/** Calculate school grade (1–5) from total wrong answers out of 20. */
function calcGrade(errors) {
  if (errors <= 2) return 1;
  if (errors <= 4) return 2;
  if (errors <= 6) return 3;
  if (errors <= 8) return 4;
  return 5;
}

function checkAndAwardBadges(s, score, stars, wrongCount) {
  const newBadges = [];

  function tryAward(id) {
    if (awardBadge(id)) newBadges.push(id);
  }

  tryAward('first-session');

  if (stars === 3) tryAward('three-stars');
  if (wrongCount >= 3) tryAward('never-give-up');
  if (s.mode === 'test' && score === 1) tryAward('perfect-test');
  if (s.mode === 'dictation') tryAward('first-dictation');
  if (s.answerStreak >= 5 || maxStreakInSession(s.answered) >= 5) tryAward('hot-streak');

  if (!s.isMath) {
    // CS-specific: category master badges
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

    const masterBadgeIds = ['master-bp','master-dt','master-gk','master-vf','master-hch','master-zs'];
    const earnedBadges   = getBadges();
    if (masterBadgeIds.every(id => earnedBadges.includes(id))) {
      tryAward('champion');
    }
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

function renderResults({ mode, categoryId, cat, isMath, score, stars, grade, wrongTotal, totalWords, correctCount, xpEarned, xpResult, wrongAnswers, newlyEarnedBadges, gameScore }) {
  showScreen('results');

  const titles = { practice: 'Procvičování', test: 'Test', dictation: 'Diktát', game: 'Rychlostní hra' };
  document.getElementById('results-title').textContent = titles[mode] || 'Výsledky';

  const starsRow    = document.getElementById('stars-row');
  const gradeDisplay = document.getElementById('grade-display');

  if (mode === 'test' && grade !== null) {
    // Show school grade instead of stars for tests
    starsRow.classList.add('hidden');
    gradeDisplay.classList.remove('hidden');
    const gradeConfigs = {
      1: { bg: '#4CAF50', label: 'Výborný!',       icon: '🌟' },
      2: { bg: '#8BC34A', label: 'Chvalitebný',    icon: '👍' },
      3: { bg: '#FFC107', label: 'Dobrý',          icon: '👌' },
      4: { bg: '#FF9800', label: 'Dostatečný',     icon: '🤔' },
      5: { bg: '#F44336', label: 'Nedostatečný',   icon: '😔' },
    };
    const cfg = gradeConfigs[grade];
    const badgeEl = document.getElementById('grade-badge');
    badgeEl.textContent    = grade;
    badgeEl.style.background = cfg.bg;
    document.getElementById('grade-label').textContent  = `${cfg.icon} ${cfg.label}`;
    document.getElementById('grade-errors').textContent =
      `${wrongTotal} ${wrongTotal === 1 ? 'chyba' : wrongTotal >= 2 && wrongTotal <= 4 ? 'chyby' : 'chyb'} z ${totalWords}`;
  } else {
    starsRow.classList.remove('hidden');
    gradeDisplay.classList.add('hidden');
    // Stars
    const starEls = [
      document.getElementById('star-1'),
      document.getElementById('star-2'),
      document.getElementById('star-3'),
    ];
    starEls.forEach(el => {
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
          el.style.opacity   = '0.25';
          el.style.transform = 'scale(1)';
          el.style.filter    = 'grayscale(1)';
        }
      });
    }, 100);
  }

  // Score text
  if (mode === 'game') {
    document.getElementById('results-score').textContent = `Skóre: ${gameScore} bodů`;
  } else if (mode === 'test') {
    document.getElementById('results-score').textContent = `${correctCount} správně z ${totalWords}`;
  } else {
    document.getElementById('results-score').textContent =
      stars === 0
        ? `${correctCount} z ${totalWords} správně – Zkus to znovu!`
        : `${correctCount} z ${totalWords} správně`;
  }

  document.getElementById('xp-gained').textContent = `+${xpEarned} XP získáno!`;

  // Level up banner
  const levelBanner = document.getElementById('level-up-banner');
  if (xpResult.didLevelUp) {
    levelBanner.classList.remove('hidden');
    document.getElementById('level-up-emoji').textContent = xpResult.newLevelData.emoji;
    document.getElementById('level-up-name').textContent  = xpResult.newLevelData.name;
    setTimeout(() => launchConfetti(), 400);
  } else {
    levelBanner.classList.add('hidden');
  }

  if ((stars === 3 || grade === 1) && !xpResult.didLevelUp) {
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
  if (wrongAnswers.length > 0 && mode !== 'game') {
    const title = document.createElement('div');
    title.className   = 'wrong-review-title';
    title.textContent = 'Chybné odpovědi';
    reviewEl.appendChild(title);

    wrongAnswers.forEach(w => {
      if (!w) return;
      const item = document.createElement('div');
      item.className = 'wrong-item';
      if (w.product !== undefined) {
        item.innerHTML = `<span>${w.a} × ${w.b}</span><span class="wrong-item-answer">= ${w.product}</span>`;
      } else if (w.quotient !== undefined) {
        item.innerHTML = `<span>${w.dividend} ÷ ${w.divisor}</span><span class="wrong-item-answer">= ${w.quotient}</span>`;
      } else {
        item.innerHTML = `
          <span>${w.blank.replace('_', '<span style="color:var(--error-dk)">_</span>')}</span>
          <span class="wrong-item-answer">→ ${w.word}</span>`;
      }
      reviewEl.appendChild(item);
    });
  }

  // Action buttons
  document.getElementById('btn-results-back').onclick = () => {
    session = null;
    navigate('home');
  };

  if (mode === 'game') {
    document.getElementById('btn-results-retry').onclick = () => navigate('game', { categoryId });
  } else {
    document.getElementById('btn-results-retry').onclick = () => navigate('exercise', { categoryId, mode });
  }

  // "Next mode" button
  const btnNext = document.getElementById('btn-results-next');
  const catProgress = getProgress(categoryId);

  const testJustUnlocked =
    mode === 'practice' &&
    catProgress.practice.bestScore >= 0.7 &&
    catProgress.test.completions === 0;

  if (testJustUnlocked) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = 'Přejít na Test 🎯';
    btnNext.onclick = () => navigate('exercise', { categoryId, mode: 'test' });
  } else if (mode === 'test' && isMath && (catProgress.game || { completions: 0 }).completions === 0) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = 'Hrát Rychlostní hru ⚡';
    btnNext.onclick = () => navigate('game', { categoryId });
  } else if (mode === 'test' && !isMath && catProgress.dictation.completions === 0) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = 'Přejít na Diktát 🎙️';
    btnNext.onclick = () => navigate('exercise', { categoryId, mode: 'dictation' });
  } else {
    btnNext.classList.add('hidden');
  }
}

/* ============================================================
   MATH GAME – Rychlostní hra
   ============================================================ */

const GAME_TIMER_MS = 8000;
let gameSession = null;

function renderGame({ categoryId }) {
  if (!categoryId || !CATEGORY_MAP[categoryId]) { navigate('home'); return; }

  const cat = CATEGORY_MAP[categoryId];
  if (!cat.facts) { navigate('home'); return; } // only for math

  showScreen('game');

  // Build 20-question list (repeat facts if needed)
  const facts = [...cat.facts];
  const list  = [];
  while (list.length < 20) {
    list.push(...shuffleArray([...facts]));
  }

  gameSession = {
    categoryId,
    cat,
    questions: list.slice(0, 20),
    index:     0,
    score:     0,
    combo:     0,
    correct:   0,
    timerHandle:   null,
    timerStartTime: null,
    answered:  false,
    answered_list: [],
  };

  document.getElementById('game-back').onclick = () => {
    clearGameTimer();
    navigate('category', { categoryId });
  };

  showNextGameQuestion();
}

function showNextGameQuestion() {
  const gs = gameSession;
  if (gs.index >= gs.questions.length) {
    finishGame();
    return;
  }

  const fact   = gs.questions[gs.index];
  const correct = getMathAnswer(fact);
  gs.answered  = false;

  document.getElementById('game-question-count').textContent = `${gs.index + 1} / ${gs.questions.length}`;
  document.getElementById('game-score').textContent = gs.score;
  const gameSwapped = fact.product !== undefined && Math.random() < 0.5;
  document.getElementById('game-question').textContent = getMathQuestion(fact, gameSwapped);
  document.getElementById('game-feedback').textContent = '';
  document.getElementById('game-feedback').className  = 'game-feedback';

  updateGameCombo();

  const options = generateMathOptions(correct, fact);
  const optEl   = document.getElementById('game-options');
  optEl.innerHTML = '';
  options.forEach(num => {
    const btn = document.createElement('button');
    btn.className   = 'game-option-btn';
    btn.textContent = num;
    btn.addEventListener('click', () => onGameAnswer(num, fact));
    optEl.appendChild(btn);
  });

  startGameTimer(fact, correct);
}

function startGameTimer(fact, correct) {
  clearGameTimer();
  const fill = document.getElementById('game-timer-fill');
  fill.style.transition = 'none';
  fill.style.width = '100%';
  void fill.offsetWidth;
  fill.style.transition = `width ${GAME_TIMER_MS}ms linear`;
  fill.style.width = '0%';

  gameSession.timerStartTime = performance.now();
  gameSession.timerHandle = setTimeout(() => {
    if (!gameSession.answered) onGameTimeout(fact, correct);
  }, GAME_TIMER_MS);
}

function clearGameTimer() {
  if (gameSession?.timerHandle) {
    clearTimeout(gameSession.timerHandle);
    gameSession.timerHandle = null;
  }
}

function onGameAnswer(chosen, fact) {
  const gs = gameSession;
  if (gs.answered) return;
  gs.answered = true;
  clearGameTimer();

  // Freeze timer bar
  const fill = document.getElementById('game-timer-fill');
  const computedWidth = fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width;
  fill.style.transition = 'none';
  fill.style.width = `${computedWidth * 100}%`;

  const correct    = getMathAnswer(fact);
  const isCorrect  = chosen === correct;
  const elapsed    = Math.min(GAME_TIMER_MS, performance.now() - gs.timerStartTime);
  const remaining  = Math.max(0, GAME_TIMER_MS - elapsed);

  // Mark buttons
  const optBtns = document.querySelectorAll('.game-option-btn');
  optBtns.forEach(btn => {
    btn.disabled = true;
    if (Number(btn.textContent) === correct) btn.classList.add('correct');
    else if (Number(btn.textContent) === chosen && !isCorrect) btn.classList.add('wrong');
  });

  const feedbackEl = document.getElementById('game-feedback');

  if (isCorrect) {
    gs.combo++;
    gs.correct++;
    const multiplier = gs.combo >= 5 ? 3 : gs.combo >= 3 ? 2 : 1;
    const points = Math.round((100 + (remaining / 1000) * 10) * multiplier);
    gs.score += points;
    showXpFlash(`+${points}`);
    feedbackEl.textContent = multiplier > 1
      ? `${randomCorrectMessage()} ×${multiplier} COMBO!`
      : randomCorrectMessage();
    feedbackEl.className = 'game-feedback correct';
  } else {
    gs.combo = 0;
    feedbackEl.textContent = `Správně: ${correct}`;
    feedbackEl.className   = 'game-feedback wrong';
  }

  updateGameCombo();
  document.getElementById('game-score').textContent = gs.score;
  gs.answered_list.push({ correct: isCorrect });

  gs.index++;
  const delay = isCorrect ? 900 : 1800;
  setTimeout(() => showNextGameQuestion(), delay);
}

function onGameTimeout(fact, correct) {
  const gs = gameSession;
  gs.answered = true;
  gs.combo    = 0;

  const optBtns = document.querySelectorAll('.game-option-btn');
  optBtns.forEach(btn => {
    btn.disabled = true;
    if (Number(btn.textContent) === correct) btn.classList.add('correct');
  });

  const feedbackEl = document.getElementById('game-feedback');
  feedbackEl.textContent = `⏰ Čas! Správně: ${correct}`;
  feedbackEl.className   = 'game-feedback wrong';

  updateGameCombo();
  gs.answered_list.push({ correct: false });
  gs.index++;
  setTimeout(() => showNextGameQuestion(), 2000);
}

function updateGameCombo() {
  const gs     = gameSession;
  const comboEl = document.getElementById('game-combo');
  if (gs.combo >= 5)      comboEl.textContent = '🔥🔥🔥';
  else if (gs.combo >= 3) comboEl.textContent = '🔥🔥';
  else if (gs.combo >= 2) comboEl.textContent = `🔥×${gs.combo}`;
  else                    comboEl.textContent = '';
}

function finishGame() {
  clearGameTimer();
  const gs = gameSession;
  gameSession = null;

  const total    = gs.questions.length;
  const correct  = gs.correct;
  const scorePct = correct / total;
  const stars    = calcStars(scorePct);

  saveProgress(gs.categoryId, 'game', { bestScore: scorePct, bestStars: stars });
  updateStreak();

  const xpAmount = Math.round(gs.score / 10);
  const xpResult = addXP(xpAmount);

  // Math game badges
  const newBadges = [];
  function tryAward(id) { if (awardBadge(id)) newBadges.push(id); }
  tryAward('first-session');
  tryAward('math-first-game');
  if (maxStreakInSession(gs.answered_list) >= 5) tryAward('math-combo');
  if (scorePct === 1) tryAward('math-perfect');
  if (stars === 3) tryAward('three-stars');

  renderResults({
    mode:         'game',
    categoryId:   gs.categoryId,
    cat:          gs.cat,
    isMath:       true,
    score:        scorePct,
    stars,
    totalWords:   total,
    correctCount: correct,
    xpEarned:     xpAmount,
    xpResult,
    wrongAnswers: [],
    newlyEarnedBadges: newBadges,
    gameScore:    gs.score,
  });
}

/* ============================================================
   MATH HELPERS
   ============================================================ */

function getMathQuestion(fact, swapped = false) {
  if (fact.product !== undefined) {
    return swapped ? `${fact.b} × ${fact.a} = ?` : `${fact.a} × ${fact.b} = ?`;
  }
  return `${fact.dividend} ÷ ${fact.divisor} = ?`;
}

function getMathAnswer(fact) {
  return fact.product !== undefined ? fact.product : fact.quotient;
}

/**
 * Generate 4 answer options: the correct one + 3 plausible distractors.
 * Always includes the "opposite operation" result so children must focus on
 * whether they're multiplying or dividing:
 *   – multiply a×b=p  → distractor is b (= p÷a, what you'd get if dividing)
 *   – divide d÷s=q    → distractor is d×s (the full multiply result)
 */
function generateMathOptions(correct, fact) {
  const opts = new Set([correct]);

  // Opposite-operation distractor
  const opposite = fact.product !== undefined
    ? fact.b                          // multiply: operand child might pick if confused
    : fact.dividend * fact.divisor;   // divide: full product (most common wrong answer)
  if (opposite > 0 && opposite !== correct) opts.add(opposite);

  const deltas = shuffleArray([-3, -2, -1, 1, 2, 3, -5, 5, 4, -4, -6, 6, 7, -7]);
  for (const d of deltas) {
    if (opts.size >= 4) break;
    const c = correct + d;
    if (c > 0 && !opts.has(c)) opts.add(c);
  }
  // Fallback if still under 4
  let offset = 10;
  while (opts.size < 4) {
    const c = correct + offset;
    if (c > 0) opts.add(c);
    offset += 3;
  }
  return shuffleArray([...opts]);
}

/* ============================================================
   HELPERS – HTML rendering
   ============================================================ */

function renderBlankWord(blank) {
  return blank.replace('_', '<span class="blank">_</span>');
}

function renderSentenceHtml(sentence, blank) {
  const safe = escapeHtml(sentence);
  const blankEscaped = escapeHtml(blank).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(blankEscaped + '[a-záčďéěíňóřšťúůýž]*', 'i');
  return safe.replace(re, match =>
    `<strong style="color:var(--primary)">${match}</strong>`
  );
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function showXpFlash(text) {
  const el = document.createElement('div');
  el.className   = 'xp-flash';
  el.textContent = text;
  el.style.left = '50%';
  el.style.top  = '120px';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

const CORRECT_MESSAGES = [
  'Výborně! 🎉', 'Správně! ✓', 'Skvělé! 🌟', 'Přesně tak! 👍',
  'Bravo! 🏆', 'Super! 💪', 'Perfektní! ⭐', 'Úžasné! 🎊',
];
function randomCorrectMessage() {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}

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

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

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
