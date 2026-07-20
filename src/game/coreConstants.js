// ---------- CORE: типы активностей, интенсивность, здоровье, восстановление ----------
import { Flame, Dumbbell, Salad, Moon, BookOpen, Swords, Zap, Pizza, Cookie, Footprints, Wind, PersonStanding, Music, Users, HeartHandshake, Plane, Trees, Palette, Gauge } from 'lucide-react';

// ---------- ACHIEVEMENT DEFINITIONS ----------

export const ACTIVITY_TYPES = {
  running: {
    label: 'Бег',
    icon: Flame,
    color: '#e8633c',
    bgImage: '/icons/activities/running.webp',
    stats: ['Выносливость', 'Воля'],
    logFields: [{ key: 'distance', label: 'Дистанция, км', type: 'number' }],
  },
  strength_park: {
    label: 'Силовая (турники/парк)',
    icon: Dumbbell,
    color: '#7ab85a',
    bgImage: '/icons/activities/strength_park.webp',
    stats: ['Сила', 'Упорство'],
    logFields: [],
  },
  strength_gym: {
    label: 'Силовая (зал)',
    icon: Dumbbell,
    color: '#e89040',
    bgImage: '/icons/activities/strength_gym.webp',
    stats: ['Сила', 'Упорство'],
    logFields: [],
  },
  wrestling: {
    label: 'Борьба / единоборства',
    icon: Swords,
    color: '#8a5cf6',
    bgImage: '/icons/activities/wrestling.webp',
    stats: ['Силовая выносливость', 'Гибкость'],
    logFields: [],
  },
  nutrition: {
    label: 'Здоровое питание',
    icon: Salad,
    color: '#4caf6d',
    bgImage: '/icons/activities/nutrition.webp',
    stats: ['Фокус', 'Дисциплина'],
    logFields: [],
  },
  sleep: {
    label: 'Здоровый сон',
    icon: Moon,
    color: '#4f7cff',
    bgImage: '/icons/activities/sleep.webp',
    stats: ['Дух', 'ХП'],
    logFields: [],
  },
  reading: {
    label: 'Чтение',
    icon: BookOpen,
    color: '#d6558c',
    bgImage: '/icons/activities/reading.webp',
    stats: ['Интеллект', 'Мышление'],
    logFields: [{ key: 'pages', label: 'Страниц', type: 'number' }],
  },
  calories: {
    label: 'Пепел калорий',
    icon: Gauge,
    color: '#ff6b35',
    bgImage: '/icons/activities/calories.webp',
    stats: [],
    logFields: [{ key: 'kcal', label: 'Сожжено ккал', type: 'number' }],
  },
  walking: {
    label: 'Ходьба / шаги',
    icon: Footprints,
    color: '#64b5f6',
    bgImage: '/icons/activities/walking.webp',
    stats: [], // не влияет на статы и класс
    logFields: [{ key: 'steps', label: 'Шаги', type: 'number' }],
  },
};

// Intensity levels for strength/wrestling logs — replaces flat base XP.
// Selected in LogModal; defaults to 'medium' if unset (for older logs before this field existed).
export const INTENSITY_LEVELS = {
  light:  { label: 'Лёгкая',  xp: 9,  color: '#5fb884' },
  medium: { label: 'Средняя', xp: 12, color: '#c9a227' },
  hard:   { label: 'Тяжёлая', xp: 15, color: '#e8633c' },
};
export const INTENSITY_ACTIVITIES = new Set(['strength_park', 'strength_gym', 'wrestling']);

// Шаги: XP = (шаги/1000) × BASE_STEPS_XP_MULTIPLIER. Подобрано так, что 10000 шагов ≈ 30-40%
// от XP средней тренировки (10 XP) — 10 × 0.35 = 3.5 XP.
export const BASE_STEPS_XP_MULTIPLIER = 0.35;

// Which activities restore which health bar, and by how much per session.
// Mental health is restored only by sleep and reading (nutrition no longer contributes).
export const PHYSICAL_HEALTH_SOURCES = { running: 5, strength_park: 5, strength_gym: 5, wrestling: 5, sleep: 4 };
export const MENTAL_HEALTH_SOURCES = { sleep: 5, reading: 5 };

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
export const RECOVERY_TIER_EFFECTS = {
  short: { stacksRemoved: 1, baseMental: 5,  basePhysical: 2 },
  long:  { stacksRemoved: 2, baseMental: 10, basePhysical: 5 },
  rest:  { stacksRemoved: 1, baseMental: 1,  basePhysical: 1 },
  fatigue_relief: { stacksRemoved: 1, baseMental: 2, basePhysical: 5, targetFatigue: true },
};

export const RECOVERY_TYPES = {
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
  good_sleep:  { label: 'Выспался',             icon: Moon,           tier: 'fatigue_relief' },
};

export const PASSIVE_TYPES = {
  stress: { label: 'Стресс', icon: Zap, affects: 'mental', bgImage: '/icons/debuffs/stress.webp' },
  sleep_debt: { label: 'Недосып', icon: Moon, affects: 'physical', bgImage: '/icons/debuffs/sleep_debt.webp' },
  overeating: { label: 'Зажор', icon: Pizza, affects: 'poison', bgImage: '/icons/debuffs/overeating.webp' },
  cheat_meal: { label: 'Читмил', icon: Cookie, affects: 'cheat', bgImage: '/icons/debuffs/cheat_meal.webp' },
  stagnation: { label: 'Апатия (день без единой активности)', icon: Wind, affects: 'mental' },
};

export const CHEAT_MEAL_SAFE_INTERVAL_DAYS = 14;

export const POISON_THRESHOLD = 5;
export const POISON_PENALTY_PER_STAT = 10;

