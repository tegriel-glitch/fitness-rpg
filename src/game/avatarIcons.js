// ---------- ИКОНКИ АВАТАРА (эмодзи-предметы) ----------
import React from 'react';

// ---------- AVATAR ICONS ----------
export function AvatarSvg({ svgContent, size = 28 }) {
  return <span style={{ fontSize: size, lineHeight: 1, display: 'block' }}>{svgContent}</span>;
}

export const AVATAR_EMOJIS = [
  // ── КЛАССЫ ──────────────────────────────────────────
  { id: 'hood',           name: 'Капюшон следопыта',  group: 'Классы', svg: '🪖' },
  { id: 'berserker_helm', name: 'Шлем берсерка',      group: 'Классы', svg: '⛑️' },
  { id: 'prayer_beads',   name: 'Чётки монаха',       group: 'Классы', svg: '📿' },
  { id: 'spirit_mask',    name: 'Маска шамана',       group: 'Классы', svg: '🎭' },
  { id: 'archmage_hat',   name: 'Шляпа архимага',     group: 'Классы', svg: '🧙' },
  { id: 'mace',           name: 'Булава мастера',     group: 'Классы', svg: '🏋️' },
  // ── ОРУЖИЕ ──────────────────────────────────────────
  { id: 'longsword',      name: 'Длинный меч',        group: 'Оружие', svg: '⚔️' },
  { id: 'dagger_rune',    name: 'Рунический кинжал',  group: 'Оружие', svg: '🗡️' },
  { id: 'bow',            name: 'Лук следопыта',      group: 'Оружие', svg: '🏹' },
  { id: 'staff_arcane',   name: 'Аркановый посох',    group: 'Оружие', svg: '🪄' },
  { id: 'axe_battle',     name: 'Боевой топор',       group: 'Оружие', svg: '🪓' },
  { id: 'shield_knight',  name: 'Рыцарский щит',      group: 'Оружие', svg: '🛡️' },
  { id: 'trident',        name: 'Трезубец',           group: 'Оружие', svg: '🔱' },
  { id: 'hammer',         name: 'Молот войны',        group: 'Оружие', svg: '🔨' },
  { id: 'spear',          name: 'Копьё',              group: 'Оружие', svg: '🪃' },
  { id: 'bomb_w',         name: 'Бомба',              group: 'Оружие', svg: '💣' },
  { id: 'crossbow',       name: 'Арбалет',            group: 'Оружие', svg: '🎯' },
  { id: 'katana',         name: 'Катана',             group: 'Оружие', svg: '🥷' },
  { id: 'pick',           name: 'Кирка',              group: 'Оружие', svg: '⛏️' },
  { id: 'anchor',         name: 'Якорь',              group: 'Оружие', svg: '⚓' },
  // ── СТИХИИ ──────────────────────────────────────────
  { id: 'fire_elem',      name: 'Пламя',              group: 'Стихии', svg: '🔥' },
  { id: 'ice_elem',       name: 'Лёд',                group: 'Стихии', svg: '❄️' },
  { id: 'lightning_elem', name: 'Молния',             group: 'Стихии', svg: '⚡' },
  { id: 'wind_elem',      name: 'Ветер',              group: 'Стихии', svg: '🌪️' },
  { id: 'earth_elem',     name: 'Земля',              group: 'Стихии', svg: '🪨' },
  { id: 'water_elem',     name: 'Вода',               group: 'Стихии', svg: '🌊' },
  { id: 'shadow_elem',    name: 'Тень',               group: 'Стихии', svg: '🌑' },
  { id: 'moon_elem',      name: 'Луна',               group: 'Стихии', svg: '🌙' },
  { id: 'sun_elem',       name: 'Солнце',             group: 'Стихии', svg: '☀️' },
  { id: 'volcano_elem',   name: 'Вулкан',             group: 'Стихии', svg: '🌋' },
  { id: 'storm_elem',     name: 'Шторм',              group: 'Стихии', svg: '⛈️' },
  { id: 'comet_elem',     name: 'Комета',             group: 'Стихии', svg: '☄️' },
  { id: 'poison_elem',    name: 'Яд',                 group: 'Стихии', svg: '🌿' },
  { id: 'acid_elem',      name: 'Кислота',            group: 'Стихии', svg: '🧪' },
  { id: 'void_elem',      name: 'Пустота',            group: 'Стихии', svg: '🕳️' },
  { id: 'star_elem',      name: 'Звезда',             group: 'Стихии', svg: '⭐' },
  // ── ЗВЕРИ ──────────────────────────────────────────
  { id: 'wolf_beast',     name: 'Волк',               group: 'Звери',  svg: '🐺' },
  { id: 'dragon_beast',   name: 'Дракон',             group: 'Звери',  svg: '🐉' },
  { id: 'eagle_beast',    name: 'Орёл',               group: 'Звери',  svg: '🦅' },
  { id: 'serpent_beast',  name: 'Змей',               group: 'Звери',  svg: '🐍' },
  { id: 'bear_beast',     name: 'Медведь',            group: 'Звери',  svg: '🐻' },
  { id: 'raven_beast',    name: 'Ворон',              group: 'Звери',  svg: '🐦‍⬛' },
  { id: 'lion_beast',     name: 'Лев',                group: 'Звери',  svg: '🦁' },
  { id: 'tiger_beast',    name: 'Тигр',               group: 'Звери',  svg: '🐯' },
  { id: 'fox_beast',      name: 'Лис',                group: 'Звери',  svg: '🦊' },
  { id: 'bat_beast',      name: 'Летучая мышь',       group: 'Звери',  svg: '🦇' },
  { id: 'unicorn_beast',  name: 'Единорог',           group: 'Звери',  svg: '🦄' },
  // ── АРКАН ──────────────────────────────────────────
  { id: 'crystal_ball',   name: 'Хрустальный шар',   group: 'Аркан',  svg: '🔮' },
  { id: 'eye_arcane',     name: 'Всевидящее oko',     group: 'Аркан',  svg: '👁️' },
  { id: 'rune_stone',     name: 'Руна силы',          group: 'Аркан',  svg: '🪬' },
  { id: 'potion',         name: 'Зелье силы',         group: 'Аркан',  svg: '⚗️' },
  { id: 'scroll',         name: 'Свиток знания',      group: 'Аркан',  svg: '📜' },
  { id: 'crown_arcane',   name: 'Корона владыки',     group: 'Аркан',  svg: '👑' },
  { id: 'gem_arcane',     name: 'Камень душ',         group: 'Аркан',  svg: '💎' },
  { id: 'skull_arcane',   name: 'Череп',              group: 'Аркан',  svg: '💀' },
  { id: 'pentagram',      name: 'Пентаграмма',        group: 'Аркан',  svg: '⛧' },
  { id: 'hourglass',      name: 'Песочные часы',      group: 'Аркан',  svg: '⌛' },
  { id: 'alchemy',        name: 'Алхимия',            group: 'Аркан',  svg: '🧿' },
  { id: 'tome',           name: 'Магический фолиант', group: 'Аркан',  svg: '📖' },
  { id: 'candle',         name: 'Свеча судьбы',       group: 'Аркан',  svg: '🕯️' },
  { id: 'spider_web',     name: 'Паутина',            group: 'Аркан',  svg: '🕸️' },
  { id: 'infinity',       name: 'Бесконечность',      group: 'Аркан',  svg: '♾️' },
  { id: 'ankh',           name: 'Анкх',               group: 'Аркан',  svg: '☥' },
  // ── НЕЙТРАЛЬНЫЕ ──────────────────────────────────────────
  { id: 'mountain_n',     name: 'Гора',               group: 'Нейтральные', svg: '🏔️' },
  { id: 'forest_n',       name: 'Лес',                group: 'Нейтральные', svg: '🌲' },
  { id: 'castle_n',       name: 'Замок',              group: 'Нейтральные', svg: '🏰' },
  { id: 'tent_n',         name: 'Лагерь',             group: 'Нейтральные', svg: '⛺' },
  { id: 'compass_n',      name: 'Компас',             group: 'Нейтральные', svg: '🧭' },
  { id: 'lantern_n',      name: 'Фонарь',             group: 'Нейтральные', svg: '🪔' },
  { id: 'coin_n',         name: 'Золотая монета',     group: 'Нейтральные', svg: '🪙' },
  { id: 'map_n',          name: 'Карта мира',         group: 'Нейтральные', svg: '🗺️' },
  { id: 'trophy_n',       name: 'Трофей',             group: 'Нейтральные', svg: '🏆' },
  { id: 'dice_n',         name: 'Кости судьбы',       group: 'Нейтральные', svg: '🎲' },
  { id: 'key_n',          name: 'Ключ',               group: 'Нейтральные', svg: '🗝️' },
  { id: 'ghost_n',        name: 'Призрак',            group: 'Нейтральные', svg: '👻' },
];


// No mock members — only real players who have selected a nickname appear in the guild.
// When Supabase is connected, live player profiles will be fetched here.
