// ---------- MYTHIC ACHIEVEMENTS ----------
import { ACHIEVEMENTS } from './achievements';

// ---------- MYTHIC ACHIEVEMENTS ----------
// One-time, anime-themed legendary achievements. Conditions are visible even before unlocking
// (unlike secret achievements); the quote is revealed only after unlocking.
export const MYTHIC_ACHIEVEMENTS = [
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
  {
    id: 'mythic_full_wall',
    title: 'ПОЛНАЯ СТЕНА',
    character: 'Стена подвигов',
    description: 'Установи хотя бы один рекорд в каждой категории Стены подвигов',
    quote: 'Каждый камень в этой стене — день, который ты не сдался.',
    rewards: { 'all': 30 },
    check: (ctx) => Object.values(ctx.personalRecords || {}).filter(r => (r?.value || 0) > 0).length >= ctx.totalRecordCategories,
  },
];

