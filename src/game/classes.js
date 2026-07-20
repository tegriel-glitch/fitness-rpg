// ---------- КЛАССЫ ПЕРСОНАЖЕЙ, КОМБО-КЛАССЫ, ПУТИ, ДВИЖОК ЭФФЕКТОВ СКИЛЛОВ ----------
import { Swords, Footprints, Wand2, Hand, Sparkle, Skull } from 'lucide-react';

// ---------- CHARACTER CLASS SYSTEM ----------
// The class is recalculated dynamically based on whichever stat group currently has the
// highest average value. Each class grants +10% XP to activities in its own group.
export const CLASS_XP_BONUS = 0.10;
export const COMBO_CLASS_XP_BONUS = 0.08; // +8% to both groups (base class still gives +10% to its own group)

export const CHARACTER_CLASSES = [
  { id: 'pathfinder', name: 'Следопыт', statGroup: 'Стойкость', stats: ['Выносливость', 'Воля'], icon: Footprints, color: '#e8633c', activities: ['running'], portrait: '/icons/classes/pathfinder.webp' },
  { id: 'berserker', name: 'Берсеркер', statGroup: 'Мощь', stats: ['Сила', 'Упорство'], icon: Skull, color: '#c9a227', activities: ['strength_park', 'strength_gym'], portrait: '/icons/classes/berserker.webp' },
  { id: 'battlemaster', name: 'Мастер битвы', statGroup: 'Рефлексы', stats: ['Силовая выносливость', 'Гибкость'], icon: Swords, color: '#8a5cf6', activities: ['wrestling'], portrait: '/icons/classes/battlemaster.webp' },
  { id: 'monk', name: 'Монах', statGroup: 'Самоконтроль', stats: ['Фокус', 'Дисциплина'], icon: Hand, color: '#4caf6d', activities: ['nutrition'], portrait: '/icons/classes/monk.webp' },
  { id: 'shaman', name: 'Шаман', statGroup: 'Жизненная сила', stats: ['Дух', 'ХП'], icon: Sparkle, color: '#4f7cff', activities: ['sleep'], portrait: '/icons/classes/shaman.webp' },
  { id: 'archmage', name: 'Архимаг', statGroup: 'Разум', stats: ['Интеллект', 'Мышление'], icon: Wand2, color: '#d6558c', activities: ['reading'], portrait: '/icons/classes/archmage.webp' },
];

// Returns the id of the class whose stat group currently has the highest average value,
// or null if all stats are still at 0 (no class assigned yet).
// (Legacy single-stat dominance is now handled via resolveCharacterClass, which also
// supports combo classes — see below.)

// ---------- COMBO CLASSES ----------
// Партия B: авто-грант по близости статов убран. Комбо-класс теперь определяется ТОЛЬКО явным
// выбором игрока на 20 лвл (state.comboClassId, ключ вида 'berserker|pathfinder').
// COMBO_CLASS_NAMES остаётся справочником имён для всех 15 пар.
export const COMBO_CLASS_NAMES = {
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

export function comboKeyFor(idA, idB) {
  return [idA, idB].sort().join('|');
}

// Returns either a single CHARACTER_CLASSES entry, or a synthetic combo class object
// { combo: true, name, icon, color, statGroup, classA, classB }, or null if no stats yet.
// comboClassId (optional): explicit permanent choice made at level 20 (e.g. 'berserker|pathfinder').
// When present, ALWAYS returns the combo object regardless of current stat balance.
export function resolveCharacterClass(totals, level, comboClassId) {
  const ranked = CHARACTER_CLASSES
    .map((cls) => {
      const sum = cls.stats.reduce((acc, s) => acc + (totals[s] || 0), 0);
      return { cls, avg: sum / cls.stats.length };
    })
    .sort((a, b) => b.avg - a.avg);

  if (comboClassId) {
    const comboName = COMBO_CLASS_NAMES[comboClassId];
    if (comboName) {
      const [idA, idB] = comboClassId.split('|');
      const clsA = CHARACTER_CLASSES.find((c) => c.id === idA);
      const clsB = CHARACTER_CLASSES.find((c) => c.id === idB);
      if (clsA && clsB) {
        return {
          combo: true,
          id: 'combo_' + comboClassId,
          name: comboName,
          icon: clsA.icon,
          secondaryIcon: clsB.icon,
          color: clsA.color,
          secondaryColor: clsB.color,
          statGroup: `${clsA.statGroup} + ${clsB.statGroup}`,
          classA: clsA,
          classB: clsB,
        };
      }
    }
  }

  if (ranked.length === 0 || ranked[0].avg <= 0) return null;
  return ranked[0].cls;
}

// Maps each loggable activity to the class it would boost, used when computing the +10% XP bonus.
export const CLASS_BY_ACTIVITY = {};
CHARACTER_CLASSES.forEach((cls) => {
  cls.activities.forEach((act) => {
    CLASS_BY_ACTIVITY[act] = cls.id;
  });
});

// ---------- CLASS PATHS ----------
// Each base class has 2 paths (ветки), each with 5 passives unlocked at levels 10/15/20/25/30
// ---------- ДВИЖОК ЭФФЕКТОВ СКИЛЛОВ ----------
// Каждый скилл несёт машиночитаемое поле `effect: { type, ...params }`.
// activeSkillEffects (см. ниже, после объявления unlockedSkillLevels/chosenPathId/lockedClassId)
// собирает эффекты разблокированных скиллов; statTotals/healthState/raidPenalizedHealth их читают.
//
// Типы эффектов (Партия A — движок + оживление 60 скиллов основного пути):
//   xp_mult_to_stat        {activity, stat, pct}                — множитель XP в конкретный стат от активности
//   xp_mult_multi_to_stat  {activities:[], stat, pct}            — то же, но от нескольких активностей
//   per_distance_periodic  {activity, per, stat|stats, amount}   — периодика по суммарному км
//   per_pages_periodic     {activity, per, stat|stats, amount}   — периодика по суммарным страницам
//   per_count_periodic     {activity, per, stat|stats, amount}   — периодика по числу логов активности
//   per_book_stat          {stat, amount}                        — за каждую завершённую книгу
//   per_book_periodic      {per, stat|stats, amount}              — периодика по числу завершённых книг
//   per_combo_days_periodic{activities:[], per, stats}            — периодика по числу комбо-дней (N активностей в один день)
//   streak_once            {activity, days, stats, byCount?}      — разовый бонус при достижении стрика (или счётчика, если byCount)
//   streak_once_any        {activities:[], days, stats}           — разовый бонус, если ЛЮБАЯ из активностей достигла стрика
//   combo_day_stat_bonus   {activityA, activityB, stats}          — флэт-бонус в статы за КАЖДЫЙ комбо-день (не XP-множитель)
//   combo_day_stat_bonus_multi {activities:[], stats}             — то же, но для 3+ активностей в один день
//   combo_week_stat_bonus  {activityA, activityB, stats}          — флэт-бонус раз за каждую неделю, где был хотя бы 1 комбо-день
//   xp_flat_bonus_combo_day{activityA, activityB, amount, stat}   — разовая добавка XP (не %) в стат за каждый комбо-день
//   xp_mult_combo_day      {activityA, activityB, pct}            — % XP к обеим активностям в комбо-день
//   xp_mult_combo_day_multi{activities:[], stat, pct}             — % XP в конкретный стат, когда логированы ВСЕ activities в один день
//   per_week_count_periodic{activity, per, stat, amount}          — периодика: каждая неделя с ≥per логов активности
//   stat_growth_rate       {activity, stat, pct}                  — усиленный прирост конкретного стата от активности
//   hp_restore_on_activity {activity, bar, pct, requireStreak?}   — восстановление бара при логе активности
//   debuff_reduction       {debuff, pct}                          — ослабление магнитуды дебаффа
//   debuff_remove_on_activity {activity, debuff, count}           — снятие стека дебаффа при логе активности
//   hp_floor               {bar, floor, condition}                — бар не падает ниже floor (condition: 'always')
//   conditional_xp_mult_hp {bar, threshold, pct, activity}        — % XP если итоговый бар выше порога (упрощённо: по финальному значению, не по дате лога)
//   raid_penalty_reduction {pct}                                  — уменьшение штрафа за провал рейда
//   achievement_xp_boost   {scope, pct}                           — множитель к наградам ачивок нужного scope
//   per_good_days_periodic {per, stats}                           — периодика по дням без критичного падения ХП (healthState.noCriticalDaysCount)
//
// Скиллы, трогающие ядро isConsecutiveStreak (грейс-день пропуска), оставлены ДЕКОРАТИВНЫМИ
// в Партии A по рекомендации спеки — риск сломать существующие стрик-расчёты. Отмечены комментарием.
export const CLASS_PATHS = {
  pathfinder: [
    {
      id: 'pathfinder_south',
      name: 'Поступь южных ветров',
      focus: 'Выносливость',
      color: '#ff8c55',
      icon: '/icons/paths/pathfinder_south.webp',
      skills: [
        { level: 10, name: 'Ветер в спину',       desc: 'Бег даёт +25% XP к Выносливости', icon: '/icons/skills/pathfinder/path1_and_skill1_veter_v_spinu.webp',
          effect: { type: 'xp_mult_to_stat', activity: 'running', stat: 'Выносливость', pct: 25 } },
        { level: 15, name: 'Ранний разгон',        desc: 'Стрик бега засчитывается с 2-го дня (бронза раньше)', icon: '/icons/skills/pathfinder/skill2_ranniy_razgon.webp' /* decorative: touches isConsecutiveStreak */ },
        { level: 20, name: 'Сотня километров',     desc: 'Каждые 50 км суммарно → +3 Выносливость', icon: '/icons/skills/pathfinder/skill3_sotnya_km.webp',
          effect: { type: 'per_distance_periodic', activity: 'running', per: 50, stat: 'Выносливость', amount: 3 } },
        { level: 25, name: 'Марафонское дыхание',  desc: 'Бег 5 дней подряд → физ.хп восстанавливается +5%/день', icon: '/icons/skills/pathfinder/skill4_marafonskoe_dyhanie.webp',
          effect: { type: 'hp_restore_on_activity', activity: 'running', bar: 'physical', pct: 5, requireStreak: 5 } },
        { level: 30, name: 'Путь без конца',       desc: 'Каждые 100 км → +5 Выносливость + +2 Воля', icon: '/icons/skills/pathfinder/skill5_put_bez_konca.webp',
          effect: { type: 'per_distance_periodic', activity: 'running', per: 100, stats: { 'Выносливость': 5, 'Воля': 2 } } },
      ],
    },
    {
      id: 'pathfinder_hunter',
      name: 'Пылающее сердце охотника',
      focus: 'Воля',
      color: '#e8633c',
      icon: '/icons/paths/pathfinder_hunter.webp',
      skills: [
        { level: 10, name: 'Охотничий инстинкт',  desc: 'Сон и питание дают +15% XP к Воле', icon: '/icons/skills/pathfinder/skill6_ohotnichiy_instinkt.webp',
          effect: { type: 'xp_mult_multi_to_stat', activities: ['sleep', 'nutrition'], stat: 'Воля', pct: 15 } },
        { level: 15, name: 'Упрямство зверя',      desc: 'Любой стрик 7+ дней → +2 Воля бонус', icon: '/icons/skills/pathfinder/skill7_uprymstvo_zverya.webp',
          effect: { type: 'streak_once_any', activities: ['running', 'sleep', 'nutrition', 'reading'], days: 7, stats: { 'Воля': 2 } } },
        { level: 20, name: 'Ночной бег',           desc: 'Комбо «бег + сон в один день» → +5 XP сверху',
          effect: { type: 'xp_flat_bonus_combo_day', activityA: 'running', activityB: 'sleep', amount: 5, stat: 'Воля' } },
        { level: 25, name: 'Второе дыхание',       desc: 'Стрики не сбрасываются если пропустил 1 день раз в 14 дней', icon: '/icons/skills/pathfinder/hero_merged_night_run_and_second_wind.webp' /* decorative: touches isConsecutiveStreak */ },
        { level: 30, name: 'Сердце не сдаётся',   desc: 'За каждый месяц без пропуска активности → +5 Воля', icon: '/icons/skills/pathfinder/skill10_serdce_ne_sdaetsya.webp',
          effect: { type: 'per_good_days_periodic', per: 30, stats: { 'Воля': 5 } } },
      ],
    },
  ],
  berserker: [
    {
      id: 'berserker_iron',
      name: 'Стальная хватка гор',
      focus: 'Сила',
      color: '#e8b830',
      icon: '/icons/paths/berserker_iron.webp',
      skills: [
        { level: 10, name: 'Горная мощь',          desc: 'Силовые тренировки дают +25% XP к Силе', icon: '/icons/skills/berserker/skill1_gornaya_mosch.webp',
          effect: { type: 'xp_mult_to_stat', activity: 'strength_park,strength_gym', stat: 'Сила', pct: 25 } },
        { level: 15, name: 'Двойной удар',          desc: 'Два силовых дня подряд → +3 Сила бонус', icon: '/icons/skills/berserker/skill2_dvoynoy_udar.webp',
          effect: { type: 'streak_once', activity: 'strength_park,strength_gym', days: 2, stats: { 'Сила': 3 } } },
        { level: 20, name: 'Тридцать сессий',       desc: 'Каждые 30 силовых тренировок → +5 Сила', icon: '/icons/skills/berserker/skill3_tridcat_sessiy.webp',
          effect: { type: 'per_count_periodic', activity: 'strength_park,strength_gym', per: 30, stats: { 'Сила': 5 } } },
        { level: 25, name: 'Закалка железом',       desc: 'Силовые снимают 1 стак усталости после тренировки', icon: '/icons/skills/berserker/skill4_zakalka_zhelezom.webp',
          effect: { type: 'debuff_remove_on_activity', activity: 'strength_park,strength_gym', debuff: 'fatigue', count: 1 } },
        { level: 30, name: 'Рука горы',             desc: 'Каждые 50 тренировок → +8 Сила + +3 Упорство', icon: '/icons/skills/berserker/skill5_ruka_gory.webp',
          effect: { type: 'per_count_periodic', activity: 'strength_park,strength_gym', per: 50, stats: { 'Сила': 8, 'Упорство': 3 } } },
      ],
    },
    {
      id: 'berserker_endless',
      name: 'Неутомимый владыка пустошей',
      focus: 'Упорство',
      color: '#c9a227',
      icon: '/icons/paths/berserker_endless.webp',
      skills: [
        { level: 10, name: 'Воля пустоши',         desc: 'Борьба + силовая дают +15% XP к Упорству', icon: '/icons/skills/berserker/skill6_volya_pustoshi.webp',
          effect: { type: 'xp_mult_multi_to_stat', activities: ['strength_park', 'strength_gym', 'wrestling'], stat: 'Упорство', pct: 15 } },
        { level: 15, name: 'Кожа как броня',        desc: 'Дебаффы усталости снимают физ.хп только на 60%', icon: '/icons/skills/berserker/skill7_kozha_kak_bronya.webp',
          effect: { type: 'debuff_reduction', debuff: 'fatigue', pct: 40 } },
        { level: 20, name: 'Цикл выживания',        desc: 'После 10 тренировок подряд (чередование) → +4 Упорство', icon: '/icons/skills/berserker/skill8_cikl_vyzhivaniya.webp',
          effect: { type: 'streak_once', activity: 'strength_park,strength_gym,wrestling', days: 10, stats: { 'Упорство': 4 }, byCount: true } },
        { level: 25, name: 'Цена победы',           desc: 'Борьба после силовой в тот же день → +2 Упорство + +1 Сила', icon: '/icons/skills/berserker/skill9_cena_pobedy.webp',
          effect: { type: 'combo_day_stat_bonus', activityA: 'strength_park,strength_gym', activityB: 'wrestling', stats: { 'Упорство': 2, 'Сила': 1 } } },
        { level: 30, name: 'Владыка пустошей',      desc: 'Каждые 20 тренировок → +4 Упорство + +2 Сила', icon: '/icons/skills/berserker/skill10_vladyka_pustoshey.webp',
          effect: { type: 'per_count_periodic', activity: 'strength_park,strength_gym,wrestling', per: 20, stats: { 'Упорство': 4, 'Сила': 2 } } },
      ],
    },
  ],
  battlemaster: [
    {
      id: 'battlemaster_thousand',
      name: 'Кулак тысячи схваток',
      focus: 'Силовая выносливость',
      color: '#a07cf6',
      icon: '/icons/paths/battlemaster_thousand.webp',
      skills: [
        { level: 10, name: 'Несокрушимый кулак',   desc: 'Борьба даёт +25% XP к Силовой выносливости', icon: '/icons/skills/battlemaster/skill1_nesokrushimyi_kulak.jpg',
          effect: { type: 'xp_mult_to_stat', activity: 'wrestling', stat: 'Силовая выносливость', pct: 25 } },
        { level: 15, name: 'Тройной натиск',        desc: '3 тренировки борьбы за неделю → +4 Силовая выносливость', icon: '/icons/skills/battlemaster/skill2_troynoy_natisk.jpg',
          effect: { type: 'per_week_count_periodic', activity: 'wrestling', per: 3, stat: 'Силовая выносливость', amount: 4 } },
        { level: 20, name: 'Двадцать пятая схватка',desc: 'Каждые 25 схваток → +5 Силовая выносливость', icon: '/icons/skills/battlemaster/skill3_dvadcat_pyataya_shvatka.jpg',
          effect: { type: 'per_count_periodic', activity: 'wrestling', per: 25, stat: 'Силовая выносливость', amount: 5 } },
        { level: 25, name: 'Боевое восстановление', desc: 'После борьбы физ.хп восстанавливается +5%', icon: '/icons/skills/battlemaster/skill4_boevoe_vosstanovlenie.jpg',
          effect: { type: 'hp_restore_on_activity', activity: 'wrestling', bar: 'physical', pct: 5 } },
        { level: 30, name: 'Кулак легенды',         desc: 'Каждые 50 схваток → +8 Силовая выносливость + +3 Гибкость', icon: '/icons/skills/battlemaster/skill5_kulak_legendy.jpg',
          effect: { type: 'per_count_periodic', activity: 'wrestling', per: 50, stats: { 'Силовая выносливость': 8, 'Гибкость': 3 } } },
      ],
    },
    {
      id: 'battlemaster_dancer',
      name: 'Адепт искусной борьбы',
      focus: 'Гибкость',
      color: '#8a5cf6',
      icon: '/icons/paths/battlemaster_dancer.webp',
      skills: [
        { level: 10, name: 'Танец клинков',         desc: 'Бег + борьба в один день → +15% XP ко всему дню', icon: '/icons/skills/battlemaster/skill6_tanec_klinkov.jpg',
          effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'wrestling', pct: 15 } },
        { level: 15, name: 'Гибкое тело',           desc: 'Гибкость растёт на +50% быстрее от борьбы', icon: '/icons/skills/battlemaster/skill7_gibkoe_telo.jpg',
          effect: { type: 'stat_growth_rate', activity: 'wrestling', stat: 'Гибкость', pct: 50 } },
        { level: 20, name: 'Мастер движения',       desc: 'Комбо «борьба + бег» → +3 Гибкость раз в неделю', icon: '/icons/skills/battlemaster/skill8_master_dvizheniya.jpg',
          effect: { type: 'combo_week_stat_bonus', activityA: 'wrestling', activityB: 'running', stats: { 'Гибкость': 3 } } },
        { level: 25, name: 'Неуловимый',            desc: 'Стрик борьбы 5 дней → +2 Гибкость + +2 Выносливость', icon: '/icons/skills/battlemaster/skill9_neulovimyi.jpg',
          effect: { type: 'streak_once', activity: 'wrestling', days: 5, stats: { 'Гибкость': 2, 'Выносливость': 2 } } },
        { level: 30, name: 'Адепт пустоты',         desc: 'Каждые 30 комбо-дней → +6 Гибкость + +4 Выносливость', icon: '/icons/skills/battlemaster/skill10_adept_pustoty.jpg',
          effect: { type: 'per_combo_days_periodic', activities: ['wrestling', 'running'], per: 30, stats: { 'Гибкость': 6, 'Выносливость': 4 } } },
      ],
    },
  ],
  monk: [
    {
      id: 'monk_hermit',
      name: 'Отшельник безмолвных гор',
      focus: 'Фокус',
      color: '#5fcf85',
      icon: '/icons/paths/monk_hermit.webp',
      skills: [
        { level: 10, name: 'Тишина разума',         desc: 'Чтение даёт +25% XP к Фокусу', icon: '/icons/skills/monk/skill1_tishina_razuma.jpg',
          effect: { type: 'xp_mult_to_stat', activity: 'reading', stat: 'Фокус', pct: 25 } },
        { level: 15, name: 'Завершённый путь',      desc: 'Каждая завершённая книга → +3 Фокус', icon: '/icons/skills/monk/skill2_zavershennyi_put.jpg',
          effect: { type: 'per_book_stat', stat: 'Фокус', amount: 3 } },
        { level: 20, name: 'Союз разума и тела',    desc: 'Комбо «питание + чтение» в один день → +5 Фокус', icon: '/icons/skills/monk/skill3_soyuz_razuma_i_tela.jpg',
          effect: { type: 'combo_day_stat_bonus', activityA: 'nutrition', activityB: 'reading', stats: { 'Фокус': 5 } } },
        { level: 25, name: 'Пятьсот страниц',       desc: 'За каждые 500 страниц прочитанного → +5 Фокус', icon: '/icons/skills/monk/skill4_pyatsot_stranic.jpg',
          effect: { type: 'per_pages_periodic', activity: 'reading', per: 500, stat: 'Фокус', amount: 5 } },
        { level: 30, name: 'Горный мудрец',         desc: 'Каждые 10 книг → +8 Фокус + +3 Дисциплина', icon: '/icons/skills/monk/skill5_gornyi_mudrec.jpg',
          effect: { type: 'per_book_periodic', per: 10, stats: { 'Фокус': 8, 'Дисциплина': 3 } } },
      ],
    },
    {
      id: 'monk_guardian',
      name: 'Страж неколебимой воли',
      focus: 'Дисциплина',
      color: '#4caf6d',
      icon: '/icons/paths/monk_guardian.webp',
      skills: [
        { level: 10, name: 'Несгибаемость',         desc: 'Правильное питание каждый день → +15% XP к Дисциплине', icon: '/icons/skills/monk/skill6_nesgibaemost.jpg',
          effect: { type: 'xp_mult_to_stat', activity: 'nutrition', stat: 'Дисциплина', pct: 15 } },
        { level: 15, name: 'Щит от яда',            desc: 'Яд (зажор) снимает на 30% меньше со статов', icon: '/icons/skills/monk/skill7_shit_ot_yada.jpg',
          effect: { type: 'debuff_reduction', debuff: 'poison', pct: 30 } },
        { level: 20, name: 'Две недели',             desc: 'Стрик питания 14 дней → +5 Дисциплина', icon: '/icons/skills/monk/skill8_dve_nedeli.jpg',
          effect: { type: 'streak_once', activity: 'nutrition', days: 14, stats: { 'Дисциплина': 5 } } },
        { level: 25, name: 'Двойная дисциплина',    desc: 'Питание + чтение каждый день → +2 Дисциплина + +1 Фокус в неделю', icon: '/icons/skills/monk/skill9_dvoynaya_disciplina.jpg',
          effect: { type: 'combo_week_stat_bonus', activityA: 'nutrition', activityB: 'reading', stats: { 'Дисциплина': 2, 'Фокус': 1 } } },
        { level: 30, name: 'Несокрушимая воля',     desc: 'Стрик питания 30 дней → +10 Дисциплина + +5 Фокус', icon: '/icons/skills/monk/skill10_nesokrushimaya_volya.jpg',
          effect: { type: 'streak_once', activity: 'nutrition', days: 30, stats: { 'Дисциплина': 10, 'Фокус': 5 } } },
      ],
    },
  ],
  shaman: [
    {
      id: 'shaman_spirit',
      name: 'Дух тайных миров',
      focus: 'Дух',
      color: '#7090ff',
      icon: '/icons/paths/shaman_spirit.webp',
      skills: [
        { level: 10, name: 'Голос духов',           desc: 'Сон даёт +25% XP к Духу', icon: '/icons/skills/shaman/skill1_golos_duhov.jpg',
          effect: { type: 'xp_mult_to_stat', activity: 'sleep', stat: 'Дух', pct: 25 } },
        { level: 15, name: 'Исцеляющий сон',        desc: 'Здоровый сон восстанавливает физ.хп +8%', icon: '/icons/skills/shaman/skill2_iscelyayushiy_son.jpg',
          effect: { type: 'hp_restore_on_activity', activity: 'sleep', bar: 'physical', pct: 8 } },
        { level: 20, name: 'Двадцать ночей',        desc: 'Каждые 20 здоровых ночей подряд → +4 Дух', icon: '/icons/skills/shaman/skill3_dvadcat_nochey.jpg',
          effect: { type: 'per_count_periodic', activity: 'sleep', per: 20, stat: 'Дух', amount: 4 } },
        { level: 25, name: 'Незыблемый разум',      desc: 'Ментал.хп не падает ниже 30% даже при стрессе', icon: '/icons/skills/shaman/skill4_nezyblemyi_razum.jpg',
          effect: { type: 'hp_floor', bar: 'mental', floor: 30, condition: 'always' } },
        { level: 30, name: 'Хранитель миров',       desc: 'Каждые 50 здоровых ночей → +8 Дух + +4 ХП', icon: '/icons/skills/shaman/skill5_hranitel_mirov.jpg',
          effect: { type: 'per_count_periodic', activity: 'sleep', per: 50, stats: { 'Дух': 8, 'ХП': 4 } } },
      ],
    },
    {
      id: 'shaman_fortress',
      name: 'Живая крепость',
      focus: 'ХП',
      color: '#4f7cff',
      icon: '/icons/paths/shaman_fortress.webp',
      skills: [
        { level: 10, name: 'Броня жизни',           desc: 'Сон + питание дают +15% XP к ХП', icon: '/icons/skills/shaman/skill6_bronya_zhizni.jpg',
          effect: { type: 'xp_mult_multi_to_stat', activities: ['sleep', 'nutrition'], stat: 'ХП', pct: 15 } },
        { level: 15, name: 'Стальные нервы',        desc: 'Стрессовые дебаффы снимают ментал.хп на 30% меньше', icon: '/icons/skills/shaman/skill7_stalnye_nervy.jpg',
          effect: { type: 'debuff_reduction', debuff: 'stress', pct: 30 } },
        { level: 20, name: 'Сила здоровья',         desc: 'При физ.хп выше 80% → +5% XP ко всем активностям', icon: '/icons/skills/shaman/skill8_sila_zdorovya.jpg',
          effect: { type: 'conditional_xp_mult_hp', bar: 'physical', threshold: 80, pct: 5, activity: 'all' } },
        { level: 25, name: 'Рейдовая стойкость',    desc: 'Штраф за провал рейда → -30% вместо -50%', icon: '/icons/skills/shaman/skill9_reidovaya_stoykost.jpg',
          effect: { type: 'raid_penalty_reduction', pct: 30 } },
        { level: 30, name: 'Вечная крепость',       desc: 'Каждые 30 дней без критичного падения хп → +6 ХП + +4 Дух', icon: '/icons/skills/shaman/skill10_vechnaya_krepost.jpg',
          effect: { type: 'per_good_days_periodic', per: 30, stats: { 'ХП': 6, 'Дух': 4 } } },
      ],
    },
  ],
  archmage: [
    {
      id: 'archmage_architect',
      name: 'Архитектор концепций',
      focus: 'Интеллект',
      color: '#e870a8',
      icon: '/icons/paths/archmage_architect.webp',
      skills: [
        { level: 10, name: 'Бесконечная библиотека', desc: 'Чтение даёт +25% XP к Интеллекту', icon: '/icons/skills/archmage/skill1_biblioteka.webp',
          effect: { type: 'xp_mult_to_stat', activity: 'reading', stat: 'Интеллект', pct: 25 } },
        { level: 15, name: 'Завершённый том',        desc: 'Каждая завершённая книга → +4 Интеллект', icon: '/icons/skills/archmage/skill2_tom.webp',
          effect: { type: 'per_book_stat', stat: 'Интеллект', amount: 4 } },
        { level: 20, name: 'Триста страниц',         desc: 'За каждые 300 страниц → +3 Интеллект', icon: '/icons/skills/archmage/skill3_stranicy.webp',
          effect: { type: 'per_pages_periodic', activity: 'reading', per: 300, stat: 'Интеллект', amount: 3 } },
        { level: 25, name: 'Две недели знаний',      desc: 'Стрик чтения 14 дней → +5 Интеллект', icon: '/icons/skills/archmage/skill4_dve_nedeli.webp',
          effect: { type: 'streak_once', activity: 'reading', days: 14, stats: { 'Интеллект': 5 } } },
        { level: 30, name: 'Великий архитектор',     desc: 'Каждые 20 книг → +10 Интеллект + +4 Мышление', icon: '/icons/skills/archmage/skill5_velikiy_arhitektor.webp',
          effect: { type: 'per_book_periodic', per: 20, stats: { 'Интеллект': 10, 'Мышление': 4 } } },
      ],
    },
    {
      id: 'archmage_thinker',
      name: 'Мыслитель облачных миров',
      focus: 'Мышление',
      color: '#d6558c',
      icon: '/icons/paths/archmage_thinker.webp',
      skills: [
        { level: 10, name: 'Облачный разум',         desc: 'Комбо «чтение + питание + сон» → +15% XP к Мышлению', icon: '/icons/skills/archmage/skill6_oblachnyi_razum.webp',
          effect: { type: 'xp_mult_combo_day_multi', activities: ['reading', 'nutrition', 'sleep'], stat: 'Мышление', pct: 15 } },
        { level: 15, name: 'Усиленное знание',       desc: 'Ачивки за чтение дают +50% XP-бонус сверху', icon: '/icons/skills/archmage/skill7_usilennoe_znanie.webp',
          effect: { type: 'achievement_xp_boost', scope: 'reading', pct: 50 } },
        { level: 20, name: 'Пятьсот в месяц',        desc: 'Каждые 500 страниц в месяц → +4 Мышление', icon: '/icons/skills/archmage/skill8_pyatsot_v_mesyats.webp',
          effect: { type: 'per_pages_periodic', activity: 'reading', per: 500, stat: 'Мышление', amount: 4 } },
        { level: 25, name: 'Комбо мыслителя',        desc: 'Комбо-дни «все пассивные» → +2 Мышление + +1 Интеллект', icon: '/icons/skills/archmage/skill9_kombo_myslitelya.webp',
          effect: { type: 'combo_day_stat_bonus_multi', activities: ['reading', 'nutrition', 'sleep'], stats: { 'Мышление': 2, 'Интеллект': 1 } } },
        { level: 30, name: 'Мыслитель вечности',     desc: 'Каждые 30 комбо-дней → +8 Мышление + +5 Интеллект', icon: '/icons/skills/archmage/skill10_myslitel_vechnosti.webp',
          effect: { type: 'per_combo_days_periodic', activities: ['reading', 'nutrition', 'sleep'], per: 30, stats: { 'Мышление': 8, 'Интеллект': 5 } } },
      ],
    },
  ],
};

// ---------- Комбо-пути / Специализация (Партия C: полное содержимое) ----------
// Балансный каркас: комбо = широта (защита на 2 стриках, множители комбо-дня +5%),
// специализация = глубина (+10% на 20, ускоренный стат-рост, HP-флор 45%, мастерство на 40).
// Периодика ЗАПРЕЩЕНА в новых путях (эксклюзив основных путей класса) — здесь её нет.
export const COMBO_PATHS = {
  'berserker|pathfinder': {
    name: 'Вестник Бури', pathName: 'Гром на горизонте', color: '#e8b830', secondaryColor: '#e8633c',
    skills: [
      { level: 20, name: 'Разгон бури', desc: 'Комбо-день (бег + силовая) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'strength_park,strength_gym', pct: 5 } },
      { level: 25, name: 'Удар молнии', desc: 'Стрик бега 5 дней достигнут → +3 Сила (единожды)',
        effect: { type: 'streak_once', activity: 'running', days: 5, stats: { 'Сила': 3 } } },
      { level: 30, name: 'Грозовой бегун', desc: 'При активном стрике бега силовые дают +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'strength_park,strength_gym', streakActivity: 'running', pct: 5 } },
      { level: 35, name: 'Око шторма', desc: 'Пока оба стрика (бег+сила) активны, физ.HP не падает ниже 40%',
        effect: { type: 'hp_floor', bar: 'physical', floor: 40, condition: 'streaks_active', streaks: ['running', 'strength_park,strength_gym'] } },
      { level: 40, name: 'Повелитель бури', desc: '50 комбо-дней достигнуто → +6 Выносливость +5 Сила (единожды)',
        effect: { type: 'combo_days_once', days: 50, stats: { 'Выносливость': 6, 'Сила': 5 } } },
    ],
  },
  'battlemaster|pathfinder': {
    name: 'Вестник Шторма', pathName: 'Вихрь клинков', color: '#8a5cf6', secondaryColor: '#e8633c',
    skills: [
      { level: 20, name: 'Стремительный удар', desc: 'Комбо-день (бег + борьба) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'wrestling', pct: 5 } },
      { level: 25, name: 'Танец ветра', desc: '3 бега + 2 борьбы за неделю достигнуто → +3 Гибкость (единожды)',
        effect: { type: 'weekly_pattern_once', activityA: 'running', perA: 3, activityB: 'wrestling', perB: 2, stats: { 'Гибкость': 3 } } },
      { level: 30, name: 'Вихревая атака', desc: 'При активном стрике борьбы бег даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'running', streakActivity: 'wrestling', pct: 5 } },
      { level: 35, name: 'Неуловимый шторм', desc: 'Дебаффы усталости действуют на 30% слабее',
        effect: { type: 'debuff_reduction', debuff: 'fatigue', pct: 30 } },
      { level: 40, name: 'Шторм без конца', desc: '40 комбо-дней достигнуто → +6 Гибкость +5 Выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Гибкость': 6, 'Выносливость': 5 } } },
    ],
  },
  'monk|pathfinder': {
    name: 'Странствующий Монах', pathName: 'Тропа просветления', color: '#4caf6d', secondaryColor: '#e8633c',
    skills: [
      { level: 20, name: 'Медитация в движении', desc: 'Комбо-день (бег + питание) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'nutrition', pct: 5 } },
      { level: 25, name: 'Лёгкий шаг', desc: 'Стрик питания 7 дней достигнут → +3 Выносливость (единожды)',
        effect: { type: 'streak_once', activity: 'nutrition', days: 7, stats: { 'Выносливость': 3 } } },
      { level: 30, name: 'Путь без привязанностей', desc: 'При активном стрике питания бег даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'running', streakActivity: 'nutrition', pct: 5 } },
      { level: 35, name: 'Чистое тело', desc: 'Комбо-день (питание + бег) → +5% восстановления физ.HP в этот день',
        effect: { type: 'hp_restore_combo_day', activityA: 'nutrition', activityB: 'running', bar: 'physical', pct: 5 } },
      { level: 40, name: 'Вечный странник', desc: '40 комбо-дней достигнуто → +6 Дисциплина +5 Выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Дисциплина': 6, 'Выносливость': 5 } } },
    ],
  },
  'pathfinder|shaman': {
    name: 'Лунный Странник', pathName: 'Свет ночной дороги', color: '#e8633c', secondaryColor: '#4f7cff',
    skills: [
      { level: 20, name: 'Ночной бег', desc: 'Комбо-день (бег + сон) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'sleep', pct: 5 } },
      { level: 25, name: 'Лунная тропа', desc: 'Стрик сна 7 дней достигнут → +3 Выносливость (единожды)',
        effect: { type: 'streak_once', activity: 'sleep', days: 7, stats: { 'Выносливость': 3 } } },
      { level: 30, name: 'Дыхание ночи', desc: 'При активном стрике сна бег даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'running', streakActivity: 'sleep', pct: 5 } },
      { level: 35, name: 'Регенерация бегуна', desc: 'Комбо-день (бег + сон) → +8% восстановления физ.HP',
        effect: { type: 'hp_restore_combo_day', activityA: 'running', activityB: 'sleep', bar: 'physical', pct: 8 } },
      { level: 40, name: 'Страж лунных дорог', desc: '40 комбо-дней достигнуто → +6 Дух +5 Выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Дух': 6, 'Выносливость': 5 } } },
    ],
  },
  'archmage|pathfinder': {
    name: 'Заклинатель Ветра', pathName: 'Книга ветров', color: '#d6558c', secondaryColor: '#e8633c',
    skills: [
      { level: 20, name: 'Бег с мыслями', desc: 'Комбо-день (бег + чтение) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'running', activityB: 'reading', pct: 5 } },
      { level: 25, name: 'Ветер знаний', desc: '500 страниц суммарно достигнуто → +3 Выносливость (единожды)',
        effect: { type: 'cumulative_once', activity: 'reading', metric: 'pages', threshold: 500, stats: { 'Выносливость': 3 } } },
      { level: 30, name: 'Формула скорости', desc: 'При активном стрике чтения бег даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'running', streakActivity: 'reading', pct: 5 } },
      { level: 35, name: 'Разум в движении', desc: 'Комбо-день (чтение в день бега) → +5% XP к чтению сверху',
        effect: { type: 'xp_mult_combo_day', activityA: 'reading', activityB: 'running', pct: 5, onlyActivity: 'reading' } },
      { level: 40, name: 'Архимаг дорог', desc: '40 комбо-дней достигнуто → +6 Интеллект +5 Выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Интеллект': 6, 'Выносливость': 5 } } },
    ],
  },
  'battlemaster|berserker': {
    name: 'Ревущий Зверь', pathName: 'Клыки и когти', color: '#8a5cf6', secondaryColor: '#e8b830',
    skills: [
      { level: 20, name: 'Звериная ярость', desc: 'Комбо-день (борьба + силовая) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'wrestling', activityB: 'strength_park,strength_gym', pct: 5 } },
      { level: 25, name: 'Двойной натиск', desc: '3 силовых + 2 борьбы за неделю достигнуто → +3 Упорство (единожды)',
        effect: { type: 'weekly_pattern_once', activityA: 'strength_park,strength_gym', perA: 3, activityB: 'wrestling', perB: 2, stats: { 'Упорство': 3 } } },
      { level: 30, name: 'Рёв зверя', desc: 'При активном стрике силовых борьба даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'wrestling', streakActivity: 'strength_park,strength_gym', pct: 5 } },
      { level: 35, name: 'Неостановимый', desc: 'Пока оба стрика активны, усталость не накладывается 1 раз/день',
        effect: { type: 'fatigue_block_once_per_day', streaks: ['wrestling', 'strength_park,strength_gym'] } },
      { level: 40, name: 'Альфа стаи', desc: '40 комбо-дней достигнуто → +6 Сила +5 Силовая выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Сила': 6, 'Силовая выносливость': 5 } } },
    ],
  },
  'berserker|monk': {
    name: 'Укротитель Зверей', pathName: 'Сила и контроль', color: '#e8b830', secondaryColor: '#4caf6d',
    skills: [
      { level: 20, name: 'Контролируемая мощь', desc: 'Комбо-день (силовая + питание) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'strength_park,strength_gym', activityB: 'nutrition', pct: 5 } },
      { level: 25, name: 'Питание зверя', desc: 'Стрик питания 7 дней достигнут → +3 Сила (единожды)',
        effect: { type: 'streak_once', activity: 'nutrition', days: 7, stats: { 'Сила': 3 } } },
      { level: 30, name: 'Дисциплина хищника', desc: 'При активном стрике питания силовые дают +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'strength_park,strength_gym', streakActivity: 'nutrition', pct: 5 } },
      { level: 35, name: 'Зверь на привязи', desc: 'Питание в норме снимает 1 стек усталости (раз в день)',
        effect: { type: 'debuff_remove_on_activity', activity: 'nutrition', debuff: 'fatigue', count: 1 } },
      { level: 40, name: 'Повелитель зверей', desc: '40 комбо-дней достигнуто → +6 Сила +5 Дисциплина (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Сила': 6, 'Дисциплина': 5 } } },
    ],
  },
  'berserker|shaman': {
    name: 'Кровавый Шаман', pathName: 'Кровь и духи', color: '#e8b830', secondaryColor: '#4f7cff',
    skills: [
      { level: 20, name: 'Жертва силы', desc: 'Комбо-день (силовая + сон) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'strength_park,strength_gym', activityB: 'sleep', pct: 5 } },
      { level: 25, name: 'Кровавый ритуал', desc: 'Стрик сна 7 дней достигнут → +3 Упорство (единожды)',
        effect: { type: 'streak_once', activity: 'sleep', days: 7, stats: { 'Упорство': 3 } } },
      { level: 30, name: 'Связь с предками', desc: 'При активном стрике сна силовые дают +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'strength_park,strength_gym', streakActivity: 'sleep', pct: 5 } },
      { level: 35, name: 'Регенерация берсерка', desc: 'Комбо-день (сон + тренировка) → +10% восстановления физ.HP',
        effect: { type: 'hp_restore_combo_day', activityA: 'sleep', activityB: 'strength_park,strength_gym', bar: 'physical', pct: 10 } },
      { level: 40, name: 'Шаман войны', desc: '40 комбо-дней достигнуто → +6 Упорство +5 Дух (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Упорство': 6, 'Дух': 5 } } },
    ],
  },
  'archmage|berserker': {
    name: 'Чародей Войны', pathName: 'Мускулы и формулы', color: '#d6558c', secondaryColor: '#e8b830',
    skills: [
      { level: 20, name: 'Усиленное заклинание', desc: 'Комбо-день (силовая + чтение) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'strength_park,strength_gym', activityB: 'reading', pct: 5 } },
      { level: 25, name: 'Боевая медитация', desc: 'Стрик чтения 7 дней достигнут → +3 Упорство (единожды)',
        effect: { type: 'streak_once', activity: 'reading', days: 7, stats: { 'Упорство': 3 } } },
      { level: 30, name: 'Тактический гений', desc: 'При активном стрике чтения силовые дают +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'strength_park,strength_gym', streakActivity: 'reading', pct: 5 } },
      { level: 35, name: 'Разум сильнее', desc: 'При ментал.HP выше 80% силовые дают +5% XP (складывается с ур.30)',
        effect: { type: 'conditional_xp_mult_hp', bar: 'mental', threshold: 80, pct: 5, activity: 'strength_park,strength_gym' } },
      { level: 40, name: 'Боевой архимаг', desc: '40 комбо-дней достигнуто → +6 Интеллект +5 Сила (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Интеллект': 6, 'Сила': 5 } } },
    ],
  },
  'battlemaster|monk': {
    name: 'Рука Возмездия', pathName: 'Кулак справедливости', color: '#8a5cf6', secondaryColor: '#4caf6d',
    skills: [
      { level: 20, name: 'Чистый удар', desc: 'Комбо-день (борьба + питание) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'wrestling', activityB: 'nutrition', pct: 5 } },
      { level: 25, name: 'Пост бойца', desc: 'Стрик питания 5 дней достигнут → +3 Гибкость (единожды)',
        effect: { type: 'streak_once', activity: 'nutrition', days: 5, stats: { 'Гибкость': 3 } } },
      { level: 30, name: 'Тело-оружие', desc: 'При активном стрике питания борьба даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'wrestling', streakActivity: 'nutrition', pct: 5 } },
      { level: 35, name: 'Возмездие', desc: 'Комбо-день (борьба + питание) → +8% XP борьбе в этот день',
        effect: { type: 'xp_mult_combo_day', activityA: 'wrestling', activityB: 'nutrition', pct: 8, onlyActivity: 'wrestling' } },
      { level: 40, name: 'Карающая рука', desc: '40 комбо-дней достигнуто → +6 Силовая выносливость +5 Дисциплина (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Силовая выносливость': 6, 'Дисциплина': 5 } } },
    ],
  },
  'battlemaster|shaman': {
    name: 'Дух Битвы', pathName: 'Транс воина', color: '#8a5cf6', secondaryColor: '#4f7cff',
    skills: [
      { level: 20, name: 'Боевой транс', desc: 'Комбо-день (борьба + сон) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'wrestling', activityB: 'sleep', pct: 5 } },
      { level: 25, name: 'Восстановление духа', desc: 'Стрик сна 7 дней достигнут → +3 Дух (единожды)',
        effect: { type: 'streak_once', activity: 'sleep', days: 7, stats: { 'Дух': 3 } } },
      { level: 30, name: 'Дух в кулаке', desc: 'При активном стрике сна борьба даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'wrestling', streakActivity: 'sleep', pct: 5 } },
      { level: 35, name: 'Неуязвимый дух', desc: 'Пока стрик борьбы активен, ментал.HP не падает ниже 35%',
        effect: { type: 'hp_floor', bar: 'mental', floor: 35, condition: 'streaks_active', streaks: ['wrestling'] } },
      { level: 40, name: 'Воин духов', desc: '40 комбо-дней достигнуто → +6 Гибкость +5 Дух (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Гибкость': 6, 'Дух': 5 } } },
    ],
  },
  'archmage|monk': {
    name: 'Верховный Жрец', pathName: 'Мудрость и воздержание', color: '#d6558c', secondaryColor: '#4caf6d',
    skills: [
      { level: 20, name: 'Просвещённый пост', desc: 'Комбо-день (чтение + питание) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'reading', activityB: 'nutrition', pct: 5 } },
      { level: 25, name: 'Знание — пища', desc: '300 страниц суммарно достигнуто → +3 Дисциплина (единожды)',
        effect: { type: 'cumulative_once', activity: 'reading', metric: 'pages', threshold: 300, stats: { 'Дисциплина': 3 } } },
      { level: 30, name: 'Высшая мудрость', desc: 'При активном стрике чтения питание даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'nutrition', streakActivity: 'reading', pct: 5 } },
      { level: 35, name: 'Жреческое благословение', desc: 'Пока оба стрика (питание+чтение) активны → +5% XP ко всему',
        effect: { type: 'conditional_xp_mult_multi', activity: 'all', streaks: ['nutrition', 'reading'], pct: 5 } },
      { level: 40, name: 'Верховный мудрец', desc: '40 комбо-дней достигнуто → +6 Интеллект +5 Дисциплина (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Интеллект': 6, 'Дисциплина': 5 } } },
    ],
  },
  'archmage|battlemaster': {
    name: 'Клинок Разума', pathName: 'Острота мысли и клинка', color: '#d6558c', secondaryColor: '#8a5cf6',
    skills: [
      { level: 20, name: 'Интеллектуальный спарринг', desc: 'Комбо-день (борьба + чтение) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'wrestling', activityB: 'reading', pct: 5 } },
      { level: 25, name: 'Стратегия боя', desc: 'Стрик чтения 5 дней достигнут → +3 Силовая выносливость (единожды)',
        effect: { type: 'streak_once', activity: 'reading', days: 5, stats: { 'Силовая выносливость': 3 } } },
      { level: 30, name: 'Аналитический удар', desc: 'При активном стрике чтения борьба даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'wrestling', streakActivity: 'reading', pct: 5 } },
      { level: 35, name: 'Просчитанный бой', desc: 'Пока оба стрика (чтение+борьба) активны → +5% XP ко всему',
        effect: { type: 'conditional_xp_mult_multi', activity: 'all', streaks: ['reading', 'wrestling'], pct: 5 } },
      { level: 40, name: 'Мастер клинка и пера', desc: '40 комбо-дней достигнуто → +6 Мышление +5 Силовая выносливость (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Мышление': 6, 'Силовая выносливость': 5 } } },
    ],
  },
  'monk|shaman': {
    name: 'Хранитель Снов', pathName: 'Покой внутри', color: '#4caf6d', secondaryColor: '#4f7cff',
    skills: [
      { level: 20, name: 'Гармония тела', desc: 'Комбо-день (питание + сон) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'nutrition', activityB: 'sleep', pct: 5 } },
      { level: 25, name: 'Исцеляющий пост', desc: 'Стрик питания+сна 5 дней достигнут → +3 ХП (единожды)',
        effect: { type: 'combo_streak_once', activityA: 'nutrition', activityB: 'sleep', days: 5, stats: { 'ХП': 3 } } },
      { level: 30, name: 'Внутренний мир', desc: 'При активном стрике сна питание даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'nutrition', streakActivity: 'sleep', pct: 5 } },
      { level: 35, name: 'Несокрушимый покой', desc: 'Пока оба стрика активны → восстановление HP +5%/день',
        effect: { type: 'hp_restore_streaks_active', streaks: ['nutrition', 'sleep'], bar: 'both', pct: 5 } },
      { level: 40, name: 'Хранитель баланса', desc: '40 комбо-дней достигнуто → +6 Дисциплина +5 ХП (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Дисциплина': 6, 'ХП': 5 } } },
    ],
  },
  'archmage|shaman': {
    name: 'Оракул Духов', pathName: 'Книга снов', color: '#d6558c', secondaryColor: '#4f7cff',
    skills: [
      { level: 20, name: 'Вещие страницы', desc: 'Комбо-день (чтение + сон) → +5% XP к обеим',
        effect: { type: 'xp_mult_combo_day', activityA: 'reading', activityB: 'sleep', pct: 5 } },
      { level: 25, name: 'Сны о прочитанном', desc: 'Стрик сна 7 дней достигнут → +3 Дух (единожды)',
        effect: { type: 'streak_once', activity: 'sleep', days: 7, stats: { 'Дух': 3 } } },
      { level: 30, name: 'Пророчество', desc: 'При активном стрике сна чтение даёт +5% XP',
        effect: { type: 'conditional_xp_mult', activity: 'reading', streakActivity: 'sleep', pct: 5 } },
      { level: 35, name: 'Осознанные сновидения', desc: 'Комбо-день (сон + чтение) → +8% восстановления ментал.HP',
        effect: { type: 'hp_restore_combo_day', activityA: 'sleep', activityB: 'reading', bar: 'mental', pct: 8 } },
      { level: 40, name: 'Оракул', desc: '40 комбо-дней достигнуто → +6 Мышление +5 Дух (единожды)',
        effect: { type: 'combo_days_once', days: 40, stats: { 'Мышление': 6, 'Дух': 5 } } },
    ],
  },
};

export const SPEC_PATHS = {
  pathfinder: {
    name: 'Одинокая дорога', color: '#e8633c',
    skills: [
      { level: 20, name: 'Дорога зовёт', desc: 'Бег даёт +10% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'running', stat: 'ALL_OF_ACTIVITY', pct: 10 } },
      { level: 25, name: 'Стальные ноги', desc: 'Усталость от бега/шагов на 40% слабее',
        effect: { type: 'debuff_reduction', debuff: 'fatigue', pct: 40, sourceActivity: 'running,walking' } },
      { level: 30, name: 'Дыхание марафонца', desc: 'Выносливость от бега растёт на +50% быстрее',
        effect: { type: 'stat_growth_rate', activity: 'running', stat: 'Выносливость', pct: 50 } },
      { level: 35, name: 'Второе сердце', desc: 'Пока стрик бега активен, физ.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'physical', floor: 45, condition: 'streaks_active', streaks: ['running'] } },
      { level: 40, name: 'Легенда дорог', desc: '60 бегов достигнуто → +8 Выносливость +4 Воля (единожды) + бег всегда +5% XP',
        effect: { type: 'spec_master', activity: 'running', count: 60, onceStats: { 'Выносливость': 8, 'Воля': 4 }, permaPct: 5 } },
    ],
  },
  berserker: {
    name: 'Гора мускулов', color: '#e8b830',
    skills: [
      { level: 20, name: 'Мощь горы', desc: 'Силовые дают +10% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'strength_park,strength_gym', stat: 'ALL_OF_ACTIVITY', pct: 10 } },
      { level: 25, name: 'Несгибаемый', desc: 'Перетренированность наступает на 2 тренировки позже',
        effect: { type: 'threshold_shift', target: 'overtraining_count', delta: 2 } },
      { level: 30, name: 'Стальные волокна', desc: 'Сила растёт на +50% быстрее от силовых',
        effect: { type: 'stat_growth_rate', activity: 'strength_park,strength_gym', stat: 'Сила', pct: 50 } },
      { level: 35, name: 'Каменная кожа', desc: 'Пока стрик силовых активен, физ.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'physical', floor: 45, condition: 'streaks_active', streaks: ['strength_park,strength_gym'] } },
      { level: 40, name: 'Титан', desc: '60 силовых достигнуто → +8 Сила +4 Упорство (единожды) + силовые всегда +5% XP',
        effect: { type: 'spec_master', activity: 'strength_park,strength_gym', count: 60, onceStats: { 'Сила': 8, 'Упорство': 4 }, permaPct: 5 } },
    ],
  },
  battlemaster: {
    name: 'Путь одного клинка', color: '#8a5cf6',
    skills: [
      { level: 20, name: 'Один против всех', desc: 'Борьба даёт +10% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'wrestling', stat: 'ALL_OF_ACTIVITY', pct: 10 } },
      { level: 25, name: 'Гибкое тело', desc: 'Усталость от тренировок на 40% слабее',
        effect: { type: 'debuff_reduction', debuff: 'fatigue', pct: 40, sourceActivity: 'wrestling' } },
      { level: 30, name: 'Поток движения', desc: 'Силовая выносливость растёт на +50% быстрее от борьбы',
        effect: { type: 'stat_growth_rate', activity: 'wrestling', stat: 'Силовая выносливость', pct: 50 } },
      { level: 35, name: 'Танец без ран', desc: 'Пока стрик борьбы активен, физ.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'physical', floor: 45, condition: 'streaks_active', streaks: ['wrestling'] } },
      { level: 40, name: 'Мастер клинка', desc: '50 схваток достигнуто → +8 Силовая выносливость +4 Гибкость (единожды) + борьба всегда +5% XP',
        effect: { type: 'spec_master', activity: 'wrestling', count: 50, onceStats: { 'Силовая выносливость': 8, 'Гибкость': 4 }, permaPct: 5 } },
    ],
  },
  monk: {
    name: 'Обет чистоты', color: '#4caf6d',
    skills: [
      { level: 20, name: 'Чистый путь', desc: 'Питание даёт +10% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'nutrition', stat: 'ALL_OF_ACTIVITY', pct: 10 } },
      { level: 25, name: 'Железная воля', desc: 'Порог яда/зажора повышен (нужно 7 зажоров вместо 5)',
        effect: { type: 'threshold_shift', target: 'poison_threshold', delta: 2 } },
      { level: 30, name: 'Совершенный контроль', desc: 'Дисциплина растёт на +50% быстрее от питания',
        effect: { type: 'stat_growth_rate', activity: 'nutrition', stat: 'Дисциплина', pct: 50 } },
      { level: 35, name: 'Внутренний свет', desc: 'Пока стрик питания активен, ментал.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'mental', floor: 45, condition: 'streaks_active', streaks: ['nutrition'] } },
      { level: 40, name: 'Просветлённый', desc: 'Стрик питания 60 дней → +8 Дисциплина +4 Фокус (единожды) + питание всегда +5% XP',
        effect: { type: 'spec_master', activity: 'nutrition', count: 60, byStreak: true, onceStats: { 'Дисциплина': 8, 'Фокус': 4 }, permaPct: 5 } },
    ],
  },
  shaman: {
    name: 'Хранитель источника', color: '#4f7cff',
    skills: [
      { level: 20, name: 'Глубокий сон', desc: 'Сон даёт +10% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'sleep', stat: 'ALL_OF_ACTIVITY', pct: 10 } },
      { level: 25, name: 'Целитель', desc: 'Сон снимает 2 стека усталости вместо 1',
        effect: { type: 'debuff_remove_on_activity', activity: 'sleep', debuff: 'fatigue', count: 1 } },
      { level: 30, name: 'Родник духа', desc: 'Дух растёт на +50% быстрее от сна',
        effect: { type: 'stat_growth_rate', activity: 'sleep', stat: 'Дух', pct: 50 } },
      { level: 35, name: 'Вечный покой', desc: 'Пока стрик сна активен, ментал.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'mental', floor: 45, condition: 'streaks_active', streaks: ['sleep'] } },
      { level: 40, name: 'Хранитель источника', desc: 'Стрик сна 60 дней → +8 Дух +4 ХП (единожды) + сон всегда +5% XP',
        effect: { type: 'spec_master', activity: 'sleep', count: 60, byStreak: true, onceStats: { 'Дух': 8, 'ХП': 4 }, permaPct: 5 } },
    ],
  },
  archmage: {
    name: 'Башня знаний', color: '#d6558c',
    skills: [
      { level: 20, name: 'Жажда знаний', desc: 'Чтение даёт +5% XP',
        effect: { type: 'xp_mult_to_stat', activity: 'reading', stat: 'ALL_OF_ACTIVITY', pct: 5 } },
      { level: 25, name: 'Ясность ума', desc: 'Информационный перегруз наступает на 1 день позже (4 дня вместо 3)',
        effect: { type: 'threshold_shift', target: 'info_overload_days', delta: 1 } },
      { level: 30, name: 'Кристалл мысли', desc: 'Интеллект растёт на +25% быстрее от чтения',
        effect: { type: 'stat_growth_rate', activity: 'reading', stat: 'Интеллект', pct: 25 } },
      { level: 35, name: 'Незамутнённый разум', desc: 'Пока стрик чтения активен, ментал.HP не падает ниже 45%',
        effect: { type: 'hp_floor', bar: 'mental', floor: 45, condition: 'streaks_active', streaks: ['reading'] } },
      { level: 40, name: 'Архимаг', desc: '15 книг достигнуто → +10 Интеллект +5 Мышление (единожды)',
        effect: { type: 'spec_master', activity: 'reading', count: 15, byBooks: true, onceStats: { 'Интеллект': 10, 'Мышление': 5 }, permaPct: 0 } },
    ],
  },
};


// Список категорий "Стены подвигов" (Партия B) — группировка + подписи + единицы измерения.
// Используется и внутри App (детект новых рекордов), и в GuildMemberDetail (read-only просмотр).
