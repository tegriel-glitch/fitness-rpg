// ---------- ВАЛЮТА, МАГАЗИН, РАМКИ АВАТАРА, ФОНЫ ПРОФИЛЯ, РАСХОДНИКИ ----------
import { Flame, Dumbbell, Salad, Moon, BookOpen, Swords, Sparkles, Heart, Brain, FlaskConical, Footprints, Wind, Sprout, Droplet, Shield, Sword, Star, Crown, Gem, Wand2, Hand, Sparkle, Skull, Medal, Scale, Glasses, Watch, Shirt, HardHat, Ear, Axe, ShoppingBag, Compass, Scroll, RotateCcw } from 'lucide-react';

// ---------- CURRENCY & SHOP ----------
// "Кристаллы" — earned two ways: a share of every XP gain, plus a small passive trickle
// based on total accumulated stats. Spent in the shop on cosmetic gear with minor XP bonuses.
export const XP_TO_CURRENCY_RATE = 0.70; // main crystal income from stat XP
export const PASSIVE_CURRENCY_RATE = 0.15; // passive trickle (together = 0.85x stat-XP → ~30 crystals/day at moderate play)
export const SHOP_REFUND_RATE = 0.70; // sold items return 70% of purchase price (paid items only)

export const RARITY_TIERS = {
  common: { label: 'Обычный', color: '#c9c9d2', bg: '#23232a' },
  rare: { label: 'Редкий', color: '#5b9bf0', bg: '#162236' },
  epic: { label: 'Эпический', color: '#a35bf0', bg: '#231832' },
  legendary: { label: 'Легендарный', color: '#f0c14b', bg: '#332710' },
  mythic: { label: 'Мифический', color: '#f0574b', bg: '#33150f' },
};

export const SHOP_SLOTS = [
  { key: 'head', label: 'Голова' },
  { key: 'body', label: 'Тело' },
  { key: 'accessory', label: 'Аксессуар' },
  { key: 'legs', label: 'Ноги' },
  { key: 'hands', label: 'Руки' },
  { key: 'weapon', label: 'Оружие' },
];

export const SHOP_ITEMS = [
  // --- Common (10) — small +3% XP bonus each ---
  { id: 'shop_common_cap', slot: 'head', rarity: 'common', name: 'Тренировочная кепка', icon: HardHat, price: 40, bonus: { activity: 'running', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_cap.webp' },
  { id: 'shop_common_shirt', slot: 'body', rarity: 'common', name: 'Простая футболка', icon: Shirt, price: 40, bonus: { activity: 'nutrition', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_shirt.webp' },
  { id: 'shop_common_watch', slot: 'accessory', rarity: 'common', name: 'Спортивные часы', icon: Watch, price: 35, bonus: { activity: 'sleep', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_watch.webp' },
  { id: 'shop_common_band', slot: 'head', rarity: 'common', name: 'Повязка на голову', icon: HardHat, price: 30, bonus: { activity: 'wrestling', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_band.webp' },
  { id: 'shop_common_gloves', slot: 'hands', rarity: 'common', name: 'Тканевые перчатки', icon: Hand, price: 30, bonus: { activity: 'strength_gym', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_gloves.webp' },
  { id: 'shop_common_socks', slot: 'legs', rarity: 'common', name: 'Компрессионные носки', icon: Footprints, price: 32, bonus: { activity: 'strength_park', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_socks.webp' },
  { id: 'shop_common_bracelet', slot: 'accessory', rarity: 'common', name: 'Плетёный браслет', icon: Watch, price: 28, bonus: { activity: 'reading', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_bracelet.webp' },
  { id: 'shop_common_sweatband', slot: 'hands', rarity: 'common', name: 'Напульсник', icon: Hand, price: 25, bonus: { activity: 'strength_gym', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_sweatband.webp' },
  { id: 'shop_common_backpack', slot: 'body', rarity: 'common', name: 'Рюкзак путешественника', icon: ShoppingBag, price: 38, bonus: { activity: 'reading', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_backpack.webp' },
  { id: 'shop_common_ring', slot: 'accessory', rarity: 'common', name: 'Простое кольцо', icon: Gem, price: 30, bonus: { activity: 'nutrition', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_ring.webp' },

  // --- Rare (10) — +10% XP bonus each ---
  { id: 'shop_rare_helmet', slot: 'head', rarity: 'rare', name: 'Шлем атлета', icon: HardHat, price: 120, bonus: { activity: 'running', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_helmet.webp' },
  { id: 'shop_rare_armor', slot: 'body', rarity: 'rare', name: 'Лёгкая броня', icon: Shield, price: 130, bonus: { activity: 'strength_gym', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_armor.webp' },
  { id: 'shop_rare_glasses', slot: 'head', rarity: 'rare', name: 'Очки мудреца', icon: Glasses, price: 110, bonus: { activity: 'reading', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_glasses.webp' },
  { id: 'shop_rare_cloak', slot: 'body', rarity: 'rare', name: 'Дорожный плащ', icon: Shirt, price: 125, bonus: { activity: 'nutrition', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_cloak.webp' },
  { id: 'shop_rare_earring', slot: 'accessory', rarity: 'rare', name: 'Серьга странника', icon: Ear, price: 100, bonus: { activity: 'sleep', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_earring.webp' },
  { id: 'shop_rare_gauntlets', slot: 'hands', rarity: 'rare', name: 'Перчатки хватки', icon: Hand, price: 115, bonus: { activity: 'strength_park', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_gauntlets.webp' },
  { id: 'shop_rare_bandana', slot: 'head', rarity: 'rare', name: 'Бандана бойца', icon: HardHat, price: 118, bonus: { activity: 'wrestling', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_bandana.webp' },
  { id: 'shop_rare_vest', slot: 'body', rarity: 'rare', name: 'Жилет борца', icon: Shield, price: 128, bonus: { activity: 'wrestling', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_vest.webp' },
  { id: 'shop_rare_pendant', slot: 'accessory', rarity: 'rare', name: 'Кулон концентрации', icon: Gem, price: 112, bonus: { activity: 'reading', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_pendant.webp' },
  { id: 'shop_rare_boots', slot: 'legs', rarity: 'rare', name: 'Беговые кроссовки', icon: Footprints, price: 122, bonus: { activity: 'running', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_boots.webp' },

  // --- Epic (10) — +15% XP bonus each ---
  { id: 'shop_epic_crown', slot: 'head', rarity: 'epic', name: 'Венец чемпиона', icon: Crown, price: 210, bonus: { activity: 'wrestling', xpBonusPct: 15 } },
  { id: 'shop_epic_blade', slot: 'weapon', rarity: 'epic', name: 'Клинок дисциплины', icon: Sword, price: 220, bonus: { activity: 'strength_park', xpBonusPct: 15 } },
  { id: 'shop_epic_shield', slot: 'body', rarity: 'epic', name: 'Эпический нагрудник', icon: ShoppingBag, price: 230, bonus: { activity: 'running', xpBonusPct: 15 } },
  { id: 'shop_epic_amulet', slot: 'accessory', rarity: 'epic', name: 'Амулет ясного разума', icon: Gem, price: 215, bonus: { activity: 'reading', xpBonusPct: 15 } },
  { id: 'shop_epic_boots', slot: 'weapon', rarity: 'epic', name: 'Посох пилигрима', icon: Footprints, price: 200, bonus: { activity: 'walking', xpBonusPct: 20 } },
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

  // --- Ходьба: экипировка странника ---
  { id: 'shop_common_pilgrim_boots', slot: 'legs', rarity: 'common', name: 'Сапоги странника', icon: Footprints, price: 35, bonus: { activity: 'walking', xpBonusPct: 10 }, image: '/icons/shop/common/shop_common_pilgrim_boots.webp' },
  { id: 'shop_rare_road_cloak', slot: 'body', rarity: 'rare', name: 'Плащ дороги', icon: Shirt, price: 120, bonus: { activity: 'walking', xpBonusPct: 15 }, image: '/icons/shop/rare/shop_rare_road_cloak.webp' },

  // --- Common weapons (4) ---
  { id: 'shop_common_stick', slot: 'weapon', rarity: 'common', name: 'Деревянная палка', icon: Wand2, price: 30, bonus: { activity: 'strength_park', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_stick.webp' },
  { id: 'shop_common_sling', slot: 'weapon', rarity: 'common', name: 'Тренировочная праща', icon: Sword, price: 35, bonus: { activity: 'wrestling', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_sling.webp' },
  { id: 'shop_common_dagger', slot: 'weapon', rarity: 'common', name: 'Тупой кинжал', icon: Sword, price: 28, bonus: { activity: 'running', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_dagger.webp' },
  { id: 'shop_common_club', slot: 'weapon', rarity: 'common', name: 'Дубина новичка', icon: Axe, price: 32, bonus: { activity: 'strength_gym', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_club.webp' },

  // --- Common extra (8 more) ---
  { id: 'shop_common_towel', slot: 'body', rarity: 'common', name: 'Полотенце бойца', icon: Shirt, price: 25, bonus: { activity: 'strength_gym', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_towel.webp' },
  { id: 'shop_common_headlamp', slot: 'head', rarity: 'common', name: 'Налобный фонарь', icon: HardHat, price: 28, bonus: { activity: 'running', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_headlamp.webp' },
  { id: 'shop_common_notebook', slot: 'accessory', rarity: 'common', name: 'Блокнот заметок', icon: BookOpen, price: 22, bonus: { activity: 'reading', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_notebook.webp' },
  { id: 'shop_common_armband', slot: 'hands', rarity: 'common', name: 'Повязка на руку', icon: Hand, price: 26, bonus: { activity: 'wrestling', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_armband.webp' },
  { id: 'shop_common_leggings', slot: 'legs', rarity: 'common', name: 'Тренировочные штаны', icon: Footprints, price: 32, bonus: { activity: 'strength_park', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_leggings.webp' },
  { id: 'shop_common_chain', slot: 'accessory', rarity: 'common', name: 'Цепочка мотивации', icon: Gem, price: 24, bonus: { activity: 'calories', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_chain.webp' },
  { id: 'shop_common_mask', slot: 'head', rarity: 'common', name: 'Маска для сна', icon: Moon, price: 20, bonus: { activity: 'sleep', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_mask.webp' },
  { id: 'shop_common_bottle', slot: 'accessory', rarity: 'common', name: 'Бутылка для воды', icon: FlaskConical, price: 18, bonus: { activity: 'nutrition', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_bottle.webp' },

  // --- Common доп. 2 (8 более) ---
  { id: 'shop_common_shorts', slot: 'legs', rarity: 'common', name: 'Беговые шорты', icon: Footprints, price: 32, bonus: { activity: 'running', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_shorts.webp' },
  { id: 'shop_common_squatbelt', slot: 'legs', rarity: 'common', name: 'Пояс для приседа', icon: Shield, price: 34, bonus: { activity: 'strength_gym', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_squatbelt.webp' },
  { id: 'shop_common_warmupstick', slot: 'weapon', rarity: 'common', name: 'Палка для разминки', icon: Sword, price: 30, bonus: { activity: 'wrestling', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_warmupstick.webp' },
  { id: 'shop_common_hydroflask', slot: 'weapon', rarity: 'common', name: 'Фляга бегуна', icon: Droplet, price: 28, bonus: { activity: 'running', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_hydroflask.webp' },
  { id: 'shop_common_bookmark', slot: 'accessory', rarity: 'common', name: 'Закладка-скрепка', icon: BookOpen, price: 26, bonus: { activity: 'reading', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_bookmark.webp' },
  { id: 'shop_common_earplugs', slot: 'accessory', rarity: 'common', name: 'Беруши для сна', icon: Moon, price: 20, bonus: { activity: 'sleep', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_earplugs.webp' },
  { id: 'shop_common_apron', slot: 'body', rarity: 'common', name: 'Кухонный фартук', icon: Salad, price: 33, bonus: { activity: 'nutrition', xpBonusPct: 3 }, image: '/icons/shop/common/shop_common_apron.webp' },
  { id: 'shop_common_pouch', slot: 'accessory', rarity: 'common', name: 'Кошель туриста', icon: ShoppingBag, price: 40, bonus: { crystalPct: 3 }, image: '/icons/shop/common/shop_common_pouch.webp' },

  // --- Rare extra (8 more) ---
  { id: 'shop_rare_legguards', slot: 'legs', rarity: 'rare', name: 'Наколенники воина', icon: Footprints, price: 105, bonus: { activity: 'wrestling', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_legguards.webp' },
  { id: 'shop_rare_focus_ring', slot: 'accessory', rarity: 'rare', name: 'Кольцо фокуса', icon: Gem, price: 115, bonus: { activity: 'nutrition', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_focus_ring.webp' },
  { id: 'shop_rare_wristguard', slot: 'hands', rarity: 'rare', name: 'Наручи тренера', icon: Hand, price: 108, bonus: { activity: 'strength_gym', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_wristguard.webp' },
  { id: 'shop_rare_hood', slot: 'head', rarity: 'rare', name: 'Капюшон отшельника', icon: HardHat, price: 112, bonus: { activity: 'sleep', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_hood.webp' },
  { id: 'shop_rare_compass', slot: 'accessory', rarity: 'rare', name: 'Компас путника', icon: Star, price: 118, bonus: { activity: 'running', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_compass.webp' },
  { id: 'shop_rare_belt', slot: 'body', rarity: 'rare', name: 'Пояс силы', icon: Shield, price: 125, bonus: { activity: 'strength_park', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_belt.webp' },
  { id: 'shop_rare_journal', slot: 'hands', rarity: 'rare', name: 'Дневник мудреца', icon: BookOpen, price: 100, bonus: { activity: 'reading', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_journal.webp' },
  { id: 'shop_rare_torch', slot: 'weapon', rarity: 'rare', name: 'Факел решимости', icon: Flame, price: 130, bonus: { activity: 'calories', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_torch.webp' },

  // --- Rare weapons (4 more) ---
  { id: 'shop_rare_spear', slot: 'weapon', rarity: 'rare', name: 'Копьё охотника', icon: Sword, price: 135, bonus: { activity: 'running', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_spear.webp' },
  { id: 'shop_rare_hammer', slot: 'weapon', rarity: 'rare', name: 'Молот упорства', icon: Axe, price: 140, bonus: { activity: 'strength_gym', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_hammer.webp' },
  { id: 'shop_rare_staff', slot: 'weapon', rarity: 'rare', name: 'Посох знаний', icon: Wand2, price: 125, bonus: { activity: 'reading', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_staff.webp' },
  { id: 'shop_rare_whip', slot: 'weapon', rarity: 'rare', name: 'Хлыст дисциплины', icon: Sword, price: 130, bonus: { activity: 'nutrition', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_whip.webp' },

  // --- Rare доп. 2 (8 более) — новые типы бонусов: мульти-актив + кристалл-бонус ---
  { id: 'shop_rare_greaves', slot: 'legs', rarity: 'rare', name: 'Поножи скорохода', icon: Footprints, price: 120, bonus: { activity: 'running', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_greaves.webp' },
  { id: 'shop_rare_kilt', slot: 'legs', rarity: 'rare', name: 'Килт силача', icon: Shield, price: 125, bonus: { activity: 'strength_park', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_kilt.webp' },
  { id: 'shop_rare_seercane', slot: 'weapon', rarity: 'rare', name: 'Трость провидца', icon: Wand2, price: 128, bonus: { activity: 'reading', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_seercane.webp' },
  { id: 'shop_rare_nunchaku', slot: 'weapon', rarity: 'rare', name: 'Нунчаки', icon: Swords, price: 130, bonus: { activity: 'wrestling', xpBonusPct: 10 }, image: '/icons/shop/rare/shop_rare_nunchaku.webp' },
  // --- мульти-актив: +6% к двум активностям сразу ---
  { id: 'shop_rare_duobands', slot: 'hands', rarity: 'rare', name: 'Парные напульсники', icon: Hand, price: 132, bonus: { activities: ['strength_gym', 'strength_park'], xpBonusPct: 6 }, image: '/icons/shop/rare/shop_rare_duobands.webp' },
  { id: 'shop_rare_travelcloak', slot: 'body', rarity: 'rare', name: 'Плащ двойного пути', icon: Shirt, price: 135, bonus: { activities: ['running', 'sleep'], xpBonusPct: 6 }, image: '/icons/shop/rare/shop_rare_travelcloak.webp' },
  { id: 'shop_rare_sagebeads', slot: 'accessory', rarity: 'rare', name: 'Чётки мудреца', icon: Gem, price: 130, bonus: { activities: ['reading', 'nutrition'], xpBonusPct: 6 }, image: '/icons/shop/rare/shop_rare_sagebeads.webp' },
  // --- кристалл-бонус ---
  { id: 'shop_rare_merchantring', slot: 'accessory', rarity: 'rare', name: 'Кольцо торговца', icon: Gem, price: 118, bonus: { crystalPct: 8 }, image: '/icons/shop/rare/shop_rare_merchantring.webp' },

  // --- Class items: 6 slots per class (head, body, accessory, legs, hands, weapon) ---
  // PATHFINDER (бег)
  { id: 'shop_class_pathfinder_head',      slot: 'head',      rarity: 'epic', name: 'Налобная повязка Следопыта', icon: HardHat,     price: 140, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
  { id: 'shop_class_pathfinder_body',      slot: 'body',      rarity: 'epic', name: 'Плащ Вечного Пути',          icon: Footprints,  price: 60, requirement: { type: 'class', id: 'pathfinder' }, bonus: { activity: 'running', xpBonusPct: 12 } },
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

// ---------- AVATAR FRAMES ----------
// CSS-стиль рамки: border, boxShadow, outline — не перекрывают аватар, идут по ободку
// ---------- Фоны профиля (Система 7) ----------
export const PROFILE_BACKGROUNDS = [
  { id: 'mountains', name: 'Горы', price: 80, gradient: 'linear-gradient(160deg, #2a3a4a 0%, #1a2530 50%, #0e1620 100%)' },
  { id: 'forest', name: 'Лес', price: 80, gradient: 'linear-gradient(160deg, #1e3020 0%, #16241a 50%, #0e1810 100%)' },
  { id: 'desert', name: 'Пустыня', price: 80, gradient: 'linear-gradient(160deg, #4a3a1e 0%, #382a16 50%, #201a0c 100%)' },
  { id: 'ocean', name: 'Океан', price: 90, gradient: 'linear-gradient(160deg, #123a4a 0%, #0e2a38 50%, #081a24 100%)' },
  { id: 'dojo', name: 'Додзё', price: 120, gradient: 'linear-gradient(160deg, #3a2418 0%, #2a1a10 50%, #180e08 100%)' },
  { id: 'library', name: 'Библиотека', price: 120, gradient: 'linear-gradient(160deg, #3a2a3a 0%, #261a28 50%, #150e18 100%)' },
  { id: 'volcano', name: 'Вулкан', price: 130, gradient: 'linear-gradient(160deg, #4a1e12 0%, #38140e 50%, #200a08 100%)' },
  { id: 'temple', name: 'Древний храм', price: 130, gradient: 'linear-gradient(160deg, #3a3018 0%, #2a2210 50%, #181208 100%)' },
  { id: 'aurora', name: 'Северное сияние', price: 160, gradient: 'linear-gradient(160deg, #123a30 0%, #0e2a3a 50%, #0a1428 100%)' },
  { id: 'crystalcave', name: 'Кристальная пещера', price: 160, gradient: 'linear-gradient(160deg, #2a1a4a 0%, #1e1238 50%, #100a20 100%)' },
  { id: 'starrysky', name: 'Звёздное небо', price: 200, gradient: 'linear-gradient(160deg, #1a1c3a 0%, #12142a 50%, #0a0b18 100%)' },
  { id: 'cosmos', name: 'Космос', price: 220, gradient: 'linear-gradient(160deg, #1a0e30 0%, #12081f 50%, #060310 100%)' },
];

export const AVATAR_FRAMES = [
  // === ДЕШЁВЫЕ (5 кристаллов) ===
  { id: 'frame_cheap_dots',    name: 'Точки удачи',      rarity: 'cheap',    price: 5,
    style: { border: '2.5px dotted #c9a8f5', boxShadow: 'none' } },
  { id: 'frame_cheap_dashes',  name: 'Штрихи пути',      rarity: 'cheap',    price: 5,
    style: { border: '2.5px dashed #5b9bf0', boxShadow: 'none' } },
  { id: 'frame_cheap_pink',    name: 'Розовый контур',   rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid #ff7eb3', boxShadow: '0 0 6px #ff7eb366' } },
  { id: 'frame_cheap_mint',    name: 'Мятный бриз',      rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid #4ce0c0', boxShadow: '0 0 6px #4ce0c044' } },
  { id: 'frame_cheap_orange',  name: 'Закатный обод',    rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid #e8a063', boxShadow: '0 0 6px #e8a06344' } },
  { id: 'frame_cheap_indigo',  name: 'Индиго ночи',      rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid #7c6fe0', boxShadow: '0 0 8px #7c6fe055' } },
  { id: 'frame_cheap_double',  name: 'Двойной контур',   rarity: 'cheap',    price: 5,
    style: { border: '3px solid #d0d0da', outline: '1.5px solid #5a5a72', outlineOffset: '2px' } },
  { id: 'frame_cheap_gold_thin', name: 'Тонкое золото',  rarity: 'cheap',    price: 5,
    style: { border: '2px solid #f0d272', boxShadow: '0 0 5px #f0d27233' } },
  { id: 'frame_cheap_red',     name: 'Алый рубеж',       rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid #e05f4a', boxShadow: '0 0 6px #e05f4a44' } },
  { id: 'frame_cheap_rainbow', name: 'Радужный контур',  rarity: 'cheap',    price: 5,
    style: { border: '2.5px solid transparent',
             background: 'linear-gradient(#13131a,#13131a) padding-box, linear-gradient(135deg,#f0d272,#e05f9c,#5b9bf0,#4ce0c0) border-box',
             boxShadow: 'none' } },

  // === ОБЫЧНЫЕ ===


  // === РЕДКИЕ ===
  { id: 'frame_rare_branches', name: 'Ветви леса',        rarity: 'rare',    price: 27,
    style: { border: '3px solid #5a8a3a', boxShadow: '0 0 10px #5a8a3a55, inset 0 0 8px #2a5a1a33' } },
  { id: 'frame_rare_leaves',   name: 'Венок из листьев', rarity: 'rare',    price: 28,
    style: { border: '3px solid #7ec850', boxShadow: '0 0 14px #7ec85066, 0 0 4px #4a8a2a55' } },
  { id: 'frame_rare_crystals', name: 'Кристальный ореол', rarity: 'rare',   price: 30,
    style: { border: '3px solid #5b9bf0', boxShadow: '0 0 14px #5b9bf077, 0 0 4px #9ad0f555' } },
  { id: 'frame_rare_fire',     name: 'Огненный обод',    rarity: 'rare',    price: 32,
    style: { border: '3px solid #e8633c', boxShadow: '0 0 16px #e8633c88, 0 0 6px #f5a05566' } },
  { id: 'frame_rare_frost',    name: 'Ледяная кромка',   rarity: 'rare',    price: 30,
    style: { border: '3px solid #a8e0f5', boxShadow: '0 0 14px #a8e0f577, 0 0 5px #e0f5ff55' } },

  // === ЭПИЧЕСКИЕ ===
  { id: 'frame_epic_armor',    name: 'Железная броня',   rarity: 'epic',    price: 180,
    style: { border: '4px solid #8a9ab0', boxShadow: '0 0 0 2px #4a5a6a, 0 0 16px #6a8aaa66' } },
  { id: 'frame_epic_dragon',   name: 'Чешуя дракона',    rarity: 'epic',    price: 200,
    style: { border: '4px solid #c0501a', boxShadow: '0 0 20px #c0501a88, 0 0 8px #e8803055' } },
  { id: 'frame_epic_thunder',  name: 'Молнии хаоса',     rarity: 'epic',    price: 63,
    style: { border: '3px solid #e0e870', boxShadow: '0 0 20px #e0e87099, 0 0 6px #fff0a055, 0 0 2px #ffff8888' } },
  { id: 'frame_epic_shadow',   name: 'Тень бездны',      rarity: 'epic',    price: 62,
    style: { border: '3px solid #5a2a8a', boxShadow: '0 0 18px #5a2a8a99, inset 0 0 10px #2a0a4a66' } },
  { id: 'frame_epic_runes',    name: 'Рунический контур', rarity: 'epic',   price: 65,
    style: { border: '3px solid #9a6ae0', boxShadow: '0 0 18px #9a6ae088, 0 0 6px #c9a8f566' } },

  // === ЛЕГЕНДАРНЫЕ ===
  { id: 'frame_legend_phoenix',name: 'Крылья Феникса',   rarity: 'legendary', price: 117,
    style: { border: '4px solid #f5c84a', boxShadow: '0 0 24px #f5c84aaa, 0 0 10px #ff8c3077, 0 0 4px #ffe08055' } },
  { id: 'frame_legend_heaven', name: 'Небесное золото',  rarity: 'legendary', price: 123,
    style: { border: '4px solid #fde68a', boxShadow: '0 0 28px #fde68aaa, 0 0 12px #fffde055, 0 0 4px #fff8cc88' } },
  { id: 'frame_legend_blood',  name: 'Кровавая луна',    rarity: 'legendary', price: 120,
    style: { border: '4px solid #cc1a1a', boxShadow: '0 0 24px #cc1a1aaa, 0 0 10px #8b000077' } },
  { id: 'frame_legend_stars',  name: 'Звёздная пыль',    rarity: 'legendary', price: 127,
    style: { border: '3px solid #c0b8f8', boxShadow: '0 0 28px #c0b8f8aa, 0 0 14px #9090ee77, 0 0 6px #e0d8ff55' } },
  { id: 'frame_legend_chaos',  name: 'Хаос мирозданья',  rarity: 'legendary', price: 133,
    style: { border: '4px solid transparent',
             background: 'linear-gradient(#13131a,#13131a) padding-box, linear-gradient(135deg,#f5c84a,#e05f9c,#9a6ae0,#5b9bf0,#4ce0c0) border-box',
             boxShadow: '0 0 24px #9a6ae088' } },

  // === МИФИЧЕСКИЕ ===
  { id: 'frame_mythic_void',   name: 'Абсолютная Тьма',  rarity: 'mythic',  price: 0,
    requirement: { type: 'mythic', id: 'mythic_heart' },
    style: { border: '4px solid #0a0a0a', outline: '2px solid #3a0a5a', outlineOffset: '3px',
             boxShadow: '0 0 30px #6a0a9a99, inset 0 0 14px #1a002a88' } },
  { id: 'frame_mythic_dawn',   name: 'Рассвет Богов',    rarity: 'mythic',  price: 0,
    requirement: { type: 'mythic', id: 'mythic_sage_mode' },
    style: { border: '4px solid #fff8cc', outline: '2px solid #f0d272', outlineOffset: '3px',
             boxShadow: '0 0 36px #fff8cccc, 0 0 16px #f0d27288, 0 0 6px #fffde055' } },
];

export const AVATAR_FRAME_RARITY_COLORS = {
  cheap:     { color: '#a0a0b0', label: '✨ Простые',   bg: '#1a1a20' },
  common:    { color: '#b0b0ba', label: 'Обычные',      bg: '#1a1a20' },
  rare:      { color: '#5b9bf0', label: 'Редкие',       bg: '#141a28' },
  epic:      { color: '#9a6ae0', label: 'Эпические',    bg: '#18122a' },
  legendary: { color: '#f0d272', label: 'Легендарные',  bg: '#1e1808' },
  mythic:    { color: '#e05f9c', label: 'Мифические',   bg: '#1e0818' },
};


// ---------- CONSUMABLES ----------
export const CONSUMABLES = [
  {
    id: 'streak_shield',
    name: 'Щит стрика',
    description: 'Защищает одну серию от прерывания на 1 день. Покупка: 1 раз в 2 недели.',
    icon: Shield,
    price: 45,
    color: '#4ce0c0',
    maxPerWeek: null, // custom: once per 14 days
    cooldownDays: 14,
    type: 'shield',
  },
  {
    id: 'hp_potion',
    name: 'Зелье здоровья',
    description: 'Восстанавливает ~10% физического здоровья. Максимум 3 в неделю.',
    icon: Heart,
    price: 25,
    color: '#e05f4a',
    maxPerWeek: 3,
    type: 'potion_hp',
  },
  {
    id: 'mp_potion',
    name: 'Зелье ясности',
    description: 'Восстанавливает ~10% ментального здоровья. Максимум 3 в неделю.',
    icon: Brain,
    price: 25,
    color: '#4f7cff',
    maxPerWeek: 3,
    type: 'potion_mp',
  },
  {
    id: 'horseshoe',
    name: 'Подкова удачи',
    description: 'Удваивает шанс встретить существо бестиария на 24ч (25%→50%). Не влияет на дорожные события.',
    icon: Star,
    price: 10,
    color: '#e0c070',
    type: 'horseshoe',
  },
  {
    id: 'wanderer_map',
    name: 'Карта странника',
    description: 'Удваивает шанс дорожного события на 24ч. Не влияет на бестиарий.',
    icon: Compass,
    price: 10,
    color: '#9a6acd',
    type: 'map',
  },
  {
    id: 'xp_scroll',
    name: 'Свиток опыта',
    description: '+15% XP ко всем активностям на 24ч. Не стакается с баффом вызова (перезаписывает, если слабее). Один активный за раз.',
    icon: Scroll,
    price: 20,
    color: '#4ce0c0',
    type: 'scroll',
  },
  {
    id: 'second_chance',
    name: 'Вторая попытка',
    description: 'Сбрасывает кулдаун «Испытания духа» (3дн→0). Не снимает дебафф «Сломленная клятва».',
    icon: RotateCcw,
    price: 40,
    color: '#e8633c',
    type: 'second_chance',
  },
];



