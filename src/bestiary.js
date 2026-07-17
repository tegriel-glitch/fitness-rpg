// ---------- БЕСТИАРИЙ и Стена подвигов (личные рекорды) ----------

// ---------- БЕСТИАРИЙ (Партия D) ----------
// Черновик флейвора — Антон, правьте под свой стиль как обычно, структура (id/category/rarity)
// менять не обязательно, только name/flavor.
// rarity: common | uncommon | rare | legendary. Легендарные проверяются через legendaryCheck(ctx).
export const BESTIARY_RARITY_COLORS = { common: '#8a8a92', uncommon: '#5fb884', rare: '#4f7cff', legendary: '#f0d272' };
export const BESTIARY_CATALOG = [
  // ── БЕГ (running) — 10 ──────────────────────────────────────
  { id: 'b_run_01', category: 'running', rarity: 'common', emoji: '🐿️', name: 'Шустрый бурундук', flavor: 'Обогнал тебя на первых же 200 метрах. Не обсуждаем это.' },
  { id: 'b_run_02', category: 'running', rarity: 'common', emoji: '🐕', name: 'Дворовый спринтер', flavor: 'Облаял тебя от забора до забора. Считай это персональным тренером.' },
  { id: 'b_run_03', category: 'running', rarity: 'common', emoji: '🕊️', name: 'Городской голубь', flavor: 'Взлетел прямо перед лицом. Пульс подскочил без всякого кардио.' },
  { id: 'b_run_04', category: 'running', rarity: 'common', emoji: '🐌', name: 'Улитка-философ', flavor: 'Медленнее тебя. Единственный, кого ты обогнал за всю пробежку.' },
  { id: 'b_run_05', category: 'running', rarity: 'uncommon', emoji: '🦌', name: 'Осторожный олень', flavor: 'Замер на обочине парка, оценивая твою технику бега. Не впечатлён.' },
  { id: 'b_run_06', category: 'running', rarity: 'uncommon', emoji: '🦉', name: 'Ночная сова', flavor: 'Наблюдала за вечерней пробежкой с ветки. Ухнула одобрительно.' },
  { id: 'b_run_07', category: 'running', rarity: 'uncommon', emoji: '🐺', name: 'Призрачный волк', flavor: 'Промелькнул в тумане на рассвете. Или просто соседская овчарка.' },
  { id: 'b_run_08', category: 'running', rarity: 'rare', emoji: '🦅', name: 'Горный орёл', flavor: 'Парил над трассой, будто оценивал твой темп с высоты птичьего полёта.' },
  { id: 'b_run_09', category: 'running', rarity: 'rare', emoji: '🐎', name: 'Дикий мустанг', flavor: 'Пронёсся параллельным курсом. На секунду показалось, что вы бежите наперегонки.' },
  { id: 'b_run_10', category: 'running', rarity: 'legendary', emoji: '🐉', name: 'Вихревой Дракон', flavor: 'Появляется только перед теми, кто пробежал 10 км за раз. Несётся вместе с ветром.',
    legendaryCheck: (ctx) => ctx.maxRunDistance >= 10 },

  // ── СИЛОВЫЕ (strength_park/strength_gym) — 10 ──────────────
  { id: 'b_str_01', category: 'strength', rarity: 'common', emoji: '🐜', name: 'Муравей-силач', flavor: 'Тащит вес в 50 раз больше себя. Не хвастается.' },
  { id: 'b_str_02', category: 'strength', rarity: 'common', emoji: '🦫', name: 'Бобёр-строитель', flavor: 'Уважает тех, кто строит себя по кирпичику. В смысле — по подходу.' },
  { id: 'b_str_03', category: 'strength', rarity: 'common', emoji: '🦍', name: 'Молодая горилла', flavor: 'Посмотрела на твой жим и одобрительно постучала в грудь.' },
  { id: 'b_str_04', category: 'strength', rarity: 'common', emoji: '🐂', name: 'Упрямый бык', flavor: 'Стоит рядом, пока ты делаешь становую. Никто не уверен, зачем.' },
  { id: 'b_str_05', category: 'strength', rarity: 'uncommon', emoji: '🦏', name: 'Носорог-скептик', flavor: 'Сомневается в технике. Молча.' },
  { id: 'b_str_06', category: 'strength', rarity: 'uncommon', emoji: '🐘', name: 'Слон-тяжеловес', flavor: 'Признал в тебе коллегу по цеху после третьего подхода.' },
  { id: 'b_str_07', category: 'strength', rarity: 'uncommon', emoji: '🦾', name: 'Механический голем', flavor: 'Собран из старых блинов и амбиций. Скрипит, но жмёт.' },
  { id: 'b_str_08', category: 'strength', rarity: 'rare', emoji: '🐻', name: 'Медведь-культурист', flavor: 'Вышел из спячки специально, чтобы обсудить прогрессию нагрузок.' },
  { id: 'b_str_09', category: 'strength', rarity: 'rare', emoji: '🦁', name: 'Лев-чемпион', flavor: 'Царь зала. Уступил только потому, что штанга была занята.' },
  { id: 'b_str_10', category: 'strength', rarity: 'legendary', emoji: '🌋', name: 'Вулканический Колосс', flavor: 'Просыпается только для тех, кто сделал 5 тяжёлых тренировок за неделю.',
    legendaryCheck: (ctx) => ctx.weeklyHardStrengthCount >= 5 },

  // ── БОРЬБА (wrestling) — 9 ──────────────────────────────────
  { id: 'b_wr_01', category: 'wrestling', rarity: 'common', emoji: '🦀', name: 'Краб-борец', flavor: 'Захват клешнёй не засчитан судьёй. Краб не согласен.' },
  { id: 'b_wr_02', category: 'wrestling', rarity: 'common', emoji: '🐿️', name: 'Боевая белка', flavor: 'Маленькая, но кусается. В прямом смысле.' },
  { id: 'b_wr_03', category: 'wrestling', rarity: 'common', emoji: '🐓', name: 'Петух-задира', flavor: 'Вызвал на бой ещё до разминки.' },
  { id: 'b_wr_04', category: 'wrestling', rarity: 'uncommon', emoji: '🦡', name: 'Барсук-безбашенник', flavor: 'Согласно легендам — самое бесстрашное существо на планете. Подтверждено на татами.' },
  { id: 'b_wr_05', category: 'wrestling', rarity: 'uncommon', emoji: '🐗', name: 'Дикий кабан', flavor: 'Ломанулся в клинч без предупреждения.' },
  { id: 'b_wr_06', category: 'wrestling', rarity: 'uncommon', emoji: '🦂', name: 'Скорпион-тактик', flavor: 'Предпочитает захваты снизу. И яд в хвосте, но это не по правилам.' },
  { id: 'b_wr_07', category: 'wrestling', rarity: 'rare', emoji: '🐯', name: 'Тигр-чемпион', flavor: 'Уважает силу. И слегка царапнул на прощание.' },
  { id: 'b_wr_08', category: 'wrestling', rarity: 'rare', emoji: '🐊', name: 'Крокодил из ямы', flavor: 'Знает толк в захватах и терпении. Ждал 20 минут ради одного броска.' },
  { id: 'b_wr_09', category: 'wrestling', rarity: 'legendary', emoji: '👹', name: 'Они-Борец', flavor: 'Демон борьбы. Является только тем, кто держит стрик схваток 14 дней подряд.',
    legendaryCheck: (ctx) => (ctx.streaksByActivity.wrestling || 0) >= 14 },

  // ── ШАГИ (walking) — 9 ──────────────────────────────────────
  { id: 'b_walk_01', category: 'walking', rarity: 'common', emoji: '🐦', name: 'Дорожный воробей', flavor: 'Сопровождал тебя половину маршрута в поисках крошек.' },
  { id: 'b_walk_02', category: 'walking', rarity: 'common', emoji: '🐈', name: 'Дворовый кот', flavor: 'Проводил до угла дома. Дальше — не его юрисдикция.' },
  { id: 'b_walk_03', category: 'walking', rarity: 'common', emoji: '🦆', name: 'Городская утка', flavor: 'Переходила дорогу перед тобой с королевским достоинством.' },
  { id: 'b_walk_04', category: 'walking', rarity: 'common', emoji: '🐕‍🦺', name: 'Пёс на поводке у соседа', flavor: 'Радостно приветствовал, будто не видел тебя всю жизнь.' },
  { id: 'b_walk_05', category: 'walking', rarity: 'uncommon', emoji: '🦔', name: 'Ночной ёж', flavor: 'Пересёк тропинку, ни капли не торопясь.' },
  { id: 'b_walk_06', category: 'walking', rarity: 'uncommon', emoji: '🦢', name: 'Гордый лебедь', flavor: 'Проплыл мимо в парке, полностью игнорируя твоё существование.' },
  { id: 'b_walk_07', category: 'walking', rarity: 'rare', emoji: '🦩', name: 'Заблудший фламинго', flavor: 'Непонятно, откуда взялся в этом районе. Но шёл красиво.' },
  { id: 'b_walk_08', category: 'walking', rarity: 'rare', emoji: '🐢', name: 'Мудрая черепаха', flavor: 'Идёт медленнее тебя, но уже 100 лет как. Уважение.' },
  { id: 'b_walk_09', category: 'walking', rarity: 'legendary', emoji: '🧙', name: 'Вечный Пилигрим', flavor: 'Странник, встречающий только тех, кто прошёл 500 000 шагов за жизнь игры.',
    legendaryCheck: (ctx) => ctx.stepsTotal >= 500000 },

  // ── ПИТАНИЕ (nutrition) — 9 ──────────────────────────────────
  { id: 'b_food_01', category: 'nutrition', rarity: 'common', emoji: '🥦', name: 'Дух брокколи', flavor: 'Явился, чтобы напомнить о клетчатке. Никто не звал.' },
  { id: 'b_food_02', category: 'nutrition', rarity: 'common', emoji: '🍎', name: 'Яблочный страж', flavor: 'Одно яблоко в день — и он у твоей двери.' },
  { id: 'b_food_03', category: 'nutrition', rarity: 'common', emoji: '🥚', name: 'Протеиновый цыплёнок', flavor: 'Вылупился прямо из идеально отмеренной порции белка.' },
  { id: 'b_food_04', category: 'nutrition', rarity: 'common', emoji: '🐝', name: 'Пчела здорового баланса', flavor: 'Опылила твой рацион нотками дисциплины.' },
  { id: 'b_food_05', category: 'nutrition', rarity: 'uncommon', emoji: '🦉', name: 'Сова подсчёта калорий', flavor: 'Совершенно неусыпно следит за размером порций.' },
  { id: 'b_food_06', category: 'nutrition', rarity: 'uncommon', emoji: '🐍', name: 'Змей искушения (побеждённый)', flavor: 'Предлагал шаурму в 23:00. Ты отказался. Он зауважал.' },
  { id: 'b_food_07', category: 'nutrition', rarity: 'rare', emoji: '🐉', name: 'Дракон дисциплины', flavor: 'Появляется, когда норма калорий соблюдена третью неделю подряд.' },
  { id: 'b_food_08', category: 'nutrition', rarity: 'rare', emoji: '🦚', name: 'Павлин баланса БЖУ', flavor: 'Распустил хвост в честь идеально сбалансированного дня.' },
  { id: 'b_food_09', category: 'nutrition', rarity: 'legendary', emoji: '👨‍🍳', name: 'Шеф Абсолют', flavor: 'Величайший шеф вселенной. Готовит только для тех, кто держит норму 30 дней подряд.',
    legendaryCheck: (ctx) => ctx.nutritionNormStreakBest >= 30 },

  // ── СОН (sleep) — 9 ──────────────────────────────────────────
  { id: 'b_sleep_01', category: 'sleep', rarity: 'common', emoji: '🦉', name: 'Сонная сова', flavor: 'Одобрительно моргнула, увидев, что ты лёг вовремя.' },
  { id: 'b_sleep_02', category: 'sleep', rarity: 'common', emoji: '🐨', name: 'Коала-эксперт', flavor: '22 часа сна в сутки — и он всё равно жаловался, что мало.' },
  { id: 'b_sleep_03', category: 'sleep', rarity: 'common', emoji: '🐑', name: 'Овца-счётчик', flavor: 'Пришла помогать засыпать. Насчитала до трёх и уснула первой.' },
  { id: 'b_sleep_04', category: 'sleep', rarity: 'common', emoji: '🦇', name: 'Летучая мышь-полуночник', flavor: 'Одобряет любой сон, лишь бы не при свете дня.' },
  { id: 'b_sleep_05', category: 'sleep', rarity: 'uncommon', emoji: '🐻', name: 'Медведь-соня', flavor: 'Впал в спячку прямо рядом с твоей кроватью. Компания.' },
  { id: 'b_sleep_06', category: 'sleep', rarity: 'uncommon', emoji: '🌙', name: 'Дух лунного света', flavor: 'Приходит только к тем, кто ложится до полуночи.' },
  { id: 'b_sleep_07', category: 'sleep', rarity: 'rare', emoji: '🦥', name: 'Ленивец-мудрец', flavor: 'Двигается медленно, спит правильно. Живой пример для подражания.' },
  { id: 'b_sleep_08', category: 'sleep', rarity: 'rare', emoji: '⭐', name: 'Звёздный страж сна', flavor: 'Считает овец лучше тебя. Не признаётся в этом вслух.' },
  { id: 'b_sleep_09', category: 'sleep', rarity: 'legendary', emoji: '🌌', name: 'Хранитель Ночи', flavor: 'Хозяин снов, являющийся тем, кто держит идеальный сон 30 дней подряд.',
    legendaryCheck: (ctx) => ctx.sleepQualityStreakBest >= 30 },

  // ── ЧТЕНИЕ (reading) — 9 ──────────────────────────────────────
  { id: 'b_read_01', category: 'reading', rarity: 'common', emoji: '🐛', name: 'Книжный червь', flavor: 'В буквальном смысле живёт в переплёте. Соседствует мирно.' },
  { id: 'b_read_02', category: 'reading', rarity: 'common', emoji: '🦉', name: 'Сова-библиотекарь', flavor: 'Шикнула, когда ты перелистнул страницу слишком громко.' },
  { id: 'b_read_03', category: 'reading', rarity: 'common', emoji: '🐭', name: 'Мышь-закладка', flavor: 'Устроилась между страницами. Теперь это её дом.' },
  { id: 'b_read_04', category: 'reading', rarity: 'common', emoji: '🕷️', name: 'Паук-полка', flavor: 'Плетёт паутину между твоими книгами. Тоже своего рода библиотека.' },
  { id: 'b_read_05', category: 'reading', rarity: 'uncommon', emoji: '🦊', name: 'Лис-рассказчик', flavor: 'Знает все сюжетные повороты заранее. Молчит из вежливости.' },
  { id: 'b_read_06', category: 'reading', rarity: 'uncommon', emoji: '🐦‍⬛', name: 'Ворон-хранитель знаний', flavor: 'Сидит на верхней полке. Иногда роняет книги. Со смыслом.' },
  { id: 'b_read_07', category: 'reading', rarity: 'rare', emoji: '🦉', name: 'Мудрая сипуха', flavor: 'Прочитала больше тебя. Не хвастается, но всем видом намекает.' },
  { id: 'b_read_08', category: 'reading', rarity: 'rare', emoji: '📖', name: 'Дух забытой библиотеки', flavor: 'Появляется только рядом с действительно старыми и толстыми книгами.' },
  { id: 'b_read_09', category: 'reading', rarity: 'legendary', emoji: '🧠', name: 'Великий Библиотекарь', flavor: 'Хранитель всех прочитанных страниц. Является тем, кто одолел 1000 страниц.',
    legendaryCheck: (ctx) => ctx.totalReadingPages >= 1000 },

  // ── КАЛОРИИ (calories) — 8 ──────────────────────────────────
  { id: 'b_cal_01', category: 'calories', rarity: 'common', emoji: '🔥', name: 'Искра метаболизма', flavor: 'Маленькая, но упорная. Горит с самого разогрева.' },
  { id: 'b_cal_02', category: 'calories', rarity: 'common', emoji: '🌶️', name: 'Дух жгучего перца', flavor: 'Появился после особенно интенсивной тренировки. Щиплет глаза.' },
  { id: 'b_cal_03', category: 'calories', rarity: 'common', emoji: '💧', name: 'Капля честного пота', flavor: 'Заслуженная. Ничем не измерить, кроме как этим существом.' },
  { id: 'b_cal_04', category: 'calories', rarity: 'uncommon', emoji: '🔥', name: 'Костёр выносливости', flavor: 'Разгорелся на пятой минуте интервалов и не думает гаснуть.' },
  { id: 'b_cal_05', category: 'calories', rarity: 'uncommon', emoji: '⚡', name: 'Электрический разряд', flavor: 'Пробежал по мышцам в момент, когда ты думал, что уже всё.' },
  { id: 'b_cal_06', category: 'calories', rarity: 'rare', emoji: '🌋', name: 'Дремлющий вулкан формы', flavor: 'Просыпается только на действительно тяжёлых тренировках.' },
  { id: 'b_cal_07', category: 'calories', rarity: 'rare', emoji: '☄️', name: 'Метеор сожжённых калорий', flavor: 'Влетел в атмосферу твоего дня и не оставил и следа лишнего веса.' },
  { id: 'b_cal_08', category: 'calories', rarity: 'legendary', emoji: '🦅', name: 'Пепельный Феникс', flavor: 'Возрождается из пепла тренировки, где сожжено 10 000 ккал за день.',
    legendaryCheck: (ctx) => ctx.calBestDay >= 10000 },
];

export const BESTIARY_ACHIEVEMENTS = [
  { id: 'bestiary_first', title: 'Первый контакт', description: 'Встреть первое существо', need: 1, kind: 'total' },
  { id: 'bestiary_10', title: 'Юный натуралист', description: 'Встреть 10 существ', need: 10, kind: 'total' },
  { id: 'bestiary_25', title: 'Знаток фауны', description: 'Встреть 25 существ', need: 25, kind: 'total' },
  { id: 'bestiary_50', title: 'Мастер-зоолог', description: 'Встреть 50 существ', need: 50, kind: 'total' },
  { id: 'bestiary_full', title: 'Коллекция полна', description: 'Собери всех 73 существ', need: 73, kind: 'total', mythic: true },
  { id: 'bestiary_legends', title: 'Охотник за легендами', description: 'Собери всех 8 легендарных существ', need: 8, kind: 'legends', secret: true },
  { id: 'bestiary_variety', title: 'Разнообразие видов', description: 'Хотя бы 1 существо из каждой категории', need: 8, kind: 'categories' },
];


export const RECORD_CATEGORIES = [
  { id: 'run_max_km', group: 'Бег', label: 'Самый длинный забег', unit: 'км', icon: '🏃' },
  { id: 'run_total_km', group: 'Бег', label: 'Набегано всего', unit: 'км', icon: '🏃' },
  { id: 'run_best_streak', group: 'Бег', label: 'Лучшая серия', unit: 'дней подряд', icon: '🔥' },
  { id: 'strength_total', group: 'Силовые', label: 'Тренировок всего', unit: '', icon: '💪' },
  { id: 'strength_best_streak', group: 'Силовые', label: 'Лучшая серия', unit: 'дней подряд', icon: '🔥' },
  { id: 'wrestling_total', group: 'Борьба', label: 'Схваток всего', unit: '', icon: '🥊' },
  { id: 'wrestling_best_streak', group: 'Борьба', label: 'Лучшая серия', unit: 'дней подряд', icon: '🔥' },
  { id: 'steps_max_day', group: 'Шаги', label: 'Больше всего за день', unit: 'шагов', icon: '👟' },
  { id: 'steps_best_streak_5k', group: 'Шаги', label: 'Серия 5000+ шагов', unit: 'дней подряд', icon: '🔥' },
  { id: 'sleep_best_streak_quality', group: 'Сон', label: 'Серия качественного сна', unit: 'дней подряд', icon: '😴' },
  { id: 'nutrition_best_streak_norm', group: 'Питание', label: 'Серия «в норме»', unit: 'дней подряд', icon: '🥗' },
  { id: 'nutrition_best_streak_nosugar', group: 'Питание', label: 'Серия «без сахара»', unit: 'дней подряд', icon: '🍬' },
  { id: 'reading_max_day', group: 'Чтение', label: 'Больше всего за день', unit: 'стр.', icon: '📖' },
  { id: 'reading_total_pages', group: 'Чтение', label: 'Прочитано всего', unit: 'стр.', icon: '📖' },
  { id: 'reading_best_streak', group: 'Чтение', label: 'Лучшая серия', unit: 'дней подряд', icon: '🔥' },
  { id: 'calories_max_day', group: 'Калории', label: 'Больше всего за день', unit: 'ккал', icon: '🔥' },
  { id: 'calories_total', group: 'Калории', label: 'Сожжено всего', unit: 'ккал', icon: '🔥' },
  { id: 'overall_max_activities_day', group: 'Общее', label: 'Активностей за день', unit: '', icon: '📊' },
  { id: 'overall_best_any_streak', group: 'Общее', label: 'Общая серия', unit: 'дней подряд', icon: '🔥' },
  { id: 'raids_won', group: 'Общее', label: 'Рейдов выиграно', unit: '', icon: '⚔️' },
  { id: 'challenges_completed', group: 'Общее', label: 'Клятв исполнено', unit: '', icon: '📜' },
];

