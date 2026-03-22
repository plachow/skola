/**
 * data.js – All exercise data for Školníček
 * Paired consonants (párové souhlásky)
 */

/**
 * Word entry shape:
 * {
 *   id:        string   – unique identifier
 *   word:      string   – full word (e.g. "chléb")
 *   blank:     string   – word with _ placeholder (e.g. "chle_")
 *   answer:    string   – correct letter(s) to fill in (e.g. "b")
 *   proof:     string   – genitive/declined form proving the letter (e.g. "chleba")
 *   sentence:  string   – sentence with _ in place (e.g. "Ráno jíme chle_ s máslem.")
 * }
 */

export const CATEGORIES = [
  {
    id: 'b-p',
    name: 'B / P',
    emoji: '🐻',
    color: '#FF6B6B',
    unlockAfter: null,
    pair: ['B', 'P'],
    words: [
      { id: 'bp-1',  word: 'chléb',  blank: 'chle_',  answer: 'b', proof: 'chleba',   sentence: 'Ráno jíme chle_ s máslem.' },
      { id: 'bp-2',  word: 'dub',    blank: 'du_',    answer: 'b', proof: 'dubu',      sentence: 'Veverka skáče po du_u.' },
      { id: 'bp-3',  word: 'zub',    blank: 'zu_',    answer: 'b', proof: 'zubu',      sentence: 'Zu_ mě bolí.' },
      { id: 'bp-4',  word: 'klub',   blank: 'klu_',   answer: 'b', proof: 'klubu',     sentence: 'Chodím do sportovního klu_u.' },
      { id: 'bp-5',  word: 'hřib',   blank: 'hři_',   answer: 'b', proof: 'hřibu',     sentence: 'V lese rostl velký hři_.' },
      { id: 'bp-6',  word: 'krab',   blank: 'kra_',   answer: 'b', proof: 'kraba',     sentence: 'Na pláži jsme viděli kra_a.' },
      { id: 'bp-7',  word: 'hrob',   blank: 'hro_',   answer: 'b', proof: 'hrobu',     sentence: 'U hro_u stála svíčka.' },
      { id: 'bp-8',  word: 'bob',    blank: 'bo_',    answer: 'b', proof: 'bobu',      sentence: 'Pěstujeme bo_y na zahradě.' },
      { id: 'bp-9',  word: 'šíp',    blank: 'ší_',    answer: 'p', proof: 'šípu',      sentence: 'Lučištník vystřelil ší_.' },
      { id: 'bp-10', word: 'strop',  blank: 'stro_',  answer: 'p', proof: 'stropu',    sentence: 'Na stro_u visí lampa.' },
    ],
  },
  {
    id: 'd-t',
    name: 'D / T',
    emoji: '🦕',
    color: '#4CAF50',
    unlockAfter: 'b-p',
    pair: ['D', 'T'],
    words: [
      { id: 'dt-1',  word: 'led',    blank: 'le_',    answer: 'd', proof: 'ledu',      sentence: 'Na rybníku je zamrzlý le_.' },
      { id: 'dt-2',  word: 'had',    blank: 'ha_',    answer: 'd', proof: 'hada',      sentence: 'V trávě se plazil ha_.' },
      { id: 'dt-3',  word: 'sad',    blank: 'sa_',    answer: 'd', proof: 'sadu',      sentence: 'V sa_u zrají jabloně.' },
      { id: 'dt-4',  word: 'med',    blank: 'me_',    answer: 'd', proof: 'medu',      sentence: 'Včelí me_ je sladký.' },
      { id: 'dt-5',  word: 'hrad',   blank: 'hra_',   answer: 'd', proof: 'hradu',     sentence: 'Navštívili jsme starý hra_.' },
      { id: 'dt-6',  word: 'plod',   blank: 'plo_',   answer: 'd', proof: 'plodu',     sentence: 'Jablko je plo_ jabloně.' },
      { id: 'dt-7',  word: 'sud',    blank: 'su_',    answer: 'd', proof: 'sudu',      sentence: 'V su_u leží zelí.' },
      { id: 'dt-8',  word: 'byt',    blank: 'by_',    answer: 't', proof: 'bytu',      sentence: 'Náš by_ je ve druhém patře.' },
      { id: 'dt-9',  word: 'květ',   blank: 'kvě_',   answer: 't', proof: 'květu',     sentence: 'Maminka dostala krásný kvě_.' },
      { id: 'dt-10', word: 'svět',   blank: 'své_',   answer: 't', proof: 'světa',     sentence: 'Cestujeme po celém své_ě.' },
      { id: 'dt-11', word: 'let',    blank: 'le_',    answer: 't', proof: 'letu',      sentence: 'Le_ letadlem byl vzrušující.' },
    ],
  },
  {
    id: 'g-k',
    name: 'G / K',
    emoji: '🦅',
    color: '#9B59B6',
    unlockAfter: 'd-t',
    pair: ['G', 'K'],
    words: [
      { id: 'gk-1',  word: 'lék',      blank: 'lé_',      answer: 'k', proof: 'léku',      sentence: 'Doktor předepsal lé_.' },
      { id: 'gk-2',  word: 'bok',      blank: 'bo_',      answer: 'k', proof: 'boku',      sentence: 'Sedí mi po bo_u.' },
      { id: 'gk-3',  word: 'rok',      blank: 'ro_',      answer: 'k', proof: 'roku',      sentence: 'Uplynul celý ro_.' },
      { id: 'gk-4',  word: 'mák',      blank: 'má_',      answer: 'k', proof: 'máku',      sentence: 'Závin je posypaný má_em.' },
      { id: 'gk-5',  word: 'vrak',     blank: 'vra_',     answer: 'k', proof: 'vraku',     sentence: 'Na dně moře leží vra_ lodi.' },
      { id: 'gk-6',  word: 'hák',      blank: 'há_',      answer: 'k', proof: 'háku',      sentence: 'Kabát visí na há_u.' },
      { id: 'gk-7',  word: 'zrak',     blank: 'zra_',     answer: 'k', proof: 'zraku',     sentence: 'Orel má ostrý zra_.' },
      { id: 'gk-8',  word: 'dialog',   blank: 'dialo_',   answer: 'g', proof: 'dialogu',   sentence: 'Ve hře byl zajímavý dialo_.' },
      { id: 'gk-9',  word: 'katalog',  blank: 'katalo_',  answer: 'g', proof: 'katalogu',  sentence: 'V katalo_u jsem hledal hračky.' },
    ],
  },
  {
    id: 'v-f',
    name: 'V / F',
    emoji: '🦊',
    color: '#FF9800',
    unlockAfter: 'g-k',
    pair: ['V', 'F'],
    words: [
      { id: 'vf-1',  word: 'kov',     blank: 'ko_',     answer: 'v', proof: 'kovu',     sentence: 'Železo je tvrdý ko_.' },
      { id: 'vf-2',  word: 'dav',     blank: 'da_',     answer: 'v', proof: 'davu',     sentence: 'Před obchodem stál velký da_.' },
      { id: 'vf-3',  word: 'chov',    blank: 'cho_',    answer: 'v', proof: 'chovu',    sentence: 'Na farmě je cho_ slepic.' },
      { id: 'vf-4',  word: 'lov',     blank: 'lo_',     answer: 'v', proof: 'lovu',     sentence: 'Myslivec šel na lo_.' },
      { id: 'vf-5',  word: 'šev',     blank: 'še_',     answer: 'v', proof: 'ševu',     sentence: 'Na bundě praskl še_.' },
      { id: 'vf-6',  word: 'záliv',   blank: 'záli_',   answer: 'v', proof: 'zálivu',   sentence: 'Loď kotvila v záli_u.' },
      { id: 'vf-7',  word: 'šéf',     blank: 'šé_',     answer: 'f', proof: 'šéfa',     sentence: 'Šé_ přišel na schůzku.' },
    ],
  },
  {
    id: 'h-ch',
    name: 'H / CH',
    emoji: '🐉',
    color: '#00BCD4',
    unlockAfter: 'v-f',
    pair: ['H', 'CH'],
    words: [
      { id: 'hch-1',  word: 'vzduch',  blank: 'vzdu_',  answer: 'ch', proof: 'vzduchu',  sentence: 'Dýcháme čistý vzdu_.' },
      { id: 'hch-2',  word: 'strach',  blank: 'stra_',  answer: 'ch', proof: 'strachu',  sentence: 'Stra_ ze tmy byl velký.' },
      { id: 'hch-3',  word: 'smích',   blank: 'smí_',   answer: 'ch', proof: 'smíchu',   sentence: 'Smí_ dětí bylo slyšet daleko.' },
      { id: 'hch-4',  word: 'vrch',    blank: 'vr_',    answer: 'ch', proof: 'vrchu',    sentence: 'Dali jsme se na vr_ kopce.' },
      { id: 'hch-5',  word: 'prach',   blank: 'pra_',   answer: 'ch', proof: 'prachu',   sentence: 'Na poličce se usadil pra_.' },
      { id: 'hch-6',  word: 'duch',    blank: 'du_',    answer: 'ch', proof: 'ducha',    sentence: 'V pohádce byl přátelský du_.' },
      { id: 'hch-7',  word: 'ruch',    blank: 'ru_',    answer: 'ch', proof: 'ruchu',    sentence: 'Velkoměstský ru_ je hlučný.' },
      { id: 'hch-8',  word: 'sníh',    blank: 'sní_',   answer: 'h',  proof: 'sněhu',    sentence: 'Bílý sní_ pokryl celou zemi.' },
      { id: 'hch-9',  word: 'Bůh',     blank: 'Bů_',    answer: 'h',  proof: 'Boha',     sentence: 'Věřím v Bů_a.' },
    ],
  },
  {
    id: 'z-s',
    name: 'Z / S',
    emoji: '🌺',
    color: '#E91E63',
    unlockAfter: 'h-ch',
    pair: ['Z', 'S'],
    words: [
      { id: 'zs-1',   word: 'les',    blank: 'le_',    answer: 's', proof: 'lesa',     sentence: 'V le_e zpívají ptáci.' },
      { id: 'zs-2',   word: 'hlas',   blank: 'hla_',   answer: 's', proof: 'hlasu',    sentence: 'Zpěváčin hla_ byl krásný.' },
      { id: 'zs-3',   word: 'pas',    blank: 'pa_',    answer: 's', proof: 'pasu',     sentence: 'Potřebuji pa_ na cestu.' },
      { id: 'zs-4',   word: 'ples',   blank: 'ple_',   answer: 's', proof: 'plesu',    sentence: 'Tančili jsme na ple_u.' },
      { id: 'zs-5',   word: 'klas',   blank: 'kla_',   answer: 's', proof: 'klasu',    sentence: 'Zralý kla_ se ohýbal ve větru.' },
      { id: 'zs-6',   word: 'nos',    blank: 'no_',    answer: 's', proof: 'nosu',     sentence: 'No_ mi teče.' },
      { id: 'zs-7',   word: 'mráz',   blank: 'mrá_',   answer: 'z', proof: 'mrazu',    sentence: 'Venku je velký mrá_.' },
      { id: 'zs-8',   word: 'ráz',    blank: 'rá_',    answer: 'z', proof: 'rázu',     sentence: 'Jedním rá_em to opravil.' },
      { id: 'zs-9',   word: 'vaz',    blank: 'va_',    answer: 'z', proof: 'vazu',     sentence: 'Při sportu si natáhl va_.' },
      { id: 'zs-10',  word: 'úraz',   blank: 'úra_',   answer: 'z', proof: 'úrazu',    sentence: 'Při pádu utrpěl úra_.' },
      { id: 'zs-11',  word: 'kaz',    blank: 'ka_',    answer: 'z', proof: 'kazu',     sentence: 'Zubař opravil ka_ na zubu.' },
    ],
  },
];

/** Flat lookup map by word id */
export const WORD_MAP = Object.fromEntries(
  CATEGORIES.flatMap(cat => cat.words.map(w => [w.id, { ...w, categoryId: cat.id }]))
);

/** Category lookup map by id */
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

/** XP level thresholds */
export const LEVELS = [
  { level: 1, name: 'Prvňáček',       emoji: '🌱', xpRequired: 0    },
  { level: 2, name: 'Pilný žák',      emoji: '📚', xpRequired: 150  },
  { level: 3, name: 'Šikovný',        emoji: '⭐', xpRequired: 350  },
  { level: 4, name: 'Chytrák',        emoji: '🎓', xpRequired: 700  },
  { level: 5, name: 'Jedničkář',      emoji: '🌟', xpRequired: 1200 },
  { level: 6, name: 'Vzorný žák',     emoji: '🏅', xpRequired: 1800 },
  { level: 7, name: 'Génius třídy',   emoji: '🧠', xpRequired: 2500 },
  { level: 8, name: 'Mistr',          emoji: '🏆', xpRequired: 3500 },
];

/** Badge definitions */
export const BADGES = [
  { id: 'first-session',  emoji: '🌱', name: 'První krok',      desc: 'Dokončil/a jsi první cvičení'            },
  { id: 'hot-streak',     emoji: '🔥', name: 'Na vlně',         desc: '5 správných odpovědí v řadě'             },
  { id: 'three-stars',    emoji: '⭐', name: 'Tři hvězdy',      desc: 'První cvičení se třemi hvězdami'         },
  { id: 'first-dictation',emoji: '📝', name: 'Diktátor',        desc: 'Dokončil/a jsi první diktát'             },
  { id: 'perfect-test',   emoji: '🎯', name: 'Ostrý střelec',   desc: '100 % v libovolném testu'                },
  { id: 'never-give-up',  emoji: '💪', name: 'Nevzdám se',      desc: 'Dokončil/a jsi cvičení i po 3+ chybách' },
  { id: 'master-bp',      emoji: '🅱️', name: 'Mistr B/P',       desc: 'Všechny 3 režimy pro B/P splněny'       },
  { id: 'master-dt',      emoji: '🦕', name: 'Mistr D/T',       desc: 'Všechny 3 režimy pro D/T splněny'       },
  { id: 'master-gk',      emoji: '🦅', name: 'Mistr G/K',       desc: 'Všechny 3 režimy pro G/K splněny'       },
  { id: 'master-vf',      emoji: '🦊', name: 'Mistr V/F',       desc: 'Všechny 3 režimy pro V/F splněny'       },
  { id: 'master-hch',     emoji: '🐉', name: 'Mistr H/CH',      desc: 'Všechny 3 režimy pro H/CH splněny'      },
  { id: 'master-zs',      emoji: '🌺', name: 'Mistr Z/S',       desc: 'Všechny 3 režimy pro Z/S splněny'       },
  { id: 'champion',       emoji: '🏆', name: 'Šampión',         desc: 'Získal/a jsi všechny odznaky kategorií' },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

/** Get current level info from total XP */
export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const xpInLevel  = xp - current.xpRequired;
  const xpForNext  = next ? next.xpRequired - current.xpRequired : 0;
  const progress   = next ? Math.min(1, xpInLevel / xpForNext) : 1;
  return { current, next, xpInLevel, xpForNext, progress };
}
