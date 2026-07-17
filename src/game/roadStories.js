// ---------- ДОРОЖНЫЕ ИСТОРИИ (случайные события) ----------

// ---------- ROAD STORIES: Дорожные истории (случайные события) ----------
// Trigger: each activity log (not morning ritual) rolls for event. Max 1/day.
// Types: find (60%), encounter (30%), rare (10%).
// firstLogChance — шанс на ПЕРВЫЙ лог дня; extraLogChance — на каждый следующий лог того же дня.
export const ROAD_EVENT_CHANCE_BY_LEVEL = [
  { maxLevel: 5,  firstLogChance: 0.45, extraLogChance: 0.15, types: ['find', 'dilemma'] },
  { maxLevel: 14, firstLogChance: 0.45, extraLogChance: 0.15, types: ['find', 'encounter', 'dilemma'] },
  { maxLevel: 30, firstLogChance: 0.42, extraLogChance: 0.14, types: ['find', 'encounter', 'rare', 'dilemma'] },
  { maxLevel: 99, firstLogChance: 0.40, extraLogChance: 0.12, types: ['find', 'encounter', 'rare', 'dilemma'] },
];
export const ROAD_EVENT_PITY_DAYS = 2; // 2 календарных дня без события → гарантия на следующем логе

// Reward helpers
export const RE_CRYSTALS = (n) => ({ type: 'crystals', value: n });
export const RE_BUFF = (name, pct, scope, days) => ({ type: 'buff', name, xpBonusPct: pct, scope, days: days || 1 });
export const RE_CRYSTAL_COST = (n) => ({ type: 'crystal_cost', value: n });
export const RE_PENDING_CRYSTALS = (n) => ({ type: 'pending_crystals', value: n, nextDay: true });
export const RE_STREAK_SHIELD = () => ({ type: 'streak_shield', days: 1 });

export const ROAD_EVENTS_UNIVERSAL = {
  find: [
    { id: 'uf1', text: 'По пути в таверну вы споткнулись и наткнулись на блестяшку.', rewards: [RE_CRYSTALS(1)] },
    { id: 'uf2', text: 'Под скамейкой в парке лежит записка: «Тренируйся или умри». Мотивирует.', rewards: [RE_CRYSTALS(2)] },
    { id: 'uf3', text: 'Ветер донёс запах чужой шаурмы. Вы устояли.', rewards: [RE_BUFF('Стойкость', 3, 'all', 1)] },
    { id: 'uf4', text: 'Старый воин кивнул вам на бегу. Видимо, он увидел в вас потенциал.', rewards: [RE_CRYSTALS(3)] },
    { id: 'uf5', text: 'Вы нашли чей-то дневник тренировок. 347 дней подряд. Впечатляет и пугает.', rewards: [RE_CRYSTALS(2)] },
    { id: 'uf6', text: 'Голубь пролетел прямо над вами. Не попал. Считайте это знаком удачи.', rewards: [RE_CRYSTALS(1)] },
    { id: 'uf7', text: 'Кто-то бросил протеиновый батончик у дороги. Пять секунд не прошло.', rewards: [RE_CRYSTALS(2)] },
    { id: 'uf8', text: 'Вы случайно сделали идеальное приседание. Даже колени не хрустнули.', rewards: [RE_BUFF('Идеальная форма', 5, 'strength', 1)] },
    { id: 'uf9',  text: 'Нашли пятак на удачу. Древний, ещё с профилем какого-то императора.', rewards: [RE_CRYSTALS(1)] },
    { id: 'uf10', text: 'Кто-то оставил мотивационный стикер: «Ты не устал, ты просто ленивый». Грубо, но справедливо.', rewards: [RE_BUFF('Злость на стикер', 3, 'all', 1)] },
    { id: 'uf11', text: 'Белка уронила орех прямо вам в руку. Приняли как знак свыше.', rewards: [RE_CRYSTALS(2)] },
    { id: 'uf12', text: 'В луже отразилось ваше лицо. Выглядите как человек, который сейчас потренируется.', rewards: [RE_BUFF('Самоуважение', 3, 'all', 1)] },
  ],
  encounter: [
    {
      id: 'ue1', text: 'Странный человек в плаще предлагает секретную сделку: «Отдай 5 кристаллов — получишь 12 завтра.»',
      yesLabel: 'Принять', noLabel: 'Отказать',
      yes: [RE_CRYSTAL_COST(5), RE_PENDING_CRYSTALS(12)], no: [],
    },
    {
      id: 'ue2', text: 'Бабушка у подъезда говорит: «Сынок, ты похудел! На вот пирожок.» Принять пирожок?',
      yesLabel: 'Принять', noLabel: 'Отказать',
      yes: [RE_CRYSTALS(3), RE_BUFF('Пирожок бабули', -5, 'nutrition', 1)], no: [RE_CRYSTALS(1)],
    },
    {
      id: 'ue3', text: 'Бездомный кот трётся о ноги. Покормить?',
      yesLabel: 'Покормить', noLabel: 'Пройти мимо',
      yes: [RE_CRYSTAL_COST(2), RE_BUFF('Кошачья благодарность', 5, 'all', 1)], no: [],
    },
    {
      id: 'ue4', text: 'Тренер из соседнего зала предлагает бесплатное занятие. Пойти?',
      yesLabel: 'Пойти', noLabel: 'Сэкономить время',
      yes: [RE_BUFF('Урок мастера', 5, 'strength', 1)], no: [RE_CRYSTALS(1)],
    },
    {
      id: 'ue5', text: 'Незнакомец на пробежке предлагает гонку до следующего перекрёстка.',
      yesLabel: 'Принять', noLabel: 'Отказать',
      yes: [RE_CRYSTALS(4), RE_BUFF('Азарт', 10, 'running', 1)], no: [RE_CRYSTALS(1)],
    },
    {
      id: 'ue6', text: 'Вы нашли карту сокровищ! Нарисована фломастером на салфетке. Следовать?',
      yesLabel: 'Следовать', noLabel: 'Выбросить',
      yes: [{ type: 'random_crystals', options: [{ chance: 0.7, value: 8 }, { chance: 0.3, value: 0, flavor: 'Карта вела к мусорке' }] }],
      no: [RE_CRYSTALS(1)],
      chain: { delayDays: 2, nextEventId: 'chain_treasure_2' },
    },
    { id: 'ue7',  text: 'Уличный музыкант играет тему из Rocky специально для вас. Кинуть монету?', yesLabel: 'Кинуть 2💎', noLabel: 'Кивнуть с уважением', yes: [RE_CRYSTAL_COST(2), RE_BUFF('Глаз тигра', 7, 'all', 1)], no: [RE_CRYSTALS(1)] },
    { id: 'ue8',  text: 'Качок на площадке предлагает поспорить, кто больше подтянется. Рискнуть репутацией?', yesLabel: 'Спорить', noLabel: 'Не сегодня', yes: [{ type: 'random_crystals', options: [{ chance: 0.6, value: 4 }, { chance: 0.4, value: 0, flavor: 'Он сделал на 3 больше. Позор.' }] }], no: [RE_CRYSTALS(1)] },
    { id: 'ue9',  text: 'Бабка продаёт домашний квас. «Настоящий, не то что ваши изотоники!» Купить?', yesLabel: 'Купить 2💎', noLabel: 'Вежливо отказать', yes: [RE_CRYSTAL_COST(2), RE_BUFF('Квасная мощь', 6, 'all', 1)], no: [] },
    { id: 'ue10', text: 'Ребёнок спрашивает: «Дядь, а ты супергерой?» Ответить да?', yesLabel: 'Конечно, да', noLabel: 'Честно: нет', yes: [RE_BUFF('Ответственность героя', 5, 'all', 1)], no: [RE_CRYSTALS(1)] },
    { id: 'ue11', text: 'Незнакомец узнал в вас «того самого с приложения». Дать автограф?', yesLabel: 'Дать автограф', noLabel: 'Смутиться', yes: [RE_CRYSTALS(2)], no: [RE_BUFF('Скромность', 4, 'all', 1)] },
    { id: 'ue12', text: 'Продавец шаурмы: «Тебе как обычно?» Вы его впервые видите. Признаться?', yesLabel: 'Взять шаурму', noLabel: 'Убежать', yes: [RE_CRYSTALS(1), RE_BUFF('Читмил', -8, 'nutrition', 1)], no: [RE_BUFF('Сила воли', 5, 'nutrition', 1)] },
    { id: 'ue13', text: 'Старый пёс увязался за вами на пробежке. Взять в напарники на сегодня?', yesLabel: 'Взять', noLabel: 'Попрощаться', yes: [RE_BUFF('Верный пёс', 6, 'running', 1)], no: [RE_CRYSTALS(1)] },
    { id: 'ue14', text: 'Уличный философ: «Зачем ты качаешься, если все мы прах?» Ответить?', yesLabel: 'Вступить в спор', noLabel: 'Пройти молча', yes: [RE_BUFF('Экзистенциальная ясность', 4, 'all', 1), RE_CRYSTALS(1)], no: [] },
    { id: 'ue15', text: 'Вам предлагают вступить в клуб любителей холодных ванн. Записаться?', yesLabel: 'Записаться', noLabel: 'Бр-р, нет', yes: [RE_BUFF('Закалка', 5, 'all', 2)], no: [RE_CRYSTALS(1)] },
    { id: 'ue16', text: 'Курьер перепутал адрес и отдал вам протеин. Оставить себе?', yesLabel: 'Оставить', noLabel: 'Вернуть', yes: [RE_CRYSTALS(3), RE_BUFF('Нечистая совесть', -3, 'all', 1)], no: [RE_BUFF('Карма', 6, 'all', 1)] },
    { id: 'ue17', text: 'На лавочке сидит ваша будущая версия — на 20 лет старше и в форме. «Не сдавайся.» Обнять?', yesLabel: 'Обнять себя', noLabel: 'Кивнуть', yes: [RE_BUFF('Связь времён', 8, 'all', 2)], no: [RE_CRYSTALS(2)] },
  ],
  rare: [
    { id: 'ur1', text: 'Призрак старого самурая появился в тумане. «Покажи мне свою решимость.»', rewards: [RE_BUFF('Решимость самурая', 15, 'all', 1)] },
    { id: 'ur2', text: 'Вы наступили на волшебную плитку. Серьёзно. Она светится.', rewards: [RE_CRYSTALS(10)] },
    { id: 'ur3', text: 'Лунный кролик спустился с неба и оценил вашу форму. «Неплохо для смертного.»', rewards: [RE_BUFF('Лунное благословение', 10, 'all', 2)] },
    { id: 'ur4', text: 'Загадочный свиток упал из ниоткуда. Внутри написано имя вашего класса.', rewards: [RE_CRYSTALS(15)] },
    { id: 'ur5', text: 'Призрак самурая изучает вас. «Через три дня я вернусь. Будь готов показать прогресс.»', rewards: [RE_CRYSTALS(3)], chain: { delayDays: 3, nextEventId: 'chain_samurai_return' } },
    { id: 'ur6', text: 'Древний тренажёрный бог явился из спортзального пара. «Ты достоин.» Он дарует силу.', rewards: [RE_BUFF('Благословение железа', 12, 'strength', 2)] },
    { id: 'ur7', text: 'Портал в параллельную реальность, где вы уже на 50 уровне. Оттуда прилетел привет и кристаллы.', rewards: [RE_CRYSTALS(12)] },
  ],
  // dilemma: выбор А/Б — обе опции дают награду, нет "отказа" (в отличие от encounter)
  dilemma: [
    {
      id: 'ud1', text: 'Развилка. Налево — блеск кристаллов в кустах. Направо — старик машет, зовёт на чай с мудростью.',
      aLabel: 'Налево (кристаллы)', bLabel: 'Направо (мудрость)',
      a: [RE_CRYSTALS(4)], b: [RE_BUFF('Мудрость старика', 6, 'all', 1)],
    },
    {
      id: 'ud2', text: 'Два торговца тянут вас за рукава. Один даёт зелье силы, другой — эликсир выносливости.',
      aLabel: 'Зелье силы', bLabel: 'Эликсир выносливости',
      a: [RE_BUFF('Зелье силы', 7, 'strength', 1)], b: [RE_BUFF('Эликсир', 7, 'running', 1)],
    },
    {
      id: 'ud3', text: 'Находите два свитка. Один сияет золотом (награда сейчас), другой пульсирует (награда завтра, больше).',
      aLabel: 'Золотой (сейчас)', bLabel: 'Пульсирующий (завтра)',
      a: [RE_CRYSTALS(3)], b: [RE_PENDING_CRYSTALS(6)],
    },
    {
      id: 'ud4', text: 'Перекрёсток судьбы: рискнуть ради большого куша или взять гарантированное малое?',
      aLabel: 'Рискнуть', bLabel: 'Синица в руках',
      a: [{ type: 'random_crystals', options: [{ chance: 0.5, value: 9 }, { chance: 0.5, value: 0, flavor: 'Пусто. Судьба посмеялась.' }] }], b: [RE_CRYSTALS(3)],
    },
    {
      id: 'ud6', text: 'Две тропы: одна ведёт к отдыху (восстановление), другая к славе (XP-баф).',
      aLabel: 'Отдых', bLabel: 'Слава',
      a: [{ type: 'hp_restore', bar: 'mental', value: 12 }], b: [RE_BUFF('Жажда славы', 7, 'all', 1)],
    },
  ],
};

// Цепочки: события-продолжения. НЕ роллятся случайно — вызываются только по сроку из pendingEvents.
export const ROAD_CHAIN_EVENTS = {
  chain_samurai_return: {
    id: 'chain_samurai_return', eventType: 'encounter',
    text: 'Самурай вернулся, как и обещал. «Ты стал сильнее. Прими мой дар.» Принять благословение?',
    yesLabel: 'Принять', noLabel: 'Поклониться и отказаться',
    yes: [RE_BUFF('Благословение мастера', 10, 'all', 2), RE_CRYSTALS(6)],
    no: [RE_BUFF('Смирение', 6, 'all', 2)],
    chainComplete: true,
  },
  chain_treasure_2: {
    id: 'chain_treasure_2', eventType: 'find',
    text: 'Салфеточная карта не соврала — под скамейкой тайник. Внутри вторая часть карты.',
    rewards: [RE_CRYSTALS(4)],
    chain: { delayDays: 2, nextEventId: 'chain_treasure_3' },
  },
  chain_treasure_3: {
    id: 'chain_treasure_3', eventType: 'rare',
    text: 'Финал охоты за сокровищами. Сундук! Внутри... абонемент в спортзал на всю жизнь. Метафорически.',
    rewards: [RE_CRYSTALS(12), RE_BUFF('Сокровище найдено', 8, 'all', 2)],
    chainComplete: true,
  },
};

// Class-specific events (from level 15 with locked class)
export const ROAD_EVENTS_CLASS = {
  sledopyt: {
    find: [
      { id: 'cf_sl1', text: 'Лис на обочине смотрит вам вслед. В его глазах — уважение.', rewards: [RE_CRYSTALS(3), RE_BUFF('Взгляд лиса', 5, 'running', 1)], activity: 'running' },
      { id: 'cf_sl2', text: 'Вы пробежали мимо дерева, на котором вырезано «Здесь был Следопыт». Вы вырезали «И вернулся.»', rewards: [RE_CRYSTALS(4)], activity: 'running' },
    ],
    encounter: [{
      id: 'ce_sl1', text: 'Старый марафонец предлагает обменяться маршрутами. Согласиться?', activity: 'running',
      yesLabel: 'Согласиться', noLabel: 'Отказать',
      yes: [RE_CRYSTALS(5), RE_BUFF('Новая тропа', 10, 'running', 1)], no: [RE_CRYSTALS(2)],
    }],
    path: {
      'path_sledopyt_a': { id: 'cp_sl_a', text: 'Южный ветер подул вам в спину. Буквально.', rewards: [RE_BUFF('Южный ветер', 8, 'running', 1)] },
      'path_sledopyt_b': { id: 'cp_sl_b', text: 'Вы учуяли добычу. Ладно, это был запах кофейни. Но инстинкт сработал.', rewards: [RE_BUFF('Инстинкт охотника', 8, 'running', 1)] },
    },
  },
  berserk: {
    find: [
      { id: 'cf_bs1', text: 'Штанга в зале мигнула вам. Показалось?', rewards: [RE_CRYSTALS(3), RE_BUFF('Штанга зовёт', 5, 'strength', 1)], activity: 'strength' },
      { id: 'cf_bs2', text: 'Вы подняли вес, который вчера казался невозможным. Зеркало аплодирует.', rewards: [RE_CRYSTALS(4)], activity: 'strength' },
    ],
    encounter: [{
      id: 'ce_bs1', text: 'Огромный мужик предлагает армрестлинг. На кону — честь. Принять?', activity: 'strength',
      yesLabel: 'Принять', noLabel: 'Отказать',
      yes: [{ type: 'random_crystals', options: [{ chance: 0.6, value: 6 }, { chance: 0.4, value: 2, flavor: 'Проигрыш, но с уважением' }] }],
      no: [RE_CRYSTALS(1)],
    }],
    path: {
      'path_berserk_a': { id: 'cp_bs_a', text: 'Гора признала вас своим. Вы слышите гул камней.', rewards: [RE_BUFF('Гул горы', 8, 'strength', 1)] },
      'path_berserk_b': { id: 'cp_bs_b', text: 'Пустошь молчит. Но вы всё ещё здесь. Это и есть упорство.', rewards: [RE_BUFF('Голос пустоши', 8, 'strength', 1)] },
    },
  },
  master_bitvy: {
    find: [
      { id: 'cf_mb1', text: 'Ваша тень двигается быстрее вас. Кажется, она тренируется отдельно.', rewards: [RE_CRYSTALS(3), RE_BUFF('Тень воина', 5, 'wrestling', 1)], activity: 'wrestling' },
      { id: 'cf_mb2', text: 'Вы перехватили приём из чужой схватки. Тело запомнило раньше мозга.', rewards: [RE_CRYSTALS(4)], activity: 'wrestling' },
    ],
    encounter: [{
      id: 'ce_mb1', text: 'Старый мастер из додзё предлагает спарринг на одну минуту. Принять?', activity: 'wrestling',
      yesLabel: 'Принять', noLabel: 'Наблюдать',
      yes: [RE_CRYSTALS(5), RE_BUFF('Урок мастера', 10, 'wrestling', 1)], no: [RE_CRYSTALS(2)],
    }],
    path: {
      'path_master_bitvy_a': { id: 'cp_mb_a', text: 'Вы чувствуете, как тысяча схваток живёт в ваших руках.', rewards: [RE_BUFF('Тысяча схваток', 8, 'wrestling', 1)] },
      'path_master_bitvy_b': { id: 'cp_mb_b', text: 'Ваше тело двигается как вода. Без усилия, без трения.', rewards: [RE_BUFF('Течение', 8, 'wrestling', 1)] },
    },
  },
  monk: {
    find: [
      { id: 'cf_mn1', text: 'Рис в тарелке образовал идеальный круг. Знак вселенной?', rewards: [RE_CRYSTALS(3), RE_BUFF('Знак круга', 5, 'nutrition', 1)], activity: 'nutrition' },
      { id: 'cf_mn2', text: 'Вы попали в норму калорий с точностью до единицы. Случайность? Контроль.', rewards: [RE_CRYSTALS(4)], activity: 'nutrition' },
    ],
    encounter: [{
      id: 'ce_mn1', text: 'Торговец на рынке предлагает экзотическую специю: «Откроет чакры, гарантирую.» Купить за 3 кристалла?', activity: 'nutrition',
      yesLabel: 'Купить', noLabel: 'Пройти мимо',
      yes: [RE_CRYSTAL_COST(3), RE_BUFF('Открытые чакры', 8, 'all', 1)], no: [RE_CRYSTALS(1)],
    }],
    path: {
      'path_monk_a': { id: 'cp_mn_a', text: 'Тишина вокруг вас стала осязаемой. Мысли — кристально чистые.', rewards: [RE_BUFF('Кристальный фокус', 8, 'reading', 1)] },
      'path_monk_b': { id: 'cp_mn_b', text: 'Искушение прошло мимо. Вы даже не заметили. Вот это дисциплина.', rewards: [RE_BUFF('Железная дисциплина', 8, 'nutrition', 1)] },
    },
  },
  shaman: {
    find: [
      { id: 'cf_sh1', text: 'Вам приснился вещий сон. Содержание забылось, но ощущение осталось.', rewards: [RE_CRYSTALS(3), RE_BUFF('Вещий сон', 5, 'sleep', 1)], activity: 'sleep' },
      { id: 'cf_sh2', text: 'Вы проспали ровно 8 часов. Ни минутой больше, ни минутой меньше. Идеальный баланс.', rewards: [RE_CRYSTALS(4)], activity: 'sleep' },
    ],
    encounter: [{
      id: 'ce_sh1', text: 'Духи предлагают сделку: отдай 4 кристалла, и они защитят твой стрик на 1 день. Принять?', activity: 'sleep',
      yesLabel: 'Принять', noLabel: 'Отказать',
      yes: [RE_CRYSTAL_COST(4), RE_STREAK_SHIELD()], no: [RE_CRYSTALS(1)],
    }],
    path: {
      'path_shaman_a': { id: 'cp_sh_a', text: 'Тайный мир шепнул вам что-то на ухо. Вы не расслышали, но почувствовали силу.', rewards: [RE_BUFF('Шёпот миров', 8, 'sleep', 1)] },
      'path_shaman_b': { id: 'cp_sh_b', text: 'Ваше тело — крепость. Стены крепки, ворота закрыты.', rewards: [RE_BUFF('Живая крепость', 8, 'sleep', 1)] },
    },
  },
  archmage: {
    find: [
      { id: 'cf_am1', text: 'Страница книги перевернулась сама. Ветер? Магия?', rewards: [RE_CRYSTALS(3), RE_BUFF('Магия страниц', 5, 'reading', 1)], activity: 'reading' },
      { id: 'cf_am2', text: 'Вы дочитали главу и поняли что-то важное о себе. Не о книге — о себе.', rewards: [RE_CRYSTALS(4)], activity: 'reading' },
    ],
    encounter: [{
      id: 'ce_am1', text: 'Букинист предлагает редкий том: «Эта книга меняет людей.» Купить за 4 кристалла?', activity: 'reading',
      yesLabel: 'Купить', noLabel: 'Пройти мимо',
      yes: [RE_CRYSTAL_COST(4), RE_BUFF('Запретное знание', 12, 'reading', 2)], no: [RE_CRYSTALS(1)],
    }],
    path: {
      'path_archmage_a': { id: 'cp_am_a', text: 'Концепция обрела форму. В голове — идеальная конструкция.', rewards: [RE_BUFF('Конструкция разума', 8, 'reading', 1)] },
      'path_archmage_b': { id: 'cp_am_b', text: 'Облака сложились в формулу. Вы единственный, кто это видит.', rewards: [RE_BUFF('Облачная формула', 8, 'reading', 1)] },
    },
  },
};

// Map lockedClassId → ROAD_EVENTS_CLASS key
export const CLASS_ID_TO_EVENT_KEY = {
  sledopyt: 'sledopyt', berserk: 'berserk', master_bitvy: 'master_bitvy',
  monk: 'monk', shaman: 'shaman', archmage: 'archmage',
};

// Road story achievements
export const ROAD_STORY_ACHIEVEMENTS = [
  { id: 'rs_first', title: 'Что это блестит?', description: 'Получи первое случайное событие', need: 1, kind: 'total' },
  { id: 'rs_20', title: 'Коллекционер случайностей', description: 'Получи 20 событий', need: 20, kind: 'total' },
  { id: 'rs_50', title: 'Знатный проныра', description: 'Получи 50 событий', need: 50, kind: 'total' },
  { id: 'rs_rare3', title: 'Третье имя — удача', description: 'Получи 3 редких события', need: 3, kind: 'rares' },
  { id: 'rs_deals10', title: 'Торговец душами', description: 'Прими 10 сделок у незнакомцев', need: 10, kind: 'deals', secret: true },
  { id: 'rs_reject10', title: 'Нет, спасибо', description: 'Откажи 10 раз подряд во встречах', need: 10, kind: 'reject_streak', secret: true },
  { id: 'rs_dilemma5', title: 'Муки выбора', description: 'Реши 5 дилемм', need: 5, kind: 'dilemma_total' },
  { id: 'rs_chain', title: 'До самого конца', description: 'Заверши цепочку событий', need: 1, kind: 'chain_complete', secret: true },
];

