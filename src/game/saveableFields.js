// ---------- SAVEABLE FIELDS: единый источник правды по полям игрока ----------
// Раньше список из 48 сохраняемых полей был вручную продублирован в 3-4 местах:
// stateRef, buildSnapshot, хидратация при логине, select-список гильдии.
// Забытое здесь поле означало "тихо не сохраняется" или "тихо не подтягивается
// после логина" — без единой ошибки в консоли.
//
// Теперь buildSnapshot() и хидратация в selectNickname() генерируются из этого
// списка автоматически. Чтобы добавить новое сохраняемое поле:
//   1. useState в AppInner (как и раньше — неизбежно для React)
//   2. одна строка в stateRef.current = {...} (как и раньше — там же лежат остальные)
//   3. одна строка в fieldSetters (рядом со stateRef)
//   4. одна строка в этом файле — { key, column, guildVisible }
// buildSnapshot, хидратация и select для гильдии обновятся сами.
//
// guildVisible: true  — колонка попадает в select для вкладки "Гильдия"
//               false — приватное поле игрока (валюта, щиты, состояние челленджей и т.д.),
//               остальным игрокам не показывается вообще.
export const SAVEABLE_FIELDS = [
  { key: 'characterName',               column: 'character_name',            guildVisible: true },
  { key: 'logs',                        column: 'logs',                      guildVisible: true },
  { key: 'passiveLogs',                 column: 'passive_logs',              guildVisible: true },
  { key: 'recoveryLogs',                column: 'recovery_logs',             guildVisible: true },
  { key: 'books',                       column: 'books',                     guildVisible: true },
  { key: 'spentCurrency',               column: 'spent_currency',            guildVisible: false },
  { key: 'purchasedItemIds',            column: 'purchased_item_ids',        guildVisible: true },
  { key: 'equippedShopItems',           column: 'equipped_shop_items',       guildVisible: true },
  { key: 'activeTitle',                 column: 'active_title',              guildVisible: true },
  { key: 'lockedClassId',               column: 'locked_class_id',           guildVisible: true },
  { key: 'chosenPathId',                column: 'chosen_path_id',            guildVisible: true },
  { key: 'unlockedSkillLevels',         column: 'unlocked_skill_levels',     guildVisible: true },
  { key: 'classChoiceMode',             column: 'class_choice_mode',         guildVisible: true },
  { key: 'comboClassId',                column: 'combo_class_id',            guildVisible: true },
  { key: 'comboPathId',                 column: 'combo_path_id',             guildVisible: true },
  { key: 'unlockedComboSkillLevels',    column: 'unlocked_combo_skill_levels', guildVisible: true },
  { key: 'specPathId',                  column: 'spec_path_id',              guildVisible: true },
  { key: 'unlockedSpecSkillLevels',     column: 'unlocked_spec_skill_levels', guildVisible: true },
  { key: 'guildLikes',                  column: 'likes',                     guildVisible: true },
  { key: 'lastLoginDate',               column: 'last_login_date',           guildVisible: false },
  { key: 'loginStreak',                 column: 'login_streak',              guildVisible: false },
  { key: 'morningRitualLog',            column: 'morning_ritual_log',        guildVisible: false },
  { key: 'equippedAvatarFrame',         column: 'equipped_avatar_frame',     guildVisible: true },
  { key: 'purchasedFrameIds',           column: 'purchased_frame_ids',       guildVisible: false },
  { key: 'avatarEmoji',                 column: 'avatar_emoji',              guildVisible: true },
  { key: 'challengeState',              column: 'challenge_state',           guildVisible: true },
  { key: 'roadStoryState',              column: 'road_story_state',          guildVisible: false },
  { key: 'raidShields',                 column: 'raid_shields',              guildVisible: false },
  { key: 'shopShields',                 column: 'shop_shields',              guildVisible: false },
  { key: 'lastShopShieldUse',           column: 'last_shop_shield_use',      guildVisible: false },
  { key: 'lastRaidShieldUse',           column: 'last_raid_shield_use',      guildVisible: false },
  { key: 'raidArchive',                 column: 'raid_archive',              guildVisible: false },
  { key: 'unomieDebuff',                column: 'unomie_debuff',             guildVisible: false },
  { key: 'personalRecords',             column: 'personal_records',          guildVisible: true },
  { key: 'recordsBroken',               column: 'records_broken',            guildVisible: false },
  { key: 'bestiary',                    column: 'bestiary',                  guildVisible: true },
  { key: 'lastBestiaryEventDate',       column: 'last_bestiary_event_date',  guildVisible: false },
  { key: 'horseshoeActive',             column: 'horseshoe_active',          guildVisible: false },
  { key: 'mapActive',                   column: 'map_active',                guildVisible: false },
  { key: 'scrollActive',                column: 'scroll_active',             guildVisible: false },
  { key: 'ownedBackgrounds',            column: 'owned_backgrounds',         guildVisible: false },
  { key: 'activeBackground',            column: 'active_background',         guildVisible: true },
  { key: 'polishedItemIds',             column: 'polished_item_ids',         guildVisible: false },
  { key: 'itemBonusOverrides',          column: 'item_bonus_overrides',      guildVisible: false },
  { key: 'secondChallengeSlotUnlocked', column: 'second_challenge_slot',     guildVisible: false },
  { key: 'activeChallenge2',            column: 'active_challenge2',         guildVisible: false },
  // NB: сейчас НЕ входит в select для гильдии в текущем коде (возможно, недосмотр —
  // щит логично было бы видно у других игроков). Оставлено guildVisible: false,
  // чтобы этот шаг не менял поведение. Если это баг — скажи, включу в один клик.
  { key: 'activeShield',                column: 'active_shield',             guildVisible: false },
  { key: 'consumableLog',               column: 'consumable_log',            guildVisible: true },
  // Прогресс сбора сета лута с повторяемых rare/epic рейдов: { [bossId]: [полученные itemId] }.
  // Не привязан к конкретному инстансу рейда (те удаляются после закрытия) — растёт с каждой
  // новой победой, пока сет не соберётся полностью.
  { key: 'raidSetProgress',             column: 'raid_set_progress',         guildVisible: false },
];
