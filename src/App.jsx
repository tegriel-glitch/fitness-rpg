import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// ---------- SUPABASE ----------
const SUPABASE_URL = 'https://zwtzqtdtbbxeebiyaesj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dHpxdGR0YmJ4ZWViaXlhZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMTQwMTQsImV4cCI6MjA5ODU5MDAxNH0.PsxufVIfo_ifO3tKizCujdo1j5J_2mZAuwrewlQRoso';

function sbFetch(path, options = {}) {
  return fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers,
    },
  });
}

// Load a player's full profile by nickname. Returns null if not found.
async function dbLoadPlayer(nickname) {
  const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(nickname)}&limit=1`);
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Create a brand-new player row with empty state.
async function dbCreatePlayer(nickname) {
  const res = await sbFetch('players', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Persist the full profile snapshot for a player.
async function dbSavePlayer(nickname, snapshot) {
  await sbFetch(`players?nickname=eq.${encodeURIComponent(nickname)}`, {
    method: 'PATCH',
    body: JSON.stringify(snapshot),
  });
}

// Fetch all players except the current one (for the Guild tab).
async function dbLoadGuildMembers(excludeNickname) {
  const res = await sbFetch(`players?nickname=neq.${encodeURIComponent(excludeNickname)}&select=nickname,character_name,locked_class_id,chosen_path_id,logs,passive_logs,recovery_logs,raids,active_title,likes`);
  if (!res.ok) return [];
  return await res.json();
}
import { Flame, Dumbbell, Salad, Moon, BookOpen, Swords, Trophy, Plus, X, Sparkles, TrendingUp, Calendar, ChevronDown, Zap, Pizza, Heart, Brain, FlaskConical, Cookie, Check, Lock, Footprints, Wind, PersonStanding, Music, Users, HeartHandshake, Plane, Trees, Palette, Beef, Sprout, Droplet, Shield, Sword, Star, Crown, Gem, Wand2, Hand, Sparkle, Skull, Pencil, Medal, Scale, Glasses, Watch, Shirt, HardHat, Ear, Axe, Gauge, ShoppingBag } from 'lucide-react';

// ---------- ACHIEVEMENT DEFINITIONS ----------

const ACTIVITY_TYPES = {
  running: {
    label: 'Бег',
    icon: Flame,
    color: '#e8633c',
    stats: ['Выносливость', 'Воля'],
    logFields: [{ key: 'distance', label: 'Дистанция, км', type: 'number' }],
  },
  strength_park: {
    label: 'Силовая (турники/парк)',
    icon: Dumbbell,
    color: '#c9a227',
    stats: ['Сила', 'Упорство'],
    logFields: [],
  },
  strength_gym: {
    label: 'Силовая (зал)',
    icon: Dumbbell,
    color: '#c9a227',
    stats: ['Сила', 'Упорство'],
    logFields: [],
  },
  wrestling: {
    label: 'Борьба / единоборства',
    icon: Swords,
    color: '#8a5cf6',
    stats: ['Силовая выносливость', 'Гибкость'],
    logFields: [],
  },
  nutrition: {
    label: 'Здоровое питание',
    icon: Salad,
    color: '#4caf6d',
    stats: ['Фокус', 'Дисциплина'],
    logFields: [],
  },
  sleep: {
    label: 'Здоровый сон',
    icon: Moon,
    color: '#4f7cff',
    stats: ['Дух', 'ХП'],
    logFields: [],
  },
  reading: {
    label: 'Чтение',
    icon: BookOpen,
    color: '#d6558c',
    stats: ['Интеллект', 'Мышление'],
    logFields: [{ key: 'pages', label: 'Страниц', type: 'number' }],
  },
  calories: {
    label: 'Пепел калорий',
    icon: Gauge,
    color: '#ff6b35',
    stats: [],
    logFields: [{ key: 'kcal', label: 'Сожжено ккал', type: 'number' }],
  },
};

// Intensity levels for strength/wrestling logs — replaces flat base XP.
// Selected in LogModal; defaults to 'medium' if unset (for older logs before this field existed).
const INTENSITY_LEVELS = {
  light:  { label: 'Лёгкая',  xp: 7,  color: '#5fb884' },
  medium: { label: 'Средняя', xp: 10, color: '#c9a227' },
  hard:   { label: 'Тяжёлая', xp: 13, color: '#e8633c' },
};
const INTENSITY_ACTIVITIES = new Set(['strength_park', 'strength_gym', 'wrestling']);

// Which activities restore which health bar, and by how much per session.
// Mental health is restored only by sleep and reading (nutrition no longer contributes).
const PHYSICAL_HEALTH_SOURCES = { running: 5, strength_park: 5, strength_gym: 5, wrestling: 5, sleep: 4 };
const MENTAL_HEALTH_SOURCES = { sleep: 5, reading: 5 };

// "Восстановление" entries: see RECOVERY_TIER_EFFECTS below for per-tier gains and stack removal.
// The mental restore includes a proportional bonus equal to the magnitude of any removed stress stack.

// "Восстановление" — a separate, visually highlighted block of anti-stress activities.
// Each entry removes stress debuff stacks and restores HP. Types are split into three tiers:
// - short:  removes 1 stack, +5 mental + 2 physical base restore
// - long:   removes 2 stacks, +10 mental + 5 physical base restore (require more time/resources)
// - rest:   removes 1 stack, +1 mental + 1 physical (minimalist "just chill" option)
// On top of the base restore, mental HP is also restored PROPORTIONALLY to the magnitude of
// any stress stack removed (so digging out of a deep pit feels like real relief).
// Each type is limited to ONE log per day (can't spam 5 walks to clear all stress).
const RECOVERY_TIER_EFFECTS = {
  short: { stacksRemoved: 1, baseMental: 5,  basePhysical: 2 },
  long:  { stacksRemoved: 2, baseMental: 10, basePhysical: 5 },
  rest:  { stacksRemoved: 1, baseMental: 1,  basePhysical: 1 },
};

const RECOVERY_TYPES = {
  walk:        { label: 'Прогулка',            icon: Footprints,     tier: 'short' },
  breathing:   { label: 'Дыхательные практики', icon: Wind,           tier: 'short' },
  stretching:  { label: 'Растяжка',             icon: PersonStanding, tier: 'short' },
  dancing:     { label: 'Танцы',                icon: Music,          tier: 'short' },
  hobby:       { label: 'Любимое хобби',        icon: Palette,        tier: 'short' },
  sauna:       { label: 'Баня',                 icon: Flame,          tier: 'long' },
  therapy:     { label: 'Психолог',             icon: HeartHandshake, tier: 'long' },
  travel:      { label: 'Путешествие',          icon: Plane,          tier: 'long' },
  nature:      { label: 'Время на природе',     icon: Trees,          tier: 'long' },
  socializing: { label: 'Приятное общение',     icon: Users,          tier: 'long' },
  rest:        { label: 'Просто отдых',         icon: Moon,           tier: 'rest' },
};

const PASSIVE_TYPES = {
  stress: { label: 'Стресс', icon: Zap, affects: 'mental' },
  sleep_debt: { label: 'Недосып', icon: Moon, affects: 'physical' },
  overeating: { label: 'Зажор', icon: Pizza, affects: 'poison' },
  cheat_meal: { label: 'Читмил', icon: Cookie, affects: 'cheat' },
};

const CHEAT_MEAL_SAFE_INTERVAL_DAYS = 14;

const POISON_THRESHOLD = 5;
const POISON_PENALTY_PER_STAT = 10;

// ---------- CHARACTER CLASS SYSTEM ----------
// The class is recalculated dynamically based on whichever stat group currently has the
// highest average value. Each class grants +10% XP to activities in its own group.
const CLASS_XP_BONUS = 0.10;
const COMBO_CLASS_XP_BONUS = 0.08; // +8% to both groups (base class still gives +10% to its own group)

const CHARACTER_CLASSES = [
  { id: 'pathfinder', name: 'Следопыт', statGroup: 'Стойкость', stats: ['Выносливость', 'Воля'], icon: Footprints, color: '#e8633c', activities: ['running'] },
  { id: 'berserker', name: 'Берсеркер', statGroup: 'Мощь', stats: ['Сила', 'Упорство'], icon: Skull, color: '#c9a227', activities: ['strength_park', 'strength_gym'] },
  { id: 'battlemaster', name: 'Мастер битвы', statGroup: 'Рефлексы', stats: ['Силовая выносливость', 'Гибкость'], icon: Swords, color: '#8a5cf6', activities: ['wrestling'] },
  { id: 'monk', name: 'Монах', statGroup: 'Самоконтроль', stats: ['Фокус', 'Дисциплина'], icon: Hand, color: '#4caf6d', activities: ['nutrition'] },
  { id: 'shaman', name: 'Шаман', statGroup: 'Жизненная сила', stats: ['Дух', 'ХП'], icon: Sparkle, color: '#4f7cff', activities: ['sleep'] },
  { id: 'archmage', name: 'Архимаг', statGroup: 'Разум', stats: ['Интеллект', 'Мышление'], icon: Wand2, color: '#d6558c', activities: ['reading'] },
];

// Returns the id of the class whose stat group currently has the highest average value,
// or null if all stats are still at 0 (no class assigned yet).
// (Legacy single-stat dominance is now handled via resolveCharacterClass, which also
// supports combo classes — see below.)

// ---------- COMBO CLASSES ----------
// Unlocked from level 20+. If the top two stat-group averages are close enough to each other
// (within COMBO_CLASS_THRESHOLD of the leading value), a hybrid class name is shown instead
// of the single dominant class. Covers all 15 possible pairs among the 6 base classes.
const COMBO_CLASS_MIN_LEVEL = 20;
const COMBO_CLASS_THRESHOLD = 0.15; // top2 must be within 15% of top1 to count as a combo

const COMBO_CLASS_NAMES = {
  'berserker|pathfinder': 'Вестник Бури',
  'monk|pathfinder': 'Странствующий Монах',
  'pathfinder|shaman': 'Лунный Странник',
  'archmage|pathfinder': 'Заклинатель Ветра',
  'battlemaster|pathfinder': 'Вестник Шторма',
  'berserker|monk': 'Укротитель Зверей',
  'berserker|shaman': 'Кровавый Шаман',
  'battlemaster|berserker': 'Ревущий Зверь',
  'archmage|berserker': 'Чародей Войны',
  'monk|shaman': 'Хранитель Снов',
  'battlemaster|monk': 'Рука Возмездия',
  'archmage|monk': 'Верховный Жрец',
  'battlemaster|shaman': 'Дух Битвы',
  'archmage|shaman': 'Оракул Духов',
  'archmage|battlemaster': 'Клинок Разума',
};

function comboKeyFor(idA, idB) {
  return [idA, idB].sort().join('|');
}

// Returns either a single CHARACTER_CLASSES entry, or a synthetic combo class object
// { combo: true, name, icon, color, statGroup, classA, classB }, or null if no stats yet.
function resolveCharacterClass(totals, level) {
  const ranked = CHARACTER_CLASSES
    .map((cls) => {
      const sum = cls.stats.reduce((acc, s) => acc + (totals[s] || 0), 0);
      return { cls, avg: sum / cls.stats.length };
    })
    .sort((a, b) => b.avg - a.avg);

  if (ranked.length === 0 || ranked[0].avg <= 0) return null;

  const top1 = ranked[0];
  const top2 = ranked[1];

  if (level >= COMBO_CLASS_MIN_LEVEL && top2 && top2.avg > 0 && (top1.avg - top2.avg) / top1.avg <= COMBO_CLASS_THRESHOLD) {
    const key = comboKeyFor(top1.cls.id, top2.cls.id);
    const comboName = COMBO_CLASS_NAMES[key];
    if (comboName) {
      return {
        combo: true,
        id: 'combo_' + key,
        name: comboName,
        icon: top1.cls.icon,
        secondaryIcon: top2.cls.icon,
        color: top1.cls.color,
        secondaryColor: top2.cls.color,
        statGroup: `${top1.cls.statGroup} + ${top2.cls.statGroup}`,
        classA: top1.cls,
        classB: top2.cls,
      };
    }
  }

  return top1.cls;
}

// Maps each loggable activity to the class it would boost, used when computing the +10% XP bonus.
const CLASS_BY_ACTIVITY = {};
CHARACTER_CLASSES.forEach((cls) => {
  cls.activities.forEach((act) => {
    CLASS_BY_ACTIVITY[act] = cls.id;
  });
});

// ---------- CLASS PATHS ----------
// Each base class has 2 paths (ветки), each with 5 passives unlocked at levels 10/15/20/25/30
const CLASS_PATHS = {
  pathfinder: [
    {
      id: 'pathfinder_south',
      name: 'Поступь южных ветров',
      focus: 'Выносливость',
      color: '#ff8c55',
      skills: [
        { level: 10, name: 'Ветер в спину',       desc: 'Бег даёт +25% XP к Выносливости' },
        { level: 15, name: 'Ранний разгон',        desc: 'Стрик бега засчитывается с 2-го дня (бронза раньше)' },
        { level: 20, name: 'Сотня километров',     desc: 'Каждые 50 км суммарно → +3 Выносливость' },
        { level: 25, name: 'Марафонское дыхание',  desc: 'Бег 5 дней подряд → физ.хп восстанавливается +5%/день' },
        { level: 30, name: 'Путь без конца',       desc: 'Каждые 100 км → +5 Выносливость + +2 Воля' },
      ],
    },
    {
      id: 'pathfinder_hunter',
      name: 'Пылающее сердце охотника',
      focus: 'Воля',
      color: '#e8633c',
      skills: [
        { level: 10, name: 'Охотничий инстинкт',  desc: 'Сон и питание дают +15% XP к Воле' },
        { level: 15, name: 'Упрямство зверя',      desc: 'Любой стрик 7+ дней → +2 Воля бонус' },
        { level: 20, name: 'Ночной бег',           desc: 'Комбо «бег + сон в один день» → +5 XP сверху' },
        { level: 25, name: 'Второе дыхание',       desc: 'Стрики не сбрасываются если пропустил 1 день раз в 14 дней' },
        { level: 30, name: 'Сердце не сдаётся',   desc: 'За каждый месяц без пропуска активности → +5 Воля' },
      ],
    },
  ],
  berserker: [
    {
      id: 'berserker_iron',
      name: 'Стальная хватка гор',
      focus: 'Сила',
      color: '#e8b830',
      skills: [
        { level: 10, name: 'Горная мощь',          desc: 'Силовые тренировки дают +25% XP к Силе' },
        { level: 15, name: 'Двойной удар',          desc: 'Два силовых дня подряд → +3 Сила бонус' },
        { level: 20, name: 'Тридцать сессий',       desc: 'Каждые 30 силовых тренировок → +5 Сила' },
        { level: 25, name: 'Закалка железом',       desc: 'Силовые снимают 1 стак усталости после тренировки' },
        { level: 30, name: 'Рука горы',             desc: 'Каждые 50 тренировок → +8 Сила + +3 Упорство' },
      ],
    },
    {
      id: 'berserker_endless',
      name: 'Неутомимый владыка пустошей',
      focus: 'Упорство',
      color: '#c9a227',
      skills: [
        { level: 10, name: 'Воля пустоши',         desc: 'Борьба + силовая дают +15% XP к Упорству' },
        { level: 15, name: 'Кожа как броня',        desc: 'Дебаффы усталости снимают физ.хп только на 60%' },
        { level: 20, name: 'Цикл выживания',        desc: 'После 10 тренировок подряд (чередование) → +4 Упорство' },
        { level: 25, name: 'Цена победы',           desc: 'Борьба после силовой в тот же день → +2 Упорство + +1 Сила' },
        { level: 30, name: 'Владыка пустошей',      desc: 'Каждые 20 тренировок → +4 Упорство + +2 Сила' },
      ],
    },
  ],
  battlemaster: [
    {
      id: 'battlemaster_thousand',
      name: 'Кулак тысячи схваток',
      focus: 'Силовая выносливость',
      color: '#a07cf6',
      skills: [
        { level: 10, name: 'Несокрушимый кулак',   desc: 'Борьба даёт +25% XP к Силовой выносливости' },
        { level: 15, name: 'Тройной натиск',        desc: '3 тренировки борьбы за неделю → +4 Силовая выносливость' },
        { level: 20, name: 'Двадцать пятая схватка',desc: 'Каждые 25 схваток → +5 Силовая выносливость' },
        { level: 25, name: 'Боевое восстановление', desc: 'После борьбы физ.хп восстанавливается +5%' },
        { level: 30, name: 'Кулак легенды',         desc: 'Каждые 50 схваток → +8 Силовая выносливость + +3 Гибкость' },
      ],
    },
    {
      id: 'battlemaster_dancer',
      name: 'Адепт искусной борьбы',
      focus: 'Гибкость',
      color: '#8a5cf6',
      skills: [
        { level: 10, name: 'Танец клинков',         desc: 'Бег + борьба в один день → +15% XP ко всему дню' },
        { level: 15, name: 'Гибкое тело',           desc: 'Гибкость растёт на +50% быстрее от борьбы' },
        { level: 20, name: 'Мастер движения',       desc: 'Комбо «борьба + бег» → +3 Гибкость раз в неделю' },
        { level: 25, name: 'Неуловимый',            desc: 'Стрик борьбы 5 дней → +2 Гибкость + +2 Выносливость' },
        { level: 30, name: 'Адепт пустоты',         desc: 'Каждые 30 комбо-дней → +6 Гибкость + +4 Выносливость' },
      ],
    },
  ],
  monk: [
    {
      id: 'monk_hermit',
      name: 'Отшельник безмолвных гор',
      focus: 'Фокус',
      color: '#5fcf85',
      skills: [
        { level: 10, name: 'Тишина разума',         desc: 'Чтение даёт +25% XP к Фокусу' },
        { level: 15, name: 'Завершённый путь',      desc: 'Каждая завершённая книга → +3 Фокус' },
        { level: 20, name: 'Союз разума и тела',    desc: 'Комбо «питание + чтение» в один день → +5 Фокус' },
        { level: 25, name: 'Пятьсот страниц',       desc: 'За каждые 500 страниц прочитанного → +5 Фокус' },
        { level: 30, name: 'Горный мудрец',         desc: 'Каждые 10 книг → +8 Фокус + +3 Дисциплина' },
      ],
    },
    {
      id: 'monk_guardian',
      name: 'Страж неколебимой воли',
      focus: 'Дисциплина',
      color: '#4caf6d',
      skills: [
        { level: 10, name: 'Несгибаемость',         desc: 'Правильное питание каждый день → +15% XP к Дисциплине' },
        { level: 15, name: 'Щит от яда',            desc: 'Яд (зажор) снимает на 30% меньше со статов' },
        { level: 20, name: 'Две недели',             desc: 'Стрик питания 14 дней → +5 Дисциплина' },
        { level: 25, name: 'Двойная дисциплина',    desc: 'Питание + чтение каждый день → +2 Дисциплина + +1 Фокус в неделю' },
        { level: 30, name: 'Несокрушимая воля',     desc: 'Стрик питания 30 дней → +10 Дисциплина + +5 Фокус' },
      ],
    },
  ],
  shaman: [
    {
      id: 'shaman_spirit',
      name: 'Дух тайных миров',
      focus: 'Дух',
      color: '#7090ff',
      skills: [
        { level: 10, name: 'Голос духов',           desc: 'Сон даёт +25% XP к Духу' },
        { level: 15, name: 'Исцеляющий сон',        desc: 'Здоровый сон восстанавливает физ.хп +8%' },
        { level: 20, name: 'Двадцать ночей',        desc: 'Каждые 20 здоровых ночей подряд → +4 Дух' },
        { level: 25, name: 'Незыблемый разум',      desc: 'Ментал.хп не падает ниже 30% даже при стрессе' },
        { level: 30, name: 'Хранитель миров',       desc: 'Каждые 50 здоровых ночей → +8 Дух + +4 ХП' },
      ],
    },
    {
      id: 'shaman_fortress',
      name: 'Живая крепость',
      focus: 'ХП',
      color: '#4f7cff',
      skills: [
        { level: 10, name: 'Броня жизни',           desc: 'Сон + питание дают +15% XP к ХП' },
        { level: 15, name: 'Стальные нервы',        desc: 'Стрессовые дебаффы снимают ментал.хп на 30% меньше' },
        { level: 20, name: 'Сила здоровья',         desc: 'При физ.хп выше 80% → +5% XP ко всем активностям' },
        { level: 25, name: 'Рейдовая стойкость',    desc: 'Штраф за провал рейда → -30% вместо -50%' },
        { level: 30, name: 'Вечная крепость',       desc: 'Каждые 30 дней без критичного падения хп → +6 ХП + +4 Дух' },
      ],
    },
  ],
  archmage: [
    {
      id: 'archmage_architect',
      name: 'Архитектор концепций',
      focus: 'Интеллект',
      color: '#e870a8',
      skills: [
        { level: 10, name: 'Бесконечная библиотека', desc: 'Чтение даёт +25% XP к Интеллекту' },
        { level: 15, name: 'Завершённый том',        desc: 'Каждая завершённая книга → +4 Интеллект' },
        { level: 20, name: 'Триста страниц',         desc: 'За каждые 300 страниц → +3 Интеллект' },
        { level: 25, name: 'Две недели знаний',      desc: 'Стрик чтения 14 дней → +5 Интеллект' },
        { level: 30, name: 'Великий архитектор',     desc: 'Каждые 20 книг → +10 Интеллект + +4 Мышление' },
      ],
    },
    {
      id: 'archmage_thinker',
      name: 'Мыслитель облачных миров',
      focus: 'Мышление',
      color: '#d6558c',
      skills: [
        { level: 10, name: 'Облачный разум',         desc: 'Комбо «чтение + питание + сон» → +15% XP к Мышлению' },
        { level: 15, name: 'Усиленное знание',       desc: 'Ачивки за чтение дают +50% XP-бонус сверху' },
        { level: 20, name: 'Пятьсот в месяц',        desc: 'Каждые 500 страниц в месяц → +4 Мышление' },
        { level: 25, name: 'Комбо мыслителя',        desc: 'Комбо-дни «все пассивные» → +2 Мышление + +1 Интеллект' },
        { level: 30, name: 'Мыслитель вечности',     desc: 'Каждые 30 комбо-дней → +8 Мышление + +5 Интеллект' },
      ],
    },
  ],
};


// Tier thresholds + names per achievement track
const ACHIEVEMENTS = [
  {
    id: 'run_distance',
    title: 'Дистанция забега',
    activity: 'running',
    kind: 'single_value', // best single value of `distance`
    tiers: [
      { tier: 'bronze', name: 'Бронза', need: 3 },
      { tier: 'silver', name: 'Серебро', need: 5 },
      { tier: 'gold', name: 'Золото', need: 10 },
    ],
    unit: 'км',
  },
  {
    id: 'run_streak',
    title: 'Бег по дням подряд',
    activity: 'running',
    kind: 'streak',
    tiers: [
      { tier: 'bronze', name: 'Бронза', need: 3 },
      { tier: 'silver', name: 'Серебро', need: 5 },
      { tier: 'gold', name: 'Золото', need: 10 },
    ],
    unit: 'дней',
  },
  {
    id: 'run_total_km',
    title: 'Суммарный километраж',
    activity: 'running',
    kind: 'cumulative_value',
    tiers: [
      { tier: 'bronze', name: 'Черепашка, но не ниндзя', need: 20 },
      { tier: 'silver', name: 'Марафонец, который погиб', need: 40 },
      { tier: 'gold', name: 'Одна извилина триатлона', need: 80 },
      { tier: 'platinum', name: 'Выносливость его боялась', need: 100 },
    ],
    unit: 'км всего',
  },
  {
    id: 'strength_park_style',
    title: 'Силовой стиль',
    activity: 'strength_park',
    kind: 'count',
    tiers: [{ tier: 'special', name: 'Лесной олимпийский эльф', need: 1 }],
    unit: 'раз',
    flavor: 'Силовая на турниках или в парке',
  },
  {
    id: 'strength_park_total',
    title: 'Всего тренировок на турниках/парке',
    activity: 'strength_park',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Зелёная веточка', need: 12 },
      { tier: 'silver', name: 'Смотрящий за турником', need: 24 },
      { tier: 'gold', name: 'Спортик', need: 48 },
      { tier: 'platinum', name: 'Кто припарковал машину?', need: 77 },
      { tier: 'diamond', name: 'Отлетевший кроссфитер', need: 100 },
    ],
    unit: 'тренировок',
  },
  {
    id: 'strength_gym_style',
    title: 'Силовой стиль',
    activity: 'strength_gym',
    kind: 'count',
    tiers: [{ tier: 'special', name: 'Варварский налёт на блины', need: 1 }],
    unit: 'раз',
    flavor: 'Силовая в спортзале',
  },
  {
    id: 'strength_gym_total',
    title: 'Всего тренировок в зале',
    activity: 'strength_gym',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Уаз патриот', need: 12 },
      { tier: 'silver', name: 'Гнущий линии', need: 40 },
      { tier: 'gold', name: 'Медоед', need: 80 },
      { tier: 'platinum', name: 'Стальной химик', need: 100 },
    ],
    unit: 'тренировок',
  },
  {
    id: 'wrestling_style',
    title: 'Силовой стиль',
    activity: 'wrestling',
    kind: 'count',
    tiers: [{ tier: 'special', name: 'Дварфийский прогиб', need: 1 }],
    unit: 'раз',
    flavor: 'Борьба / единоборства',
  },
  {
    id: 'wrestling_total',
    title: 'Всего тренировок по борьбе',
    activity: 'wrestling',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Гардпулер', need: 12 },
      { tier: 'silver', name: 'Силовичок', need: 24 },
      { tier: 'gold', name: 'Завязывающий узлы', need: 48 },
      { tier: 'platinum', name: 'Его называли домкрат', need: 77 },
      { tier: 'diamond', name: 'Гордость Дагестана', need: 100 },
    ],
    unit: 'тренировок',
  },
  {
    id: 'strength_weekly',
    title: 'Силовые по дням (в неделю)',
    activity: ['strength_park', 'strength_gym', 'wrestling'],
    kind: 'weekly_count',
    tiers: [
      { tier: 'bronze', name: 'Бегущий по лени', need: 1 },
      { tier: 'silver', name: 'Нормис', need: 2 },
      { tier: 'gold', name: 'Еее бадди', need: 3 },
      { tier: 'platinum', name: 'Батя в лучшие годы', need: 4 },
    ],
    unit: 'раз/нед',
  },
  {
    id: 'nutrition_streak',
    title: 'Питание по дням подряд',
    activity: 'nutrition',
    kind: 'streak',
    tiers: [
      { tier: 'bronze', name: 'Свинка Пеппа', need: 3 },
      { tier: 'silver', name: 'Сильвольный борец', need: 5 },
      { tier: 'gold', name: 'Дисциплинатор 3000', need: 7 },
    ],
    unit: 'дней',
  },
  {
    id: 'nutrition_total',
    title: 'Всего дней здорового питания',
    activity: 'nutrition',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Ищем пресс', need: 14 },
      { tier: 'silver', name: 'Волевой зараза', need: 28 },
      { tier: 'gold', name: 'Карающий калории', need: 56 },
      { tier: 'platinum', name: 'Истязающий жиры', need: 77 },
      { tier: 'diamond', name: 'Я есть пресс', need: 100 },
    ],
    unit: 'дней',
  },
  {
    id: 'sleep_streak',
    title: 'Здоровый сон по дням подряд',
    activity: 'sleep',
    kind: 'streak',
    tiers: [
      { tier: 'bronze', name: 'Сонный паралич', need: 3 },
      { tier: 'silver', name: 'Мелатонин', need: 5 },
      { tier: 'gold', name: 'Морфей', need: 10 },
    ],
    unit: 'дней',
  },
  {
    id: 'sleep_total',
    title: 'Всего дней здорового сна',
    activity: 'sleep',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Улитка', need: 3 },
      { tier: 'silver', name: 'Восстановитель ЦНС', need: 7 },
      { tier: 'gold', name: 'Магистр циркадных ритмов', need: 14 },
      { tier: 'platinum', name: 'Морфеус мать его', need: 28 },
    ],
    unit: 'дней',
  },
  {
    id: 'reading_streak',
    title: 'Чтение по дням подряд',
    activity: 'reading',
    kind: 'streak',
    tiers: [
      { tier: 'bronze', name: 'Книжный червь', need: 3 },
      { tier: 'silver', name: 'Умник', need: 5 },
      { tier: 'gold', name: 'Евгений Викторович Жаринов', need: 10 },
    ],
    unit: 'дней',
  },
  {
    id: 'reading_total',
    title: 'Всего дней чтения',
    activity: 'reading',
    kind: 'cumulative_count',
    tiers: [
      { tier: 'bronze', name: 'Библиотечная пыль', need: 3 },
      { tier: 'silver', name: 'Книжный воротила', need: 5 },
      { tier: 'gold', name: 'Ну этот, как его там, в общем он', need: 10 },
      { tier: 'platinum', name: 'Воспевший интеллект', need: 20 },
      { tier: 'special', name: 'Мозговитый хитроумный', need: 40 },
      { tier: 'diamond', name: 'Режущий бумагу остротой ума', need: 60 },
      { tier: 'legend', name: 'Крутой библиотекарь книгодзука', need: 100 },
    ],
    unit: 'дней',
  },
  {
    id: 'reading_pages',
    title: 'Суммарно страниц прочитано',
    activity: 'reading',
    kind: 'cumulative_pages',
    tiers: [
      { tier: 'bronze',   name: 'Первые строчки',           need: 50 },
      { tier: 'silver',   name: 'Дочитал до половины',      need: 100 },
      { tier: 'gold',     name: 'Прочитанная книга',        need: 300 },
      { tier: 'platinum', name: 'Книжная полка',            need: 500 },
      { tier: 'special',  name: 'Библиотекарь',             need: 1000 },
      { tier: 'diamond',  name: 'Пожиратель книг',          need: 2000 },
      { tier: 'legend',   name: 'Легенда читального зала',  need: 5000 },
    ],
    unit: 'стр',
  },
  {
    id: 'reading_books',
    title: 'Завершено книг',
    activity: 'reading',
    kind: 'books_finished',
    tiers: [
      { tier: 'bronze',   name: 'Первая прочитанная',       need: 1,  rewards: { 'Интеллект': 5,  'Мышление': 3 } },
      { tier: 'gold',     name: 'Три тома мудрости',        need: 3,  rewards: { 'Интеллект': 8,  'Мышление': 5 } },
      { tier: 'platinum', name: 'Пять источников знаний',   need: 5,  rewards: { 'Интеллект': 12, 'Мышление': 8 } },
      { tier: 'diamond',  name: 'Десять миров',             need: 10, rewards: { 'Интеллект': 20, 'Мышление': 15 } },
    ],
    unit: 'книг',
  },
  {
    id: 'cal_best_day',
    title: 'Рекорд сжигания за день',
    activity: 'calories',
    kind: 'cal_single_day',
    tiers: [
      { tier: 'bronze', name: 'Зажигалочка', need: 300 },
      { tier: 'silver', name: 'Солнечный удар', need: 500 },
      { tier: 'gold', name: 'Тлеющий в легионе', need: 800 },
      { tier: 'platinum', name: 'Сказочная печка', need: 1000 },
      { tier: 'special', name: 'Жечь, жечь!', need: 1300 },
      { tier: 'diamond', name: 'Топка судьбы', need: 1600 },
    ],
    unit: 'ккал/день',
  },
  {
    id: 'cal_streak_300',
    title: 'Стрик 300+ ккал/день',
    activity: 'calories',
    kind: 'cal_streak_threshold',
    threshold: 300,
    tiers: [
      { tier: 'bronze', name: 'Деревянная пепельница', need: 5 },
      { tier: 'silver', name: 'Медная пепельница', need: 10 },
      { tier: 'gold', name: 'Бронзовая пепельница', need: 30 },
    ],
    unit: 'дней подряд',
  },
  {
    id: 'cal_streak_500',
    title: 'Стрик 500+ ккал/день',
    activity: 'calories',
    kind: 'cal_streak_threshold',
    threshold: 500,
    tiers: [
      { tier: 'bronze', name: 'Фитилёк', need: 5 },
      { tier: 'silver', name: 'Пылающий бензобак', need: 10 },
      { tier: 'gold', name: 'Взрывная красная бочка', need: 30 },
    ],
    unit: 'дней подряд',
  },
  {
    id: 'cal_total',
    title: 'Суммарно сожжено ккал',
    activity: 'calories',
    kind: 'cal_cumulative',
    tiers: [
      { tier: 'bronze', name: 'Искорка', need: 1000 },
      { tier: 'silver', name: 'Костерок', need: 3000 },
      { tier: 'gold', name: 'Проблема пожарного', need: 8000 },
      { tier: 'platinum', name: 'Лесное пожарище', need: 15000 },
      { tier: 'special', name: 'Сжигатель миров', need: 20000 },
      { tier: 'diamond', name: 'Магма течёт! (но пока не в венах)', need: 30000 },
    ],
    unit: 'ккал всего',
  },
];

// Secret achievements: single-tier, hidden until unlocked, each with a custom check function
// receiving the full computed context (logs, passiveLogs, books, streaks, etc).
const SECRET_ACHIEVEMENTS = [
  {
    id: 'secret_colonel_sanders',
    title: 'Полковник Сандерс',
    hint: 'Связано с режимом питания',
    check: (ctx) => ctx.violatingCheatMealDays.size > 0,
  },
  {
    id: 'secret_steel_alchemist',
    title: 'Стальной алхимик',
    hint: 'Идеальный день, сошедшийся во всём',
    check: (ctx) => ctx.hasPerfectDay,
  },
  {
    id: 'secret_dry_as_desert',
    title: 'Сухой как пустыня',
    hint: 'Долгая дисциплина в питании',
    check: (ctx) => (ctx.streaksByActivity.nutrition || 0) >= 30,
  },
  {
    id: 'secret_matrix_reloaded',
    title: 'Матрица: перезагрузка',
    hint: 'Иногда нужно остановиться',
    check: (ctx) => ctx.maxZeroActivityStreak >= 3,
  },
  {
    id: 'secret_living_marathoner',
    title: 'Живой марафонец',
    hint: 'Беговая выносливость за неделю',
    check: (ctx) => ctx.maxWeeklyRunDistance >= 42,
  },
  {
    id: 'secret_biblio_globus',
    title: 'Библио-Глобус',
    hint: 'Книжный марафон за месяц',
    check: (ctx) => ctx.maxMonthlyBooksFinished >= 4,
    unlocksTab: 'archive',
  },
  {
    id: 'secret_war_machine',
    title: 'Боевая машина',
    hint: 'Месяц, прожитый на ковре',
    check: (ctx) => ctx.maxMonthlyWrestlingCount >= 18,
  },
  // --- Recovery secret achievements: hidden until unlocked, each ties to one recovery type.
  // Short recovery types unlock at 20 uses; long at 10; rest at 30. Each grants a small stat reward.
  {
    id: 'secret_recovery_walk',
    title: 'Панасенков',
    hint: 'Ходьба вдумчивая',
    check: (ctx) => (ctx.recoveryCountsByType.walk || 0) >= 20,
    rewards: { 'Дух': 5, 'Выносливость': 3 },
  },
  {
    id: 'secret_recovery_breathing',
    title: 'Кислородный сомелье',
    hint: 'Дегустация вдохов',
    check: (ctx) => (ctx.recoveryCountsByType.breathing || 0) >= 20,
    rewards: { 'Фокус': 5, 'Дух': 3 },
  },
  {
    id: 'secret_recovery_stretching',
    title: 'Гому Гому но растяжка',
    hint: 'Резиновая гибкость',
    check: (ctx) => (ctx.recoveryCountsByType.stretching || 0) >= 20,
    rewards: { 'Гибкость': 5, 'Силовая выносливость': 3 },
  },
  {
    id: 'secret_recovery_dancing',
    title: 'Диско Элизиум',
    hint: 'Ритм принимает над тобой контроль',
    check: (ctx) => (ctx.recoveryCountsByType.dancing || 0) >= 20,
    rewards: { 'Гибкость': 5, 'Воля': 3 },
  },
  {
    id: 'secret_recovery_hobby',
    title: 'Бесполезные страсти',
    hint: 'Мастерство ни к чему не ведёт, и в этом смысл',
    check: (ctx) => (ctx.recoveryCountsByType.hobby || 0) >= 20,
    rewards: { 'Фокус': 5, 'Интеллект': 3 },
  },
  {
    id: 'secret_recovery_sauna',
    title: 'Электровеник',
    hint: 'Пар пробирает до костей',
    check: (ctx) => (ctx.recoveryCountsByType.sauna || 0) >= 10,
    rewards: { 'ХП': 5, 'Дисциплина': 3 },
  },
  {
    id: 'secret_recovery_therapy',
    title: 'Обработать за 60 минут',
    hint: 'Кушетка, часы, тишина',
    check: (ctx) => (ctx.recoveryCountsByType.therapy || 0) >= 10,
    rewards: { 'Мышление': 5, 'ХП': 3 },
  },
  {
    id: 'secret_recovery_travel',
    title: 'Билет в один конец',
    hint: 'Куда угодно, лишь бы подальше',
    check: (ctx) => (ctx.recoveryCountsByType.travel || 0) >= 10,
    rewards: { 'Воля': 5, 'Интеллект': 5 },
  },
  {
    id: 'secret_recovery_nature',
    title: 'Панасенков и кусты',
    hint: 'Разговор с деревьями',
    check: (ctx) => (ctx.recoveryCountsByType.nature || 0) >= 10,
    rewards: { 'Дух': 5, 'Выносливость': 5 },
  },
  {
    id: 'secret_recovery_socializing',
    title: 'Душа компании имени себя',
    hint: 'Лица меняются, ты остаёшься',
    check: (ctx) => (ctx.recoveryCountsByType.socializing || 0) >= 10,
    rewards: { 'Дух': 5, 'Мышление': 3 },
  },
  {
    id: 'secret_recovery_rest',
    title: 'Заземление на диване',
    hint: 'Лежать — тоже искусство',
    check: (ctx) => (ctx.recoveryCountsByType.rest || 0) >= 30,
    rewards: { 'ХП': 5, 'Дисциплина': 3 },
  },
];

// Combo achievements: repeatable, triggered every day the required activity set is logged together.
// Each trigger grants an immediate flat stat reward and increments a counter (shown in the UI).
// 'strength' in requires means either strength_park OR strength_gym counts.
const COMBO_ACHIEVEMENTS = [
  {
    id: 'combo_spartan',
    title: 'Тройной удар: Спартанец',
    requires: ['strength', 'running', 'sleep'],
    description: 'Силовая тренировка + бег + здоровый сон в один день',
    rewards: { 'Сила': 5, 'Выносливость': 5, 'ХП': 5 },
  },
  {
    id: 'combo_sage',
    title: 'Тройной удар: Мудрец путей',
    requires: ['reading', 'nutrition', 'sleep'],
    description: 'Чтение + правильное питание + здоровый сон в один день',
    rewards: { 'Мышление': 5, 'Дисциплина': 5, 'Дух': 5 },
  },
  {
    id: 'combo_hermit',
    title: 'Тройной удар: Аскетичный отшельник',
    requires: ['strength_park', 'nutrition', 'reading'],
    description: 'Турники + правильное питание + чтение в один день',
    rewards: { 'Упорство': 5, 'Фокус': 5, 'Интеллект': 5 },
  },
  {
    id: 'combo_berserker',
    title: 'Тройной удар: Берсерк',
    requires: ['wrestling', 'strength', 'running'],
    description: 'Единоборства + силовая + бег в один день',
    rewards: { 'Силовая выносливость': 5, 'Упорство': 5, 'Воля': 5 },
  },
];

// "Баланс" achievements: reward keeping two different activities in proportion over a rolling
// 14-day window, or maintaining a dual streak. Repeatable — each qualifying window/block counts.
const BALANCE_ACHIEVEMENTS = [
  {
    id: 'balance_weighted',
    title: 'Взвешенный',
    kind: 'equal_count_window',
    activitiesA: ['strength_park', 'strength_gym'],
    activitiesB: ['running'],
    windowDays: 14,
    minEach: 5,
    description: 'Любые 14 дней, где количество силовых и беговых тренировок совпадает (от 5 и больше каждой)',
    rewards: { 'Выносливость': 5, 'Сила': 5 },
  },
  {
    id: 'balance_harmonious',
    title: 'Уравновешенный',
    kind: 'equal_count_window',
    activitiesA: ['strength_park', 'strength_gym'],
    activitiesB: ['reading'],
    windowDays: 14,
    minEach: 6,
    description: 'Любые 14 дней, где количество силовых тренировок и дней чтения совпадает (от 6 и больше каждой)',
    rewards: { 'Интеллект': 5, 'Сила': 5, 'Дух': 5 },
  },
  {
    id: 'balance_hedonist',
    title: 'Здоровенный гедонист',
    kind: 'dual_streak_block',
    activitiesA: ['nutrition'],
    activitiesB: ['sleep'],
    blockDays: 14,
    description: '14 дней подряд, где правильное питание и здоровый сон отмечены одновременно',
    rewards: { 'ХП': 10, 'Дисциплина': 10 },
  },
];

// ---------- MYTHIC ACHIEVEMENTS ----------
// One-time, anime-themed legendary achievements. Conditions are visible even before unlocking
// (unlike secret achievements); the quote is revealed only after unlocking.
const MYTHIC_ACHIEVEMENTS = [
  {
    id: 'mythic_kamina',
    title: 'МАГМА ТЕЧЁТ В ТВОИХ ВЕНАХ!!!',
    character: 'Камина',
    description: 'В любые 25 дней подряд: 15+ беговых, 15+ силовых, 20+ дней чтения и 25+ дней правильного питания (в любом порядке)',
    quote: 'Можешь не верить в себя. Верь в меня. Верь в мою веру в тебя!',
    rewards: { 'Выносливость': 20, 'Сила': 20, 'Интеллект': 20, 'Дисциплина': 20, 'Дух': 20 },
    check: (ctx) => ctx.mythicFlags.kamina,
  },
  {
    id: 'mythic_heart',
    title: 'СЕРДЦЕ',
    character: 'Улькиорра Сайфер',
    description: '60 дней подряд правильного питания без пропусков',
    quote: 'Сердце — это не то, что можно увидеть. Сердце — это то, что ты чувствуешь, даже когда его нет.',
    rewards: { 'Дисциплина': 60 },
    check: (ctx) => (ctx.streaksByActivity.nutrition || 0) >= 60,
  },
  {
    id: 'mythic_hogyoku',
    title: 'ХОГЬЕКУ',
    character: 'Айзен Соске',
    description: '30 дней подряд, где закрыты любые 4 из 6 основных активностей каждый день',
    quote: 'Желание — это сила. Если ты хочешь достаточно сильно — реальность подчинится.',
    rewards: { 'all': 25 },
    check: (ctx) => ctx.mythicFlags.hogyoku,
  },
  {
    id: 'mythic_thousand_year_war',
    title: 'ТЫСЯЧЕЛЕТНЯЯ КРОВАВАЯ ВОЙНА',
    character: 'Ямамото Генрюсай',
    description: 'В любые 90 дней подряд: 50+ тренировок (бег/силовая/борьба), 60+ дней чтения, 50+ дней питания и 60+ дней сна',
    quote: 'Я — здесь. И пока я здесь — никто не пройдёт.',
    rewards: { 'all': 50 },
    check: (ctx) => ctx.mythicFlags.thousandYearWar,
  },
  {
    id: 'mythic_unohana',
    title: 'ЛЕЧЕНИЕ УНОХАНЫ',
    character: 'Рецу Унохана',
    description: '7 дней подряд без единой силовой/борьбы, и каждый из этих дней — хотя бы одна из: питание, сон, восстановление, чтение',
    quote: 'Битва — это не только меч. Битва — это умение остановиться.',
    rewards: { 'ХП': 35 },
    check: (ctx) => ctx.mythicFlags.unohana,
  },
  {
    id: 'mythic_gates_of_death',
    title: 'ВОСЕМЬ ВРАТ: ВРАТА СМЕРТИ',
    character: 'Майто Гай',
    description: '30 силовых тренировок в любые 35 дней подряд (можно взять до 5 дней отдыха)',
    quote: 'Если ты не можешь сделать что-то — сделай это тысячу раз. А потом ещё тысячу.',
    rewards: { 'Сила': 50 },
    check: (ctx) => ctx.mythicFlags.gatesOfDeath,
  },
  {
    id: 'mythic_sage_mode',
    title: 'РЕЖИМ МУДРЕЦА: ГОРА МЬЁБОКУ',
    character: 'Джирайя',
    description: 'В любые 30 дней подряд: 20+ беговых тренировок и 20+ силовых тренировок (в любом порядке)',
    quote: 'Ниндзя — это тот, кто терпит. Терпит боль. Терпит одиночество. И растёт.',
    rewards: { 'Выносливость': 20, 'Сила': 20 },
    check: (ctx) => ctx.mythicFlags.sageMode,
  },
  {
    id: 'mythic_gai_challenge',
    title: 'ЧЕЛЛЕНДЖ ГАЙ СЕНСЕЯ',
    character: 'Майто Гай',
    description: '90 тренировок (бег/силовая/борьба) в любые 100 дней подряд (можно пропустить до 10 дней)',
    quote: 'Настоящая победа — это не победить соперника. Это победить себя вчерашнего.',
    rewards: { 'all': 50 },
    check: (ctx) => ctx.mythicFlags.gaiChallenge,
  },
  {
    id: 'mythic_santoryu',
    title: 'САНТОРЬЮ: ТРЁХМЕЧЕВОЙ СТИЛЬ',
    character: 'Ророноа Зоро',
    description: 'В любые 30 дней подряд: 15+ силовых тренировок и 15+ тренировок борьбы/единоборств (в любом порядке)',
    quote: 'Я поклялся, что больше никогда не проиграю. И я сдержу эту клятву, даже если умру.',
    rewards: { 'Сила': 15, 'Силовая выносливость': 15 },
    check: (ctx) => ctx.mythicFlags.santoryu,
  },
];

// ---------- CURRENCY & SHOP ----------
// "Кристаллы" — earned two ways: a share of every XP gain, plus a small passive trickle
// based on total accumulated stats. Spent in the shop on cosmetic gear with minor XP bonuses.
const XP_TO_CURRENCY_RATE = 0.70; // main crystal income from stat XP
const PASSIVE_CURRENCY_RATE = 0.15; // passive trickle (together = 0.85x stat-XP → ~30 crystals/day at moderate play)
const SHOP_REFUND_RATE = 0.70; // sold items return 70% of purchase price (paid items only)

const RARITY_TIERS = {
  common: { label: 'Обычный', color: '#c9c9d2', bg: '#23232a' },
  rare: { label: 'Редкий', color: '#5b9bf0', bg: '#162236' },
  epic: { label: 'Эпический', color: '#a35bf0', bg: '#231832' },
  legendary: { label: 'Легендарный', color: '#f0c14b', bg: '#332710' },
  mythic: { label: 'Мифический', color: '#f0574b', bg: '#33150f' },
};

const SHOP_SLOTS = [
  { key: 'head', label: 'Голова' },
  { key: 'body', label: 'Тело' },
  { key: 'accessory', label: 'Аксессуар' },
  { key: 'legs', label: 'Ноги' },
  { key: 'hands', label: 'Руки' },
  { key: 'weapon', label: 'Оружие' },
];

const SHOP_ITEMS = [
  // --- Common (10) — small +3% XP bonus each ---
  { id: 'shop_common_cap', slot: 'head', rarity: 'common', name: 'Тренировочная кепка', icon: HardHat, price: 40, bonus: { activity: 'running', xpBonusPct: 3 } },
  { id: 'shop_common_shirt', slot: 'body', rarity: 'common', name: 'Простая футболка', icon: Shirt, price: 40, bonus: { activity: 'nutrition', xpBonusPct: 3 } },
  { id: 'shop_common_watch', slot: 'accessory', rarity: 'common', name: 'Спортивные часы', icon: Watch, price: 35, bonus: { activity: 'sleep', xpBonusPct: 3 } },
  { id: 'shop_common_band', slot: 'head', rarity: 'common', name: 'Повязка на голову', icon: HardHat, price: 30, bonus: { activity: 'wrestling', xpBonusPct: 3 } },
  { id: 'shop_common_gloves', slot: 'hands', rarity: 'common', name: 'Тканевые перчатки', icon: Hand, price: 30, bonus: { activity: 'strength_gym', xpBonusPct: 3 } },
  { id: 'shop_common_socks', slot: 'legs', rarity: 'common', name: 'Компрессионные носки', icon: Footprints, price: 32, bonus: { activity: 'strength_park', xpBonusPct: 3 } },
  { id: 'shop_common_bracelet', slot: 'accessory', rarity: 'common', name: 'Плетёный браслет', icon: Watch, price: 28, bonus: { activity: 'reading', xpBonusPct: 3 } },
  { id: 'shop_common_sweatband', slot: 'hands', rarity: 'common', name: 'Напульсник', icon: Hand, price: 25, bonus: { activity: 'strength_gym', xpBonusPct: 3 } },
  { id: 'shop_common_backpack', slot: 'body', rarity: 'common', name: 'Рюкзак путешественника', icon: ShoppingBag, price: 38, bonus: { activity: 'reading', xpBonusPct: 3 } },
  { id: 'shop_common_ring', slot: 'accessory', rarity: 'common', name: 'Простое кольцо', icon: Gem, price: 30, bonus: { activity: 'nutrition', xpBonusPct: 3 } },

  // --- Rare (10) — +10% XP bonus each ---
  { id: 'shop_rare_helmet', slot: 'head', rarity: 'rare', name: 'Шлем атлета', icon: HardHat, price: 120, bonus: { activity: 'running', xpBonusPct: 10 } },
  { id: 'shop_rare_armor', slot: 'body', rarity: 'rare', name: 'Лёгкая броня', icon: Shield, price: 130, bonus: { activity: 'strength_gym', xpBonusPct: 10 } },
  { id: 'shop_rare_glasses', slot: 'head', rarity: 'rare', name: 'Очки мудреца', icon: Glasses, price: 110, bonus: { activity: 'reading', xpBonusPct: 10 } },
  { id: 'shop_rare_cloak', slot: 'body', rarity: 'rare', name: 'Дорожный плащ', icon: Shirt, price: 125, bonus: { activity: 'nutrition', xpBonusPct: 10 } },
  { id: 'shop_rare_earring', slot: 'accessory', rarity: 'rare', name: 'Серьга странника', icon: Ear, price: 100, bonus: { activity: 'sleep', xpBonusPct: 10 } },
  { id: 'shop_rare_gauntlets', slot: 'hands', rarity: 'rare', name: 'Перчатки хватки', icon: Hand, price: 115, bonus: { activity: 'strength_park', xpBonusPct: 10 } },
  { id: 'shop_rare_bandana', slot: 'head', rarity: 'rare', name: 'Бандана бойца', icon: HardHat, price: 118, bonus: { activity: 'wrestling', xpBonusPct: 10 } },
  { id: 'shop_rare_vest', slot: 'body', rarity: 'rare', name: 'Жилет борца', icon: Shield, price: 128, bonus: { activity: 'wrestling', xpBonusPct: 10 } },
  { id: 'shop_rare_pendant', slot: 'accessory', rarity: 'rare', name: 'Кулон концентрации', icon: Gem, price: 112, bonus: { activity: 'reading', xpBonusPct: 10 } },
  { id: 'shop_rare_boots', slot: 'legs', rarity: 'rare', name: 'Беговые кроссовки', icon: Footprints, price: 122, bonus: { activity: 'running', xpBonusPct: 10 } },

  // --- Epic (10) — +15% XP bonus each ---
  { id: 'shop_epic_crown', slot: 'head', rarity: 'epic', name: 'Венец чемпиона', icon: Crown, price: 210, bonus: { activity: 'wrestling', xpBonusPct: 15 } },
  { id: 'shop_epic_blade', slot: 'weapon', rarity: 'epic', name: 'Клинок дисциплины', icon: Sword, price: 220, bonus: { activity: 'strength_park', xpBonusPct: 15 } },
  { id: 'shop_epic_shield', slot: 'body', rarity: 'epic', name: 'Эпический нагрудник', icon: ShoppingBag, price: 230, bonus: { activity: 'running', xpBonusPct: 15 } },
  { id: 'shop_epic_amulet', slot: 'accessory', rarity: 'epic', name: 'Амулет ясного разума', icon: Gem, price: 215, bonus: { activity: 'reading', xpBonusPct: 15 } },
  { id: 'shop_epic_boots', slot: 'legs', rarity: 'epic', name: 'Сапоги странника', icon: Footprints, price: 200, bonus: { activity: 'sleep', xpBonusPct: 15 } },
  { id: 'shop_epic_visor', slot: 'head', rarity: 'epic', name: 'Визор стратега', icon: Glasses, price: 210, bonus: { activity: 'nutrition', xpBonusPct: 15 } },
  { id: 'shop_epic_gauntlet', slot: 'hands', rarity: 'epic', name: 'Латная перчатка', icon: Hand, price: 225, bonus: { activity: 'strength_gym', xpBonusPct: 15 } },
  { id: 'shop_epic_warmask', slot: 'head', rarity: 'epic', name: 'Маска войны', icon: Skull, price: 215, bonus: { activity: 'wrestling', xpBonusPct: 15 } },
  { id: 'shop_epic_talisman', slot: 'accessory', rarity: 'epic', name: 'Талисман баланса', icon: Scale, price: 205, bonus: { activity: 'sleep', xpBonusPct: 15 } },
  { id: 'shop_epic_robe', slot: 'body', rarity: 'epic', name: 'Мантия мудреца', icon: Sparkle, price: 220, bonus: { activity: 'reading', xpBonusPct: 15 } },

  // --- Legendary (4) — free, unlocked by mythic achievements or the hardest regular achievement tiers ---
  {
    id: 'shop_legendary_gai_weights',
    slot: 'body', rarity: 'legendary', name: 'Утяжелители Гая', icon: Dumbbell,
    price: 0, requirement: { type: 'mythic', id: 'mythic_gates_of_death' },
    bonus: { activity: 'strength_gym', xpBonusPct: 20 },
  },
  {
    id: 'shop_legendary_unohana_blade',
    slot: 'weapon', rarity: 'legendary', name: 'Минадзуки Уноханы', icon: Sword,
    price: 0, requirement: { type: 'mythic', id: 'mythic_unohana' },
    bonus: { activity: 'sleep', xpBonusPct: 20 },
  },
  {
    id: 'shop_legendary_kamina_shades',
    slot: 'head', rarity: 'legendary', name: 'Очки Камины', icon: Glasses,
    price: 0, requirement: { type: 'mythic', id: 'mythic_kamina' },
    bonus: { activity: 'running', xpBonusPct: 20 },
  },
  {
    id: 'shop_legendary_library_crown',
    slot: 'head', rarity: 'legendary', name: 'Венец Книгодзуки', icon: Crown,
    price: 0, requirement: { type: 'achievement', id: 'reading_total', tierIndex: 6 },
    bonus: { activity: 'reading', xpBonusPct: 20 },
  },

  // --- Mythic (5) — the rarest, tied to the toughest mythic achievements or top achievement tiers ---
  {
    id: 'shop_mythic_hogyoku_core',
    slot: 'accessory', rarity: 'mythic', name: 'Осколок Хогьеку', icon: Gem,
    price: 0, requirement: { type: 'mythic', id: 'mythic_hogyoku' },
    bonus: { activity: 'all', xpBonusPct: 10 },
  },
  {
    id: 'shop_mythic_zaraki_haori',
    slot: 'body', rarity: 'mythic', name: 'Хаори главнокомандующего Готэй 13', icon: Shirt,
    price: 0, requirement: { type: 'mythic', id: 'mythic_thousand_year_war' },
    bonus: { activity: 'all', xpBonusPct: 10 },
  },
  {
    id: 'shop_mythic_santoryu_blades',
    slot: 'weapon', rarity: 'mythic', name: 'Сантори: три клинка', icon: Sword,
    price: 0, requirement: { type: 'mythic', id: 'mythic_santoryu' },
    bonus: { activity: 'wrestling', xpBonusPct: 25 },
  },
  {
    id: 'shop_mythic_hollow_mask',
    slot: 'head', rarity: 'mythic', name: 'Рессурексион Улькиорры', icon: Skull,
    price: 0, requirement: { type: 'mythic', id: 'mythic_heart' },
    bonus: { activity: 'nutrition', xpBonusPct: 25 },
  },
  {
    id: 'shop_mythic_sage_seal',
    slot: 'body', rarity: 'mythic', name: 'Свиток Мьёбоку Джирайи', icon: Sparkles,
    price: 0, requirement: { type: 'mythic', id: 'mythic_sage_mode' },
    bonus: { activity: 'running', xpBonusPct: 25 },
  },

  // --- Class items: 6 slots per class (head, body, accessory, legs, hands, weapon) ---
  // PATHFINDER (бег)
  { id: 'shop_class_pathfinder_head',      slot: 'head',      rarity: 'epic', name: 'Налобная повязка Следопыта', icon: HardHat,     price: 140, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_body',      slot: 'body',      rarity: 'epic', name: 'Плащ Вечного Пути',          icon: Footprints,  price: 180, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_accessory', slot: 'accessory', rarity: 'epic', name: 'Компас Странника',           icon: Star,        price: 150, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_legs',      slot: 'legs',      rarity: 'epic', name: 'Сапоги Ветра',               icon: Wind,        price: 160, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_hands',     slot: 'hands',     rarity: 'epic', name: 'Перчатки Первопроходца',     icon: Hand,        price: 140, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_weapon',    slot: 'weapon',    rarity: 'epic', name: 'Посох Дальних Дорог',        icon: Footprints,  price: 170, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  // BERSERKER (силовая)
  { id: 'shop_class_berserker_head',       slot: 'head',      rarity: 'epic', name: 'Шлем Берсерка',              icon: Skull,       price: 140, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_gym', xpBonusPct: 12 } },
  { id: 'shop_class_berserker_body',       slot: 'body',      rarity: 'epic', name: 'Кираса Ярости',              icon: Shield,      price: 180, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_gym', xpBonusPct: 12 } },
  { id: 'shop_class_berserker_accessory',  slot: 'accessory', rarity: 'epic', name: 'Амулет Берсерка',            icon: Gem,         price: 150, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_park', xpBonusPct: 12 } },
  { id: 'shop_class_berserker_legs',       slot: 'legs',      rarity: 'epic', name: 'Поножи Разрушителя',         icon: Footprints,  price: 160, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_gym', xpBonusPct: 12 } },
  { id: 'shop_class_berserker_hands',      slot: 'hands',     rarity: 'epic', name: 'Наручи Разрушителя',         icon: Dumbbell,    price: 140, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_park', xpBonusPct: 12 } },
  { id: 'shop_class_berserker_weapon',     slot: 'weapon',    rarity: 'epic', name: 'Топор Ярости',               icon: Axe,         price: 170, requirement: { type: 'class', id: 'berserker' }, bonus: { activity: 'strength_gym', xpBonusPct: 12 } },
  // BATTLEMASTER (борьба)
  { id: 'shop_class_battlemaster_head',    slot: 'head',      rarity: 'epic', name: 'Шлем Мастера Битвы',         icon: HardHat,     price: 140, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  { id: 'shop_class_battlemaster_body',    slot: 'body',      rarity: 'epic', name: 'Пояс Чемпиона',              icon: Medal,       price: 180, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  { id: 'shop_class_battlemaster_access',  slot: 'accessory', rarity: 'epic', name: 'Браслет Схватки',            icon: Watch,       price: 150, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  { id: 'shop_class_battlemaster_legs',    slot: 'legs',      rarity: 'epic', name: 'Поножи Бойца',               icon: Footprints,  price: 160, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  { id: 'shop_class_battlemaster_hands',   slot: 'hands',     rarity: 'epic', name: 'Перчатки Захвата',           icon: Hand,        price: 140, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  { id: 'shop_class_battlemaster_weapon',  slot: 'weapon',    rarity: 'epic', name: 'Клинки Вихря',               icon: Swords,      price: 170, requirement: { type: 'class', id: 'battlemaster' }, bonus: { activity: 'wrestling', xpBonusPct: 12 } },
  // MONK (питание)
  { id: 'shop_class_monk_head',            slot: 'head',      rarity: 'epic', name: 'Капюшон Аскета',             icon: HardHat,     price: 140, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  { id: 'shop_class_monk_body',            slot: 'body',      rarity: 'epic', name: 'Роба Аскета',                icon: Shirt,       price: 180, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  { id: 'shop_class_monk_accessory',       slot: 'accessory', rarity: 'epic', name: 'Чётки Спокойствия',          icon: Sprout,      price: 150, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  { id: 'shop_class_monk_legs',            slot: 'legs',      rarity: 'epic', name: 'Сандалии Монаха',            icon: Footprints,  price: 160, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  { id: 'shop_class_monk_hands',           slot: 'hands',     rarity: 'epic', name: 'Руки Воздержания',           icon: Hand,        price: 140, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  { id: 'shop_class_monk_weapon',          slot: 'weapon',    rarity: 'epic', name: 'Посох Самоконтроля',          icon: Wand2,       price: 170, requirement: { type: 'class', id: 'monk' }, bonus: { activity: 'nutrition', xpBonusPct: 12 } },
  // SHAMAN (сон)
  { id: 'shop_class_shaman_head',          slot: 'head',      rarity: 'epic', name: 'Маска Духов',                icon: Skull,       price: 140, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  { id: 'shop_class_shaman_body',          slot: 'body',      rarity: 'epic', name: 'Плащ Духов',                 icon: Moon,        price: 180, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  { id: 'shop_class_shaman_accessory',     slot: 'accessory', rarity: 'epic', name: 'Тотем Сновидений',           icon: Droplet,     price: 150, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  { id: 'shop_class_shaman_legs',          slot: 'legs',      rarity: 'epic', name: 'Поножи Лунной Ночи',         icon: Moon,        price: 160, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  { id: 'shop_class_shaman_hands',         slot: 'hands',     rarity: 'epic', name: 'Перчатки Шамана',            icon: Sparkle,     price: 140, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  { id: 'shop_class_shaman_weapon',        slot: 'weapon',    rarity: 'epic', name: 'Бубен Сновидений',            icon: Sparkles,    price: 170, requirement: { type: 'class', id: 'shaman' }, bonus: { activity: 'sleep', xpBonusPct: 12 } },
  // ARCHMAGE (чтение)
  { id: 'shop_class_archmage_head',        slot: 'head',      rarity: 'epic', name: 'Шляпа Архимага',             icon: HardHat,     price: 140, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
  { id: 'shop_class_archmage_body',        slot: 'body',      rarity: 'epic', name: 'Мантия Мудрости',            icon: Wand2,       price: 180, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
  { id: 'shop_class_archmage_accessory',   slot: 'accessory', rarity: 'epic', name: 'Гримуар Познания',           icon: BookOpen,    price: 150, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
  { id: 'shop_class_archmage_legs',        slot: 'legs',      rarity: 'epic', name: 'Ботинки Книжника',           icon: Footprints,  price: 160, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
  { id: 'shop_class_archmage_hands',       slot: 'hands',     rarity: 'epic', name: 'Перчатки Чернокнижника',     icon: Glasses,     price: 140, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
  { id: 'shop_class_archmage_weapon',      slot: 'weapon',    rarity: 'epic', name: 'Посох Архимага',             icon: Wand2,       price: 170, requirement: { type: 'class', id: 'archmage' }, bonus: { activity: 'reading', xpBonusPct: 12 } },
];

// ---------- RAID BOSSES ----------
const RAID_LOOT_BY_CLASS = {
  boar: {
    pathfinder: { name: 'Наручи Вепря',          stats: { 'Выносливость': 4, 'Воля': 2 } },
    berserker:  { name: 'Клык Вепря',             stats: { 'Сила': 4, 'Упорство': 2 } },
    monk:       { name: 'Оберег Вепря',           stats: { 'Фокус': 4, 'Дисциплина': 2 } },
    shaman:     { name: 'Тотем Вепря',            stats: { 'Дух': 4, 'ХП': 2 } },
    battlemaster:{ name: 'Кистень Вепря',         stats: { 'Силовая выносливость': 4, 'Гибкость': 2 } },
    archmage:   { name: 'Глаз Вепря',             stats: { 'Интеллект': 4, 'Мышление': 2 } },
  },
  orochi: {
    pathfinder: { name: 'Лунный Плащ',            stats: { 'Выносливость': 6, 'Воля': 4 } },
    berserker:  { name: 'Змеиный Коготь',         stats: { 'Сила': 6, 'Упорство': 4 } },
    monk:       { name: 'Чётки Лунного Змея',     stats: { 'Фокус': 6, 'Дисциплина': 4 } },
    shaman:     { name: 'Лунный Амулет',          stats: { 'Дух': 6, 'ХП': 4 } },
    battlemaster:{ name: 'Змеиный Клинок',        stats: { 'Силовая выносливость': 6, 'Гибкость': 4 } },
    archmage:   { name: 'Сфера Лунного Змея',     stats: { 'Интеллект': 6, 'Мышление': 4 } },
  },
  dragon: {
    pathfinder: { name: 'Крылья Хаоса',           stats: { 'Выносливость': 10, 'Воля': 10 } },
    berserker:  { name: 'Драконья Секира',         stats: { 'Сила': 10, 'Упорство': 10 } },
    monk:       { name: 'Мантия Дракона',          stats: { 'Фокус': 10, 'Дисциплина': 10 } },
    shaman:     { name: 'Сердце Дракона',          stats: { 'Дух': 10, 'ХП': 10 } },
    battlemaster:{ name: 'Драконий Кнут',          stats: { 'Силовая выносливость': 10, 'Гибкость': 10 } },
    archmage:   { name: 'Фолиант Дракона Хаоса',  stats: { 'Интеллект': 10, 'Мышление': 10 } },
  },
};

const RAID_BOSSES = [
  {
    id: 'boar',
    name: 'ВЕПРЬ ПУСТЫННОЙ БЕЗДНЫ',
    subtitle: 'Редкий рейд',
    color: '#e8633c',
    rarity: 'rare',
    durationDays: 3,
    weakness: 'Бег',
    sharedTitle: 'Обожжённые пятки',
    lootTier: 'rare',
    description: '72 часа. Уязвимость: бег. Суммарно на всех участников нужно пробежать 45 км.',
    condition: {
      type: 'shared_total',
      label: 'Суммарно км бега',
      activity: 'running',
      field: 'distance',
      target: 45,
      unit: 'км',
    },
  },
  {
    id: 'orochi',
    name: 'ЛУННЫЙ ОРОЧИ',
    subtitle: 'Эпический рейд',
    color: '#4f7cff',
    rarity: 'epic',
    durationDays: 7,
    weakness: 'Дисциплина',
    sharedTitle: 'Хранитель Грёз',
    lootTier: 'epic',
    description: '7 дней. Каждый участник обязан закрыть все 7 дней питания, сна и чтения.',
    condition: {
      type: 'each_player_all_days',
      label: 'Питание + Сон + Чтение каждый день',
      activities: ['nutrition', 'sleep', 'reading'],
      daysRequired: 7,
      unit: 'дней/участник',
    },
  },
  {
    id: 'dragon',
    name: 'ДРАКОН "ПОЖИРАЮЩИЙ СОЛНЦЕ"',
    subtitle: 'Легендарный рейд',
    color: '#f5c84a',
    rarity: 'legendary',
    durationDays: 30,
    weakness: 'Пепел калорий',
    sharedTitle: 'Усмиритель драконов',
    lootTier: 'legendary',
    description: '30 дней. Суммарно на всех участников нужно сжечь 45 000 ккал.',
    condition: {
      type: 'shared_total',
      label: 'Суммарно сожжено ккал',
      activity: 'calories',
      field: 'kcal',
      target: 45000,
      unit: 'ккал',
    },
  },
];

// Raid defeat penalty (HP subtracted from both physical and mental bars) scales by rarity.
// Rare failures should feel like a stumble, legendary failures like a real setback.
const RAID_DEFEAT_PENALTY_BY_RARITY = { rare: 20, epic: 35, legendary: 50 };

const RAID_RARITY_COLORS = {
  rare:      { color: '#5b9bf0', bg: '#162236', border: '#2a3f5c' },
  epic:      { color: '#a35bf0', bg: '#231832', border: '#3d1f5c' },
  legendary: { color: '#f0c14b', bg: '#332710', border: '#5c4010' },
};


const TIER_COLORS = {
  bronze: { bg: '#3a2a1a', border: '#a9692f', text: '#e0a868' },
  silver: { bg: '#2c2f36', border: '#9aa3b0', text: '#d4dae3' },
  gold: { bg: '#3a3115', border: '#d4af37', text: '#f0d272' },
  platinum: { bg: '#1f2e2c', border: '#5fd9c4', text: '#9af0e0' },
  special: { bg: '#2a1f3a', border: '#9c6fe0', text: '#c9a8f5' },
  diamond: { bg: '#1a2a3a', border: '#5fa8e0', text: '#9ad0f5' },
  legend: { bg: '#3a1a2a', border: '#e05f9c', text: '#f5a8c9' },
  locked: { bg: '#202024', border: '#3a3a40', text: '#6a6a72' },
};

const ALL_STATS = ['Выносливость', 'Воля', 'Сила', 'Упорство', 'Фокус', 'Дисциплина', 'Дух', 'ХП', 'Силовая выносливость', 'Гибкость', 'Интеллект', 'Мышление'];

// ---------- LEVEL SYSTEM ----------
// Non-linear curve with a growing exponent: cumulative XP required to reach level n =
// round(12 * n ^ (1.4 + (n-1) * 0.003)).
// Exponent smoothly grows from 1.4 (early) to ~1.547 (level 50), so:
// - first 10 levels come fast (moderate player hits lvl 10 in ~8 days),
// - progression noticeably slows past level 20,
// - endgame (40+) feels weightier without turning into a grind.
// Target pacing: casual ~7 months to 50, moderate ~4.5 months, active ~2.5 months.
const MAX_LEVEL = 50;

function totalXpForLevel(n) {
  if (n <= 1) return 0;
  const exponent = 1.4 + (n - 1) * 0.003;
  return Math.round(12 * Math.pow(n, exponent));
}

function levelFromTotalXp(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

// Titles every 5 levels. Placeholder names — the person will supply their own later.
const LEVEL_TITLES = [
  { from: 1, to: 4, title: 'Пельмешка', icon: Beef, color: '#e0a868' },
  { from: 5, to: 9, title: 'Деревянный Энтузиаст', icon: Sprout, color: '#8fd084' },
  { from: 10, to: 14, title: 'Потеющий Атлет', icon: Droplet, color: '#5fb8e0' },
  { from: 15, to: 19, title: 'Протеиновый Боец', icon: Shield, color: '#e08a4f' },
  { from: 20, to: 24, title: 'Низкокалорийный Гладиатор', icon: Sword, color: '#d4af37' },
  { from: 25, to: 29, title: 'Командор КБЖУ', icon: Star, color: '#9c6fe0' },
  { from: 30, to: 34, title: 'Чемпион Метаболизма', icon: Trophy, color: '#f0d272' },
  { from: 35, to: 39, title: 'Безуглеводный Мастер', icon: Zap, color: '#5fa8e0' },
  { from: 40, to: 44, title: 'Сжигающий оправдания', icon: Flame, color: '#e8633c' },
  { from: 45, to: 49, title: 'Владыка дисциплины', icon: Crown, color: '#e05f9c' },
  { from: 50, to: 50, title: 'Легенда нового мира', icon: Gem, color: '#f5c84a' },
];

function titleForLevel(level) {
  const entry = LEVEL_TITLES.find((t) => level >= t.from && level <= t.to);
  return entry ? entry.title : '';
}

function titleEntryForLevel(level) {
  return LEVEL_TITLES.find((t) => level >= t.from && level <= t.to) || null;
}


// ---------- HELPERS ----------

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function isConsecutiveStreak(dateStrings, blockedDatesSet) {
  // dateStrings: sorted unique array of 'YYYY-MM-DD', most recent first
  // blockedDatesSet (optional): dates that hard-break the streak, e.g. "Загул" days
  // (zero activity at all) or a violating "Читмил" (cheat meal sooner than the safe interval).
  if (dateStrings.length === 0) return 0;

  // A blocked date strictly after the most recent activity date (including today) resets the streak to 0
  // — e.g. last run was yesterday, but today was a Загул day.
  if (blockedDatesSet) {
    const mostRecent = new Date(dateStrings[0]);
    const today = new Date(dateKey(new Date()));
    const cursor = new Date(mostRecent);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= today) {
      if (blockedDatesSet.has(dateKey(cursor))) return 0;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (blockedDatesSet && blockedDatesSet.has(dateStrings[0])) return 0;

  let streak = 1;
  for (let i = 0; i < dateStrings.length - 1; i++) {
    const cur = new Date(dateStrings[i]);
    const next = new Date(dateStrings[i + 1]);
    const diff = (cur - next) / (1000 * 60 * 60 * 24);
    if (diff !== 1) break;
    // A blocked date can coincide with cur itself (e.g. a violating cheat meal logged
    // on the same day as a nutrition log) — treat that day as breaking the streak too.
    if (blockedDatesSet && blockedDatesSet.has(dateStrings[i])) break;
    streak++;
  }
  return streak;
}

// Returns the set of 'YYYY-MM-DD' dates strictly between the earliest and latest activity logs
// (inclusive of latest) that have zero activity logs at all — i.e. "Загул" days.
function computeZeroActivityDays(allActivityDates) {
  const result = new Set();
  if (allActivityDates.length === 0) return result;
  const sorted = [...allActivityDates].sort();
  const earliest = new Date(sorted[0]);
  const today = new Date();
  const loggedSet = new Set(allActivityDates);
  const cursor = new Date(earliest);
  while (cursor <= today) {
    const key = dateKey(cursor);
    if (!loggedSet.has(key)) result.add(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function getWeekKey(d) {
  const date = new Date(d);
  const day = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() - day + 1); // Monday of that week
  return dateKey(date);
}

// ---------- GUILD SYSTEM ----------

const GUILD_NICKNAMES = [
  'Астарот', 'Велес',    'Гидеон',   'Доминион', 'Зефирон',
  'Ксар',    'Люцифер',  'Магнус',   'Немезида', 'Орион',
  'Рагнар',  'Серафим',  'Тиберий',  'Ульрик',   'Фенрир',
  'Хельм',   'Цербер',   'Эреб',     'Янус',     'Зигфрид',
];

// No mock members — only real players who have selected a nickname appear in the guild.
// When Supabase is connected, live player profiles will be fetched here.
const MOCK_GUILD_MEMBERS = [];

// ---------- MAIN APP ----------

function NickButton({ nick, onSelect, color }) {
  return (
    <button
      onClick={() => onSelect(nick)}
      style={{
        background: '#1c1c25',
        border: `1.5px solid ${color}44`,
        borderRadius: 10, padding: '10px 10px',
        color: '#dcdce2', fontSize: 12.5, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        transition: 'border-color 0.15s, background 0.15s',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color,
      }}>
        ✦
      </div>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>
        {nick.replace(/_/g, ' ')}
      </span>
    </button>
  );
}

export default function App() {
  const [logs, setLogs] = useState([]);
  const [passiveLogs, setPassiveLogs] = useState([]); // { id, type, date }
  const [recoveryLogs, setRecoveryLogs] = useState([]); // { id, type, date }
  const [books, setBooks] = useState([]); // { id, title, finished, finishedDate }
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formValue, setFormValue] = useState('');
  const [strictSleep, setStrictSleep] = useState(false);
  const [intensity, setIntensity] = useState('medium'); // for strength/wrestling logs
  const [tab, setTab] = useState('dashboard');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [toast, setToast] = useState(null);
  const [characterName, setCharacterName] = useState(() => localStorage.getItem('rpg_character_name') || 'Атлет');
  const [spentCurrency, setSpentCurrency] = useState(0);
  const [purchasedItemIds, setPurchasedItemIds] = useState([]);
  const [equippedShopItems, setEquippedShopItems] = useState({ head: null, body: null, accessory: null, legs: null, hands: null, weapon: null });

  // raids: { [raidId]: { status: 'active'|'victory'|'defeat', startDate, startClassId, participants: [{name}], contributions: [{participantName, date, activity, value}], defeatPenaltyApplied } }
  const [raids, setRaids] = useState({});
  const [activeTitle, setActiveTitle] = useState(null);
  // Class progression
  const [lockedClassId, setLockedClassId] = useState(null);   // set at level 10
  const [chosenPathId, setChosenPathId]   = useState(null);   // which branch chosen
  const [unlockedSkillLevels, setUnlockedSkillLevels] = useState([]); // [10, 15, …] unlocked tiers // null = use level title

  // Guild / login / DB sync
  const [selectedNickname, setSelectedNickname] = useState(() => localStorage.getItem('rpg_nickname') || null);
  const [guildLikes, setGuildLikes] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [guildMembers, setGuildMembers] = useState([]); // live data from DB
  const saveTimerRef = useRef(null);

  // Build a full snapshot of all saveable state
  function buildSnapshot(overrides = {}) {
    return {
      character_name: characterName,
      logs,
      passive_logs: passiveLogs,
      recovery_logs: recoveryLogs,
      books,
      spent_currency: spentCurrency,
      purchased_item_ids: purchasedItemIds,
      equipped_shop_items: equippedShopItems,
      active_title: activeTitle,
      locked_class_id: lockedClassId,
      chosen_path_id: chosenPathId,
      unlocked_skill_levels: unlockedSkillLevels,
      raids,
      likes: guildLikes,
      ...overrides,
    };
  }

  // Debounced save — fires 1.5s after the last state change
  function scheduleSave(overrides = {}) {
    if (!selectedNickname) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      dbSavePlayer(selectedNickname, buildSnapshot(overrides));
    }, 1500);
  }

  // Load or create player on login, hydrate all state from DB
  async function selectNickname(nick) {
    setDbLoading(true);
    setDbError(null);
    try {
      let row = await dbLoadPlayer(nick);
      if (!row) row = await dbCreatePlayer(nick);
      if (!row) throw new Error('Не удалось создать профиль');

      // Hydrate state from DB row
      if (row.logs?.length)                 setLogs(row.logs);
      if (row.passive_logs?.length)         setPassiveLogs(row.passive_logs);
      if (row.recovery_logs?.length)        setRecoveryLogs(row.recovery_logs);
      if (row.books?.length)                setBooks(row.books);
      if (row.character_name != null)        setCharacterName(row.character_name);
      if (row.spent_currency)               setSpentCurrency(row.spent_currency);
      if (row.purchased_item_ids?.length)   setPurchasedItemIds(row.purchased_item_ids);
      if (row.equipped_shop_items && Object.keys(row.equipped_shop_items).length)
                                            setEquippedShopItems(row.equipped_shop_items);
      if (row.active_title)                 setActiveTitle(row.active_title);
      if (row.locked_class_id)              setLockedClassId(row.locked_class_id);
      if (row.chosen_path_id)              setChosenPathId(row.chosen_path_id);
      if (row.unlocked_skill_levels?.length) setUnlockedSkillLevels(row.unlocked_skill_levels);
      if (row.raids && Object.keys(row.raids).length) setRaids(row.raids);
      if (row.likes && Object.keys(row.likes).length) setGuildLikes(row.likes);

      // If first login (no character_name yet) set it from nick
      if (!row.character_name) setCharacterName(nick);

      setSelectedNickname(nick);
      localStorage.setItem('rpg_nickname', nick);
    } catch (e) {
      setDbError('Ошибка подключения: ' + e.message);
    } finally {
      setDbLoading(false);
    }
  }

  // Refresh guild members every 30s while on guild tab
  const refreshGuild = useCallback(async () => {
    if (!selectedNickname) return;
    try {
      const members = await dbLoadGuildMembers(selectedNickname);
      setGuildMembers(members);
    } catch (_) {}
  }, [selectedNickname]);

  function logout() {
    localStorage.removeItem('rpg_nickname');
    localStorage.removeItem('rpg_character_name');
    setSelectedNickname(null);
    // Reset all state to defaults
    setLogs([]); setPassiveLogs([]); setRecoveryLogs([]); setBooks([]);
    setCharacterName('Атлет'); setSpentCurrency(0); setPurchasedItemIds([]);
    setEquippedShopItems({ head: null, body: null, accessory: null, legs: null, hands: null, weapon: null });
    setRaids({}); setActiveTitle(null); setLockedClassId(null);
    setChosenPathId(null); setUnlockedSkillLevels([]); setGuildLikes({});
    setGuildMembers([]);
  }

  // ---------- DERIVED STATE ----------

  // Auto-login if nickname was saved from previous session
  useEffect(() => {
    const saved = localStorage.getItem('rpg_nickname');
    if (saved && !selectedNickname) {
      selectNickname(saved);
    }
  }, []);

  // Persist character name locally for instant display on reload
  useEffect(() => { if (characterName && characterName !== 'Атлет') localStorage.setItem('rpg_character_name', characterName); }, [characterName]);

  // Auto-save whenever any saveable state changes (debounced 1.5s)
  useEffect(() => { scheduleSave(); }, [
    logs, passiveLogs, recoveryLogs, books, characterName,
    spentCurrency, purchasedItemIds, equippedShopItems,
    activeTitle, lockedClassId, chosenPathId, unlockedSkillLevels,
    raids, guildLikes,
  ]);

  const logsByActivity = useMemo(() => {
    const map = {};
    Object.keys(ACTIVITY_TYPES).forEach((k) => (map[k] = []));
    logs.forEach((l) => map[l.activity]?.push(l));
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.date < b.date ? 1 : -1)));
    return map;
  }, [logs]);

  const zeroActivityDays = useMemo(() => {
    return computeZeroActivityDays(logs.map((l) => l.date));
  }, [logs]);

  // Cheat meals are fine if spaced 14+ days apart; a cheat meal sooner than that breaks the nutrition streak.
  const violatingCheatMealDays = useMemo(() => {
    const cheatDates = [...new Set(passiveLogs.filter((p) => p.type === 'cheat_meal').map((p) => p.date))].sort();
    const result = new Set();
    let lastSafeDate = null;
    cheatDates.forEach((d) => {
      if (lastSafeDate) {
        const diffDays = (new Date(d) - new Date(lastSafeDate)) / (1000 * 60 * 60 * 24);
        if (diffDays < CHEAT_MEAL_SAFE_INTERVAL_DAYS) {
          result.add(d);
          return; // doesn't reset the "safe" timer if it was itself a violation
        }
      }
      lastSafeDate = d;
    });
    return result;
  }, [passiveLogs]);

  const streaksByActivity = useMemo(() => {
    const result = {};
    Object.entries(logsByActivity).forEach(([activity, arr]) => {
      const uniqueDates = [...new Set(arr.map((l) => l.date))].sort((a, b) => (a < b ? 1 : -1));
      const blocked = activity === 'nutrition'
        ? new Set([...zeroActivityDays, ...violatingCheatMealDays])
        : zeroActivityDays;
      result[activity] = isConsecutiveStreak(uniqueDates, blocked);
    });
    return result;
  }, [logsByActivity, zeroActivityDays, violatingCheatMealDays]);

  const weeklyStrengthCount = useMemo(() => {
    const thisWeek = getWeekKey(new Date());
    let count = 0;
    ['strength_park', 'strength_gym', 'wrestling'].forEach((act) => {
      (logsByActivity[act] || []).forEach((l) => {
        if (getWeekKey(l.date) === thisWeek) count++;
      });
    });
    return count;
  }, [logsByActivity]);

  const maxRunDistance = useMemo(() => {
    return Math.max(0, ...(logsByActivity.running || []).map((l) => Number(l.distance) || 0));
  }, [logsByActivity]);

  const totalRunDistance = useMemo(() => {
    return (logsByActivity.running || []).reduce((sum, l) => sum + (Number(l.distance) || 0), 0);
  }, [logsByActivity]);

  const totalCountByActivity = useMemo(() => {
    const result = {};
    Object.keys(ACTIVITY_TYPES).forEach((key) => {
      result[key] = (logsByActivity[key] || []).length;
    });
    return result;
  }, [logsByActivity]);

  const styleCounts = useMemo(() => ({
    strength_park: (logsByActivity.strength_park || []).length,
    strength_gym: (logsByActivity.strength_gym || []).length,
    wrestling: (logsByActivity.wrestling || []).length,
  }), [logsByActivity]);

  // Calorie-specific computations
  const calLogs = useMemo(() => (logsByActivity.calories || []), [logsByActivity]);

  // Best single-day kcal total
  const calBestDay = useMemo(() => {
    const byDate = {};
    calLogs.forEach((l) => {
      byDate[l.date] = (byDate[l.date] || 0) + (Number(l.kcal) || 0);
    });
    return Math.max(0, ...Object.values(byDate));
  }, [calLogs]);

  // Total accumulated kcal
  const calTotal = useMemo(() => {
    return calLogs.reduce((sum, l) => sum + (Number(l.kcal) || 0), 0);
  }, [calLogs]);

  // Streak: consecutive days where daily kcal >= threshold
  function calStreakForThreshold(threshold) {
    const byDate = {};
    calLogs.forEach((l) => {
      byDate[l.date] = (byDate[l.date] || 0) + (Number(l.kcal) || 0);
    });
    // dates where threshold met, sorted desc
    const qualifyingDates = Object.entries(byDate)
      .filter(([, v]) => v >= threshold)
      .map(([d]) => d)
      .sort((a, b) => (a < b ? 1 : -1));
    if (qualifyingDates.length === 0) return 0;
    let streak = 1;
    for (let i = 0; i < qualifyingDates.length - 1; i++) {
      const cur = new Date(qualifyingDates[i]);
      const next = new Date(qualifyingDates[i + 1]);
      const diff = (cur - next) / (1000 * 60 * 60 * 24);
      if (diff !== 1) break;
      streak++;
    }
    // also check if the streak is still live (most recent qualifying day = today or yesterday)
    const mostRecent = new Date(qualifyingDates[0]);
    const today = new Date(dateKey(new Date()));
    const gap = (today - mostRecent) / (1000 * 60 * 60 * 24);
    if (gap > 1) return 0;
    return streak;
  }

  const calStreak300 = useMemo(() => calStreakForThreshold(300), [calLogs]);
  const calStreak500 = useMemo(() => calStreakForThreshold(500), [calLogs]);

  // Reading — cumulative pages and finished books
  const totalReadingPages = useMemo(() => {
    return (logsByActivity.reading || []).reduce((sum, l) => sum + (Number(l.pages) || 0), 0);
  }, [logsByActivity]);

  const booksFinishedCount = useMemo(() => {
    return books.filter(b => b.finished).length;
  }, [books]);

  // Evaluate achievement progress
  function evaluateAchievement(ach) {
    let currentValue = 0;
    if (ach.kind === 'streak') currentValue = streaksByActivity[ach.activity] || 0;
    else if (ach.kind === 'single_value') currentValue = maxRunDistance;
    else if (ach.kind === 'cumulative_value') currentValue = Math.round(totalRunDistance * 10) / 10;
    else if (ach.kind === 'weekly_count') currentValue = weeklyStrengthCount;
    else if (ach.kind === 'count') currentValue = styleCounts[ach.activity] || 0;
    else if (ach.kind === 'cumulative_count') currentValue = totalCountByActivity[ach.activity] || 0;
    else if (ach.kind === 'cal_single_day') currentValue = calBestDay;
    else if (ach.kind === 'cal_cumulative') currentValue = calTotal;
    else if (ach.kind === 'cal_streak_threshold') {
      currentValue = ach.threshold === 300 ? calStreak300 : calStreak500;
    }
    else if (ach.kind === 'cumulative_pages') currentValue = totalReadingPages;
    else if (ach.kind === 'books_finished') currentValue = booksFinishedCount;

    let achievedTierIndex = -1;
    ach.tiers.forEach((t, idx) => {
      if (currentValue >= t.need) achievedTierIndex = idx;
    });
    const nextTier = ach.tiers[achievedTierIndex + 1] || null;
    return { currentValue, achievedTierIndex, nextTier };
  }

  const achievementsEvaluated = useMemo(() => ACHIEVEMENTS.map((a) => ({ ...a, ...evaluateAchievement(a) })), [streaksByActivity, maxRunDistance, totalRunDistance, weeklyStrengthCount, styleCounts, totalCountByActivity, calBestDay, calTotal, calStreak300, calStreak500, totalReadingPages, booksFinishedCount]);

  const unlockedCount = achievementsEvaluated.filter((a) => a.achievedTierIndex >= 0).length;

  // "Стальной алхимик": a single day with 3+ training sessions (any kind) plus nutrition, sleep, and reading all logged.
  // "Тройной удар" combos: for each day, build a set of activity "tags" present that day,
  // then check each combo's requirement set against it. Triggers every matching day.
  // "ПЕНТА-УДАР" legendary achievements: each day, count how many of 6 strict conditions are met
  // (nutrition, strict sleep, run 5+km, any strength, reading 100+ pages, wrestling).
  //
  // "Легенда своего Сити" — repeatable per qualifying day, with a DECAYING reward per stat:
  //   days 1–5   → +15 XP each stat (gold tier, full event reward)
  //   days 6–10  → +8  XP each stat (silver tier, decaying)
  //   days 11–20 → +4  XP each stat (bronze tier, small incentive)
  //   days 21+   → +2  XP each stat (symbolic, discipline habit)
  const pentaResults = useMemo(() => {
    const byDate = {};
    logs.forEach((l) => {
      if (!byDate[l.date]) {
        byDate[l.date] = { nutrition: false, strictSleep: false, run5k: false, strength: false, read100: false, wrestling: false };
      }
      const bucket = byDate[l.date];
      if (l.activity === 'nutrition') bucket.nutrition = true;
      if (l.activity === 'sleep' && l.strict) bucket.strictSleep = true;
      if (l.activity === 'running' && Number(l.distance) >= 5) bucket.run5k = true;
      if (l.activity === 'strength_park' || l.activity === 'strength_gym') bucket.strength = true;
      if (l.activity === 'reading' && Number(l.pages) >= 100) bucket.read100 = true;
      if (l.activity === 'wrestling') bucket.wrestling = true;
    });

    const perfectDayDates = [];
    Object.entries(byDate).forEach(([date, b]) => {
      const metCount = [b.nutrition, b.strictSleep, b.run5k, b.strength, b.read100, b.wrestling].filter(Boolean).length;
      if (metCount >= 5) perfectDayDates.push(date);
    });
    perfectDayDates.sort();

    // "Легенда своего Сити": repeatable, once per qualifying day
    const legendCount = perfectDayDates.length;

    // Compute the DECAYING total reward per stat and per-tier breakdown for UI
    // Tier bands: [1..5] = gold(15), [6..10] = silver(8), [11..20] = bronze(4), [21+] = symbolic(2)
    let goldDays = Math.min(5, legendCount);
    let silverDays = Math.min(5, Math.max(0, legendCount - 5));
    let bronzeDays = Math.min(10, Math.max(0, legendCount - 10));
    let symbolicDays = Math.max(0, legendCount - 20);
    const legendXpPerStat =
      goldDays * 15 +
      silverDays * 8 +
      bronzeDays * 4 +
      symbolicDays * 2;
    const legendTierBreakdown = {
      gold:     { count: goldDays,     xpPerStat: 15 },
      silver:   { count: silverDays,   xpPerStat: 8  },
      bronze:   { count: bronzeDays,   xpPerStat: 4  },
      symbolic: { count: symbolicDays, xpPerStat: 2  },
    };
    // Determine current tier + next tier threshold for UI feedback
    let currentTierKey = 'none';
    let nextTierAtDay = 1;
    let currentTierXp = 0;
    if (legendCount === 0) { currentTierKey = 'none'; nextTierAtDay = 1; }
    else if (legendCount <= 5)  { currentTierKey = 'gold';     nextTierAtDay = 6;  currentTierXp = 15; }
    else if (legendCount <= 10) { currentTierKey = 'silver';   nextTierAtDay = 11; currentTierXp = 8; }
    else if (legendCount <= 20) { currentTierKey = 'bronze';   nextTierAtDay = 21; currentTierXp = 4; }
    else                        { currentTierKey = 'symbolic'; nextTierAtDay = null; currentTierXp = 2; }

    // "Бог нового мира": longest run of consecutive perfect days, unlocked once it reaches 5
    let longestStreak = 0;
    let current = 0;
    for (let i = 0; i < perfectDayDates.length; i++) {
      if (i === 0) {
        current = 1;
      } else {
        const diff = (new Date(perfectDayDates[i]) - new Date(perfectDayDates[i - 1])) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, current);
    }
    const godUnlocked = longestStreak >= 5;

    return {
      legendCount,
      longestStreak,
      godUnlocked,
      legendXpPerStat,
      legendTierBreakdown,
      currentTierKey,
      nextTierAtDay,
      currentTierXp,
    };
  }, [logs]);

  const comboResults = useMemo(() => {
    const tagsByDate = {};
    logs.forEach((l) => {
      if (!tagsByDate[l.date]) tagsByDate[l.date] = new Set();
      const tagSet = tagsByDate[l.date];
      tagSet.add(l.activity);
      if (l.activity === 'strength_park' || l.activity === 'strength_gym') tagSet.add('strength');
    });

    const results = {};
    const totalRewards = {};
    COMBO_ACHIEVEMENTS.forEach((combo) => {
      let count = 0;
      Object.values(tagsByDate).forEach((tagSet) => {
        const matched = combo.requires.every((tag) => tagSet.has(tag));
        if (matched) count += 1;
      });
      results[combo.id] = count;
      if (count > 0) {
        Object.entries(combo.rewards).forEach(([stat, amount]) => {
          totalRewards[stat] = (totalRewards[stat] || 0) + amount * count;
        });
      }
    });
    return { countsById: results, totalRewards };
  }, [logs]);

  // "Баланс" achievements: equal-count rolling windows, and dual-activity streak blocks.
  const balanceResults = useMemo(() => {
    const results = {};
    const totalRewards = {};

    if (logs.length === 0) {
      BALANCE_ACHIEVEMENTS.forEach((b) => (results[b.id] = 0));
      return { countsById: results, totalRewards };
    }

    // Build a sorted list of all unique dates with any activity, plus a per-day count map per activity.
    const countByActivityByDate = {}; // date -> activity -> count
    const allDatesSet = new Set();
    logs.forEach((l) => {
      allDatesSet.add(l.date);
      if (!countByActivityByDate[l.date]) countByActivityByDate[l.date] = {};
      countByActivityByDate[l.date][l.activity] = (countByActivityByDate[l.date][l.activity] || 0) + 1;
    });

    const sortedDates = [...allDatesSet].sort();
    const earliest = new Date(sortedDates[0]);
    const today = new Date(dateKey(new Date()));

    function countInRange(activities, fromKey, toKey) {
      let total = 0;
      Object.entries(countByActivityByDate).forEach(([date, byAct]) => {
        if (date < fromKey || date > toKey) return;
        activities.forEach((act) => {
          total += byAct[act] || 0;
        });
      });
      return total;
    }

    BALANCE_ACHIEVEMENTS.forEach((b) => {
      let count = 0;

      if (b.kind === 'equal_count_window') {
        const cursor = new Date(earliest);
        while (cursor <= today) {
          const toKey = dateKey(cursor);
          const fromDate = new Date(cursor);
          fromDate.setDate(fromDate.getDate() - (b.windowDays - 1));
          const fromKey = dateKey(fromDate);

          const countA = countInRange(b.activitiesA, fromKey, toKey);
          const countB = countInRange(b.activitiesB, fromKey, toKey);
          if (countA === countB && countA >= b.minEach) count += 1;

          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (b.kind === 'dual_streak_block') {
        let consecutive = 0;
        const cursor = new Date(earliest);
        while (cursor <= today) {
          const key = dateKey(cursor);
          const byAct = countByActivityByDate[key] || {};
          const hasA = b.activitiesA.some((act) => byAct[act] > 0);
          const hasB = b.activitiesB.some((act) => byAct[act] > 0);
          if (hasA && hasB) {
            consecutive += 1;
            if (consecutive >= b.blockDays) {
              count += 1;
              consecutive = 0; // start a fresh block after each completed one
            }
          } else {
            consecutive = 0;
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      results[b.id] = count;
      if (count > 0) {
        Object.entries(b.rewards).forEach(([stat, amount]) => {
          totalRewards[stat] = (totalRewards[stat] || 0) + amount * count;
        });
      }
    });

    return { countsById: results, totalRewards };
  }, [logs]);

  // Mythic achievements: complex one-time conditions over the full log history.
  const mythicFlags = useMemo(() => {
    const flags = {
      kamina: false, hogyoku: false, thousandYearWar: false,
      unohana: false, gatesOfDeath: false, sageMode: false, gaiChallenge: false, santoryu: false,
    };
    if (logs.length === 0) return flags;

    const recoveryDates = new Set(recoveryLogs.map((r) => r.date));
    const countByActivityByDate = {};
    const allDatesSet = new Set();
    logs.forEach((l) => {
      allDatesSet.add(l.date);
      if (!countByActivityByDate[l.date]) countByActivityByDate[l.date] = {};
      countByActivityByDate[l.date][l.activity] = (countByActivityByDate[l.date][l.activity] || 0) + 1;
    });
    const sortedDates = [...allDatesSet].sort();
    const earliest = new Date(sortedDates[0]);
    const today = new Date(dateKey(new Date()));

    function dayHas(key, activities) {
      const byAct = countByActivityByDate[key] || {};
      return activities.some((act) => (byAct[act] || 0) > 0);
    }
    function countInRange(activities, fromKey, toKey) {
      let total = 0;
      Object.entries(countByActivityByDate).forEach(([date, byAct]) => {
        if (date < fromKey || date > toKey) return;
        activities.forEach((act) => { total += byAct[act] || 0; });
      });
      return total;
    }
    function allDaysSatisfy(fromDate, toDate, predicate) {
      const cursor = new Date(fromDate);
      while (cursor <= toDate) {
        if (!predicate(dateKey(cursor))) return false;
        cursor.setDate(cursor.getDate() + 1);
      }
      return true;
    }

    const TRAINING = ['running', 'strength_park', 'strength_gym', 'wrestling'];
    const STRENGTH = ['strength_park', 'strength_gym'];

    function dayDistinctCategoryCount(key) {
      const byAct = countByActivityByDate[key] || {};
      const categories = new Set();
      if (byAct.running > 0) categories.add('running');
      if ((byAct.strength_park || 0) + (byAct.strength_gym || 0) > 0) categories.add('strength');
      if (byAct.wrestling > 0) categories.add('wrestling');
      if (byAct.nutrition > 0) categories.add('nutrition');
      if (byAct.sleep > 0) categories.add('sleep');
      if (byAct.reading > 0) categories.add('reading');
      return categories.size;
    }

    const cursor = new Date(earliest);
    while (cursor <= today) {
      const toKey = dateKey(cursor);

      if (!flags.kamina) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 24);
        const fromKey = dateKey(fromDate);
        if (
          countInRange(['running'], fromKey, toKey) >= 15 &&
          countInRange(STRENGTH, fromKey, toKey) >= 15 &&
          countInRange(['reading'], fromKey, toKey) >= 20 &&
          countInRange(['nutrition'], fromKey, toKey) >= 25
        ) {
          flags.kamina = true;
        }
      }

      if (!flags.thousandYearWar) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 89);
        const fromKey = dateKey(fromDate);
        if (
          countInRange(TRAINING, fromKey, toKey) >= 50 &&
          countInRange(['reading'], fromKey, toKey) >= 60 &&
          countInRange(['nutrition'], fromKey, toKey) >= 50 &&
          countInRange(['sleep'], fromKey, toKey) >= 60
        ) {
          flags.thousandYearWar = true;
        }
      }

      if (!flags.sageMode) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        const fromKey = dateKey(fromDate);
        if (countInRange(['running'], fromKey, toKey) >= 20 && countInRange(STRENGTH, fromKey, toKey) >= 20) {
          flags.sageMode = true;
        }
      }

      if (!flags.santoryu) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        const fromKey = dateKey(fromDate);
        if (countInRange(STRENGTH, fromKey, toKey) >= 15 && countInRange(['wrestling'], fromKey, toKey) >= 15) {
          flags.santoryu = true;
        }
      }

      if (!flags.hogyoku) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        if (allDaysSatisfy(fromDate, cursor, (key) => dayDistinctCategoryCount(key) >= 4)) {
          flags.hogyoku = true;
        }
      }

      if (!flags.gatesOfDeath) {
        // 30 strength sessions in any 35-day window (up to 5 rest days allowed)
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 34);
        const fromKey = dateKey(fromDate);
        if (countInRange(STRENGTH, fromKey, toKey) >= 30) {
          flags.gatesOfDeath = true;
        }
      }

      if (!flags.gaiChallenge) {
        // 90 trainings (any: run/strength/wrestling) in any 100-day window (up to 10 skip days allowed)
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 99);
        const fromKey = dateKey(fromDate);
        if (countInRange(TRAINING, fromKey, toKey) >= 90) {
          flags.gaiChallenge = true;
        }
      }

      if (!flags.unohana) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 6);
        const noStrengthOrWrestling = allDaysSatisfy(fromDate, cursor, (key) => {
          const byAct = countByActivityByDate[key] || {};
          return !(byAct.strength_park > 0 || byAct.strength_gym > 0 || byAct.wrestling > 0);
        });
        const hasAllowedEachDay = allDaysSatisfy(fromDate, cursor, (key) => {
          const hasLogged = dayHas(key, ['nutrition', 'sleep', 'reading']);
          const hasRecovery = recoveryDates.has(key);
          return hasLogged || hasRecovery;
        });
        if (noStrengthOrWrestling && hasAllowedEachDay) {
          flags.unohana = true;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return flags;
  }, [logs, zeroActivityDays, recoveryLogs]);

  const hasPerfectDay = useMemo(() => {
    const byDate = {};
    logs.forEach((l) => {
      if (!byDate[l.date]) byDate[l.date] = { training: 0, nutrition: false, sleep: false, reading: false };
      const bucket = byDate[l.date];
      if (['running', 'strength_park', 'strength_gym', 'wrestling'].includes(l.activity)) bucket.training += 1;
      if (l.activity === 'nutrition') bucket.nutrition = true;
      if (l.activity === 'sleep') bucket.sleep = true;
      if (l.activity === 'reading') bucket.reading = true;
    });
    return Object.values(byDate).some((d) => d.training >= 3 && d.nutrition && d.sleep && d.reading);
  }, [logs]);

  // "Матрица: перезагрузка": longest consecutive run of Загул days (zero activity at all).
  const maxZeroActivityStreak = useMemo(() => {
    const sorted = [...zeroActivityDays].sort();
    if (sorted.length === 0) return 0;
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24);
      current = diff === 1 ? current + 1 : 1;
      longest = Math.max(longest, current);
    }
    return longest;
  }, [zeroActivityDays]);

  // "Живой марафонец": best rolling 7-day running distance total.
  const maxWeeklyRunDistance = useMemo(() => {
    const runDates = [...new Set((logsByActivity.running || []).map((l) => l.date))];
    let best = 0;
    runDates.forEach((startDate) => {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const sum = (logsByActivity.running || [])
        .filter((l) => new Date(l.date) >= start && new Date(l.date) <= end)
        .reduce((acc, l) => acc + (Number(l.distance) || 0), 0);
      best = Math.max(best, sum);
    });
    return Math.round(best * 10) / 10;
  }, [logsByActivity]);

  // "Библио-Глобус": best calendar-month count of books marked finished.
  const maxMonthlyBooksFinished = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      if (!b.finished || !b.finishedDate) return;
      const monthKey = b.finishedDate.slice(0, 7); // 'YYYY-MM'
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });
    return Math.max(0, ...Object.values(counts));
  }, [books]);

  // "Боевая машина": best calendar-month count of wrestling sessions.
  const maxMonthlyWrestlingCount = useMemo(() => {
    const counts = {};
    (logsByActivity.wrestling || []).forEach((l) => {
      const monthKey = l.date.slice(0, 7);
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });
    return Math.max(0, ...Object.values(counts));
  }, [logsByActivity]);

  // Recovery type counts — used by the hidden "Recovery" secret achievements.
  const recoveryCountsByType = useMemo(() => {
    const counts = {};
    Object.keys(RECOVERY_TYPES).forEach((k) => (counts[k] = 0));
    recoveryLogs.forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return counts;
  }, [recoveryLogs]);

  const secretContext = {
    violatingCheatMealDays,
    hasPerfectDay,
    streaksByActivity,
    maxZeroActivityStreak,
    maxWeeklyRunDistance,
    maxMonthlyBooksFinished,
    maxMonthlyWrestlingCount,
    recoveryCountsByType,
  };

  const secretAchievementsEvaluated = useMemo(
    () => SECRET_ACHIEVEMENTS.map((s) => ({ ...s, unlocked: s.check(secretContext) })),
    [violatingCheatMealDays, hasPerfectDay, streaksByActivity, maxZeroActivityStreak, maxWeeklyRunDistance, maxMonthlyBooksFinished, maxMonthlyWrestlingCount, recoveryCountsByType]
  );

  const mythicContext = { mythicFlags, streaksByActivity };
  const mythicAchievementsEvaluated = useMemo(
    () => MYTHIC_ACHIEVEMENTS.map((m) => ({ ...m, unlocked: m.check(mythicContext) })),
    [mythicFlags, streaksByActivity]
  );

  const unlockedMythicIds = useMemo(
    () => new Set(mythicAchievementsEvaluated.filter((m) => m.unlocked).map((m) => m.id)),
    [mythicAchievementsEvaluated]
  );

  const archiveUnlocked = secretAchievementsEvaluated.some((s) => s.unlocksTab === 'archive' && s.unlocked);

  // Health bars: replay all activity logs + passive logs chronologically.
  // Positive activities restore the relevant bar, passives (stress/sleep debt) damage it.
  // Overeating accumulates a poison counter; every 5th hit applies a flat XP penalty (handled in statTotals below).
  // Health system with stacking debuffs:
  // - Stress stacks on the mental bar: each new stack hits harder than the last (3%, 4%, 5%, ...).
  //   Removed by "Восстановление" entries (removes the most recent/strongest stack entry).
  // - Sleep debt ("Усталость") stacks on the physical bar the same way. Removed by sleep.
  // - Overeating accumulates a poison counter; every 5 hits applies a flat -10 XP penalty per stat.
  //   Removed by nutrition, 3 nutrition logs per poison stack removed.
  const healthState = useMemo(() => {
    const HEALTH_START = 50;
    const recoveryDates = new Set(recoveryLogs.map((r) => r.date));
    const combined = [
      ...logs.map((l) => ({ ...l, _kind: 'activity' })),
      ...passiveLogs.map((p) => ({ ...p, _kind: 'passive' })),
      ...recoveryLogs.map((r) => ({ ...r, _kind: 'recovery' })),
    ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

    let physical = HEALTH_START;
    let mental = HEALTH_START;
    let stressStack = []; // array of debuff magnitudes currently active, oldest first
    let fatigueStack = [];
    let poisonCount = 0;
    let poisonPenaltyEvents = 0;
    let nutritionTowardPoisonRelief = 0; // counts nutrition logs toward removing one poison stack (needs 3)
    let physicalXpLocked = false;
    let mentalXpLocked = false;
    const xpBlockedByDate = {}; // date -> true if XP was already blocked going INTO that day (end of previous day)
    let lastSeenDate = null;
    const kcalByDate = {}; // track daily kcal totals for fatigue debuff
    const calorieFatigueAppliedDates = new Set(); // prevent double-applying per date

    combined.forEach((entry) => {
      if (entry.date !== lastSeenDate) {
        xpBlockedByDate[entry.date] = physicalXpLocked || mentalXpLocked;
        lastSeenDate = entry.date;
      }
      if (entry._kind === 'activity') {
        const physGain = PHYSICAL_HEALTH_SOURCES[entry.activity];
        if (physGain) physical = Math.min(100, physical + physGain);
        const mentGain = MENTAL_HEALTH_SOURCES[entry.activity];
        if (mentGain) mental = Math.min(100, mental + mentGain);

        // Track daily kcal; apply 1 fatigue stack if day exceeds 1000 kcal
        if (entry.activity === 'calories' && entry.kcal) {
          kcalByDate[entry.date] = (kcalByDate[entry.date] || 0) + (Number(entry.kcal) || 0);
          if (kcalByDate[entry.date] >= 1000 && !calorieFatigueAppliedDates.has(entry.date)) {
            calorieFatigueAppliedDates.add(entry.date);
            const magnitude = 8 + fatigueStack.length * 3;
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }

        if (entry.activity === 'sleep' && fatigueStack.length > 0) {
          fatigueStack.pop(); // sleep removes the most recent fatigue debuff
        }
        if (entry.activity === 'nutrition') {
          nutritionTowardPoisonRelief += 1;
          if (nutritionTowardPoisonRelief >= 3 && poisonCount > 0) {
            nutritionTowardPoisonRelief = 0;
            poisonCount -= 1;
          }
        }
      } else if (entry._kind === 'recovery') {
        // Recovery effect depends on the type's tier (short/long/rest).
        // Base mental+physical restore, plus a proportional mental bonus equal to the sum
        // of stress stack magnitudes removed (so deep stress → bigger relief).
        const recDef = RECOVERY_TYPES[entry.type];
        const tier = RECOVERY_TIER_EFFECTS[recDef?.tier] || RECOVERY_TIER_EFFECTS.short;
        let removedMagnitude = 0;
        for (let i = 0; i < tier.stacksRemoved && stressStack.length > 0; i++) {
          removedMagnitude += stressStack.pop(); // pop the strongest (most recent) stack
        }
        mental = Math.min(100, mental + tier.baseMental + removedMagnitude);
        physical = Math.min(100, physical + tier.basePhysical);
      } else {
        const def = PASSIVE_TYPES[entry.type];
        if (!def) return;
        if (def.affects === 'mental') {
          const magnitude = 8 + stressStack.length * 3; // 1st = -8%, 2nd = -11%, 3rd = -14%, ...
          stressStack.push(magnitude);
          mental = Math.max(0, mental - magnitude);
        } else if (def.affects === 'physical') {
          const magnitude = 8 + fatigueStack.length * 3; // 1st = -8%, 2nd = -11%, 3rd = -14%, ...
          fatigueStack.push(magnitude);
          physical = Math.max(0, physical - magnitude);
        } else if (def.affects === 'poison') {
          poisonCount += 1;
          if (poisonCount >= POISON_THRESHOLD) {
            poisonCount = 0;
            poisonPenaltyEvents += 1;
          }
        }
      }

      // Hysteresis: hitting 0 locks XP gain for that bar; it stays locked until the bar recovers to 50%.
      if (physical <= 0) physicalXpLocked = true;
      else if (physical >= 50) physicalXpLocked = false;
      if (mental <= 0) mentalXpLocked = true;
      else if (mental >= 50) mentalXpLocked = false;
    });

    return {
      physical: Math.round(physical),
      mental: Math.round(mental),
      stressDebuffCount: stressStack.length,
      fatigueDebuffCount: fatigueStack.length,
      poisonCount,
      poisonPenaltyEvents,
      xpBlocked: physicalXpLocked || mentalXpLocked,
      xpBlockedByDate,
    };
  }, [logs, passiveLogs, recoveryLogs]);

  // Character stats: walk logs chronologically, applying streak multipliers
  // and one-time cumulative-tier bonuses.
  const statTotals = useMemo(() => {
    const totals = {};
    ALL_STATS.forEach((s) => (totals[s] = 0));

    const STREAK_ACTIVITIES = new Set(['running', 'sleep', 'nutrition', 'reading']);
    const STREAK_MULTIPLIERS = { bronze: 1.25, silver: 1.5, gold: 2 };
    const CUMULATIVE_BONUS_BY_TIER_INDEX = [15, 30, 50, 75, 100, 130, 160]; // grows with each tier reached

    function baseXpFor(log) {
      // --- ЧИСЛОВЫЕ АКТИВНОСТИ: нулевое значение = 0 XP ---
      if (log.activity === 'running') {
        const dist = Number(log.distance) || 0;
        if (dist <= 0) return 0;
        // 6–14 XP по дистанции: 6 за 1км, +1 за каждые 1.5км, макс 14 (12км+)
        return Math.round(Math.min(14, 6 + dist * 0.65));
      }
      if (log.activity === 'reading') {
        const pages = Number(log.pages) || 0;
        if (pages <= 0) return 0;
        if (pages < 20)  return 2;
        if (pages < 50)  return 4;
        if (pages < 100) return 7;
        if (pages < 200) return 11;
        if (pages < 300) return 16;
        return 22;
      }
      if (log.activity === 'calories') {
        const kcal = Number(log.kcal) || 0;
        if (kcal <= 0) return 0;
        // +1 XP за каждые 300 ккал, мин 1, макс 8
        const brackets = Math.floor(kcal / 300);
        return Math.min(8, Math.max(1, 1 + brackets));
      }
      // --- ТРЕНИРОВКИ: базовый XP зависит от интенсивности (лёгкая/средняя/тяжёлая) ---
      // Старые логи без поля intensity считаются как 'medium' для обратной совместимости.
      if (INTENSITY_ACTIVITIES.has(log.activity)) {
        const level = INTENSITY_LEVELS[log.intensity] || INTENSITY_LEVELS.medium;
        return level.xp;
      }
      // --- ПАССИВНЫЕ: ежедневные, меньше XP за раз ---
      if (log.activity === 'nutrition') return 3;
      if (log.activity === 'sleep') return 3;
      return 4;
    }

    function streakMultiplierFor(activity, streakLenAtThisLog) {
      if (!STREAK_ACTIVITIES.has(activity)) return 1;
      const ach = ACHIEVEMENTS.find((a) => a.kind === 'streak' && a.activity === activity);
      if (!ach) return 1;
      let tierName = null;
      ach.tiers.forEach((t) => {
        if (streakLenAtThisLog >= t.need) tierName = t.tier;
      });
      return tierName ? STREAK_MULTIPLIERS[tierName] || 1 : 1;
    }

    // Sort logs chronologically (oldest first) per activity, so we can replay streaks and cumulative counts.
    const sortedAsc = [...logs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

    // --- НЕДЕЛЬНЫЙ СТРИК СИЛОВОЙ/БОРЬБЫ ---
    // Компенсирует отсутствие ежедневных стриков у силовых активностей (силовая/борьба).
    // Условие: если в 3 предыдущих неделях (Пн-Вс) было ≥3 силовых+борьбы каждую,
    // то в текущей неделе все силовые/борьба получают +25% XP.
    const trainingsPerWeek = {}; // weekKey (Monday date) -> count of strength/wrestling logs
    logs.forEach((l) => {
      if (INTENSITY_ACTIVITIES.has(l.activity)) {
        const wk = getWeekKey(l.date);
        trainingsPerWeek[wk] = (trainingsPerWeek[wk] || 0) + 1;
      }
    });
    function isQualifyingTrainingWeek(weekKey) {
      const d = new Date(weekKey);
      for (let i = 1; i <= 3; i++) {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 7 * i);
        const prevKey = dateKey(prev);
        if ((trainingsPerWeek[prevKey] || 0) < 3) return false;
      }
      return true;
    }

    // Track running per-activity state as we replay history
    const dateHistoryByActivity = {}; // activity -> array of unique dates seen so far, ascending
    const countSoFarByActivity = {}; // activity -> cumulative count of logs so far
    const distanceSoFarByActivity = {}; // activity -> cumulative distance so far (running)
    const kcalSoFar = { calories: 0 }; // cumulative kcal burned
    const pagesSoFar = { reading: 0 }; // cumulative pages read
    const cumulativeTierReachedByAchievement = {}; // achievementId -> highest tier index already paid out

    Object.keys(ACTIVITY_TYPES).forEach((k) => {
      dateHistoryByActivity[k] = [];
      countSoFarByActivity[k] = 0;
      distanceSoFarByActivity[k] = 0;
    });

    sortedAsc.forEach((log) => {
      const def = ACTIVITY_TYPES[log.activity];
      if (!def) return;

      // Update running date history for this activity (unique dates only)
      const dates = dateHistoryByActivity[log.activity];
      if (dates[dates.length - 1] !== log.date) dates.push(log.date);

      // Streak length as of this log: consecutive days counting backward from this log's date
      const datesDesc = [...dates].reverse();
      const streakLen = isConsecutiveStreak(datesDesc);

      // Cumulative counters as of this log (this log included)
      countSoFarByActivity[log.activity] += 1;
      const cumulativeCount = countSoFarByActivity[log.activity];
      distanceSoFarByActivity[log.activity] += Number(log.distance) || 0;
      const cumulativeDistance = distanceSoFarByActivity[log.activity];
      if (log.activity === 'calories') kcalSoFar.calories += Number(log.kcal) || 0;
      if (log.activity === 'reading') pagesSoFar.reading += Number(log.pages) || 0;

      const base = baseXpFor(log);

      // Числовые активности с нулевым вводом — пропускаем XP и статы полностью
      if (base === 0) return;

      const multiplier = streakMultiplierFor(log.activity, streakLen);
      const blocked = healthState.xpBlockedByDate[log.date];

      // Determine the class (single or combo) as of *before* this log, using the level implied
      // by stats accumulated so far, then apply its bonus if this activity belongs to it.
      const xpSoFar = Object.values(totals).reduce((a, b) => a + b, 0);
      const levelSoFar = levelFromTotalXp(xpSoFar);
      const resolvedClass = resolveCharacterClass(totals, levelSoFar);
      let classBonus = 1;
      if (resolvedClass) {
        if (resolvedClass.combo) {
          const inA = resolvedClass.classA.activities.includes(log.activity);
          const inB = resolvedClass.classB.activities.includes(log.activity);
          if (inA || inB) classBonus = 1 + COMBO_CLASS_XP_BONUS;
        } else if (CLASS_BY_ACTIVITY[log.activity] === resolvedClass.id) {
          classBonus = 1 + CLASS_XP_BONUS;
        }
      }

      // Equipped shop items can grant a flat XP% bonus to a specific activity, or to all activities ('all').
      // Class-restricted items only grant their bonus when the player's locked class matches the requirement.
      // If the player is locked into a different class, the item stays equipped but its bonus is inactive
      // (they can sell it back at SHOP_REFUND_RATE via the shop UI).
      let shopBonusPct = 0;
      let activeSlotsCount = 0;
      Object.values(equippedShopItems).forEach((itemId) => {
        if (!itemId) return;
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item || !item.bonus) return;
        const isClassItem = item.requirement?.type === 'class';
        const classItemInactive = isClassItem && lockedClassId && lockedClassId !== item.requirement.id;
        if (classItemInactive) return; // equipped but bonus dormant
        activeSlotsCount += 1;
        if (item.bonus.activity === 'all' || item.bonus.activity === log.activity) {
          shopBonusPct += item.bonus.xpBonusPct;
        }
      });

      // Full gear set bonus: +15% XP to all activities when all 6 slots are filled with ACTIVE items
      if (activeSlotsCount === SHOP_SLOTS.length) shopBonusPct += 15;

      const shopBonus = 1 + shopBonusPct / 100;

      // Weekly training streak bonus: +25% XP to strength/wrestling logs in a qualifying week
      // (previous 3 weeks each had ≥3 strength/wrestling logs). Compensates for the lack of
      // daily streak multipliers on these activities.
      let weeklyTrainingBonus = 1;
      if (INTENSITY_ACTIVITIES.has(log.activity) && isQualifyingTrainingWeek(getWeekKey(log.date))) {
        weeklyTrainingBonus = 1.25;
      }

      let xpForThisLog = blocked ? 0 : base * multiplier * classBonus * shopBonus * weeklyTrainingBonus;

      // One-time bonus: did this log just cross a new cumulative tier threshold?
      ACHIEVEMENTS.forEach((ach) => {
        if (ach.kind !== 'cumulative_count' && ach.kind !== 'cumulative_value' && ach.kind !== 'cal_cumulative' && ach.kind !== 'cumulative_pages') return;
        const matchesActivity = Array.isArray(ach.activity) ? ach.activity.includes(log.activity) : ach.activity === log.activity;
        if (!matchesActivity) return;

        const measured = ach.kind === 'cumulative_value' ? cumulativeDistance
          : ach.kind === 'cal_cumulative' ? kcalSoFar.calories
          : ach.kind === 'cumulative_pages' ? pagesSoFar.reading
          : cumulativeCount;

        let crossedTierIdx = -1;
        ach.tiers.forEach((t, idx) => {
          if (measured >= t.need) crossedTierIdx = idx;
        });

        if (crossedTierIdx >= 0) {
          const alreadyPaid = cumulativeTierReachedByAchievement[ach.id] ?? -1;
          if (crossedTierIdx > alreadyPaid) {
            if (!blocked) {
              for (let t = alreadyPaid + 1; t <= crossedTierIdx; t++) {
                xpForThisLog += CUMULATIVE_BONUS_BY_TIER_INDEX[t] || 100;
              }
            }
            cumulativeTierReachedByAchievement[ach.id] = crossedTierIdx;
          }
        }
      });

      def.stats.forEach((s) => {
        totals[s] += xpForThisLog;
      });
    });

    // Round all stat totals to whole numbers
    Object.keys(totals).forEach((s) => (totals[s] = Math.round(totals[s])));

    // Apply flat penalty from accumulated overeating ("poison") events: -10 XP per stat, per event
    const penalty = healthState.poisonPenaltyEvents * POISON_PENALTY_PER_STAT;
    if (penalty > 0) {
      Object.keys(totals).forEach((s) => (totals[s] = Math.max(0, totals[s] - penalty)));
    }

    // Apply flat combo achievement rewards ("Тройной удар" triggers)
    Object.entries(comboResults.totalRewards).forEach(([stat, amount]) => {
      if (totals[stat] !== undefined) totals[stat] += amount;
    });

    // Apply "Баланс" achievement rewards
    Object.entries(balanceResults.totalRewards).forEach(([stat, amount]) => {
      if (totals[stat] !== undefined) totals[stat] += amount;
    });

    // Apply mythic achievement rewards (one-time, 'all' key applies to every stat)
    mythicAchievementsEvaluated.forEach((m) => {
      if (!m.unlocked) return;
      Object.entries(m.rewards).forEach(([stat, amount]) => {
        if (stat === 'all') {
          Object.keys(totals).forEach((s) => (totals[s] += amount));
        } else if (totals[stat] !== undefined) {
          totals[stat] += amount;
        }
      });
    });

    // Apply ПЕНТА-УДАР rewards.
    // "Легенда своего Сити" — decaying tiered reward per qualifying day (see pentaResults comment).
    // "Бог нового мира" — flat +30 to all stats, once when the 5-day perfect streak is achieved.
    if (pentaResults.legendXpPerStat > 0) {
      Object.keys(totals).forEach((s) => (totals[s] += pentaResults.legendXpPerStat));
    }
    if (pentaResults.godUnlocked) {
      Object.keys(totals).forEach((s) => (totals[s] += 30));
    }

    // Apply raid victory loot stat bonuses
    RAID_BOSSES.forEach((boss) => {
      const raid = raids[boss.id];
      if (!raid || raid.status !== 'victory') return;
      const classId = raid.startClassId;
      const loot = RAID_LOOT_BY_CLASS[boss.id]?.[classId];
      if (!loot) return;
      Object.entries(loot.stats).forEach(([stat, amount]) => {
        if (totals[stat] !== undefined) totals[stat] += amount;
      });
    });

    // Apply books_finished tier reward — only the HIGHEST reached tier is applied
    // (tiers no longer stack; each tier replaces the previous one).
    const bookAch = ACHIEVEMENTS.find(a => a.id === 'reading_books');
    if (bookAch) {
      const finishedCount = books.filter(b => b.finished).length;
      let highestReachedTier = null;
      bookAch.tiers.forEach(tier => {
        if (finishedCount >= tier.need && tier.rewards) highestReachedTier = tier;
      });
      if (highestReachedTier) {
        Object.entries(highestReachedTier.rewards).forEach(([stat, amount]) => {
          if (totals[stat] !== undefined) totals[stat] += amount;
        });
      }
    }

    // Apply unlocked secret achievement rewards (one-time flat stat bonuses; only secrets with a `rewards` field grant stats)
    secretAchievementsEvaluated.forEach((s) => {
      if (!s.unlocked || !s.rewards) return;
      Object.entries(s.rewards).forEach(([stat, amount]) => {
        if (totals[stat] !== undefined) totals[stat] += amount;
      });
    });

    return totals;
  }, [logs, healthState.poisonPenaltyEvents, healthState.xpBlockedByDate, comboResults.totalRewards, balanceResults.totalRewards, mythicAchievementsEvaluated, pentaResults.legendXpPerStat, pentaResults.godUnlocked, equippedShopItems, raids, books, lockedClassId, secretAchievementsEvaluated]);

  // Currency ("Кристаллы"): a percentage of total accumulated stat XP, plus a small passive
  // trickle from the same total. Recalculated whenever statTotals changes; spending is tracked
  // separately via the `spentCurrency` state below.
  const totalStatXp = useMemo(() => Object.values(statTotals).reduce((a, b) => a + b, 0), [statTotals]);

  // Calories don't raise stats, so crystals from them are computed separately
  const calorieCrystals = useMemo(() => {
    return Math.floor(
      (logsByActivity.calories || []).reduce((sum, l) => {
        const kcal = Number(l.kcal) || 0;
        if (kcal <= 0) return sum;
        const brackets = Math.floor(kcal / 300);
        const xp = Math.min(8, Math.max(1, 1 + brackets));
        return sum + xp;
      }, 0) * (XP_TO_CURRENCY_RATE + PASSIVE_CURRENCY_RATE)
    );
  }, [logsByActivity]);

  const currencyEarned = useMemo(() => {
    return Math.floor(totalStatXp * (XP_TO_CURRENCY_RATE + PASSIVE_CURRENCY_RATE)) + calorieCrystals;
  }, [totalStatXp, calorieCrystals]);
  const currencyBalance = Math.max(0, currencyEarned - spentCurrency);

  // Apply raid defeat penalties. The penalty scales by boss rarity — see RAID_DEFEAT_PENALTY_BY_RARITY.
  const raidPenalizedHealth = useMemo(() => {
    let physical = healthState.physical;
    let mental = healthState.mental;
    RAID_BOSSES.forEach((boss) => {
      const raid = raids[boss.id];
      if (raid?.status === 'defeat' && !raid.defeatPenaltyApplied) {
        const penalty = RAID_DEFEAT_PENALTY_BY_RARITY[boss.rarity] || 50;
        physical = Math.max(0, physical - penalty);
        mental = Math.max(0, mental - penalty);
      }
    });
    return { ...healthState, physical: Math.round(physical), mental: Math.round(mental) };
  }, [healthState, raids]);

  const levelState = useMemo(() => {
    const xp = Object.values(statTotals).reduce((a, b) => a + b, 0);
    const level = levelFromTotalXp(xp);
    const currentLevelXp = totalXpForLevel(level);
    const nextLevelXp = level < MAX_LEVEL ? totalXpForLevel(level + 1) : currentLevelXp;
    const xpIntoLevel = xp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progressPct = level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
    const titleEntry = titleEntryForLevel(level);
    return {
      level,
      totalXp: xp,
      title: titleEntry ? titleEntry.title : '',
      titleIcon: titleEntry ? titleEntry.icon : Sparkles,
      titleColor: titleEntry ? titleEntry.color : '#e0a868',
      xpIntoLevel,
      xpNeededForLevel,
      progressPct,
      isMaxLevel: level >= MAX_LEVEL,
    };
  }, [statTotals]);

  // Collect all earned titles (depends on levelState, so must come after it)
  const earnedTitles = useMemo(() => {
    const titles = [];
    LEVEL_TITLES.forEach((t) => {
      if (levelState.level >= t.from) titles.push({ id: 'lvl_' + t.from, text: t.title, source: `Уровень ${t.from}`, color: t.color });
    });
    COMBO_ACHIEVEMENTS.forEach((c) => {
      if ((comboResults.countsById[c.id] || 0) > 0)
        titles.push({ id: 'combo_' + c.id, text: c.title, source: 'Комбо-ачивка', color: '#f0d272' });
    });
    BALANCE_ACHIEVEMENTS.forEach((b) => {
      if ((balanceResults.countsById[b.id] || 0) > 0)
        titles.push({ id: 'balance_' + b.id, text: b.title, source: 'Баланс', color: '#4ce0c0' });
    });
    if (pentaResults.legendCount > 0) titles.push({ id: 'penta_legend', text: 'Легенда своего Сити', source: 'Пента-удар', color: '#f5c84a' });
    if (pentaResults.godUnlocked) titles.push({ id: 'penta_god', text: 'Бог нового мира', source: 'Пента-удар', color: '#ff6bff' });
    RAID_BOSSES.forEach((boss) => {
      if (raids[boss.id]?.status === 'victory')
        titles.push({ id: 'raid_' + boss.id, text: boss.sharedTitle, source: 'Рейд: ' + boss.name, color: RAID_RARITY_COLORS[boss.rarity].color });
    });
    achievementsEvaluated.forEach((a) => {
      const topTier = a.unlockedTierIndex >= (a.tiers?.length || 0) - 1 && a.unlockedTierIndex >= 0;
      if (topTier && a.tiers?.length > 0) {
        const topName = a.tiers[a.tiers.length - 1].name;
        titles.push({ id: 'ach_' + a.id, text: topName, source: 'Ачивка: ' + a.title, color: '#d4af37' });
      }
    });
    return titles;
  }, [levelState.level, comboResults, balanceResults, pentaResults, raids, achievementsEvaluated]);

  const [lastComboDate, setLastComboDate] = useState(null); // ISO date string when combo was last active
  const [lastComboClass, setLastComboClass] = useState(null); // last resolved combo object

  const currentClass = useMemo(() => {
    const resolved = resolveCharacterClass(statTotals, levelState.level);

    // Combo inertia: once a combo subclass is achieved, it stays for at least 7 days
    // even if the stat gap widens temporarily (travel, illness, etc.)
    const today = dateKey(new Date());

    if (resolved?.combo) {
      // Fresh combo — update tracking date (will be set via effect below)
      return resolved;
    }

    // No combo right now — check if we're still within the 7-day hold window
    if (lastComboClass && lastComboDate) {
      const daysSinceLast = Math.floor(
        (new Date(today) - new Date(lastComboDate)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLast < 7) return lastComboClass;
    }

    return resolved;
  }, [statTotals, levelState.level, lastComboDate, lastComboClass]);

  // Keep lastComboDate/lastComboClass in sync whenever a live combo is active
  const resolvedLive = useMemo(
    () => resolveCharacterClass(statTotals, levelState.level),
    [statTotals, levelState.level]
  );
  React.useEffect(() => {
    if (resolvedLive?.combo) {
      const today = dateKey(new Date());
      setLastComboDate(today);
      setLastComboClass(resolvedLive);
    }
  }, [resolvedLive?.id]);

  // Top 3 classes by stat average — shown for selection at level 10
  const top3Classes = useMemo(() => {
    return CHARACTER_CLASSES
      .map((cls) => {
        const sum = cls.stats.reduce((acc, s) => acc + (statTotals[s] || 0), 0);
        return { cls, avg: sum / cls.stats.length };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .filter(({ avg }) => avg > 0);
  }, [statTotals]);

  // effectiveClassId: null until user explicitly locks; below 10 dynamic display only
  const effectiveClassId = lockedClassId || null;

  // Skill tiers available: every 5 levels starting at 10
  const SKILL_LEVELS = [10, 15, 20, 25, 30];
  const availableSkillTiers = useMemo(() => {
    return SKILL_LEVELS.filter(l => levelState.level >= l);
  }, [levelState.level]);

  // Actions
  function lockClass(classId) {
    if (levelState.level >= 10 && !lockedClassId) {
      setLockedClassId(classId);
    }
  }

  function choosePath(pathId) {
    if (!chosenPathId && levelState.level >= 10 && lockedClassId) {
      setChosenPathId(pathId);
      setUnlockedSkillLevels([10]);
    }
  }

  function unlockSkillTier(lvl) {
    if (!unlockedSkillLevels.includes(lvl) && availableSkillTiers.includes(lvl)) {
      setUnlockedSkillLevels(prev => [...prev, lvl]);
    }
  }

  const RARITY_LEVEL_REQ = { common: 1, rare: 10, epic: 20, legendary: 1, mythic: 1 };

  const shopItemAvailability = useMemo(() => {
    const result = {};
    const isCurrentClass = (classId) => {
      if (!currentClass) return false;
      if (!currentClass.combo) return currentClass.id === classId;
      return currentClass.classA.id === classId || currentClass.classB.id === classId;
    };
    SHOP_ITEMS.forEach((item) => {
      // Level gate for common/rare/epic
      const levelReq = RARITY_LEVEL_REQ[item.rarity] || 1;
      if (levelState.level < levelReq) {
        result[item.id] = false;
        return;
      }
      if (!item.requirement) {
        result[item.id] = true;
      } else if (item.requirement.type === 'mythic') {
        result[item.id] = unlockedMythicIds.has(item.requirement.id);
      } else if (item.requirement.type === 'achievement') {
        const ach = achievementsEvaluated.find((a) => a.id === item.requirement.id);
        const neededTier = item.requirement.tierIndex ?? 0;
        result[item.id] = !!ach && ach.achievedTierIndex >= neededTier;
      } else if (item.requirement.type === 'class') {
        result[item.id] = isCurrentClass(item.requirement.id);
      } else {
        result[item.id] = false;
      }
    });
    return result;
  }, [unlockedMythicIds, achievementsEvaluated, currentClass, levelState.level]);

  // ---------- ACTIONS ----------

  function openLogModal(activityKey) {
    setSelectedActivity(activityKey);
    setFormValue('');
    setStrictSleep(false);
    setIntensity('medium');
    setShowLogModal(true);
  }

  function submitLog() {
    const def = ACTIVITY_TYPES[selectedActivity];
    const today = dateKey(new Date());

    const newLog = { id: Date.now() + Math.random(), activity: selectedActivity, date: today };
    if (def.logFields.length > 0) {
      const field = def.logFields[0];
      newLog[field.key] = Number(formValue) || 0;
    }
    if (selectedActivity === 'sleep') {
      newLog.strict = strictSleep;
    }
    if (INTENSITY_ACTIVITIES.has(selectedActivity)) {
      newLog.intensity = intensity;
    }

    setLogs([...logs, newLog]);
    setShowLogModal(false);
    setToast({ text: `${def.label} записано`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function togglePassive(type) {
    const today = dateKey(new Date());
    const existing = passiveLogs.find((p) => p.type === type && p.date === today);
    if (existing) {
      setPassiveLogs(passiveLogs.filter((p) => p.id !== existing.id));
    } else {
      setPassiveLogs([...passiveLogs, { id: Date.now(), type, date: today }]);
      const def = PASSIVE_TYPES[type];
      setToast({ text: `Отмечено: ${def.label}`, key: Date.now() });
      setTimeout(() => setToast(null), 2600);
    }
  }

  function logRecovery(type) {
    const today = dateKey(new Date());
    // Cooldown: only one log per recovery TYPE per day (walk once, sauna once, etc.)
    // Different types can still be combined on the same day.
    const alreadyToday = recoveryLogs.some((r) => r.type === type && r.date === today);
    if (alreadyToday) {
      const def = RECOVERY_TYPES[type];
      setToast({ text: `${def.label} уже отмечено сегодня`, key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    setRecoveryLogs([...recoveryLogs, { id: Date.now() + Math.random(), type, date: today }]);
    const def = RECOVERY_TYPES[type];
    setToast({ text: `Восстановление: ${def.label}`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function purchaseItem(item) {
    if (purchasedItemIds.includes(item.id)) return;
    if (!shopItemAvailability[item.id]) return;
    if (currencyBalance < item.price) return;
    setSpentCurrency(spentCurrency + item.price);
    setPurchasedItemIds([...purchasedItemIds, item.id]);
    setToast({ text: `Куплено: ${item.name}`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function sellItem(item) {
    if (!purchasedItemIds.includes(item.id)) return;
    if (item.price <= 0) return; // legendary/mythic items can't be sold (obtained by feat, not purchase)
    const refund = Math.floor(item.price * SHOP_REFUND_RATE);
    setSpentCurrency(Math.max(0, spentCurrency - refund));
    setPurchasedItemIds(purchasedItemIds.filter((id) => id !== item.id));
    // Unequip from any slot it was in
    if (equippedShopItems[item.slot] === item.id) {
      setEquippedShopItems({ ...equippedShopItems, [item.slot]: null });
    }
    setToast({ text: `Продано: ${item.name} · +${refund} крист.`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function equipShopItem(slot, itemId) {
    setEquippedShopItems({ ...equippedShopItems, [slot]: itemId });
  }

  function addBook(title) {
    if (!title.trim()) return;
    setBooks([...books, { id: Date.now(), title: title.trim(), finished: false, finishedDate: null }]);
  }

  // ---------- RAID ACTIONS ----------

  function startRaid(bossId) {
    if (raids[bossId]?.status === 'active') return;
    setRaids((prev) => ({
      ...prev,
      [bossId]: {
        status: 'active',
        startDate: dateKey(new Date()),
        startClassId: currentClass ? (currentClass.combo ? currentClass.classA.id : currentClass.id) : null,
        participants: [{ name: characterName }],
        contributions: [],
        defeatPenaltyApplied: false,
      },
    }));
    setToast({ text: `Рейд начат: ${RAID_BOSSES.find(b => b.id === bossId)?.name}`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function addRaidParticipant(bossId, name) {
    if (!name.trim()) return;
    setRaids((prev) => {
      const raid = prev[bossId];
      if (!raid || raid.status !== 'active') return prev;
      if (raid.participants.find(p => p.name === name.trim())) return prev;
      return { ...prev, [bossId]: { ...raid, participants: [...raid.participants, { name: name.trim() }] } };
    });
  }

  function addRaidContribution(bossId, participantName, value) {
    const numVal = Number(value);
    if (!numVal || numVal <= 0) return;
    setRaids((prev) => {
      const raid = prev[bossId];
      if (!raid || raid.status !== 'active') return prev;
      const boss = RAID_BOSSES.find(b => b.id === bossId);
      const newContrib = { id: Date.now(), participantName, date: dateKey(new Date()), value: numVal };
      const newContribs = [...raid.contributions, newContrib];
      // Check victory condition
      let victory = false;
      if (boss.condition.type === 'shared_total') {
        const total = newContribs.reduce((s, c) => s + c.value, 0);
        if (total >= boss.condition.target) victory = true;
      } else if (boss.condition.type === 'each_player_all_days') {
        // Check if every participant has all required activities on all days within the raid
        const start = new Date(raid.startDate);
        const allDays = Array.from({ length: boss.condition.daysRequired }, (_, i) => {
          const d = new Date(start); d.setDate(d.getDate() + i); return dateKey(d);
        });
        const byParticipant = {};
        newContribs.forEach(c => {
          if (!byParticipant[c.participantName]) byParticipant[c.participantName] = {};
          if (!byParticipant[c.participantName][c.date]) byParticipant[c.participantName][c.date] = new Set();
          byParticipant[c.participantName][c.date].add(c.participantName + '_' + c.date);
        });
        // For orochi: we check via raidActivityLogs instead (contributions hold per-activity per-day flags)
        // Simple check: each participant has entries for all 7 days (3 activities × 7 days minimum = 21 entries)
        victory = raid.participants.every(p => {
          const pContribs = newContribs.filter(c => c.participantName === p.name);
          const coveredDays = new Set(pContribs.map(c => c.date));
          return allDays.every(d => coveredDays.has(d));
        });
      }
      // Check deadline exceeded
      const start = new Date(raid.startDate);
      const deadline = new Date(start);
      deadline.setDate(deadline.getDate() + boss.durationDays);
      const now = new Date();
      const expired = now > deadline && !victory;
      return {
        ...prev,
        [bossId]: {
          ...raid,
          contributions: newContribs,
          status: victory ? 'victory' : expired ? 'defeat' : 'active',
        },
      };
    });
  }

  function resolveRaidDeadline(bossId) {
    setRaids((prev) => {
      const raid = prev[bossId];
      if (!raid || raid.status !== 'active') return prev;
      const boss = RAID_BOSSES.find(b => b.id === bossId);
      const start = new Date(raid.startDate);
      const deadline = new Date(start);
      deadline.setDate(deadline.getDate() + boss.durationDays);
      if (new Date() < deadline) return prev;
      // Check victory
      let victory = false;
      if (boss.condition.type === 'shared_total') {
        const total = raid.contributions.reduce((s, c) => s + c.value, 0);
        victory = total >= boss.condition.target;
      }
      return { ...prev, [bossId]: { ...raid, status: victory ? 'victory' : 'defeat' } };
    });
  }

  function abandonRaid(bossId) {
    setRaids((prev) => {
      const updated = { ...prev };
      delete updated[bossId];
      return updated;
    });
  }

  function toggleBookFinished(id) {
    setBooks(books.map((b) => {
      if (b.id !== id) return b;
      const finished = !b.finished;
      return { ...b, finished, finishedDate: finished ? dateKey(new Date()) : null };
    }));
  }

  function removeBook(id) {
    setBooks(books.filter((b) => b.id !== id));
  }

  // ---------- RENDER ----------

  // Show nickname picker / loading screen
  if (!selectedNickname || dbLoading) {
    return (
      <div style={{ ...styles.app, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 48, minHeight: '100vh' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          button { font-family: inherit; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ animation: 'fadeUp 0.35s ease', width: '100%', maxWidth: 380, padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f4', marginBottom: 6 }}>Гильдия Новой Эры</div>
            <div style={{ fontSize: 13, color: '#7a7a82', lineHeight: 1.5 }}>
              {dbLoading ? 'Загружаем твой профиль...' : 'Выбери своего бойца и начни прокачку'}
            </div>
          </div>

          {dbLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #3a3a42', borderTopColor: '#e0a868', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#6a6a72' }}>Подключаемся к базе данных...</div>
            </div>
          ) : (
            <>
              {dbError && (
                <div style={{ background: '#2a1a1a', border: '1px solid #6a2a2a', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#f08a8a', textAlign: 'center' }}>
                  {dbError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GUILD_NICKNAMES.map(nick => (
                  <NickButton key={nick} nick={nick} onSelect={selectNickname} color="#e0a868" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3a3a42; border-radius: 3px; }
        button { font-family: inherit; }
        .tabBarScroll::-webkit-scrollbar { display: none; }
        .hallOfFameScroll::-webkit-scrollbar { display: none; }
      `}</style>

      <Header
        levelState={levelState}
        unlockedCount={unlockedCount}
        totalAchievements={ACHIEVEMENTS.length}
        name={characterName}
        onNameChange={setCharacterName}
        healthState={raidPenalizedHealth}
        currentClass={currentClass}
        currencyBalance={currencyBalance}
        activeTitle={activeTitle}
        earnedTitles={earnedTitles}
        lockedClassId={lockedClassId}
        chosenPathId={chosenPathId}
      />

      <Tabs tab={tab} setTab={setTab} archiveUnlocked={archiveUnlocked} />

      <div style={styles.content}>
        {tab === 'dashboard' && (
          <Dashboard
            statTotals={statTotals}
            onLogActivity={openLogModal}
            streaksByActivity={streaksByActivity}
            achievementsEvaluated={achievementsEvaluated}
            expandedActivity={expandedActivity}
            setExpandedActivity={setExpandedActivity}
            passiveLogs={passiveLogs}
            onTogglePassive={togglePassive}
            books={books}
            onAddBook={addBook}
            onToggleBookFinished={toggleBookFinished}
            onRemoveBook={removeBook}
            onLogRecovery={logRecovery}
            recoveryLogs={recoveryLogs}
          />
        )}
        {tab === 'raids' && (
          <RaidsView
            raids={raids}
            currentClass={currentClass}
            characterName={characterName}
            onStartRaid={startRaid}
            onAddParticipant={addRaidParticipant}
            onAddContribution={addRaidContribution}
            onResolve={resolveRaidDeadline}
            onAbandon={abandonRaid}
          />
        )}
        {tab === 'guild' && (
          <GuildView
            playerName={selectedNickname || characterName}
            playerLevel={levelState.level}
            playerClass={currentClass}
            playerPhysical={raidPenalizedHealth.physical}
            playerMental={raidPenalizedHealth.mental}
            playerTitleEntry={levelState}
            activeTitle={activeTitle}
            earnedTitles={earnedTitles}
            raids={raids}
            guildLikes={guildLikes}
            onLike={(name) => {
              const updated = { ...guildLikes, [name]: (guildLikes[name] || 0) + 1 };
              setGuildLikes(updated);
            }}
            lockedClassId={effectiveClassId}
            chosenPathId={chosenPathId}
            guildMembers={guildMembers}
            onRefreshGuild={refreshGuild}
            onLogout={logout}
          />
        )}
        {tab === 'character' && (
          <CharacterView
            statTotals={statTotals}
            currentClass={currentClass}
            equippedShopItems={equippedShopItems}
            purchasedItemIds={purchasedItemIds}
            onEquip={equipShopItem}
            earnedTitles={earnedTitles}
            activeTitle={activeTitle}
            setActiveTitle={setActiveTitle}
            levelState={levelState}
            lockedClassId={effectiveClassId}
            chosenPathId={chosenPathId}
          />
        )}
        {tab === 'shop' && (
          <ShopView
            currencyBalance={currencyBalance}
            purchasedItemIds={purchasedItemIds}
            shopItemAvailability={shopItemAvailability}
            equippedShopItems={equippedShopItems}
            onPurchase={purchaseItem}
            onEquip={equipShopItem}
            onSell={sellItem}
            level={levelState.level}
            lockedClassId={lockedClassId}
          />
        )}
        {tab === 'classes' && (
          <ClassTreeView
            currentClass={currentClass}
            level={levelState.level}
            lockedClassId={effectiveClassId}
            top3Classes={top3Classes}
            chosenPathId={chosenPathId}
            unlockedSkillLevels={unlockedSkillLevels}
            availableSkillTiers={availableSkillTiers}
            onLockClass={lockClass}
            onChoosePath={choosePath}
            onUnlockSkillTier={unlockSkillTier}
          />
        )}
        {tab === 'achievements' && <AchievementsView achievements={achievementsEvaluated} />}
        {tab === 'legendary' && (
          <LegendaryView
            pentaResults={pentaResults}
            comboCounts={comboResults.countsById}
            balanceCounts={balanceResults.countsById}
            secretAchievements={secretAchievementsEvaluated}
          />
        )}
        {tab === 'mythic' && <MythicView mythicAchievements={mythicAchievementsEvaluated} />}
        {tab === 'history' && <HistoryView logs={logs} />}
        {tab === 'archive' && <ArchiveView />}
      </div>

      {showLogModal && (
        <LogModal
          activityKey={selectedActivity}
          value={formValue}
          setValue={setFormValue}
          strictSleep={strictSleep}
          setStrictSleep={setStrictSleep}
          intensity={intensity}
          setIntensity={setIntensity}
          onSubmit={submitLog}
          onClose={() => setShowLogModal(false)}
        />
      )}

      {toast && <Toast text={toast.text} key={toast.key} />}
    </div>
  );
}

// ---------- SUBCOMPONENTS ----------

function Header({ levelState, unlockedCount, totalAchievements, name, onNameChange, healthState, currentClass, currencyBalance, activeTitle, earnedTitles, lockedClassId, chosenPathId }) {
  const TitleIcon = levelState.titleIcon;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  function startEditing() {
    setNameDraft(name);
    setEditingName(true);
  }

  function commitName() {
    const trimmed = nameDraft.trim();
    if (trimmed) onNameChange(trimmed.slice(0, 24));
    setEditingName(false);
  }

  const displayTitle = activeTitle ? activeTitle.text : levelState.title;
  const displayTitleColor = activeTitle ? activeTitle.color : levelState.titleColor;

  // Resolve display info for header class line
  const isCombo = currentClass?.combo;
  const baseClass = isCombo ? currentClass.classA : currentClass;
  const comboClass = isCombo ? currentClass : null;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  return (
    <div style={styles.header}>
      <div style={styles.headerRow}>
        <div style={{ ...styles.avatarCircle, borderColor: displayTitleColor + '66', background: displayTitleColor + '1f' }}>
          <TitleIcon size={22} color={displayTitleColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              maxLength={24}
              style={styles.charNameInput}
            />
          ) : (
            <button onClick={startEditing} style={styles.charNameBtn} aria-label="Изменить имя">
              <span style={styles.charName}>{name}</span>
              <Pencil size={12} color="#5a5a62" />
            </button>
          )}
          <div style={styles.charLevel}>
            Уровень {levelState.level}{displayTitle ? ` · ${displayTitle}` : ''}
            {activeTitle && <span style={{ fontSize: 9, color: displayTitleColor, marginLeft: 5, background: displayTitleColor + '22', borderRadius: 4, padding: '1px 5px' }}>★ свой титул</span>}
          </div>

          {/* Class · Subclass · Path strip under nickname */}
          {currentClass && (
            <div style={styles.headerClassStrip}>
              {/* Base class always shown */}
              <span style={{ ...styles.headerClassChip, color: baseClass.color, borderColor: baseClass.color + '55', background: baseClass.color + '18' }}>
                <baseClass.icon size={10} color={baseClass.color} />
                {baseClass.name}
              </span>
              {/* Combo subclass: shown when resolved (lvl 20+) */}
              {comboClass && (
                <>
                  <span style={styles.headerClassSep}>·</span>
                  <span style={{ ...styles.headerClassChip, color: currentClass.secondaryColor, borderColor: currentClass.secondaryColor + '55', background: currentClass.secondaryColor + '18' }}>
                    <currentClass.secondaryIcon size={10} color={currentClass.secondaryColor} />
                    {comboClass.name}
                  </span>
                </>
              )}
              {/* Chosen path */}
              {chosenPath && (
                <>
                  <span style={styles.headerClassSep}>·</span>
                  <span style={{ ...styles.headerClassChip, color: chosenPath.color, borderColor: chosenPath.color + '55', background: chosenPath.color + '18' }}>
                    {chosenPath.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div style={styles.achBadge}>
          <Trophy size={14} color="#f0d272" />
          <span style={{ marginLeft: 6 }}>{unlockedCount}/{totalAchievements}</span>
        </div>
      </div>

      <div style={styles.levelBarWrap}>
        <div style={styles.levelBarTrack}>
          <div style={{ ...styles.levelBarFill, width: `${levelState.progressPct}%` }} />
        </div>
        <div style={styles.levelBarLabelRow}>
          <div style={styles.levelBarLabel}>
            {levelState.isMaxLevel
              ? `Максимальный уровень · ${levelState.totalXp} XP всего`
              : `${levelState.xpIntoLevel}/${levelState.xpNeededForLevel} XP до уровня ${levelState.level + 1} (${levelState.progressPct}%)`}
          </div>
          <div style={styles.currencyBadge}>
            <Gem size={11} color="#5b9bf0" />
            <span style={{ marginLeft: 4 }}>{currencyBalance}</span>
          </div>
        </div>
      </div>

      <div style={styles.healthBarsWrap}>
        <div>
          <HealthBar icon={Heart} label="Физическое" value={healthState.physical} color="#e8633c" />
          {healthState.fatigueDebuffCount > 0 && (
            <DebuffBadge icon={Zap} label="Усталость" count={healthState.fatigueDebuffCount} />
          )}
        </div>
        <div>
          <HealthBar icon={Brain} label="Ментальное" value={healthState.mental} color="#4f7cff" />
          {healthState.stressDebuffCount > 0 && (
            <DebuffBadge icon={Zap} label="Стресс" count={healthState.stressDebuffCount} />
          )}
          {healthState.poisonCount > 0 && <PoisonVials count={healthState.poisonCount} max={POISON_THRESHOLD} />}
        </div>
      </div>

      {healthState.xpBlocked && (
        <div style={styles.xpBlockedBanner}>
          Рост опыта остановлен — восстанови здоровье до 50%, чтобы продолжить прокачку
        </div>
      )}
    </div>
  );
}

function PoisonVials({ count, max }) {
  return (
    <div style={styles.poisonVialsRow}>
      {Array.from({ length: max }).map((_, idx) => {
        const filled = idx < count;
        return (
          <FlaskConical
            key={idx}
            size={14}
            color={filled ? '#c9a8f5' : '#3a3a44'}
            fill={filled ? '#c9a8f555' : 'none'}
            strokeWidth={filled ? 2.2 : 1.8}
            style={{ animation: filled ? 'popIn 0.3s ease' : 'none' }}
          />
        );
      })}
      <span style={styles.poisonVialsLabel}>Отравление {count}/{max}</span>
    </div>
  );
}

function DebuffBadge({ icon: Icon, label, count }) {
  return (
    <div style={styles.debuffBadge}>
      <Icon size={11} color="#ff5c7a" />
      <span style={styles.debuffBadgeText}>{label} ×{count}</span>
    </div>
  );
}

function HealthBar({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.healthBarItem}>
      <div style={styles.healthBarLabelRow}>
        <Icon size={11} color={color} />
        <span style={styles.healthBarLabel}>{label}</span>
        <span style={styles.healthBarValue}>{value}%</span>
      </div>
      <div style={styles.statBarTrack}>
        <div style={{ ...styles.statBarFill, width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function Tabs({ tab, setTab, archiveUnlocked }) {
  const items = [
    { key: 'dashboard', label: 'Прогресс' },
    { key: 'raids', label: '⚔️ Рейды' },
    { key: 'guild', label: '🛡️ Гильдия' },
    { key: 'character', label: 'Персонаж' },
    { key: 'shop', label: 'Магазин' },
    { key: 'classes', label: 'Пути' },
    { key: 'achievements', label: 'Ачивки' },
    { key: 'legendary', label: 'Легендарное' },
    { key: 'mythic', label: 'Мифические' },
    { key: 'history', label: 'История' },
  ];
  if (archiveUnlocked) items.push({ key: 'archive', label: 'Архив премудростей' });
  return (
    <div className="tabBarScroll" style={styles.tabBar}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          style={{
            ...styles.tabBtn,
            color: tab === it.key ? '#f0d272' : '#8a8a92',
            borderBottom: tab === it.key ? '2px solid #f0d272' : '2px solid transparent',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Dashboard({ statTotals, onLogActivity, streaksByActivity, achievementsEvaluated, expandedActivity, setExpandedActivity, passiveLogs, onTogglePassive, books, onAddBook, onToggleBookFinished, onRemoveBook, onLogRecovery, recoveryLogs }) {
  function achievementsForActivity(key) {
    return achievementsEvaluated.filter((a) => (Array.isArray(a.activity) ? a.activity.includes(key) : a.activity === key));
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <SectionLabel text="Записать активность" />
      <div style={styles.activityGrid}>
        {Object.entries(ACTIVITY_TYPES).map(([key, def]) => {
          const Icon = def.icon;
          const streak = streaksByActivity[key];
          const isOpen = expandedActivity === key;
          const acts = achievementsForActivity(key);
          const numericAch = acts.find((a) => a.kind === 'cumulative_value' || a.kind === 'cumulative_count' || a.kind === 'cal_cumulative' || a.kind === 'cal_single_day');
          const streakAch = acts.find((a) => a.kind === 'streak' || a.kind === 'cal_streak_threshold');

          return (
            <div key={key} style={{ ...styles.activityCard, gridColumn: isOpen ? '1 / -1' : 'auto' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedActivity(isOpen ? null : key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedActivity(isOpen ? null : key);
                  }
                }}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <Icon size={64} color={def.color} style={styles.activityIconBg} strokeWidth={1.5} />
                <div style={styles.activityCardLabel}>{def.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                  {streak > 0 && (
                    <div style={styles.streakPill}>
                      <Flame size={11} color="#e0a868" /> {streak}
                    </div>
                  )}
                  <ChevronDown
                    size={13}
                    color="#5a5a62"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: 'auto' }}
                  />
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogActivity(key); }}
                style={styles.cardPlusBtn}
                aria-label={`Записать: ${def.label}`}
              >
                <Plus size={14} color="#5a5a62" />
              </button>

              {isOpen && (
                <div style={styles.cardExpand}>
                  {numericAch ? (
                    <MiniProgress
                      label={numericAch.nextTier ? `До «${numericAch.nextTier.name}»` : 'Все тиры открыты'}
                      current={numericAch.currentValue}
                      target={numericAch.nextTier ? numericAch.nextTier.need : numericAch.currentValue}
                      unit={numericAch.unit}
                      color={def.color}
                    />
                  ) : (
                    <div style={styles.cardExpandEmpty}>Нет числовой ачивки</div>
                  )}
                  {streakAch ? (
                    <MiniProgress
                      label={streakAch.nextTier ? `До «${streakAch.nextTier.name}»` : 'Все тиры открыты'}
                      current={streakAch.currentValue}
                      target={streakAch.nextTier ? streakAch.nextTier.need : streakAch.currentValue}
                      unit="дней подряд"
                      color="#e0a868"
                    />
                  ) : (
                    <div style={styles.cardExpandEmpty}>Нет ачивки на стрик</div>
                  )}
                  {key === 'reading' && (
                    <BookTracker books={books} onAddBook={onAddBook} onToggleFinished={onToggleBookFinished} onRemoveBook={onRemoveBook} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SectionLabel text="Дебаффы" style={{ marginTop: 24 }} />
      <PassiveTracker passiveLogs={passiveLogs} onTogglePassive={onTogglePassive} />

      <RecoverySection onLogRecovery={onLogRecovery} recoveryLogs={recoveryLogs} />
    </div>
  );
}

function MiniProgress({ label, current, target, unit, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 100;
  return (
    <div style={styles.miniProgressBlock}>
      <div style={styles.miniProgressLabelRow}>
        <span style={styles.miniProgressLabel}>{label}</span>
        <span style={styles.miniProgressValue}>{current}/{target} {unit}</span>
      </div>
      <div style={styles.statBarTrack}>
        <div style={{ ...styles.statBarFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// 6 radar vertices, one per activity group, each averaging its pair of stats.
// Strength (park) and strength (gym) share identical stats, so they collapse into one "Силовая" vertex.
const RADAR_GROUPS = [
  { label: 'Бег', statLabel: 'Стойкость', stats: ['Выносливость', 'Воля'], color: ACTIVITY_TYPES.running.color },
  { label: 'Силовая', statLabel: 'Мощь', stats: ['Сила', 'Упорство'], color: ACTIVITY_TYPES.strength_gym.color },
  { label: 'Борьба', statLabel: 'Рефлексы', stats: ['Силовая выносливость', 'Гибкость'], color: ACTIVITY_TYPES.wrestling.color },
  { label: 'Питание', statLabel: 'Самоконтроль', stats: ['Фокус', 'Дисциплина'], color: ACTIVITY_TYPES.nutrition.color },
  { label: 'Сон', statLabel: 'Жизненная сила', stats: ['Дух', 'ХП'], color: ACTIVITY_TYPES.sleep.color },
  { label: 'Чтение', statLabel: 'Разум', stats: ['Интеллект', 'Мышление'], color: ACTIVITY_TYPES.reading.color },
];

const RADAR_MAX = 100;

function StatRadar({ statTotals }) {
  const size = 420;
  const center = size / 2;
  const radius = 150;
  const n = RADAR_GROUPS.length;

  function groupValue(group) {
    const sum = group.stats.reduce((acc, s) => acc + (statTotals[s] || 0), 0);
    return sum / group.stats.length;
  }

  function pointFor(idx, value) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const ratio = Math.min(value, RADAR_MAX) / RADAR_MAX;
    const r = Math.sqrt(ratio) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  function axisEndFor(idx) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
  }

  function labelPointFor(idx) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = radius + 32;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  const dataPoints = RADAR_GROUPS.map((group, idx) => pointFor(idx, groupValue(group)));
  const dataPath = dataPoints.map((p) => p.join(',')).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div style={styles.radarWrap}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Радар характеристик персонажа">
        {/* grid rings, labeled with the actual stat % they represent under the sqrt scale */}
        {gridLevels.map((lvl) => {
          const pts = RADAR_GROUPS.map((_, idx) => {
            const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
            const r = radius * lvl;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          const realPct = Math.round(lvl * lvl * 100);
          return (
            <g key={lvl}>
              <polygon points={pts} fill="none" stroke="#2a2a32" strokeWidth="1" />
              <text x={center + 4} y={center - radius * lvl - 2} fill="#4a4a52" fontSize="8" textAnchor="start">
                {realPct}%
              </text>
            </g>
          );
        })}

        {/* axes, colored by owning activity */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = axisEndFor(idx);
          return <line key={group.label} x1={center} y1={center} x2={x} y2={y} stroke={group.color} strokeOpacity="0.35" strokeWidth="1" />;
        })}

        {/* data shape */}
        <polygon points={dataPath} fill="#7a6ae0" fillOpacity="0.22" stroke="#7a6ae0" strokeWidth="1.5" />

        {/* data points, colored by activity */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = dataPoints[idx];
          return <circle key={group.label} cx={x} cy={y} r="2.6" fill={group.color} />;
        })}

        {/* labels */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = labelPointFor(idx);
          return (
            <text
              key={group.label}
              x={x}
              y={y}
              fill={group.color}
              fontSize="13"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {group.statLabel}
            </text>
          );
        })}
      </svg>

      <div style={styles.radarLegend}>
        {Object.values(ACTIVITY_TYPES).map((def) => (
          <div key={def.label} style={styles.radarLegendItem}>
            <span style={{ ...styles.radarLegendDot, background: def.color }} />
            {def.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookTracker({ books, onAddBook, onToggleFinished, onRemoveBook }) {
  const [draft, setDraft] = useState('');

  function submit() {
    if (!draft.trim()) return;
    onAddBook(draft);
    setDraft('');
  }

  return (
    <div style={styles.bookTrackerWrap}>
      <div style={styles.bookTrackerLabel}>Гол-скор по книгам</div>
      <div style={styles.bookInputRow}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Название книги"
          style={styles.bookInput}
        />
        <button onClick={submit} style={styles.bookAddBtn} aria-label="Добавить книгу">
          <Plus size={14} color="#1c1505" />
        </button>
      </div>
      {books.length === 0 ? (
        <div style={styles.cardExpandEmpty}>Пока нет книг в списке</div>
      ) : (
        <div style={styles.bookList}>
          {books.map((b) => (
            <div key={b.id} style={styles.bookRow}>
              <button
                onClick={() => onToggleFinished(b.id)}
                style={{
                  ...styles.bookCheck,
                  background: b.finished ? '#4caf6d22' : 'transparent',
                  borderColor: b.finished ? '#4caf6d' : '#3a3a42',
                }}
                aria-label={b.finished ? 'Отметить непрочитанной' : 'Отметить прочитанной'}
              >
                {b.finished && <Check size={12} color="#4caf6d" />}
              </button>
              <span style={{ ...styles.bookTitle, textDecoration: b.finished ? 'line-through' : 'none', opacity: b.finished ? 0.6 : 1 }}>
                {b.title}
              </span>
              <button onClick={() => onRemoveBook(b.id)} style={styles.bookRemoveBtn} aria-label="Удалить книгу">
                <X size={12} color="#5a5a62" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecoverySection({ onLogRecovery, recoveryLogs }) {
  const today = dateKey(new Date());
  const todayTypes = new Set(recoveryLogs.filter((r) => r.date === today).map((r) => r.type));

  const shortTypes = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'short');
  const longTypes  = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'long');
  const restTypes  = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'rest');

  const TIER_COLOR = { short: '#4ce0c0', long: '#f0c14b', rest: '#8a8a92' };

  function renderCard([key, def]) {
    const Icon = def.icon;
    const doneToday = todayTypes.has(key);
    const color = TIER_COLOR[def.tier];
    return (
      <button
        key={key}
        onClick={() => onLogRecovery(key)}
        disabled={doneToday}
        style={{
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: doneToday ? '#0d1e1b' : '#0f2622cc',
          border: `1px solid ${doneToday ? '#1a3830' : color + '44'}`,
          borderRadius: 10, padding: '10px 10px 8px',
          cursor: doneToday ? 'not-allowed' : 'pointer',
          minHeight: 72, textAlign: 'left',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        {/* Big ghost icon as background */}
        <Icon
          size={48}
          color={doneToday ? '#2a3f3a' : color}
          style={{
            position: 'absolute', right: -6, top: '50%',
            transform: 'translateY(-50%)',
            opacity: doneToday ? 0.12 : 0.18,
            pointerEvents: 'none',
          }}
        />
        {/* Content */}
        <span style={{ fontSize: 11.5, fontWeight: 700, color: doneToday ? '#3a5a54' : '#d6f5ec', lineHeight: 1.25, position: 'relative', zIndex: 1 }}>
          {def.label}
        </span>
        {doneToday && (
          <span style={{ fontSize: 9.5, color: '#2a7a6a', fontWeight: 700, marginTop: 2, position: 'relative', zIndex: 1 }}>
            ✓ сегодня
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={styles.recoveryWrap}>
      <div style={styles.recoverySectionHeader}>
        <Sparkles size={15} color="#4ce0c0" />
        <span style={styles.recoverySectionTitle}>Восстановление</span>
        <span style={styles.recoverySectionSub}>1 тип — 1 раз в день</span>
      </div>

      {/* Short recovery */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#4ce0c0aa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          Короткие
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {shortTypes.map(renderCard)}
          {restTypes.map(renderCard)}
        </div>
      </div>

      {/* Long recovery */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#f0c14baa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          Длительные
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {longTypes.map(renderCard)}
        </div>
      </div>
    </div>
  );
}

function PassiveTracker({ passiveLogs, onTogglePassive }) {
  const today = dateKey(new Date());
  const todaySet = new Set(passiveLogs.filter((p) => p.date === today).map((p) => p.type));

  return (
    <div style={styles.passiveGrid}>
      {Object.entries(PASSIVE_TYPES).map(([key, def]) => {
        const Icon = def.icon;
        const active = todaySet.has(key);
        return (
          <button
            key={key}
            onClick={() => onTogglePassive(key)}
            style={{
              ...styles.passiveCard,
              borderColor: active ? '#6a4f9c' : '#28282f',
              background: active ? '#241c30' : '#1c1c22',
            }}
          >
            <Icon size={16} color={active ? '#c9a8f5' : '#6a6a72'} />
            <span style={{ ...styles.passiveLabel, color: active ? '#dcc8f5' : '#9a9aa2' }}>{def.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatBars({ statTotals }) {
  const max = RADAR_MAX;
  return (
    <div style={styles.statGrid}>
      {ALL_STATS.map((stat) => {
        const val = Math.round(statTotals[stat]);
        const pct = Math.min(100, (val / max) * 100);
        return (
          <div key={stat} style={styles.statRow}>
            <div style={styles.statLabelRow}>
              <span style={styles.statLabel}>{stat}</span>
              <span style={styles.statValue}>{val}</span>
            </div>
            <div style={styles.statBarTrack}>
              <div style={{ ...styles.statBarFill, width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HallOfFame({ unlockedTiers }) {
  if (unlockedTiers.length === 0) return null;
  return (
    <div style={styles.hallOfFameWrap}>
      <div style={styles.hallOfFameHeader}>
        <Medal size={14} color="#d4af37" />
        <span style={styles.hallOfFameTitle}>Доска почёта</span>
        <span style={styles.hallOfFameCount}>{unlockedTiers.length}</span>
      </div>
      <div className="hallOfFameScroll" style={styles.hallOfFameScroll}>
        {unlockedTiers.map((item, idx) => {
          const colors = TIER_COLORS[item.tier.tier] || TIER_COLORS.special;
          return (
            <div key={`${item.achId}-${idx}`} style={{ ...styles.hallOfFameMedal, borderColor: colors.border, background: colors.bg }}>
              <Trophy size={16} color={colors.text} />
              <span style={{ ...styles.hallOfFameMedalName, color: colors.text }}>{item.tier.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressRow({ achievement }) {
  const def = Array.isArray(achievement.activity) ? null : ACTIVITY_TYPES[achievement.activity];
  const pct = Math.min(100, (achievement.currentValue / achievement.nextTier.need) * 100);
  return (
    <div style={styles.progressRow}>
      <div style={{ flex: 1 }}>
        <div style={styles.progressTitle}>{achievement.title}</div>
        <div style={styles.progressSub}>
          {achievement.nextTier.name} · {achievement.currentValue}/{achievement.nextTier.need} {achievement.unit}
        </div>
        <div style={styles.statBarTrack}>
          <div style={{ ...styles.statBarFill, width: `${pct}%`, background: '#e8633c' }} />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text, style }) {
  return <div style={{ ...styles.sectionLabel, ...style }}>{text}</div>;
}

const ACHIEVEMENT_GROUPS = [
  { label: 'Бег', icon: Flame, color: ACTIVITY_TYPES.running.color, ids: ['run_distance', 'run_streak', 'run_total_km'] },
  { label: 'Силовая в парке', icon: Dumbbell, color: ACTIVITY_TYPES.strength_park.color, ids: ['strength_park_style', 'strength_park_total'] },
  { label: 'Силовая в зале', icon: Dumbbell, color: ACTIVITY_TYPES.strength_gym.color, ids: ['strength_gym_style', 'strength_gym_total'] },
  { label: 'Борьба', icon: Swords, color: ACTIVITY_TYPES.wrestling.color, ids: ['wrestling_style', 'wrestling_total'] },
  { label: 'Силовые тренировки (все виды)', icon: Dumbbell, color: '#c9a227', ids: ['strength_weekly'] },
  { label: 'Питание', icon: Salad, color: ACTIVITY_TYPES.nutrition.color, ids: ['nutrition_streak', 'nutrition_total'] },
  { label: 'Сон', icon: Moon, color: ACTIVITY_TYPES.sleep.color, ids: ['sleep_streak', 'sleep_total'] },
  { label: 'Чтение', icon: BookOpen, color: ACTIVITY_TYPES.reading.color, ids: ['reading_streak', 'reading_total', 'reading_pages', 'reading_books'] },
  { label: 'Пепел калорий', icon: Gauge, color: ACTIVITY_TYPES.calories.color, ids: ['cal_best_day', 'cal_streak_300', 'cal_streak_500', 'cal_total'] },
];

function LegendaryView({ pentaResults, comboCounts, balanceCounts, secretAchievements }) {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PentaAchievementsSection pentaResults={pentaResults} />
      <ComboAchievementsSection comboCounts={comboCounts} />
      <BalanceAchievementsSection balanceCounts={balanceCounts} />
      <SecretAchievementsSection secretAchievements={secretAchievements} />
    </div>
  );
}

function PentaAchievementsSection({ pentaResults }) {
  const legendUnlocked = pentaResults.legendCount > 0;
  const godUnlocked = pentaResults.godUnlocked;

  const TIER_META = {
    gold:     { label: 'Золото',   color: '#f5c84a' },
    silver:   { label: 'Серебро',  color: '#d4dae3' },
    bronze:   { label: 'Бронза',   color: '#e0a868' },
    symbolic: { label: 'Привычка', color: '#8a8a92' },
  };
  const currentTier = TIER_META[pentaResults.currentTierKey];
  const breakdown = pentaResults.legendTierBreakdown;

  return (
    <div style={styles.achSection}>
      <div style={styles.achSectionHeader}>
        <Trophy size={15} color="#f5c84a" />
        <span style={{ ...styles.achSectionTitle, color: '#f5c84a' }}>ПЕНТА-УДАР · Легендарные</span>
      </div>
      <div style={styles.comboList}>
        <div
          style={{
            ...styles.pentaCard,
            borderColor: legendUnlocked ? '#f5c84a' : '#28282f',
            background: legendUnlocked ? '#332710' : '#1c1c22',
          }}
        >
          <div style={styles.comboCardTop}>
            <span style={{ ...styles.comboTitle, color: legendUnlocked ? '#f5c84a' : '#9a9aa2' }}>
              Пента-удар: Легенда своего Сити
            </span>
            {legendUnlocked && (
              <span style={{ ...styles.comboCount, color: '#f5c84a' }}>
                <Trophy size={11} color="#f5c84a" /> ×{pentaResults.legendCount}
              </span>
            )}
          </div>
          <div style={styles.comboReward}>
            5 из 6 активностей за день · Награда затухает по тирам
          </div>

          {legendUnlocked && currentTier && (
            <div style={{
              marginTop: 8, padding: '8px 10px', borderRadius: 8,
              background: currentTier.color + '18', border: `1px solid ${currentTier.color}44`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: currentTier.color }}>
                  Текущий тир: {currentTier.label}
                </span>
                <span style={{ fontSize: 11, color: currentTier.color, fontWeight: 700 }}>
                  +{pentaResults.currentTierXp} ко всем стат за день
                </span>
              </div>
              {pentaResults.nextTierAtDay ? (
                <div style={{ fontSize: 10.5, color: '#7a7a82' }}>
                  Следующий тир начнётся с {pentaResults.nextTierAtDay}-го идеального дня
                </div>
              ) : (
                <div style={{ fontSize: 10.5, color: '#7a7a82' }}>
                  Дисциплина закреплена — награда стабилизирована
                </div>
              )}
              <div style={{ fontSize: 10, color: '#6a6a72', marginTop: 6, lineHeight: 1.5 }}>
                Дни 1–5: +15 · дни 6–10: +8 · дни 11–20: +4 · дни 21+: +2
              </div>
              {(breakdown.silver.count + breakdown.bronze.count + breakdown.symbolic.count) > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {breakdown.gold.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#f5c84a22', color: '#f5c84a' }}>
                      золото ×{breakdown.gold.count}
                    </span>
                  )}
                  {breakdown.silver.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#d4dae322', color: '#d4dae3' }}>
                      серебро ×{breakdown.silver.count}
                    </span>
                  )}
                  {breakdown.bronze.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#e0a86822', color: '#e0a868' }}>
                      бронза ×{breakdown.bronze.count}
                    </span>
                  )}
                  {breakdown.symbolic.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#8a8a9222', color: '#8a8a92' }}>
                      привычка ×{breakdown.symbolic.count}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.pentaCard,
            borderColor: godUnlocked ? '#f5c84a' : '#28282f',
            background: godUnlocked ? '#332710' : '#1c1c22',
          }}
        >
          <div style={styles.comboCardTop}>
            <span style={{ ...styles.comboTitle, color: godUnlocked ? '#f5c84a' : '#9a9aa2' }}>
              {godUnlocked ? 'Пента-удар: Бог нового мира (как ты это сделал?)' : '???'}
            </span>
            {godUnlocked && <Trophy size={14} color="#f5c84a" />}
          </div>
          <div style={styles.comboReward}>
            {godUnlocked
              ? '5 идеальных дней подряд · Награда: +30 ко всем характеристикам'
              : `Лучшая серия идеальных дней подряд: ${pentaResults.longestStreak}/5`}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComboAchievementsSection({ comboCounts }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div style={styles.achSection}>
      <div style={styles.achSectionHeader}>
        <Flame size={15} color="#e0a868" />
        <span style={{ ...styles.achSectionTitle, color: '#e0a868' }}>Тройной удар</span>
      </div>
      <div style={styles.comboList}>
        {COMBO_ACHIEVEMENTS.map((combo) => {
          const count = comboCounts[combo.id] || 0;
          const triggered = count > 0;
          const isOpen = openId === combo.id;
          return (
            <button
              key={combo.id}
              onClick={() => setOpenId(isOpen ? null : combo.id)}
              style={{
                ...styles.comboCard,
                borderColor: triggered ? '#e0a868' : '#28282f',
                background: triggered ? '#241c10' : '#1c1c22',
                textAlign: 'left', width: '100%', cursor: 'pointer',
              }}
            >
              <div style={styles.comboCardTop}>
                <span style={{ ...styles.comboTitle, color: triggered ? '#f0d272' : '#9a9aa2' }}>{combo.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {triggered && (
                    <span style={styles.comboCount}>
                      <Flame size={11} color="#e0a868" /> ×{count}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    color="#5a5a62"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  />
                </div>
              </div>
              <div style={styles.comboReward}>
                Награда: {Object.entries(combo.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(', ')}
              </div>
              {isOpen && (
                <div style={styles.comboCondition}>Условие: {combo.description}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BalanceAchievementsSection({ balanceCounts }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div style={styles.achSection}>
      <div style={styles.achSectionHeader}>
        <Scale size={15} color="#4ce0c0" />
        <span style={{ ...styles.achSectionTitle, color: '#4ce0c0' }}>Баланс</span>
      </div>
      <div style={styles.comboList}>
        {BALANCE_ACHIEVEMENTS.map((b) => {
          const count = balanceCounts[b.id] || 0;
          const triggered = count > 0;
          const isOpen = openId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setOpenId(isOpen ? null : b.id)}
              style={{
                ...styles.comboCard,
                borderColor: triggered ? '#4ce0c0' : '#28282f',
                background: triggered ? '#0f2622' : '#1c1c22',
                textAlign: 'left', width: '100%', cursor: 'pointer',
              }}
            >
              <div style={styles.comboCardTop}>
                <span style={{ ...styles.comboTitle, color: triggered ? '#4ce0c0' : '#9a9aa2' }}>{b.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {triggered && (
                    <span style={{ ...styles.comboCount, color: '#4ce0c0' }}>
                      <Scale size={11} color="#4ce0c0" /> ×{count}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    color="#5a5a62"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  />
                </div>
              </div>
              <div style={styles.comboReward}>
                Награда: {Object.entries(b.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(', ')}
              </div>
              {isOpen && (
                <div style={styles.comboCondition}>Условие: {b.description}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MythicView({ mythicAchievements }) {
  const [openId, setOpenId] = useState(null);
  const unlockedCount = mythicAchievements.filter((m) => m.unlocked).length;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={styles.mythicHeader}>
        <Sparkles size={16} color="#f5c84a" />
        <span style={styles.mythicHeaderTitle}>Мифические ачивки</span>
        <span style={styles.mythicHeaderCount}>{unlockedCount}/{mythicAchievements.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mythicAchievements.map((m) => {
          const isOpen = openId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setOpenId(isOpen ? null : m.id)}
              style={{
                ...styles.mythicCard,
                borderColor: m.unlocked ? '#f5c84a' : '#28282f',
                background: m.unlocked
                  ? 'linear-gradient(165deg, #332710 0%, #1c1c22 100%)'
                  : '#1c1c22',
              }}
            >
              <div style={styles.mythicCardTop}>
                {m.unlocked ? <Trophy size={18} color="#f5c84a" /> : <Lock size={18} color="#5a5a62" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.mythicTitle, color: m.unlocked ? '#f5c84a' : '#dcdce2' }}>{m.title}</div>
                  <div style={styles.mythicCharacter}>{m.character}</div>
                </div>
                <ChevronDown
                  size={14}
                  color="#5a5a62"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
                />
              </div>

              {isOpen && (
                <div style={styles.mythicExpand}>
                  <div style={styles.mythicConditionLabel}>Условие</div>
                  <div style={styles.mythicConditionText}>{m.description}</div>
                  <div style={styles.mythicConditionLabel}>Награда</div>
                  <div style={styles.mythicConditionText}>
                    {Object.entries(m.rewards).map(([stat, amt]) =>
                      stat === 'all' ? `+${amt} ко всем характеристикам` : `+${amt} ${stat}`
                    ).join(', ')}
                  </div>
                  {m.unlocked && (
                    <div style={styles.mythicQuote}>«{m.quote}»</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SecretAchievementsSection({ secretAchievements }) {
  const unlockedCount = secretAchievements.filter((s) => s.unlocked).length;
  return (
    <div style={styles.achSection}>
      <div style={styles.achSectionHeader}>
        <Sparkles size={15} color="#c9a8f5" />
        <span style={{ ...styles.achSectionTitle, color: '#c9a8f5' }}>
          Секретные ачивки ({unlockedCount}/{secretAchievements.length})
        </span>
      </div>
      <div style={styles.secretGrid}>
        {secretAchievements.map((s) => (
          <div
            key={s.id}
            style={{
              ...styles.secretCard,
              background: s.unlocked ? '#2a1f3a' : '#1c1c22',
              borderColor: s.unlocked ? '#9c6fe0' : '#28282f',
              animation: s.unlocked ? 'popIn 0.35s ease' : 'none',
            }}
          >
            {s.unlocked ? <Trophy size={16} color="#c9a8f5" /> : <Lock size={16} color="#4a4a52" />}
            <div style={{ ...styles.secretTitle, color: s.unlocked ? '#dcc8f5' : '#6a6a72' }}>
              {s.unlocked ? s.title : '???'}
            </div>
            <div style={styles.secretHint}>{s.unlocked ? 'Разблокировано' : s.hint}</div>
            {s.unlocked && s.rewards && (
              <div style={{ fontSize: 9.5, color: '#9af0e0', marginTop: 4, textAlign: 'center', lineHeight: 1.4 }}>
                {Object.entries(s.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsView({ achievements }) {
  const byId = {};
  achievements.forEach((a) => (byId[a.id] = a));

  const closeAchievements = achievements
    .filter((a) => a.nextTier)
    .map((a) => ({ ...a, remaining: a.nextTier.need - a.currentValue }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);

  const unlockedTiers = achievements
    .filter((a) => a.achievedTierIndex >= 0)
    .map((a) => ({ achId: a.id, achTitle: a.title, tier: a.tiers[a.achievedTierIndex] }))
    .reverse(); // most recently unlocked tracks tend to be later in the array as user progresses

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {closeAchievements.length > 0 && (
        <div style={styles.achSection}>
          <div style={styles.achSectionHeader}>
            <TrendingUp size={15} color="#7a6ae0" />
            <span style={{ ...styles.achSectionTitle, color: '#7a6ae0' }}>Близко к разблокировке</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {closeAchievements.map((a) => (
              <ProgressRow key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      <HallOfFame unlockedTiers={unlockedTiers} />

      {ACHIEVEMENT_GROUPS.map((group) => {
        const groupAchievements = group.ids.map((id) => byId[id]).filter(Boolean);
        if (groupAchievements.length === 0) return null;
        const GroupIcon = group.icon;
        return (
          <div key={group.label} style={styles.achSection}>
            <div style={styles.achSectionHeader}>
              <GroupIcon size={15} color={group.color} />
              <span style={{ ...styles.achSectionTitle, color: group.color }}>{group.label}</span>
            </div>
            {groupAchievements.map((ach) => (
              <div key={ach.id} style={styles.achGroup}>
                <div style={styles.achGroupHeader}>
                  <span>{ach.title}</span>
                  {ach.flavor && <span style={styles.achFlavor}>{ach.flavor}</span>}
                </div>
                <div style={styles.tierRow}>
                  {ach.tiers.map((t, idx) => {
                    const unlocked = idx <= ach.achievedTierIndex;
                    const colors = unlocked ? TIER_COLORS[t.tier] : TIER_COLORS.locked;
                    return (
                      <div
                        key={t.tier}
                        style={{
                          ...styles.tierCard,
                          background: colors.bg,
                          borderColor: colors.border,
                          animation: unlocked ? 'popIn 0.35s ease' : 'none',
                        }}
                      >
                        <Trophy size={16} color={colors.text} />
                        <div style={{ ...styles.tierName, color: colors.text }}>{t.name}</div>
                        <div style={styles.tierNeed}>{t.need} {ach.unit}</div>
                      </div>
                    );
                  })}
                </div>
                {ach.tiers.length > 1 && (
                  <div style={styles.achGroupProgress}>
                    <MiniProgress
                      label={ach.nextTier ? `До «${ach.nextTier.name}»` : 'Все тиры открыты'}
                      current={ach.currentValue}
                      target={ach.nextTier ? ach.nextTier.need : ach.currentValue}
                      unit={ach.unit}
                      color="#7a6ae0"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function RaidsView({ raids, currentClass, characterName, onStartRaid, onAddParticipant, onAddContribution, onResolve, onAbandon }) {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ fontSize: 11.5, color: '#7a7a82', lineHeight: 1.6, marginBottom: 20, padding: '10px 14px', background: '#1c1c22', borderRadius: 12, border: '1px solid #28282f' }}>
        ⚔️ Рейды — совместные испытания на несколько игроков. При провале снимается <span style={{ color: '#ff5c7a', fontWeight: 700 }}>штраф здоровья по редкости рейда</span> (редкий −20, эпический −35, легендарный −50). Лут определяется по классу на момент старта рейда.
      </div>
      {RAID_BOSSES.map((boss) => (
        <RaidBossCard
          key={boss.id}
          boss={boss}
          raid={raids[boss.id]}
          currentClass={currentClass}
          characterName={characterName}
          onStart={() => onStartRaid(boss.id)}
          onAddParticipant={(name) => onAddParticipant(boss.id, name)}
          onAddContribution={(participant, value) => onAddContribution(boss.id, participant, value)}
          onResolve={() => onResolve(boss.id)}
          onAbandon={() => onAbandon(boss.id)}
        />
      ))}
    </div>
  );
}

function RaidBossCard({ boss, raid, currentClass, characterName, onStart, onAddParticipant, onAddContribution, onResolve, onAbandon }) {
  const [showContrib, setShowContrib] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [contribValue, setContribValue] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');

  const rc = RAID_RARITY_COLORS[boss.rarity];
  const status = raid?.status;

  // Compute progress
  let progressValue = 0;
  let progressTarget = 1;
  let progressLabel = '';
  if (raid && boss.condition.type === 'shared_total') {
    progressValue = raid.contributions.reduce((s, c) => s + c.value, 0);
    progressTarget = boss.condition.target;
    progressLabel = `${Math.round(progressValue * 10) / 10} / ${progressTarget} ${boss.condition.unit}`;
  } else if (raid && boss.condition.type === 'each_player_all_days') {
    const total = raid.participants.length * boss.condition.daysRequired;
    const covered = new Set(raid.contributions.map(c => c.participantName + '_' + c.date)).size;
    progressValue = covered;
    progressTarget = total;
    progressLabel = `${covered} / ${total} дней-участников`;
  }
  const progressPct = progressTarget > 0 ? Math.min(100, (progressValue / progressTarget) * 100) : 0;

  // Deadline
  let deadlineStr = '';
  let expired = false;
  if (raid?.startDate) {
    const deadline = new Date(raid.startDate);
    deadline.setDate(deadline.getDate() + boss.durationDays);
    deadlineStr = deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    expired = new Date() > deadline;
  }

  // Loot for current class
  const classId = raid?.startClassId || (currentClass ? (currentClass.combo ? currentClass.classA.id : currentClass.id) : null);
  const loot = RAID_LOOT_BY_CLASS[boss.id]?.[classId];

  return (
    <div style={{ border: `1.5px solid ${rc.border}`, background: rc.bg, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: rc.color, letterSpacing: 0.3, lineHeight: 1.3 }}>{boss.name}</div>
          <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{boss.subtitle} · {boss.durationDays} {boss.durationDays === 3 ? 'дня' : 'дней'} · Уязвимость: {boss.weakness}</div>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: rc.color, background: rc.color + '22', borderRadius: 7, padding: '3px 8px', flexShrink: 0 }}>
          {status === 'victory' ? '✓ ПОБЕДА' : status === 'defeat' ? '✗ ПРОВАЛ' : status === 'active' ? '⚔️ АКТИВЕН' : 'ГОТОВ'}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: '#9a9aa2', lineHeight: 1.5, marginBottom: 12 }}>{boss.description}</div>

      {/* Progress bar (active or resolved) */}
      {raid && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a7a82', marginBottom: 4 }}>
            <span>{boss.condition.label}</span>
            <span style={{ color: rc.color, fontWeight: 700 }}>{progressLabel}</span>
          </div>
          <div style={{ height: 8, background: '#24242b', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: rc.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          {deadlineStr && <div style={{ fontSize: 10.5, color: expired ? '#ff5c7a' : '#6a6a72', marginTop: 4 }}>Дедлайн: {deadlineStr}{expired && status === 'active' ? ' — ВРЕМЯ ВЫШЛО!' : ''}</div>}
        </div>
      )}

      {/* Victory state */}
      {status === 'victory' && (
        <div style={{ background: '#1a2e1a', border: '1px solid #3a5a3a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7de87d', marginBottom: 6 }}>🏆 Победа! Общий титул: «{boss.sharedTitle}»</div>
          {loot && (
            <div style={{ fontSize: 11.5, color: '#c8e8c8' }}>
              <span style={{ color: rc.color, fontWeight: 700 }}>{loot.name}</span> — {Object.entries(loot.stats).map(([s, v]) => `+${v} ${s}`).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Defeat state */}
      {status === 'defeat' && (
        <div style={{ background: '#2e1a1a', border: '1px solid #5a2a2a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ff5c7a', marginBottom: 4 }}>💀 Рейд провален</div>
          <div style={{ fontSize: 11, color: '#c8a8a8' }}>Штраф: −{RAID_DEFEAT_PENALTY_BY_RARITY[boss.rarity] || 50} физического и ментального здоровья был применён</div>
        </div>
      )}

      {/* Participants (active raid) */}
      {status === 'active' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7a7a82', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Участники ({raid.participants.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {raid.participants.map((p) => (
              <div key={p.name} style={{ fontSize: 11, background: rc.color + '22', color: rc.color, borderRadius: 8, padding: '3px 10px', fontWeight: 600 }}>{p.name}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newParticipantName}
              onChange={e => setNewParticipantName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onAddParticipant(newParticipantName); setNewParticipantName(''); } }}
              placeholder="Имя участника..."
              style={{ ...styles.input, flex: 1, fontSize: 12, padding: '7px 10px' }}
            />
            <button
              onClick={() => { onAddParticipant(newParticipantName); setNewParticipantName(''); }}
              style={{ background: rc.color + '33', border: `1px solid ${rc.color}`, borderRadius: 8, padding: '7px 12px', color: rc.color, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Contribution form (active raid) */}
      {status === 'active' && (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setShowContrib(!showContrib)}
            style={{ background: 'none', border: `1px solid ${rc.color}55`, borderRadius: 9, padding: '7px 14px', color: rc.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: showContrib ? 10 : 0 }}
          >
            {showContrib ? '▲ Скрыть' : '▼ Записать вклад'}
          </button>
          {showContrib && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.2s ease' }}>
              <select
                value={selectedParticipant}
                onChange={e => setSelectedParticipant(e.target.value)}
                style={{ ...styles.input, fontSize: 12, padding: '8px 10px' }}
              >
                <option value="">— Участник —</option>
                {raid.participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <input
                type="number"
                value={contribValue}
                onChange={e => setContribValue(e.target.value)}
                placeholder={`Значение (${boss.condition.unit})`}
                style={{ ...styles.input, fontSize: 12, padding: '8px 10px' }}
              />
              <button
                onClick={() => {
                  if (!selectedParticipant || !contribValue) return;
                  onAddContribution(selectedParticipant, contribValue);
                  setContribValue('');
                }}
                style={{ background: rc.color, color: '#15151a', border: 'none', borderRadius: 9, padding: '10px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                Засчитать
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contributions log */}
      {raid?.contributions?.length > 0 && status === 'active' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#5a5a62', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Вклады участников</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
            {[...raid.contributions].reverse().map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9a9aa2', background: '#15151a', borderRadius: 7, padding: '4px 10px' }}>
                <span style={{ color: rc.color, fontWeight: 600 }}>{c.participantName}</span>
                <span>{c.date} · <span style={{ color: '#dcdce2', fontWeight: 700 }}>+{c.value} {boss.condition.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loot preview (not started) */}
      {!raid && loot && (
        <div style={{ background: '#18181f', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#6a6a72' }}>
          Ваш лут ({loot.name}): <span style={{ color: rc.color }}>{Object.entries(loot.stats).map(([s, v]) => `+${v} ${s}`).join(', ')}</span>
        </div>
      )}
      {!raid && !classId && (
        <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 10 }}>Прокачайте характеристики для определения класса перед стартом</div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!raid && (
          <button
            onClick={onStart}
            style={{ flex: 1, background: rc.color, color: '#15151a', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            ⚔️ Начать рейд
          </button>
        )}
        {status === 'active' && expired && (
          <button
            onClick={onResolve}
            style={{ flex: 1, background: '#ff5c7a', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Завершить рейд
          </button>
        )}
        {(status === 'victory' || status === 'defeat') && (
          <button
            onClick={onAbandon}
            style={{ flex: 1, background: 'transparent', color: '#6a6a72', border: '1px solid #3a3a42', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Сбросить рейд
          </button>
        )}
        {status === 'active' && (
          <button
            onClick={onAbandon}
            style={{ background: 'transparent', color: '#5a5a62', border: '1px solid #2a2a32', borderRadius: 10, padding: '11px 14px', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}

function ArchiveView() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={styles.archiveEmptyState}>
        <BookOpen size={28} color="#5a5a62" />
        <div style={styles.archiveEmptyTitle}>Архив премудростей</div>
        <div style={styles.archiveEmptyText}>
          Здесь скоро появятся статьи по спорту и питанию. Ты получил доступ за ачивку «Библио-Глобус» —
          материалы будут опубликованы позже.
        </div>
      </div>
    </div>
  );
}

function ClassTreeView({ currentClass, level, lockedClassId, top3Classes, chosenPathId, unlockedSkillLevels, availableSkillTiers, onLockClass, onChoosePath, onUnlockSkillTier }) {
  const SKILL_LEVELS = [10, 15, 20, 25, 30];
  const [skillsOpen, setSkillsOpen] = useState(false);

  const activeClassId = lockedClassId;
  const activeCls = CHARACTER_CLASSES.find(c => c.id === activeClassId);
  const dynamicCls = currentClass ? CHARACTER_CLASSES.find(c => c.id === (currentClass.combo ? currentClass.classA.id : currentClass.id)) : null;
  const paths = activeClassId ? (CLASS_PATHS[activeClassId] || []) : [];
  const chosenPath = paths.find(p => p.id === chosenPathId);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>

      {/* ── STATUS BANNER ── */}
      <div style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>

        {/* BELOW LVL 10: dynamic */}
        {level < 10 && (
          <div>
            <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 8 }}>До 10 уровня класс определяется динамически по твоим показателям</div>
            {dynamicCls ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: dynamicCls.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <dynamicCls.icon size={16} color={dynamicCls.color} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: dynamicCls.color }}>{dynamicCls.name}</span>
                  <span style={{ fontSize: 10.5, color: '#5a5a62' }}>— текущий</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#28282f', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, level * 10)}%`, background: dynamicCls.color, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 10.5, color: '#6a6a72', flexShrink: 0 }}>{level}/10</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#5a5a62' }}>Начни прокачивать характеристики</div>
            )}
          </div>
        )}

        {/* AT LVL 10: choose from top 3 */}
        {level >= 10 && !lockedClassId && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f0c14b', marginBottom: 4 }}>⚡ Ты достиг 10 уровня! Выбери класс</div>
            <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 12 }}>На основе прокачки определились три ведущих класса. Выбор необратим.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top3Classes.map(({ cls, avg }, i) => (
                <button
                  key={cls.id}
                  onClick={() => onLockClass(cls.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: cls.color + (i === 0 ? '20' : '10'),
                    border: `1.5px solid ${cls.color + (i === 0 ? 'aa' : '44')}`,
                    borderRadius: 11, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cls.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cls.icon size={20} color={cls.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cls.color }}>{cls.name}</span>
                      {i === 0 && <span style={{ fontSize: 9, background: '#f0c14b', color: '#15151a', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>ЛИДЕР</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#7a7a82', marginTop: 2 }}>{cls.stats.join(' · ')} · среднее: {avg.toFixed(0)}</div>
                  </div>
                  <div style={{ fontSize: 18, color: cls.color + '88' }}>→</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOCKED, no path yet */}
        {lockedClassId && !chosenPathId && activeCls && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: activeCls.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <activeCls.icon size={15} color={activeCls.color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: activeCls.color }}>{activeCls.name} — закреплён</span>
            </div>
            <div style={{ fontSize: 11, color: '#f0c14b' }}>⚡ Выбери путь развития ниже</div>
          </div>
        )}

        {/* LOCKED + PATH CHOSEN */}
        {lockedClassId && chosenPathId && activeCls && chosenPath && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: activeCls.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <activeCls.icon size={15} color={activeCls.color} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: activeCls.color }}>{activeCls.name}</span>
              <span style={{ fontSize: 10.5, color: '#5a5a62' }}>· закреплён</span>
              <div style={{ marginLeft: 'auto', fontSize: 10.5, color: '#6a6a72' }}>{unlockedSkillLevels.length}/{SKILL_LEVELS.length} скиллов</div>
            </div>
            {/* Big path display with collapsible skills */}
            <div style={{ background: `linear-gradient(135deg, ${chosenPath.color}22 0%, ${chosenPath.color}0a 100%)`, border: `1.5px solid ${chosenPath.color}55`, borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setSkillsOpen(o => !o)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '12px 14px', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 700, color: chosenPath.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, opacity: 0.8 }}>Активный путь</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: chosenPath.color, lineHeight: 1.2 }}>{chosenPath.name}</div>
                  <ChevronDown size={16} color={chosenPath.color} style={{ transform: skillsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: chosenPath.color, opacity: 0.7, marginTop: 4 }}>Упор: {chosenPath.focus} · нажми чтобы {skillsOpen ? 'скрыть' : 'показать'} пассивки</div>
              </button>

              {skillsOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${chosenPath.color}33`, paddingTop: 12, animation: 'fadeUp 0.2s ease' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {chosenPath.skills.map(skill => {
                      const isAvailable = level >= skill.level;
                      const isUnlocked = unlockedSkillLevels.includes(skill.level);
                      const canUnlock = isAvailable && !isUnlocked;
                      return (
                        <div key={skill.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: isUnlocked ? chosenPath.color + '18' : '#17171c', border: `1px solid ${isUnlocked ? chosenPath.color + '55' : isAvailable ? '#3a3a42' : '#28282f'}`, borderRadius: 9, padding: '9px 12px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: isUnlocked ? chosenPath.color : isAvailable ? '#9a9aa2' : '#4a4a52', background: isUnlocked ? chosenPath.color + '22' : '#20202a', borderRadius: 5, padding: '3px 7px', flexShrink: 0, marginTop: 1 }}>
                            Ур.{skill.level}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isUnlocked ? chosenPath.color : isAvailable ? '#dcdce2' : '#5a5a62' }}>{skill.name}</div>
                            <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{skill.desc}</div>
                          </div>
                          {isUnlocked ? (
                            <div style={{ fontSize: 10, color: chosenPath.color, fontWeight: 700, flexShrink: 0 }}>✓</div>
                          ) : canUnlock ? (
                            <button onClick={() => onUnlockSkillTier(skill.level)} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: `1px solid ${chosenPath.color}`, background: chosenPath.color, color: '#15151a', cursor: 'pointer', flexShrink: 0 }}>
                              Взять
                            </button>
                          ) : (
                            <Lock size={13} color="#4a4a52" style={{ flexShrink: 0, marginTop: 2 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ALL 6 CLASSES ── */}
      {CHARACTER_CLASSES
        .filter(cls => !chosenPathId || cls.id === activeClassId)
        .map((cls) => {
        const isCurrent = cls.id === activeClassId;
        const clsPaths = CLASS_PATHS[cls.id] || [];

        return (
          <div key={cls.id} style={{ marginBottom: 10, border: `1.5px solid ${isCurrent ? cls.color : '#28282f'}`, borderRadius: 14, background: isCurrent ? cls.color + '10' : '#1a1a20', overflow: 'hidden' }}>
            {/* Class header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: cls.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <cls.icon size={20} color={cls.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: cls.color }}>{cls.name}</div>
                <div style={{ fontSize: 10.5, color: '#6a6a72' }}>{cls.statGroup} · {cls.stats.join(' + ')}</div>
              </div>
              {isCurrent && <div style={{ fontSize: 10, background: cls.color, color: '#15151a', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{lockedClassId ? 'Закреплён' : 'Текущий'}</div>}
            </div>

            {/* Path selection for locked class without chosen path */}
            {isCurrent && lockedClassId && !chosenPathId && (
              <div style={{ borderTop: `1px solid ${cls.color}33`, padding: '10px 14px 14px' }}>
                <div style={{ fontSize: 11, color: '#9a9aa2', marginBottom: 10 }}>Выбери путь — изменить после нельзя:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clsPaths.map(path => (
                    <button key={path.id} onClick={() => onChoosePath(path.id)}
                      style={{ background: path.color + '15', border: `1.5px solid ${path.color}55`, borderRadius: 10, padding: '10px 14px', textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: path.color, marginBottom: 2 }}>{path.name}</div>
                      <div style={{ fontSize: 10.5, color: '#6a6a72' }}>Упор: {path.focus} · 5 пассивок (10/15/20/25/30)</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {path.skills.map(s => <div key={s.level} style={{ fontSize: 9, background: path.color + '22', color: path.color, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Ур.{s.level}</div>)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paths preview for non-current classes */}
            {!isCurrent && (
              <div style={{ borderTop: '1px solid #28282f', padding: '8px 14px 12px', display: 'flex', gap: 8 }}>
                {clsPaths.map(path => (
                  <div key={path.id} style={{ flex: 1, background: '#17171c', border: '1px solid #28282f', borderRadius: 8, padding: '7px 10px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5a62' }}>{path.name}</div>
                    <div style={{ fontSize: 9.5, color: '#4a4a52', marginTop: 2 }}>Упор: {path.focus}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShopView({ currencyBalance, purchasedItemIds, shopItemAvailability, equippedShopItems, onPurchase, onEquip, onSell, level, lockedClassId }) {
  const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const RARITY_LEVEL_REQ = { common: 1, rare: 10, epic: 20, legendary: 1, mythic: 1 };
  const [activeRarity, setActiveRarity] = useState('common');

  const activeItems = SHOP_ITEMS.filter((i) => i.rarity === activeRarity);
  const rarity = RARITY_TIERS[activeRarity];
  const ownedCount = activeItems.filter((i) => purchasedItemIds.includes(i.id)).length;
  const rarityLevelReq = RARITY_LEVEL_REQ[activeRarity] || 1;
  const rarityLocked = level < rarityLevelReq;

  // A class-restricted item becomes "orphaned" if the player locks a different class after buying it.
  function isClassItemOrphaned(item) {
    return item.requirement?.type === 'class' && lockedClassId && lockedClassId !== item.requirement.id;
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={styles.shopBalanceWrap}>
        <Gem size={18} color="#5b9bf0" />
        <span style={styles.shopBalanceValue}>{currencyBalance}</span>
        <span style={styles.shopBalanceLabel}>кристаллов</span>
      </div>

      <div className="tabBarScroll" style={styles.shopRarityTabs}>
        {rarityOrder.map((rarityKey) => {
          const rTier = RARITY_TIERS[rarityKey];
          const isActive = activeRarity === rarityKey;
          const count = SHOP_ITEMS.filter((i) => i.rarity === rarityKey).length;
          const lvlReq = RARITY_LEVEL_REQ[rarityKey] || 1;
          const isLocked = level < lvlReq;
          return (
            <button
              key={rarityKey}
              onClick={() => setActiveRarity(rarityKey)}
              style={{
                ...styles.shopRarityTabBtn,
                borderColor: isActive ? rTier.color : '#28282f',
                background: isActive ? rTier.color + '1f' : '#1c1c22',
                color: isActive ? rTier.color : '#9a9aa2',
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <span style={{ ...styles.shopRaritySectionDot, background: isLocked ? '#5a5a62' : rTier.color }} />
              {rTier.label}
              {isLocked ? <Lock size={9} style={{ marginLeft: 3 }} /> : <span style={styles.shopRarityTabCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {rarityLocked && (
        <div style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 10, padding: '12px 16px', marginBottom: 12, textAlign: 'center' }}>
          <Lock size={18} color={rarity.color} style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: rarity.color }}>Открывается на {rarityLevelReq} уровне</div>
          <div style={{ fontSize: 11, color: '#6a6a72', marginTop: 4 }}>Текущий уровень: {level}</div>
        </div>
      )}

      <div style={styles.shopRaritySectionHeader}>
        <span style={{ ...styles.shopRaritySectionTitle, color: rarity.color }}>{rarity.label}</span>
        <span style={styles.shopRaritySectionCount}>{ownedCount}/{activeItems.length} собрано</span>
      </div>

      <div style={styles.shopGrid}>
        {activeItems.map((item) => {
          const owned = purchasedItemIds.includes(item.id);
          const available = shopItemAvailability[item.id];
          const isEquipped = equippedShopItems[item.slot] === item.id;
          const canAfford = currencyBalance >= item.price;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              style={{ ...styles.shopCard, borderColor: rarity.color + '66', background: rarity.bg }}
            >
              <div style={{ ...styles.shopCardIconWrap, background: rarity.color + '22' }}>
                {available || owned ? <Icon size={16} color={rarity.color} /> : <Lock size={16} color="#5a5a62" />}
              </div>
              <div style={styles.shopItemName}>{available || owned ? item.name : '???'}</div>

              {item.bonus && (available || owned) && (
                <div style={styles.shopItemBonus}>
                  +{item.bonus.xpBonusPct}% {item.bonus.activity === 'all' ? 'всем' : (ACTIVITY_TYPES[item.bonus.activity]?.label || item.bonus.activity)}
                </div>
              )}

              {!available && !owned && item.requirement && (
                <div style={styles.shopItemLockedHint}>
                  {item.requirement.type === 'mythic'
                    ? '🔒 Открыть: мифическая ачивка'
                    : item.requirement.type === 'achievement'
                    ? '🔒 Открыть: топовый тир ачивки'
                    : item.requirement.type === 'class'
                    ? '🔒 Стань этим классом'
                    : '🔒 Закрыто'}
                </div>
              )}
              {!available && !owned && !item.requirement && rarityLocked && (
                <div style={styles.shopItemLockedHint}>🔒 Уровень {rarityLevelReq}</div>
              )}

              {owned ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <button
                    onClick={() => onEquip(item.slot, isEquipped ? null : item.id)}
                    style={{
                      ...styles.shopActionBtnSmall,
                      background: isEquipped ? rarity.color : 'transparent',
                      color: isEquipped ? '#15151a' : rarity.color,
                      borderColor: rarity.color,
                    }}
                  >
                    {isEquipped ? (isClassItemOrphaned(item) ? 'Надето (неактивно)' : 'Надето') : 'Надеть'}
                  </button>
                  {item.price > 0 && (
                    <button
                      onClick={() => onSell(item)}
                      style={{
                        ...styles.shopActionBtnSmall,
                        background: 'transparent',
                        color: isClassItemOrphaned(item) ? '#e08a8a' : '#6a6a72',
                        borderColor: isClassItemOrphaned(item) ? '#7a3a3a' : '#3a3a42',
                        fontSize: 10,
                        padding: '3px 6px',
                      }}
                    >
                      Продать · {Math.floor(item.price * SHOP_REFUND_RATE)} <Gem size={8} style={{ marginLeft: 1 }} />
                    </button>
                  )}
                </div>
              ) : available && item.price === 0 ? (
                <button
                  onClick={() => onPurchase(item)}
                  style={{
                    ...styles.shopActionBtnSmall,
                    background: rarity.color, color: '#15151a',
                    borderColor: rarity.color, cursor: 'pointer',
                  }}
                >
                  Получить
                </button>
              ) : available ? (
                <button
                  onClick={() => onPurchase(item)}
                  disabled={!canAfford}
                  style={{
                    ...styles.shopActionBtnSmall,
                    background: 'transparent', color: canAfford ? rarity.color : '#5a5a62',
                    borderColor: canAfford ? rarity.color : '#3a3a42',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}
                >
                  {item.price} <Gem size={9} style={{ marginLeft: 2 }} />
                </button>
              ) : (
                <div style={{ ...styles.shopActionBtnSmall, color: '#5a5a62', borderColor: '#3a3a42' }}>Закрыто</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CharacterView({ statTotals, currentClass, equippedShopItems, purchasedItemIds, onEquip, earnedTitles, activeTitle, setActiveTitle, levelState, lockedClassId, chosenPathId }) {
  const [chestOpen, setChestOpen] = useState(false);
  const [titlesOpen, setTitlesOpen] = useState(false);

  // Resolve base class (always the locked class, not the combo name)
  const baseClass = lockedClassId ? CHARACTER_CLASSES.find(c => c.id === lockedClassId) : (currentClass?.combo ? currentClass.classA : currentClass);
  const isCombo = !!currentClass?.combo;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <SectionLabel text="Класс персонажа" />
      <ClassCard
        currentClass={currentClass}
        baseClass={baseClass}
        isCombo={isCombo}
        chosenPath={chosenPath}
        level={levelState.level}
      />

      {/* GEAR CHEST */}
      <div style={{ marginTop: 20, marginBottom: 4 }}>
        <button
          onClick={() => setChestOpen(!chestOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#1c1c22', border: '1.5px solid #28282f', borderRadius: 12,
            padding: '12px 16px', cursor: 'pointer', color: '#dcdce2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={16} color="#f0d272" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Сундук экипировки</span>
            <span style={{ fontSize: 11, color: '#6a6a72' }}>
              {purchasedItemIds.length} предметов
            </span>
          </div>
          <ChevronDown size={16} color="#9a9aa2" style={{ transform: chestOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {chestOpen && (
          <div style={{ animation: 'fadeUp 0.2s ease', background: '#18181f', border: '1.5px solid #28282f', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 14 }}>
            <EquippedGear equippedShopItems={equippedShopItems} lockedClassId={lockedClassId} />
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5a62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Все купленные предметы</div>
              {SHOP_SLOTS.map((slot) => {
                const slotItems = SHOP_ITEMS.filter((i) => i.slot === slot.key && purchasedItemIds.includes(i.id));
                if (slotItems.length === 0) return null;
                return (
                  <div key={slot.key} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#6a6a72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>{slot.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {slotItems.map((item) => {
                        const rarity = RARITY_TIERS[item.rarity];
                        const isEquipped = equippedShopItems[slot.key] === item.id;
                        const Icon = item.icon;
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isEquipped ? rarity.color + '18' : '#1e1e26', borderRadius: 9, padding: '8px 12px', border: `1px solid ${isEquipped ? rarity.color + '55' : '#28282f'}` }}>
                            <Icon size={14} color={rarity.color} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: isEquipped ? rarity.color : '#dcdce2' }}>{item.name}</div>
                              {item.bonus && <div style={{ fontSize: 10.5, color: '#6a6a72' }}>+{item.bonus.xpBonusPct}% {ACTIVITY_TYPES[item.bonus.activity]?.label || 'все'}</div>}
                            </div>
                            <button
                              onClick={() => onEquip(slot.key, isEquipped ? null : item.id)}
                              style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: `1px solid ${rarity.color}`, background: isEquipped ? rarity.color : 'transparent', color: isEquipped ? '#15151a' : rarity.color, cursor: 'pointer' }}
                            >
                              {isEquipped ? 'Снять' : 'Надеть'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {purchasedItemIds.length === 0 && <div style={{ fontSize: 12, color: '#5a5a62', textAlign: 'center', padding: 16 }}>Сундук пуст — зайди в Магазин</div>}
            </div>
          </div>
        )}
      </div>

      {/* TITLES PANEL */}
      <div style={{ marginTop: 10, marginBottom: 20 }}>
        <button
          onClick={() => setTitlesOpen(!titlesOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#1c1c22', border: '1.5px solid #28282f', borderRadius: 12,
            padding: '12px 16px', cursor: 'pointer', color: '#dcdce2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crown size={16} color="#f0d272" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Титулы</span>
            <span style={{ fontSize: 11, color: '#6a6a72' }}>{earnedTitles.length} получено</span>
            {activeTitle && <span style={{ fontSize: 10, color: activeTitle.color, background: activeTitle.color + '22', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>★ {activeTitle.text}</span>}
          </div>
          <ChevronDown size={16} color="#9a9aa2" style={{ transform: titlesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {titlesOpen && (
          <div style={{ animation: 'fadeUp 0.2s ease', background: '#18181f', border: '1.5px solid #28282f', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 14 }}>
            <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 12 }}>Выбери активный титул — он будет отображаться в шапке вместо уровневого.</div>

            {/* Reset to level title */}
            <div
              onClick={() => setActiveTitle(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: !activeTitle ? '#1f2e1a' : '#1e1e26', borderRadius: 9, padding: '9px 12px', marginBottom: 8, border: `1px solid ${!activeTitle ? '#3a5a3a' : '#28282f'}`, cursor: 'pointer' }}
            >
              <Star size={13} color={levelState.titleColor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: !activeTitle ? levelState.titleColor : '#dcdce2' }}>{levelState.title}</div>
                <div style={{ fontSize: 10.5, color: '#6a6a72' }}>Уровневый титул (по умолчанию)</div>
              </div>
              {!activeTitle && <div style={{ fontSize: 10, color: '#7de87d', fontWeight: 700 }}>Активен</div>}
            </div>

            {earnedTitles.length === 0 && (
              <div style={{ fontSize: 12, color: '#5a5a62', textAlign: 'center', padding: 16 }}>Выполняй ачивки, комбо и рейды чтобы получить новые титулы</div>
            )}

            {earnedTitles.map((t) => {
              const isActive = activeTitle?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTitle(isActive ? null : t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: isActive ? t.color + '18' : '#1e1e26', borderRadius: 9, padding: '9px 12px', marginBottom: 6, border: `1px solid ${isActive ? t.color + '55' : '#28282f'}`, cursor: 'pointer' }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? t.color : '#dcdce2' }}>{t.text}</div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72' }}>{t.source}</div>
                  </div>
                  {isActive && <div style={{ fontSize: 10, color: t.color, fontWeight: 700 }}>★ Активен</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SectionLabel text="Баланс прокачки" />
      <StatRadar statTotals={statTotals} />

      <SectionLabel text="Характеристики персонажа" style={{ marginTop: 24 }} />
      <StatBars statTotals={statTotals} />
    </div>
  );
}

function EquippedGear({ equippedShopItems, lockedClassId }) {
  // Determine active/inactive status for each equipped item.
  // Class-restricted items are inactive if the player is locked into a different class.
  function isItemActive(item) {
    if (!item) return false;
    if (item.requirement?.type === 'class' && lockedClassId && lockedClassId !== item.requirement.id) {
      return false;
    }
    return true;
  }

  const equippedItems = SHOP_SLOTS
    .map((slot) => ({ slot, item: equippedShopItems[slot.key] ? SHOP_ITEMS.find((i) => i.id === equippedShopItems[slot.key]) : null }))
    .filter((entry) => entry.item);

  const activeEquippedItems = equippedItems.filter(({ item }) => isItemActive(item));
  const allSlotsActive = activeEquippedItems.length === SHOP_SLOTS.length;
  const hasInactiveItem = equippedItems.some(({ item }) => !isItemActive(item));

  // Sum up XP bonuses granted by all ACTIVE equipped items, grouped by activity ('all' kept separate)
  const bonusByActivity = {};
  activeEquippedItems.forEach(({ item }) => {
    if (!item.bonus) return;
    const key = item.bonus.activity;
    bonusByActivity[key] = (bonusByActivity[key] || 0) + item.bonus.xpBonusPct;
  });
  const bonusEntries = Object.entries(bonusByActivity);

  const firstRowSlots = SHOP_SLOTS.slice(0, 3);
  const secondRowSlots = SHOP_SLOTS.slice(3, 6);

  function renderSlotCard(slot) {
    const item = equippedShopItems[slot.key] ? SHOP_ITEMS.find((i) => i.id === equippedShopItems[slot.key]) : null;
    const rarity = item ? RARITY_TIERS[item.rarity] : null;
    const active = isItemActive(item);
    const displayOpacity = item && !active ? 0.4 : 1;
    return (
      <div
        key={slot.key}
        style={{
          ...styles.equippedGearCard,
          borderColor: rarity ? rarity.color + '66' : '#28282f',
          background: rarity ? rarity.bg : '#15151a',
          opacity: displayOpacity,
          position: 'relative',
        }}
      >
        <div style={{ ...styles.equippedGearIconWrap, background: rarity ? rarity.color + '22' : '#20202a' }}>
          {item ? <item.icon size={28} color={rarity.color} /> : <Lock size={22} color="#4a4a52" />}
        </div>
        <span style={styles.equippedGearSlotLabel}>{slot.label}</span>
        <span style={{ ...styles.equippedGearItemName, color: rarity ? rarity.color : '#5a5a62' }}>
          {item ? item.name : 'пусто'}
        </span>
        {item && !active && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: '#3a1a1a', border: '1px solid #7a3a3a', borderRadius: 6,
            padding: '1px 5px', fontSize: 8.5, color: '#e08a8a', fontWeight: 700,
          }}>
            неактивно
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.equippedGearWrap}>
      <div style={styles.equippedCardsRow}>
        {firstRowSlots.map(renderSlotCard)}
      </div>
      <div style={styles.equippedCardsRow}>
        {secondRowSlots.map(renderSlotCard)}
      </div>

      {bonusEntries.length > 0 ? (
        <div style={styles.equippedBonusSummary}>
          <div style={styles.equippedBonusSummaryTitle}>Суммарный бонус от экипировки</div>
          <div style={styles.equippedBonusList}>
            {bonusEntries.map(([activity, pct]) => (
              <div key={activity} style={styles.equippedBonusRow}>
                <span style={styles.equippedBonusActivity}>
                  {activity === 'all' ? 'Все активности' : (ACTIVITY_TYPES[activity]?.label || activity)}
                </span>
                <span style={styles.equippedBonusValue}>+{pct}% XP</span>
              </div>
            ))}
            {allSlotsActive && (
              <div style={{ ...styles.equippedBonusRow, background: '#1f2a1a', borderRadius: 8, marginTop: 4 }}>
                <span style={{ ...styles.equippedBonusActivity, color: '#7de87d' }}>
                  🔥 Полный комплект — все слоты
                </span>
                <span style={{ ...styles.equippedBonusValue, color: '#7de87d' }}>+15% XP</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.equippedEmptyHint}>Зайди в «Магазин», чтобы купить и надеть снаряжение</div>
      )}
      {!allSlotsActive && activeEquippedItems.length > 0 && (
        <div style={{ fontSize: 11, color: '#5a5a62', textAlign: 'center', marginTop: 8 }}>
          Заполни все 6 слотов активной экипировкой → +15% XP ко всему ({SHOP_SLOTS.length - activeEquippedItems.length} осталось)
        </div>
      )}
      {hasInactiveItem && (
        <div style={{ fontSize: 11, color: '#e08a8a', textAlign: 'center', marginTop: 6 }}>
          Класс-предмет не подходит твоему залоченному классу — можешь продать его в магазине
        </div>
      )}
    </div>
  );
}

function ClassCard({ currentClass, baseClass, isCombo, chosenPath, level }) {
  if (!currentClass) {
    return (
      <div style={styles.classCardWrap}>
        <div style={styles.classCardEmpty}>Класс ещё не определён — начни прокачивать характеристики</div>
      </div>
    );
  }

  const BaseIcon = baseClass?.icon || currentClass.icon;
  const baseColor = baseClass?.color || currentClass.color;
  const comboName = isCombo ? currentClass.name : null;
  const comboColor = isCombo ? currentClass.secondaryColor : null;
  const ComboSecondaryIcon = isCombo ? currentClass.secondaryIcon : null;

  return (
    <div style={{
      ...styles.classCardWrap,
      borderColor: baseColor,
      background: `linear-gradient(135deg, ${baseColor}3a 0%, ${baseColor}12 60%, #1c1c22 100%)`,
      boxShadow: `0 0 24px ${baseColor}40, inset 0 0 30px ${baseColor}14`,
      padding: '18px 16px',
    }}>
      {/* BASE CLASS — big, dominant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: (isCombo || chosenPath) ? 14 : 0 }}>
        <div style={{
          ...styles.classCardIconWrap,
          width: 58, height: 58,
          background: `radial-gradient(circle, ${baseColor}55 0%, ${baseColor}22 70%)`,
          boxShadow: `0 0 20px ${baseColor}99`,
        }}>
          <BaseIcon size={34} color={baseColor} style={{ filter: `drop-shadow(0 0 8px ${baseColor})` }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: baseColor + 'aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
            Базовый класс
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: baseColor, lineHeight: 1.1, textShadow: `0 0 14px ${baseColor}66` }}>
            {baseClass?.name || currentClass.name}
          </div>
          <div style={{ fontSize: 11, color: '#7a7a82', marginTop: 3 }}>
            {baseClass?.statGroup || currentClass.statGroup} · +10% XP
          </div>
        </div>
      </div>

      {/* SUBCLASS (combo) — shown from lvl 20 */}
      {isCombo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: chosenPath ? 12 : 0,
          padding: '10px 12px', borderRadius: 10,
          background: comboColor + '14', border: `1px solid ${comboColor}44`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle, ${comboColor}55 0%, ${comboColor}22 70%)`,
            boxShadow: `0 0 10px ${comboColor}66`,
          }}>
            <ComboSecondaryIcon size={17} color={comboColor} style={{ filter: `drop-shadow(0 0 4px ${comboColor})` }} />
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: comboColor + 'aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Подкласс
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: comboColor, lineHeight: 1.1 }}>{comboName}</div>
            <div style={{ fontSize: 10, color: '#7a7a82', marginTop: 1 }}>
              {currentClass.classA.name} + {currentClass.classB.name} · +8% XP обеим группам
            </div>
          </div>
        </div>
      )}

      {/* PATH */}
      {chosenPath && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: chosenPath.color + '14', border: `1px solid ${chosenPath.color}44`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: chosenPath.color + '22',
          }}>
            <Footprints size={16} color={chosenPath.color} />
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: chosenPath.color + 'aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Путь
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: chosenPath.color, lineHeight: 1.1 }}>{chosenPath.name}</div>
            <div style={{ fontSize: 10, color: '#7a7a82', marginTop: 1 }}>{chosenPath.focus}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryView({ logs }) {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {sorted.length === 0 && <div style={styles.emptyState}>Пока нет записей. Залогируй первую активность на вкладке «Прогресс».</div>}
      {sorted.map((log) => {
        const def = ACTIVITY_TYPES[log.activity];
        const Icon = def.icon;
        return (
          <div key={log.id} style={styles.historyRow}>
            <div style={{ ...styles.activityIconWrap, background: def.color + '22', color: def.color, width: 32, height: 32 }}>
              <Icon size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.historyLabel}>{def.label}</div>
              <div style={styles.historyDate}>
                <Calendar size={11} style={{ marginRight: 4, position: 'relative', top: 1 }} />
                {log.date}
                {log.distance && ` · ${Number(log.distance).toFixed(1)} км`}
                {log.pages && ` · ${log.pages} стр.`}
                {log.kcal && ` · ${Number(log.kcal)} ккал`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LogModal({ activityKey, value, setValue, strictSleep, setStrictSleep, intensity, setIntensity, onSubmit, onClose }) {
  const def = ACTIVITY_TYPES[activityKey];
  const Icon = def.icon;
  const field = def.logFields[0];
  const showIntensity = INTENSITY_ACTIVITIES.has(activityKey);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ ...styles.activityIconWrap, background: def.color + '22', color: def.color }}>
            <Icon size={18} />
          </div>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div style={styles.modalTitle}>{def.label}</div>
            <div style={styles.modalSub}>Записать на сегодня</div>
          </div>
          <button onClick={onClose} style={styles.modalClose}><X size={18} color="#8a8a92" /></button>
        </div>

        {field && (
          <div style={{ marginTop: 16 }}>
            <label style={styles.fieldLabel}>{field.label}</label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={styles.input}
              placeholder="0"
              autoFocus
            />
          </div>
        )}

        {activityKey === 'sleep' && (
          <button
            onClick={() => setStrictSleep(!strictSleep)}
            style={styles.strictSleepRow}
          >
            <div
              style={{
                ...styles.strictSleepCheck,
                background: strictSleep ? '#4f7cff22' : 'transparent',
                borderColor: strictSleep ? '#4f7cff' : '#3a3a42',
              }}
            >
              {strictSleep && <Check size={12} color="#4f7cff" />}
            </div>
            <span style={styles.strictSleepLabel}>Лёг до 23:00 и встал до 09:00</span>
          </button>
        )}

        {showIntensity && (
          <div style={{ marginTop: 16 }}>
            <label style={styles.fieldLabel}>Интенсивность</label>
            <div style={styles.intensityRow}>
              {Object.entries(INTENSITY_LEVELS).map(([key, cfg]) => {
                const active = intensity === key;
                return (
                  <button
                    key={key}
                    onClick={() => setIntensity(key)}
                    style={{
                      ...styles.intensityBtn,
                      background: active ? cfg.color + '22' : '#15151a',
                      borderColor: active ? cfg.color : '#2c2c34',
                      color: active ? cfg.color : '#8a8a92',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{cfg.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 4 }}>{cfg.xp} XP</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.statsPreview}>
          <TrendingUp size={13} color="#6a6a72" />
          <span style={{ marginLeft: 6 }}>Прокачает: {def.stats.join(', ')}</span>
        </div>

        {activityKey === 'calories' && Number(value) >= 1000 && (
          <div style={{
            marginTop: 8, padding: '8px 10px', borderRadius: 8,
            background: '#3a1f10', border: '1px solid #e8633c55',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e8b090',
          }}>
            <Zap size={12} color="#e8633c" />
            <span>1000+ ккал за день → добавит 1 стек усталости к физ. здоровью</span>
          </div>
        )}

        {activityKey === 'calories' && !Number(def.stats.length) && (
          <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 6, textAlign: 'center' }}>
            Не даёт XP к статам, но приносит кристаллы
          </div>
        )}

        <button style={styles.submitBtn} onClick={onSubmit}>Записать</button>
      </div>
    </div>
  );
}

function Toast({ text }) {
  return (
    <div style={styles.toast}>
      <Sparkles size={14} color="#f0d272" />
      <span style={{ marginLeft: 8 }}>{text}</span>
    </div>
  );
}

// ---------- GUILD VIEW ----------

function GuildView({ playerName, playerLevel, playerClass, playerPhysical, playerMental, playerTitleEntry, activeTitle, earnedTitles, raids, guildLikes, onLike, lockedClassId, chosenPathId, guildMembers, onRefreshGuild, onLogout }) {
  const [likedSet, setLikedSet] = React.useState(new Set()); // track who current player already liked
  const [refreshing, setRefreshing] = React.useState(false);

  // Auto-refresh guild when this tab is mounted, and every 30s
  React.useEffect(() => {
    onRefreshGuild();
    const interval = setInterval(onRefreshGuild, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefreshGuild();
    setRefreshing(false);
  }

  function handleLike(name) {
    if (likedSet.has(name)) return;
    setLikedSet(prev => new Set([...prev, name]));
    onLike(name);
  }

  // Build "you" card data from live props
  const playerCls = playerClass
    ? (playerClass.combo ? playerClass.classA : playerClass)
    : null;
  const lockedCls = lockedClassId ? CHARACTER_CLASSES.find(c => c.id === lockedClassId) : null;
  const displayCls = lockedCls || playerCls;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  const playerTitleText = activeTitle
    ? activeTitle.text
    : (playerTitleEntry?.title || '');
  const playerTitleColor = activeTitle
    ? activeTitle.color
    : (playerTitleEntry?.titleColor || '#e0a868');

  // Active raids: which bosses are currently active guild-wide
  const activeRaidIds = RAID_BOSSES
    .filter(b => raids[b.id]?.status === 'active')
    .map(b => b.id);

  // Build live guild member cards from DB data
  function memberFromRow(row) {
    const cls = row.locked_class_id
      ? CHARACTER_CLASSES.find(c => c.id === row.locked_class_id) || null
      : null;
    const pathObj = (row.locked_class_id && row.chosen_path_id)
      ? (CLASS_PATHS[row.locked_class_id] || []).find(p => p.id === row.chosen_path_id) || null
      : null;

    // Compute level from logs using same formula as main app
    const memberLogs = row.logs || [];
    // Simple XP estimate: sum base XP across all logs
    const xpTotal = memberLogs.reduce((sum, l) => {
      if (!ACTIVITY_TYPES[l.activity]) return sum;
      if (INTENSITY_ACTIVITIES.has(l.activity)) {
        return sum + (INTENSITY_LEVELS[l.intensity]?.xp || 10);
      }
      if (l.activity === 'running') return sum + Math.round(Math.min(14, 6 + (Number(l.distance) || 0) * 0.65));
      if (l.activity === 'reading') { const p = Number(l.pages)||0; return sum + (p<20?2:p<50?4:p<100?7:p<200?11:p<300?16:22); }
      if (l.activity === 'calories') { const k=Number(l.kcal)||0; return sum+Math.min(8,Math.max(1,1+Math.floor(k/300))); }
      if (l.activity === 'nutrition') return sum + 3;
      if (l.activity === 'sleep') return sum + 3;
      return sum + 4;
    }, 0);
    const level = levelFromTotalXp(xpTotal * 12); // *12 because stats split across 12 axes
    const titleEntry = titleEntryForLevel(level);
    const memberActiveTitle = row.active_title || null;

    const memberRaidIds = Object.entries(row.raids || {})
      .filter(([, r]) => r?.status === 'active')
      .map(([id]) => id);

    return {
      name: row.nickname,
      level: Math.max(1, level),
      cls,
      pathName: pathObj?.name || null,
      physicalHp: 70, // not stored separately — placeholder until full profile sync
      mentalHp: 70,
      titleText: memberActiveTitle?.text || (titleEntry?.title || 'Новичок'),
      titleColor: memberActiveTitle?.color || (titleEntry?.color || '#7a7a82'),
      achievementNames: [],
      raidIds: memberRaidIds,
      isPlayer: false,
      likes: 0,
    };
  }

  const allMembers = [
    {
      name: playerName,
      level: playerLevel,
      cls: displayCls,
      pathName: chosenPath?.name || null,
      physicalHp: playerPhysical,
      mentalHp: playerMental,
      titleText: playerTitleText,
      titleColor: playerTitleColor,
      achievementNames: earnedTitles.slice(0, 3).map(t => t.text),
      raidIds: activeRaidIds,
      isPlayer: true,
    },
    ...guildMembers.map(memberFromRow),
  ];

  const sorted = [
    allMembers[0],
    ...allMembers.slice(1).sort((a, b) => b.level - a.level),
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2a2a1a', border: '1px solid #4a3a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🛡️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0d272' }}>Гильдия Новой Эры</div>
          <div style={{ fontSize: 11, color: '#6a6a72' }}>
            {allMembers.length} {allMembers.length === 1 ? 'боец онлайн' : 'бойцов онлайн'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleRefresh}
            style={{ background: 'none', border: '1px solid #3a3a42', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: refreshing ? '#e0a868' : '#6a6a72' }}
          >
            {refreshing ? '⟳' : '↺'} Обновить
          </button>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid #3a2a2a', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#6a4a4a' }}
            title="Сменить бойца"
          >
            ⏏ Выйти
          </button>
        </div>
      </div>

      {/* Raid overview strip */}
      {RAID_BOSSES.some(b => raids[b.id]?.status === 'active') && (
        <div style={{ background: '#1a1218', border: '1px solid #4a2a3a', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#e05f9c', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>⚔️ Активные рейды гильдии</div>
          {RAID_BOSSES.filter(b => raids[b.id]?.status === 'active').map(boss => {
            const raid = raids[boss.id];
            const raidColor = RAID_RARITY_COLORS[boss.rarity]?.color || '#e05f9c';
            let progress = 0;
            if (boss.condition.type === 'shared_total') {
              const total = raid.contributions.reduce((s, c) => s + c.value, 0);
              progress = Math.min(100, Math.round((total / boss.condition.target) * 100));
            }
            const participantNames = [playerName];
            return (
              <div key={boss.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: raidColor }}>{boss.name}</span>
                  <span style={{ fontSize: 11, color: '#7a7a82' }}>{participantNames.length} уч.</span>
                </div>
                {boss.condition.type === 'shared_total' && (
                  <div>
                    <div style={{ height: 6, background: '#2a2a32', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: raidColor, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72' }}>{progress}% · {participantNames.join(', ')}</div>
                  </div>
                )}
                {boss.condition.type !== 'shared_total' && (
                  <div style={{ fontSize: 10.5, color: '#6a6a72' }}>Участники: {participantNames.join(', ')}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Member cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((member) => {
          const isYou = member.isPlayer;
          const likeCount = (guildLikes[member.name] || 0) + (member.likes || 0);
          const alreadyLiked = likedSet.has(member.name);
          const clsColor = member.cls?.color || '#8a8a92';

          return (
            <div
              key={member.name}
              style={{
                background: isYou ? '#1c1e14' : '#1c1c22',
                border: `1.5px solid ${isYou ? '#3a4a1f' : '#28282f'}`,
                borderRadius: 14, padding: '14px 14px 12px',
                position: 'relative',
              }}
            >
              {/* YOU badge */}
              {isYou && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: '#3a5a1f', border: '1px solid #5a8a2f',
                  borderRadius: 6, padding: '2px 8px',
                  fontSize: 9.5, fontWeight: 800, color: '#a8d86a', letterSpacing: 0.4,
                }}>
                  ВЫ
                </div>
              )}

              {/* Top row: avatar + name + level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: clsColor + '22', border: `1.5px solid ${clsColor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {member.cls ? <member.cls.icon size={20} color={clsColor} /> : <Skull size={20} color="#5a5a62" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f4' }}>{member.name.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 10.5, color: '#7a7a82', fontWeight: 600 }}>Ур.{member.level}</span>
                  </div>
                  {/* Title */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: member.titleColor, marginTop: 1 }}>
                    {member.titleText}
                  </div>
                  {/* Class + path */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {member.cls && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, color: clsColor,
                        background: clsColor + '18', border: `1px solid ${clsColor}44`,
                        borderRadius: 5, padding: '1px 6px',
                      }}>
                        {member.cls.name}
                      </span>
                    )}
                    {member.pathName && (
                      <span style={{ fontSize: 9.5, color: '#7a7a82' }}>· {member.pathName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* HP bars */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6a6a72', marginBottom: 3 }}>
                    <span>❤️ Физ.</span><span>{member.physicalHp}%</span>
                  </div>
                  <div style={{ height: 5, background: '#28282f', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${member.physicalHp}%`, background: '#e05f4a', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6a6a72', marginBottom: 3 }}>
                    <span>🧠 Мент.</span><span>{member.mentalHp}%</span>
                  </div>
                  <div style={{ height: 5, background: '#28282f', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${member.mentalHp}%`, background: '#4f7cff', borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              {/* Achievements row */}
              {member.achievementNames && member.achievementNames.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {member.achievementNames.map((ach, i) => (
                    <span key={i} style={{
                      fontSize: 9.5, background: '#2a2410', border: '1px solid #4a3a1f',
                      borderRadius: 5, padding: '2px 7px', color: '#d4af37',
                    }}>
                      🏅 {ach}
                    </span>
                  ))}
                </div>
              )}

              {/* Raid tags */}
              {member.raidIds && member.raidIds.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {member.raidIds.map(rId => {
                    const boss = RAID_BOSSES.find(b => b.id === rId);
                    if (!boss) return null;
                    const rc = RAID_RARITY_COLORS[boss.rarity]?.color || '#e05f9c';
                    return (
                      <span key={rId} style={{
                        fontSize: 9.5, background: rc + '18', border: `1px solid ${rc}44`,
                        borderRadius: 5, padding: '2px 7px', color: rc,
                      }}>
                        ⚔️ {boss.name.split(' ')[0]}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Like button */}
              {!isYou && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleLike(member.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: alreadyLiked ? '#2a1a3a' : '#1e1e28',
                      border: `1px solid ${alreadyLiked ? '#7a4aaa' : '#3a3a48'}`,
                      borderRadius: 20, padding: '5px 12px',
                      fontSize: 12, fontWeight: 700,
                      color: alreadyLiked ? '#c9a8f5' : '#6a6a82',
                      cursor: alreadyLiked ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{alreadyLiked ? '👍' : '👍'}</span>
                    <span>{likeCount > 0 ? likeCount : ''}</span>
                    <span style={{ fontSize: 10.5 }}>{alreadyLiked ? 'Оценено' : 'Уважуха'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {allMembers.length === 1 && (
        <div style={{ marginTop: 20, padding: '12px 14px', background: '#15151a', border: '1px solid #25252c', borderRadius: 10, fontSize: 11, color: '#4a4a52', textAlign: 'center', lineHeight: 1.6 }}>
          Ты первый в гильдии 🛡️<br/>
          Остальные появятся здесь как только залогинятся.
        </div>
      )}
    </div>
  );
}

// ---------- STYLES ----------

const styles = {
  app: {
    minHeight: '100vh',
    background: '#15151a',
    color: '#e8e8ec',
    fontFamily: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 420,
    margin: '0 auto',
    paddingBottom: 40,
    position: 'relative',
  },
  header: {
    padding: '20px 18px 14px',
    borderBottom: '1px solid #25252c',
  },
  headerRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: '50%',
    background: '#241c10', borderWidth: 1, borderStyle: 'solid', borderColor: '#4a3a1f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  charName: { fontSize: 19, fontWeight: 700, color: '#f0f0f4' },
  charNameBtn: {
    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, maxWidth: '100%',
  },
  charNameInput: {
    fontSize: 19, fontWeight: 700, color: '#f0f0f4', background: '#15151a',
    border: '1px solid #e0a868', borderRadius: 6, padding: '2px 7px',
    outline: 'none', width: '100%', maxWidth: 220,
  },
  charLevel: { fontSize: 12, color: '#8a8a92', marginTop: 1 },
  classBadge: {
    display: 'inline-flex', alignItems: 'center', marginTop: 5,
    border: '1px solid', borderRadius: 7, padding: '2px 8px',
    fontSize: 10.5, fontWeight: 700,
  },
  headerClassStrip: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  headerClassChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 9.5, fontWeight: 700, border: '1px solid',
    borderRadius: 6, padding: '2px 6px', letterSpacing: 0.2,
  },
  headerClassSep: { fontSize: 9, color: '#4a4a52', flexShrink: 0 },
  achBadge: {
    display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600,
    color: '#f0d272', background: '#241c10', border: '1px solid #4a3a1f',
    borderRadius: 20, padding: '6px 11px',
  },
  levelBarWrap: { marginTop: 12 },
  levelBarTrack: {
    height: 10, background: '#24242b', borderRadius: 6, overflow: 'hidden',
    border: '1px solid #2c2c34',
  },
  levelBarFill: {
    height: '100%', borderRadius: 6,
    background: 'linear-gradient(90deg, #c9852f 0%, #e0a868 50%, #f0d272 100%)',
    transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
    boxShadow: '0 0 8px rgba(240,210,114,0.4)',
  },
  levelBarLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, gap: 8 },
  levelBarLabel: { fontSize: 10.5, color: '#7a7a82' },
  currencyBadge: {
    display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#5b9bf0',
    background: '#162236', border: '1px solid #2a3f5c', borderRadius: 8, padding: '2px 7px',
    flexShrink: 0,
  },
  healthBarsWrap: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 },
  healthBarItem: {},
  healthBarLabelRow: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 },
  healthBarLabel: { fontSize: 11, color: '#9a9aa2', flex: 1 },
  healthBarValue: { fontSize: 11, color: '#7a7a82', fontWeight: 600 },
  debuffBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5,
    background: '#3a1424', border: '1px solid #6e2540', borderRadius: 7,
    padding: '3px 8px',
  },
  debuffBadgeText: { fontSize: 10.5, fontWeight: 700, color: '#ff8fa8' },
  xpBlockedBanner: {
    marginTop: 12, padding: '8px 11px', borderRadius: 8, fontSize: 11, lineHeight: 1.4,
    background: '#3a1a1a', border: '1px solid #6a2a2a', color: '#f0a8a8',
  },
  poisonVialsRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    marginTop: 7,
  },
  poisonVialsLabel: { fontSize: 11, fontWeight: 600, color: '#c9a8f5', marginLeft: 3 },
  tabBar: {
    display: 'flex', padding: '0 18px', borderBottom: '1px solid #25252c', gap: 4,
    overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
  },
  tabBtn: {
    background: 'none', border: 'none', padding: '12px 8px', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  },
  content: { padding: '18px 18px 0' },
  sectionLabel: {
    fontSize: 11.5, fontWeight: 700, color: '#6a6a72', textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 12,
  },
  activityGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    gridAutoFlow: 'row dense',
  },
  passiveGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  recoveryWrap: {
    marginTop: 20, padding: '14px 14px 16px', borderRadius: 16,
    background: 'linear-gradient(165deg, #123832 0%, #0f2622 100%)',
    border: '1px solid #1f6e5c', boxShadow: '0 0 0 1px rgba(76,224,192,0.08), 0 8px 24px rgba(15,38,34,0.5)',
  },
  recoverySectionHeader: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, flexWrap: 'wrap' },
  recoverySectionTitle: { fontSize: 13.5, fontWeight: 700, color: '#4ce0c0' },
  recoverySectionSub: { fontSize: 10.5, color: '#5fa896' },
  recoveryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  recoveryCard: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#0f2622aa',
    border: '1px solid #1f6e5c88', borderRadius: 10, padding: '10px 11px',
    cursor: 'pointer', textAlign: 'left',
  },
  recoveryCardLabel: { fontSize: 12, fontWeight: 600, color: '#d6f5ec', lineHeight: 1.25 },
  passiveCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    border: '1px solid', borderRadius: 12, padding: '12px 6px', cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  passiveLabel: { fontSize: 11.5, fontWeight: 600 },
  activityCard: {
    position: 'relative', background: '#212128', border: '1px solid #323240',
    borderRadius: 14, padding: '14px 12px', textAlign: 'left', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: 8, color: 'inherit',
  },
  cardPlusBtn: {
    position: 'absolute', top: 10, right: 10, background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, zIndex: 2,
  },
  cardExpand: {
    display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4,
    paddingTop: 10, borderTop: '1px solid #25252c', animation: 'fadeUp 0.2s ease',
  },
  cardExpandEmpty: { fontSize: 11, color: '#5a5a62' },
  bookTrackerWrap: { marginTop: 4, paddingTop: 10, borderTop: '1px solid #25252c' },
  bookTrackerLabel: { fontSize: 11, color: '#9a9aa2', marginBottom: 8, fontWeight: 600 },
  bookInputRow: { display: 'flex', gap: 6, marginBottom: 8 },
  bookInput: {
    flex: 1, background: '#15151a', border: '1px solid #2c2c34', borderRadius: 8,
    padding: '7px 10px', color: '#f0f0f4', fontSize: 12.5, outline: 'none',
  },
  bookAddBtn: {
    background: '#e0a868', border: 'none', borderRadius: 8, width: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  bookList: { display: 'flex', flexDirection: 'column', gap: 6 },
  bookRow: { display: 'flex', alignItems: 'center', gap: 8 },
  bookCheck: {
    width: 18, height: 18, borderRadius: 5, border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  bookTitle: { fontSize: 12.5, color: '#dcdce2', flex: 1 },
  bookRemoveBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 },
  miniProgressBlock: {},
  miniProgressLabelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 6 },
  miniProgressLabel: { fontSize: 11, color: '#9a9aa2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  miniProgressValue: { fontSize: 11, color: '#7a7a82', fontWeight: 600, flexShrink: 0 },
  activityIconWrap: {
    width: 34, height: 34, borderRadius: 9, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  activityIconBg: {
    position: 'absolute', top: -6, right: -8, opacity: 0.32,
    pointerEvents: 'none',
  },
  activityCardLabel: {
    fontSize: 15.5, fontWeight: 700, color: '#f0f0f4', lineHeight: 1.25,
    position: 'relative', maxWidth: '78%',
  },
  streakPill: {
    display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
    color: '#e0a868', background: '#241c10', borderRadius: 10, padding: '2px 7px',
    alignSelf: 'flex-start', gap: 3,
  },
  statGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  radarWrap: {
    background: '#1c1c22', border: '1px solid #28282f', borderRadius: 14,
    padding: '16px 8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  radarLegend: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', marginTop: 10 },
  radarLegendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9a9aa2' },
  radarLegendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  equippedGearWrap: {
    background: '#1c1c22', border: '1px solid #28282f', borderRadius: 14,
    padding: '16px', display: 'flex', flexDirection: 'column', gap: 14,
  },
  equippedCardsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  equippedGearCard: {
    border: '1px solid', borderRadius: 12, padding: '14px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
  },
  equippedGearIconWrap: {
    width: 52, height: 52, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  equippedGearSlotLabel: { fontSize: 9, color: '#7a7a82', textTransform: 'uppercase', letterSpacing: 0.4 },
  equippedGearItemName: { fontSize: 11, fontWeight: 700, lineHeight: 1.25, minHeight: 28 },
  equippedBonusSummary: { borderTop: '1px solid #28282f', paddingTop: 12 },
  equippedBonusSummaryTitle: {
    fontSize: 10.5, fontWeight: 700, color: '#6a6a72', textTransform: 'uppercase',
    letterSpacing: 0.4, marginBottom: 8,
  },
  equippedBonusList: { display: 'flex', flexDirection: 'column', gap: 6 },
  equippedBonusRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 11px', background: '#15151a', borderRadius: 8,
  },
  equippedBonusActivity: { fontSize: 12, color: '#dcdce2', fontWeight: 600 },
  equippedBonusValue: { fontSize: 12.5, color: '#5b9bf0', fontWeight: 700 },
  equippedEmptyHint: { fontSize: 11.5, color: '#7a7a82', textAlign: 'center', lineHeight: 1.5 },
  classCardWrap: {
    display: 'flex', alignItems: 'center', gap: 14, border: '2px solid #28282f',
    background: '#1c1c22', borderRadius: 14, padding: '16px 16px',
  },
  classCardEmpty: { fontSize: 12.5, color: '#7a7a82', textAlign: 'center', width: '100%' },
  classCardIconWrap: {
    width: 60, height: 60, borderRadius: 14, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  classCardName: { fontSize: 19, fontWeight: 800, marginBottom: 3, letterSpacing: 0.2 },
  classCardComboTag: {
    display: 'inline-block', fontSize: 9.5, fontWeight: 800, color: '#15151a',
    background: '#f5c84a', borderRadius: 5, padding: '2px 6px', marginRight: 7,
    verticalAlign: 'middle', letterSpacing: 0.4,
  },
  classCardDesc: { fontSize: 11.5, color: '#9a9aa2', lineHeight: 1.4 },
  statRow: {},
  statLabelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  statLabel: { fontSize: 12.5, color: '#aeaeb6' },
  statValue: { fontSize: 12.5, color: '#7a7a82', fontWeight: 600 },
  statBarTrack: { height: 6, background: '#24242b', borderRadius: 4, overflow: 'hidden' },
  statBarFill: { height: '100%', background: '#7a6ae0', borderRadius: 4, transition: 'width 0.4s ease' },
  progressRow: {
    background: '#1c1c22', border: '1px solid #28282f', borderRadius: 12,
    padding: '12px 14px', display: 'flex', gap: 10,
  },
  progressTitle: { fontSize: 13, fontWeight: 600, color: '#dcdce2', marginBottom: 3 },
  progressSub: { fontSize: 11.5, color: '#8a8a92', marginBottom: 7 },
  achSection: { marginBottom: 30 },
  mythicHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  mythicHeaderTitle: { fontSize: 14, fontWeight: 700, color: '#f5c84a' },
  mythicHeaderCount: {
    fontSize: 11, fontWeight: 700, color: '#1c1505', background: '#f5c84a',
    borderRadius: 9, padding: '1px 8px', marginLeft: 2,
  },
  mythicCard: {
    border: '1.5px solid', borderRadius: 14, padding: '14px 14px',
    textAlign: 'left', width: '100%', cursor: 'pointer',
  },
  mythicCardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  mythicTitle: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 },
  mythicCharacter: { fontSize: 11, color: '#8a8a92', marginTop: 2 },
  mythicExpand: {
    marginTop: 12, paddingTop: 12, borderTop: '1px solid #2c2c34',
    animation: 'fadeUp 0.2s ease',
  },
  mythicConditionLabel: {
    fontSize: 10, fontWeight: 700, color: '#6a6a72', textTransform: 'uppercase',
    letterSpacing: 0.4, marginBottom: 4,
  },
  mythicConditionText: { fontSize: 12, color: '#9a9aa2', lineHeight: 1.5, marginBottom: 10 },
  mythicQuote: {
    fontSize: 12.5, color: '#f0d272', fontStyle: 'italic', lineHeight: 1.5,
    paddingTop: 8, borderTop: '1px solid #3a2f10',
  },
  classTreeHint: {
    fontSize: 11.5, color: '#7a7a82', lineHeight: 1.5, marginBottom: 20, textAlign: 'center',
  },
  classTreeSection: { marginBottom: 24 },
  classTreeNode: {
    display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid',
    borderRadius: 14, padding: '12px 14px',
  },
  classTreeNodeIconWrap: {
    width: 42, height: 42, borderRadius: 11, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  classTreeNodeName: { fontSize: 15, fontWeight: 800 },
  classTreeNodeGroup: { fontSize: 11, color: '#8a8a92', marginTop: 1 },
  classTreeActiveBadge: {
    fontSize: 9.5, fontWeight: 800, color: '#15151a', borderRadius: 6,
    padding: '3px 8px', flexShrink: 0,
  },
  classTreeBranchLine: {
    width: 2, height: 14, background: '#28282f', marginLeft: 27,
  },
  classTreeItemsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginLeft: 8 },
  classTreeItemCard: {
    border: '1px solid', borderRadius: 12, padding: '12px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
  },
  classTreeItemName: { fontSize: 11, fontWeight: 700, color: '#dcdce2', lineHeight: 1.25, minHeight: 28 },
  shopBalanceWrap: {
    display: 'flex', alignItems: 'center', gap: 6, background: '#162236',
    border: '1px solid #2a3f5c', borderRadius: 12, padding: '10px 14px', marginBottom: 18,
  },
  shopBalanceValue: { fontSize: 17, fontWeight: 700, color: '#5b9bf0' },
  shopBalanceLabel: { fontSize: 12, color: '#7a8fa8' },
  shopRarityTabs: {
    display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', overflowY: 'hidden',
    scrollbarWidth: 'none', paddingBottom: 2,
  },
  shopRarityTabBtn: {
    display: 'flex', alignItems: 'center', gap: 5, border: '1px solid', borderRadius: 9,
    padding: '7px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  shopRarityTabCount: { fontSize: 9.5, opacity: 0.7, marginLeft: 1 },
  shopRaritySectionHeader: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 },
  shopRaritySectionDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  shopRaritySectionTitle: { fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 },
  shopRaritySectionCount: { fontSize: 10.5, color: '#6a6a72', marginLeft: 'auto' },
  shopGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 },
  shopCard: {
    border: '1px solid', borderRadius: 11, padding: '9px 6px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center',
  },
  shopCardIconWrap: {
    width: 30, height: 30, borderRadius: 8, display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: 1,
  },
  shopItemName: { fontSize: 10, fontWeight: 600, color: '#dcdce2', lineHeight: 1.2, minHeight: 24 },
  shopItemBonus: { fontSize: 8.5, color: '#7a7a82', lineHeight: 1.2 },
  shopItemLockedHint: { fontSize: 8.5, color: '#6a6a72', fontStyle: 'italic', lineHeight: 1.2 },
  shopActionBtnSmall: {
    marginTop: 4, border: '1px solid', borderRadius: 7, padding: '4px 6px',
    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  hallOfFameWrap: { marginBottom: 26 },
  hallOfFameHeader: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 },
  hallOfFameTitle: { fontSize: 13, fontWeight: 700, color: '#d4af37' },
  hallOfFameCount: {
    fontSize: 10.5, fontWeight: 700, color: '#0f0c05', background: '#d4af37',
    borderRadius: 9, padding: '1px 7px', marginLeft: 2,
  },
  hallOfFameScroll: {
    display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden',
    paddingBottom: 4, scrollbarWidth: 'none',
  },
  hallOfFameMedal: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    border: '1px solid', borderRadius: 10, padding: '8px 10px',
    flexShrink: 0, minWidth: 64, maxWidth: 84,
  },
  hallOfFameMedalName: {
    fontSize: 9.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
  },
  achSectionHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
    paddingBottom: 8, borderBottom: '1px solid #25252c',
  },
  achSectionTitle: { fontSize: 14, fontWeight: 700 },
  secretGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  secretCard: {
    border: '1px solid', borderRadius: 12, padding: '12px 10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
  },
  secretTitle: { fontSize: 11.5, fontWeight: 700, lineHeight: 1.25 },
  secretHint: { fontSize: 10, color: '#6a6a72', lineHeight: 1.3 },
  comboList: { display: 'flex', flexDirection: 'column', gap: 8 },
  comboCard: { border: '1px solid', borderRadius: 12, padding: '10px 12px' },
  comboCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  comboTitle: { fontSize: 12.5, fontWeight: 700 },
  comboCount: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color: '#e0a868', flexShrink: 0 },
  comboReward: { fontSize: 11, color: '#7a7a82' },
  comboCondition: {
    fontSize: 11, color: '#9a9aa2', marginTop: 8, paddingTop: 8,
    borderTop: '1px solid #2c2c34', lineHeight: 1.4, animation: 'fadeUp 0.2s ease',
  },
  pentaCard: { border: '1.5px solid', borderRadius: 12, padding: '12px 14px' },
  achGroup: { marginBottom: 22 },
  achGroupHeader: {
    fontSize: 13.5, fontWeight: 600, color: '#dcdce2', marginBottom: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6,
  },
  achFlavor: { fontSize: 11, color: '#6a6a72', fontWeight: 400 },
  tierRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  achGroupProgress: { marginTop: 10 },
  tierCard: {
    flex: '1 1 90px', minWidth: 90, border: '1px solid', borderRadius: 12,
    padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
  },
  tierName: { fontSize: 11.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.25 },
  tierNeed: { fontSize: 10.5, color: '#6a6a72' },
  historyRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
    borderBottom: '1px solid #202026',
  },
  historyLabel: { fontSize: 13.5, fontWeight: 600, color: '#dcdce2' },
  historyDate: { fontSize: 11.5, color: '#7a7a82', marginTop: 2, display: 'flex', alignItems: 'center' },
  emptyState: { fontSize: 13, color: '#7a7a82', textAlign: 'center', padding: '40px 20px' },
  archiveEmptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    textAlign: 'center', padding: '50px 24px', color: '#9a9aa2',
  },
  archiveEmptyTitle: { fontSize: 15, fontWeight: 700, color: '#dcdce2' },
  archiveEmptyText: { fontSize: 12.5, lineHeight: 1.6, maxWidth: 280 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
  },
  modalCard: {
    background: '#1c1c22', border: '1px solid #2c2c34', borderRadius: 16,
    padding: 20, width: '100%', maxWidth: 360, animation: 'popIn 0.2s ease',
  },
  modalHeader: { display: 'flex', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontWeight: 600, color: '#f0f0f4' },
  modalSub: { fontSize: 12, color: '#8a8a92', marginTop: 1 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  fieldLabel: { fontSize: 12, color: '#aeaeb6', display: 'block', marginBottom: 6 },
  input: {
    width: '100%', background: '#15151a', border: '1px solid #2c2c34', borderRadius: 10,
    padding: '10px 12px', color: '#f0f0f4', fontSize: 15, outline: 'none',
  },
  strictSleepRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
  },
  strictSleepCheck: {
    width: 18, height: 18, borderRadius: 5, border: '1px solid', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  strictSleepLabel: { fontSize: 12.5, color: '#aeaeb6' },
  intensityRow: { display: 'flex', gap: 6 },
  intensityBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid', borderRadius: 10, padding: '10px 6px', fontSize: 12,
    cursor: 'pointer', transition: 'all 0.15s ease',
  },
  statsPreview: {
    display: 'flex', alignItems: 'center', fontSize: 11.5, color: '#6a6a72',
    marginTop: 16, padding: '8px 10px', background: '#15151a', borderRadius: 8,
  },
  submitBtn: {
    width: '100%', marginTop: 16, background: '#e0a868', color: '#1c1505',
    border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14.5,
    fontWeight: 700, cursor: 'pointer',
  },
  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: '#1c1c22', border: '1px solid #4a3a1f', borderRadius: 30,
    padding: '10px 18px', fontSize: 13, color: '#f0d272', display: 'flex',
    alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    animation: 'fadeUp 0.25s ease', zIndex: 60,
  },
};
