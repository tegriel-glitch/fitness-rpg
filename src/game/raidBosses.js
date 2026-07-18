// ---------- РЕЙД-БОССЫ и добыча ----------
import { Shield, Star, Crown } from 'lucide-react';
import { ACTIVITY_TYPES } from './coreConstants';
import { SHOP_ITEMS } from './shop';

// ---------- RAID BOSSES ----------
export const RAID_LOOT_BY_CLASS = {
  boar: {
    pathfinder:  { name: 'Наручи Вепря',          itemId: 'raid_boar_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 4, 'Воля': 2 }, image: '/icons/loot/boar/raid_boar_pathfinder.webp' },
    berserker:   { name: 'Клык Вепря',             itemId: 'raid_boar_berserker',    slot: 'weapon',    stats: { 'Сила': 4, 'Упорство': 2 }, image: '/icons/loot/boar/raid_boar_berserker.webp' },
    monk:        { name: 'Оберег Вепря',           itemId: 'raid_boar_monk',         slot: 'accessory', stats: { 'Фокус': 4, 'Дисциплина': 2 }, image: '/icons/loot/boar/raid_boar_monk.webp' },
    shaman:      { name: 'Тотем Вепря',            itemId: 'raid_boar_shaman',       slot: 'accessory', stats: { 'Дух': 4, 'ХП': 2 }, image: '/icons/loot/boar/raid_boar_shaman.webp' },
    battlemaster:{ name: 'Кистень Вепря',          itemId: 'raid_boar_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 4, 'Гибкость': 2 }, image: '/icons/loot/boar/raid_boar_battlemaster.webp' },
    archmage:    { name: 'Глаз Вепря',             itemId: 'raid_boar_archmage',     slot: 'accessory', stats: { 'Интеллект': 4, 'Мышление': 2 }, image: '/icons/loot/boar/raid_boar_archmage.webp' },
  },
  orochi: {
    pathfinder:  { name: 'Лунный Плащ',            itemId: 'raid_orochi_pathfinder',   slot: 'body',    stats: { 'Выносливость': 6, 'Воля': 4 } },
    berserker:   { name: 'Змеиный Коготь',         itemId: 'raid_orochi_berserker',    slot: 'weapon',  stats: { 'Сила': 6, 'Упорство': 4 } },
    monk:        { name: 'Чётки Лунного Змея',     itemId: 'raid_orochi_monk',         slot: 'accessory',stats:{ 'Фокус': 6, 'Дисциплина': 4 } },
    shaman:      { name: 'Лунный Амулет',          itemId: 'raid_orochi_shaman',       slot: 'accessory',stats:{ 'Дух': 6, 'ХП': 4 } },
    battlemaster:{ name: 'Змеиный Клинок',         itemId: 'raid_orochi_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 6, 'Гибкость': 4 } },
    archmage:    { name: 'Сфера Лунного Змея',     itemId: 'raid_orochi_archmage',     slot: 'accessory',stats:{ 'Интеллект': 6, 'Мышление': 4 } },
  },
  golem: {
    pathfinder:  { name: 'Поножи Голема',           itemId: 'raid_golem_pathfinder',   slot: 'legs',      stats: { 'Сила': 3, 'Выносливость': 3 }, image: '/icons/loot/golem/raid_golem_pathfinder.webp' },
    berserker:   { name: 'Кулаки Голема',           itemId: 'raid_golem_berserker',    slot: 'hands',     stats: { 'Сила': 5, 'Упорство': 3 }, image: '/icons/loot/golem/raid_golem_berserker.webp' },
    monk:        { name: 'Пояс Голема',             itemId: 'raid_golem_monk',         slot: 'body',      stats: { 'Фокус': 3, 'Сила': 3 }, image: '/icons/loot/golem/raid_golem_monk.webp' },
    shaman:      { name: 'Тотем Стали',             itemId: 'raid_golem_shaman',       slot: 'accessory', stats: { 'Дух': 3, 'Сила': 3 }, image: '/icons/loot/golem/raid_golem_shaman.webp' },
    battlemaster:{ name: 'Секира Голема',           itemId: 'raid_golem_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 5, 'Сила': 3 }, image: '/icons/loot/golem/raid_golem_battlemaster.webp' },
    archmage:    { name: 'Сердце Голема',           itemId: 'raid_golem_archmage',     slot: 'accessory', stats: { 'Интеллект': 3, 'Сила': 3 }, image: '/icons/loot/golem/raid_golem_archmage.webp' },
  },
  tiger: {
    pathfinder:  { name: 'Когти Тигра',             itemId: 'raid_tiger_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_pathfinder.webp' },
    berserker:   { name: 'Клыки Тигра',             itemId: 'raid_tiger_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_berserker.webp' },
    monk:        { name: 'Шкура Тигра',             itemId: 'raid_tiger_monk',         slot: 'body',      stats: { 'Фокус': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_monk.webp' },
    shaman:      { name: 'Дух Тигра',               itemId: 'raid_tiger_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_shaman.webp' },
    battlemaster:{ name: 'Удар Тигра',              itemId: 'raid_tiger_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_battlemaster.webp' },
    archmage:    { name: 'Глаз Тигра',              itemId: 'raid_tiger_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Гибкость': 6 }, image: '/icons/loot/tiger/raid_tiger_archmage.webp' },
  },
  phoenix: {
    pathfinder:  { name: 'Крылья Феникса',          itemId: 'raid_phoenix_pathfinder',   slot: 'body',    stats: { 'Выносливость': 12, 'Воля': 12 } },
    berserker:   { name: 'Пламя Феникса',           itemId: 'raid_phoenix_berserker',    slot: 'weapon',  stats: { 'Сила': 12, 'Упорство': 12 } },
    monk:        { name: 'Перо Феникса',            itemId: 'raid_phoenix_monk',         slot: 'accessory',stats:{ 'Фокус': 12, 'Дисциплина': 12 } },
    shaman:      { name: 'Душа Феникса',            itemId: 'raid_phoenix_shaman',       slot: 'accessory',stats:{ 'Дух': 12, 'ХП': 12 } },
    battlemaster:{ name: 'Коготь Феникса',          itemId: 'raid_phoenix_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 12, 'Гибкость': 12 } },
    archmage:    { name: 'Пепел Феникса',           itemId: 'raid_phoenix_archmage',     slot: 'accessory',stats:{ 'Интеллект': 12, 'Мышление': 12 } },
  },
  dragon: {
    pathfinder:  { name: 'Крылья Хаоса',           itemId: 'raid_dragon_pathfinder',   slot: 'body',    stats: { 'Выносливость': 10, 'Воля': 10 } },
    berserker:   { name: 'Драконья Секира',         itemId: 'raid_dragon_berserker',    slot: 'weapon',  stats: { 'Сила': 10, 'Упорство': 10 } },
    monk:        { name: 'Мантия Дракона',          itemId: 'raid_dragon_monk',         slot: 'body',    stats: { 'Фокус': 10, 'Дисциплина': 10 } },
    shaman:      { name: 'Сердце Дракона',          itemId: 'raid_dragon_shaman',       slot: 'accessory',stats:{ 'Дух': 10, 'ХП': 10 } },
    battlemaster:{ name: 'Драконий Кнут',           itemId: 'raid_dragon_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 10, 'Гибкость': 10 } },
    archmage:    { name: 'Фолиант Дракона Хаоса',  itemId: 'raid_dragon_archmage',     slot: 'accessory',stats:{ 'Интеллект': 10, 'Мышление': 10 } },
  },
  scorpion: {
    pathfinder:  { name: 'Сапоги Скорпиона',        itemId: 'raid_scorpion_pathfinder',   slot: 'legs',      stats: { 'Выносливость': 4, 'Воля': 2 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder.webp' },
    berserker:   { name: 'Жало Скорпиона',          itemId: 'raid_scorpion_berserker',    slot: 'weapon',    stats: { 'Сила': 4, 'Упорство': 2 }, image: '/icons/loot/scorpion/raid_scorpion_berserker.webp' },
    battlemaster:{ name: 'Клешня Скорпиона',        itemId: 'raid_scorpion_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 4, 'Гибкость': 2 }, image: '/icons/loot/scorpion/raid_scorpion_battlemaster.webp' },
    monk:        { name: 'Панцирь Скорпиона',       itemId: 'raid_scorpion_monk',         slot: 'accessory', stats: { 'Фокус': 4, 'Дисциплина': 2 }, image: '/icons/loot/scorpion/raid_scorpion_monk.webp' },
    shaman:      { name: 'Яд Скорпиона',            itemId: 'raid_scorpion_shaman',       slot: 'accessory', stats: { 'Дух': 4, 'ХП': 2 }, image: '/icons/loot/scorpion/raid_scorpion_shaman.webp' },
    archmage:    { name: 'Хитин Скорпиона',         itemId: 'raid_scorpion_archmage',     slot: 'accessory', stats: { 'Интеллект': 4, 'Мышление': 2 }, image: '/icons/loot/scorpion/raid_scorpion_archmage.webp' },
  },
  owl: {
    pathfinder:  { name: 'Плащ Совы',               itemId: 'raid_owl_pathfinder',   slot: 'body',      stats: { 'Выносливость': 4, 'Воля': 2 } },
    berserker:   { name: 'Коготь Совы',             itemId: 'raid_owl_berserker',    slot: 'weapon',    stats: { 'Сила': 4, 'Упорство': 2 } },
    battlemaster:{ name: 'Крыло Совы',              itemId: 'raid_owl_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 4, 'Гибкость': 2 } },
    monk:        { name: 'Взгляд Совы',             itemId: 'raid_owl_monk',         slot: 'accessory', stats: { 'Фокус': 4, 'Дисциплина': 2 } },
    shaman:      { name: 'Перо Совы',               itemId: 'raid_owl_shaman',       slot: 'accessory', stats: { 'Дух': 4, 'ХП': 2 } },
    archmage:    { name: 'Свиток Совы',             itemId: 'raid_owl_archmage',     slot: 'accessory', stats: { 'Интеллект': 4, 'Мышление': 2 } },
  },
  kraken: {
    pathfinder:  { name: 'Мантия Кракена',          itemId: 'raid_kraken_pathfinder',   slot: 'body',      stats: { 'Выносливость': 6, 'Воля': 4 } },
    berserker:   { name: 'Щупальце Кракена',        itemId: 'raid_kraken_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Упорство': 4 } },
    battlemaster:{ name: 'Клюв Кракена',            itemId: 'raid_kraken_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 4 } },
    monk:        { name: 'Чернила Кракена',         itemId: 'raid_kraken_monk',         slot: 'body',      stats: { 'Фокус': 6, 'Дисциплина': 4 } },
    shaman:      { name: 'Сердце Кракена',          itemId: 'raid_kraken_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'ХП': 4 } },
    archmage:    { name: 'Глаз Кракена',            itemId: 'raid_kraken_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Мышление': 4 } },
  },
  hydra: {
    pathfinder:  { name: 'Поножи Гидры',            itemId: 'raid_hydra_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 6, 'Воля': 4 } },
    berserker:   { name: 'Клык Гидры',              itemId: 'raid_hydra_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Упорство': 4 } },
    battlemaster:{ name: 'Хвост Гидры',             itemId: 'raid_hydra_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 4 } },
    monk:        { name: 'Чешуя Гидры',             itemId: 'raid_hydra_monk',         slot: 'accessory', stats: { 'Фокус': 6, 'Дисциплина': 4 } },
    shaman:      { name: 'Кровь Гидры',             itemId: 'raid_hydra_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'ХП': 4 } },
    archmage:    { name: 'Голова Гидры',            itemId: 'raid_hydra_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Мышление': 4 } },
  },
  wyrm: {
    pathfinder:  { name: 'Сапоги Ящера',            itemId: 'raid_wyrm_pathfinder',   slot: 'legs',      stats: { 'Выносливость': 10, 'Воля': 8 } },
    berserker:   { name: 'Клык Ящера',              itemId: 'raid_wyrm_berserker',    slot: 'weapon',    stats: { 'Сила': 10, 'Упорство': 8 } },
    battlemaster:{ name: 'Хребет Ящера',            itemId: 'raid_wyrm_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 10, 'Гибкость': 8 } },
    monk:        { name: 'Панцирь Ящера',           itemId: 'raid_wyrm_monk',         slot: 'body',      stats: { 'Фокус': 10, 'Дисциплина': 8 } },
    shaman:      { name: 'Дыхание Ящера',           itemId: 'raid_wyrm_shaman',       slot: 'accessory', stats: { 'Дух': 10, 'ХП': 8 } },
    archmage:    { name: 'Чешуя Ящера',             itemId: 'raid_wyrm_archmage',     slot: 'accessory', stats: { 'Интеллект': 10, 'Мышление': 8 } },
  },
  leviathan: {
    pathfinder:  { name: 'Плавники Левиафана',      itemId: 'raid_leviathan_pathfinder',   slot: 'body',      stats: { 'Выносливость': 10, 'Воля': 8 } },
    berserker:   { name: 'Клык Левиафана',          itemId: 'raid_leviathan_berserker',    slot: 'weapon',    stats: { 'Сила': 10, 'Упорство': 8 } },
    battlemaster:{ name: 'Хребет Левиафана',        itemId: 'raid_leviathan_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 10, 'Гибкость': 8 } },
    monk:        { name: 'Кожа Левиафана',          itemId: 'raid_leviathan_monk',         slot: 'accessory', stats: { 'Фокус': 10, 'Дисциплина': 8 } },
    shaman:      { name: 'Каменное Сердце Левиафана', itemId: 'raid_leviathan_shaman',     slot: 'body',      stats: { 'Дух': 10, 'ХП': 8 } },
    archmage:    { name: 'Глаз Левиафана',          itemId: 'raid_leviathan_archmage',     slot: 'accessory', stats: { 'Интеллект': 10, 'Мышление': 8 } },
  },
};


// Primary activity bonus per class (applied to raid loot items)
export const CLASS_LOOT_BONUS = {
  pathfinder:   { activity: 'running',        xpBonusPct: 5 },
  berserker:    { activity: 'strength_gym',    xpBonusPct: 5 },
  battlemaster: { activity: 'wrestling',       xpBonusPct: 5 },
  monk:         { activity: 'nutrition',       xpBonusPct: 5 },
  shaman:       { activity: 'sleep',           xpBonusPct: 5 },
  archmage:     { activity: 'reading',         xpBonusPct: 5 },
};

// Flatten raid loot into shop items so they appear in inventory/equip screens
export const RAID_LOOT_SHOP_ITEMS = Object.entries(RAID_LOOT_BY_CLASS).flatMap(([raidId, byClass]) =>
  Object.entries(byClass).map(([classId, loot]) => {
    const rarityMap = { dragon: 'legendary', phoenix: 'legendary', orochi: 'epic', tiger: 'epic', golem: 'rare', boar: 'rare',
      scorpion: 'rare', owl: 'rare', kraken: 'epic', hydra: 'epic', wyrm: 'legendary', leviathan: 'legendary' };
    const iconMap = { dragon: Crown, phoenix: Crown, orochi: Star, tiger: Star, golem: Shield, boar: Shield,
      scorpion: Shield, owl: Shield, kraken: Star, hydra: Star, wyrm: Crown, leviathan: Crown };
    return {
      id: loot.itemId,
      slot: loot.slot,
      rarity: rarityMap[raidId] || 'rare',
      name: loot.name,
      icon: iconMap[raidId] || Shield,
      image: loot.image || null,
      price: 0,
      raidLoot: true,
      bonus: CLASS_LOOT_BONUS[classId] || {},
    };
  })
);

// Combined items array for lookup (shop + raid loot)
export const ALL_ITEMS = () => [...SHOP_ITEMS, ...RAID_LOOT_SHOP_ITEMS];

// Универсальный лейбл бонуса предмета — поддерживает одиночный/мульти-актив XP-бонус и кристалл-бонус.
export function bonusLabel(bonus) {
  if (!bonus) return '';
  if (bonus.crystalPct) return `+${bonus.crystalPct}% кристаллов`;
  const acts = bonus.activities || (bonus.activity ? [bonus.activity] : []);
  const names = acts.map(a => a === 'all' ? 'всем' : (ACTIVITY_TYPES[a]?.label || a)).join(' + ');
  return `+${bonus.xpBonusPct}% ${names}`;
}

export const RAID_BOSSES = [
  {
    id: 'boar',
    image: '/icons/bosses/boar.webp',
    creature: '🐗',
    minPlayers: 3, maxPlayers: 3,
    name: 'ВЕПРЬ ПУСТЫННОЙ БЕЗДНЫ',
    subtitle: 'Редкий рейд',
    color: '#e8633c',
    rarity: 'rare',
    durationDays: 3,
    weakness: 'Бег',
    sharedTitle: 'Синий клык',
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
    image: '/icons/bosses/orochi.webp',
    creature: '🐍',
    minPlayers: 3, maxPlayers: 3,
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
    image: '/icons/bosses/dragon.webp',
    creature: '🐉',
    minPlayers: 3, maxPlayers: 3,
    name: 'ДРАКОН "ПОЖИРАЮЩИЙ СОЛНЦЕ"',
    subtitle: 'Легендарный рейд',
    color: '#f5c84a',
    rarity: 'legendary',
    durationDays: 30,
    weakness: 'Пепел калорий',
    sharedTitle: 'Усмиритель драконов',
    lootTier: 'legendary',
    description: '30 дней. Суммарно на всех участников нужно сжечь 50 000 ккал.',
    condition: {
      type: 'shared_total',
      label: 'Суммарно сожжено ккал',
      activity: 'calories',
      field: 'kcal',
      target: 50000,
      unit: 'ккал',
    },
  },
  {
    id: 'golem',
    image: '/icons/bosses/golem.webp',
    creature: '🪨',
    name: 'СТАЛЬНОЙ ГОЛЕМ',
    subtitle: 'Редкий рейд',
    color: '#5b9bf0',
    rarity: 'rare',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 10,
    weakness: 'Силовые',
    sharedTitle: 'Кузнецы плоти',
    lootTier: 'rare',
    description: '10 дней. Суммарно 12 силовых тренировок (зал или парк) на всех участников — по 4 на каждого.',
    condition: {
      type: 'shared_count',
      label: 'Суммарно силовых тренировок',
      activities: ['strength_gym', 'strength_park'],
      target: 12,
      unit: 'тренировок',
    },
  },
  {
    id: 'tiger',
    image: '/icons/bosses/tiger.webp',
    creature: '🐯',
    name: 'ПОДКРАДЫВАЮЩИЙСЯ ТИГР',
    subtitle: 'Эпический рейд',
    color: '#a35bf0',
    rarity: 'epic',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 14,
    weakness: 'Борьба + Бег',
    sharedTitle: 'Клыки и ветер',
    lootTier: 'epic',
    description: '14 дней. Каждый выбирает одну роль до старта (все три роли должны быть заняты): Стальной Кулак — 11 силовых, Коготь — 10 силовых, Ветер — 12 пробежек.',
    condition: {
      type: 'combo_roles',
      label: 'Роли выполнены',
      roles: {
        steel: { activity: ['strength_gym', 'strength_park'], target: 11, unit: 'тренировок', label: '💪 Стальной Кулак', emoji: '💪' },
        claw:  { activity: ['strength_gym', 'strength_park'], target: 10, unit: 'тренировок', label: '🦾 Железный Коготь', emoji: '🦾' },
        wind:  { activity: 'running', target: 12, unit: 'пробежек', label: '💨 Ветер', emoji: '💨' },
      },
      requireAllRoles: true,
    },
  },
  {
    id: 'phoenix',
    image: '/icons/bosses/phoenix.webp',
    creature: '🦅',
    name: 'БЕЛЫЙ ФЕНИКС',
    subtitle: 'Мифический рейд',
    color: '#f5c84a',
    rarity: 'mythic',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 21,
    weakness: 'Дисциплина',
    sharedTitle: 'Пепел и вечность',
    lootTier: 'mythic',
    description: '21 день. Каждый игрок каждый день — минимум 3 разные активности. Рейдовый щит защищает от одного пропуска.',
    condition: {
      type: 'perfect_discipline',
      label: 'Дней с 3+ активностями',
      unit: 'дней',
      minActivitiesPerDay: 3,
    },
  },
  {
    id: 'scorpion',
    image: '/icons/bosses/scorpion.webp',
    creature: '🦂',
    name: 'СКОРПИОН ЯДОВИТЫХ ДЮН',
    subtitle: 'Редкий рейд',
    color: '#7ab84f',
    rarity: 'rare',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 5,
    weakness: 'Правильное питание',
    sharedTitle: 'Иммунитет к яду',
    lootTier: 'rare',
    description: '5 дней. Суммарно на троих — 15 дней правильного питания (по 5 на игрока).',
    condition: {
      type: 'shared_count',
      label: 'Суммарно дней правильного питания',
      activity: 'nutrition',
      target: 15,
      unit: 'дней',
    },
  },
  {
    id: 'owl',
    image: '/icons/bosses/owl.webp',
    creature: '🦉',
    name: 'СОВА КРОВИ И РАЗМЫШЛЕНИЙ',
    subtitle: 'Редкий рейд',
    color: '#9b7ee8',
    rarity: 'rare',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 6,
    weakness: 'Чтение',
    sharedTitle: 'Совиный взгляд',
    lootTier: 'rare',
    description: '6 дней. Суммарно на троих — 900 страниц прочитанного (~50/день на игрока).',
    condition: {
      type: 'shared_total',
      label: 'Суммарно страниц',
      activity: 'reading',
      field: 'pages',
      target: 900,
      unit: 'стр.',
    },
  },
  {
    id: 'kraken',
    image: '/icons/bosses/kraken.webp',
    creature: '🐙',
    name: 'КРАКЕН ЛЕДЯНЫХ ГЛУБИН',
    subtitle: 'Эпический рейд',
    color: '#2a6ba8',
    rarity: 'epic',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 12,
    weakness: 'Сон',
    sharedTitle: 'Дитя глубин',
    lootTier: 'epic',
    description: '12 дней. Суммарно на троих — 30 ночей здорового сна (~2.5 на игрока каждые 3 дня — с запасом на пропуски).',
    condition: {
      type: 'shared_count',
      label: 'Суммарно ночей здорового сна',
      activity: 'sleep',
      target: 30,
      unit: 'ночей',
    },
  },
  {
    id: 'hydra',
    image: '/icons/bosses/hydra.webp',
    creature: '🐍',
    name: 'ГИДРА, ПОЖИРАЮЩАЯ ГОЛОВЫ',
    subtitle: 'Эпический рейд',
    color: '#3aa878',
    rarity: 'epic',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 14,
    weakness: 'Смешанная',
    sharedTitle: 'Обезглавивший гидру',
    lootTier: 'epic',
    description: '14 дней. Каждый выбирает одну роль до старта (все три роли должны быть заняты): Голова Силы — 10 силовых, Голова Смыслов — 1000 страниц чтения, Голова Скорости — 12 пробежек.',
    condition: {
      type: 'combo_roles',
      label: 'Роли выполнены',
      roles: {
        power: { activity: ['strength_gym', 'strength_park'], target: 10, unit: 'тренировок', label: '💪 Голова Силы', emoji: '💪' },
        mind:  { activity: 'reading', field: 'pages', target: 1000, unit: 'стр.', label: '🧠 Голова Смыслов', emoji: '🧠' },
        wind:  { activity: 'running', target: 12, unit: 'пробежек', label: '💨 Голова Скорости', emoji: '💨' },
      },
      requireAllRoles: true,
    },
  },
  {
    id: 'wyrm',
    image: '/icons/bosses/wyrm.webp',
    creature: '🐛',
    name: 'ЯЩЕР БЕССЛЕДНЫХ ТРОП',
    subtitle: 'Легендарный рейд',
    color: '#c9a227',
    rarity: 'legendary',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 21,
    weakness: 'Ходьба',
    sharedTitle: 'Бесследный странник',
    lootTier: 'legendary',
    description: '21 день. Суммарно на троих — 900 000 шагов (~14 300 шагов/день на игрока).',
    condition: {
      type: 'shared_total',
      label: 'Суммарно шагов',
      activity: 'walking',
      field: 'steps',
      target: 900000,
      unit: 'шагов',
    },
  },
  {
    id: 'leviathan',
    image: '/icons/bosses/leviathan.webp',
    creature: '🐋',
    name: 'ЛЕВИАФАН "КАМЕННОЕ СЕРДЦЕ"',
    subtitle: 'Легендарный рейд',
    color: '#4a6fa5',
    rarity: 'legendary',
    minPlayers: 3, maxPlayers: 3,
    durationDays: 25,
    weakness: 'Смешанная физическая',
    sharedTitle: 'Каменное сердце',
    lootTier: 'legendary',
    description: '25 дней. Суммарно на троих — 60 тренировок любого типа (силовая/борьба/бег) — свободный микс, не привязано к ролям.',
    condition: {
      type: 'shared_count',
      label: 'Суммарно тренировок (сила/борьба/бег)',
      activities: ['strength_gym', 'strength_park', 'wrestling', 'running'],
      target: 60,
      unit: 'тренировок',
    },
  },
];

// Raid defeat penalty (HP subtracted from both physical and mental bars) scales by rarity.
export const RAID_DEFEAT_PENALTY_BY_RARITY = { rare: 20, epic: 35, legendary: 50, mythic: 70 };
export const MAX_RAID_SHIELDS = 3;

export const RAID_RARITY_COLORS = {
  rare:      { color: '#5b9bf0', bg: '#162236', border: '#2a3f5c' },
  epic:      { color: '#a35bf0', bg: '#231832', border: '#3d1f5c' },
  legendary: { color: '#f0c14b', bg: '#332710', border: '#5c4010' },
  mythic:    { color: '#f5a8ff', bg: '#2a1232', border: '#6a2a8a' },
};


export const TIER_COLORS = {
  bronze: { bg: '#3a2a1a', border: '#a9692f', text: '#e0a868' },
  silver: { bg: '#2c2f36', border: '#9aa3b0', text: '#d4dae3' },
  gold: { bg: '#3a3115', border: '#d4af37', text: '#f0d272' },
  platinum: { bg: '#1f2e2c', border: '#5fd9c4', text: '#9af0e0' },
  special: { bg: '#2a1f3a', border: '#9c6fe0', text: '#c9a8f5' },
  diamond: { bg: '#1a2a3a', border: '#5fa8e0', text: '#9ad0f5' },
  legend: { bg: '#3a1a2a', border: '#e05f9c', text: '#f5a8c9' },
  locked: { bg: '#202024', border: '#3a3a40', text: '#6a6a72' },
};

export const ALL_STATS = ['Выносливость', 'Воля', 'Сила', 'Упорство', 'Фокус', 'Дисциплина', 'Дух', 'ХП', 'Силовая выносливость', 'Гибкость', 'Интеллект', 'Мышление'];

