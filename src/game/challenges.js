// ---------- ИСПЫТАНИЯ ДУХА (клятвы) ----------
import { Flame, Dumbbell, Salad, Moon, BookOpen, Check, Star } from 'lucide-react';

// ---------- CHALLENGES: "Испытание духа" ----------
// One active challenge at a time. Cannot cancel — only complete or fail.
// Unlocks at level 5. Allowed misses: 7-day=0, 14-day=1, 30-day=2.
// Success: crystals + temporary buff + achievement progress. Some grant a title.
// Failure: debuff "Сломленная клятва" 3 days (−10% XP) + 3-day cooldown.
// Buffs from challenges do NOT stack (one challenge = one buff at a time).
export const CHALLENGE_MIN_LEVEL = 5;
export const CHALLENGE_FAIL_DEBUFF_DAYS = 3; // "Сломленная клятва" duration
export const CHALLENGE_FAIL_COOLDOWN_DAYS = 3; // can't start new challenge for 3 days after fail

export const CHALLENGE_CATEGORIES = [
  { id: 'nutrition', label: 'Питание', icon: Salad, color: '#4caf6d' },
  { id: 'running', label: 'Бег', icon: Flame, color: '#e8633c' },
  { id: 'strength', label: 'Силовые', icon: Dumbbell, color: '#c9a227' },
  { id: 'sleep', label: 'Сон и режим', icon: Moon, color: '#4f7cff' },
  { id: 'reading', label: 'Чтение', icon: BookOpen, color: '#d6558c' },
  { id: 'complex', label: 'Комплексные', icon: Star, color: '#e0a868' },
];

// checkDay(log, allLogsForDay, dayIndex, challenge) → boolean — did this day count?
// checkComplete(dayResults, challenge) → boolean — is the full challenge done?
export const CHALLENGE_CATALOG = [
  // ===== ПИТАНИЕ =====
  {
    id: 'ch_nutrition_rhythm', category: 'nutrition', duration: 14,
    name: 'Ритм перекуса', quote: 'Моё тело — храм. Храм шаурмы',
    description: 'Каждый день логировать питание в норме калорий',
    allowedMisses: 1,
    crystals: 120,
    buff: { name: 'Чистый как ПП', xpBonusPct: 15, scope: 'all', days: 5 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'nutrition' && l.inNorm),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_nutrition_sugar', category: 'nutrition', duration: 7,
    name: 'Сахарный мой', quote: 'Уничтожу бледного демона',
    description: 'Каждый день отмечать галочку «без сахара»',
    allowedMisses: 0,
    crystals: 60,
    buff: { name: 'Сегодня без диабета', xpBonusPct: 10, scope: 'all', days: 3 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'nutrition' && l.noSugar),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_nutrition_total', category: 'nutrition', duration: 30,
    name: 'Тоталитарное питание', quote: 'Сжечь калории. Все. Всех',
    description: 'Логировать питание в норме калорий каждый день',
    allowedMisses: 2,
    crystals: 250, title: 'Железная воля',
    buff: { name: 'Товарищ Дисциплина', xpBonusPct: 10, scope: 'all', days: 7 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'nutrition' && l.inNorm),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  // ===== БЕГ =====
  {
    id: 'ch_run_rhythm', category: 'running', duration: 7,
    name: 'Ритм сердца', quote: 'Начинаю путь. Надел кроссовки',
    description: '3 пробежки за неделю, каждая минимум 3 км',
    allowedMisses: 0, countBased: true, countGoal: 3,
    crystals: 60,
    buff: { name: 'Второе дыхание', xpBonusPct: 15, scope: 'running', days: 3 },
    // Non-daily: check at completion
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'running' && (Number(l.distance) || 0) >= 3),
    checkComplete: (dayResults) => dayResults.filter(Boolean).length >= 3,
  },
  {
    id: 'ch_run_endure', category: 'running', duration: 14,
    name: 'Осилит бегущий', quote: 'Осилю вот это вот всё',
    description: '6 пробежек за 14 дней, каждая минимум 40 минут',
    allowedMisses: 1, countBased: true, countGoal: 6,
    crystals: 130,
    buff: { name: 'Ветер в спину', xpBonusPct: 20, scope: 'running', days: 5 },
    // "40 минут" — мы проверяем по наличию пробежки (доверяем игроку)
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'running'),
    checkComplete: (dayResults) => dayResults.filter(Boolean).length >= 6,
  },
  {
    id: 'ch_run_spirit', category: 'running', duration: 30,
    name: 'Дух дорог', quote: 'Прибегу к самому себе или прибежал, не помню',
    description: '14 пробежек за 30 дней, каждая минимум 45 мин, суммарно 100+ км',
    allowedMisses: 2, countBased: true, countGoal: 14,
    crystals: 280, title: 'Батя ветров',
    buff: { name: 'Неутомимый', xpBonusPct: 15, scope: 'running', days: 7 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'running'),
    checkComplete: (dayResults, ch, allLogs) => {
      if (dayResults.filter(Boolean).length < 14) return false;
      // Check total km during challenge period
      const totalKm = allLogs
        .filter(l => l.activity === 'running')
        .reduce((s, l) => s + (Number(l.distance) || 0), 0);
      return totalKm >= 100;
    },
  },
  // ===== СИЛОВЫЕ =====
  {
    id: 'ch_str_rhythm', category: 'strength', duration: 7,
    name: 'Ритм мускул', quote: 'Штанга не спрашивает, как у тебя дела. Я спрашиваю',
    description: '4 силовые за 7 дней, каждая минимум средняя',
    allowedMisses: 0, countBased: true, countGoal: 4,
    crystals: 70,
    buff: { name: 'Стальные мышцы', xpBonusPct: 15, scope: 'strength', days: 3 },
    checkDay: (logsForDay) => logsForDay.some(l =>
      (l.activity === 'strength_park' || l.activity === 'strength_gym') &&
      (l.intensity === 'medium' || l.intensity === 'hard')
    ),
    checkComplete: (dayResults) => dayResults.filter(Boolean).length >= 4,
  },
  {
    id: 'ch_str_oath', category: 'strength', duration: 14,
    name: 'Клятва силача', quote: 'Не тот силён, кто поднимает больше. А тот, кто поднимает каждый день.',
    description: '8 силовых за 14 дней, каждая минимум средняя',
    allowedMisses: 1, countBased: true, countGoal: 8,
    crystals: 140,
    buff: { name: 'Ярость контролируемая', xpBonusPct: 20, scope: 'strength', days: 5 },
    checkDay: (logsForDay) => logsForDay.some(l =>
      (l.activity === 'strength_park' || l.activity === 'strength_gym') &&
      (l.intensity === 'medium' || l.intensity === 'hard')
    ),
    checkComplete: (dayResults) => dayResults.filter(Boolean).length >= 8,
  },
  {
    id: 'ch_str_titan', category: 'strength', duration: 30,
    name: 'Титан братан', quote: 'Через 30 дней зеркало покажет кого-то другого. И я разобью его...настолько я силен',
    description: '16 силовых за 30 дней, каждая тяжёлая',
    allowedMisses: 2, countBased: true, countGoal: 16,
    crystals: 300, title: 'Несокрушимый пупсик',
    buff: { name: 'Тело титана', xpBonusPct: 15, scope: 'strength_wrestling', days: 7 },
    checkDay: (logsForDay) => logsForDay.some(l =>
      (l.activity === 'strength_park' || l.activity === 'strength_gym') &&
      l.intensity === 'hard'
    ),
    checkComplete: (dayResults) => dayResults.filter(Boolean).length >= 16,
  },
  // ===== СОН =====
  {
    id: 'ch_sleep_rhythm', category: 'sleep', duration: 7,
    name: 'Ритм морфея', quote: 'Ложиться вовремя — тяжелее становой',
    description: '7 дней подряд сон 7-9 часов, отбой до 23:30',
    allowedMisses: 0,
    crystals: 80,
    buff: { name: 'Ясный мой свет', xpBonusPct: 10, scope: 'all', days: 3 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'sleep'),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_sleep_again', category: 'sleep', duration: 14,
    name: 'И снова седая ночь', quote: 'Режим - друг. Внезапно.',
    description: '14 дней подряд сон 7-9 часов, отбой до 00:00',
    allowedMisses: 1,
    crystals: 130,
    buff: { name: 'Биоритм', xpBonusPct: 5, scope: 'all', days: 5, hpRestore: 15 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'sleep'),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_sleep_quiet', category: 'sleep', duration: 30,
    name: 'Тихий час', quote: 'Месяц нормального сна. Как в детстве',
    description: '30 дней подряд сон 7+ часов, отбой до 00:00',
    allowedMisses: 2,
    crystals: 250, title: 'Повелитель лежачих',
    buff: { name: 'Глубокий покой', xpBonusPct: 10, scope: 'all', days: 7, hpRestore: 10 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'sleep'),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  // ===== ЧТЕНИЕ =====
  {
    id: 'ch_read_rhythm', category: 'reading', duration: 7,
    name: 'Ритм типографии', quote: '140 страниц за неделю. Ничоси',
    description: 'Читать каждый день, минимум 20 страниц',
    allowedMisses: 0,
    crystals: 60,
    buff: { name: 'Острый ум', xpBonusPct: 15, scope: 'reading', days: 3 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'reading' && (Number(l.pages) || 0) >= 20),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_read_bookga', category: 'reading', duration: 30,
    name: 'Книгга', quote: 'За месяц — минимум две книги. Через год — двадцать четыре. Через пять лет ты опасен. Наверное',
    description: 'Читать минимум 15 страниц каждый день',
    allowedMisses: 2,
    crystals: 220, title: 'Мудрец, на кровати чтец',
    buff: { name: 'Эрудит', xpBonusPct: 10, scope: 'all', days: 7 },
    checkDay: (logsForDay) => logsForDay.some(l => l.activity === 'reading' && (Number(l.pages) || 0) >= 15),
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  // ===== КОМПЛЕКСНЫЕ =====
  {
    id: 'ch_complex_control', category: 'complex', duration: 7,
    name: 'Контролер.', quote: 'Передаём за билетики',
    description: 'Каждый день минимум 2 разные активности + сон до 00:00',
    allowedMisses: 0,
    crystals: 90,
    buff: { name: 'Гармония', xpBonusPct: 10, scope: 'all', days: 3 },
    checkDay: (logsForDay) => {
      const uniqueActivities = new Set(logsForDay.map(l => l.activity));
      const hasSleep = logsForDay.some(l => l.activity === 'sleep');
      return uniqueActivities.size >= 2 && hasSleep;
    },
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_complex_mixed', category: 'complex', duration: 14,
    name: 'Намешано во мне', quote: 'Где я? Что я?',
    description: 'Каждый день минимум 1 физическая (бег/сила/борьба/10000+ шагов) + питание в норме',
    allowedMisses: 1,
    crystals: 150,
    buff: { name: 'Дух мультипотенциала', xpBonusPct: 15, scope: 'all', days: 5 },
    checkDay: (logsForDay) => {
      const hasPhysical = logsForDay.some(l =>
        l.activity === 'running' || l.activity === 'strength_park' ||
        l.activity === 'strength_gym' || l.activity === 'wrestling'
      );
      const hasNutrition = logsForDay.some(l => l.activity === 'nutrition' && l.inNorm);
      return hasPhysical && hasNutrition;
    },
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
  {
    id: 'ch_complex_absolute', category: 'complex', duration: 30,
    name: 'Абсолютли', quote: 'Он смог и ты сможешь',
    description: 'Каждый день: 1 физическая + питание в норме + сон до 00:00 + 5000 шагов',
    allowedMisses: 2,
    crystals: 350, title: 'Уот так уот. Абсолютли',
    buff: { name: 'Мистер вселенная', xpBonusPct: 20, scope: 'all', days: 7 },
    checkDay: (logsForDay) => {
      const hasPhysical = logsForDay.some(l =>
        l.activity === 'running' || l.activity === 'strength_park' ||
        l.activity === 'strength_gym' || l.activity === 'wrestling'
      );
      const hasNutrition = logsForDay.some(l => l.activity === 'nutrition' && l.inNorm);
      const hasSleep = logsForDay.some(l => l.activity === 'sleep');
      return hasPhysical && hasNutrition && hasSleep;
    },
    checkComplete: (dayResults, ch) => {
      const missed = dayResults.filter(d => !d).length;
      return missed <= (ch.allowedMisses || 0);
    },
  },
];
// Автоматически проставляем путь к иконке по id, если она не задана явно.
// Так новые арты клятв достаточно положить в public/icons/challenges/{id}.webp — без правок кода.
CHALLENGE_CATALOG.forEach((c) => { if (!c.icon) c.icon = `/icons/challenges/${c.id}.webp`; });

// Challenge-specific achievements
export const CHALLENGE_ACHIEVEMENTS = [
  { id: 'ch_ach_first', title: 'Клятвушка', description: 'Заверши первый вызов', need: 1, kind: 'total' },
  { id: 'ch_ach_five', title: 'Силен батон', description: 'Заверши 5 вызовов', need: 5, kind: 'total' },
  { id: 'ch_ach_ten', title: 'Из таких людей гвозди делать', description: 'Заверши 10 вызовов', need: 10, kind: 'total' },
  { id: 'ch_ach_variety', title: 'Клятва разнообразия', description: 'Заверши вызов из каждой категории', need: 6, kind: 'categories' },
  { id: 'ch_ach_perfect30', title: 'Пффф, делов-то', description: 'Заверши 30-дневный вызов с 0 пропусками', need: 1, kind: 'perfect30' },
  { id: 'ch_ach_risen', title: 'Восставший из ада', description: 'Заверши вызов сразу после провала предыдущего', need: 1, kind: 'risen', secret: true },
  { id: 'ch_ach_absolute', title: 'УОТ ТАК УОТ!', description: 'Заверши «Абсолютли»', need: 1, kind: 'specific', challengeId: 'ch_complex_absolute', mythic: true },
];

