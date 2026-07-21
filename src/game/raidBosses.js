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
    pathfinder:  { name: 'Лунный Плащ',            itemId: 'raid_orochi_pathfinder',   slot: 'body',    stats: { 'Выносливость': 6, 'Воля': 4 }, image: '/icons/loot/orochi/raid_orochi_pathfinder.webp' },
    berserker:   { name: 'Змеиный Коготь',         itemId: 'raid_orochi_berserker',    slot: 'weapon',  stats: { 'Сила': 6, 'Упорство': 4 }, image: '/icons/loot/orochi/raid_orochi_berserker.webp' },
    monk:        { name: 'Чётки Лунного Змея',     itemId: 'raid_orochi_monk',         slot: 'accessory',stats:{ 'Фокус': 6, 'Дисциплина': 4 }, image: '/icons/loot/orochi/raid_orochi_monk.webp' },
    shaman:      { name: 'Лунный Амулет',          itemId: 'raid_orochi_shaman',       slot: 'accessory',stats:{ 'Дух': 6, 'ХП': 4 }, image: '/icons/loot/orochi/raid_orochi_shaman.webp' },
    battlemaster:{ name: 'Змеиный Клинок',         itemId: 'raid_orochi_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 6, 'Гибкость': 4 }, image: '/icons/loot/orochi/raid_orochi_battlemaster.webp' },
    archmage:    { name: 'Сфера Лунного Змея',     itemId: 'raid_orochi_archmage',     slot: 'accessory',stats:{ 'Интеллект': 6, 'Мышление': 4 }, image: '/icons/loot/orochi/raid_orochi_archmage.webp' },
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
    pathfinder:  { name: 'Крылья Феникса',          itemId: 'raid_phoenix_pathfinder',   slot: 'body',    stats: { 'Выносливость': 12, 'Воля': 12 }, image: '/icons/loot/phoenix/raid_phoenix_pathfinder.webp' },
    berserker:   { name: 'Пламя Феникса',           itemId: 'raid_phoenix_berserker',    slot: 'weapon',  stats: { 'Сила': 12, 'Упорство': 12 }, image: '/icons/loot/phoenix/raid_phoenix_berserker.webp' },
    monk:        { name: 'Перо Феникса',            itemId: 'raid_phoenix_monk',         slot: 'accessory',stats:{ 'Фокус': 12, 'Дисциплина': 12 }, image: '/icons/loot/phoenix/raid_phoenix_monk.webp' },
    shaman:      { name: 'Душа Феникса',            itemId: 'raid_phoenix_shaman',       slot: 'accessory',stats:{ 'Дух': 12, 'ХП': 12 }, image: '/icons/loot/phoenix/raid_phoenix_shaman.webp' },
    battlemaster:{ name: 'Коготь Феникса',          itemId: 'raid_phoenix_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 12, 'Гибкость': 12 }, image: '/icons/loot/phoenix/raid_phoenix_battlemaster.webp' },
    archmage:    { name: 'Пепел Феникса',           itemId: 'raid_phoenix_archmage',     slot: 'accessory',stats:{ 'Интеллект': 12, 'Мышление': 12 }, image: '/icons/loot/phoenix/raid_phoenix_archmage.webp' },
  },
  dragon: {
    pathfinder:  { name: 'Крылья Хаоса',           itemId: 'raid_dragon_pathfinder',   slot: 'body',    stats: { 'Выносливость': 10, 'Воля': 10 }, image: '/icons/loot/dragon/raid_dragon_pathfinder.webp' },
    berserker:   { name: 'Драконья Секира',         itemId: 'raid_dragon_berserker',    slot: 'weapon',  stats: { 'Сила': 10, 'Упорство': 10 }, image: '/icons/loot/dragon/raid_dragon_berserker.webp' },
    monk:        { name: 'Мантия Дракона',          itemId: 'raid_dragon_monk',         slot: 'body',    stats: { 'Фокус': 10, 'Дисциплина': 10 }, image: '/icons/loot/dragon/raid_dragon_monk.webp' },
    shaman:      { name: 'Сердце Дракона',          itemId: 'raid_dragon_shaman',       slot: 'accessory',stats:{ 'Дух': 10, 'ХП': 10 }, image: '/icons/loot/dragon/raid_dragon_shaman.webp' },
    battlemaster:{ name: 'Драконий Кнут',           itemId: 'raid_dragon_battlemaster', slot: 'weapon',  stats: { 'Силовая выносливость': 10, 'Гибкость': 10 }, image: '/icons/loot/dragon/raid_dragon_battlemaster.webp' },
    archmage:    { name: 'Фолиант Дракона Хаоса',  itemId: 'raid_dragon_archmage',     slot: 'accessory',stats:{ 'Интеллект': 10, 'Мышление': 10 }, image: '/icons/loot/dragon/raid_dragon_archmage.webp' },
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
    pathfinder:  { name: 'Плащ Совы',               itemId: 'raid_owl_pathfinder',   slot: 'body',      stats: { 'Выносливость': 4, 'Воля': 2 }, image: '/icons/loot/owl/raid_owl_pathfinder.webp' },
    berserker:   { name: 'Коготь Совы',             itemId: 'raid_owl_berserker',    slot: 'weapon',    stats: { 'Сила': 4, 'Упорство': 2 }, image: '/icons/loot/owl/raid_owl_berserker.webp' },
    battlemaster:{ name: 'Крыло Совы',              itemId: 'raid_owl_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 4, 'Гибкость': 2 }, image: '/icons/loot/owl/raid_owl_battlemaster.webp' },
    monk:        { name: 'Взгляд Совы',             itemId: 'raid_owl_monk',         slot: 'accessory', stats: { 'Фокус': 4, 'Дисциплина': 2 }, image: '/icons/loot/owl/raid_owl_monk.webp' },
    shaman:      { name: 'Перо Совы',               itemId: 'raid_owl_shaman',       slot: 'accessory', stats: { 'Дух': 4, 'ХП': 2 }, image: '/icons/loot/owl/raid_owl_shaman.webp' },
    archmage:    { name: 'Свиток Совы',             itemId: 'raid_owl_archmage',     slot: 'accessory', stats: { 'Интеллект': 4, 'Мышление': 2 }, image: '/icons/loot/owl/raid_owl_archmage.webp' },
  },
  kraken: {
    pathfinder:  { name: 'Мантия Кракена',          itemId: 'raid_kraken_pathfinder',   slot: 'body',      stats: { 'Выносливость': 6, 'Воля': 4 }, image: '/icons/loot/kraken/raid_kraken_pathfinder.webp' },
    berserker:   { name: 'Щупальце Кракена',        itemId: 'raid_kraken_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Упорство': 4 }, image: '/icons/loot/kraken/raid_kraken_berserker.webp' },
    battlemaster:{ name: 'Клюв Кракена',            itemId: 'raid_kraken_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 4 }, image: '/icons/loot/kraken/raid_kraken_battlemaster.webp' },
    monk:        { name: 'Чернила Кракена',         itemId: 'raid_kraken_monk',         slot: 'body',      stats: { 'Фокус': 6, 'Дисциплина': 4 }, image: '/icons/loot/kraken/raid_kraken_monk.webp' },
    shaman:      { name: 'Сердце Кракена',          itemId: 'raid_kraken_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'ХП': 4 }, image: '/icons/loot/kraken/raid_kraken_shaman.webp' },
    archmage:    { name: 'Глаз Кракена',            itemId: 'raid_kraken_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Мышление': 4 }, image: '/icons/loot/kraken/raid_kraken_archmage.webp' },
  },
  hydra: {
    pathfinder:  { name: 'Поножи Гидры',            itemId: 'raid_hydra_pathfinder',   slot: 'hands',     stats: { 'Выносливость': 6, 'Воля': 4 }, image: '/icons/loot/hydra/raid_hydra_pathfinder.webp' },
    berserker:   { name: 'Клык Гидры',              itemId: 'raid_hydra_berserker',    slot: 'weapon',    stats: { 'Сила': 6, 'Упорство': 4 }, image: '/icons/loot/hydra/raid_hydra_berserker.webp' },
    battlemaster:{ name: 'Хвост Гидры',             itemId: 'raid_hydra_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 6, 'Гибкость': 4 }, image: '/icons/loot/hydra/raid_hydra_battlemaster.webp' },
    monk:        { name: 'Чешуя Гидры',             itemId: 'raid_hydra_monk',         slot: 'accessory', stats: { 'Фокус': 6, 'Дисциплина': 4 }, image: '/icons/loot/hydra/raid_hydra_monk.webp' },
    shaman:      { name: 'Кровь Гидры',             itemId: 'raid_hydra_shaman',       slot: 'accessory', stats: { 'Дух': 6, 'ХП': 4 }, image: '/icons/loot/hydra/raid_hydra_shaman.webp' },
    archmage:    { name: 'Голова Гидры',            itemId: 'raid_hydra_archmage',     slot: 'accessory', stats: { 'Интеллект': 6, 'Мышление': 4 }, image: '/icons/loot/hydra/raid_hydra_archmage.webp' },
  },
  wyrm: {
    pathfinder:  { name: 'Сапоги Ящера',            itemId: 'raid_wyrm_pathfinder',   slot: 'legs',      stats: { 'Выносливость': 10, 'Воля': 8 }, image: '/icons/loot/wyrm/raid_wyrm_pathfinder.webp' },
    berserker:   { name: 'Клык Ящера',              itemId: 'raid_wyrm_berserker',    slot: 'weapon',    stats: { 'Сила': 10, 'Упорство': 8 }, image: '/icons/loot/wyrm/raid_wyrm_berserker.webp' },
    battlemaster:{ name: 'Хребет Ящера',            itemId: 'raid_wyrm_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 10, 'Гибкость': 8 }, image: '/icons/loot/wyrm/raid_wyrm_battlemaster.webp' },
    monk:        { name: 'Панцирь Ящера',           itemId: 'raid_wyrm_monk',         slot: 'body',      stats: { 'Фокус': 10, 'Дисциплина': 8 }, image: '/icons/loot/wyrm/raid_wyrm_monk.webp' },
    shaman:      { name: 'Дыхание Ящера',           itemId: 'raid_wyrm_shaman',       slot: 'accessory', stats: { 'Дух': 10, 'ХП': 8 }, image: '/icons/loot/wyrm/raid_wyrm_shaman.webp' },
    archmage:    { name: 'Чешуя Ящера',             itemId: 'raid_wyrm_archmage',     slot: 'accessory', stats: { 'Интеллект': 10, 'Мышление': 8 }, image: '/icons/loot/wyrm/raid_wyrm_archmage.webp' },
  },
  leviathan: {
    pathfinder:  { name: 'Плавники Левиафана',      itemId: 'raid_leviathan_pathfinder',   slot: 'body',      stats: { 'Выносливость': 10, 'Воля': 8 }, image: '/icons/loot/leviathan/raid_leviathan_pathfinder.webp' },
    berserker:   { name: 'Клык Левиафана',          itemId: 'raid_leviathan_berserker',    slot: 'weapon',    stats: { 'Сила': 10, 'Упорство': 8 }, image: '/icons/loot/leviathan/raid_leviathan_berserker.webp' },
    battlemaster:{ name: 'Хребет Левиафана',        itemId: 'raid_leviathan_battlemaster', slot: 'weapon',    stats: { 'Силовая выносливость': 10, 'Гибкость': 8 }, image: '/icons/loot/leviathan/raid_leviathan_battlemaster.webp' },
    monk:        { name: 'Кожа Левиафана',          itemId: 'raid_leviathan_monk',         slot: 'accessory', stats: { 'Фокус': 10, 'Дисциплина': 8 }, image: '/icons/loot/leviathan/raid_leviathan_monk.webp' },
    shaman:      { name: 'Каменное Сердце Левиафана', itemId: 'raid_leviathan_shaman',     slot: 'body',      stats: { 'Дух': 10, 'ХП': 8 }, image: '/icons/loot/leviathan/raid_leviathan_shaman.webp' },
    archmage:    { name: 'Глаз Левиафана',          itemId: 'raid_leviathan_archmage',     slot: 'accessory', stats: { 'Интеллект': 10, 'Мышление': 8 }, image: '/icons/loot/leviathan/raid_leviathan_archmage.webp' },
  },
};

// ---------- НОВЫЙ ЛУТ-СЕТ (redo июля 2026): повторяемые rare+epic рейды ----------
// В отличие от RAID_LOOT_BY_CLASS выше (один предмет, рейд разовый) — здесь у каждого класса
// массив из нескольких предметов сета на конкретного босса. При каждой новой победе игрок
// получает следующий ещё не полученный предмет своего класса (см. логику в App.jsx). Когда
// массив исчерпан — сет считается собранным полностью, рейд для этого игрока личный закрыт
// (не мешает другим участникам гильдии, у кого сет ещё не собран).
// Покрывает только rare+epic боссов (по решению — legendary/mythic пока на старой системе).
export const RAID_LOOT_SETS_BY_CLASS = {
  boar: {
    pathfinder: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_pathfinder_head', slot: 'head', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/boar/raid_boar_pathfinder_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_pathfinder_body', slot: 'body', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/boar/raid_boar_pathfinder_body.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/boar/raid_boar_pathfinder_legs.webp' },
      { name: 'Клык Вепря', itemId: 'raid_boar_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/boar/raid_boar_pathfinder_weapon.webp' },
      { name: 'Оберег Вепря', itemId: 'raid_boar_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/boar/raid_boar_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_berserker_head', slot: 'head', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/boar/raid_boar_berserker_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_berserker_body', slot: 'body', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/boar/raid_boar_berserker_body.webp' },
      { name: 'Наручи Вепря', itemId: 'raid_boar_berserker_hands', slot: 'hands', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/boar/raid_boar_berserker_hands.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_berserker_legs', slot: 'legs', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/boar/raid_boar_berserker_legs.webp' },
      { name: 'Оберег Вепря', itemId: 'raid_boar_berserker_accessory', slot: 'accessory', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/boar/raid_boar_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/boar/raid_boar_battlemaster_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/boar/raid_boar_battlemaster_body.webp' },
      { name: 'Наручи Вепря', itemId: 'raid_boar_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/boar/raid_boar_battlemaster_hands.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/boar/raid_boar_battlemaster_legs.webp' },
      { name: 'Оберег Вепря', itemId: 'raid_boar_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/boar/raid_boar_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_monk_head', slot: 'head', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/boar/raid_boar_monk_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_monk_body', slot: 'body', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/boar/raid_boar_monk_body.webp' },
      { name: 'Наручи Вепря', itemId: 'raid_boar_monk_hands', slot: 'hands', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/boar/raid_boar_monk_hands.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_monk_legs', slot: 'legs', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/boar/raid_boar_monk_legs.webp' },
      { name: 'Клык Вепря', itemId: 'raid_boar_monk_weapon', slot: 'weapon', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/boar/raid_boar_monk_weapon.webp' },
    ],
    shaman: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_shaman_head', slot: 'head', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/boar/raid_boar_shaman_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_shaman_body', slot: 'body', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/boar/raid_boar_shaman_body.webp' },
      { name: 'Наручи Вепря', itemId: 'raid_boar_shaman_hands', slot: 'hands', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/boar/raid_boar_shaman_hands.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_shaman_legs', slot: 'legs', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/boar/raid_boar_shaman_legs.webp' },
      { name: 'Оберег Вепря', itemId: 'raid_boar_shaman_accessory', slot: 'accessory', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/boar/raid_boar_shaman_accessory.webp' },
    ],
    archmage: [
      { name: 'Клык-шлем Вепря', itemId: 'raid_boar_archmage_head', slot: 'head', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/boar/raid_boar_archmage_head.webp' },
      { name: 'Шкура Вепря', itemId: 'raid_boar_archmage_body', slot: 'body', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/boar/raid_boar_archmage_body.webp' },
      { name: 'Наручи Вепря', itemId: 'raid_boar_archmage_hands', slot: 'hands', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/boar/raid_boar_archmage_hands.webp' },
      { name: 'Поножи Вепря', itemId: 'raid_boar_archmage_legs', slot: 'legs', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/boar/raid_boar_archmage_legs.webp' },
      { name: 'Клык Вепря', itemId: 'raid_boar_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/boar/raid_boar_archmage_weapon.webp' },
    ],
  },
  golem: {
    pathfinder: [
      { name: 'Забрало Голема', itemId: 'raid_golem_pathfinder_head', slot: 'head', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/golem/raid_golem_pathfinder_head.webp' },
      { name: 'Плита Голема', itemId: 'raid_golem_pathfinder_body', slot: 'body', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/golem/raid_golem_pathfinder_body.webp' },
      { name: 'Кулаки Голема', itemId: 'raid_golem_pathfinder_hands', slot: 'hands', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/golem/raid_golem_pathfinder_hands.webp' },
      { name: 'Секира Голема', itemId: 'raid_golem_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/golem/raid_golem_pathfinder_weapon.webp' },
      { name: 'Сердце Голема', itemId: 'raid_golem_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/golem/raid_golem_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Забрало Голема', itemId: 'raid_golem_berserker_head', slot: 'head', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/golem/raid_golem_berserker_head.webp' },
      { name: 'Плита Голема', itemId: 'raid_golem_berserker_body', slot: 'body', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/golem/raid_golem_berserker_body.webp' },
      { name: 'Поножи Голема', itemId: 'raid_golem_berserker_legs', slot: 'legs', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/golem/raid_golem_berserker_legs.webp' },
      { name: 'Секира Голема', itemId: 'raid_golem_berserker_weapon', slot: 'weapon', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/golem/raid_golem_berserker_weapon.webp' },
      { name: 'Сердце Голема', itemId: 'raid_golem_berserker_accessory', slot: 'accessory', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/golem/raid_golem_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Забрало Голема', itemId: 'raid_golem_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/golem/raid_golem_battlemaster_head.webp' },
      { name: 'Плита Голема', itemId: 'raid_golem_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/golem/raid_golem_battlemaster_body.webp' },
      { name: 'Кулаки Голема', itemId: 'raid_golem_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/golem/raid_golem_battlemaster_hands.webp' },
      { name: 'Поножи Голема', itemId: 'raid_golem_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/golem/raid_golem_battlemaster_legs.webp' },
      { name: 'Сердце Голема', itemId: 'raid_golem_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/golem/raid_golem_battlemaster_accessory.webp' },
    ],
    monk: [ { name: 'Пояс Голема', itemId: 'raid_golem_monk', slot: 'body', stats: { 'Фокус': 3, 'Сила': 3 }, image: '/icons/loot/golem/raid_golem_monk.webp' } ], // временно 1 предмет — ждём остальные 4 иконки сета
    shaman: [
      { name: 'Забрало Голема', itemId: 'raid_golem_shaman_head', slot: 'head', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/golem/raid_golem_shaman_head.webp' },
      { name: 'Плита Голема', itemId: 'raid_golem_shaman_body', slot: 'body', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/golem/raid_golem_shaman_body.webp' },
      { name: 'Кулаки Голема', itemId: 'raid_golem_shaman_hands', slot: 'hands', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/golem/raid_golem_shaman_hands.webp' },
      { name: 'Поножи Голема', itemId: 'raid_golem_shaman_legs', slot: 'legs', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/golem/raid_golem_shaman_legs.webp' },
      { name: 'Сердце Голема', itemId: 'raid_golem_shaman_accessory', slot: 'accessory', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/golem/raid_golem_shaman_accessory.webp' },
    ],
    archmage: [
      { name: 'Забрало Голема', itemId: 'raid_golem_archmage_head', slot: 'head', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/golem/raid_golem_archmage_head.webp' },
      { name: 'Плита Голема', itemId: 'raid_golem_archmage_body', slot: 'body', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/golem/raid_golem_archmage_body.webp' },
      { name: 'Кулаки Голема', itemId: 'raid_golem_archmage_hands', slot: 'hands', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/golem/raid_golem_archmage_hands.webp' },
      { name: 'Поножи Голема', itemId: 'raid_golem_archmage_legs', slot: 'legs', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/golem/raid_golem_archmage_legs.webp' },
      { name: 'Секира Голема', itemId: 'raid_golem_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/golem/raid_golem_archmage_weapon.webp' },
    ],
  },
  scorpion: {
    pathfinder: [
      { name: 'Панцирь-маска Скорпиона', itemId: 'raid_scorpion_pathfinder_head', slot: 'head', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder_head.webp' },
      { name: 'Панцирь Скорпиона', itemId: 'raid_scorpion_pathfinder_body', slot: 'body', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder_body.webp' },
      { name: 'Клешни Скорпиона', itemId: 'raid_scorpion_pathfinder_hands', slot: 'hands', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder_hands.webp' },
      { name: 'Жало Скорпиона', itemId: 'raid_scorpion_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder_weapon.webp' },
      { name: 'Хитин Скорпиона', itemId: 'raid_scorpion_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/scorpion/raid_scorpion_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Панцирь-маска Скорпиона', itemId: 'raid_scorpion_berserker_head', slot: 'head', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/scorpion/raid_scorpion_berserker_head.webp' },
      { name: 'Панцирь Скорпиона', itemId: 'raid_scorpion_berserker_body', slot: 'body', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/scorpion/raid_scorpion_berserker_body.webp' },
      { name: 'Клешни Скорпиона', itemId: 'raid_scorpion_berserker_hands', slot: 'hands', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/scorpion/raid_scorpion_berserker_hands.webp' },
      { name: 'Сапоги Скорпиона', itemId: 'raid_scorpion_berserker_legs', slot: 'legs', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/scorpion/raid_scorpion_berserker_legs.webp' },
      { name: 'Хитин Скорпиона', itemId: 'raid_scorpion_berserker_accessory', slot: 'accessory', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/scorpion/raid_scorpion_berserker_accessory.webp' },
    ],
    battlemaster: [ { name: 'Клешня Скорпиона', itemId: 'raid_scorpion_battlemaster', slot: 'weapon', stats: { 'Силовая выносливость': 4, 'Гибкость': 2 }, image: '/icons/loot/scorpion/raid_scorpion_battlemaster.webp' } ], // временно 1 предмет — ждём остальные 4 иконки сета
    monk: [
      { name: 'Панцирь-маска Скорпиона', itemId: 'raid_scorpion_monk_head', slot: 'head', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/scorpion/raid_scorpion_monk_head.webp' },
      { name: 'Клешни Скорпиона', itemId: 'raid_scorpion_monk_hands', slot: 'hands', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/scorpion/raid_scorpion_monk_hands.webp' },
      { name: 'Сапоги Скорпиона', itemId: 'raid_scorpion_monk_legs', slot: 'legs', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/scorpion/raid_scorpion_monk_legs.webp' },
      { name: 'Жало Скорпиона', itemId: 'raid_scorpion_monk_weapon', slot: 'weapon', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/scorpion/raid_scorpion_monk_weapon.webp' },
      { name: 'Хитин Скорпиона', itemId: 'raid_scorpion_monk_accessory', slot: 'accessory', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/scorpion/raid_scorpion_monk_accessory.webp' },
    ],
    shaman: [
      { name: 'Панцирь-маска Скорпиона', itemId: 'raid_scorpion_shaman_head', slot: 'head', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/scorpion/raid_scorpion_shaman_head.webp' },
      { name: 'Панцирь Скорпиона', itemId: 'raid_scorpion_shaman_body', slot: 'body', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/scorpion/raid_scorpion_shaman_body.webp' },
      { name: 'Клешни Скорпиона', itemId: 'raid_scorpion_shaman_hands', slot: 'hands', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/scorpion/raid_scorpion_shaman_hands.webp' },
      { name: 'Сапоги Скорпиона', itemId: 'raid_scorpion_shaman_legs', slot: 'legs', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/scorpion/raid_scorpion_shaman_legs.webp' },
      { name: 'Хитин Скорпиона', itemId: 'raid_scorpion_shaman_accessory', slot: 'accessory', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/scorpion/raid_scorpion_shaman_accessory.webp' },
    ],
    archmage: [
      { name: 'Панцирь-маска Скорпиона', itemId: 'raid_scorpion_archmage_head', slot: 'head', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/scorpion/raid_scorpion_archmage_head.webp' },
      { name: 'Панцирь Скорпиона', itemId: 'raid_scorpion_archmage_body', slot: 'body', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/scorpion/raid_scorpion_archmage_body.webp' },
      { name: 'Клешни Скорпиона', itemId: 'raid_scorpion_archmage_hands', slot: 'hands', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/scorpion/raid_scorpion_archmage_hands.webp' },
      { name: 'Сапоги Скорпиона', itemId: 'raid_scorpion_archmage_legs', slot: 'legs', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/scorpion/raid_scorpion_archmage_legs.webp' },
      { name: 'Жало Скорпиона', itemId: 'raid_scorpion_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/scorpion/raid_scorpion_archmage_weapon.webp' },
    ],
  },
  owl: {
    pathfinder: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_pathfinder_head', slot: 'head', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/owl/raid_owl_pathfinder_head.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_pathfinder_hands', slot: 'hands', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/owl/raid_owl_pathfinder_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/owl/raid_owl_pathfinder_legs.webp' },
      { name: 'Коготь Совы', itemId: 'raid_owl_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/owl/raid_owl_pathfinder_weapon.webp' },
      { name: 'Взгляд Совы', itemId: 'raid_owl_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 2, 'Воля': 1 }, image: '/icons/loot/owl/raid_owl_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_berserker_head', slot: 'head', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/owl/raid_owl_berserker_head.webp' },
      { name: 'Плащ Совы', itemId: 'raid_owl_berserker_body', slot: 'body', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/owl/raid_owl_berserker_body.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_berserker_hands', slot: 'hands', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/owl/raid_owl_berserker_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_berserker_legs', slot: 'legs', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/owl/raid_owl_berserker_legs.webp' },
      { name: 'Взгляд Совы', itemId: 'raid_owl_berserker_accessory', slot: 'accessory', stats: { 'Сила': 2, 'Упорство': 1 }, image: '/icons/loot/owl/raid_owl_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/owl/raid_owl_battlemaster_head.webp' },
      { name: 'Плащ Совы', itemId: 'raid_owl_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/owl/raid_owl_battlemaster_body.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/owl/raid_owl_battlemaster_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/owl/raid_owl_battlemaster_legs.webp' },
      { name: 'Взгляд Совы', itemId: 'raid_owl_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 2, 'Гибкость': 1 }, image: '/icons/loot/owl/raid_owl_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_monk_head', slot: 'head', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/owl/raid_owl_monk_head.webp' },
      { name: 'Плащ Совы', itemId: 'raid_owl_monk_body', slot: 'body', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/owl/raid_owl_monk_body.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_monk_hands', slot: 'hands', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/owl/raid_owl_monk_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_monk_legs', slot: 'legs', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/owl/raid_owl_monk_legs.webp' },
      { name: 'Коготь Совы', itemId: 'raid_owl_monk_weapon', slot: 'weapon', stats: { 'Фокус': 2, 'Дисциплина': 1 }, image: '/icons/loot/owl/raid_owl_monk_weapon.webp' },
    ],
    shaman: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_shaman_head', slot: 'head', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/owl/raid_owl_shaman_head.webp' },
      { name: 'Плащ Совы', itemId: 'raid_owl_shaman_body', slot: 'body', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/owl/raid_owl_shaman_body.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_shaman_hands', slot: 'hands', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/owl/raid_owl_shaman_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_shaman_legs', slot: 'legs', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/owl/raid_owl_shaman_legs.webp' },
      { name: 'Коготь Совы', itemId: 'raid_owl_shaman_weapon', slot: 'weapon', stats: { 'Дух': 2, 'ХП': 1 }, image: '/icons/loot/owl/raid_owl_shaman_weapon.webp' },
    ],
    archmage: [
      { name: 'Клюв-маска Совы', itemId: 'raid_owl_archmage_head', slot: 'head', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/owl/raid_owl_archmage_head.webp' },
      { name: 'Плащ Совы', itemId: 'raid_owl_archmage_body', slot: 'body', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/owl/raid_owl_archmage_body.webp' },
      { name: 'Когти Совы', itemId: 'raid_owl_archmage_hands', slot: 'hands', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/owl/raid_owl_archmage_hands.webp' },
      { name: 'Лапы Совы', itemId: 'raid_owl_archmage_legs', slot: 'legs', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/owl/raid_owl_archmage_legs.webp' },
      { name: 'Коготь Совы', itemId: 'raid_owl_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 2, 'Мышление': 1 }, image: '/icons/loot/owl/raid_owl_archmage_weapon.webp' },
    ],
  },
  orochi: {
    pathfinder: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_pathfinder_head', slot: 'head', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/orochi/raid_orochi_pathfinder_head.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_pathfinder_hands', slot: 'hands', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/orochi/raid_orochi_pathfinder_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/orochi/raid_orochi_pathfinder_legs.webp' },
      { name: 'Клык Орочи', itemId: 'raid_orochi_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/orochi/raid_orochi_pathfinder_weapon.webp' },
      { name: 'Амулет Орочи', itemId: 'raid_orochi_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/orochi/raid_orochi_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_berserker_head', slot: 'head', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/orochi/raid_orochi_berserker_head.webp' },
      { name: 'Плащ Орочи', itemId: 'raid_orochi_berserker_body', slot: 'body', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/orochi/raid_orochi_berserker_body.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_berserker_hands', slot: 'hands', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/orochi/raid_orochi_berserker_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_berserker_legs', slot: 'legs', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/orochi/raid_orochi_berserker_legs.webp' },
      { name: 'Амулет Орочи', itemId: 'raid_orochi_berserker_accessory', slot: 'accessory', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/orochi/raid_orochi_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/orochi/raid_orochi_battlemaster_head.webp' },
      { name: 'Плащ Орочи', itemId: 'raid_orochi_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/orochi/raid_orochi_battlemaster_body.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/orochi/raid_orochi_battlemaster_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/orochi/raid_orochi_battlemaster_legs.webp' },
      { name: 'Амулет Орочи', itemId: 'raid_orochi_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/orochi/raid_orochi_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_monk_head', slot: 'head', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/orochi/raid_orochi_monk_head.webp' },
      { name: 'Плащ Орочи', itemId: 'raid_orochi_monk_body', slot: 'body', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/orochi/raid_orochi_monk_body.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_monk_hands', slot: 'hands', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/orochi/raid_orochi_monk_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_monk_legs', slot: 'legs', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/orochi/raid_orochi_monk_legs.webp' },
      { name: 'Клык Орочи', itemId: 'raid_orochi_monk_weapon', slot: 'weapon', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/orochi/raid_orochi_monk_weapon.webp' },
    ],
    shaman: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_shaman_head', slot: 'head', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/orochi/raid_orochi_shaman_head.webp' },
      { name: 'Плащ Орочи', itemId: 'raid_orochi_shaman_body', slot: 'body', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/orochi/raid_orochi_shaman_body.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_shaman_hands', slot: 'hands', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/orochi/raid_orochi_shaman_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_shaman_legs', slot: 'legs', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/orochi/raid_orochi_shaman_legs.webp' },
      { name: 'Клык Орочи', itemId: 'raid_orochi_shaman_weapon', slot: 'weapon', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/orochi/raid_orochi_shaman_weapon.webp' },
    ],
    archmage: [
      { name: 'Капюшон Орочи', itemId: 'raid_orochi_archmage_head', slot: 'head', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/orochi/raid_orochi_archmage_head.webp' },
      { name: 'Плащ Орочи', itemId: 'raid_orochi_archmage_body', slot: 'body', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/orochi/raid_orochi_archmage_body.webp' },
      { name: 'Чешуй-перчатки Орочи', itemId: 'raid_orochi_archmage_hands', slot: 'hands', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/orochi/raid_orochi_archmage_hands.webp' },
      { name: 'Поножи Орочи', itemId: 'raid_orochi_archmage_legs', slot: 'legs', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/orochi/raid_orochi_archmage_legs.webp' },
      { name: 'Клык Орочи', itemId: 'raid_orochi_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/orochi/raid_orochi_archmage_weapon.webp' },
    ],
  },
  tiger: {
    pathfinder: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_pathfinder_head', slot: 'head', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/tiger/raid_tiger_pathfinder_head.webp' },
      { name: 'Шкура Тигра', itemId: 'raid_tiger_pathfinder_body', slot: 'body', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/tiger/raid_tiger_pathfinder_body.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/tiger/raid_tiger_pathfinder_legs.webp' },
      { name: 'Клык Тигра', itemId: 'raid_tiger_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/tiger/raid_tiger_pathfinder_weapon.webp' },
      { name: 'Глаз Тигра', itemId: 'raid_tiger_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/tiger/raid_tiger_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_berserker_head', slot: 'head', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/tiger/raid_tiger_berserker_head.webp' },
      { name: 'Шкура Тигра', itemId: 'raid_tiger_berserker_body', slot: 'body', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/tiger/raid_tiger_berserker_body.webp' },
      { name: 'Когти Тигра', itemId: 'raid_tiger_berserker_hands', slot: 'hands', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/tiger/raid_tiger_berserker_hands.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_berserker_legs', slot: 'legs', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/tiger/raid_tiger_berserker_legs.webp' },
      { name: 'Глаз Тигра', itemId: 'raid_tiger_berserker_accessory', slot: 'accessory', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/tiger/raid_tiger_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/tiger/raid_tiger_battlemaster_head.webp' },
      { name: 'Шкура Тигра', itemId: 'raid_tiger_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/tiger/raid_tiger_battlemaster_body.webp' },
      { name: 'Когти Тигра', itemId: 'raid_tiger_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/tiger/raid_tiger_battlemaster_hands.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/tiger/raid_tiger_battlemaster_legs.webp' },
      { name: 'Глаз Тигра', itemId: 'raid_tiger_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/tiger/raid_tiger_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_monk_head', slot: 'head', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/tiger/raid_tiger_monk_head.webp' },
      { name: 'Когти Тигра', itemId: 'raid_tiger_monk_hands', slot: 'hands', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/tiger/raid_tiger_monk_hands.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_monk_legs', slot: 'legs', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/tiger/raid_tiger_monk_legs.webp' },
      { name: 'Клык Тигра', itemId: 'raid_tiger_monk_weapon', slot: 'weapon', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/tiger/raid_tiger_monk_weapon.webp' },
      { name: 'Глаз Тигра', itemId: 'raid_tiger_monk_accessory', slot: 'accessory', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/tiger/raid_tiger_monk_accessory.webp' },
    ],
    shaman: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_shaman_head', slot: 'head', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/tiger/raid_tiger_shaman_head.webp' },
      { name: 'Шкура Тигра', itemId: 'raid_tiger_shaman_body', slot: 'body', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/tiger/raid_tiger_shaman_body.webp' },
      { name: 'Когти Тигра', itemId: 'raid_tiger_shaman_hands', slot: 'hands', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/tiger/raid_tiger_shaman_hands.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_shaman_legs', slot: 'legs', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/tiger/raid_tiger_shaman_legs.webp' },
      { name: 'Клык Тигра', itemId: 'raid_tiger_shaman_weapon', slot: 'weapon', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/tiger/raid_tiger_shaman_weapon.webp' },
    ],
    archmage: [
      { name: 'Оскал-маска Тигра', itemId: 'raid_tiger_archmage_head', slot: 'head', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/tiger/raid_tiger_archmage_head.webp' },
      { name: 'Шкура Тигра', itemId: 'raid_tiger_archmage_body', slot: 'body', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/tiger/raid_tiger_archmage_body.webp' },
      { name: 'Когти Тигра', itemId: 'raid_tiger_archmage_hands', slot: 'hands', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/tiger/raid_tiger_archmage_hands.webp' },
      { name: 'Поножи Тигра', itemId: 'raid_tiger_archmage_legs', slot: 'legs', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/tiger/raid_tiger_archmage_legs.webp' },
      { name: 'Клык Тигра', itemId: 'raid_tiger_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/tiger/raid_tiger_archmage_weapon.webp' },
    ],
  },
  kraken: {
    pathfinder: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_pathfinder_head', slot: 'head', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/kraken/raid_kraken_pathfinder_head.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_pathfinder_hands', slot: 'hands', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/kraken/raid_kraken_pathfinder_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/kraken/raid_kraken_pathfinder_legs.webp' },
      { name: 'Клюв Кракена', itemId: 'raid_kraken_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/kraken/raid_kraken_pathfinder_weapon.webp' },
      { name: 'Сердце Кракена', itemId: 'raid_kraken_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/kraken/raid_kraken_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_berserker_head', slot: 'head', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/kraken/raid_kraken_berserker_head.webp' },
      { name: 'Мантия Кракена', itemId: 'raid_kraken_berserker_body', slot: 'body', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/kraken/raid_kraken_berserker_body.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_berserker_hands', slot: 'hands', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/kraken/raid_kraken_berserker_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_berserker_legs', slot: 'legs', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/kraken/raid_kraken_berserker_legs.webp' },
      { name: 'Сердце Кракена', itemId: 'raid_kraken_berserker_accessory', slot: 'accessory', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/kraken/raid_kraken_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/kraken/raid_kraken_battlemaster_head.webp' },
      { name: 'Мантия Кракена', itemId: 'raid_kraken_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/kraken/raid_kraken_battlemaster_body.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/kraken/raid_kraken_battlemaster_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/kraken/raid_kraken_battlemaster_legs.webp' },
      { name: 'Сердце Кракена', itemId: 'raid_kraken_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/kraken/raid_kraken_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_monk_head', slot: 'head', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/kraken/raid_kraken_monk_head.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_monk_hands', slot: 'hands', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/kraken/raid_kraken_monk_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_monk_legs', slot: 'legs', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/kraken/raid_kraken_monk_legs.webp' },
      { name: 'Клюв Кракена', itemId: 'raid_kraken_monk_weapon', slot: 'weapon', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/kraken/raid_kraken_monk_weapon.webp' },
      { name: 'Сердце Кракена', itemId: 'raid_kraken_monk_accessory', slot: 'accessory', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/kraken/raid_kraken_monk_accessory.webp' },
    ],
    shaman: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_shaman_head', slot: 'head', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/kraken/raid_kraken_shaman_head.webp' },
      { name: 'Мантия Кракена', itemId: 'raid_kraken_shaman_body', slot: 'body', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/kraken/raid_kraken_shaman_body.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_shaman_hands', slot: 'hands', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/kraken/raid_kraken_shaman_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_shaman_legs', slot: 'legs', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/kraken/raid_kraken_shaman_legs.webp' },
      { name: 'Клюв Кракена', itemId: 'raid_kraken_shaman_weapon', slot: 'weapon', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/kraken/raid_kraken_shaman_weapon.webp' },
    ],
    archmage: [
      { name: 'Маска Бездны Кракена', itemId: 'raid_kraken_archmage_head', slot: 'head', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/kraken/raid_kraken_archmage_head.webp' },
      { name: 'Мантия Кракена', itemId: 'raid_kraken_archmage_body', slot: 'body', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/kraken/raid_kraken_archmage_body.webp' },
      { name: 'Щупальца-перчатки Кракена', itemId: 'raid_kraken_archmage_hands', slot: 'hands', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/kraken/raid_kraken_archmage_hands.webp' },
      { name: 'Поножи Кракена', itemId: 'raid_kraken_archmage_legs', slot: 'legs', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/kraken/raid_kraken_archmage_legs.webp' },
      { name: 'Клюв Кракена', itemId: 'raid_kraken_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/kraken/raid_kraken_archmage_weapon.webp' },
    ],
  },
  hydra: {
    pathfinder: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_pathfinder_head', slot: 'head', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/hydra/raid_hydra_pathfinder_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_pathfinder_body', slot: 'body', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/hydra/raid_hydra_pathfinder_body.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_pathfinder_legs', slot: 'legs', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/hydra/raid_hydra_pathfinder_legs.webp' },
      { name: 'Клык Гидры', itemId: 'raid_hydra_pathfinder_weapon', slot: 'weapon', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/hydra/raid_hydra_pathfinder_weapon.webp' },
      { name: 'Кровь Гидры', itemId: 'raid_hydra_pathfinder_accessory', slot: 'accessory', stats: { 'Выносливость': 3, 'Воля': 2 }, image: '/icons/loot/hydra/raid_hydra_pathfinder_accessory.webp' },
    ],
    berserker: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_berserker_head', slot: 'head', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/hydra/raid_hydra_berserker_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_berserker_body', slot: 'body', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/hydra/raid_hydra_berserker_body.webp' },
      { name: 'Когти Гидры', itemId: 'raid_hydra_berserker_hands', slot: 'hands', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/hydra/raid_hydra_berserker_hands.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_berserker_legs', slot: 'legs', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/hydra/raid_hydra_berserker_legs.webp' },
      { name: 'Кровь Гидры', itemId: 'raid_hydra_berserker_accessory', slot: 'accessory', stats: { 'Сила': 3, 'Упорство': 2 }, image: '/icons/loot/hydra/raid_hydra_berserker_accessory.webp' },
    ],
    battlemaster: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_battlemaster_head', slot: 'head', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/hydra/raid_hydra_battlemaster_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_battlemaster_body', slot: 'body', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/hydra/raid_hydra_battlemaster_body.webp' },
      { name: 'Когти Гидры', itemId: 'raid_hydra_battlemaster_hands', slot: 'hands', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/hydra/raid_hydra_battlemaster_hands.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_battlemaster_legs', slot: 'legs', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/hydra/raid_hydra_battlemaster_legs.webp' },
      { name: 'Кровь Гидры', itemId: 'raid_hydra_battlemaster_accessory', slot: 'accessory', stats: { 'Силовая выносливость': 3, 'Гибкость': 2 }, image: '/icons/loot/hydra/raid_hydra_battlemaster_accessory.webp' },
    ],
    monk: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_monk_head', slot: 'head', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/hydra/raid_hydra_monk_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_monk_body', slot: 'body', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/hydra/raid_hydra_monk_body.webp' },
      { name: 'Когти Гидры', itemId: 'raid_hydra_monk_hands', slot: 'hands', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/hydra/raid_hydra_monk_hands.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_monk_legs', slot: 'legs', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/hydra/raid_hydra_monk_legs.webp' },
      { name: 'Клык Гидры', itemId: 'raid_hydra_monk_weapon', slot: 'weapon', stats: { 'Фокус': 3, 'Дисциплина': 2 }, image: '/icons/loot/hydra/raid_hydra_monk_weapon.webp' },
    ],
    shaman: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_shaman_head', slot: 'head', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/hydra/raid_hydra_shaman_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_shaman_body', slot: 'body', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/hydra/raid_hydra_shaman_body.webp' },
      { name: 'Когти Гидры', itemId: 'raid_hydra_shaman_hands', slot: 'hands', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/hydra/raid_hydra_shaman_hands.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_shaman_legs', slot: 'legs', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/hydra/raid_hydra_shaman_legs.webp' },
      { name: 'Клык Гидры', itemId: 'raid_hydra_shaman_weapon', slot: 'weapon', stats: { 'Дух': 3, 'ХП': 2 }, image: '/icons/loot/hydra/raid_hydra_shaman_weapon.webp' },
    ],
    archmage: [
      { name: 'Голова Гидры', itemId: 'raid_hydra_archmage_head', slot: 'head', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/hydra/raid_hydra_archmage_head.webp' },
      { name: 'Чешуя Гидры', itemId: 'raid_hydra_archmage_body', slot: 'body', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/hydra/raid_hydra_archmage_body.webp' },
      { name: 'Когти Гидры', itemId: 'raid_hydra_archmage_hands', slot: 'hands', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/hydra/raid_hydra_archmage_hands.webp' },
      { name: 'Поножи Гидры', itemId: 'raid_hydra_archmage_legs', slot: 'legs', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/hydra/raid_hydra_archmage_legs.webp' },
      { name: 'Клык Гидры', itemId: 'raid_hydra_archmage_weapon', slot: 'weapon', stats: { 'Интеллект': 3, 'Мышление': 2 }, image: '/icons/loot/hydra/raid_hydra_archmage_weapon.webp' },
    ],
  },
};


// Боссы, у которых сейчас есть повторяемый лут-сет (см. RAID_LOOT_SETS_BY_CLASS выше).
// Legendary/mythic намеренно не входят — они пока на старой одноразовой системе.
export const REPEATABLE_SET_BOSS_IDS = ['boar', 'golem', 'scorpion', 'owl', 'orochi', 'tiger', 'kraken', 'hydra'];

// Порог допуска к legendary/mythic — сумма двух статов залоченного класса (та же метрика,
// что уже используется для открытия аватарок через classStatTotal).
export const RARITY_ACCESS_THRESHOLD = { legendary: 250, mythic: 350 };

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
    history: 'Ростом он вепрю положенного размера не соответствует вовсе — в холке выше человека, с шеей, обмотанной буграми свалявшейся шерсти цвета выжженного песка, будто он сам слеплен из того же материала, что и барханы вокруг. Клыки у него не белые и не жёлтые — тускло-синие, с сеткой мелких трещин, как старое стекло, что пролежало на солнце слишком долго и стало хрупким изнутри, но пока ещё держит форму. Глаза почти не видны — узкие щели под тяжёлыми складками кожи, будто он и сам щурится от того самого солнца, которое выжгло всё вокруг него.\n\nОн не рычит и не воет — единственный звук, который от него слышен издалека, это дыхание, тяжёлое, ровное, похожее на звук, с которым проседает песок под собственным весом. Двигается он редко, но когда решает сдвинуться, делает это в одну сторону и на полной скорости, будто вся его жизнь состоит из подготовки к одному-единственному разбегу.\n\nО нём рассказывают многие — почти каждый отряд, добравшийся до этих барханов, встречал его хотя бы раз, потому что он не прячется и не выбирает жертву заранее. Большинство уходило ни с чем, вымотанные первым же днём: сила против него работает плохо, тяжёлые удары он встречает так же охотно, как встречает всё остальное — телом, массой, готовностью стоять до последнего. Побеждают его редко, и почти всегда одним и тем же способом — не силой, а бегом, тем, чего у него самого, при всей его массе, надолго не хватает.',
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
    history: 'Он редко показывается целиком — то, что видно чаще всего, это отблеск чешуи где-то на границе света костра, синевато-серебристой, будто вырезанной из самого лунного диска. Тело у него длинное, свивается кольцами, но не угрожающе, а скорее лениво, как у существа, которому некуда спешить, потому что время и так на его стороне. Голова маленькая, почти изящная, с двумя парами глаз — одна пара смотрит на тебя, вторая, кажется, всегда прикрыта, будто он сам постоянно недосыпает и от этого зол.\n\nОн не нападает клыком и не душит кольцами — его оружие тоньше и подлее: он выжидает, пока кто-то в отряде сам, добровольно, отложит книгу на потом, срежет ужин до перекуса, урежет сон на полчаса. Каждое такое решение он забирает себе, будто ест не плоть, а именно слабину, и с каждым съеденным послаблением его чешуя становится чуть ярче.\n\nОтряды, что уходили драться с ним, редко возвращались быстро — семь дней подряд без единого срыва в трёх привычках сразу оказывается куда труднее, чем один сокрушительный удар. Большинство сдавалось не в бою, а где-то на четвёртый-пятый день, когда усталость от дисциплины начинала казаться тяжелее любой раны. Побеждали его немногие, и все они рассказывают одно: против него не помогает сила воли рывком — помогает только скука, доведённая до автоматизма, та самая, когда правильное решение принимается уже не потому что трудно, а просто потому что иначе никак.',
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
    history: 'О Драконе говорят, что он не спускался с неба — просто однажды заметили, что становится теплее с каждым несожжённым днём. Тридцать дней — не случайная цифра: ровно столько нужно, чтобы жар перестал быть метафорой и стал будильником по утрам.',
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
    history: 'Он не сделан — он, кажется, просто оказался таким, каким должен был стать этот участок карьера, если бы камню однажды позволили встать и не ложиться обратно. Плиты на его теле не подогнаны друг к другу гладко, как у доспеха, — они наросли неровно, слоями, будто он годами стоял на одном месте, и порода вокруг него постепенно становилась им самим. На груди — широкая трещина, старая, замазанная чем-то похожим на смолу, но так и не заросшая до конца.\n\nГолем не агрессивен в привычном смысле — он вообще ничего не делает, пока к нему не подойти вплотную, и даже тогда его первая реакция — просто оказаться на пути. Удары его редки, тяжелы и совершенно предсказуемы: прямая линия, вся масса в одну точку. Он никогда не финтит и не пытается обмануть — ему это, кажется, попросту не нужно, потому что большинство и без обмана не выдерживает больше двух-трёх столкновений подряд.\n\nК нему приходили десятками — в основном силачи-одиночки, уверенные, что дело в одном хорошем ударе. Уходили с той же уверенностью, только теперь она касалась того, что одного удара мало. Голем не помнит противников — трещины на его теле не убирают по одной, они просто накапливаются, пока однажды не срастаются в одну общую, за которой уже ничего не держится. Побеждают его редко и почти никогда быстро — только те, кто готов возвращаться к нему снова и снова, столько раз, сколько потребуется.',
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
    weakness: 'Сила + Бег',
    sharedTitle: 'Клыки и ветер',
    lootTier: 'epic',
    history: 'Шкура у него не полосатая в привычном смысле — скорее выцветшая, песочно-рыжая с редкими тёмными разводами, будто барханы сами оставили на нём свой узор. Он крупнее обычного тигра почти вдвое, но именно поэтому двигается неожиданно тихо для такой массы — лапы у него широкие, мягкие, ступают так, что даже сухой песок под ними почти не хрустит. Хвост он держит низко, у самой земли, и именно по едва заметному следу от него опытные охотники и понимают, что где-то рядом.\n\nОн не бросается сразу — сначала долго кружит по периметру лагеря, оценивая не запах и не звук, а именно то, кто в отряде силён, кто быстр, а кто пытается разрываться между тем и другим одновременно. Атакует он тоже не одним способом — то массой, всем весом, то рывком, скоростью, никогда не позволяя понять заранее, какую именно проверку он сегодня устроит.\n\nС ним сталкивались многие отряды, уверенные, что универсальность — это сила, а не слабость, и именно за эту уверенность он их и наказывал: тот, кто пытался закрыть сразу обе его проверки в одиночку, обычно ломался первым. Побеждали его редко, и почти всегда те составы, где каждый чётко держал свою половину, не размениваясь на чужую, — а тот единственный, кто всё-таки брал на себя обе роли сразу, дотягивал до конца на чистом упрямстве, зная, что тащит за двоих.',
    description: '14 дней. Каждый выбирает одну роль до старта (все три роли должны быть заняты): Коготь — 10 силовых, Ветер — 12 пробежек, Клык и Коготь — 7 силовых И 7 пробежек (обе части нужно закрыть отдельно).',
    condition: {
      type: 'combo_roles',
      label: 'Роли выполнены',
      roles: {
        claw: { activity: ['strength_gym', 'strength_park'], target: 10, unit: 'тренировок', label: '🦾 Коготь', emoji: '🦾' },
        wind: { activity: 'running', target: 12, unit: 'пробежек', label: '💨 Ветер', emoji: '💨' },
        both: {
          label: '⚡ Клык и Коготь', emoji: '⚡',
          subtargets: [
            { activities: ['strength_gym', 'strength_park'], target: 7, unit: 'силовых' },
            { activities: ['running'], target: 7, unit: 'пробежек' },
          ],
        },
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
    history: 'Феникса невозможно застать целиком — он весь состоит из повторений, а повторение никогда не бывает одним куском. Мифическим его зовут не за силу, а за терпение: он единственный, кто готов ждать двадцать один день подряд, лишь бы отряд забыл хоть один.',
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
    history: 'Он почти никогда не виден целиком — панцирь у него в цвет песка, чуть темнее в сочленениях, и большую часть времени наружу торчит разве что кончик хвоста, неподвижный, будто высохшая ветка. Клешни он держит поджатыми, близко к телу, — раскрывает их только в последний момент, и тогда становится ясно, насколько он на самом деле крупный: размах едва ли не в человеческий рост, каждая клешня толще запястья взрослого мужчины.\n\nЯд у него не быстрый — он вообще не рассчитан на то, чтобы убивать сразу. Он копится: одна капля, ещё одна, лёгкое недомогание, которое легко списать на жару, пока не наберётся достаточно, чтобы свалить с ног целиком. Странники говорят, что скорпион будто бы чувствует не запах и не тепло, а нечто другое — усталость, с которой человек сам заходит слишком далеко от привычного распорядка, ту самую секунду, когда решимость есть нормально уже разошлась с реальностью.\n\nОтряды, встречавшие его, чаще всего терпели поражение не от прямого удара, а от накопленной усталости — трёх, четырёх, пяти дней подряд плохих решений, каждое из которых по отдельности казалось пустяком. Тех, кто всё-таки его одолел, было немного, и все они рассказывают одно и то же: победа над ним ощущается не как триумф, а как самое обычное чувство — просто ты продержался на дисциплине дольше, чем он держался на яде.',
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
    history: 'Она садится так, что её почти невозможно заметить, пока не почувствуешь на себе взгляд, — не на ветке, не на скале, а где-то на самой границе зрения, там, где боковое зрение обычно ничего не показывает, кроме смутного силуэта. Перья у неё не серые и не бурые, как у обычной совы, — тёмно-багровые, почти чёрные в тени, и только в редкий момент, когда она разворачивает голову, в них проступает глубокий, почти кровавый отблеск, откуда и пошло её имя.\n\nОна не нападает первой в привычном смысле — её оружие не когти и не клюв, хотя они у неё есть и по-настоящему острые. Её оружие — тишина и наблюдение: она смотрит достаточно долго, чтобы найти в отряде того, кто реже всех сомневается в собственных мыслях, и именно туда пускает первый шёпот, первую иллюзию, первую ложную уверенность.\n\nС ней сталкивались многие, кто искал в пустыне не бой, а просто дорогу подальше от разбитого лагеря, — и не все замечали её присутствие до тех пор, пока не начинали путаться в собственных решениях без видимой причины. Одолеть её силой невозможно в принципе — она слишком быстрая и слишком осторожная для прямого боя. Побеждают её только те, кто оказывается упрямее собственных сомнений дольше, чем она готова их подпитывать, — и таких, по рассказам, наберётся едва ли на две ладони пальцев.',
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
    history: 'Никакого моря рядом нет — и в этом главная странность встречи с ним. Он появляется не из воды, а из той самой темноты, что сгущается в палатке в час ночи, когда сон давно должен был начаться, а вместо этого горит экран или свет. Щупальца у него не мокрые и не склизкие, как рассказывают о морских тварях, — они сухие, тяжёлые, цвета остывшего пепла, и на ощупь, говорят те немногие, кто касался их и выжил, похожи скорее на туго свёрнутые канаты, чем на плоть.\n\nОн не хватает сразу — обвивает медленно, одно щупальце за другим, за каждый упущенный час сна сверх положенного, за каждое «ещё пятнадцать минут», которое растягивается на час. Сам он, по всем рассказам, никогда толком не спал — оттого и питается чужой бессонницей так жадно, будто восполняет то, чего у него никогда не было.\n\nОтряды, вступавшие с ним в схватку, обычно недооценивали не его силу, а скуку самой битвы: тридцать ночей нормального сна на троих звучит просто, пока не наступает пятая ночь подряд, когда лечь пораньше кажется скучнее, чем любой бой. Большинство сдавалось не от удара, а от одной пропущенной ночи, обернувшейся привычкой. Побеждали его немногие — и все они в один голос говорят, что победа над ним не ощущается как триумф, а скорее как облегчение человека, который наконец-то нормально выспался.',
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
    history: 'У неё действительно три головы, и это не преувеличение странников — просто три совершенно разных существа, сросшихся в одном теле так давно, что уже не разделить, где заканчивается одна шея и начинается другая. Первая голова тяжёлая, приземистая, с толстой роговой чешуёй — она бьёт массой. Вторая — узкая, с холодными немигающими глазами, будто вечно что-то читает в воздухе перед собой. Третья — самая маленькая, но и самая быстрая, шея у неё длиннее остальных, и движется она рывками, как хлыст.\n\nОна никогда не атакует одной головой — драться с ней, используя тактику против только одной из трёх, бессмысленно: пока внимание уходит на силу, разум и скорость продолжают действовать независимо, будто три отдельные твари делят одно тело, но не одну стратегию. Убить одну голову — не победа; она просто отращивает недостающее там, где отряд решил, что можно обойтись двумя из трёх.\n\nК ней приходили отряды, рассчитывавшие на одну сильную сторону, — силачи, надеявшиеся задавить массой, книжники, надеявшиеся перехитрить, бегуны, надеявшиеся вымотать дистанцией. Все они справлялись с одной головой и проигрывали двум оставшимся. Побеждали её только те тройки, что закрывали три совершенно разных фронта одновременно, каждый своим оружием, — и ни разу иначе.',
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
    history: 'Ящер не оставляет следов — потому что сам он и есть накопленный след каждого несделанного шага. Девятьсот тысяч шагов на троих — цифра, которая на бумаге выглядит абсурдно, а по факту складывается из одной и той же ежедневной мелочи: выйти и просто идти.',
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
    history: 'Левиафан не признаёт ни одной дисциплины в отдельности — только их сумму: силу, борьбу, бег, всё вместе, без права спрятаться за любимым видом активности. «Каменное сердце» — потому что оно бьётся ровно в том темпе, в каком отряд заставляет себя двигаться, и ни секундой чаще.',
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

