// ---------- РЕЙД-БОССЫ и добыча ----------
import { Shield, Star, Crown } from 'lucide-react';
import { ACTIVITY_TYPES } from './coreConstants';
import { SHOP_ITEMS } from './shop';

// ---------- RAID BOSSES ----------
export const RAID_LOOT_BY_CLASS = {
  boar: {
    pathfinder:  { name: 'Наручи Вепря',          itemId: 'raid_boar_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 4, 'Воля': 2 } },
    berserker:   { name: 'Клык Вепря',             itemId: 'raid_boar_berserker',    slot: 'weapon',    stats: { 'Сила': 4, 'Упорство': 2 } },
    monk:        { name: 'Оберег Вепря',           itemId: 'raid_boar_monk',         slot: 'accessory', stats: { 'Фокус': 4, 'Дисциплина': 2 } },
    shaman:      { name: 'Тотем Вепря',            itemId: 'raid_boar_shaman',       slot: 'accessory', stats: { 'Дух': 4, 'ХП': 2 } },
    battlemaster:{ name: 'Кистень Вепря',          itemId: 'raid_boar_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 4, 'Гибкость': 2 } },
    archmage:    { name: 'Глаз Вепря',             itemId: 'raid_boar_archmage',     slot: 'accessory', stats: { 'Интеллект': 4, 'Мышление': 2 } },
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
    pathfinder:  { name: 'Поножи Голема',           itemId: 'raid_golem_pathfinder',   slot: 'legs',      stats: { 'Сила': 3, 'Выносливость': 3 } },
    berserker:   { name: 'Кулаки Голема',           itemId: 'raid_golem_berserker',    slot: 'hands',     stats: { 'Сила': 5, 'Упорство': 3 } },
    monk:        { name: 'Пояс Голема',             itemId: 'raid_golem_monk',         slot: 'body',      stats: { 'Фокус': 3, 'Сила': 3 } },
    shaman:      { name: 'Тотем Стали',             itemId: 'raid_golem_shaman',       slot: 'accessory', stats: { 'Дух': 3, 'Сила': 3 } },
    battlemaster:{ name: 'Секира Голема',           itemId: 'raid_golem_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 5, 'Сила': 3 } },
    archmage:    { name: 'Сердце Голема',           itemId: 'raid_golem_archmage',     slot: 'accessory', stats: { 'Интеллект': 3, 'Сила': 3 } },
  },
  tiger: {
    pathfinder:  { name: 'Когти Тигра',             itemId: 'raid_tiger_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 6, 'Гибкость': 6 } },
    berserker:   { name: 'Клыки Тигра',             itemId: 'raid_tiger_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Гибкость': 6 } },
    monk:        { name: 'Шкура Тигра',             itemId: 'raid_tiger_monk',         slot: 'body',      stats: { 'Фокус': 6, 'Гибкость': 6 } },
    shaman:      { name: 'Дух Тигра',               itemId: 'raid_tiger_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'Гибкость': 6 } },
    battlemaster:{ name: 'Удар Тигра',              itemId: 'raid_tiger_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 6 } },
    archmage:    { name: 'Глаз Тигра',              itemId: 'raid_tiger_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Гибкость': 6 } },
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
    const rarityMap = { dragon: 'legendary', phoenix: 'legendary', orochi: 'epic', tiger: 'epic', golem: 'rare', boar: 'rare' };
    const iconMap = { dragon: Crown, phoenix: Crown, orochi: Star, tiger: Star, golem: Shield, boar: Shield };
    return {
      id: loot.itemId,
      slot: loot.slot,
      rarity: rarityMap[raidId] || 'rare',
      name: loot.name,
      icon: iconMap[raidId] || Shield,
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
    description: '14 дней. Каждый выбирает одну роль до старта (все три роли должны быть заняты): Стальной Кулак — 12 силовых, Коготь — 12 силовых, Ветер — 18 км бега.',
    condition: {
      type: 'combo_roles',
      label: 'Роли выполнены',
      roles: {
        steel: { activity: ['strength_gym', 'strength_park'], target: 12, unit: 'тренировок', label: '💪 Стальной Кулак', emoji: '💪' },
        claw:  { activity: ['strength_gym', 'strength_park'], target: 12, unit: 'тренировок', label: '🦾 Железный Коготь', emoji: '🦾' },
        wind:  { activity: 'running', target: 18, field: 'distance', unit: 'км', label: '💨 Ветер', emoji: '💨' },
      },
      requireAllRoles: true,
    },
  },
  {
    id: 'phoenix',
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

