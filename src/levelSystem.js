// ---------- СИСТЕМА УРОВНЕЙ ----------
import { Flame, Trophy, Zap, Beef, Sprout, Droplet, Shield, Sword, Star, Crown, Gem } from 'lucide-react';

// ---------- LEVEL SYSTEM ----------
// Non-linear curve with a growing exponent: cumulative XP required to reach level n =
// round(12 * n ^ (1.4 + (n-1) * 0.003)).
// Exponent smoothly grows from 1.4 (early) to ~1.547 (level 50), so:
// - first 10 levels come fast (moderate player hits lvl 10 in ~8 days),
// - progression noticeably slows past level 20,
// - endgame (40+) feels weightier without turning into a grind.
// Target pacing: casual ~7 months to 50, moderate ~4.5 months, active ~2.5 months.
export const MAX_LEVEL = 50;

export function totalXpForLevel(n) {
  if (n <= 1) return 0;
  const exponent = 1.4 + (n - 1) * 0.003;
  return Math.round(12 * Math.pow(n, exponent));
}

export function levelFromTotalXp(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

// Titles every 5 levels. Placeholder names — the person will supply their own later.
export const LEVEL_TITLES = [
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

export function titleForLevel(level) {
  const entry = LEVEL_TITLES.find((t) => level >= t.from && level <= t.to);
  return entry ? entry.title : '';
}

export function titleEntryForLevel(level) {
  return LEVEL_TITLES.find((t) => level >= t.from && level <= t.to) || null;
}


