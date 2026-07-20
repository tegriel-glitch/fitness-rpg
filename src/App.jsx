import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Flame, Dumbbell, Salad, Moon, BookOpen, Swords, Trophy, Plus, X, Sparkles, TrendingUp, Calendar, ChevronDown, Zap, Heart, Brain, FlaskConical, Check, Lock, Footprints, HeartHandshake, Shield, Star, Crown, Gem, Skull, Pencil, Medal, Scale, Gauge, ShoppingBag, Mail } from 'lucide-react';

import { sbFetch, dbLoadPlayer, dbCreatePlayer, dbSavePlayer, dbLoadGuildMembers } from './lib/supabaseClient';
import { dbLoadAllRaids, dbSaveRaid, dbDeleteRaid } from './lib/raidsApi';
import { dbLoadMessages, dbSendMessage, dbMarkMessageRead, dbMarkAllRead, dbDeleteMessages, STREAK_WARNING_TEXTS } from './lib/mailApi';

import {
  ACTIVITY_TYPES, INTENSITY_LEVELS, INTENSITY_ACTIVITIES, BASE_STEPS_XP_MULTIPLIER,
  PHYSICAL_HEALTH_SOURCES, MENTAL_HEALTH_SOURCES, RECOVERY_TIER_EFFECTS, RECOVERY_TYPES,
  PASSIVE_TYPES, CHEAT_MEAL_SAFE_INTERVAL_DAYS, POISON_THRESHOLD, POISON_PENALTY_PER_STAT,
} from './game/coreConstants';
import {
  CLASS_XP_BONUS, COMBO_CLASS_XP_BONUS, CHARACTER_CLASSES, COMBO_CLASS_NAMES,
  resolveCharacterClass, CLASS_BY_ACTIVITY, CLASS_PATHS, COMBO_PATHS, SPEC_PATHS,
} from './game/classes';
import { BESTIARY_RARITY_COLORS, BESTIARY_CATALOG, BESTIARY_ACHIEVEMENTS, RECORD_CATEGORIES } from './game/bestiary';
import { ACHIEVEMENTS, SECRET_ACHIEVEMENTS, COMBO_ACHIEVEMENTS, BALANCE_ACHIEVEMENTS } from './game/achievements';
import { MYTHIC_ACHIEVEMENTS } from './game/mythicAchievements';
import {
  CHALLENGE_MIN_LEVEL, CHALLENGE_FAIL_DEBUFF_DAYS, CHALLENGE_FAIL_COOLDOWN_DAYS,
  CHALLENGE_CATEGORIES, CHALLENGE_CATALOG, CHALLENGE_ACHIEVEMENTS,
} from './game/challenges';
import {
  ROAD_EVENT_CHANCE_BY_LEVEL, ROAD_EVENT_PITY_DAYS, ROAD_EVENTS_UNIVERSAL, ROAD_CHAIN_EVENTS,
  ROAD_EVENTS_CLASS, CLASS_ID_TO_EVENT_KEY, ROAD_STORY_ACHIEVEMENTS,
} from './game/roadStories';
import {
  XP_TO_CURRENCY_RATE, PASSIVE_CURRENCY_RATE, SHOP_REFUND_RATE, RARITY_TIERS, SHOP_SLOTS,
  SHOP_ITEMS, PROFILE_BACKGROUNDS, AVATAR_FRAMES, AVATAR_FRAME_RARITY_COLORS, CONSUMABLES,
} from './game/shop';
import {
  RAID_LOOT_BY_CLASS, RAID_LOOT_SHOP_ITEMS, ALL_ITEMS, bonusLabel, RAID_BOSSES,
  RAID_DEFEAT_PENALTY_BY_RARITY, MAX_RAID_SHIELDS, RAID_RARITY_COLORS, TIER_COLORS, ALL_STATS,
} from './game/raidBosses';
import { MORNING_RITUALS } from './game/morningRitual';
import { MAX_LEVEL, totalXpForLevel, levelFromTotalXp, LEVEL_TITLES, titleEntryForLevel } from './game/levelSystem';
import { dateKey, isConsecutiveStreak, computeZeroActivityDays, getWeekKey } from './game/helpers';
import { getAvatarForTitle, getFrameStyle } from './game/guild';
import { AVATAR_EMOJIS, AVATAR_CLASS_PORTRAITS } from './game/avatarIcons';
import { AVATAR_UNLOCKABLES } from './game/avatarUnlockables';
import { SAVEABLE_FIELDS } from './game/saveableFields';

import { styles } from './styles';

// ---------- MAIN APP ----------

const LoginScreen = React.memo(function LoginScreen({ dbLoading, dbError, onLogin }) {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Введи имя'); return; }
    if (trimmed.length < 2) { setError('Минимум 2 символа'); return; }
    if (trimmed.length > 24) { setError('Максимум 24 символа'); return; }
    onLogin(trimmed);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#13131a', padding: '0 24px',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 360, animation: 'fadeUp 0.35s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f0d272', letterSpacing: 0.5 }}>FitnessRPG</div>
          <div style={{ fontSize: 13, color: '#6a6a72', marginTop: 4 }}>Гильдия Новой Эры</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#1a1a24', border: '1.5px solid #2a2a38',
          borderRadius: 16, padding: '24px 20px',
        }}>
          {dbLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #2a2a38', borderTopColor: '#e0a868', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#6a6a72' }}>Загружаем профиль...</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#d0d0da', marginBottom: 6 }}>
                Как тебя зовут?
              </div>
              <div style={{ fontSize: 11, color: '#5a5a6a', marginBottom: 16, lineHeight: 1.5 }}>
                Введи своё имя или игровой псевдоним. При следующем входе ты будешь входить автоматически.
              </div>

              <input
                type="text"
                placeholder="Твоё имя..."
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                maxLength={24}
                style={{
                  width: '100%', background: '#13131a',
                  border: '1.5px solid ' + (error ? '#8a3a3a' : '#2a2a38'),
                  borderRadius: 10, padding: '12px 14px',
                  color: '#f0f0f4', fontSize: 15, fontWeight: 700,
                  outline: 'none', fontFamily: 'inherit',
                  marginBottom: error ? 6 : 14,
                }}
                autoFocus
              />

              {error && (
                <div style={{ fontSize: 11, color: '#e05f4a', marginBottom: 12 }}>{error}</div>
              )}

              {dbError && (
                <div style={{ fontSize: 11, color: '#e05f4a', marginBottom: 12, background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 8, padding: '8px 12px' }}>
                  {dbError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                style={{
                  width: '100%', padding: '13px',
                  background: name.trim() ? 'linear-gradient(135deg, #3a2a10, #2a1e08)' : '#1e1e28',
                  border: '1.5px solid ' + (name.trim() ? '#c08a2a' : '#2a2a38'),
                  borderRadius: 10, cursor: name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 800,
                  color: name.trim() ? '#f0d272' : '#4a4a52',
                  transition: 'all 0.2s',
                }}
              >
                Войти в гильдию →
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10.5, color: '#3a3a42', lineHeight: 1.5 }}>
          Прогресс сохраняется автоматически
        </div>
      </div>
    </div>
  );
});

const NickButton = React.memo(function NickButton({ nick, onSelect, color }) {
  return (
    <button
      onClick={() => onSelect(nick)}
      style={{
        background: '#1c1c25',
        border: `1.5px solid ${color}44`,
        borderRadius: 10, padding: '10px 10px',
        color: '#dcdce2', fontSize: 12.5, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        transition: 'border-color 0.15s, background 0.15s',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color,
      }}>
        ✦
      </div>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>
        {nick.replace(/_/g, ' ')}
      </span>
    </button>
  );
});

function AppInner() {
  const [logs, setLogs] = useState([]);
  const [passiveLogs, setPassiveLogs] = useState([]); // { id, type, date }
  const [recoveryLogs, setRecoveryLogs] = useState([]); // { id, type, date }
  const [books, setBooks] = useState([]); // { id, title, finished, finishedDate }
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formValue, setFormValue] = useState('');
  const [strictSleep, setStrictSleep] = useState(false);
  const [intensity, setIntensity] = useState('medium'); // for strength/wrestling logs
  const [nutritionInNorm, setNutritionInNorm] = useState(false); // nutrition: calories within target
  const [nutritionNoSugar, setNutritionNoSugar] = useState(false); // nutrition: no sugar today
  const [tab, setTab] = useState('dashboard');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [toast, setToast] = useState(null);
  const [characterName, setCharacterName] = useState('Атлет');
  const [spentCurrency, setSpentCurrency] = useState(0);
  const [purchasedItemIds, setPurchasedItemIds] = useState([]);
  const [sellConfirmItem, setSellConfirmItem] = useState(null);
  const [consumableLog, setConsumableLog] = useState([]);
  const [horseshoeActive, setHorseshoeActive] = useState(null); // {expiresDate} | null
  const [mapActive, setMapActive] = useState(null); // {expiresDate} | null
  const [scrollActive, setScrollActive] = useState(null); // {expiresDate, pct} | null
  const [ownedBackgrounds, setOwnedBackgrounds] = useState([]); // ['mountains', ...]
  const [activeBackground, setActiveBackground] = useState(null); // 'mountains' | null
  const [polishedItemIds, setPolishedItemIds] = useState([]); // ['shop_common_...', ...] — +3% к бонусу, один раз на предмет
  const [itemBonusOverrides, setItemBonusOverrides] = useState({}); // {itemId: bonusObject} — от "Перековки"
  const [lastLoginDate, setLastLoginDate] = useState(null);
  const [loginStreak, setLoginStreak] = useState(0);
  const [morningRitualLog, setMorningRitualLog] = useState([]); // [{date, ritualId}]
  const [ritualXpBonus, setRitualXpBonus] = useState(0); // 0.05 if ritual done today // [{id, date, type}]
  const [activeShield, setActiveShield] = useState(null); // {date} or null
  const [shopShields, setShopShields] = useState(0); // bought but not yet activated
  const [lastShopShieldUse, setLastShopShieldUse] = useState(null); // ISO date of last shop shield activation
  const [lastRaidShieldUse, setLastRaidShieldUse] = useState(null); // ISO date of last raid shield activation
  const [equippedAvatarFrame, setEquippedAvatarFrame] = useState(null); // frame id or null
  const [purchasedFrameIds, setPurchasedFrameIds] = useState([]); // bought avatar frames
  const [avatarEmoji, setAvatarEmoji] = useState(null); // chosen emoji avatar id, e.g. 'wolf'
  const [equippedShopItems, setEquippedShopItems] = useState({ head: null, body: null, accessory: null, legs: null, hands: null, weapon: null });

  // --- Challenges: "Испытание духа" ---
  // challengeState: { active: {id, startDate} | null, completed: [{id, completedDate, perfectDays}], failed: [{id, failedDate}], activeBuff: {name, xpBonusPct, scope, expiresDate} | null }
  const [challengeState, setChallengeState] = useState({ active: null, completed: [], failed: [], activeBuff: null });
  const [secondChallengeSlotUnlocked, setSecondChallengeSlotUnlocked] = useState(false);
  const [activeChallenge2, setActiveChallenge2] = useState(null); // {id, startDate} | null — независимый второй слот

  // --- Road Stories: "Дорожные истории" ---
  // roadStoryState: { lastEventDate, totalEvents, totalRares, acceptedDeals, rejectedStreak, pendingRewards: [{type, value, date}], activeBuffs: [{name, xpBonusPct, scope, expiresDate}] }
  const [roadStoryState, setRoadStoryState] = useState({
    lastEventDate: null, totalEvents: 0, totalRares: 0, acceptedDeals: 0, rejectedStreak: 0,
    pendingRewards: [], activeBuffs: [],
    logsCountDate: null, logsToday: 0, pendingEvents: [], dilemmaCount: 0, chainsCompleted: 0,
  });
  const [activeRoadEvent, setActiveRoadEvent] = useState(null);
  const [raidShields, setRaidShields] = useState(0);
  // raidArchive: [{bossId, bossName, bossCreature, bossRarity, result:'victory'|'defeat', participants:[], date, lootName}]
  const [raidArchive, setRaidArchive] = useState([]);

  // ---------- Стена подвигов (Партия B) ----------
  const [personalRecords, setPersonalRecords] = useState({}); // {categoryId: {value, date}}
  const [recordsBroken, setRecordsBroken] = useState(0);
  const [recordModalQueue, setRecordModalQueue] = useState([]); // [{label, icon, unit, prevValue, newValue, diff}]
  const [showRecordsWall, setShowRecordsWall] = useState(false);

  // ---------- Бестиарий (Партия D) ----------
  const [bestiary, setBestiary] = useState([]); // [creatureId, ...]
  const [activeBestiaryEncounter, setActiveBestiaryEncounter] = useState(null); // creature object | null
  const [lastBestiaryEventDate, setLastBestiaryEventDate] = useState(null); // дневной лимит — максимум 1 существо в день
  // unomieDebuff: {expiresDate: ISO, xpPenaltyExpiresDate: ISO, xpPenaltyPct: 10} | null
  const [unomieDebuff, setUnomieDebuff] = useState(null);
  const [mailMessages, setMailMessages] = useState([]);
  const [showMailModal, setShowMailModal] = useState(false); // рейдовые щиты (drop from raids) // event being shown in modal

  // raids: { [raidId]: { status: 'active'|'victory'|'defeat', startDate, startClassId, participants: [{name}], contributions: [{participantName, date, activity, value}], defeatPenaltyApplied } }
  const [raids, setRaids] = useState({});
  const [activeTitle, setActiveTitle] = useState(null);
  const [lastTitleChangeDate, setLastTitleChangeDate] = useState(null);

  function changeTitle(newTitle) {
    const now = new Date();
    if (lastTitleChangeDate) {
      const daysSince = Math.floor((now - new Date(lastTitleChangeDate)) / (1000 * 60 * 60 * 24));
      if (daysSince < 3) return false;
    }
    setActiveTitle(newTitle);
    setLastTitleChangeDate(now.toISOString());
    return true;
  }

  function titleCooldownDays() {
    if (!lastTitleChangeDate) return 0;
    const daysSince = Math.floor((new Date() - new Date(lastTitleChangeDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, 3 - daysSince);
  }
  // Class progression
  const [lockedClassId, setLockedClassId] = useState(null);   // set at level 10
  const [chosenPathId, setChosenPathId]   = useState(null);   // which branch chosen
  const [unlockedSkillLevels, setUnlockedSkillLevels] = useState([]); // [10, 15, …] unlocked tiers // null = use level title

  // ---------- Комбо-пути / Специализация (Партия B) ----------
  // classChoiceMode: 'combo' | 'pure' | null — что выбрано на 20 лвл (выбор постоянный)
  const [classChoiceMode, setClassChoiceMode] = useState(null);
  const [comboClassId, setComboClassId] = useState(null); // 'berserker|pathfinder', и т.п.
  const [comboPathId, setComboPathId] = useState(null); // id комбо-пути (всегда 1 на комбо-класс)
  const [unlockedComboSkillLevels, setUnlockedComboSkillLevels] = useState([]); // [20, 25, 30, 35, 40]
  const [specPathId, setSpecPathId] = useState(null); // id пути специализации, если выбран «чистый класс»
  const [unlockedSpecSkillLevels, setUnlockedSpecSkillLevels] = useState([]); // [20, 25, 30, 35, 40]

  // ---------- Движок эффектов скиллов (Партия A) ----------
  // Собирает effect-объекты всех разблокированных скиллов основного пути.
  // Комбо/спец-пути (Партии B/C) добавятся сюда же отдельными блоками позже.
  const activeSkillEffects = useMemo(() => {
    const effects = [];
    if (lockedClassId && chosenPathId) {
      const path = (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId);
      path?.skills.forEach(s => {
        if (unlockedSkillLevels.includes(s.level) && s.effect) effects.push(s.effect);
      });
    }
    // Комбо-путь (skills пока пустые — наполняются в Партии C)
    if (comboClassId && COMBO_PATHS[comboClassId]) {
      COMBO_PATHS[comboClassId].skills.forEach(s => {
        if (unlockedComboSkillLevels.includes(s.level) && s.effect) effects.push(s.effect);
      });
    }
    // Путь специализации (skills пока пустые — наполняются в Партии C)
    if (specPathId && lockedClassId && SPEC_PATHS[lockedClassId]) {
      SPEC_PATHS[lockedClassId].skills.forEach(s => {
        if (unlockedSpecSkillLevels.includes(s.level) && s.effect) effects.push(s.effect);
      });
    }
    return effects;
  }, [lockedClassId, chosenPathId, unlockedSkillLevels, comboClassId, unlockedComboSkillLevels, specPathId, unlockedSpecSkillLevels]);

  function effectsByType(type) {
    return activeSkillEffects.filter(e => e.type === type);
  }

  // Guild / login / DB sync
  const [selectedNickname, setSelectedNickname] = useState(null); // always loaded from DB via selectNickname
  const [guildLikes, setGuildLikes] = useState({});
  const [dbLoading, setDbLoading] = useState(!!localStorage.getItem('rpg_nickname')); // true if auto-login pending
  const [dbError, setDbError] = useState(null);
  const [guildMembers, setGuildMembers] = useState([]); // live data from DB
  const saveTimerRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'pending' | 'saving' | 'ok' | 'error'
  const saveStatusTimerRef = useRef(null);

  // Build a full snapshot of all saveable state
  // Keep a ref to the latest state so debounced save always gets fresh values
  const stateRef = useRef({});
  const pendingLogSideEffects = useRef(null); // {logId, bestiaryTimer, roadTimer, raidContribs: [{bossId, contribId}]}
  const levelRef = useRef(1); // обновляется из levelState, читается в buildSnapshot
  const prevLevelRef = useRef(null);      // для уведомления о повышении уровня
  const prevAchievRef = useRef(null);     // для уведомления о новых ачивках
  const prevStreaksRef = useRef(null);    // для уведомления о прерванном стрике
  const recordsInitRef = useRef(false);   // Стена подвигов: первый прогон после логина — бэкафилл без модалок
  useEffect(() => {
    stateRef.current = {
      characterName, logs, passiveLogs, recoveryLogs, books,
      spentCurrency, purchasedItemIds, equippedShopItems,
      activeTitle, lockedClassId, chosenPathId, unlockedSkillLevels,
      classChoiceMode, comboClassId, comboPathId, unlockedComboSkillLevels, specPathId, unlockedSpecSkillLevels,
      guildLikes, lastLoginDate, loginStreak, morningRitualLog, equippedAvatarFrame, purchasedFrameIds, avatarEmoji,
      challengeState,
      roadStoryState,
      raidShields,
      shopShields,
      lastShopShieldUse,
      lastRaidShieldUse,
      raidArchive,
      unomieDebuff,
      personalRecords,
      recordsBroken,
      bestiary,
      lastBestiaryEventDate,
      horseshoeActive,
      mapActive,
      scrollActive,
      ownedBackgrounds,
      activeBackground,
      polishedItemIds,
      itemBonusOverrides,
      secondChallengeSlotUnlocked,
      activeChallenge2,
      activeShield,
      consumableLog,
    };
  });

  // Единая карта сеттеров по ключу поля — используется для генерируемой хидратации
  // в selectNickname(). Список полей и сеттер для каждого держатся тут же, рядом
  // со stateRef.current выше — это единственное место, где нужно перечислить сеттеры
  // руками (React setState-функции нельзя получить по динамическому имени строки).
  // Сами сеттеры стабильны между рендерами, поэтому пустой массив зависимостей безопасен.
  const fieldSetters = useMemo(() => ({
    characterName: setCharacterName, logs: setLogs, passiveLogs: setPassiveLogs, recoveryLogs: setRecoveryLogs, books: setBooks,
    spentCurrency: setSpentCurrency, purchasedItemIds: setPurchasedItemIds, equippedShopItems: setEquippedShopItems,
    activeTitle: setActiveTitle, lockedClassId: setLockedClassId, chosenPathId: setChosenPathId, unlockedSkillLevels: setUnlockedSkillLevels,
    classChoiceMode: setClassChoiceMode, comboClassId: setComboClassId, comboPathId: setComboPathId, unlockedComboSkillLevels: setUnlockedComboSkillLevels,
    specPathId: setSpecPathId, unlockedSpecSkillLevels: setUnlockedSpecSkillLevels,
    guildLikes: setGuildLikes, lastLoginDate: setLastLoginDate, loginStreak: setLoginStreak, morningRitualLog: setMorningRitualLog,
    equippedAvatarFrame: setEquippedAvatarFrame, purchasedFrameIds: setPurchasedFrameIds, avatarEmoji: setAvatarEmoji,
    challengeState: setChallengeState, roadStoryState: setRoadStoryState, raidShields: setRaidShields, shopShields: setShopShields,
    lastShopShieldUse: setLastShopShieldUse, lastRaidShieldUse: setLastRaidShieldUse, raidArchive: setRaidArchive, unomieDebuff: setUnomieDebuff,
    personalRecords: setPersonalRecords, recordsBroken: setRecordsBroken, bestiary: setBestiary, lastBestiaryEventDate: setLastBestiaryEventDate,
    horseshoeActive: setHorseshoeActive, mapActive: setMapActive, scrollActive: setScrollActive, ownedBackgrounds: setOwnedBackgrounds,
    activeBackground: setActiveBackground, polishedItemIds: setPolishedItemIds, itemBonusOverrides: setItemBonusOverrides,
    secondChallengeSlotUnlocked: setSecondChallengeSlotUnlocked, activeChallenge2: setActiveChallenge2, activeShield: setActiveShield,
    consumableLog: setConsumableLog,
  }), []);

  // buildSnapshot генерируется из SAVEABLE_FIELDS (game/saveableFields.js) —
  // раньше это был список из 48 строк вручную, теперь любое новое поле добавляется
  // только там, и здесь ничего трогать не нужно.
  function buildSnapshot(overrides = {}) {
    const s = stateRef.current;
    const snap = {};
    for (const f of SAVEABLE_FIELDS) snap[f.column] = s[f.key];
    snap.current_level = levelRef.current || 1;
    return { ...snap, ...overrides };
  }

  // Debounced save — fires 1.5s after the last state change
  const nicknameRef = useRef(null);
  useEffect(() => { nicknameRef.current = selectedNickname; }, [selectedNickname]);

  function scheduleSave(overrides = {}) {
    if (!nicknameRef.current) return;
    setSaveStatus('pending');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!nicknameRef.current) return;
      setSaveStatus('saving');
      const snap = buildSnapshot(overrides);
      const logCount = (snap.logs || []).length;
      const ok = await dbSavePlayer(nicknameRef.current, snap);
      if (!ok) {
        setSaveStatus('error');
      } else {
        setSaveStatus('ok');
        // Верификация: перечитываем из БД и сравниваем кол-во логов
        try {
          const vRow = await dbLoadPlayer(nicknameRef.current);
          const vLogs = (vRow?.logs || []).length;
          if (vLogs !== logCount) {
            console.error('[save] ⚠ VERIFY MISMATCH: saved', logCount, 'logs, DB has', vLogs);
            setSaveStatus('error');
          }
        } catch (_) {}
      }
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 4000);
    }, 1500);
  }

  // Страховка: если вкладку закрывают/обновляют/сворачивают до того, как сработал отложенный
  // save (1.5с из scheduleSave), последнее действие (покупка, экипировка и т.п.) иначе потеряется.
  // Дожимаем сохранение сразу, как только страница уходит из фокуса или закрывается.
  // pagehide — надёжнее beforeunload на iOS Safari (beforeunload не всегда срабатывает).
  useEffect(() => {
    function flushPendingSave() {
      if (saveTimerRef.current && nicknameRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        console.log('[FitnessRPG] flushing on unload…', nicknameRef.current);
        dbSavePlayer(nicknameRef.current, buildSnapshot(), { keepalive: true });
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flushPendingSave();
    }
    window.addEventListener('beforeunload', flushPendingSave);
    window.addEventListener('pagehide', flushPendingSave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flushPendingSave);
      window.removeEventListener('pagehide', flushPendingSave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Load or create player on login, hydrate all state from DB
  async function selectNickname(nick) {
    setDbLoading(true);
    setDbError(null);
    try {
      let row = await dbLoadPlayer(nick);
      // New player registration — check if nickname is taken by someone with a character_name set
      // (character_name is set on first real login, so a bare row without it = our own prior stub)
      if (!row) {
        // Check all players for this nickname (case-insensitive approximate guard)
        const res = await sbFetch(`players?nickname=ilike.${encodeURIComponent(nick)}&select=nickname,character_name&limit=5`);
        if (res.ok) {
          const existing = await res.json();
          const conflict = existing.find(r => r.nickname.toLowerCase() === nick.toLowerCase() && r.character_name);
          if (conflict) {
            setDbError('Этот никнейм уже занят — выбери другой');
            setDbLoading(false);
            return;
          }
        }
        row = await dbCreatePlayer(nick);
      }
      if (!row) throw new Error('Не удалось создать профиль');

      // Hydrate state from DB row — генерируется из SAVEABLE_FIELDS (game/saveableFields.js).
      // Раньше это был список из 48 строк вручную; теперь новое поле добавляется
      // только в SAVEABLE_FIELDS + fieldSetters, и здесь ничего трогать не нужно.
      for (const f of SAVEABLE_FIELDS) {
        const v = row[f.column];
        if (v != null) fieldSetters[f.key](v);
      }
      // Защита от рассинхрона: если путь выбран (chosen_path_id), а базовый класс
      // не зафиксирован (locked_class_id == null) — класс "потерялся" из-за гонки
      // сохранений (например, несколько вкладок/устройств). Восстанавливаем класс
      // по тому, какому классу принадлежит выбранный путь, и досохраняем это в БД.
      if (row.chosen_path_id != null && row.locked_class_id == null) {
        const healedClassId = Object.keys(CLASS_PATHS).find(
          (clsId) => (CLASS_PATHS[clsId] || []).some((p) => p.id === row.chosen_path_id)
        );
        if (healedClassId) {
          setLockedClassId(healedClassId);
          console.warn('[heal] locked_class_id was null but chosen_path_id existed — restored to', healedClassId);
          setTimeout(() => dbSavePlayer(nick, { locked_class_id: healedClassId }), 500);
        }
      }

      // If first login (no character_name yet) set it from nick
      if (!row.character_name) setCharacterName(nick);

      setSelectedNickname(nick);
      localStorage.setItem('rpg_nickname', nick);
      if (!row.character_name) localStorage.setItem('rpg_character_name', nick);

      // Raids are shared guild-wide, not per-player — always load fresh from the shared table
      dbLoadAllRaids().then(setRaids);
      dbLoadMessages(nick).then(setMailMessages);

      // Streak warnings (once per day, evening only)
      const hour = new Date().getHours();
      const warnKey = 'rpg_streak_warn_' + dateKey(new Date());
      if (hour >= 18 && !localStorage.getItem(warnKey) && row.logs) {
        localStorage.setItem(warnKey, '1');
        const todayKey = dateKey(new Date());
        const playerLogs = row.logs || [];
        ['running', 'nutrition', 'sleep', 'reading'].forEach(act => {
          const uniqueDates = [...new Set(playerLogs.filter(l => l.activity === act).map(l => l.date))].sort((a, b) => (a < b ? 1 : -1));
          const streak = isConsecutiveStreak(uniqueDates);
          if (streak < 3) return;
          const hasToday = playerLogs.some(l => l.activity === act && l.date === todayKey);
          if (hasToday) return;
          const texts = STREAK_WARNING_TEXTS[act];
          if (!texts) return;
          dbSendMessage('__system__', nick, texts[Math.floor(Math.random() * texts.length)], 'Внутренний голос', 'streak_warning');
        });
      }

      // Daily login bonus
      const todayKey = dateKey(new Date());
      const storedLastLogin = row.last_login_date || null;
      const storedStreak = row.login_streak || 0;

      if (storedLastLogin !== todayKey) {
        const yesterday = dateKey(new Date(Date.now() - 86400000));
        const newStreak = storedLastLogin === yesterday ? storedStreak + 1 : 1;
        const crystalBonus = newStreak >= 7 && newStreak % 7 === 0 ? 22 : 2; // +2 daily, +20 bonus on every 7th day
        setLastLoginDate(todayKey);
        setLoginStreak(newStreak);
        // Apply crystals by reducing spent_currency (same as buying: crystals = earned - spent)
        const currentSpent = row.spent_currency || 0;
        const newSpent = Math.max(0, currentSpent - crystalBonus);
        setSpentCurrency(newSpent);
        // Save immediately
        await dbSavePlayer(nick, {
          last_login_date: todayKey,
          login_streak: newStreak,
          spent_currency: newSpent,
        });
        const msg = newStreak >= 7 && newStreak % 7 === 0
          ? '🔥 ' + newStreak + ' дней подряд! +20 💎 бонус!'
          : '🌅 +2 💎 за ежедневный вход';
        setTimeout(() => {
          setToast({ text: msg, key: Date.now() });
          setTimeout(() => setToast(null), 3500);
        }, 800);
      }

      // Check if ritual was done today
      const todayRitual = (row.morning_ritual_log || []).find(r => r.date === todayKey);
      if (todayRitual) setRitualXpBonus(0.05);
    } catch (e) {
      setDbError('Ошибка подключения: ' + e.message);
    } finally {
      setDbLoading(false);
    }
  }

  // Refresh guild members every 30s while on guild tab
  const refreshGuild = useCallback(async () => {
    if (!selectedNickname) return;
    try {
      const members = await dbLoadGuildMembers(selectedNickname);
      setGuildMembers(members);
    } catch (_) {}
  }, [selectedNickname]);

  // Raids live in a shared table (visible to the whole guild) — poll periodically so everyone
  // sees the same gathering/active/victory state, not just their own local copy.
  const refreshRaids = useCallback(async () => {
    if (!selectedNickname) return;
    try {
      const fresh = await dbLoadAllRaids();
      setRaids(fresh);
    } catch (_) {}
  }, [selectedNickname]);

  useEffect(() => {
    if (!selectedNickname) return;
    const interval = setInterval(refreshRaids, 12000);
    return () => clearInterval(interval);
  }, [selectedNickname, refreshRaids]);

  function performRitual(ritualId) {
    const today = dateKey(new Date());
    const alreadyDone = morningRitualLog.some(r => r.date === today);
    if (alreadyDone) return;
    const ritual = MORNING_RITUALS.find(r => r.id === ritualId);
    if (!ritual) return;
    const newLog = [...morningRitualLog, { date: today, ritualId }];
    setMorningRitualLog(newLog);
    setRitualXpBonus(0.05);
    setToast({ text: ritual.emoji + ' ' + ritual.name + ' · +5% XP сегодня · +1 ' + ritual.stat, key: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  function buyAvatarFrame(frameId) {
    const frame = AVATAR_FRAMES.find(f => f.id === frameId);
    if (!frame) return;
    if (purchasedFrameIds.includes(frameId)) return;
    // Мифические рамки бесплатны но требуют ачивку — проверяем
    if (frame.requirement?.type === 'mythic') {
      const unlocked = unlockedMythicIds?.includes(frame.requirement.id);
      if (!unlocked) { setToast({ text: '🔒 Нужна мифическая ачивка', key: Date.now() }); setTimeout(() => setToast(null), 2600); return; }
    }
    if (frame.price > 0 && currencyBalance < frame.price) {
      setToast({ text: '💎 Недостаточно кристаллов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    setPurchasedFrameIds([...purchasedFrameIds, frameId]);
    if (frame.price > 0) setSpentCurrency(spentCurrency + frame.price);
    setToast({ text: '🖼 ' + frame.name + ' куплена!', key: Date.now() }); setTimeout(() => setToast(null), 2600);
  }

  function equipAvatarFrame(frameId) {
    setEquippedAvatarFrame(frameId === equippedAvatarFrame ? null : frameId);
  }

  function buyBackground(bgId) {
    const bg = PROFILE_BACKGROUNDS.find(b => b.id === bgId);
    if (!bg) return;
    if (ownedBackgrounds.includes(bgId)) return;
    if (currencyBalance < bg.price) {
      setToast({ text: '💎 Недостаточно кристаллов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    setOwnedBackgrounds([...ownedBackgrounds, bgId]);
    setSpentCurrency(spentCurrency + bg.price);
    setToast({ text: '🖼 Фон «' + bg.name + '» куплен!', key: Date.now() }); setTimeout(() => setToast(null), 2600);
  }

  function equipBackground(bgId) {
    setActiveBackground(bgId === activeBackground ? null : bgId);
  }

  // Полировка/Перековка: эффективный бонус предмета с учётом перековки (замена типа) и полировки (+3%)
  function getEffectiveBonus(item) {
    if (!item?.bonus) return item?.bonus;
    let b = itemBonusOverrides[item.id] || item.bonus;
    if (polishedItemIds.includes(item.id)) {
      b = { ...b };
      if (b.xpBonusPct) b.xpBonusPct = Math.round(b.xpBonusPct * 1.03 * 10) / 10;
      if (b.crystalPct) b.crystalPct = Math.round(b.crystalPct * 1.03 * 10) / 10;
    }
    return b;
  }

  function polishItem(itemId) {
    if (!purchasedItemIds.includes(itemId)) return;
    if (polishedItemIds.includes(itemId)) {
      setToast({ text: 'Уже отполировано', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    if (currencyBalance < 30) {
      setToast({ text: '💎 Недостаточно кристаллов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    setPolishedItemIds([...polishedItemIds, itemId]);
    setSpentCurrency(spentCurrency + 30);
    setToast({ text: '✨ Предмет отполирован (+3% к бонусу)', key: Date.now() }); setTimeout(() => setToast(null), 2600);
  }

  function reforgeItem(itemId) {
    if (!purchasedItemIds.includes(itemId)) return;
    const item = ALL_ITEMS().find(i => i.id === itemId);
    if (!item?.bonus) return;
    if (currencyBalance < 50) {
      setToast({ text: '💎 Недостаточно кристаллов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    // Пул всех бонусов той же редкости (кроме текущего), результат случайный
    const currentBonus = itemBonusOverrides[itemId] || item.bonus;
    const pool = SHOP_ITEMS
      .filter(i => i.rarity === item.rarity && i.bonus && i.id !== itemId)
      .map(i => i.bonus)
      .filter(b => JSON.stringify(b) !== JSON.stringify(currentBonus));
    if (pool.length === 0) {
      setToast({ text: 'Нет доступных вариантов перековки', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    const newBonus = pool[Math.floor(Math.random() * pool.length)];
    setItemBonusOverrides({ ...itemBonusOverrides, [itemId]: newBonus });
    setSpentCurrency(spentCurrency + 50);
    setToast({ text: '🔨 Перековано: ' + bonusLabel(newBonus), key: Date.now() }); setTimeout(() => setToast(null), 3200);
  }

  function undoMorningRitual() {
    const today = dateKey(new Date());
    const now = new Date();
    if (now.getHours() >= 12) return; // после 12 отмена запрещена
    setMorningRitualLog(morningRitualLog.filter(r => r.date !== today));
    setRitualXpBonus(0);
    setToast({ text: '🌄 Утренний ритуал отменён', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function logout() {
    // Критично: перед сбросом локального состояния нужно ДОЖАТЬ любое отложенное сохранение.
    // scheduleSave откладывает запись в БД на 1.5с после последнего изменения — если выйти из
    // аккаунта раньше, чем этот таймер сработает, покупка/экипировка (или любое другое недавнее
    // действие) не попадёт в базу: таймер либо сработает уже после обнуления nicknameRef.current
    // (сохранение тихо пропустится), либо запишет уже сброшенное состояние поверх настоящего.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (nicknameRef.current) {
      dbSavePlayer(nicknameRef.current, buildSnapshot(), { keepalive: true });
    }

    localStorage.removeItem('rpg_nickname');
    localStorage.removeItem('rpg_character_name');
    setSelectedNickname(null);
    // Reset all state to defaults
    setLogs([]); setPassiveLogs([]); setRecoveryLogs([]); setBooks([]);
    setCharacterName('Атлет'); setSpentCurrency(0); setPurchasedItemIds([]);
    setEquippedShopItems({ head: null, body: null, accessory: null, legs: null, hands: null, weapon: null });
    setRaids({}); setActiveTitle(null); setLockedClassId(null);
    setChosenPathId(null); setUnlockedSkillLevels([]); setGuildLikes({});
    setGuildMembers([]); setChallengeState({ active: null, completed: [], failed: [], activeBuff: null });
    setRoadStoryState({
      lastEventDate: null, totalEvents: 0, totalRares: 0, acceptedDeals: 0, rejectedStreak: 0,
      pendingRewards: [], activeBuffs: [],
      logsCountDate: null, logsToday: 0, pendingEvents: [], dilemmaCount: 0, chainsCompleted: 0,
    });
    setRaidShields(0);
    setPersonalRecords({});
    setRecordsBroken(0);
    recordsInitRef.current = false;
    setBestiary([]);
    setLastBestiaryEventDate(null);
    setHorseshoeActive(null);
    setMapActive(null);
    setScrollActive(null);
    setOwnedBackgrounds([]);
    setActiveBackground(null);
    setPolishedItemIds([]);
    setItemBonusOverrides({});
    setSecondChallengeSlotUnlocked(false);
    setActiveChallenge2(null);
    setActiveShield(null);
    setConsumableLog([]);
    setMailMessages([]);
  }

  // ---------- MAIL HANDLERS ----------
  useEffect(() => {
    if (!selectedNickname) return;
    const interval = setInterval(() => { dbLoadMessages(selectedNickname).then(setMailMessages); }, 60000);
    return () => clearInterval(interval);
  }, [selectedNickname]);

  function handleOpenMail() {
    dbLoadMessages(selectedNickname).then(msgs => { setMailMessages(msgs); setShowMailModal(true); });
  }
  function handleMarkRead(msgId) {
    dbMarkMessageRead(msgId);
    setMailMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m));
  }
  function handleMarkAllRead() {
    dbMarkAllRead(selectedNickname);
    setMailMessages(prev => prev.map(m => ({ ...m, read: true })));
  }
  function handleDeleteMessages(ids) {
    dbDeleteMessages(ids);
    setMailMessages(prev => prev.filter(m => !ids.includes(m.id)));
  }
  async function handleSendMessage(toNickname, text) {
    await dbSendMessage(selectedNickname, toNickname, text, characterName);
    setToast({ text: '✉️ Сообщение отправлено!', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  // ---------- DERIVED STATE ----------

  // Auto-login on mount — always load fresh data from DB
  useEffect(() => {
    const saved = localStorage.getItem('rpg_nickname');
    if (saved) {
      selectNickname(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save character name to DB with short debounce (avoid saving mid-typing)
  const nameTimerRef = useRef(null);
  useEffect(() => {
    if (!selectedNickname || !characterName || characterName === 'Атлет') return;
    localStorage.setItem('rpg_character_name', characterName);
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(() => {
      dbSavePlayer(selectedNickname, { character_name: characterName });
    }, 800);
  }, [characterName]);

  // Auto-save whenever any saveable state changes (debounced 1.5s)
  useEffect(() => {
    // stateRef is updated synchronously above, schedule save after state settles
    scheduleSave();
  }, [
    logs, passiveLogs, recoveryLogs, books, characterName,
    spentCurrency, purchasedItemIds, equippedShopItems,
    activeTitle, lockedClassId, chosenPathId, unlockedSkillLevels,
    classChoiceMode, comboClassId, comboPathId, unlockedComboSkillLevels, specPathId, unlockedSpecSkillLevels,
    raids, guildLikes, challengeState,
    avatarEmoji, equippedAvatarFrame, purchasedFrameIds, roadStoryState, raidShields,
    morningRitualLog, shopShields, lastShopShieldUse, lastRaidShieldUse, raidArchive, unomieDebuff,
    personalRecords, recordsBroken, bestiary, lastBestiaryEventDate,
    horseshoeActive, mapActive, scrollActive, ownedBackgrounds, activeBackground, polishedItemIds, itemBonusOverrides,
    secondChallengeSlotUnlocked, activeChallenge2,
    activeShield, consumableLog,
  ]);

  const logsByActivity = useMemo(() => {
    const map = {};
    Object.keys(ACTIVITY_TYPES).forEach((k) => (map[k] = []));
    logs.forEach((l) => map[l.activity]?.push(l));
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.date < b.date ? 1 : -1)));
    return map;
  }, [logs]);

  const zeroActivityDays = useMemo(() => {
    const stepsDatesAbove3k = new Set(
      Object.entries(
        (logsByActivity.walking || []).reduce((acc, l) => {
          const s = Number(l.steps) || 0;
          if (s >= 3000) acc[l.date] = (acc[l.date] || 0) + s;
          return acc;
        }, {})
      ).filter(([, v]) => v >= 3000).map(([d]) => d)
    );
    // Shield days also break apathy — treat them as "activity present"
    const shieldDates = new Set(passiveLogs.filter(p => p.type === 'streak_shield').map(p => p.date));
    const combined = new Set([...stepsDatesAbove3k, ...shieldDates]);
    return computeZeroActivityDays(logs.map((l) => l.date), combined);
  }, [logs, logsByActivity, passiveLogs]);

  // Cheat meals are fine if spaced 14+ days apart; a cheat meal sooner than that breaks the nutrition streak.
  const violatingCheatMealDays = useMemo(() => {
    const cheatDates = [...new Set(passiveLogs.filter((p) => p.type === 'cheat_meal').map((p) => p.date))].sort();
    const result = new Set();
    let lastSafeDate = null;
    cheatDates.forEach((d) => {
      if (lastSafeDate) {
        const diffDays = (new Date(d) - new Date(lastSafeDate)) / (1000 * 60 * 60 * 24);
        if (diffDays < CHEAT_MEAL_SAFE_INTERVAL_DAYS) {
          result.add(d);
          return; // doesn't reset the "safe" timer if it was itself a violation
        }
      }
      lastSafeDate = d;
    });
    return result;
  }, [passiveLogs]);

  const streaksByActivity = useMemo(() => {
    const result = {};
    Object.entries(logsByActivity).forEach(([activity, arr]) => {
      const uniqueDates = [...new Set(arr.map((l) => l.date))].sort((a, b) => (a < b ? 1 : -1));
      const blocked = activity === 'nutrition'
        ? new Set([...zeroActivityDays, ...violatingCheatMealDays])
        : zeroActivityDays;
      result[activity] = isConsecutiveStreak(uniqueDates, blocked);
    });
    return result;
  }, [logsByActivity, zeroActivityDays, violatingCheatMealDays]);

  // Уведомление о прерывании стрика (если стрик был ≥3 и стал 0)
  useEffect(() => {
    if (!selectedNickname) return;
    const TRACKED = { running: '🏃 Бег', nutrition: '🥗 Питание', sleep: '😴 Сон', reading: '📖 Чтение' };
    if (prevStreaksRef.current === null) { prevStreaksRef.current = { ...streaksByActivity }; return; }
    const prev = prevStreaksRef.current;
    Object.entries(TRACKED).forEach(([act, label]) => {
      const was = prev[act] || 0;
      const now = streaksByActivity[act] || 0;
      if (was >= 3 && now === 0) {
        dbSendMessage('__system__', selectedNickname,
          `🔥 Серия «${label}» прервана. Было ${was} дней подряд. Начни заново — первый шаг всегда самый важный.`,
          'Внутренний голос', 'streak_warning');
      }
    });
    prevStreaksRef.current = { ...streaksByActivity };
  }, [streaksByActivity, selectedNickname]);

  const weeklyStrengthCount = useMemo(() => {
    const thisWeek = getWeekKey(new Date());
    let count = 0;
    ['strength_park', 'strength_gym', 'wrestling'].forEach((act) => {
      (logsByActivity[act] || []).forEach((l) => {
        if (getWeekKey(l.date) === thisWeek) count++;
      });
    });
    return count;
  }, [logsByActivity]);

  // Лучшая когда-либо неделя по числу ТЯЖЁЛЫХ силовых тренировок (для "Вулканический Колосс")
  const weeklyHardStrengthBest = useMemo(() => {
    const perWeek = {};
    ['strength_park', 'strength_gym'].forEach((act) => {
      (logsByActivity[act] || []).forEach((l) => {
        if (l.intensity !== 'hard') return;
        const wk = getWeekKey(l.date);
        perWeek[wk] = (perWeek[wk] || 0) + 1;
      });
    });
    return Math.max(0, ...Object.values(perWeek));
  }, [logsByActivity]);

  const maxRunDistance = useMemo(() => {
    return Math.max(0, ...(logsByActivity.running || []).map((l) => Number(l.distance) || 0));
  }, [logsByActivity]);

  const totalRunDistance = useMemo(() => {
    return (logsByActivity.running || []).reduce((sum, l) => sum + (Number(l.distance) || 0), 0);
  }, [logsByActivity]);

  const totalCountByActivity = useMemo(() => {
    const result = {};
    Object.keys(ACTIVITY_TYPES).forEach((key) => {
      result[key] = (logsByActivity[key] || []).length;
    });
    return result;
  }, [logsByActivity]);

  const styleCounts = useMemo(() => ({
    strength_park: (logsByActivity.strength_park || []).length,
    strength_gym: (logsByActivity.strength_gym || []).length,
    wrestling: (logsByActivity.wrestling || []).length,
  }), [logsByActivity]);

  // Calorie-specific computations
  const calLogs = useMemo(() => (logsByActivity.calories || []), [logsByActivity]);

  // Best single-day kcal total
  const calBestDay = useMemo(() => {
    const byDate = {};
    calLogs.forEach((l) => {
      byDate[l.date] = (byDate[l.date] || 0) + (Number(l.kcal) || 0);
    });
    return Math.max(0, ...Object.values(byDate));
  }, [calLogs]);

  // Total accumulated kcal
  const calTotal = useMemo(() => {
    return calLogs.reduce((sum, l) => sum + (Number(l.kcal) || 0), 0);
  }, [calLogs]);

  // Streak: consecutive days where daily kcal >= threshold
  function calStreakForThreshold(threshold) {
    const byDate = {};
    calLogs.forEach((l) => {
      byDate[l.date] = (byDate[l.date] || 0) + (Number(l.kcal) || 0);
    });
    // dates where threshold met, sorted desc
    const qualifyingDates = Object.entries(byDate)
      .filter(([, v]) => v >= threshold)
      .map(([d]) => d)
      .sort((a, b) => (a < b ? 1 : -1));
    if (qualifyingDates.length === 0) return 0;
    let streak = 1;
    for (let i = 0; i < qualifyingDates.length - 1; i++) {
      const cur = new Date(qualifyingDates[i]);
      const next = new Date(qualifyingDates[i + 1]);
      const diff = (cur - next) / (1000 * 60 * 60 * 24);
      if (diff !== 1) break;
      streak++;
    }
    // also check if the streak is still live (most recent qualifying day = today or yesterday)
    const mostRecent = new Date(qualifyingDates[0]);
    const today = new Date(dateKey(new Date()));
    const gap = (today - mostRecent) / (1000 * 60 * 60 * 24);
    if (gap > 1) return 0;
    return streak;
  }

  const calStreak300 = useMemo(() => calStreakForThreshold(300), [calLogs]);
  const calStreak500 = useMemo(() => calStreakForThreshold(500), [calLogs]);

  // Reading — cumulative pages and finished books
  const totalReadingPages = useMemo(() => {
    return (logsByActivity.reading || []).reduce((sum, l) => sum + (Number(l.pages) || 0), 0);
  }, [logsByActivity]);

  const booksFinishedCount = useMemo(() => {
    return books.filter(b => b.finished).length;
  }, [books]);

  // Steps computed values for achievements
  const stepsLogs = useMemo(() => (logsByActivity.walking || []), [logsByActivity]);
  const stepsBestDay = useMemo(() => {
    const byDate = {};
    stepsLogs.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + (Number(l.steps) || 0); });
    return Math.max(0, ...Object.values(byDate));
  }, [stepsLogs]);
  const stepsTotal = useMemo(() => stepsLogs.reduce((s, l) => s + (Number(l.steps) || 0), 0), [stepsLogs]);
  function stepsStreakForThreshold(threshold) {
    const byDate = {};
    stepsLogs.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + (Number(l.steps) || 0); });
    const qualDates = Object.entries(byDate).filter(([, v]) => v >= threshold).map(([d]) => d).sort((a, b) => a < b ? 1 : -1);
    if (!qualDates.length) return 0;
    let streak = 1;
    for (let i = 0; i < qualDates.length - 1; i++) {
      const diff = (new Date(qualDates[i]) - new Date(qualDates[i+1])) / 86400000;
      if (diff !== 1) break;
      streak++;
    }
    const gap = (new Date(dateKey(new Date())) - new Date(qualDates[0])) / 86400000;
    if (gap > 1) return 0;
    return streak;
  }

  // ---------- Стена подвигов (Партия B): текущие значения по всем категориям рекордов ----------
  // bestEverStreak: длина САМОГО ДЛИННОГО стрика за всю историю (не только текущего активного) —
  // рекорд не должен обнуляться, если стрик прервался.
  function bestEverStreak(dates) {
    const unique = [...new Set(dates)].sort();
    let max = 0, run = 0, prev = null;
    unique.forEach((d) => {
      if (prev) {
        const diff = Math.round((new Date(d) - new Date(prev)) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else run = 1;
      max = Math.max(max, run);
      prev = d;
    });
    return max;
  }

  const personalRecordsCurrent = useMemo(() => {
    const strengthDates = [...(logsByActivity.strength_park || []), ...(logsByActivity.strength_gym || [])].map(l => l.date);
    const sleepQualityDates = (logsByActivity.sleep || []).filter(l => l.strict).map(l => l.date);
    const nutritionNormDates = (logsByActivity.nutrition || []).filter(l => l.inNorm).map(l => l.date);
    const nutritionNoSugarDates = (logsByActivity.nutrition || []).filter(l => l.noSugar).map(l => l.date);

    const stepsByDate = {};
    (logsByActivity.walking || []).forEach(l => { stepsByDate[l.date] = (stepsByDate[l.date] || 0) + (Number(l.steps) || 0); });
    const steps5kDates = Object.entries(stepsByDate).filter(([, v]) => v >= 5000).map(([d]) => d);

    const readingByDate = {};
    (logsByActivity.reading || []).forEach(l => { readingByDate[l.date] = (readingByDate[l.date] || 0) + (Number(l.pages) || 0); });
    const readingMaxDay = Math.max(0, ...Object.values(readingByDate));

    const logsPerDay = {};
    logs.forEach(l => { logsPerDay[l.date] = (logsPerDay[l.date] || 0) + 1; });
    const maxActivitiesDay = Math.max(0, ...Object.values(logsPerDay));
    const anyActivityDates = Object.keys(logsPerDay);

    const raidsWon = (raidArchive || []).filter(r => r.status === 'victory').length;
    const challengesWon = (challengeState.completed || []).length;

    return {
      run_max_km: Math.round(maxRunDistance * 10) / 10,
      run_total_km: Math.round(totalRunDistance * 10) / 10,
      run_best_streak: bestEverStreak(logsByActivity.running?.map(l => l.date) || []),
      strength_total: (totalCountByActivity.strength_park || 0) + (totalCountByActivity.strength_gym || 0),
      strength_best_streak: bestEverStreak(strengthDates),
      wrestling_total: totalCountByActivity.wrestling || 0,
      wrestling_best_streak: bestEverStreak(logsByActivity.wrestling?.map(l => l.date) || []),
      steps_max_day: stepsBestDay,
      steps_best_streak_5k: bestEverStreak(steps5kDates),
      sleep_best_streak_quality: bestEverStreak(sleepQualityDates),
      nutrition_best_streak_norm: bestEverStreak(nutritionNormDates),
      nutrition_best_streak_nosugar: bestEverStreak(nutritionNoSugarDates),
      reading_max_day: readingMaxDay,
      reading_total_pages: totalReadingPages,
      reading_best_streak: bestEverStreak(logsByActivity.reading?.map(l => l.date) || []),
      calories_max_day: calBestDay,
      calories_total: calTotal,
      overall_max_activities_day: maxActivitiesDay,
      overall_best_any_streak: bestEverStreak(anyActivityDates),
      raids_won: raidsWon,
      challenges_completed: challengesWon,
    };
  }, [logsByActivity, logs, maxRunDistance, totalRunDistance, totalCountByActivity, stepsBestDay, totalReadingPages, calBestDay, calTotal, raidArchive, challengeState.completed]);

  // Список категорий "Стены подвигов" вынесен на уровень модуля (RECORD_CATEGORIES) — нужен
  // и здесь, и в GuildMemberDetail (отдельный компонент).

  // Детект новых рекордов: первый прогон после логина — тихий бэкафилл (без модалок/почты),
  // иначе у существующих игроков с историей логов "выстрелит" сразу 20 модалок при первом запуске фичи.
  useEffect(() => {
    if (!selectedNickname) return;
    if (!recordsInitRef.current) {
      recordsInitRef.current = true;
      const initial = {};
      let changed = false;
      RECORD_CATEGORIES.forEach(cat => {
        const cur = personalRecordsCurrent[cat.id] || 0;
        const stored = personalRecords[cat.id];
        if (!stored || cur > stored.value) {
          initial[cat.id] = { value: cur, date: dateKey(new Date()), timesBroken: 0 };
          changed = true;
        } else {
          initial[cat.id] = stored;
        }
      });
      if (changed) setPersonalRecords(prev => ({ ...prev, ...initial }));
      return;
    }

    const updates = {};
    const newlyBroken = [];
    RECORD_CATEGORIES.forEach(cat => {
      const cur = personalRecordsCurrent[cat.id] || 0;
      const stored = personalRecords[cat.id];
      const prevValue = stored?.value || 0;
      if (cur > prevValue && cur > 0) {
        updates[cat.id] = { value: cur, date: dateKey(new Date()), timesBroken: (stored?.timesBroken || 0) + 1 };
        newlyBroken.push({ cat, prevValue, cur });
      }
    });
    if (newlyBroken.length > 0) {
      setPersonalRecords(prev => ({ ...prev, ...updates }));
      setRecordsBroken(prev => prev + newlyBroken.length);
      setRecordModalQueue(prev => [...prev, ...newlyBroken.map(({ cat, prevValue, cur }) => ({
        label: cat.label, icon: cat.icon, unit: cat.unit,
        prevValue, newValue: cur, diff: Math.round((cur - prevValue) * 10) / 10,
      }))]);
      const { cat, prevValue, cur } = newlyBroken[0];
      dbSendMessage('__system__', selectedNickname,
        `🏆 Новый рекорд: «${cat.label}» — ${cur}${cat.unit ? ' ' + cat.unit : ''} (было ${prevValue})`,
        'Внутренний голос', 'record');
    }
  }, [personalRecordsCurrent, selectedNickname]);

  // Evaluate achievement progress
  function evaluateAchievement(ach) {
    let currentValue = 0;
    if (ach.kind === 'streak') currentValue = streaksByActivity[ach.activity] || 0;
    else if (ach.kind === 'single_value') currentValue = maxRunDistance;
    else if (ach.kind === 'cumulative_value') currentValue = Math.round(totalRunDistance * 10) / 10;
    else if (ach.kind === 'weekly_count') currentValue = weeklyStrengthCount;
    else if (ach.kind === 'count') currentValue = styleCounts[ach.activity] || 0;
    else if (ach.kind === 'cumulative_count') currentValue = totalCountByActivity[ach.activity] || 0;
    else if (ach.kind === 'cal_single_day') currentValue = calBestDay;
    else if (ach.kind === 'cal_cumulative') currentValue = calTotal;
    else if (ach.kind === 'cal_streak_threshold') {
      currentValue = ach.threshold === 300 ? calStreak300 : calStreak500;
    }
    else if (ach.kind === 'cumulative_pages') currentValue = totalReadingPages;
    else if (ach.kind === 'books_finished') currentValue = booksFinishedCount;
    else if (ach.kind === 'steps_single_day') currentValue = stepsBestDay;
    else if (ach.kind === 'steps_cumulative') currentValue = stepsTotal;
    else if (ach.kind === 'steps_streak_threshold') currentValue = stepsStreakForThreshold(ach.threshold || 5000);
    else if (ach.kind === 'records_broken_count') currentValue = recordsBroken;

    let achievedTierIndex = -1;
    ach.tiers.forEach((t, idx) => {
      if (currentValue >= t.need) achievedTierIndex = idx;
    });
    const nextTier = ach.tiers[achievedTierIndex + 1] || null;
    return { currentValue, achievedTierIndex, nextTier };
  }

  const achievementsEvaluated = useMemo(() => ACHIEVEMENTS.map((a) => ({ ...a, ...evaluateAchievement(a) })), [streaksByActivity, maxRunDistance, totalRunDistance, weeklyStrengthCount, styleCounts, totalCountByActivity, calBestDay, calTotal, calStreak300, calStreak500, totalReadingPages, booksFinishedCount, stepsBestDay, stepsTotal, stepsLogs, recordsBroken]);

  const unlockedCount = achievementsEvaluated.filter((a) => a.achievedTierIndex >= 0).length;

  // Уведомления о новых ачивках
  useEffect(() => {
    if (!selectedNickname || !achievementsEvaluated.length) return;
    // Build current snapshot: achId → achievedTierIndex
    const cur = {};
    achievementsEvaluated.forEach(a => { if (a.achievedTierIndex >= 0) cur[a.id] = a.achievedTierIndex; });
    if (prevAchievRef.current === null) { prevAchievRef.current = cur; return; }
    const prev = prevAchievRef.current;
    achievementsEvaluated.forEach(a => {
      const prevTier = prev[a.id] ?? -1;
      const curTier = a.achievedTierIndex ?? -1;
      if (curTier > prevTier && curTier >= 0) {
        const tierData = a.tiers?.[curTier];
        const tierNames = { bronze: '🥉 Бронза', silver: '🥈 Серебро', gold: '🥇 Золото', platinum: '💎 Платина', diamond: '💠 Бриллиант', special: '✨ Особый' };
        const tierLabel = tierNames[tierData?.tier] || '🏆';
        dbSendMessage('__system__', selectedNickname,
          `🏆 Ачивка разблокирована: «${a.title}» — ${tierData?.name || ''} (${tierLabel})`,
          'Внутренний голос', 'achievement');
      }
    });
    prevAchievRef.current = cur;
  }, [achievementsEvaluated, selectedNickname]);

  // "Стальной алхимик": a single day with 3+ training sessions (any kind) plus nutrition, sleep, and reading all logged.
  // "Тройной удар" combos: for each day, build a set of activity "tags" present that day,
  // then check each combo's requirement set against it. Triggers every matching day.
  // "ПЕНТА-УДАР" legendary achievements: each day, count how many of 6 strict conditions are met
  // (nutrition, strict sleep, run 5+km, any strength, reading 100+ pages, wrestling).
  //
  // "Легенда своего Сити" — repeatable per qualifying day, with a DECAYING reward per stat:
  //   days 1–5   → +15 XP each stat (gold tier, full event reward)
  //   days 6–10  → +8  XP each stat (silver tier, decaying)
  //   days 11–20 → +4  XP each stat (bronze tier, small incentive)
  //   days 21+   → +2  XP each stat (symbolic, discipline habit)
  const pentaResults = useMemo(() => {
    const byDate = {};
    logs.forEach((l) => {
      if (!byDate[l.date]) {
        byDate[l.date] = { nutrition: false, strictSleep: false, run5k: false, strength: false, read100: false, wrestling: false };
      }
      const bucket = byDate[l.date];
      if (l.activity === 'nutrition') bucket.nutrition = true;
      if (l.activity === 'sleep' && l.strict) bucket.strictSleep = true;
      if (l.activity === 'running' && Number(l.distance) >= 5) bucket.run5k = true;
      if (l.activity === 'strength_park' || l.activity === 'strength_gym') bucket.strength = true;
      if (l.activity === 'reading' && Number(l.pages) >= 100) bucket.read100 = true;
      if (l.activity === 'wrestling') bucket.wrestling = true;
    });

    const perfectDayDates = [];
    Object.entries(byDate).forEach(([date, b]) => {
      const metCount = [b.nutrition, b.strictSleep, b.run5k, b.strength, b.read100, b.wrestling].filter(Boolean).length;
      if (metCount >= 5) perfectDayDates.push(date);
    });
    perfectDayDates.sort();

    // "Легенда своего Сити": repeatable, once per qualifying day
    const legendCount = perfectDayDates.length;

    // Compute the DECAYING total reward per stat and per-tier breakdown for UI
    // Tier bands: [1..5] = gold(15), [6..10] = silver(8), [11..20] = bronze(4), [21+] = symbolic(2)
    let goldDays = Math.min(5, legendCount);
    let silverDays = Math.min(5, Math.max(0, legendCount - 5));
    let bronzeDays = Math.min(10, Math.max(0, legendCount - 10));
    let symbolicDays = Math.max(0, legendCount - 20);
    const legendXpPerStat =
      goldDays * 15 +
      silverDays * 8 +
      bronzeDays * 4 +
      symbolicDays * 2;
    const legendTierBreakdown = {
      gold:     { count: goldDays,     xpPerStat: 15 },
      silver:   { count: silverDays,   xpPerStat: 8  },
      bronze:   { count: bronzeDays,   xpPerStat: 4  },
      symbolic: { count: symbolicDays, xpPerStat: 2  },
    };
    // Determine current tier + next tier threshold for UI feedback
    let currentTierKey = 'none';
    let nextTierAtDay = 1;
    let currentTierXp = 0;
    if (legendCount === 0) { currentTierKey = 'none'; nextTierAtDay = 1; }
    else if (legendCount <= 5)  { currentTierKey = 'gold';     nextTierAtDay = 6;  currentTierXp = 15; }
    else if (legendCount <= 10) { currentTierKey = 'silver';   nextTierAtDay = 11; currentTierXp = 8; }
    else if (legendCount <= 20) { currentTierKey = 'bronze';   nextTierAtDay = 21; currentTierXp = 4; }
    else                        { currentTierKey = 'symbolic'; nextTierAtDay = null; currentTierXp = 2; }

    // "Бог нового мира": longest run of consecutive perfect days, unlocked once it reaches 5
    let longestStreak = 0;
    let current = 0;
    for (let i = 0; i < perfectDayDates.length; i++) {
      if (i === 0) {
        current = 1;
      } else {
        const diff = (new Date(perfectDayDates[i]) - new Date(perfectDayDates[i - 1])) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, current);
    }
    const godUnlocked = longestStreak >= 5;

    return {
      legendCount,
      longestStreak,
      godUnlocked,
      legendXpPerStat,
      legendTierBreakdown,
      currentTierKey,
      nextTierAtDay,
      currentTierXp,
    };
  }, [logs]);

  const comboResults = useMemo(() => {
    const tagsByDate = {};
    // First pass: accumulate steps per day
    const stepsByDate = {};
    const kcalByDate_combo = {};
    logs.forEach((l) => {
      if (!tagsByDate[l.date]) tagsByDate[l.date] = new Set();
      const tagSet = tagsByDate[l.date];
      tagSet.add(l.activity);
      if (l.activity === 'strength_park' || l.activity === 'strength_gym') tagSet.add('strength');
      if (l.activity === 'walking') stepsByDate[l.date] = (stepsByDate[l.date] || 0) + (Number(l.steps) || 0);
      if (l.activity === 'calories') kcalByDate_combo[l.date] = (kcalByDate_combo[l.date] || 0) + (Number(l.kcal) || 0);
    });
    // Second pass: add step threshold tags
    Object.entries(stepsByDate).forEach(([date, total]) => {
      if (!tagsByDate[date]) tagsByDate[date] = new Set();
      if (total >= 6000)  tagsByDate[date].add('walking_6k');
      if (total >= 10000) tagsByDate[date].add('walking_10k');
      if (total >= 12000) tagsByDate[date].add('walking_12k');
      if (total >= 15000) tagsByDate[date].add('walking_15k');
    });
    Object.entries(kcalByDate_combo).forEach(([date, total]) => {
      if (!tagsByDate[date]) tagsByDate[date] = new Set();
      if (total >= 800) tagsByDate[date].add('calories_800');
    });

    const results = {};
    const totalRewards = {};
    COMBO_ACHIEVEMENTS.forEach((combo) => {
      let count = 0;
      if (combo.consecutiveDays) {
        // Считаем НЕПЕРЕСЕКАЮЩИЕСЯ окна из N подряд идущих календарных дней, где выполнены все теги.
        const sortedDates = Object.keys(tagsByDate).sort();
        const matchDates = sortedDates.filter(d => combo.requires.every((tag) => tagsByDate[d].has(tag)));
        let run = 0, prev = null;
        matchDates.forEach((d) => {
          if (prev) {
            const diff = Math.round((new Date(d) - new Date(prev)) / 86400000);
            run = diff === 1 ? run + 1 : 1;
          } else run = 1;
          if (run >= combo.consecutiveDays) { count += 1; run = 0; prev = null; return; }
          prev = d;
        });
      } else {
        Object.values(tagsByDate).forEach((tagSet) => {
          const matched = combo.requires.every((tag) => tagSet.has(tag));
          if (matched) count += 1;
        });
      }
      results[combo.id] = count;
      if (count > 0) {
        Object.entries(combo.rewards).forEach(([stat, amount]) => {
          totalRewards[stat] = (totalRewards[stat] || 0) + amount * count;
        });
      }
    });
    return { countsById: results, totalRewards };
  }, [logs]);

  // "Баланс" achievements: equal-count rolling windows, and dual-activity streak blocks.
  const balanceResults = useMemo(() => {
    const results = {};
    const totalRewards = {};

    if (logs.length === 0) {
      BALANCE_ACHIEVEMENTS.forEach((b) => (results[b.id] = 0));
      return { countsById: results, totalRewards };
    }

    // Build a sorted list of all unique dates with any activity, plus a per-day count map per activity.
    const countByActivityByDate = {}; // date -> activity -> count
    const allDatesSet = new Set();
    logs.forEach((l) => {
      allDatesSet.add(l.date);
      if (!countByActivityByDate[l.date]) countByActivityByDate[l.date] = {};
      countByActivityByDate[l.date][l.activity] = (countByActivityByDate[l.date][l.activity] || 0) + 1;
    });

    const sortedDates = [...allDatesSet].sort();
    const earliest = new Date(sortedDates[0]);
    const today = new Date(dateKey(new Date()));

    function countInRange(activities, fromKey, toKey) {
      let total = 0;
      Object.entries(countByActivityByDate).forEach(([date, byAct]) => {
        if (date < fromKey || date > toKey) return;
        activities.forEach((act) => {
          total += byAct[act] || 0;
        });
      });
      return total;
    }

    BALANCE_ACHIEVEMENTS.forEach((b) => {
      let count = 0;

      if (b.kind === 'equal_count_window') {
        const cursor = new Date(earliest);
        while (cursor <= today) {
          const toKey = dateKey(cursor);
          const fromDate = new Date(cursor);
          fromDate.setDate(fromDate.getDate() - (b.windowDays - 1));
          const fromKey = dateKey(fromDate);

          const countA = countInRange(b.activitiesA, fromKey, toKey);
          const countB = countInRange(b.activitiesB, fromKey, toKey);
          if (countA === countB && countA >= b.minEach) count += 1;

          cursor.setDate(cursor.getDate() + 1);
        }
      } else if (b.kind === 'dual_streak_block') {
        let consecutive = 0;
        const cursor = new Date(earliest);
        while (cursor <= today) {
          const key = dateKey(cursor);
          const byAct = countByActivityByDate[key] || {};
          const hasA = b.activitiesA.some((act) => byAct[act] > 0);
          const hasB = b.activitiesB.some((act) => byAct[act] > 0);
          if (hasA && hasB) {
            consecutive += 1;
            if (consecutive >= b.blockDays) {
              count += 1;
              consecutive = 0; // start a fresh block after each completed one
            }
          } else {
            consecutive = 0;
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      results[b.id] = count;
      if (count > 0) {
        Object.entries(b.rewards).forEach(([stat, amount]) => {
          totalRewards[stat] = (totalRewards[stat] || 0) + amount * count;
        });
      }
    });

    return { countsById: results, totalRewards };
  }, [logs]);

  // Mythic achievements: complex one-time conditions over the full log history.
  const mythicFlags = useMemo(() => {
    const flags = {
      kamina: false, hogyoku: false, thousandYearWar: false,
      unohana: false, gatesOfDeath: false, sageMode: false, gaiChallenge: false, santoryu: false,
    };
    if (logs.length === 0) return flags;

    const recoveryDates = new Set(recoveryLogs.map((r) => r.date));
    const countByActivityByDate = {};
    const allDatesSet = new Set();
    logs.forEach((l) => {
      allDatesSet.add(l.date);
      if (!countByActivityByDate[l.date]) countByActivityByDate[l.date] = {};
      countByActivityByDate[l.date][l.activity] = (countByActivityByDate[l.date][l.activity] || 0) + 1;
    });
    const sortedDates = [...allDatesSet].sort();
    const earliest = new Date(sortedDates[0]);
    const today = new Date(dateKey(new Date()));

    function dayHas(key, activities) {
      const byAct = countByActivityByDate[key] || {};
      return activities.some((act) => (byAct[act] || 0) > 0);
    }
    function countInRange(activities, fromKey, toKey) {
      let total = 0;
      Object.entries(countByActivityByDate).forEach(([date, byAct]) => {
        if (date < fromKey || date > toKey) return;
        activities.forEach((act) => { total += byAct[act] || 0; });
      });
      return total;
    }
    function allDaysSatisfy(fromDate, toDate, predicate) {
      const cursor = new Date(fromDate);
      while (cursor <= toDate) {
        if (!predicate(dateKey(cursor))) return false;
        cursor.setDate(cursor.getDate() + 1);
      }
      return true;
    }

    const TRAINING = ['running', 'strength_park', 'strength_gym', 'wrestling'];
    const STRENGTH = ['strength_park', 'strength_gym'];

    function dayDistinctCategoryCount(key) {
      const byAct = countByActivityByDate[key] || {};
      const categories = new Set();
      if (byAct.running > 0) categories.add('running');
      if ((byAct.strength_park || 0) + (byAct.strength_gym || 0) > 0) categories.add('strength');
      if (byAct.wrestling > 0) categories.add('wrestling');
      if (byAct.nutrition > 0) categories.add('nutrition');
      if (byAct.sleep > 0) categories.add('sleep');
      if (byAct.reading > 0) categories.add('reading');
      return categories.size;
    }

    const cursor = new Date(earliest);
    while (cursor <= today) {
      const toKey = dateKey(cursor);

      if (!flags.kamina) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 24);
        const fromKey = dateKey(fromDate);
        if (
          countInRange(['running'], fromKey, toKey) >= 15 &&
          countInRange(STRENGTH, fromKey, toKey) >= 15 &&
          countInRange(['reading'], fromKey, toKey) >= 20 &&
          countInRange(['nutrition'], fromKey, toKey) >= 25
        ) {
          flags.kamina = true;
        }
      }

      if (!flags.thousandYearWar) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 89);
        const fromKey = dateKey(fromDate);
        if (
          countInRange(TRAINING, fromKey, toKey) >= 50 &&
          countInRange(['reading'], fromKey, toKey) >= 60 &&
          countInRange(['nutrition'], fromKey, toKey) >= 50 &&
          countInRange(['sleep'], fromKey, toKey) >= 60
        ) {
          flags.thousandYearWar = true;
        }
      }

      if (!flags.sageMode) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        const fromKey = dateKey(fromDate);
        if (countInRange(['running'], fromKey, toKey) >= 20 && countInRange(STRENGTH, fromKey, toKey) >= 20) {
          flags.sageMode = true;
        }
      }

      if (!flags.santoryu) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        const fromKey = dateKey(fromDate);
        if (countInRange(STRENGTH, fromKey, toKey) >= 15 && countInRange(['wrestling'], fromKey, toKey) >= 15) {
          flags.santoryu = true;
        }
      }

      if (!flags.hogyoku) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 29);
        if (allDaysSatisfy(fromDate, cursor, (key) => dayDistinctCategoryCount(key) >= 4)) {
          flags.hogyoku = true;
        }
      }

      if (!flags.gatesOfDeath) {
        // 30 strength sessions in any 35-day window (up to 5 rest days allowed)
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 34);
        const fromKey = dateKey(fromDate);
        if (countInRange(STRENGTH, fromKey, toKey) >= 30) {
          flags.gatesOfDeath = true;
        }
      }

      if (!flags.gaiChallenge) {
        // 90 trainings (any: run/strength/wrestling) in any 100-day window (up to 10 skip days allowed)
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 99);
        const fromKey = dateKey(fromDate);
        if (countInRange(TRAINING, fromKey, toKey) >= 90) {
          flags.gaiChallenge = true;
        }
      }

      if (!flags.unohana) {
        const fromDate = new Date(cursor);
        fromDate.setDate(fromDate.getDate() - 6);
        const noStrengthOrWrestling = allDaysSatisfy(fromDate, cursor, (key) => {
          const byAct = countByActivityByDate[key] || {};
          return !(byAct.strength_park > 0 || byAct.strength_gym > 0 || byAct.wrestling > 0);
        });
        const hasAllowedEachDay = allDaysSatisfy(fromDate, cursor, (key) => {
          const hasLogged = dayHas(key, ['nutrition', 'sleep', 'reading']);
          const hasRecovery = recoveryDates.has(key);
          return hasLogged || hasRecovery;
        });
        if (noStrengthOrWrestling && hasAllowedEachDay) {
          flags.unohana = true;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return flags;
  }, [logs, zeroActivityDays, recoveryLogs]);

  const hasPerfectDay = useMemo(() => {
    const byDate = {};
    logs.forEach((l) => {
      if (!byDate[l.date]) byDate[l.date] = { training: 0, nutrition: false, sleep: false, reading: false };
      const bucket = byDate[l.date];
      if (['running', 'strength_park', 'strength_gym', 'wrestling'].includes(l.activity)) bucket.training += 1;
      if (l.activity === 'nutrition') bucket.nutrition = true;
      if (l.activity === 'sleep') bucket.sleep = true;
      if (l.activity === 'reading') bucket.reading = true;
    });
    return Object.values(byDate).some((d) => d.training >= 3 && d.nutrition && d.sleep && d.reading);
  }, [logs]);

  // "Матрица: перезагрузка": longest consecutive run of Загул days (zero activity at all).
  const maxZeroActivityStreak = useMemo(() => {
    const sorted = [...zeroActivityDays].sort();
    if (sorted.length === 0) return 0;
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24);
      current = diff === 1 ? current + 1 : 1;
      longest = Math.max(longest, current);
    }
    return longest;
  }, [zeroActivityDays]);

  // "Живой марафонец": best rolling 7-day running distance total.
  const maxWeeklyRunDistance = useMemo(() => {
    const runDates = [...new Set((logsByActivity.running || []).map((l) => l.date))];
    let best = 0;
    runDates.forEach((startDate) => {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const sum = (logsByActivity.running || [])
        .filter((l) => new Date(l.date) >= start && new Date(l.date) <= end)
        .reduce((acc, l) => acc + (Number(l.distance) || 0), 0);
      best = Math.max(best, sum);
    });
    return Math.round(best * 10) / 10;
  }, [logsByActivity]);

  // "Библио-Глобус": best calendar-month count of books marked finished.
  const maxMonthlyBooksFinished = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      if (!b.finished || !b.finishedDate) return;
      const monthKey = b.finishedDate.slice(0, 7); // 'YYYY-MM'
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });
    return Math.max(0, ...Object.values(counts));
  }, [books]);

  // "Боевая машина": best calendar-month count of wrestling sessions.
  const maxMonthlyWrestlingCount = useMemo(() => {
    const counts = {};
    (logsByActivity.wrestling || []).forEach((l) => {
      const monthKey = l.date.slice(0, 7);
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });
    return Math.max(0, ...Object.values(counts));
  }, [logsByActivity]);

  // Recovery type counts — used by the hidden "Recovery" secret achievements.
  const recoveryCountsByType = useMemo(() => {
    const counts = {};
    Object.keys(RECOVERY_TYPES).forEach((k) => (counts[k] = 0));
    recoveryLogs.forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return counts;
  }, [recoveryLogs]);

  // Walking secret achievement checks
  const sundayStepsAndReading = (() => {
    const byDate = {};
    (logsByActivity.walking || []).forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + (Number(l.steps) || 0); });
    const readingDates = new Set((logsByActivity.reading || []).map(l => l.date));
    return Object.entries(byDate).some(([d, s]) => {
      if (s < 3000) return false;
      if (!readingDates.has(d)) return false;
      return new Date(d).getDay() === 0; // Sunday
    });
  })();

  const stepsStreak5k30 = (() => {
    const byDate = {};
    (logsByActivity.walking || []).forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + (Number(l.steps) || 0); });
    const qualDates = Object.entries(byDate).filter(([, s]) => s >= 5000).map(([d]) => d).sort();
    if (qualDates.length < 30) return false;
    let streak = 1, best = 1;
    for (let i = 1; i < qualDates.length; i++) {
      const diff = (new Date(qualDates[i]) - new Date(qualDates[i-1])) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
      best = Math.max(best, streak);
    }
    return best >= 30;
  })();

  const steps30kWithRun = (() => {
    const byDate = {};
    (logsByActivity.walking || []).forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + (Number(l.steps) || 0); });
    const runDates = new Set((logsByActivity.running || []).map(l => l.date));
    return Object.entries(byDate).some(([d, s]) => s >= 30000 && runDates.has(d));
  })();

  const secretContext = {
    violatingCheatMealDays,
    hasPerfectDay,
    streaksByActivity,
    maxZeroActivityStreak,
    maxWeeklyRunDistance,
    maxMonthlyBooksFinished,
    maxMonthlyWrestlingCount,
    recoveryCountsByType,
    sundayStepsAndReading,
    stepsStreak5k30,
    steps30kWithRun,
    personalRecords,
    totalRecordCategories: RECORD_CATEGORIES.length,
  };

  const secretAchievementsEvaluated = useMemo(
    () => SECRET_ACHIEVEMENTS.map((s) => ({ ...s, unlocked: s.check(secretContext) })),
    [violatingCheatMealDays, hasPerfectDay, streaksByActivity, maxZeroActivityStreak, maxWeeklyRunDistance, maxMonthlyBooksFinished, maxMonthlyWrestlingCount, recoveryCountsByType, personalRecords]
  );

  const mythicContext = { mythicFlags, streaksByActivity, personalRecords, totalRecordCategories: RECORD_CATEGORIES.length };
  const mythicAchievementsEvaluated = useMemo(
    () => MYTHIC_ACHIEVEMENTS.map((m) => ({ ...m, unlocked: m.check(mythicContext) })),
    [mythicFlags, streaksByActivity, personalRecords]
  );

  const unlockedMythicIds = useMemo(
    () => new Set(mythicAchievementsEvaluated.filter((m) => m.unlocked).map((m) => m.id)),
    [mythicAchievementsEvaluated]
  );

  // Бестиарий: прогресс ачивок (Партия D)
  const bestiaryAchievementsEvaluated = useMemo(() => {
    const ownedSet = new Set(bestiary);
    const legendaryIds = new Set(BESTIARY_CATALOG.filter(c => c.rarity === 'legendary').map(c => c.id));
    const legendsOwned = [...legendaryIds].filter(id => ownedSet.has(id)).length;
    const categoriesOwned = new Set(BESTIARY_CATALOG.filter(c => ownedSet.has(c.id)).map(c => c.category)).size;
    return BESTIARY_ACHIEVEMENTS.map(a => {
      let current = 0;
      if (a.kind === 'total') current = bestiary.length;
      else if (a.kind === 'legends') current = legendsOwned;
      else if (a.kind === 'categories') current = categoriesOwned;
      return { ...a, current, unlocked: current >= a.need };
    });
  }, [bestiary]);

  const archiveUnlocked = secretAchievementsEvaluated.some((s) => s.unlocksTab === 'archive' && s.unlocked);

  // ---------- Хелперы движка эффектов ----------
  // csv — строка вида 'strength_park,strength_gym' или одиночная активность 'running'.
  function isComboDay(date, actACsv, actBCsv) {
    const actA = actACsv.split(',');
    const actB = actBCsv.split(',');
    const dayLogs = logs.filter(l => l.date === date);
    return dayLogs.some(l => actA.includes(l.activity)) && dayLogs.some(l => actB.includes(l.activity));
  }
  function isComboDayMulti(date, activitiesArr) {
    const dayLogs = logs.filter(l => l.date === date);
    return activitiesArr.every(act => dayLogs.some(l => l.activity === act));
  }
  function allComboDaysFor(actACsv, actBCsv) {
    const dates = [...new Set(logs.map(l => l.date))];
    return dates.filter(d => isComboDay(d, actACsv, actBCsv));
  }
  function allComboDaysMultiFor(activitiesArr) {
    const dates = [...new Set(logs.map(l => l.date))];
    return dates.filter(d => isComboDayMulti(d, activitiesArr));
  }
  function maxStreakEver(activityCsv) {
    const acts = activityCsv.split(',');
    const dates = [...new Set(logs.filter(l => acts.includes(l.activity)).map(l => l.date))].sort();
    let max = 0, run = 0, prev = null;
    dates.forEach(d => {
      if (prev) {
        const diffDays = Math.round((new Date(d) - new Date(prev)) / 86400000);
        run = diffDays === 1 ? run + 1 : 1;
      } else run = 1;
      max = Math.max(max, run);
      prev = d;
    });
    return max;
  }
  function totalLogCountFor(activityCsv) {
    const acts = activityCsv.split(',');
    return logs.filter(l => acts.includes(l.activity)).length;
  }

  // Health bars: replay all activity logs + passive logs chronologically.
  // Positive activities restore the relevant bar, passives (stress/sleep debt) damage it.
  // Overeating accumulates a poison counter; every 5th hit applies a flat XP penalty (handled in statTotals below).
  // Health system with stacking debuffs:
  // - Stress stacks on the mental bar: each new stack hits harder than the last (3%, 4%, 5%, ...).
  //   Removed by "Восстановление" entries (removes the most recent/strongest stack entry).
  // - Sleep debt ("Усталость") stacks on the physical bar the same way. Removed by sleep.
  // - Overeating accumulates a poison counter; every 5 hits applies a flat -10 XP penalty per stat.
  //   Removed by nutrition, 3 nutrition logs per poison stack removed.
  const healthState = useMemo(() => {
    const HEALTH_START = 50;
    const recoveryDates = new Set(recoveryLogs.map((r) => r.date));
    const today = dateKey(new Date());
    // A fully-completed day with zero logged activities quietly saps morale — same mechanism
    // as the "stress" debuff (escalating stack, clearable via recovery), just auto-applied.
    const stagnationEntries = [...zeroActivityDays]
      .filter((d) => d < today)
      .map((d) => ({ date: d, type: 'stagnation', id: -1, _kind: 'passive' }));
    const combined = [
      ...logs.map((l) => ({ ...l, _kind: 'activity' })),
      ...passiveLogs.map((p) => ({ ...p, _kind: 'passive' })),
      ...recoveryLogs.map((r) => ({ ...r, _kind: 'recovery' })),
      ...stagnationEntries,
      ...(consumableLog || []).filter(c => c.type === 'potion_hp' || c.type === 'potion_mp')
        .map(c => ({ ...c, _kind: 'consumable', id: c.id || Date.now() })),
    ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

    // Skill-effect reduction factors (additive pct, from debuff_reduction skills)
    // Глобальные (без sourceActivity) — действуют на ЛЮБой источник усталости/стресса.
    const fatigueReductionPct = effectsByType('debuff_reduction').filter(e => e.debuff === 'fatigue' && !e.sourceActivity).reduce((a, e) => a + e.pct, 0);
    const stressReductionPct = effectsByType('debuff_reduction').filter(e => e.debuff === 'stress' && !e.sourceActivity).reduce((a, e) => a + e.pct, 0);
    const fatigueReductionMult = Math.max(0, 1 - fatigueReductionPct / 100);
    const stressReductionMult = Math.max(0, 1 - stressReductionPct / 100);
    // Party C: sourceActivity-скоуп debuff_reduction (например, «усталость от бега/шагов -40%») —
    // применяется ТОЛЬКО когда конкретный триггер усталости совпадает с указанной активностью.
    const fatigueScopedReductions = effectsByType('debuff_reduction').filter(e => e.debuff === 'fatigue' && e.sourceActivity);
    function fatigueMultForSource(source) {
      let mult = fatigueReductionMult;
      fatigueScopedReductions.forEach(e => {
        if (source && e.sourceActivity.split(',').includes(source)) mult *= Math.max(0, 1 - e.pct / 100);
      });
      return mult;
    }
    // debuff_remove_on_activity effects, grouped by debuff type
    const fatigueRemovers = effectsByType('debuff_remove_on_activity').filter(e => e.debuff === 'fatigue');
    const stressRemovers = effectsByType('debuff_remove_on_activity').filter(e => e.debuff === 'stress');
    // hp_floor effects with condition 'always'
    const physicalFloor = effectsByType('hp_floor').filter(e => e.bar === 'physical' && e.condition === 'always').reduce((max, e) => Math.max(max, e.floor), 0);
    const mentalFloor = effectsByType('hp_floor').filter(e => e.bar === 'mental' && e.condition === 'always').reduce((max, e) => Math.max(max, e.floor), 0);
    // Party C: hp_floor с condition 'streaks_active' — активны, пока ВСЕ перечисленные csv-группы держат стрик
    const physicalStreakFloors = effectsByType('hp_floor').filter(e => e.bar === 'physical' && e.condition === 'streaks_active');
    const mentalStreakFloors = effectsByType('hp_floor').filter(e => e.bar === 'mental' && e.condition === 'streaks_active');
    // Party C: пороговые сдвиги (специализация)
    const poisonThresholdShift = effectsByType('threshold_shift').filter(e => e.target === 'poison_threshold').reduce((a, e) => a + e.delta, 0);
    const overtrainingCountShift = effectsByType('threshold_shift').filter(e => e.target === 'overtraining_count').reduce((a, e) => a + e.delta, 0);
    const infoOverloadDaysShift = effectsByType('threshold_shift').filter(e => e.target === 'info_overload_days').reduce((a, e) => a + e.delta, 0);
    // Party C: комбо-путь — восстановление в комбо-день, блокировка усталости, общий "оба стрика" restore
    const hpRestoreComboDayEffects = effectsByType('hp_restore_combo_day');
    const fatigueBlockEffects = effectsByType('fatigue_block_once_per_day');
    const hpRestoreStreaksActiveEffects = effectsByType('hp_restore_streaks_active');
    // Общий трекер стрика по csv-группам активности (для streaks_active условий в healthState).
    // Ключ — та же csv-строка, что и в effect.streaks (например 'strength_park,strength_gym').
    const hsStreakTracker = {}; // csvKey -> { streak, lastDate }
    const STREAK_GROUPS_HS = CHARACTER_CLASSES.map(c => c.activities.join(','));
    function updateHsStreakTracker(activity, date) {
      STREAK_GROUPS_HS.forEach(csv => {
        if (!csv.split(',').includes(activity)) return;
        const prev = hsStreakTracker[csv];
        if (!prev) { hsStreakTracker[csv] = { streak: 1, lastDate: date }; return; }
        if (prev.lastDate === date) return; // same-day, no change
        const diff = Math.round((new Date(date) - new Date(prev.lastDate)) / 86400000);
        hsStreakTracker[csv] = diff === 1 ? { streak: prev.streak + 1, lastDate: date } : { streak: 1, lastDate: date };
      });
    }
    function isHsStreakActive(csv) {
      const s = hsStreakTracker[csv];
      return !!s && s.streak >= 2;
    }
    // "Оба стрика активны" — блокирует РОВНО ОДИН fatigue-push в день (первый encountered).
    function tryConsumeFatigueBlock(date) {
      if (fatigueBlockEffects.length === 0) return false;
      const active = fatigueBlockEffects.some(e => e.streaks.every(s => isHsStreakActive(s)));
      if (!active || fatigueBlockedDates.has(date)) return false;
      fatigueBlockedDates.add(date);
      return true;
    }
    // "Оба стрика активны" — раз в день, для fatigue_block_once_per_day / hp_restore_streaks_active
    const fatigueBlockedDates = new Set();
    const restoreStreaksAppliedDates = new Set();
    // hp_restore_on_activity effects — restore a bar on top of normal gains when the activity is logged
    const hpRestoreEffects = effectsByType('hp_restore_on_activity');
    const activityDateListsForRestore = {}; // activity -> ascending unique dates seen so far (for requireStreak checks)

    let physical = HEALTH_START;
    let mental = HEALTH_START;
    let stressStack = []; // array of debuff magnitudes currently active, oldest first
    let fatigueStack = [];
    let poisonCount = 0;
    let poisonPenaltyEvents = 0;
    let nutritionTowardPoisonRelief = 0; // counts nutrition logs toward removing one poison stack (needs 3)
    let physicalXpLocked = false;
    let mentalXpLocked = false;
    const xpBlockedByDate = {}; // date -> true if XP was already blocked going INTO that day (end of previous day)
    let lastSeenDate = null;
    let dayHadCritical = false; // true if physical or mental hit <=10 at any point during the current date
    let noCriticalDaysCount = 0; // count of fully-processed dates with no critical HP drop (for per_good_days_periodic)
    const kcalByDate = {}; // track daily kcal totals for fatigue debuff (1500+ kcal)
    const calorieFatigueAppliedDates = new Set(); // prevent double-applying per date
    const stepsByDate_health = {}; // track daily steps for HP restore / fatigue debuff
    const walkingHealthAppliedDates = new Set(); // prevent double-applying per date
    // Patch 2: info overload tracker
    const heavyReadingByDate = {};
    const infoOverloadAppliedDates = new Set();
    // Patch 5: fatigue drain + Patch 6: auto-sleep-debt
    let lastSleepDate = null;
    const sleepDebtAppliedDates = new Set();
    // Patch 7: overtraining tracker
    const trainingCountByDate = {};
    const overtrainingAppliedDates = new Set();

    combined.forEach((entry) => {
      if (entry.date !== lastSeenDate) {
        // Skill effect: finalize noCriticalDaysCount for the day just completed
        if (lastSeenDate !== null) {
          if (!dayHadCritical) noCriticalDaysCount += 1;
          dayHadCritical = false;
        }
        // Patch 5: daily fatigue drain from active stacks
        if (lastSeenDate !== null) {
          const fatigueDrainTable = [0, 2, 5, 8, 11, 15];
          const fatigueDrain = fatigueDrainTable[Math.min(fatigueStack.length, 5)];
          if (fatigueDrain > 0) physical = Math.max(0, physical - fatigueDrain);
        }
        // Patch 6: auto-fatigue if 2+ days without sleep log
        if (lastSleepDate !== null && lastSeenDate !== null) {
          const daysSinceSleep = Math.floor((new Date(entry.date) - new Date(lastSleepDate)) / 86400000);
          if (daysSinceSleep >= 2 && !sleepDebtAppliedDates.has(entry.date) && !tryConsumeFatigueBlock(entry.date)) {
            sleepDebtAppliedDates.add(entry.date);
            const magnitude = (8 + fatigueStack.length * 3) * fatigueMultForSource(null);
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }
        xpBlockedByDate[entry.date] = physicalXpLocked || mentalXpLocked;
        lastSeenDate = entry.date;
      }
      if (entry._kind === 'activity') {
        // Party C: обновляем трекер стрика по csv-группам (для streaks_active условий)
        updateHsStreakTracker(entry.activity, entry.date);

        const physGain = PHYSICAL_HEALTH_SOURCES[entry.activity];
        if (physGain) physical = Math.min(100, physical + physGain);
        const mentGain = MENTAL_HEALTH_SOURCES[entry.activity];
        if (mentGain) mental = Math.min(100, mental + mentGain);

        // Skill effect: hp_restore_combo_day — доп. восстановление раз в день, если день комбо-день пары
        if (hpRestoreComboDayEffects.length > 0) {
          hpRestoreComboDayEffects.forEach(e => {
            const inPair = e.activityA.split(',').includes(entry.activity) || e.activityB.split(',').includes(entry.activity);
            const key = 'hrcd_' + e.activityA + '|' + e.activityB + '|' + entry.date;
            if (inPair && !restoreStreaksAppliedDates.has(key) && isComboDay(entry.date, e.activityA, e.activityB)) {
              restoreStreaksAppliedDates.add(key);
              if (e.bar === 'physical') physical = Math.min(100, physical + e.pct);
              else mental = Math.min(100, mental + e.pct);
            }
          });
        }

        // Skill effect: hp_restore_on_activity — extra restore on top of the normal gain above
        if (hpRestoreEffects.length > 0) {
          hpRestoreEffects.forEach(e => {
            if (e.activity !== entry.activity) return;
            let streakOk = true;
            if (e.requireStreak) {
              const list = activityDateListsForRestore[e.activity] || (activityDateListsForRestore[e.activity] = []);
              if (list[list.length - 1] !== entry.date) list.push(entry.date);
              streakOk = isConsecutiveStreak([...list].reverse()) >= e.requireStreak;
            }
            if (streakOk) {
              if (e.bar === 'physical') physical = Math.min(100, physical + e.pct);
              else mental = Math.min(100, mental + e.pct);
            }
          });
        }

        // Track daily kcal; apply 1 fatigue stack if day exceeds 1000 kcal
        if (entry.activity === 'calories' && entry.kcal) {
          kcalByDate[entry.date] = (kcalByDate[entry.date] || 0) + (Number(entry.kcal) || 0);
          if (kcalByDate[entry.date] >= 1000 && !calorieFatigueAppliedDates.has(entry.date) && !tryConsumeFatigueBlock(entry.date)) {
            calorieFatigueAppliedDates.add(entry.date);
            const magnitude = (8 + fatigueStack.length * 3) * fatigueMultForSource('calories');
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }

        // Walking: 8000+ steps +5% physical HP; 20000+ gives fatigue debuff instead
        if (entry.activity === 'walking' && entry.steps) {
          stepsByDate_health[entry.date] = (stepsByDate_health[entry.date] || 0) + (Number(entry.steps) || 0);
          const totalW = stepsByDate_health[entry.date];
          if (!walkingHealthAppliedDates.has(entry.date)) {
            if (totalW >= 20000 && !tryConsumeFatigueBlock(entry.date)) {
              walkingHealthAppliedDates.add(entry.date);
              const magnitude = (8 + fatigueStack.length * 3) * fatigueMultForSource('walking');
              fatigueStack.push(magnitude);
              physical = Math.max(0, physical - magnitude);
            } else if (totalW >= 8000) {
              walkingHealthAppliedDates.add(entry.date);
              physical = Math.min(100, physical + 5);
            }
          }
        }

        if (entry.activity === 'sleep' && fatigueStack.length > 0) {
          fatigueStack.pop(); // sleep removes the most recent fatigue debuff
        }
        if (entry.activity === 'sleep') lastSleepDate = entry.date; // patch 6
        if (entry.activity === 'nutrition') {
          nutritionTowardPoisonRelief += 1;
          if (nutritionTowardPoisonRelief >= 3 && poisonCount > 0) {
            nutritionTowardPoisonRelief = 0;
            poisonCount -= 1;
          }
        }
        // Skill effect: debuff_remove_on_activity — activity-triggered stack removal (e.g. "Закалка железом")
        if (fatigueRemovers.length > 0) {
          fatigueRemovers.forEach(e => {
            if (e.activity.split(',').includes(entry.activity)) {
              for (let i = 0; i < e.count && fatigueStack.length > 0; i++) fatigueStack.pop();
            }
          });
        }
        if (stressRemovers.length > 0) {
          stressRemovers.forEach(e => {
            if (e.activity.split(',').includes(entry.activity)) {
              for (let i = 0; i < e.count && stressStack.length > 0; i++) stressStack.pop();
            }
          });
        }
        // Patch 2: info overload — 200+ pages N days in a row → stress stack
        // (N = 3 + infoOverloadDaysShift, спец-скилл архимага сдвигает порог на 1 день позже)
        if (entry.activity === 'reading' && entry.pages) {
          heavyReadingByDate[entry.date] = (heavyReadingByDate[entry.date] || 0) + (Number(entry.pages) || 0);
          const d = new Date(entry.date);
          const requiredDays = 3 + infoOverloadDaysShift;
          let allQualify = true;
          for (let i = 0; i < requiredDays; i++) {
            const dayVal = heavyReadingByDate[dateKey(new Date(d.getTime() - i * 86400000))] || 0;
            if (dayVal < 200) { allQualify = false; break; }
          }
          if (allQualify && !infoOverloadAppliedDates.has(entry.date)) {
            infoOverloadAppliedDates.add(entry.date);
            const magnitude = (8 + stressStack.length * 3) * stressReductionMult;
            stressStack.push(magnitude);
            mental = Math.max(0, mental - magnitude);
          }
        }
        // Patch 7: overtraining — 6+ workouts in 7 days without any recovery → fatigue
        // (порог сдвигается overtrainingCountShift, если есть спец-скилл «Несгибаемый»)
        if (INTENSITY_ACTIVITIES.has(entry.activity) || entry.activity === 'running') {
          trainingCountByDate[entry.date] = (trainingCountByDate[entry.date] || 0) + 1;
          const d = new Date(entry.date);
          let trainCount7d = 0;
          let hasRecovery7d = false;
          for (let i = 0; i < 7; i++) {
            const key = dateKey(new Date(d.getTime() - i * 86400000));
            trainCount7d += trainingCountByDate[key] || 0;
            if (recoveryDates.has(key)) hasRecovery7d = true;
          }
          if (trainCount7d >= (6 + overtrainingCountShift) && !hasRecovery7d && !overtrainingAppliedDates.has(entry.date) && !tryConsumeFatigueBlock(entry.date)) {
            overtrainingAppliedDates.add(entry.date);
            const magnitude = (8 + fatigueStack.length * 3) * fatigueMultForSource(entry.activity);
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }
      } else if (entry._kind === 'recovery') {
        // Recovery effect depends on the type's tier (short/long/rest).
        // Base mental+physical restore, plus a proportional mental bonus equal to the sum
        // of stress stack magnitudes removed (so deep stress → bigger relief).
        const recDef = RECOVERY_TYPES[entry.type];
        const tier = RECOVERY_TIER_EFFECTS[recDef?.tier] || RECOVERY_TIER_EFFECTS.short;
        let removedMagnitude = 0;
        if (tier.targetFatigue) {
          // Remove fatigue stacks instead of stress stacks
          for (let i = 0; i < tier.stacksRemoved && fatigueStack.length > 0; i++) {
            removedMagnitude += fatigueStack.pop();
          }
          physical = Math.min(100, physical + tier.basePhysical + removedMagnitude);
          mental = Math.min(100, mental + tier.baseMental);
        } else {
          for (let i = 0; i < tier.stacksRemoved && stressStack.length > 0; i++) {
            removedMagnitude += stressStack.pop();
          }
          mental = Math.min(100, mental + tier.baseMental + removedMagnitude);
          physical = Math.min(100, physical + tier.basePhysical);
        }
      } else if (entry._kind === 'consumable') {
        // Potions: instant HP restore (+10%)
        if (entry.type === 'potion_hp') physical = Math.min(100, physical + 10);
        else if (entry.type === 'potion_mp') mental = Math.min(100, mental + 10);
      } else {
        const def = PASSIVE_TYPES[entry.type];
        if (!def) return;
        if (def.affects === 'mental') {
          const magnitude = (8 + stressStack.length * 3) * stressReductionMult; // 1st = -8%, 2nd = -11%, 3rd = -14%, ...
          stressStack.push(magnitude);
          mental = Math.max(0, mental - magnitude);
        } else if (def.affects === 'physical') {
          if (!tryConsumeFatigueBlock(entry.date)) {
            const magnitude = (8 + fatigueStack.length * 3) * fatigueMultForSource(null); // 1st = -8%, 2nd = -11%, 3rd = -14%, ...
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        } else if (def.affects === 'poison') {
          poisonCount += 1;
          if (poisonCount >= (POISON_THRESHOLD + poisonThresholdShift)) {
            poisonCount = 0;
            poisonPenaltyEvents += 1;
          }
        }
      }

      // Skill effect: hp_floor (condition 'always') — bar never drops below the granted floor
      if (physicalFloor > 0 && physical < physicalFloor) physical = physicalFloor;
      if (mentalFloor > 0 && mental < mentalFloor) mental = mentalFloor;

      // Party C: hp_floor (condition 'streaks_active') — floor только пока ВСЕ перечисленные стрики активны
      physicalStreakFloors.forEach(e => {
        if (e.streaks.every(s => isHsStreakActive(s)) && physical < e.floor) physical = e.floor;
      });
      mentalStreakFloors.forEach(e => {
        if (e.streaks.every(s => isHsStreakActive(s)) && mental < e.floor) mental = e.floor;
      });

      // Party C: hp_restore_streaks_active — восстановление раз в день, пока все перечисленные стрики активны
      if (hpRestoreStreaksActiveEffects.length > 0 && entry._kind === 'activity') {
        hpRestoreStreaksActiveEffects.forEach(e => {
          const key = 'hrsa_' + e.streaks.join(',') + '|' + entry.date;
          if (!restoreStreaksAppliedDates.has(key) && e.streaks.every(s => isHsStreakActive(s))) {
            restoreStreaksAppliedDates.add(key);
            if (e.bar === 'physical' || e.bar === 'both') physical = Math.min(100, physical + e.pct);
            if (e.bar === 'mental' || e.bar === 'both') mental = Math.min(100, mental + e.pct);
          }
        });
      }

      // Skill effect: track critical HP drops for per_good_days_periodic ("Сердце не сдаётся" / "Вечная крепость")
      if (physical <= 10 || mental <= 10) dayHadCritical = true;

      // Hysteresis: hitting 0 locks XP gain for that bar; it stays locked until the bar recovers to 50%.
      if (physical <= 0) physicalXpLocked = true;
      else if (physical >= 50) physicalXpLocked = false;
      if (mental <= 0) mentalXpLocked = true;
      else if (mental >= 50) mentalXpLocked = false;
    });
    // Finalize noCriticalDaysCount for the last processed date
    if (lastSeenDate !== null && !dayHadCritical) noCriticalDaysCount += 1;

    return {
      physical: Math.round(physical),
      mental: Math.round(mental),
      stressDebuffCount: stressStack.length,
      fatigueDebuffCount: fatigueStack.length,
      poisonCount,
      poisonPenaltyEvents,
      xpBlocked: physicalXpLocked || mentalXpLocked,
      xpBlockedByDate,
      noCriticalDaysCount,
    };
  }, [logs, passiveLogs, recoveryLogs, consumableLog, zeroActivityDays, activeSkillEffects]);

  // Character stats: walk logs chronologically, applying streak multipliers
  // and one-time cumulative-tier bonuses.
  const statTotals = useMemo(() => {
    const totals = {};
    ALL_STATS.forEach((s) => (totals[s] = 0));

    const STREAK_ACTIVITIES = new Set(['running', 'sleep', 'nutrition', 'reading']);
    const STREAK_MULTIPLIERS = { bronze: 1.25, silver: 1.5, gold: 2 };
    const CUMULATIVE_BONUS_BY_TIER_INDEX = [15, 30, 50, 75, 100, 130, 160]; // grows with each tier reached

    // ---------- Skill-effect maps (Party A engine) ----------
    // xp_mult_to_stat / xp_mult_multi_to_stat / stat_growth_rate → per (activity, stat) multiplier, additive pct stacking
    const statMultByActivityStat = {}; // `${activity}|${stat}` -> multiplier
    effectsByType('xp_mult_to_stat').forEach(e => {
      e.activity.split(',').forEach(a => {
        const key = `${a}|${e.stat}`;
        statMultByActivityStat[key] = (statMultByActivityStat[key] || 1) + e.pct / 100;
      });
    });
    effectsByType('xp_mult_multi_to_stat').forEach(e => {
      e.activities.forEach(a => {
        const key = `${a}|${e.stat}`;
        statMultByActivityStat[key] = (statMultByActivityStat[key] || 1) + e.pct / 100;
      });
    });
    effectsByType('stat_growth_rate').forEach(e => {
      const key = `${e.activity}|${e.stat}`;
      statMultByActivityStat[key] = (statMultByActivityStat[key] || 1) + e.pct / 100;
    });

    const comboDayMultEffects = effectsByType('xp_mult_combo_day'); // {activityA, activityB, pct} → whole-log multiplier
    const comboDayMultiStatEffects = effectsByType('xp_mult_combo_day_multi'); // {activities[], stat, pct} → per-stat multiplier
    const hpCondEffects = effectsByType('conditional_xp_mult_hp'); // {bar, threshold, pct, activity} — uses FINAL healthState bar value (simplification)
    const achievementBoosts = effectsByType('achievement_xp_boost'); // {scope, pct}
    const poisonReductionPct = effectsByType('debuff_reduction').filter(e => e.debuff === 'poison').reduce((a, e) => a + e.pct, 0);

    // ---------- Party C: комбо-путь / специализация — доп. карты эффектов ----------
    // xp_mult_to_stat с stat==='ALL_OF_ACTIVITY' — множитель ко ВСЕМ статам активности (не к конкретному стату)
    const wildcardActivityMult = {}; // activity -> multiplier
    effectsByType('xp_mult_to_stat').forEach(e => {
      if (e.stat === 'ALL_OF_ACTIVITY') {
        e.activity.split(',').forEach(a => {
          wildcardActivityMult[a] = (wildcardActivityMult[a] || 1) + e.pct / 100;
        });
      }
    });
    // spec_master.permaPct — тоже общий множитель ко всей активности, складываем в ту же карту
    effectsByType('spec_master').forEach(e => {
      e.activity.split(',').forEach(a => {
        wildcardActivityMult[a] = (wildcardActivityMult[a] || 1) + (e.permaPct || 0) / 100;
      });
    });
    const conditionalXpMultEffects = effectsByType('conditional_xp_mult'); // {activity, streakActivity, pct}
    const conditionalXpMultMultiEffects = effectsByType('conditional_xp_mult_multi'); // {activity:'all', streaks:[], pct}

    function baseXpFor(log) {
      // --- ЧИСЛОВЫЕ АКТИВНОСТИ: нулевое значение = 0 XP ---
      if (log.activity === 'running') {
        const dist = Number(log.distance) || 0;
        if (dist <= 0) return 0;
        // 6–14 XP по дистанции: 6 за 1км, +1 за каждые 1.5км, макс 14 (12км+)
        return Math.round(Math.min(14, 6 + dist * 0.65));
      }
      if (log.activity === 'reading') {
        const pages = Number(log.pages) || 0;
        if (pages <= 0) return 0;
        if (pages < 20)  return 0;  // < 20 стр — не активность, только стрик засчитается
        if (pages < 50)  return 2;  // лёгкая глава перед сном
        if (pages < 100) return 6;  // нормальная сессия
        return 8;                    // 100+ стр — серьёзная дисциплина / вершина (единый верхний брекет)
      }
      if (log.activity === 'calories') {
        const kcal = Number(log.kcal) || 0;
        if (kcal <= 0) return 0;
        // +1 XP за каждые 300 ккал, мин 1, макс 8
        const brackets = Math.floor(kcal / 300);
        return Math.min(8, Math.max(1, 1 + brackets));
      }
      if (log.activity === 'walking') {
        const steps = Number(log.steps) || 0;
        if (steps < 3000) return 0; // ниже минимального порога
        // XP = шаги/1000 × BASE_STEPS_XP_MULTIPLIER, с затуханием ×0.2 выше 20000 (перегрузка)
        const normalSteps = Math.min(steps, 20000);
        const overSteps = Math.max(0, steps - 20000);
        return Math.round(normalSteps / 1000 * BASE_STEPS_XP_MULTIPLIER + overSteps / 1000 * BASE_STEPS_XP_MULTIPLIER * 0.2);
      }
      // --- ТРЕНИРОВКИ: базовый XP зависит от интенсивности (лёгкая/средняя/тяжёлая) ---
      // Старые логи без поля intensity считаются как 'medium' для обратной совместимости.
      if (INTENSITY_ACTIVITIES.has(log.activity)) {
        const level = INTENSITY_LEVELS[log.intensity] || INTENSITY_LEVELS.medium;
        return level.xp;
      }
      // --- ПАССИВНЫЕ: ежедневные, меньше XP за раз ---
      if (log.activity === 'nutrition') return 4;
      if (log.activity === 'sleep') return 5;
      return 4;
    }

    function streakMultiplierFor(activity, streakLenAtThisLog) {
      if (!STREAK_ACTIVITIES.has(activity)) return 1;
      const ach = ACHIEVEMENTS.find((a) => a.kind === 'streak' && a.activity === activity);
      if (!ach) return 1;
      let tierName = null;
      ach.tiers.forEach((t) => {
        if (streakLenAtThisLog >= t.need) tierName = t.tier;
      });
      return tierName ? (activity === 'reading' && tierName === 'gold' ? 1.5 : (STREAK_MULTIPLIERS[tierName] || 1)) : 1;
    }

    // Sort logs chronologically (oldest first) per activity, so we can replay streaks and cumulative counts.
    const sortedAsc = [...logs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

    // --- НЕДЕЛЬНЫЙ СТРИК СИЛОВОЙ/БОРЬБЫ ---
    // Компенсирует отсутствие ежедневных стриков у силовых активностей (силовая/борьба).
    // Условие: если в 2 предыдущих неделях (Пн-Вс) было ≥3 силовых+борьбы каждую,
    // то в текущей неделе все силовые/борьба получают +25% XP.
    const trainingsPerWeek = {}; // weekKey (Monday date) -> count of strength/wrestling logs
    logs.forEach((l) => {
      if (INTENSITY_ACTIVITIES.has(l.activity)) {
        const wk = getWeekKey(l.date);
        trainingsPerWeek[wk] = (trainingsPerWeek[wk] || 0) + 1;
      }
    });
    function isQualifyingTrainingWeek(weekKey) {
      const d = new Date(weekKey);
      for (let i = 1; i <= 2; i++) {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 7 * i);
        const prevKey = dateKey(prev);
        if ((trainingsPerWeek[prevKey] || 0) < 3) return false;
      }
      return true;
    }

    // Track running per-activity state as we replay history
    const dateHistoryByActivity = {}; // activity -> array of unique dates seen so far, ascending
    const countSoFarByActivity = {}; // activity -> cumulative count of logs so far
    const distanceSoFarByActivity = {}; // activity -> cumulative distance so far (running)
    const kcalSoFar = { calories: 0 }; // cumulative kcal burned
    const pagesSoFar = { reading: 0 }; // cumulative pages read
    const cumulativeTierReachedByAchievement = {}; // achievementId -> highest tier index already paid out

    Object.keys(ACTIVITY_TYPES).forEach((k) => {
      dateHistoryByActivity[k] = [];
      countSoFarByActivity[k] = 0;
      distanceSoFarByActivity[k] = 0;
    });

    // Party C: "активный стрик" для conditional_xp_mult / conditional_xp_mult_multi.
    // Использует dateHistoryByActivity, который на момент обработки текущего лога уже содержит
    // ВСЕ даты csv-группы вплоть до текущей (даты идут по возрастанию — sortedAsc), что даёт
    // корректное приближение "стрик активен на дату лога". csv может быть 'strength_park,strength_gym'.
    function isStreakActiveForActivity(csv) {
      const acts = csv.split(',');
      const merged = [...new Set(acts.flatMap(a => dateHistoryByActivity[a] || []))].sort();
      if (merged.length === 0) return false;
      return isConsecutiveStreak([...merged].reverse()) >= 2;
    }

    sortedAsc.forEach((log) => {
      const def = ACTIVITY_TYPES[log.activity];
      if (!def) return;

      // Update running date history for this activity (unique dates only)
      const dates = dateHistoryByActivity[log.activity];
      if (dates[dates.length - 1] !== log.date) dates.push(log.date);

      // Streak length as of this log: consecutive days counting backward from this log's date
      const datesDesc = [...dates].reverse();
      const streakLen = isConsecutiveStreak(datesDesc);

      // Cumulative counters as of this log (this log included)
      countSoFarByActivity[log.activity] += 1;
      const cumulativeCount = countSoFarByActivity[log.activity];
      distanceSoFarByActivity[log.activity] += Number(log.distance) || 0;
      const cumulativeDistance = distanceSoFarByActivity[log.activity];
      if (log.activity === 'calories') kcalSoFar.calories += Number(log.kcal) || 0;
      if (log.activity === 'reading') pagesSoFar.reading += Number(log.pages) || 0;

      const base = baseXpFor(log);

      // Числовые активности с нулевым вводом — пропускаем XP и статы полностью
      if (base === 0) return;

      const multiplier = streakMultiplierFor(log.activity, streakLen);
      const blocked = healthState.xpBlockedByDate[log.date];

      // Determine the class (single or combo) as of *before* this log, using the level implied
      // by stats accumulated so far, then apply its bonus if this activity belongs to it.
      const xpSoFar = Object.values(totals).reduce((a, b) => a + b, 0);
      const levelSoFar = levelFromTotalXp(xpSoFar);
      const resolvedClass = resolveCharacterClass(totals, levelSoFar, comboClassId);
      let classBonus = 1;
      if (resolvedClass) {
        if (resolvedClass.combo) {
          const inA = resolvedClass.classA.activities.includes(log.activity);
          const inB = resolvedClass.classB.activities.includes(log.activity);
          if (inA || inB) classBonus = 1 + COMBO_CLASS_XP_BONUS;
        } else if (CLASS_BY_ACTIVITY[log.activity] === resolvedClass.id) {
          classBonus = 1 + CLASS_XP_BONUS;
        }
      }

      // Equipped shop items can grant a flat XP% bonus to a specific activity, or to all activities ('all').
      // Class-restricted items only grant their bonus when the player's locked class matches the requirement.
      // If the player is locked into a different class, the item stays equipped but its bonus is inactive
      // (they can sell it back at SHOP_REFUND_RATE via the shop UI).
      let shopBonusPct = 0;
      let activeSlotsCount = 0;
      Object.values(equippedShopItems).forEach((itemId) => {
        if (!itemId) return;
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item || !item.bonus) return;
        const isClassItem = item.requirement?.type === 'class';
        const classItemInactive = isClassItem && lockedClassId && lockedClassId !== item.requirement.id;
        if (classItemInactive) return; // equipped but bonus dormant
        activeSlotsCount += 1;
        // Одиночный или мульти-актив XP-бонус (с учётом полировки/перековки)
        const effBonus = getEffectiveBonus(item);
        if (effBonus?.xpBonusPct) {
          const acts = effBonus.activities || (effBonus.activity ? [effBonus.activity] : []);
          if (acts.includes('all') || acts.includes(log.activity)) {
            shopBonusPct += effBonus.xpBonusPct;
          }
        }
      });

      // Full gear set bonus: +15% XP to all activities when all 6 slots are filled with ACTIVE items
      if (activeSlotsCount === SHOP_SLOTS.length) shopBonusPct += 15;

      const shopBonus = 1 + shopBonusPct / 100;

      // Weekly training streak bonus: +25% XP to strength/wrestling logs in a qualifying week
      // (previous 2 weeks each had ≥3 strength/wrestling logs). Compensates for the lack of
      // daily streak multipliers on these activities.
      let weeklyTrainingBonus = 1;
      if (INTENSITY_ACTIVITIES.has(log.activity) && isQualifyingTrainingWeek(getWeekKey(log.date))) {
        weeklyTrainingBonus = 1.25;
      }

      // Morning ritual bonus: +5% XP for all activities logged on the day the ritual was performed
      const ritualDone = (morningRitualLog || []).some(r => r.date === log.date);
      const ritualBonus = ritualDone ? 1.05 : 1;

      // Challenge buff: +X% XP if log date is within the buff period
      let challengeBuffMult = 1;
      const cBuff = challengeState.activeBuff;
      if (cBuff && cBuff.expiresDate) {
        const buffStart = new Date(cBuff.expiresDate);
        buffStart.setDate(buffStart.getDate() - cBuff.days);
        const logD = new Date(log.date);
        if (logD >= buffStart && logD <= new Date(cBuff.expiresDate)) {
          const scopeMatch = cBuff.scope === 'all' ||
            (cBuff.scope === 'running' && log.activity === 'running') ||
            (cBuff.scope === 'reading' && log.activity === 'reading') ||
            (cBuff.scope === 'strength' && (log.activity === 'strength_park' || log.activity === 'strength_gym')) ||
            (cBuff.scope === 'strength_wrestling' && (log.activity === 'strength_park' || log.activity === 'strength_gym' || log.activity === 'wrestling'));
          if (scopeMatch) challengeBuffMult = 1 + (cBuff.xpBonusPct / 100);
        }
      }

      // Challenge fail debuff: −10% XP for 3 days after failure
      let challengeDebuffMult = 1;
      (challengeState.failed || []).forEach(f => {
        const failDate = new Date(f.failedDate);
        const logD = new Date(log.date);
        const diffDays = Math.floor((logD - failDate) / 86400000);
        if (diffDays >= 0 && diffDays < CHALLENGE_FAIL_DEBUFF_DAYS) challengeDebuffMult = 0.90;
      });

      // Unomie debuff (raid defeat): −10% XP for raidDays after defeat
      let unomieDebuffMult = 1;
      if (unomieDebuff?.xpPenaltyExpiresDate) {
        const logD = new Date(log.date);
        const expires = new Date(unomieDebuff.xpPenaltyExpiresDate);
        // penalty applies from the day it was set until expiry
        if (logD <= expires) unomieDebuffMult = 0.90;
      }

      // Road story buffs: check all active buffs on the log date
      let roadBuffMult = 1;
      (roadStoryState.activeBuffs || []).forEach(b => {
        const logD = new Date(log.date);
        const expires = new Date(b.expiresDate);
        const started = new Date(expires); started.setDate(started.getDate() - (b.days || 1));
        if (logD >= started && logD <= expires) {
          const scopeMatch = b.scope === 'all' ||
            (b.scope === 'running' && log.activity === 'running') ||
            (b.scope === 'reading' && log.activity === 'reading') ||
            (b.scope === 'nutrition' && log.activity === 'nutrition') ||
            (b.scope === 'sleep' && log.activity === 'sleep') ||
            (b.scope === 'wrestling' && log.activity === 'wrestling') ||
            (b.scope === 'strength' && (log.activity === 'strength_park' || log.activity === 'strength_gym'));
          if (scopeMatch) roadBuffMult *= (1 + (b.xpBonusPct / 100));
        }
      });

      // Свиток опыта: +15% XP на 24ч. НЕ стакается с баффом вызова — берём больший из двух.
      let scrollBonusMult = 1;
      if (scrollActive?.expiresDate) {
        const logD = new Date(log.date);
        const expires = new Date(scrollActive.expiresDate);
        const started = new Date(expires); started.setDate(started.getDate() - 1);
        if (logD >= started && logD <= expires) scrollBonusMult = 1 + (scrollActive.pct / 100);
      }
      const challengeOrScrollMult = Math.max(challengeBuffMult, scrollBonusMult);

      let xpForThisLog = blocked ? 0 : base * multiplier * classBonus * shopBonus * weeklyTrainingBonus * ritualBonus * challengeOrScrollMult * challengeDebuffMult * unomieDebuffMult * roadBuffMult;

      // Skill effect: wildcard xp_mult_to_stat (ALL_OF_ACTIVITY) / spec_master permaPct — whole-log multiplier for this activity
      if (!blocked && wildcardActivityMult[log.activity]) {
        xpForThisLog *= wildcardActivityMult[log.activity];
      }

      // Skill effect: xp_mult_combo_day — % bonus to the whole log's XP when both paired activities are logged same day
      // (onlyActivity, если задан, ограничивает бонус только логами этой конкретной активности)
      if (!blocked && comboDayMultEffects.length > 0) {
        comboDayMultEffects.forEach(e => {
          const inA = e.activityA.split(',').includes(log.activity);
          const inB = e.activityB.split(',').includes(log.activity);
          const onlyOk = !e.onlyActivity || e.onlyActivity === log.activity;
          if ((inA || inB) && onlyOk && isComboDay(log.date, e.activityA, e.activityB)) {
            xpForThisLog *= (1 + e.pct / 100);
          }
        });
      }

      // Skill effect: conditional_xp_mult — % bonus when a DIFFERENT activity's streak is currently active
      if (!blocked && conditionalXpMultEffects.length > 0) {
        conditionalXpMultEffects.forEach(e => {
          if (e.activity.split(',').includes(log.activity) && isStreakActiveForActivity(e.streakActivity)) {
            xpForThisLog *= (1 + e.pct / 100);
          }
        });
      }

      // Skill effect: conditional_xp_mult_multi — % bonus to everything while ALL listed streaks are active
      if (!blocked && conditionalXpMultMultiEffects.length > 0) {
        conditionalXpMultMultiEffects.forEach(e => {
          const activityMatch = e.activity === 'all' || e.activity.split(',').includes(log.activity);
          if (activityMatch && e.streaks.every(s => isStreakActiveForActivity(s))) {
            xpForThisLog *= (1 + e.pct / 100);
          }
        });
      }

      // Skill effect: conditional_xp_mult_hp — simplified to use the FINAL healthState bar value (not per-date)
      if (!blocked && hpCondEffects.length > 0) {
        hpCondEffects.forEach(e => {
          const barVal = e.bar === 'physical' ? healthState.physical : healthState.mental;
          const activityMatch = e.activity === 'all' || e.activity.split(',').includes(log.activity);
          if (activityMatch && barVal > e.threshold) xpForThisLog *= (1 + e.pct / 100);
        });
      }

      // Cumulative tier tracking (cosmetic milestones only — no XP/stat bonus).
      // Tier progression is still tracked for the achievement UI and toast notifications.
      ACHIEVEMENTS.forEach((ach) => {
        if (ach.kind !== 'cumulative_count' && ach.kind !== 'cumulative_value' && ach.kind !== 'cal_cumulative' && ach.kind !== 'cumulative_pages') return;
        const matchesActivity = Array.isArray(ach.activity) ? ach.activity.includes(log.activity) : ach.activity === log.activity;
        if (!matchesActivity) return;

        const measured = ach.kind === 'cumulative_value' ? cumulativeDistance
          : ach.kind === 'cal_cumulative' ? kcalSoFar.calories
          : ach.kind === 'cumulative_pages' ? pagesSoFar.reading
          : cumulativeCount;

        let crossedTierIdx = -1;
        ach.tiers.forEach((t, idx) => {
          if (measured >= t.need) crossedTierIdx = idx;
        });

        if (crossedTierIdx >= 0) {
          const alreadyPaid = cumulativeTierReachedByAchievement[ach.id] ?? -1;
          if (crossedTierIdx > alreadyPaid) {
            // No XP/stat bonus — cumulative achievements are cosmetic milestones.
            // Stat rewards come exclusively from repeatable combo achievements (Тройной удар, Пента и т.д.).
            cumulativeTierReachedByAchievement[ach.id] = crossedTierIdx;
          }
        }
      });

      def.stats.forEach((s) => {
        // Skill effect: xp_mult_to_stat / xp_mult_multi_to_stat / stat_growth_rate — per-stat multiplier
        const statMult = statMultByActivityStat[`${log.activity}|${s}`] || 1;
        let statXp = xpForThisLog * statMult;
        // Skill effect: xp_mult_combo_day_multi — extra % into a SPECIFIC stat when all N activities logged same day
        if (!blocked && comboDayMultiStatEffects.length > 0) {
          comboDayMultiStatEffects.forEach(e => {
            if (s === e.stat && e.activities.includes(log.activity) && isComboDayMulti(log.date, e.activities)) {
              statXp *= (1 + e.pct / 100);
            }
          });
        }
        totals[s] += statXp;
      });
    });

    // ---------- Skill effects: periodic / one-time / combo-flat bonuses (Party A engine) ----------
    function addStats(target, amount) {
      if (typeof target === 'string') return; // guarded by caller
      Object.entries(target).forEach(([stat, amt]) => {
        if (totals[stat] !== undefined) totals[stat] += amt * amount;
      });
    }

    effectsByType('per_distance_periodic').forEach(e => {
      const total = distanceSoFarByActivity[e.activity] || 0;
      const times = Math.floor(total / e.per);
      if (times <= 0) return;
      if (e.stat) totals[e.stat] += times * e.amount;
      if (e.stats) addStats(e.stats, times);
    });

    effectsByType('per_pages_periodic').forEach(e => {
      const total = pagesSoFar.reading || 0;
      const times = Math.floor(total / e.per);
      if (times <= 0) return;
      if (e.stat) totals[e.stat] += times * e.amount;
      if (e.stats) addStats(e.stats, times);
    });

    effectsByType('per_count_periodic').forEach(e => {
      const acts = e.activity.split(',');
      const total = acts.reduce((sum, a) => sum + (countSoFarByActivity[a] || 0), 0);
      const times = Math.floor(total / e.per);
      if (times <= 0) return;
      if (e.stat) totals[e.stat] += times * e.amount;
      if (e.stats) addStats(e.stats, times);
    });

    const finishedBooksCount = books.filter(b => b.finished).length;
    effectsByType('per_book_stat').forEach(e => {
      if (totals[e.stat] !== undefined) totals[e.stat] += finishedBooksCount * e.amount;
    });
    effectsByType('per_book_periodic').forEach(e => {
      const times = Math.floor(finishedBooksCount / e.per);
      if (times <= 0) return;
      if (e.stat) totals[e.stat] += times * e.amount;
      if (e.stats) addStats(e.stats, times);
    });

    effectsByType('per_week_count_periodic').forEach(e => {
      const perWeek = {};
      logs.forEach(l => { if (l.activity === e.activity) perWeek[getWeekKey(l.date)] = (perWeek[getWeekKey(l.date)] || 0) + 1; });
      const qualifyingWeeks = Object.values(perWeek).filter(c => c >= e.per).length;
      if (qualifyingWeeks > 0 && totals[e.stat] !== undefined) totals[e.stat] += qualifyingWeeks * e.amount;
    });

    effectsByType('per_combo_days_periodic').forEach(e => {
      const days = e.activities.length >= 3 ? allComboDaysMultiFor(e.activities) : allComboDaysFor(e.activities[0], e.activities[1]);
      const times = Math.floor(days.length / e.per);
      if (times > 0 && e.stats) addStats(e.stats, times);
    });

    effectsByType('per_good_days_periodic').forEach(e => {
      const times = Math.floor((healthState.noCriticalDaysCount || 0) / e.per);
      if (times > 0 && e.stats) addStats(e.stats, times);
    });

    effectsByType('streak_once').forEach(e => {
      const measured = e.byCount ? totalLogCountFor(e.activity) : maxStreakEver(e.activity);
      if (measured >= e.days && e.stats) addStats(e.stats, 1);
    });

    effectsByType('streak_once_any').forEach(e => {
      const qualifies = e.activities.some(a => maxStreakEver(a) >= e.days);
      if (qualifies && e.stats) addStats(e.stats, 1);
    });

    effectsByType('combo_day_stat_bonus').forEach(e => {
      const days = allComboDaysFor(e.activityA, e.activityB);
      if (days.length > 0 && e.stats) addStats(e.stats, days.length);
    });

    effectsByType('combo_day_stat_bonus_multi').forEach(e => {
      const days = allComboDaysMultiFor(e.activities);
      if (days.length > 0 && e.stats) addStats(e.stats, days.length);
    });

    effectsByType('combo_week_stat_bonus').forEach(e => {
      const days = allComboDaysFor(e.activityA, e.activityB);
      const weeks = new Set(days.map(d => getWeekKey(d)));
      if (weeks.size > 0 && e.stats) addStats(e.stats, weeks.size);
    });

    effectsByType('xp_flat_bonus_combo_day').forEach(e => {
      const days = allComboDaysFor(e.activityA, e.activityB);
      if (days.length > 0 && totals[e.stat] !== undefined) totals[e.stat] += days.length * e.amount;
    });

    // ---------- Party C: комбо-путь / специализация — разовые/паттерн-бонусы ----------
    // combo_days_once использует ПАРУ активностей самого выбранного комбо-класса (comboClassId), а не
    // произвольную пару из effect-объекта — так задумано в спеке (totalComboDays(comboId)).
    effectsByType('combo_days_once').forEach(e => {
      if (!comboClassId) return;
      const [idA, idB] = comboClassId.split('|');
      const actA = (CHARACTER_CLASSES.find(c => c.id === idA)?.activities || []).join(',');
      const actB = (CHARACTER_CLASSES.find(c => c.id === idB)?.activities || []).join(',');
      const days = allComboDaysFor(actA, actB);
      if (days.length >= e.days && e.stats) addStats(e.stats, 1);
    });

    effectsByType('combo_streak_once').forEach(e => {
      const days = allComboDaysFor(e.activityA, e.activityB).sort();
      let max = 0, run = 0, prev = null;
      days.forEach(d => {
        if (prev) {
          const diff = Math.round((new Date(d) - new Date(prev)) / 86400000);
          run = diff === 1 ? run + 1 : 1;
        } else run = 1;
        max = Math.max(max, run);
        prev = d;
      });
      if (max >= e.days && e.stats) addStats(e.stats, 1);
    });

    effectsByType('weekly_pattern_once').forEach(e => {
      const perWeekA = {}, perWeekB = {};
      const actsA = e.activityA.split(',');
      const actsB = e.activityB.split(',');
      logs.forEach(l => {
        const wk = getWeekKey(l.date);
        if (actsA.includes(l.activity)) perWeekA[wk] = (perWeekA[wk] || 0) + 1;
        if (actsB.includes(l.activity)) perWeekB[wk] = (perWeekB[wk] || 0) + 1;
      });
      const qualifies = Object.keys({ ...perWeekA, ...perWeekB }).some(wk => (perWeekA[wk] || 0) >= e.perA && (perWeekB[wk] || 0) >= e.perB);
      if (qualifies && e.stats) addStats(e.stats, 1);
    });

    effectsByType('cumulative_once').forEach(e => {
      const measured = e.metric === 'pages' ? (pagesSoFar.reading || 0) : (distanceSoFarByActivity[e.activity] || 0);
      if (measured >= e.threshold && e.stats) addStats(e.stats, 1);
    });

    // spec_master: разовый бонус при достижении count (по логам / по стрику / по книгам, см. флаги)
    effectsByType('spec_master').forEach(e => {
      let measured;
      if (e.byBooks) measured = finishedBooksCount;
      else if (e.byStreak) measured = maxStreakEver(e.activity);
      else measured = totalLogCountFor(e.activity);
      if (measured >= e.count && e.onceStats) addStats(e.onceStats, 1);
    });

    // Round all stat totals to whole numbers
    Object.keys(totals).forEach((s) => (totals[s] = Math.round(totals[s])));

    // Apply flat penalty from accumulated overeating ("poison") events: -10 XP per stat, per event
    const penalty = healthState.poisonPenaltyEvents * POISON_PENALTY_PER_STAT * Math.max(0, 1 - poisonReductionPct / 100);
    if (penalty > 0) {
      Object.keys(totals).forEach((s) => (totals[s] = Math.max(0, totals[s] - penalty)));
    }

    // Apply flat combo achievement rewards ("Тройной удар" triggers)
    Object.entries(comboResults.totalRewards).forEach(([stat, amount]) => {
      if (totals[stat] !== undefined) totals[stat] += amount;
    });

    // Apply "Баланс" achievement rewards
    Object.entries(balanceResults.totalRewards).forEach(([stat, amount]) => {
      if (totals[stat] !== undefined) totals[stat] += amount;
    });

    // Apply mythic achievement rewards (one-time, 'all' key applies to every stat)
    mythicAchievementsEvaluated.forEach((m) => {
      if (!m.unlocked) return;
      Object.entries(m.rewards).forEach(([stat, amount]) => {
        if (stat === 'all') {
          Object.keys(totals).forEach((s) => (totals[s] += amount));
        } else if (totals[stat] !== undefined) {
          totals[stat] += amount;
        }
      });
    });

    // Apply ПЕНТА-УДАР rewards.
    // "Легенда своего Сити" — decaying tiered reward per qualifying day (see pentaResults comment).
    // "Бог нового мира" — flat +30 to all stats, once when the 5-day perfect streak is achieved.
    if (pentaResults.legendXpPerStat > 0) {
      Object.keys(totals).forEach((s) => (totals[s] += pentaResults.legendXpPerStat));
    }
    if (pentaResults.godUnlocked) {
      Object.keys(totals).forEach((s) => (totals[s] += 30));
    }

    // Apply morning ritual stat bonuses (+1 to target stat per ritual done)
    (morningRitualLog || []).forEach(r => {
      const ritual = MORNING_RITUALS.find(m => m.id === r.ritualId);
      if (ritual && totals[ritual.stat] !== undefined) {
        totals[ritual.stat] += 1;
      }
    });

    // Apply raid victory loot stat bonuses — from both open raids and archive
    const allVictoryRaids = [
      ...Object.entries(raids).filter(([, r]) => r?.status === 'victory').map(([bId, r]) => ({ bossId: bId, startClassId: r.startClassId })),
      ...raidArchive.filter(e => e.result === 'victory').map(e => ({ bossId: e.bossId, startClassId: null })),
    ];
    // Deduplicate by bossId (same boss can only grant stat bonus once)
    const seenBossIds = new Set();
    allVictoryRaids.forEach(({ bossId, startClassId }) => {
      if (seenBossIds.has(bossId)) return;
      seenBossIds.add(bossId);
      const loot = RAID_LOOT_BY_CLASS[bossId]?.[startClassId || 'pathfinder'];
      if (!loot) return;
      Object.entries(loot.stats).forEach(([stat, amount]) => {
        if (totals[stat] !== undefined) totals[stat] += amount;
      });
    });

    // Apply books_finished tier reward — only the HIGHEST reached tier is applied
    // (tiers no longer stack; each tier replaces the previous one).
    const bookAch = ACHIEVEMENTS.find(a => a.id === 'reading_books');
    if (bookAch) {
      const finishedCount = books.filter(b => b.finished).length;
      let highestReachedTier = null;
      bookAch.tiers.forEach(tier => {
        if (finishedCount >= tier.need && tier.rewards) highestReachedTier = tier;
      });
      if (highestReachedTier) {
        Object.entries(highestReachedTier.rewards).forEach(([stat, amount]) => {
          if (totals[stat] !== undefined) totals[stat] += amount;
        });
      }
    }

    // Apply unlocked secret achievement rewards (one-time flat stat bonuses; only secrets with a `rewards` field grant stats)
    secretAchievementsEvaluated.forEach((s) => {
      if (!s.unlocked || !s.rewards) return;
      Object.entries(s.rewards).forEach(([stat, amount]) => {
        if (totals[stat] !== undefined) totals[stat] += amount;
      });
    });

    return totals;
  }, [logs, healthState.poisonPenaltyEvents, healthState.xpBlockedByDate, healthState.noCriticalDaysCount, healthState.physical, healthState.mental, comboResults.totalRewards, balanceResults.totalRewards, mythicAchievementsEvaluated, pentaResults.legendXpPerStat, pentaResults.godUnlocked, equippedShopItems, raids, raidArchive, books, lockedClassId, comboClassId, secretAchievementsEvaluated, morningRitualLog, challengeState, unomieDebuff, activeSkillEffects, scrollActive, polishedItemIds, itemBonusOverrides]);

  // Currency ("Кристаллы"): a percentage of total accumulated stat XP, plus a small passive
  // trickle from the same total. Recalculated whenever statTotals changes; spending is tracked
  // separately via the `spentCurrency` state below.
  const totalStatXp = useMemo(() => Object.values(statTotals).reduce((a, b) => a + b, 0), [statTotals]);

  // Calories don't raise stats, so crystals from them are computed separately
  const calorieCrystals = useMemo(() => {
    return Math.floor(
      (logsByActivity.calories || []).reduce((sum, l) => {
        const kcal = Number(l.kcal) || 0;
        if (kcal <= 0) return sum;
        const brackets = Math.floor(kcal / 300);
        const xp = Math.min(8, Math.max(1, 1 + brackets));
        return sum + xp;
      }, 0) * (XP_TO_CURRENCY_RATE + PASSIVE_CURRENCY_RATE)
    );
  }, [logsByActivity]);

  // Steps crystals: threshold-based per day (5k→5, 8k→10, 12k+→15, cap 15 even in decay zone 15-20k)
  const stepsCrystals = useMemo(() => {
    const byDate = {};
    (logsByActivity.walking || []).forEach(l => {
      const s = Number(l.steps) || 0;
      if (s < 3000) return;
      byDate[l.date] = (byDate[l.date] || 0) + s;
    });
    return Object.values(byDate).reduce((sum, total) => {
      if (total >= 12000) return sum + 15;
      if (total >= 8000)  return sum + 10;
      if (total >= 5000)  return sum + 5;
      return sum;
    }, 0);
  }, [logsByActivity]);

  const shopCrystalPct = useMemo(() => {
    let pct = 0;
    Object.values(equippedShopItems).forEach((itemId) => {
      if (!itemId) return;
      const item = ALL_ITEMS().find((i) => i.id === itemId);
      const effBonus = getEffectiveBonus(item);
      if (!effBonus?.crystalPct) return;
      const isClassItem = item.requirement?.type === 'class';
      if (isClassItem && lockedClassId && lockedClassId !== item.requirement.id) return; // dormant
      pct += effBonus.crystalPct;
    });
    return pct;
  }, [equippedShopItems, lockedClassId, polishedItemIds, itemBonusOverrides]);

  const currencyEarned = useMemo(() => {
    const baseCrystals = Math.floor(totalStatXp * (XP_TO_CURRENCY_RATE + PASSIVE_CURRENCY_RATE)) + calorieCrystals + stepsCrystals;
    return Math.floor(baseCrystals * (1 + shopCrystalPct / 100));
  }, [totalStatXp, calorieCrystals, stepsCrystals, shopCrystalPct]);
  const currencyBalance = Math.max(0, currencyEarned - spentCurrency);

  // Apply raid defeat penalties. The penalty scales by boss rarity — see RAID_DEFEAT_PENALTY_BY_RARITY.
  const raidPenalizedHealth = useMemo(() => {
    let physical = healthState.physical;
    let mental = healthState.mental;
    // Skill effect: raid_penalty_reduction — take the single best reduction, doesn't stack
    const raidReductionPct = effectsByType('raid_penalty_reduction').reduce((max, e) => Math.max(max, e.pct), 0);
    const raidReductionMult = Math.max(0, 1 - raidReductionPct / 100);
    RAID_BOSSES.forEach((boss) => {
      const raid = raids[boss.id];
      if (raid?.status === 'defeat' && !raid.defeatPenaltyApplied) {
        const penalty = (RAID_DEFEAT_PENALTY_BY_RARITY[boss.rarity] || 50) * raidReductionMult;
        physical = Math.max(0, physical - penalty);
        mental = Math.max(0, mental - penalty);
      }
    });
    return { ...healthState, physical: Math.round(physical), mental: Math.round(mental) };
  }, [healthState, raids, activeSkillEffects]);

  const levelState = useMemo(() => {
    const xp = Object.values(statTotals).reduce((a, b) => a + b, 0);
    const level = levelFromTotalXp(xp);
    const currentLevelXp = totalXpForLevel(level);
    const nextLevelXp = level < MAX_LEVEL ? totalXpForLevel(level + 1) : currentLevelXp;
    const xpIntoLevel = xp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progressPct = level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
    const titleEntry = titleEntryForLevel(level);
    return {
      level,
      totalXp: xp,
      title: titleEntry ? titleEntry.title : '',
      titleIcon: titleEntry ? titleEntry.icon : Sparkles,
      titleColor: titleEntry ? titleEntry.color : '#e0a868',
      xpIntoLevel,
      xpNeededForLevel,
      progressPct,
      isMaxLevel: level >= MAX_LEVEL,
    };
  }, [statTotals]);

  // Синхронизируем levelRef для buildSnapshot (читается при каждом авто-сохранении)
  useEffect(() => {
    if (levelState?.level) levelRef.current = levelState.level;
  }, [levelState?.level]);

  // Уведомление о повышении уровня
  useEffect(() => {
    if (!selectedNickname || !levelState?.level) return;
    const cur = levelState.level;
    if (prevLevelRef.current === null) { prevLevelRef.current = cur; return; }
    if (cur > prevLevelRef.current) {
      const titleEntry = titleEntryForLevel(cur);
      const titleText = titleEntry ? ` Новый титул: «${titleEntry.title}»` : '';
      dbSendMessage('__system__', selectedNickname,
        `⚡ Уровень ${cur} достигнут!${titleText} Продолжай в том же духе.`,
        'Внутренний голос', 'level_up');
    }
    prevLevelRef.current = cur;
  }, [levelState?.level, selectedNickname]);

  // Сохраняем current_level при его изменении И при каждом входе
  useEffect(() => {
    if (!selectedNickname || !levelState?.level) return;
    dbSavePlayer(selectedNickname, { current_level: levelState.level });
  }, [levelState?.level, selectedNickname]);

  // Collect all earned titles (depends on levelState, so must come after it)
  const earnedTitles = useMemo(() => {
    const titles = [];
    LEVEL_TITLES.forEach((t) => {
      if (levelState.level >= t.from) titles.push({ id: 'lvl_' + t.from, text: t.title, source: `Уровень ${t.from}`, color: t.color });
    });
    COMBO_ACHIEVEMENTS.forEach((c) => {
      if ((comboResults.countsById[c.id] || 0) > 0)
        titles.push({ id: 'combo_' + c.id, text: c.title, source: 'Комбо-ачивка', color: '#f0d272' });
    });
    BALANCE_ACHIEVEMENTS.forEach((b) => {
      if ((balanceResults.countsById[b.id] || 0) > 0)
        titles.push({ id: 'balance_' + b.id, text: b.title, source: 'Баланс', color: '#4ce0c0' });
    });
    if (pentaResults.legendCount > 0) titles.push({ id: 'penta_legend', text: 'Легенда своего Сити', source: 'Пента-удар', color: '#f5c84a' });
    if (pentaResults.godUnlocked) titles.push({ id: 'penta_god', text: 'Бог нового мира', source: 'Пента-удар', color: '#ff6bff' });
    // Raid titles — from archive (persist after raid closed) + current open victory
    const raidVictoryIds = new Set([
      ...raidArchive.filter(e => e.result === 'victory').map(e => e.bossId),
      ...Object.entries(raids).filter(([, r]) => r?.status === 'victory').map(([id]) => id),
    ]);
    RAID_BOSSES.forEach((boss) => {
      if (raidVictoryIds.has(boss.id))
        titles.push({ id: 'raid_' + boss.id, text: boss.sharedTitle, source: 'Рейд: ' + boss.name, color: RAID_RARITY_COLORS[boss.rarity].color });
    });
    achievementsEvaluated.forEach((a) => {
      if (a.achievedTierIndex >= 0 && a.tiers?.length > 0) {
        for (let i = 0; i <= a.achievedTierIndex && i < a.tiers.length; i++) {
          const t = a.tiers[i];
          const tierColors = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#f5c84a', platinum: '#b9f2ff', diamond: '#a8f0ff', special: '#e0a868' };
          titles.push({ id: 'ach_' + a.id + '_' + i, text: t.name, source: a.title, color: tierColors[t.tier] || '#d4af37' });
        }
      }
    });
    // Challenge titles
    (challengeState.completed || []).forEach(c => {
      const def = CHALLENGE_CATALOG.find(ch => ch.id === c.id);
      if (def?.title && !titles.some(t => t.text === def.title)) {
        titles.push({ id: 'challenge_' + def.id, text: def.title, source: 'Вызов: ' + def.name, color: '#f0a060' });
      }
    });
    return titles;
  }, [levelState.level, comboResults, balanceResults, pentaResults, raids, achievementsEvaluated, challengeState.completed]);

  const [lastComboDate, setLastComboDate] = useState(null); // ISO date string when combo was last active
  const [lastComboClass, setLastComboClass] = useState(null); // last resolved combo object

  const currentClass = useMemo(() => {
    const resolved = resolveCharacterClass(statTotals, levelState.level, comboClassId);

    // Combo inertia: once a combo subclass is achieved, it stays for at least 7 days
    // even if the stat gap widens temporarily (travel, illness, etc.)
    // Note: with an explicit permanent comboClassId (Партия B) this branch is effectively
    // a no-op safety net — resolved will consistently reflect the fixed choice.
    const today = dateKey(new Date());

    if (resolved?.combo) {
      // Fresh combo — update tracking date (will be set via effect below)
      return resolved;
    }

    // No combo right now — check if we're still within the 7-day hold window
    if (lastComboClass && lastComboDate) {
      const daysSinceLast = Math.floor(
        (new Date(today) - new Date(lastComboDate)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLast < 7) return lastComboClass;
    }

    // Класс зафиксирован (выбран на 10 уровне) — он больше НЕ должен "плавать"
    // вслед за текущими лидирующими статами. Раньше currentClass всегда брал
    // самый высокий stat average, из-за чего после фиксации Архимага игрок
    // мог продолжать видеть "Берсеркера", если силовые статы обгоняли статы разума.
    if (lockedClassId) {
      const locked = CHARACTER_CLASSES.find((c) => c.id === lockedClassId);
      if (locked) return locked;
    }

    return resolved;
  }, [statTotals, levelState.level, comboClassId, lockedClassId, lastComboDate, lastComboClass]);

  // Keep lastComboDate/lastComboClass in sync whenever a live combo is active
  const resolvedLive = useMemo(
    () => resolveCharacterClass(statTotals, levelState.level, comboClassId),
    [statTotals, levelState.level, comboClassId]
  );
  React.useEffect(() => {
    if (resolvedLive?.combo) {
      const today = dateKey(new Date());
      setLastComboDate(today);
      setLastComboClass(resolvedLive);
    }
  }, [resolvedLive?.id]);

  // Top 3 classes by stat average — shown for selection at level 10
  const top3Classes = useMemo(() => {
    return CHARACTER_CLASSES
      .map((cls) => {
        const sum = cls.stats.reduce((acc, s) => acc + (statTotals[s] || 0), 0);
        return { cls, avg: sum / cls.stats.length };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .filter(({ avg }) => avg > 0);
  }, [statTotals]);

  // effectiveClassId: null until user explicitly locks; below 10 dynamic display only
  const effectiveClassId = lockedClassId || null;

  // Skill tiers available: every 5 levels starting at 10
  const SKILL_LEVELS = [10, 15, 20, 25, 30];
  const availableSkillTiers = useMemo(() => {
    return SKILL_LEVELS.filter(l => levelState.level >= l);
  }, [levelState.level]);

  // Actions
  function lockClass(classId) {
    if (levelState.level >= 10 && !lockedClassId) {
      setLockedClassId(classId);
    }
  }

  function choosePath(pathId) {
    if (!chosenPathId && levelState.level >= 10 && lockedClassId) {
      setChosenPathId(pathId);
      setUnlockedSkillLevels([10]);
    }
  }

  function unlockSkillTier(lvl) {
    if (!unlockedSkillLevels.includes(lvl) && availableSkillTiers.includes(lvl)) {
      setUnlockedSkillLevels(prev => [...prev, lvl]);
    }
  }

  // ---------- Комбо-путь / Специализация (Партия B) ----------
  // Отдельная лестница уровней — НЕ переиспользует SKILL_LEVELS/unlockedSkillLevels основного пути,
  // иначе разблокировка комбо-скилла ур.20 «случайно» разблокировала бы и скилл основного пути ур.20.
  const COMBO_SKILL_LEVELS = [20, 25, 30, 35, 40];
  const availableComboSkillTiers = useMemo(() => {
    return COMBO_SKILL_LEVELS.filter(l => levelState.level >= l);
  }, [levelState.level]);
  const availableSpecSkillTiers = availableComboSkillTiers; // одна и та же лестница уровней

  // Выбор постоянный: делается один раз при достижении 20 лвл (после выбора класса и пути на 10 лвл).
  function chooseCombo(comboId, pathId) {
    if (classChoiceMode || levelState.level < 20 || !lockedClassId) return;
    setClassChoiceMode('combo');
    setComboClassId(comboId);
    setComboPathId(pathId);
    setUnlockedComboSkillLevels([20]);
  }

  function choosePure(specId) {
    if (classChoiceMode || levelState.level < 20 || !lockedClassId) return;
    setClassChoiceMode('pure');
    setSpecPathId(specId);
    setUnlockedSpecSkillLevels([20]);
  }

  function unlockComboSkillTier(lvl) {
    if (!unlockedComboSkillLevels.includes(lvl) && availableComboSkillTiers.includes(lvl)) {
      setUnlockedComboSkillLevels(prev => [...prev, lvl]);
    }
  }

  function unlockSpecSkillTier(lvl) {
    if (!unlockedSpecSkillLevels.includes(lvl) && availableSpecSkillTiers.includes(lvl)) {
      setUnlockedSpecSkillLevels(prev => [...prev, lvl]);
    }
  }

  const RARITY_LEVEL_REQ = { common: 1, rare: 10, epic: 20, legendary: 1, mythic: 1 };

  const shopItemAvailability = useMemo(() => {
    const result = {};
    const isCurrentClass = (classId) => {
      if (!currentClass) return false;
      if (!currentClass.combo) return currentClass.id === classId;
      return currentClass.classA.id === classId || currentClass.classB.id === classId;
    };
    SHOP_ITEMS.forEach((item) => {
      // Level gate for common/rare/epic
      const levelReq = RARITY_LEVEL_REQ[item.rarity] || 1;
      if (levelState.level < levelReq) {
        result[item.id] = false;
        return;
      }
      if (!item.requirement) {
        result[item.id] = true;
      } else if (item.requirement.type === 'mythic') {
        result[item.id] = unlockedMythicIds.has(item.requirement.id);
      } else if (item.requirement.type === 'achievement') {
        const ach = achievementsEvaluated.find((a) => a.id === item.requirement.id);
        const neededTier = item.requirement.tierIndex ?? 0;
        result[item.id] = !!ach && ach.achievedTierIndex >= neededTier;
      } else if (item.requirement.type === 'class') {
        result[item.id] = isCurrentClass(item.requirement.id);
      } else {
        result[item.id] = false;
      }
    });
    return result;
  }, [unlockedMythicIds, achievementsEvaluated, currentClass, levelState.level]);

  // ---------- ACTIONS ----------

  function openLogModal(activityKey) {
    setSelectedActivity(activityKey);
    setFormValue('');
    setStrictSleep(false);
    setIntensity('medium');
    setNutritionInNorm(false);
    setNutritionNoSugar(false);
    setShowLogModal(true);
  }

  function undoLog(logId) {
    setLogs(logs.filter(l => l.id !== logId));

    // Cancel pending side-effect timers (bestiary/road events) that haven't fired yet
    const pending = pendingLogSideEffects.current;
    if (pending && pending.logId === logId) {
      if (pending.bestiaryTimer) clearTimeout(pending.bestiaryTimer);
      if (pending.roadTimer) clearTimeout(pending.roadTimer);

      // Revert raid contributions added by this log (all contributions with id >= timestamp marker)
      if (pending.raidContribAfter > 0) {
        const cutoff = pending.raidContribAfter;
        setRaids(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(bossId => {
            const raid = updated[bossId];
            if (!raid || !raid.contributions) return;
            const filtered = raid.contributions.filter(c => !(c.id >= cutoff && c.participantName === characterName));
            if (filtered.length !== raid.contributions.length) {
              updated[bossId] = { ...raid, contributions: filtered };
            }
          });
          return updated;
        });
      }

      pendingLogSideEffects.current = null;
    }

    setToast({ text: 'Запись отменена', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function undoPassiveLog(logId) {
    setPassiveLogs(passiveLogs.filter(p => p.id !== logId));
    setToast({ text: 'Дебафф отменён', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function undoRecoveryLog(logId) {
    setRecoveryLogs(recoveryLogs.filter(r => r.id !== logId));
    setToast({ text: 'Восстановление отменено', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function submitLog() {
    const def = ACTIVITY_TYPES[selectedActivity];
    const today = dateKey(new Date());

    const newLog = { id: Date.now() + Math.random(), activity: selectedActivity, date: today };
    if (def.logFields.length > 0) {
      const field = def.logFields[0];
      newLog[field.key] = Number(formValue) || 0;
    }
    if (selectedActivity === 'sleep') {
      newLog.strict = strictSleep;
    }
    if (selectedActivity === 'nutrition') {
      newLog.inNorm = nutritionInNorm;
      newLog.noSugar = nutritionNoSugar;
    }
    if (INTENSITY_ACTIVITIES.has(selectedActivity)) {
      newLog.intensity = intensity;
    }

    const logId = newLog.id;
    const raidContribTimestamp = Date.now(); // marker: any raid contribution with id >= this belongs to this log
    setLogs([...logs, newLog]);
    setShowLogModal(false);
    setToast({ text: `${def.label} записано`, key: Date.now(), onUndo: () => { undoLog(logId); } });
    setTimeout(() => setToast(null), 4000);

    // Roll for bestiary encounter first (independent of road events, per modal order in spec)
    const capturedActivity = selectedActivity;
    const bestiaryTimer = setTimeout(() => triggerBestiaryEvent(capturedActivity), 1500);

    // Roll for road story event (delayed to show after bestiary modal, if any)
    const roadTimer = setTimeout(() => triggerRoadEvent(capturedActivity), 3600);

    // Store pending side effects so undoLog can cancel them
    pendingLogSideEffects.current = { logId, bestiaryTimer, roadTimer, raidContribAfter: raidContribTimestamp };

    // Auto-contribute to any active raid that this activity qualifies for
    const raidToday = dateKey(new Date());
    RAID_BOSSES.forEach(boss => {
      const raid = raids[boss.id];
      if (!raid || raid.status !== 'active') return;
      const isParticipant = raid.participants.some(p => p.name === characterName);
      if (!isParticipant) return;
      const cond = boss.condition;

      // shared_total — одна активность + числовое поле (км или ккал)
      if (cond.type === 'shared_total') {
        if (newLog.activity !== cond.activity) return;
        const fieldVal = Number(newLog[cond.field]) || 0;
        if (fieldVal <= 0) return;
        addRaidContribution(boss.id, characterName, fieldVal);
      }

      // shared_count — тренировки (силовые/борьба)
      else if (cond.type === 'shared_count') {
        const acts = cond.activities || (cond.activity ? [cond.activity] : []);
        if (acts.includes(newLog.activity)) {
          addRaidContribution(boss.id, characterName, 1);
        } else if (newLog.activity === 'walking' && (Number(newLog.steps) || 0) >= 8000) {
          // Бонусный вклад за 8000+ шагов — не основная активность босса, но засчитывается как поддержка
          addRaidContribution(boss.id, characterName, 1);
        }
      }

      // combo_roles — зависит от роли игрока
      else if (cond.type === 'combo_roles') {
        const myParticipant = raid.participants.find(p => p.name === characterName);
        if (!myParticipant?.role) return;
        const roleDef = cond.roles[myParticipant.role];
        if (!roleDef) return;
        if (roleDef.subtargets) {
          // Role has independent sub-goals (e.g. 7 strength AND 7 running separately) —
          // find which sub-goal this log satisfies and tag the contribution with it.
          const subIdx = roleDef.subtargets.findIndex((st) => {
            const acts = Array.isArray(st.activities) ? st.activities : [st.activities];
            return acts.includes(newLog.activity);
          });
          if (subIdx === -1) return;
          const st = roleDef.subtargets[subIdx];
          const val = st.field ? (Number(newLog[st.field]) || 0) : 1;
          if (val <= 0) return;
          addRaidContribution(boss.id, characterName, val, false, subIdx);
        } else {
          const roleActs = Array.isArray(roleDef.activity) ? roleDef.activity : [roleDef.activity];
          if (!roleActs.includes(newLog.activity)) return;
          const val = roleDef.field ? (Number(newLog[roleDef.field]) || 0) : 1;
          if (val <= 0) return;
          addRaidContribution(boss.id, characterName, val);
        }
      }

      // each_player_all_days (Орочи) — питание/сон/чтение, одна запись в день
      else if (cond.type === 'each_player_all_days') {
        const acts = cond.activities || [];
        if (acts.length > 0 && !acts.includes(newLog.activity)) return;
        // Проверяем, не засчитывали ли уже сегодня
        const alreadyToday = raid.contributions.some(
          c => c.participantName === characterName && c.date === raidToday
        );
        if (alreadyToday) return;
        addRaidContribution(boss.id, characterName, 1);
      }

      // perfect_discipline (Феникс) — любая активность, одна запись в день
      else if (cond.type === 'perfect_discipline') {
        const alreadyToday = raid.contributions.some(
          c => c.participantName === characterName && c.date === raidToday
        );
        if (alreadyToday) return;
        addRaidContribution(boss.id, characterName, 1);
      }
    });
  }

  function togglePassive(type) {
    const today = dateKey(new Date());
    const existing = passiveLogs.find((p) => p.type === type && p.date === today);
    if (existing) {
      setPassiveLogs(passiveLogs.filter((p) => p.id !== existing.id));
    } else {
      const passiveId = Date.now();
      setPassiveLogs([...passiveLogs, { id: passiveId, type, date: today }]);
      const def = PASSIVE_TYPES[type];
      setToast({ text: `Отмечено: ${def.label}`, key: Date.now(), onUndo: () => { undoPassiveLog(passiveId); } });
      setTimeout(() => setToast(null), 4000);
    }
  }

  function logRecovery(type) {
    const today = dateKey(new Date());
    // Cooldown: only one log per recovery TYPE per day (walk once, sauna once, etc.)
    // Different types can still be combined on the same day.
    const alreadyToday = recoveryLogs.some((r) => r.type === type && r.date === today);
    if (alreadyToday) {
      const def = RECOVERY_TYPES[type];
      setToast({ text: `${def.label} уже отмечено сегодня`, key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    const recId = Date.now() + Math.random();
    setRecoveryLogs([...recoveryLogs, { id: recId, type, date: today }]);
    const def = RECOVERY_TYPES[type];
    setToast({ text: `Восстановление: ${def.label}`, key: Date.now(), onUndo: () => { undoRecoveryLog(recId); } });
    setTimeout(() => setToast(null), 4000);
  }

  // ---------- CHALLENGE FUNCTIONS ----------

  // Compute challenge day-by-day results for active challenge
  // Вынесено в функцию, чтобы переиспользовать для второго слота вызова (Система 7)
  function computeChallengeProgress(ch, logsAll, passiveLogsAll) {
    if (!ch) return null;
    const def = CHALLENGE_CATALOG.find(c => c.id === ch.id);
    if (!def) return null;

    const startDate = new Date(ch.startDate);
    const today = new Date(dateKey(new Date()));
    const dayResults = [];
    // Dates where shield was active — count as passed for daily challenges
    const shieldDates = new Set(passiveLogsAll.filter(p => p.type === 'streak_shield').map(p => p.date));

    for (let i = 0; i < def.duration; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dKey = dateKey(d);
      if (d > today) { dayResults.push(null); continue; } // future day — ещё не наступил

      const logsForDay = logsAll.filter(l => l.date === dKey);
      const passed = def.checkDay(logsForDay);
      const isToday = d.getTime() === today.getTime();
      if (isToday && !passed) {
        // Сегодняшний день ещё не закончился — рано считать его промахом,
        // даже если активность пока не залогирована (иначе клятва проваливается
        // мгновенно в момент старта, до того как игрок вообще успел что-то сделать).
        dayResults.push(null);
        continue;
      }
      // Shield protects a missed day in daily (non-countBased) challenges
      dayResults.push(passed || (!def.countBased && shieldDates.has(dKey)) ? true : passed);
    }

    const elapsed = Math.min(def.duration, Math.floor((today - startDate) / 86400000) + 1);
    const missedSoFar = dayResults.slice(0, elapsed).filter(d => d === false).length;
    const maxAllowed = def.allowedMisses || 0;
    // completedSoFar — сколько успешных дней/тренировок засчитано ВСЕГО за прошедшее время
    // (не обязательно подряд — именно то, что нужно для клятв вида «N тренировок за M дней»).
    const completedSoFar = dayResults.slice(0, elapsed).filter(d => d === true).length;
    const logsSoFar = logsAll.filter(l => {
      const ld = new Date(l.date);
      return ld >= startDate && ld <= today;
    });
    // countBased клятва завершается, как только набрано нужное число тренировок И выполнены
    // остальные условия checkComplete (например суммарный км у «Дух дорог») — не дожидаясь конца окна.
    // Обычная (ежедневная) клятва — только по истечении полного срока, как раньше.
    const isComplete = def.countBased
      ? completedSoFar >= def.countGoal && def.checkComplete(dayResults.slice(0, elapsed), def, logsSoFar)
      : elapsed >= def.duration &&
        def.checkComplete(dayResults.slice(0, def.duration), def, logsAll.filter(l => {
          const ld = new Date(l.date);
          return ld >= startDate && ld <= new Date(startDate.getTime() + (def.duration - 1) * 86400000);
        }));
    // Для countBased клятв пропуски НЕ приводят к провалу — это просто окно времени, а не ежедневный
    // стрик. Провал наступает только если к концу окна цель всё ещё не набрана.
    // Для обычных клятв провал наступает сразу при превышении allowedMisses, как раньше.
    const isFailed = def.countBased
      ? (elapsed >= def.duration && !isComplete)
      : missedSoFar > maxAllowed;
    const perfectDays = dayResults.slice(0, elapsed).filter(d => d === true).length;

    return { def, dayResults, elapsed, missedSoFar, maxAllowed, completedSoFar, isFailed, isComplete, perfectDays };
  }

  const challengeProgress = useMemo(
    () => computeChallengeProgress(challengeState.active, logs, passiveLogs),
    [challengeState.active, logs, passiveLogs]
  );

  const challengeProgress2 = useMemo(
    () => computeChallengeProgress(activeChallenge2, logs, passiveLogs),
    [activeChallenge2, logs, passiveLogs]
  );

  function startChallenge(challengeId) {
    if (challengeState.active) return; // one at a time
    const def = CHALLENGE_CATALOG.find(c => c.id === challengeId);
    if (!def) return;

    // Check cooldown after failure
    if (challengeState.failed.length > 0) {
      const lastFail = challengeState.failed[challengeState.failed.length - 1];
      const daysSinceFail = Math.floor((new Date() - new Date(lastFail.failedDate)) / 86400000);
      if (daysSinceFail < CHALLENGE_FAIL_COOLDOWN_DAYS) {
        setToast({ text: `⏳ Кулдаун ещё ${CHALLENGE_FAIL_COOLDOWN_DAYS - daysSinceFail} дн.`, key: Date.now() });
        setTimeout(() => setToast(null), 2600);
        return;
      }
    }

    const today = dateKey(new Date());
    setChallengeState(prev => ({
      ...prev,
      active: { id: challengeId, startDate: today },
    }));
    setToast({ text: `🔥 Вызов принят: ${def.name}`, key: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  function completeChallenge() {
    if (!challengeProgress || !challengeProgress.isComplete) return;
    const def = challengeProgress.def;
    const today = dateKey(new Date());

    // Award crystals
    const newSpent = Math.max(0, spentCurrency - def.crystals);
    setSpentCurrency(newSpent);

    // Set buff
    const buffExpires = new Date();
    buffExpires.setDate(buffExpires.getDate() + def.buff.days);
    const newBuff = { ...def.buff, expiresDate: buffExpires.toISOString() };

    // Was previous action a fail? (for "Восставший из ада" achievement)
    const wasLastFail = challengeState.failed.length > 0 &&
      challengeState.completed.length === 0 ? true :
      (challengeState.failed.length > 0 &&
       new Date(challengeState.failed[challengeState.failed.length - 1].failedDate) >
       new Date((challengeState.completed[challengeState.completed.length - 1] || {}).completedDate || '2000-01-01'));

    setChallengeState(prev => ({
      ...prev,
      active: null,
      completed: [...prev.completed, {
        id: def.id,
        completedDate: today,
        perfectDays: challengeProgress.perfectDays,
        missedDays: challengeProgress.missedSoFar,
        afterFail: wasLastFail,
      }],
      activeBuff: newBuff,
    }));

    let msg = `🏆 Вызов завершён: ${def.name} · +${def.crystals} 💎`;
    if (def.title) msg += ` · Титул: ${def.title}`;
    setToast({ text: msg, key: Date.now() });
    setTimeout(() => setToast(null), 4500);
  }

  function failChallenge() {
    if (!challengeProgress || !challengeProgress.isFailed) return;
    const def = challengeProgress.def;
    const today = dateKey(new Date());

    setChallengeState(prev => ({
      ...prev,
      active: null,
      failed: [...prev.failed, { id: def.id, failedDate: today }],
    }));

    setToast({ text: `💔 Вызов провален: ${def.name} · Сломленная клятва на 3 дня`, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }

  // Auto-resolve: check if challenge should be completed or failed
  useEffect(() => {
    if (!challengeProgress) return;
    if (challengeProgress.isFailed) failChallenge();
    else if (challengeProgress.isComplete) completeChallenge();
  }, [challengeProgress?.isFailed, challengeProgress?.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Второй слот вызова (Система 7) ----------
  function unlockSecondChallengeSlot() {
    if (secondChallengeSlotUnlocked) return;
    if (currencyBalance < 500) {
      setToast({ text: '💎 Нужно 500 кристаллов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    setSecondChallengeSlotUnlocked(true);
    setSpentCurrency(spentCurrency + 500);
    setToast({ text: '🔓 Второй слот вызова разблокирован навсегда!', key: Date.now() }); setTimeout(() => setToast(null), 3200);
  }

  function startChallenge2(challengeId) {
    if (!secondChallengeSlotUnlocked) return;
    if (activeChallenge2) return; // one at a time in this slot
    const def = CHALLENGE_CATALOG.find(c => c.id === challengeId);
    if (!def) return;
    // Кулдаун после провала — общий для обоих слотов (тот же ресурс дисциплины)
    if (challengeState.failed.length > 0) {
      const lastFail = challengeState.failed[challengeState.failed.length - 1];
      const daysSinceFail = Math.floor((new Date() - new Date(lastFail.failedDate)) / 86400000);
      if (daysSinceFail < CHALLENGE_FAIL_COOLDOWN_DAYS) {
        setToast({ text: `⏳ Кулдаун ещё ${CHALLENGE_FAIL_COOLDOWN_DAYS - daysSinceFail} дн.`, key: Date.now() });
        setTimeout(() => setToast(null), 2600);
        return;
      }
    }
    const today = dateKey(new Date());
    setActiveChallenge2({ id: challengeId, startDate: today });
    setToast({ text: `🔥 Вызов (слот 2) принят: ${def.name}`, key: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  function completeChallenge2() {
    if (!challengeProgress2 || !challengeProgress2.isComplete) return;
    const def = challengeProgress2.def;
    const today = dateKey(new Date());

    setSpentCurrency(prev => Math.max(0, prev - def.crystals));

    // Баффы не стакаются между слотами — активен последний завершённый (общее поле activeBuff)
    const buffExpires = new Date();
    buffExpires.setDate(buffExpires.getDate() + def.buff.days);
    const newBuff = { ...def.buff, expiresDate: buffExpires.toISOString() };

    const wasLastFail = challengeState.failed.length > 0 &&
      challengeState.completed.length === 0 ? true :
      (challengeState.failed.length > 0 &&
       new Date(challengeState.failed[challengeState.failed.length - 1].failedDate) >
       new Date((challengeState.completed[challengeState.completed.length - 1] || {}).completedDate || '2000-01-01'));

    setActiveChallenge2(null);
    setChallengeState(prev => ({
      ...prev,
      completed: [...prev.completed, {
        id: def.id,
        completedDate: today,
        perfectDays: challengeProgress2.perfectDays,
        missedDays: challengeProgress2.missedSoFar,
        afterFail: wasLastFail,
        slot: 2,
      }],
      activeBuff: newBuff,
    }));

    let msg = `🏆 Вызов (слот 2) завершён: ${def.name} · +${def.crystals} 💎`;
    if (def.title) msg += ` · Титул: ${def.title}`;
    setToast({ text: msg, key: Date.now() });
    setTimeout(() => setToast(null), 4500);
  }

  function failChallenge2() {
    if (!challengeProgress2 || !challengeProgress2.isFailed) return;
    const def = challengeProgress2.def;
    const today = dateKey(new Date());
    setActiveChallenge2(null);
    setChallengeState(prev => ({
      ...prev,
      failed: [...prev.failed, { id: def.id, failedDate: today, slot: 2 }],
    }));
    setToast({ text: `💔 Вызов (слот 2) провален: ${def.name} · Сломленная клятва на 3 дня`, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }

  // Auto-resolve для второго слота
  useEffect(() => {
    if (!challengeProgress2) return;
    if (challengeProgress2.isFailed) failChallenge2();
    else if (challengeProgress2.isComplete) completeChallenge2();
  }, [challengeProgress2?.isFailed, challengeProgress2?.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Challenge buff expiry check
  const activeChallengeBuff = useMemo(() => {
    const buff = challengeState.activeBuff;
    if (!buff || !buff.expiresDate) return null;
    if (new Date() > new Date(buff.expiresDate)) return null;
    return buff;
  }, [challengeState.activeBuff]);

  // "Сломленная клятва" debuff — active for 3 days after last failure
  const challengeFailDebuff = useMemo(() => {
    if (challengeState.failed.length === 0) return null;
    const lastFail = challengeState.failed[challengeState.failed.length - 1];
    const daysSince = Math.floor((new Date() - new Date(lastFail.failedDate)) / 86400000);
    if (daysSince >= CHALLENGE_FAIL_DEBUFF_DAYS) return null;
    return { daysLeft: CHALLENGE_FAIL_DEBUFF_DAYS - daysSince, xpPenaltyPct: 10 };
  }, [challengeState.failed]);

  // Cooldown remaining after failure
  const challengeCooldownDays = useMemo(() => {
    if (challengeState.failed.length === 0) return 0;
    const lastFail = challengeState.failed[challengeState.failed.length - 1];
    const daysSince = Math.floor((new Date() - new Date(lastFail.failedDate)) / 86400000);
    return Math.max(0, CHALLENGE_FAIL_COOLDOWN_DAYS - daysSince);
  }, [challengeState.failed]);

  // Challenge achievements evaluation
  const challengeAchievementsEvaluated = useMemo(() => {
    const completed = challengeState.completed || [];
    const completedCategories = new Set(completed.map(c => {
      const def = CHALLENGE_CATALOG.find(ch => ch.id === c.id);
      return def?.category;
    }).filter(Boolean));

    return CHALLENGE_ACHIEVEMENTS.map(ach => {
      let unlocked = false;
      if (ach.kind === 'total') unlocked = completed.length >= ach.need;
      else if (ach.kind === 'categories') unlocked = completedCategories.size >= ach.need;
      else if (ach.kind === 'perfect30') unlocked = completed.some(c => {
        const def = CHALLENGE_CATALOG.find(ch => ch.id === c.id);
        return def?.duration === 30 && c.missedDays === 0;
      });
      else if (ach.kind === 'risen') unlocked = completed.some(c => c.afterFail);
      else if (ach.kind === 'specific') unlocked = completed.some(c => c.id === ach.challengeId);
      return { ...ach, unlocked };
    });
  }, [challengeState.completed]);

  // Titles earned from challenges
  // ---------- ROAD STORIES LOGIC ----------

  // Clean expired road story buffs
  const activeRoadBuffs = useMemo(() => {
    return (roadStoryState.activeBuffs || []).filter(b => new Date(b.expiresDate) > new Date());
  }, [roadStoryState.activeBuffs]);

  // Check pending rewards on each render (for "tomorrow" rewards)
  useEffect(() => {
    const today = dateKey(new Date());
    const pending = roadStoryState.pendingRewards || [];
    const due = pending.filter(p => p.date <= today);
    if (due.length > 0) {
      let crystalsToAdd = 0;
      due.forEach(p => { if (p.type === 'pending_crystals') crystalsToAdd += p.value; });
      if (crystalsToAdd > 0) {
        setSpentCurrency(prev => Math.max(0, prev - crystalsToAdd));
        setToast({ text: `📦 Отложенная награда: +${crystalsToAdd} 💎`, key: Date.now() });
        setTimeout(() => setToast(null), 3000);
      }
      setRoadStoryState(prev => ({ ...prev, pendingRewards: pending.filter(p => p.date > today) }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function bumpLogsToday(today) {
    setRoadStoryState(prev => {
      const base = prev.logsCountDate === today ? (prev.logsToday || 0) : 0;
      return { ...prev, logsCountDate: today, logsToday: base + 1 };
    });
    if (stateRef.current.roadStoryState) {
      const p = stateRef.current.roadStoryState;
      const base = p.logsCountDate === today ? (p.logsToday || 0) : 0;
      p.logsCountDate = today; p.logsToday = base + 1;
    }
  }

  function rollRoadEvent(activityKey) {
    const today = dateKey(new Date());
    // Use stateRef for fresh value (avoids stale closure in setTimeout)
    const currentRoadState = stateRef.current.roadStoryState || {};
    if (currentRoadState.lastEventDate === today) return null; // already triggered today

    const level = levelRef.current || 1;
    const tier = ROAD_EVENT_CHANCE_BY_LEVEL.find(t => level <= t.maxLevel) || ROAD_EVENT_CHANCE_BY_LEVEL[3];

    const logsToday = currentRoadState.logsCountDate === today ? (currentRoadState.logsToday || 0) : 0;

    // --- PITY: дней без события с последнего ---
    let pityTriggered = false;
    if (currentRoadState.lastEventDate) {
      const daysSince = Math.floor((new Date(today) - new Date(currentRoadState.lastEventDate)) / 86400000);
      if (daysSince >= ROAD_EVENT_PITY_DAYS + 1) pityTriggered = true;
    }

    const chance = logsToday === 0 ? tier.firstLogChance : tier.extraLogChance;
    const mp = stateRef.current.mapActive;
    const mapOn = mp && new Date(mp.expiresDate) > new Date();
    const finalChance = mapOn ? Math.min(1, chance * 2) : chance; // Карта странника удваивает шанс на 24ч
    if (!pityTriggered && Math.random() > finalChance) {
      bumpLogsToday(today);
      return null; // didn't roll
    }

    // Build event pool
    const pool = [];
    const weights = { find: 60, encounter: 30, rare: 10, dilemma: 25 };

    tier.types.forEach(type => {
      const universalEvents = ROAD_EVENTS_UNIVERSAL[type] || [];
      universalEvents.forEach(e => pool.push({ ...e, eventType: type, weight: weights[type] }));
    });

    // Class-specific (level 15+, locked class)
    if (level >= 15 && lockedClassId) {
      const classKey = CLASS_ID_TO_EVENT_KEY[lockedClassId];
      const classEvents = classKey ? ROAD_EVENTS_CLASS[classKey] : null;
      if (classEvents) {
        // Add class finds/encounters (weighted same as universal, only if matching activity)
        tier.types.forEach(type => {
          const events = classEvents[type] || [];
          events.forEach(e => {
            if (!e.activity || e.activity === activityKey || (e.activity === 'strength' && (activityKey === 'strength_park' || activityKey === 'strength_gym'))) {
              pool.push({ ...e, eventType: type, weight: weights[type] * 1.5, classSpecific: true });
            }
          });
        });
        // Path-specific event
        if (chosenPathId && classEvents.path?.[chosenPathId]) {
          const pathEvent = classEvents.path[chosenPathId];
          pool.push({ ...pathEvent, eventType: 'find', weight: 40, classSpecific: true, pathSpecific: true });
        }
      }
    }

    if (pool.length === 0) return null;

    // Weighted random selection
    const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = pool[0];
    for (const e of pool) {
      roll -= e.weight;
      if (roll <= 0) { selected = e; break; }
    }

    return selected;
  }

  // ---------- Бестиарий (Партия D): ролл существа ----------
  function mapActivityToBestiaryCategory(activity) {
    if (activity === 'strength_park' || activity === 'strength_gym') return 'strength';
    return activity;
  }

  function rollBestiaryCreature(activityKey) {
    const category = mapActivityToBestiaryCategory(activityKey);
    const pool = BESTIARY_CATALOG.filter(c => c.category === category);
    if (pool.length === 0) return null;
    const owned = new Set(bestiary);

    const ctx = {
      maxRunDistance, weeklyHardStrengthCount: weeklyHardStrengthBest, streaksByActivity,
      stepsTotal, nutritionNormStreakBest: personalRecordsCurrent.nutrition_best_streak_norm || 0,
      sleepQualityStreakBest: personalRecordsCurrent.sleep_best_streak_quality || 0,
      totalReadingPages, calBestDay,
    };

    function pickOne() {
      const legendary = pool.find(c => c.rarity === 'legendary');
      if (legendary && !owned.has(legendary.id) && legendary.legendaryCheck && legendary.legendaryCheck(ctx) && Math.random() < 0.20) {
        return legendary;
      }
      const nonLegendary = pool.filter(c => c.rarity !== 'legendary');
      const roll = Math.random() * 95; // common 55 + uncommon 25 + rare 15 = 95
      const rarity = roll < 55 ? 'common' : roll < 80 ? 'uncommon' : 'rare';
      const rarityPool = nonLegendary.filter(c => c.rarity === rarity);
      const finalPool = rarityPool.length > 0 ? rarityPool : nonLegendary;
      return finalPool[Math.floor(Math.random() * finalPool.length)] || null;
    }

    // Дубликаты не выпадают — 2 переброса, потом молча ничего не выпадает
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = pickOne();
      if (candidate && !owned.has(candidate.id)) return candidate;
    }
    return null;
  }

  function triggerBestiaryEvent(activityKey) {
    const today = dateKey(new Date());
    if (stateRef.current.lastBestiaryEventDate === today) return; // максимум 1 существо в день
    const hs = stateRef.current.horseshoeActive;
    const horseshoeOn = hs && new Date(hs.expiresDate) > new Date();
    const chance = horseshoeOn ? 0.5 : 0.25; // Подкова удачи удваивает шанс на 24ч
    if (Math.random() >= chance) return;
    const creature = rollBestiaryCreature(activityKey);
    if (!creature) return;
    if (stateRef.current) stateRef.current.lastBestiaryEventDate = today; // мгновенно, против гонки параллельных setTimeout
    setLastBestiaryEventDate(today);
    setBestiary(prev => [...prev, creature.id]);
    setActiveBestiaryEncounter(creature);
    if (selectedNickname) {
      dbSendMessage('__system__', selectedNickname,
        `🦊 Новая встреча: ${creature.emoji} ${creature.name} — ${creature.flavor}`,
        'Внутренний голос', 'bestiary');
    }
  }

  function triggerRoadEvent(activityKey) {
    const today = dateKey(new Date());
    const rs = stateRef.current.roadStoryState || {};
    if (rs.lastEventDate === today) return;

    // Сначала — событие из цепочки, если подошёл срок (гарантировано, минуя pity/шанс)
    const duePending = (rs.pendingEvents || []).find(p => p.date <= today);
    if (duePending) {
      const chainEvent = ROAD_CHAIN_EVENTS[duePending.eventId];
      if (chainEvent) {
        if (stateRef.current.roadStoryState) stateRef.current.roadStoryState.lastEventDate = today;
        setRoadStoryState(prev => ({
          ...prev,
          lastEventDate: today,
          totalEvents: (prev.totalEvents || 0) + 1,
          pendingEvents: (prev.pendingEvents || []).filter(p => p !== duePending),
        }));
        setActiveRoadEvent(chainEvent);
        return;
      }
    }

    const event = rollRoadEvent(activityKey);
    if (!event) return;

    // Immediately update stateRef to prevent double-trigger from concurrent setTimeouts
    if (stateRef.current.roadStoryState) stateRef.current.roadStoryState.lastEventDate = today;
    setRoadStoryState(prev => ({
      ...prev,
      lastEventDate: today,
      totalEvents: (prev.totalEvents || 0) + 1,
      totalRares: (prev.totalRares || 0) + (event.eventType === 'rare' ? 1 : 0),
    }));
    bumpLogsToday(today);
    setActiveRoadEvent(event);
  }

  function applyRoadRewards(rewards) {
    let toastParts = [];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = dateKey(tomorrow);

    (rewards || []).forEach(r => {
      if (r.type === 'crystals') {
        setSpentCurrency(prev => Math.max(0, prev - r.value));
        toastParts.push(`+${r.value} 💎`);
      }
      if (r.type === 'crystal_cost') {
        setSpentCurrency(prev => prev + r.value);
        toastParts.push(`−${r.value} 💎`);
      }
      if (r.type === 'buff') {
        const expires = new Date();
        expires.setDate(expires.getDate() + (r.days || 1));
        setRoadStoryState(prev => ({
          ...prev,
          activeBuffs: [...(prev.activeBuffs || []), { name: r.name, xpBonusPct: r.xpBonusPct, scope: r.scope, expiresDate: expires.toISOString() }],
        }));
        const sign = r.xpBonusPct > 0 ? '+' : '';
        toastParts.push(`${r.name} (${sign}${r.xpBonusPct}% XP, ${r.days}д)`);
      }
      if (r.type === 'pending_crystals') {
        setRoadStoryState(prev => ({
          ...prev,
          pendingRewards: [...(prev.pendingRewards || []), { type: 'pending_crystals', value: r.value, date: tomorrowKey }],
        }));
        toastParts.push(`+${r.value} 💎 завтра`);
      }
      if (r.type === 'random_crystals') {
        let roll = Math.random(), cum = 0;
        for (const opt of r.options) {
          cum += opt.chance;
          if (roll <= cum) {
            if (opt.value > 0) {
              setSpentCurrency(prev => Math.max(0, prev - opt.value));
              toastParts.push(`+${opt.value} 💎`);
            } else {
              toastParts.push(opt.flavor || 'Пусто');
            }
            break;
          }
        }
      }
      if (r.type === 'streak_shield') {
        toastParts.push('Щит стрика на 1 день');
        // Shield is stored as a passive log
        setPassiveLogs(prev => [...prev, { type: 'streak_shield', date: dateKey(new Date()), id: Date.now() }]);
      }
      if (r.type === 'hp_restore') {
        // Дорожные истории не восстанавливают HP напрямую — конвертируем в кристаллы как утешительный приз
        setSpentCurrency(prev => Math.max(0, prev - Math.round((r.value || 10) / 2)));
        toastParts.push(`Отдых (+${Math.round((r.value || 10) / 2)} 💎)`);
      }
    });

    return toastParts;
  }

  function resolveRoadEvent(choice) {
    // choice: 'ok' (find/rare), 'yes'/'no' (encounter), 'a'/'b' (dilemma)
    const event = activeRoadEvent;
    if (!event) return;

    let rewards;
    if (event.eventType === 'find' || event.eventType === 'rare') {
      rewards = event.rewards || [];
    } else if (event.eventType === 'dilemma') {
      rewards = choice === 'a' ? (event.a || []) : (event.b || []);
      setRoadStoryState(prev => ({ ...prev, dilemmaCount: (prev.dilemmaCount || 0) + 1 }));
    } else {
      rewards = choice === 'yes' ? (event.yes || []) : (event.no || []);
    }

    // Track deals accepted / rejected for achievements
    if (event.eventType === 'encounter') {
      if (choice === 'yes') {
        setRoadStoryState(prev => ({ ...prev, acceptedDeals: (prev.acceptedDeals || 0) + 1, rejectedStreak: 0 }));
      } else {
        setRoadStoryState(prev => ({ ...prev, rejectedStreak: (prev.rejectedStreak || 0) + 1 }));
      }
    }

    const toastParts = applyRoadRewards(rewards);

    // Цепочки: если событие планирует продолжение — ставим его в очередь
    if (event.chain) {
      const fireDate = dateKey(new Date(Date.now() + event.chain.delayDays * 86400000));
      setRoadStoryState(prev => ({
        ...prev,
        pendingEvents: [...(prev.pendingEvents || []), { eventId: event.chain.nextEventId, date: fireDate }],
      }));
    }
    // Финал цепочки — инкремент счётчика завершённых цепочек
    if (event.chainComplete) {
      setRoadStoryState(prev => ({ ...prev, chainsCompleted: (prev.chainsCompleted || 0) + 1 }));
    }

    if (toastParts.length > 0) {
      setToast({ text: `🎲 ${toastParts.join(' · ')}`, key: Date.now() });
      setTimeout(() => setToast(null), 4500);
    }

    // Партия C: почта — дорожное событие сохраняется для повторного просмотра
    if (selectedNickname) {
      const outcome = toastParts.length > 0 ? ` → ${toastParts.join(' · ')}` : '';
      dbSendMessage('__system__', selectedNickname, `📜 Дорожная история: ${event.text}${outcome}`, 'Внутренний голос', 'event');
    }

    setActiveRoadEvent(null);
  }

  // Road story achievements evaluation
  const roadStoryAchievements = useMemo(() => {
    const rs = roadStoryState;
    return ROAD_STORY_ACHIEVEMENTS.map(ach => {
      let unlocked = false;
      if (ach.kind === 'total') unlocked = (rs.totalEvents || 0) >= ach.need;
      else if (ach.kind === 'rares') unlocked = (rs.totalRares || 0) >= ach.need;
      else if (ach.kind === 'deals') unlocked = (rs.acceptedDeals || 0) >= ach.need;
      else if (ach.kind === 'reject_streak') unlocked = (rs.rejectedStreak || 0) >= ach.need;
      else if (ach.kind === 'dilemma_total') unlocked = (rs.dilemmaCount || 0) >= ach.need;
      else if (ach.kind === 'chain_complete') unlocked = (rs.chainsCompleted || 0) >= ach.need;
      return { ...ach, unlocked };
    });
  }, [roadStoryState]);

  function purchaseItem(item) {
    if (purchasedItemIds.includes(item.id)) return;
    if (!shopItemAvailability[item.id]) return;
    if (currencyBalance < item.price) return;
    setSpentCurrency(spentCurrency + item.price);
    setPurchasedItemIds([...purchasedItemIds, item.id]);
    setToast({ text: `Куплено: ${item.name}`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function requestSellItem(item) {
    if (!purchasedItemIds.includes(item.id)) return;
    if (item.price <= 0) return; // legendary/mythic items can't be sold (obtained by feat, not purchase)
    setSellConfirmItem(item);
  }

  function confirmSellItem() {
    const item = sellConfirmItem;
    if (!item) return;
    if (!purchasedItemIds.includes(item.id)) { setSellConfirmItem(null); return; }
    const refund = Math.floor(item.price * SHOP_REFUND_RATE);
    setSpentCurrency(Math.max(0, spentCurrency - refund));
    setPurchasedItemIds(purchasedItemIds.filter((id) => id !== item.id));
    // Unequip from any slot it was in
    if (equippedShopItems[item.slot] === item.id) {
      setEquippedShopItems({ ...equippedShopItems, [item.slot]: null });
    }
    setToast({ text: `Продано: ${item.name} · +${refund} крист.`, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
    setSellConfirmItem(null);
  }

  // Send crystals to a guild member. Deducts from self locally, credits the target directly in DB
  // (their spent_currency is reduced by the same amount, which raises their available balance).
  async function transferCrystals(targetNickname, amount) {
    const num = Math.floor(Number(amount));
    if (!num || num <= 0 || num > currencyBalance) return false;
    try {
      const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNickname)}&select=spent_currency`);
      if (!res.ok) return false;
      const rows = await res.json();
      if (!rows[0]) return false;
      const targetSpent = rows[0].spent_currency || 0;
      await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNickname)}`, {
        method: 'PATCH',
        body: JSON.stringify({ spent_currency: Math.max(0, targetSpent - num) }),
      });
      setSpentCurrency(spentCurrency + num);
      setToast({ text: `💎 ${num} кристаллов отправлено ${targetNickname.replace(/_/g, ' ')}`, key: Date.now() });
      setTimeout(() => setToast(null), 3000);
      return true;
    } catch (_) { return false; }
  }

  // Gift an owned (purchased) item to a guild member: removes it from your inventory,
  // unequips it if worn, and adds it to their purchased_item_ids in DB.
  async function giftItem(targetNickname, item) {
    if (!purchasedItemIds.includes(item.id)) return false;
    try {
      const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNickname)}&select=purchased_item_ids,equipped_shop_items`);
      if (!res.ok) return false;
      const rows = await res.json();
      if (!rows[0]) return false;
      const targetItems = rows[0].purchased_item_ids || [];
      if (targetItems.includes(item.id)) {
        setToast({ text: 'У получателя уже есть этот предмет', key: Date.now() });
        setTimeout(() => setToast(null), 2600);
        return false;
      }
      await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNickname)}`, {
        method: 'PATCH',
        body: JSON.stringify({ purchased_item_ids: [...targetItems, item.id] }),
      });
      setPurchasedItemIds(purchasedItemIds.filter(id => id !== item.id));
      if (equippedShopItems[item.slot] === item.id) {
        setEquippedShopItems({ ...equippedShopItems, [item.slot]: null });
      }
      setToast({ text: `🎁 ${item.name} отправлен ${targetNickname.replace(/_/g, ' ')}`, key: Date.now() });
      setTimeout(() => setToast(null), 3000);
      return true;
    } catch (_) { return false; }
  }

  function useShopShield() {
    if (shopShields <= 0) {
      setToast({ text: 'Нет щитов в инвентаре', key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    if (lastShopShieldUse) {
      const daysSince = Math.floor((new Date() - new Date(lastShopShieldUse)) / 86400000);
      if (daysSince < 14) {
        setToast({ text: `Щит можно активировать раз в 2 недели (ещё ${14 - daysSince} дн.)`, key: Date.now() });
        setTimeout(() => setToast(null), 3000); return;
      }
    }
    const today = dateKey(new Date());
    setShopShields(prev => prev - 1);
    setLastShopShieldUse(new Date().toISOString());
    setActiveShield({ date: today, type: 'shop' });
    setPassiveLogs(prev => prev.some(p => p.type === 'streak_shield' && p.date === today)
      ? prev
      : [...prev, { type: 'streak_shield', date: today, id: Date.now() }]);
    // Auto-contribute to phoenix raid if active participant
    const phoenixRaid = raids['phoenix'];
    if (phoenixRaid?.status === 'active' && phoenixRaid.participants?.some(p => p.name === characterName)) {
      const alreadyToday = phoenixRaid.contributions.some(c => c.participantName === characterName && c.date === today);
      if (!alreadyToday) addRaidContribution('phoenix', characterName, 1);
    }
    scheduleSave();
    setToast({ text: '🛡️ Щит стрика активирован! Все стрики защищены сегодня.', key: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  function useRaidShield() {
    if (raidShields <= 0) {
      setToast({ text: 'Нет рейдовых щитов', key: Date.now() }); setTimeout(() => setToast(null), 2600); return;
    }
    if (lastRaidShieldUse) {
      const daysSince = Math.floor((new Date() - new Date(lastRaidShieldUse)) / 86400000);
      if (daysSince < 7) {
        setToast({ text: `Рейдовый щит раз в 7 дней (ещё ${7 - daysSince} дн.)`, key: Date.now() });
        setTimeout(() => setToast(null), 3000); return;
      }
    }
    const today = dateKey(new Date());
    setRaidShields(prev => prev - 1);
    setLastRaidShieldUse(new Date().toISOString());
    setActiveShield({ date: today, type: 'raid' });
    setPassiveLogs(prev => prev.some(p => p.type === 'streak_shield' && p.date === today)
      ? prev
      : [...prev, { type: 'streak_shield', date: today, id: Date.now() }]);
    // Auto-contribute to phoenix raid if active participant
    const phoenixRaid = raids['phoenix'];
    if (phoenixRaid?.status === 'active' && phoenixRaid.participants?.some(p => p.name === characterName)) {
      const alreadyToday = phoenixRaid.contributions.some(c => c.participantName === characterName && c.date === today);
      if (!alreadyToday) addRaidContribution('phoenix', characterName, 1);
    }
    scheduleSave();
    setToast({ text: '🛡️ Рейдовый щит активирован! Все стрики защищены сегодня.', key: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }

  function buyConsumable(consumable) {
    const today = dateKey(new Date());
    const weekAgo = dateKey(new Date(Date.now() - 7 * 86400000));
    const twoWeeksAgo = dateKey(new Date(Date.now() - 14 * 86400000));

    if (consumable.type === 'shield') {
      const lastShield = consumableLog.filter(c => c.type === 'shield').sort((a, b) => b.date.localeCompare(a.date))[0];
      if (lastShield && lastShield.date > twoWeeksAgo) {
        setToast({ text: 'Щит можно купить раз в 2 недели', key: Date.now() });
        setTimeout(() => setToast(null), 2600);
        return;
      }
    }
    if (consumable.type === 'horseshoe' && horseshoeActive && new Date(horseshoeActive.expiresDate) > new Date()) {
      setToast({ text: 'Подкова уже активна', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (consumable.type === 'map' && mapActive && new Date(mapActive.expiresDate) > new Date()) {
      setToast({ text: 'Карта уже активна', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (consumable.type === 'scroll' && scrollActive && new Date(scrollActive.expiresDate) > new Date()) {
      setToast({ text: 'Свиток уже активен — один за раз', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (consumable.type === 'scroll' && (challengeState.activeBuff?.xpBonusPct || 0) >= 15) {
      setToast({ text: 'Бафф вызова уже сильнее — свиток не нужен', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (consumable.type === 'second_chance' && challengeCooldownDays <= 0) {
      setToast({ text: 'Кулдаун уже снят', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (consumable.maxPerWeek) {
      const thisWeek = consumableLog.filter(c => c.type === consumable.type && c.date >= weekAgo).length;
      if (thisWeek >= consumable.maxPerWeek) {
        setToast({ text: 'Лимит ' + consumable.maxPerWeek + ' в неделю исчерпан', key: Date.now() });
        setTimeout(() => setToast(null), 2600);
        return;
      }
    }

    if (currencyBalance < consumable.price) {
      setToast({ text: 'Не хватает кристаллов', key: Date.now() });
      setTimeout(() => setToast(null), 2600);
      return;
    }

    setSpentCurrency(spentCurrency + consumable.price);
    setConsumableLog([...consumableLog, { id: consumable.id, type: consumable.type, date: today }]);

    if (consumable.type === 'shield') {
      // Shield goes to inventory — activated manually from Character tab
      setShopShields(prev => prev + 1);
      setToast({ text: '🛡️ Щит добавлен в расходники — активируй в Персонаже', key: Date.now() });
    } else if (consumable.type === 'potion_hp') {
      const before = Math.round(raidPenalizedHealth.physical);
      const after = Math.min(100, before + 10);
      setToast({ text: after > before ? `❤️ Здоровье ${before}% → ${after}%` : '❤️ Здоровье уже полное', key: Date.now() });
    } else if (consumable.type === 'potion_mp') {
      const before = Math.round(raidPenalizedHealth.mental);
      const after = Math.min(100, before + 10);
      setToast({ text: after > before ? `🧠 Менталка ${before}% → ${after}%` : '🧠 Менталка уже полная', key: Date.now() });
    } else if (consumable.type === 'horseshoe') {
      const expires = new Date(); expires.setDate(expires.getDate() + 1);
      setHorseshoeActive({ expiresDate: expires.toISOString() });
      setToast({ text: '🍀 Подкова удачи активна на 24ч — шанс встречи существ ×2', key: Date.now() });
    } else if (consumable.type === 'map') {
      const expires = new Date(); expires.setDate(expires.getDate() + 1);
      setMapActive({ expiresDate: expires.toISOString() });
      setToast({ text: '🗺️ Карта странника активна на 24ч — шанс дорожных событий ×2', key: Date.now() });
    } else if (consumable.type === 'scroll') {
      const expires = new Date(); expires.setDate(expires.getDate() + 1);
      setScrollActive({ expiresDate: expires.toISOString(), pct: 15 });
      setToast({ text: '📜 Свиток опыта активен на 24ч — +15% XP ко всему', key: Date.now() });
    } else if (consumable.type === 'second_chance') {
      setChallengeState(prev => {
        if (!prev.failed || prev.failed.length === 0) return prev;
        const updatedFailed = [...prev.failed];
        const last = { ...updatedFailed[updatedFailed.length - 1] };
        const pastDate = new Date(); pastDate.setDate(pastDate.getDate() - (CHALLENGE_FAIL_COOLDOWN_DAYS + 1));
        last.failedDate = pastDate.toISOString();
        updatedFailed[updatedFailed.length - 1] = last;
        return { ...prev, failed: updatedFailed };
      });
      setToast({ text: '🔄 Кулдаун «Испытания духа» сброшен (дебафф остался)', key: Date.now() });
    }
    setTimeout(() => setToast(null), 3000);
  }

  function equipShopItem(slot, itemId) {
    setEquippedShopItems({ ...equippedShopItems, [slot]: itemId });
  }

  function addBook(title) {
    if (!title.trim()) return;
    setBooks([...books, { id: Date.now(), title: title.trim(), finished: false, finishedDate: null }]);
  }

  // ---------- RAID ACTIONS ----------

  function persistRaid(bossId, raidObj) {
    dbSaveRaid(bossId, raidObj);
  }

  // Check if the player is already in any active/gathering raid
  function playerActiveRaidId() {
    return Object.keys(raids).find(bId => {
      const r = raids[bId];
      return r && (r.status === 'gathering' || r.status === 'active') && r.participants?.some(p => p.name === characterName);
    }) || null;
  }

  function startRaid(bossId) {
    if (raids[bossId]) return;
    // 1 player = 1 raid
    const existingRaid = playerActiveRaidId();
    if (existingRaid) {
      const eb = RAID_BOSSES.find(b => b.id === existingRaid);
      setToast({ text: `⛔ Ты уже в рейде: ${eb?.name || existingRaid}`, key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    // Unomie debuff blocks new raids for 3 days
    if (unomieDebuff && new Date(unomieDebuff.expiresDate) > new Date()) {
      const daysLeft = Math.ceil((new Date(unomieDebuff.expiresDate) - new Date()) / 86400000);
      setToast({ text: `😔 Уныние — рейды заблокированы ещё ${daysLeft} дн.`, key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    const newRaid = {
      status: 'gathering',
      startDate: null,
      startClassId: currentClass ? (currentClass.combo ? currentClass.classA.id : currentClass.id) : null,
      initiator: characterName,
      createdAt: new Date().toISOString(),
      participants: [{ name: characterName, ready: false, role: null }],
      contributions: [],
      defeatPenaltyApplied: false,
      lootGrantedTo: [],
    };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
    setToast({ text: `Рейд открыт: ${boss?.name} — ждём участников`, key: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }

  function joinRaid(bossId, role) {
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    const raid = raids[bossId];
    if (!raid || raid.status !== 'gathering') return;
    if (raid.participants.length >= (boss.maxPlayers || 3)) return;
    if (raid.participants.find(p => p.name === characterName)) return;
    // 1 player = 1 raid
    const existingRaid = playerActiveRaidId();
    if (existingRaid) {
      const eb = RAID_BOSSES.find(b => b.id === existingRaid);
      setToast({ text: `⛔ Ты уже в рейде: ${eb?.name || existingRaid}`, key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    // Unomie debuff blocks new raids
    if (unomieDebuff && new Date(unomieDebuff.expiresDate) > new Date()) {
      const daysLeft = Math.ceil((new Date(unomieDebuff.expiresDate) - new Date()) / 86400000);
      setToast({ text: `😔 Уныние — рейды заблокированы ещё ${daysLeft} дн.`, key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    if (boss.condition.type === 'combo_roles' && role) {
      if (raid.participants.find(p => p.role === role)) return;
    }
    const newRaid = { ...raid, participants: [...raid.participants, { name: characterName, ready: false, role: role || null }] };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
  }

  function setReady(bossId) {
    const raid = raids[bossId];
    if (!raid || raid.status !== 'gathering') return;
    const updated = raid.participants.map(p => p.name === characterName ? { ...p, ready: true } : p);
    // No longer auto-starts — just marks ready
    const newRaid = { ...raid, participants: updated };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
    setToast({ text: '✅ Готов к рейду! Ждём команду инициатора', key: Date.now() });
    setTimeout(() => setToast(null), 2400);
  }

  // Called by initiator to manually launch the raid after everyone is ready
  function launchRaid(bossId) {
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    const raid = raids[bossId];
    if (!raid || raid.status !== 'gathering') return;
    if (raid.initiator !== characterName) {
      setToast({ text: '⛔ Только инициатор может начать рейд', key: Date.now() }); setTimeout(() => setToast(null), 2400); return;
    }
    const allReady = raid.participants.every(p => p.ready) && raid.participants.length >= (boss.minPlayers || 3);
    if (!allReady) {
      setToast({ text: '⏳ Не все участники готовы', key: Date.now() }); setTimeout(() => setToast(null), 2400); return;
    }
    const newRaid = { ...raid, status: 'active', startDate: dateKey(new Date()), activatedAt: new Date().toISOString() };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
    setToast({ text: '⚔️ Рейд начался!', key: Date.now() }); setTimeout(() => setToast(null), 2400);
  }

  function cancelRaid(bossId) {
    const raid = raids[bossId];
    if (!raid) return;
    if (raid.initiator !== characterName) {
      setToast({ text: '❌ Только инициатор может отменить рейд', key: Date.now() });
      setTimeout(() => setToast(null), 2600); return;
    }
    if (raid.status === 'active') {
      const raidStartTime = raid.activatedAt || raid.createdAt;
      if (!raidStartTime || (Date.now() - new Date(raidStartTime).getTime()) > 3600000) {
        setToast({ text: '⏳ Рейд можно отменить только в первый час', key: Date.now() });
        setTimeout(() => setToast(null), 2600); return;
      }
    }
    setRaids((prev) => { const u = { ...prev }; delete u[bossId]; return u; });
    dbDeleteRaid(bossId);
    setToast({ text: '🔄 Рейд отменён', key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }

  function addRaidContribution(bossId, participantName, value, override = false, subKey = null) {
    const numVal = Number(value);
    if (override ? (isNaN(numVal) || numVal < 0) : (!numVal || numVal <= 0)) return;
    const raid = raids[bossId];
    if (!raid || raid.status !== 'active') return;
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    const today = dateKey(new Date());
    const newContrib = { id: Date.now(), participantName, date: today, value: numVal, subKey };
    // If override mode: remove this player's contributions for the SAME sub-goal only
    // (so fixing one half of a dual-subtarget role doesn't wipe the other half's progress).
    const baseContribs = override
      ? raid.contributions.filter(c => !(c.participantName === participantName && c.subKey === subKey))
      : raid.contributions;
    // If override with 0 — just clear all contributions, don't add a zero entry
    const newContribs = (override && numVal === 0)
      ? baseContribs
      : [...baseContribs, newContrib];
    let victory = false;
    if (boss.condition.type === 'shared_total') {
      const total = newContribs.reduce((s, c) => s + c.value, 0);
      if (total >= boss.condition.target) victory = true;
    } else if (boss.condition.type === 'shared_count') {
      if (newContribs.length >= boss.condition.target) victory = true;
    } else if (boss.condition.type === 'combo_roles') {
      victory = raid.participants.every(p => {
        if (!p.role || !boss.condition.roles[p.role]) return false;
        const roleDef = boss.condition.roles[p.role];
        const myContribs = newContribs.filter(c => c.participantName === p.name);
        if (roleDef.subtargets) {
          return roleDef.subtargets.every((st, idx) => {
            const total = myContribs.filter(c => c.subKey === idx).reduce((s, c) => s + c.value, 0);
            return total >= st.target;
          });
        }
        const total = myContribs.reduce((s, c) => s + c.value, 0);
        return total >= roleDef.target;
      }) && raid.participants.length >= (boss.minPlayers || 3);
    } else if (boss.condition.type === 'each_player_all_days') {
      const start = new Date(raid.startDate);
      const allDays = Array.from({ length: boss.condition.daysRequired }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i); return dateKey(d);
      });
      victory = raid.participants.every(p => {
        const pContribs = newContribs.filter(c => c.participantName === p.name);
        const coveredDays = new Set(pContribs.map(c => c.date));
        return allDays.every(d => coveredDays.has(d));
      });
    }
    const start = new Date(raid.startDate);
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + boss.durationDays);
    const expired = new Date() > deadline && !victory;
    const newRaid = { ...raid, contributions: newContribs, status: victory ? 'victory' : expired ? 'defeat' : 'active' };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
    if (victory) {
      setToast({ text: '🏆 Цель рейда достигнута! Победа!', key: Date.now() });
      setTimeout(() => setToast(null), 3000);
    }
  }

  function resolveRaidDeadline(bossId) {
    const raid = raids[bossId];
    if (!raid || raid.status !== 'active') return;
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    const start = new Date(raid.startDate);
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + boss.durationDays);
    if (new Date() < deadline) return;
    let victory = false;
    if (boss.condition.type === 'shared_total') {
      const total = raid.contributions.reduce((s, c) => s + c.value, 0);
      victory = total >= boss.condition.target;
    } else if (boss.condition.type === 'shared_count') {
      victory = raid.contributions.length >= boss.condition.target;
    } else if (boss.condition.type === 'combo_roles') {
      victory = raid.participants.every(p => {
        if (!p.role || !boss.condition.roles[p.role]) return false;
        const roleDef = boss.condition.roles[p.role];
        const myContribs = raid.contributions.filter(c => c.participantName === p.name);
        if (roleDef.subtargets) {
          return roleDef.subtargets.every((st, idx) => {
            const total = myContribs.filter(c => c.subKey === idx).reduce((s, c) => s + c.value, 0);
            return total >= st.target;
          });
        }
        const total = myContribs.reduce((s, c) => s + c.value, 0);
        return total >= roleDef.target;
      });
    } else if (boss.condition.type === 'each_player_all_days') {
      const allDays = Array.from({ length: boss.condition.daysRequired }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i); return dateKey(d);
      });
      victory = raid.participants.every(p => {
        const coveredDays = new Set(raid.contributions.filter(c => c.participantName === p.name).map(c => c.date));
        return allDays.every(d => coveredDays.has(d));
      });
    }
    const newRaid = { ...raid, status: victory ? 'victory' : 'defeat' };
    setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
    persistRaid(bossId, newRaid);
  }

  // Leave a gathering raid (removes just yourself); deletes the raid entirely if you were the last one in it.
  function leaveRaid(bossId) {
    const raid = raids[bossId];
    if (!raid) return;
    const updatedParticipants = raid.participants.filter(p => p.name !== characterName);
    if (updatedParticipants.length === 0) {
      setRaids((prev) => { const u = { ...prev }; delete u[bossId]; return u; });
      dbDeleteRaid(bossId);
    } else {
      const newRaid = { ...raid, participants: updatedParticipants };
      setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
      persistRaid(bossId, newRaid);
    }
  }

  // Fully close/cancel a raid for everyone (used for victory/defeat cards, or to cancel a stalled gathering raid).
  function closeRaid(bossId) {
    const raid = raids[bossId];
    const boss = RAID_BOSSES.find(b => b.id === bossId);
    // Archive if completed (victory or defeat) and player was a participant
    if (raid && boss && (raid.status === 'victory' || raid.status === 'defeat') && raid.participants?.some(p => p.name === characterName)) {
      const classId = raid.startClassId || effectiveClassId || 'pathfinder';
      const lootData = RAID_LOOT_BY_CLASS[bossId]?.[classId];
      const archiveEntry = {
        bossId, bossName: boss.name, bossCreature: boss.creature, bossImage: boss.image, bossRarity: boss.rarity,
        result: raid.status, participants: raid.participants.map(p => p.name),
        date: dateKey(new Date()), lootName: raid.status === 'victory' ? (lootData?.name || null) : null,
        story: null,
      };
      setRaidArchive(prev => [...prev, archiveEntry]);
      // Apply Unomie debuff on defeat
      if (raid.status === 'defeat' && !raid.defeatPenaltyApplied) {
        const raidDays = boss.durationDays || 3;
        const blockExpires = new Date(); blockExpires.setDate(blockExpires.getDate() + 3);
        const xpExpires = new Date(); xpExpires.setDate(xpExpires.getDate() + raidDays);
        setUnomieDebuff({ expiresDate: blockExpires.toISOString(), xpPenaltyExpiresDate: xpExpires.toISOString(), xpPenaltyPct: 10 });
      }
    }
    setRaids((prev) => { const u = { ...prev }; delete u[bossId]; return u; });
    dbDeleteRaid(bossId);
  }

  // Grant raid loot independently to every participant, the moment each of their own clients
  // observes the victory (works even though raids are a single shared record, not per-player).
  useEffect(() => {
    Object.entries(raids).forEach(([bossId, raid]) => {
      if (!raid || raid.status !== 'victory') return;
      if (!raid.participants?.some(p => p.name === characterName)) return;
      if (raid.lootGrantedTo?.includes(characterName)) return;
      const classId = raid.startClassId || effectiveClassId || 'pathfinder';
      const lootData = RAID_LOOT_BY_CLASS[bossId]?.[classId];
      const newRaid = { ...raid, lootGrantedTo: [...(raid.lootGrantedTo || []), characterName] };
      if (lootData?.itemId) {
        setPurchasedItemIds((cur) => {
          const updated = cur.includes(lootData.itemId) ? cur : [...cur, lootData.itemId];
          setTimeout(() => scheduleSave(), 100);
          return updated;
        });
        setRaidShields(prev => {
          const next = Math.min(prev + 1, MAX_RAID_SHIELDS);
          setTimeout(() => scheduleSave(), 200);
          return next;
        });
        const shieldMsg = raidShields >= MAX_RAID_SHIELDS ? '' : ' + 🛡️ Рейдовый щит';
        setToast({ text: '🏆 Победа в рейде! Получен: ' + lootData.name + shieldMsg, key: Date.now() });
        setTimeout(() => setToast(null), 4000);
        if (selectedNickname) dbSendMessage('__system__', selectedNickname, `Победа в рейде! Получен: ${lootData.name}${raidShields < MAX_RAID_SHIELDS ? ' и 🛡️ Рейдовый щит' : ''}!`, 'Внутренний голос', 'raid');
      } else if (!lootData) {
        setRaidShields(prev => {
          const next = Math.min(prev + 1, MAX_RAID_SHIELDS);
          setTimeout(() => scheduleSave(), 200);
          return next;
        });
        setToast({ text: raidShields >= MAX_RAID_SHIELDS ? '🏆 Победа в рейде! (щиты полные)' : '🏆 Победа в рейде! + 🛡️ Рейдовый щит', key: Date.now() });
        setTimeout(() => setToast(null), 4000);
      }
      setRaids((prev) => ({ ...prev, [bossId]: newRaid }));
      dbSaveRaid(bossId, newRaid);
    });
  }, [raids, characterName, effectiveClassId]);

  function toggleBookFinished(id) {
    setBooks(books.map((b) => {
      if (b.id !== id) return b;
      const finished = !b.finished;
      return { ...b, finished, finishedDate: finished ? dateKey(new Date()) : null };
    }));
  }

  function removeBook(id) {
    setBooks(books.filter((b) => b.id !== id));
  }

  // ---------- RENDER ----------

  // Show login card on first load
  if (!selectedNickname || dbLoading) {
    return (
      <LoginScreen
        dbLoading={dbLoading}
        dbError={dbError}
        onLogin={selectNickname}
      />
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3a3a42; border-radius: 3px; }
        button { font-family: inherit; }
        .tabBarScroll::-webkit-scrollbar { display: none; }
        .hallOfFameScroll::-webkit-scrollbar { display: none; }
      `}</style>

      <Header
        levelState={levelState}
        statTotals={statTotals}
        unlockedCount={unlockedCount}
        totalAchievements={ACHIEVEMENTS.length}
        achievements={achievementsEvaluated}
        mythicAchievements={mythicAchievementsEvaluated}
        receivedLikes={Object.values(guildLikes).reduce((s, v) => typeof v === 'number' ? s + v : s, 0)}
        activeShield={activeShield}
        ritualXpBonus={ritualXpBonus}
        morningRitualLog={morningRitualLog}
        logs={logs}
        streaksByActivity={streaksByActivity}
        nudges={guildLikes.__nudges || []}
        onDismissNudges={() => {
          const updated = { ...guildLikes };
          delete updated.__nudges;
          setGuildLikes(updated);
        }}
        pentaResults={pentaResults}
        comboCounts={comboResults.countsById}
        balanceCounts={balanceResults.countsById}
        secretAchievements={secretAchievementsEvaluated}
        name={characterName}
        onNameChange={(newName) => {
          const oldName = characterName;
          setCharacterName(newName);
          // Update name in all active/gathering raids
          if (oldName !== newName) {
            setRaids(prev => {
              const updated = {};
              Object.entries(prev).forEach(([bId, raid]) => {
                if (!raid) { updated[bId] = raid; return; }
                const newParticipants = raid.participants.map(p =>
                  p.name === oldName ? { ...p, name: newName } : p
                );
                const newContribs = raid.contributions.map(c =>
                  c.participantName === oldName ? { ...c, participantName: newName } : c
                );
                const newRaid = { ...raid, participants: newParticipants, contributions: newContribs,
                  initiator: raid.initiator === oldName ? newName : raid.initiator };
                updated[bId] = newRaid;
                if (newParticipants.some(p => p.name !== raid.participants.find(rp => rp.name === p.name)?.name)) {
                  dbSaveRaid(bId, newRaid);
                }
              });
              return updated;
            });
          }
        }}
        healthState={raidPenalizedHealth}
        currentClass={currentClass}
        currencyBalance={currencyBalance}
        activeTitle={activeTitle}
        earnedTitles={earnedTitles}
        setActiveTitle={changeTitle}
        titleCooldownDays={titleCooldownDays()}
        lockedClassId={lockedClassId}
        chosenPathId={chosenPathId}
        classChoiceMode={classChoiceMode}
        comboClassId={comboClassId}
        comboPathId={comboPathId}
        unlockedComboSkillLevels={unlockedComboSkillLevels}
        specPathId={specPathId}
        unlockedSpecSkillLevels={unlockedSpecSkillLevels}
        equippedShopItems={equippedShopItems}
        equippedAvatarFrame={equippedAvatarFrame}
        avatarEmoji={avatarEmoji}
        onSelectAvatarEmoji={setAvatarEmoji}
        activeChallengeBuff={activeChallengeBuff}
        challengeFailDebuff={challengeFailDebuff}
        unomieDebuff={unomieDebuff}
        raidShields={raidShields}
        onUseRaidShield={useRaidShield}
        unreadMailCount={mailMessages.filter(m => !m.read).length}
        onOpenMail={handleOpenMail}
        personalRecords={personalRecords}
        onOpenRecordsWall={() => setShowRecordsWall(true)}
        bestiary={bestiary}
        activeBackground={activeBackground}
        setTab={setTab}
      />

      {/* === SAVE STATUS INDICATOR === */}
      {saveStatus !== 'idle' && (
        <div style={{
          position: 'fixed', top: 8, right: 8, zIndex: 9999,
          padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
          background: saveStatus === 'error' ? '#ff4444' : saveStatus === 'ok' ? '#22bb44' : '#e8a020',
          color: '#fff', pointerEvents: 'none', opacity: 0.9,
          transition: 'opacity 0.3s',
        }}>
          {saveStatus === 'pending' ? '⏳ ожидание…' :
           saveStatus === 'saving' ? '💾 сохраняю…' :
           saveStatus === 'ok' ? '✅ сохранено' :
           saveStatus === 'error' ? '❌ ОШИБКА!' : ''}
        </div>
      )}

      {/* Road Story Event Modal */}
      {activeRoadEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: '#1c1c22', border: '1.5px solid #2c2c34', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden' }}>
            <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid #25252c' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
                color: activeRoadEvent.eventType === 'rare' ? '#f0c14b' : activeRoadEvent.eventType === 'encounter' ? '#5b9bf0' : activeRoadEvent.eventType === 'dilemma' ? '#c9a8f5' : '#6a6a72' }}>
                {activeRoadEvent.eventType === 'rare' ? '✨ Редкое событие' : activeRoadEvent.eventType === 'encounter' ? '🤝 Встреча' : activeRoadEvent.eventType === 'dilemma' ? '🔀 Дилемма' : '🔍 Находка'}
                {activeRoadEvent.classSpecific && ' · Классовое'}
              </div>
              <div style={{ fontSize: 13, color: '#e0e0e8', lineHeight: 1.5 }}>{activeRoadEvent.text}</div>
            </div>
            <div style={{ padding: '12px 18px 18px', display: 'flex', gap: 10 }}>
              {(activeRoadEvent.eventType === 'find' || activeRoadEvent.eventType === 'rare') && (
                <button onClick={() => resolveRoadEvent('ok')} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#2a2a36', border: '1px solid #3a3a46', fontSize: 12, fontWeight: 700, color: '#f0d272' }}>
                  Забрать
                </button>
              )}
              {activeRoadEvent.eventType === 'encounter' && (
                <>
                  <button onClick={() => resolveRoadEvent('yes')} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#1a2a1a', border: '1px solid #2a5a2a', fontSize: 12, fontWeight: 700, color: '#6adf6a' }}>
                    {activeRoadEvent.yesLabel || 'Да'}
                  </button>
                  <button onClick={() => resolveRoadEvent('no')} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#2a1a1a', border: '1px solid #5a2a2a', fontSize: 12, fontWeight: 700, color: '#df6a6a' }}>
                    {activeRoadEvent.noLabel || 'Нет'}
                  </button>
                </>
              )}
              {activeRoadEvent.eventType === 'dilemma' && (
                <>
                  <button onClick={() => resolveRoadEvent('a')} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#16233a', border: '1px solid #2a4a6a', fontSize: 12, fontWeight: 700, color: '#6ab0df' }}>
                    {activeRoadEvent.aLabel || 'А'}
                  </button>
                  <button onClick={() => resolveRoadEvent('b')} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#241a35', border: '1px solid #4a2a6a', fontSize: 12, fontWeight: 700, color: '#b08adf' }}>
                    {activeRoadEvent.bLabel || 'Б'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mail Modal */}
      {showMailModal && (
        <MailModal messages={mailMessages} onClose={() => setShowMailModal(false)} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} onDeleteMessages={handleDeleteMessages} onSendReply={handleSendMessage} playerNickname={selectedNickname} />
      )}

      {/* Новый рекорд — показываем по одному из очереди */}
      {recordModalQueue.length > 0 && (
        <NewRecordModal
          record={recordModalQueue[0]}
          onClose={() => setRecordModalQueue(q => q.slice(1))}
        />
      )}

      {/* Новое существо в бестиарии */}
      {activeBestiaryEncounter && (
        <BestiaryEncounterModal
          creature={activeBestiaryEncounter}
          onClose={() => setActiveBestiaryEncounter(null)}
        />
      )}

      {/* Стена подвигов */}
      {showRecordsWall && (
        <RecordsWallView
          categories={RECORD_CATEGORIES}
          records={personalRecords}
          onClose={() => setShowRecordsWall(false)}
        />
      )}

      <Tabs tab={tab} setTab={setTab} archiveUnlocked={archiveUnlocked} />

      <div style={styles.content}>
        {tab === 'dashboard' && (
          <Dashboard
            statTotals={statTotals}
            onLogActivity={openLogModal}
            streaksByActivity={streaksByActivity}
            achievementsEvaluated={achievementsEvaluated}
            expandedActivity={expandedActivity}
            setExpandedActivity={setExpandedActivity}
            passiveLogs={passiveLogs}
            onTogglePassive={togglePassive}
            books={books}
            onAddBook={addBook}
            onToggleBookFinished={toggleBookFinished}
            onRemoveBook={removeBook}
            onLogRecovery={logRecovery}
            recoveryLogs={recoveryLogs}
            morningRitualLog={morningRitualLog}
            onPerformRitual={performRitual}
            ritualXpBonus={ritualXpBonus}
            challengeState={challengeState}
            challengeProgress={challengeProgress}
            activeRoadBuffs={activeRoadBuffs}
          />
        )}
        {tab === 'raids' && (
          <RaidsView
            raids={raids}
            currentClass={currentClass}
            characterName={characterName}
            onStartRaid={startRaid}
            onJoinRaid={joinRaid}
            onSetReady={setReady}
            onLaunchRaid={launchRaid}
            onAddContribution={addRaidContribution}
            onCancelRaid={cancelRaid}
            onResolve={resolveRaidDeadline}
            onLeave={leaveRaid}
            onCloseRaid={closeRaid}
            onRefresh={refreshRaids}
            raidArchive={raidArchive}
            unomieDebuff={unomieDebuff}
            guildMembers={[...guildMembers.map(m => ({ name: m.character_name || m.nickname, locked_class_id: m.locked_class_id, characterName: m.character_name })), { name: characterName, locked_class_id: lockedClassId, characterName }]}
          />
        )}
        {tab === 'guild' && (
          <GuildView
            playerName={selectedNickname || characterName}
            playerCharacterName={characterName}
            playerLevel={levelState.level}
            playerClass={currentClass}
            playerPhysical={raidPenalizedHealth.physical}
            playerMental={raidPenalizedHealth.mental}
            playerTitleEntry={levelState}
            activeTitle={activeTitle}
            earnedTitles={earnedTitles}
            raids={raids}
            guildLikes={guildLikes}
            onLike={(name) => {
              const updated = { ...guildLikes, [name]: (guildLikes[name] || 0) + 1 };
              setGuildLikes(updated);
            }}
            lockedClassId={effectiveClassId}
            chosenPathId={chosenPathId}
            guildMembers={guildMembers}
            onRefreshGuild={refreshGuild}
            onLogout={logout}
            onTransferCrystals={transferCrystals}
            onGiftItem={giftItem}
            myPurchasedItemIds={purchasedItemIds}
            myEquippedShopItems={equippedShopItems}
            myCurrencyBalance={currencyBalance}
            myEquippedAvatarFrame={equippedAvatarFrame}
            myAvatarEmoji={avatarEmoji}
            onSendMessage={handleSendMessage}
          />
        )}
        {tab === 'character' && (
          <CharacterView
            statTotals={statTotals}
            currentClass={currentClass}
            equippedShopItems={equippedShopItems}
            purchasedItemIds={purchasedItemIds}
            onEquip={equipShopItem}
            onSell={requestSellItem}
            earnedTitles={earnedTitles}
            activeTitle={activeTitle}
            setActiveTitle={changeTitle}
            titleCooldownDays={titleCooldownDays()}
            levelState={levelState}
            lockedClassId={effectiveClassId}
            chosenPathId={chosenPathId}
            achievementsEvaluated={achievementsEvaluated}
            purchasedFrameIds={purchasedFrameIds}
            equippedAvatarFrame={equippedAvatarFrame}
            onEquipFrame={equipAvatarFrame}
            avatarEmoji={avatarEmoji}
            onSelectAvatarEmoji={setAvatarEmoji}
            shopShields={shopShields}
            lastShopShieldUse={lastShopShieldUse}
            activeShield={activeShield}
            onUseShopShield={useShopShield}
            onOpenRecordsWall={() => setShowRecordsWall(true)}
            ownedBackgrounds={ownedBackgrounds}
            activeBackground={activeBackground}
            onBuyBackground={buyBackground}
            onEquipBackground={equipBackground}
            currencyBalance={currencyBalance}
            polishedItemIds={polishedItemIds}
            itemBonusOverrides={itemBonusOverrides}
            onPolishItem={polishItem}
            onReforgeItem={reforgeItem}
            getEffectiveBonus={getEffectiveBonus}
          />
        )}
        {tab === 'shop' && (
          <ShopView
            currencyBalance={currencyBalance}
            purchasedItemIds={purchasedItemIds}
            shopItemAvailability={shopItemAvailability}
            equippedShopItems={equippedShopItems}
            onPurchase={purchaseItem}
            onEquip={equipShopItem}
            onSell={requestSellItem}
            onBuyConsumable={buyConsumable}
            consumableLog={consumableLog}
            level={levelState.level}
            lockedClassId={lockedClassId}
            purchasedFrameIds={purchasedFrameIds}
            equippedAvatarFrame={equippedAvatarFrame}
            onBuyFrame={buyAvatarFrame}
            onEquipFrame={equipAvatarFrame}
            ownedBackgrounds={ownedBackgrounds}
            onBuyBackground={buyBackground}
          />
        )}
        {tab === 'classes' && (
          <ClassTreeView
            currentClass={currentClass}
            level={levelState.level}
            lockedClassId={effectiveClassId}
            top3Classes={top3Classes}
            chosenPathId={chosenPathId}
            unlockedSkillLevels={unlockedSkillLevels}
            availableSkillTiers={availableSkillTiers}
            onLockClass={lockClass}
            onChoosePath={choosePath}
            onUnlockSkillTier={unlockSkillTier}
            classChoiceMode={classChoiceMode}
            comboClassId={comboClassId}
            comboPathId={comboPathId}
            unlockedComboSkillLevels={unlockedComboSkillLevels}
            availableComboSkillTiers={availableComboSkillTiers}
            specPathId={specPathId}
            unlockedSpecSkillLevels={unlockedSpecSkillLevels}
            availableSpecSkillTiers={availableSpecSkillTiers}
            onChooseCombo={chooseCombo}
            onChoosePure={choosePure}
            onUnlockComboSkillTier={unlockComboSkillTier}
            onUnlockSpecSkillTier={unlockSpecSkillTier}
          />
        )}
        {tab === 'bestiary' && (
          <BestiaryView owned={bestiary} />
        )}
        {tab === 'achievements' && (
          <AchievementsView
            achievements={achievementsEvaluated}
            pentaResults={pentaResults}
            comboCounts={comboResults.countsById}
            balanceCounts={balanceResults.countsById}
            secretAchievements={secretAchievementsEvaluated}
            mythicAchievements={mythicAchievementsEvaluated}
            bestiaryAchievements={bestiaryAchievementsEvaluated}
            challengeAchievements={challengeAchievementsEvaluated}
            roadStoryAchievements={roadStoryAchievements}
            onOpenRecordsWall={() => setShowRecordsWall(true)}
          />
        )}
        {tab === 'history' && <HistoryView logs={logs} passiveLogs={passiveLogs} recoveryLogs={recoveryLogs} morningRitualLog={morningRitualLog} onUndoLog={undoLog} onUndoPassive={undoPassiveLog} onUndoRecovery={undoRecoveryLog} onUndoMorning={undoMorningRitual} />}
        {tab === 'challenges' && (
          <ChallengesView
            challengeState={challengeState}
            challengeProgress={challengeProgress}
            activeChallengeBuff={activeChallengeBuff}
            challengeFailDebuff={challengeFailDebuff}
            challengeCooldownDays={challengeCooldownDays}
            level={levelState.level}
            onStart={startChallenge}
            secondChallengeSlotUnlocked={secondChallengeSlotUnlocked}
            activeChallenge2={activeChallenge2}
            challengeProgress2={challengeProgress2}
            onStart2={startChallenge2}
            onUnlockSecondSlot={unlockSecondChallengeSlot}
            currencyBalance={currencyBalance}
          />
        )}
        {tab === 'rules' && <RulesView />}
        {tab === 'archive' && <ArchiveView />}
      </div>

      {showLogModal && (
        <LogModal
          activityKey={selectedActivity}
          value={formValue}
          setValue={setFormValue}
          strictSleep={strictSleep}
          setStrictSleep={setStrictSleep}
          intensity={intensity}
          setIntensity={setIntensity}
          nutritionInNorm={nutritionInNorm}
          setNutritionInNorm={setNutritionInNorm}
          nutritionNoSugar={nutritionNoSugar}
          setNutritionNoSugar={setNutritionNoSugar}
          onSubmit={submitLog}
          onClose={() => setShowLogModal(false)}
        />
      )}

      {sellConfirmItem && (
        <SellConfirmModal
          item={sellConfirmItem}
          refund={Math.floor(sellConfirmItem.price * SHOP_REFUND_RATE)}
          onConfirm={confirmSellItem}
          onCancel={() => setSellConfirmItem(null)}
        />
      )}

      {toast && <Toast text={toast.text} key={toast.key} onUndo={toast.onUndo} />}
    </div>
  );
}

// ---------- SUBCOMPONENTS ----------


// ---------- ACHIEVEMENTS MODAL ----------

const AchievementsModal = React.memo(function AchievementsModal({ achievements, mythicAchievements, pentaResults, comboCounts, balanceCounts, secretAchievements, unlockedCount, totalAchievements, onClose }) {
  const [filter, setFilter] = React.useState('all');
  const [openGroups, setOpenGroups] = React.useState({});

  function toggleGroup(key) {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const ACTIVITY_LABELS = {
    running: '🏃 Бег', strength: '💪 Силовые', strength_gym: '🏋️ Силовые (зал)',
    strength_park: '🌳 Силовые (парк)', wrestling: '🥋 Борьба',
    nutrition: '🥗 Питание', sleep: '😴 Сон', reading: '📖 Чтение', calories: '🔥 Калории',
  };
  const CATEGORY_ORDER = Object.values(ACTIVITY_LABELS);

  const grouped = React.useMemo(() => {
    const map = {};
    achievements.forEach(a => {
      const cat = ACTIVITY_LABELS[a.activity] || ('📌 ' + (a.activity || 'Прочее'));
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });
    return map;
  }, [achievements]);

  const categories = Object.keys(grouped).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a); const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  function tierColor(idx) {
    return ['#cd7f32', '#c0c0c0', '#f5c84a', '#b9f2ff', '#a8f0ff'][idx] ?? '#f0f0f4';
  }
  function tierLabel(idx, tiers) {
    if (tiers?.[idx]) return tiers[idx].name || tiers[idx].tier || `Тир ${idx+1}`;
    return ['Бронза','Серебро','Золото','Платина','Алмаз'][idx] ?? `Тир ${idx+1}`;
  }

  // Legendary counts
  const mythicUnlocked = (mythicAchievements || []).filter(m => m.unlocked).length;
  const secretUnlocked = (secretAchievements || []).filter(s => s.unlocked).length;
  const legendaryHasAny = pentaResults?.legendCount > 0 || pentaResults?.godUnlocked ||
    Object.values(comboCounts || {}).some(v => v > 0) ||
    Object.values(balanceCounts || {}).some(v => v > 0) ||
    secretUnlocked > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#13131a', minHeight: '100%', width: '100%', maxWidth: 480, margin: '0 auto', paddingBottom: 40, animation: 'fadeUp 0.25s ease' }}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={22} color="#f0d272" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f0d272' }}>Все достижения</div>
            <div style={{ fontSize: 11, color: '#6a6a72' }}>{unlockedCount} из {totalAchievements} разблокировано</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22, lineHeight: 1, padding: '4px 6px' }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ height: 6, background: '#22222a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(unlockedCount / totalAchievements * 100)}%`, background: 'linear-gradient(90deg,#e0a868,#f0d272)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10.5, color: '#5a5a62', textAlign: 'right', marginTop: 4 }}>{Math.round(unlockedCount / totalAchievements * 100)}%</div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px 4px' }}>
          {[['all','Все'],['unlocked','Получены'],['locked','Не получены']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              background: filter === k ? '#3a2a10' : 'none',
              border: `1px solid ${filter === k ? '#c08a2a' : '#2a2a32'}`,
              color: filter === k ? '#f0d272' : '#5a5a72',
            }}>{l}</button>
          ))}
        </div>

        <div style={{ padding: '8px 16px 0' }}>

          {/* ── Regular achievements by category ── */}
          <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>Достижения по активностям</div>
          {categories.map(cat => {
            const achs = grouped[cat].filter(a => {
              if (filter === 'unlocked') return a.achievedTierIndex >= 0;
              if (filter === 'locked') return a.achievedTierIndex < 0;
              return true;
            });
            if (achs.length === 0) return null;
            const catUnlocked = grouped[cat].filter(a => a.achievedTierIndex >= 0).length;
            const catTotal = grouped[cat].length;
            const isOpen = !!openGroups[cat];

            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <button onClick={() => toggleGroup(cat)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  background: '#1a1a22', border: '1px solid #26262e', borderRadius: isOpen ? '10px 10px 0 0' : 10,
                  padding: '11px 14px', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#d0d0da', flex: 1 }}>{cat}</span>
                  <span style={{ fontSize: 10.5, color: '#5a5a6a', marginRight: 4 }}>{catUnlocked}/{catTotal}</span>
                  <div style={{ width: 32, height: 4, background: '#22222a', borderRadius: 2, overflow: 'hidden', marginRight: 6 }}>
                    <div style={{ height: '100%', width: `${Math.round(catUnlocked/catTotal*100)}%`, background: '#e0a868', borderRadius: 2 }} />
                  </div>
                  <ChevronDown size={14} color="#5a5a62" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>

                {isOpen && (
                  <div style={{ border: '1px solid #26262e', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    {achs.map((a, i) => {
                      const unlocked = a.achievedTierIndex >= 0;
                      const tierIdx = a.achievedTierIndex;
                      const maxTier = (a.tiers?.length ?? 1) - 1;
                      const isMaxed = unlocked && tierIdx >= maxTier;
                      const accent = unlocked ? tierColor(tierIdx) : '#3a3a42';
                      return (
                        <div key={a.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                          background: unlocked ? '#1c1c14' : '#17171e',
                          borderTop: i > 0 ? '1px solid #1e1e26' : 'none',
                          opacity: unlocked ? 1 : 0.55,
                        }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: accent + '22', border: `1.5px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                            {unlocked ? ({'running':'🏃','strength':'💪','strength_gym':'🏋️','strength_park':'🌳','wrestling':'🥋','nutrition':'🥗','sleep':'😴','reading':'📖','calories':'🔥'}[a.activity]||'🏅') : '🔒'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: unlocked ? '#f0f0f4' : '#5a5a62' }}>{a.title ?? a.id}</div>
                            {unlocked && (
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: accent, marginTop: 2 }}>
                                {isMaxed ? '★ ' : ''}{tierLabel(tierIdx, a.tiers)}
                              </div>
                            )}
                            {(a.flavor || a.unit) && <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2, lineHeight: 1.4 }}>{a.flavor || (unlocked && a.tiers?.[tierIdx] ? `${a.tiers[tierIdx].need} ${a.unit}` : a.unit)}</div>}
                            {a.tiers && a.tiers.length > 1 && (
                              <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                                {a.tiers.map((_,i) => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background: i<=tierIdx?tierColor(i):'#2a2a32', border:`1px solid ${i<=tierIdx?tierColor(i)+'88':'#32323a'}` }} />)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Legendary section ── */}
          {(filter === 'all' || filter === 'unlocked') && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#7a6a3a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Легендарные</div>

              {/* Penta */}
              {[
                { key: 'penta_legend', label: 'Пента-удар: Легенда своего Сити', unlocked: (pentaResults?.legendCount??0) > 0, desc: `5 из 6 активностей за день · Серий: ${pentaResults?.legendCount??0}`, color: '#f5c84a' },
                { key: 'penta_god', label: 'Пента-удар: Бог нового мира', unlocked: !!pentaResults?.godUnlocked, desc: '5 идеальных дней подряд', color: '#ff6bff' },
              ].filter(p => filter !== 'unlocked' || p.unlocked).map(p => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: p.unlocked ? '#1e1c10' : '#17171e', border: `1px solid ${p.unlocked ? p.color+'44' : '#22222a'}`, borderRadius: 10, marginBottom: 7, opacity: p.unlocked ? 1 : 0.45 }}>
                  <div style={{ fontSize: 20 }}>{p.unlocked ? '⚡' : '🔒'}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: p.unlocked ? p.color : '#5a5a62' }}>{p.label}</div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{p.desc}</div>
                  </div>
                </div>
              ))}

              {/* Combo ach */}
              {Object.entries(comboCounts||{}).filter(([,v])=>v>0).map(([id,count]) => (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#1a1210', border:'1px solid #6a3a1044', borderRadius:10, marginBottom:7 }}>
                  <div style={{ fontSize:20 }}>🔱</div>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#e8933c' }}>{id} <span style={{fontSize:10,color:'#7a5a2a'}}>×{count}</span></div>
                    <div style={{ fontSize:10.5, color:'#6a6a72', marginTop:2 }}>Комбо-достижение</div>
                  </div>
                </div>
              ))}

              {/* Balance ach */}
              {Object.entries(balanceCounts||{}).filter(([,v])=>v>0).map(([id,count]) => (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#101a1a', border:'1px solid #1a6a5a44', borderRadius:10, marginBottom:7 }}>
                  <div style={{ fontSize:20 }}>⚖️</div>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#4ce0c0' }}>{id} <span style={{fontSize:10,color:'#2a6a5a'}}>×{count}</span></div>
                    <div style={{ fontSize:10.5, color:'#6a6a72', marginTop:2 }}>Достижение баланса</div>
                  </div>
                </div>
              ))}

              {/* Secret */}
              {(secretAchievements||[]).filter(s=>s.unlocked).map(s => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#1a1228', border:'1px solid #7a4aaa44', borderRadius:10, marginBottom:7 }}>
                  <div style={{ fontSize:20 }}>✨</div>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#c9a8f5' }}>{s.title}</div>
                    {s.rewards && <div style={{ fontSize:10.5, color:'#9af0e0', marginTop:2 }}>{Object.entries(s.rewards).map(([k,v])=>`+${v} ${k}`).join(' · ')}</div>}
                  </div>
                </div>
              ))}

              {!legendaryHasAny && filter !== 'locked' && (
                <div style={{ fontSize:11, color:'#3a3a42', textAlign:'center', padding:'12px 0' }}>Легендарные достижения ещё не получены</div>
              )}
            </div>
          )}

          {/* ── Mythic section ── */}
          {(filter === 'all' || (filter === 'unlocked' && mythicUnlocked > 0)) && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#5a3a7a', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Мифические <span style={{ color:'#4a3a52', fontWeight:600 }}>{mythicUnlocked}/{(mythicAchievements||[]).length}</span>
              </div>
              {(mythicAchievements||[]).filter(m => filter !== 'unlocked' || m.unlocked).map(m => {
                const isOpen = !!openGroups['mythic_'+m.id];
                return (
                  <div key={m.id} style={{ marginBottom:7 }}>
                    <button onClick={() => toggleGroup('mythic_'+m.id)} style={{
                      width:'100%', display:'flex', alignItems:'center', gap:10,
                      background: m.unlocked ? 'linear-gradient(135deg,#1e1428 0%,#17171e 100%)' : '#17171e',
                      border:`1px solid ${m.unlocked?'#f5c84a44':'#22222a'}`,
                      borderRadius: isOpen ? '10px 10px 0 0' : 10, padding:'11px 14px', cursor:'pointer', textAlign:'left',
                    }}>
                      <div style={{ fontSize:18 }}>{m.unlocked ? '🏆' : '🔒'}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:700, color: m.unlocked?'#f5c84a':'#5a5a62' }}>{m.unlocked ? m.title : '???'}</div>
                        {m.character && <div style={{ fontSize:10.5, color:'#6a6a72', marginTop:1 }}>{m.character}</div>}
                      </div>
                      <ChevronDown size={13} color="#5a5a62" style={{ transform:isOpen?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }} />
                    </button>
                    {isOpen && (
                      <div style={{ background:'#13131a', border:`1px solid ${m.unlocked?'#f5c84a44':'#22222a'}`, borderTop:'none', borderRadius:'0 0 10px 10px', padding:'10px 14px' }}>
                        <div style={{ fontSize:10.5, color:'#5a5a6a', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>Условие</div>
                        <div style={{ fontSize:11.5, color:'#9a9aa8', marginBottom:8, lineHeight:1.4 }}>{m.description}</div>
                        <div style={{ fontSize:10.5, color:'#5a5a6a', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>Награда</div>
                        <div style={{ fontSize:11.5, color:'#9af0e0', lineHeight:1.4 }}>
                          {Object.entries(m.rewards||{}).map(([k,v])=>k==='all'?`+${v} ко всем характеристикам`:`+${v} ${k}`).join(', ')}
                        </div>
                        {m.unlocked && m.quote && <div style={{ marginTop:10, padding:'8px 12px', background:'#1e1428', border:'1px solid #4a2a6a', borderRadius:8, fontSize:11.5, color:'#c9a8f5', fontStyle:'italic', lineHeight:1.5 }}>«{m.quote}»</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
});

const Header = React.memo(function Header({ levelState, statTotals, unlockedCount, totalAchievements, achievements, mythicAchievements, pentaResults, comboCounts, balanceCounts, secretAchievements, receivedLikes, activeShield, ritualXpBonus, morningRitualLog, nudges, onDismissNudges, name, onNameChange, healthState, currentClass, currencyBalance, activeTitle, earnedTitles, setActiveTitle, titleCooldownDays, lockedClassId, chosenPathId, classChoiceMode, comboClassId, comboPathId, unlockedComboSkillLevels, specPathId, unlockedSpecSkillLevels, logs, streaksByActivity, equippedShopItems, equippedAvatarFrame, avatarEmoji, onSelectAvatarEmoji, activeChallengeBuff, challengeFailDebuff, unomieDebuff, raidShields, onUseRaidShield, unreadMailCount, onOpenMail, personalRecords, onOpenRecordsWall, bestiary, activeBackground, setTab }) {
  const TitleIcon = levelState.titleIcon;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [showAchModal, setShowAchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showShieldConfirm, setShowShieldConfirm] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  function startEditing() {
    setNameDraft(name);
    setEditingName(true);
  }

  function commitName() {
    const trimmed = nameDraft.trim();
    if (trimmed) onNameChange(trimmed.slice(0, 24));
    setEditingName(false);
  }

  const displayTitle = activeTitle ? activeTitle.text : levelState.title;
  const displayTitleColor = activeTitle ? activeTitle.color : levelState.titleColor;

  // Resolve display info for header class line
  const isCombo = currentClass?.combo;
  const baseClass = isCombo ? currentClass.classA : currentClass;
  const comboClass = isCombo ? currentClass : null;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;
  const clsColorHeader = baseClass?.color || displayTitleColor;
  // Сумма двух характеристик закреплённого класса — от неё считается прогресс
  // открытия аватарок (каждые 50 очков открывает следующую).
  const lockedClassDef = lockedClassId ? CHARACTER_CLASSES.find(c => c.id === lockedClassId) : null;
  const classStatTotal = lockedClassDef
    ? (statTotals?.[lockedClassDef.stats[0]] || 0) + (statTotals?.[lockedClassDef.stats[1]] || 0)
    : 0;
  const unlockablesForClass = lockedClassId ? (AVATAR_UNLOCKABLES[lockedClassId] || []) : [];

  return (
    <div style={styles.header}>
      <div style={styles.headerRow}>
        <button
          onClick={() => setShowAvatarPicker(true)}
          style={{
            ...styles.avatarCircle,
            borderRadius: 16,
            borderColor: clsColorHeader + '88',
            background: avatarEmoji ? clsColorHeader + '33' : clsColorHeader + '1f',
            ...getFrameStyle(equippedAvatarFrame),
            cursor: 'pointer', padding: 0,
          }}
          title="Выбрать аватар"
        >
          {renderAvatarContent(avatarEmoji, displayTitle, baseClass, clsColorHeader, 30, 'square')}
        </button>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
            onClick={() => setShowAvatarPicker(false)}>
            <div style={{ background: '#1c1c22', border: '1.5px solid #2c2c34', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.2s ease' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px', borderBottom: '1px solid #25252c' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f4' }}>Выбери аватар</span>
                {avatarEmoji && (
                  <button onClick={() => { onSelectAvatarEmoji(null); setShowAvatarPicker(false); }}
                    style={{ fontSize: 11, color: '#6a6a72', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ✕ Сбросить
                  </button>
                )}
                <button onClick={() => setShowAvatarPicker(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="#6a6a72" />
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '12px 14px 24px', flex: 1 }}>
                {unlockablesForClass.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6a6a72', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Аватары {lockedClassDef?.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#8a8a92' }}>
                        {classStatTotal} {lockedClassDef?.stats?.join(' + ')}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      {unlockablesForClass.map((av, i) => {
                        const isUnlocked = classStatTotal >= av.threshold;
                        const isSelected = avatarEmoji === av.id;
                        return (
                          <button
                            key={av.id}
                            onClick={() => {
                              if (isUnlocked) { onSelectAvatarEmoji(av.id); setShowAvatarPicker(false); }
                              else { setPreviewAvatar(av); }
                            }}
                            title={isUnlocked ? `Аватар ${i + 1}` : `Откроется на ${av.threshold} очков`}
                            style={{
                              position: 'relative',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              gap: 4, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                              background: isSelected ? '#3a2a10' : '#13131a',
                              border: isSelected ? '1.5px solid #c9a227' : '1px solid #28282f',
                              transition: 'all 0.15s',
                            }}
                          >
                            <img
                              src={av.src}
                              alt=""
                              style={{
                                width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                                filter: isUnlocked ? 'none' : 'grayscale(100%) brightness(0.45)',
                              }}
                            />
                            {!isUnlocked && (
                              <div style={{
                                position: 'absolute', top: 4, right: 4, fontSize: 9,
                                background: '#101014', borderRadius: '50%', width: 15, height: 15,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>🔒</div>
                            )}
                            <span style={{ fontSize: 8.5, color: isUnlocked ? (isSelected ? '#f0d272' : '#5a5a62') : '#4a4a52', textAlign: 'center' }}>
                              {isUnlocked ? `№${i + 1}` : av.threshold}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {['Классы', 'Оружие', 'Стихии', 'Звери', 'Аркан', 'Нейтральные'].map(group => {
                  const groupAvatars = AVATAR_EMOJIS.filter(a => a.group === group);
                  // Портрет класса показываем только тому, кто реально закрепил этот класс —
                  // остальным он тут не покажется, независимо от прогресса или пути.
                  const groupPortraits = group === 'Классы'
                    ? AVATAR_CLASS_PORTRAITS.filter(a => a.requiresClassId === lockedClassId)
                    : [];
                  const allItems = [...groupPortraits, ...groupAvatars];
                  return (
                    <div key={group} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6a6a72', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{group}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {allItems.map(av => {
                          const isSelected = avatarEmoji === av.id;
                          return (
                            <button key={av.id} onClick={() => { onSelectAvatarEmoji(av.id); setShowAvatarPicker(false); }}
                              title={av.name}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: 4, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                                background: isSelected ? '#3a2a10' : '#13131a',
                                border: isSelected ? '1.5px solid #c9a227' : '1px solid #28282f',
                                transition: 'all 0.15s',
                              }}>
                              {av.type === 'image'
                                ? <img src={av.src} alt={av.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 30, lineHeight: 1 }}>{av.svg}</span>}
                              <span style={{ fontSize: 8.5, color: isSelected ? '#f0d272' : '#5a5a62', textAlign: 'center', lineHeight: 1.2, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{av.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Preview modal for a locked unlockable avatar */}
        {previewAvatar && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setPreviewAvatar(null)}>
            <div style={{ background: '#1c1c22', border: '1.5px solid #2c2c34', borderRadius: 16, padding: 20, maxWidth: 260, textAlign: 'center' }}
              onClick={e => e.stopPropagation()}>
              <img
                src={previewAvatar.src}
                alt=""
                style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', margin: '0 auto 14px', display: 'block', filter: 'grayscale(20%)' }}
              />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f4', marginBottom: 6 }}>
                🔒 Пока закрыт
              </div>
              <div style={{ fontSize: 11.5, color: '#9a9aa2', lineHeight: 1.5, marginBottom: 14 }}>
                Откроется на {previewAvatar.threshold} {lockedClassDef?.stats?.join(' + ')}
                <br />Сейчас: {classStatTotal}
              </div>
              <button onClick={() => setPreviewAvatar(null)} style={{
                background: '#2a2a32', border: '1px solid #3a3a42', borderRadius: 9,
                padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#dcdce2', cursor: 'pointer',
              }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              maxLength={24}
              style={styles.charNameInput}
            />
          ) : (
            <button onClick={startEditing} style={styles.charNameBtn} aria-label="Изменить имя">
              <span style={styles.charName}>{name} · {levelState.level} ур.</span>
              <Pencil size={12} color="#5a5a62" />
            </button>
          )}
          {displayTitle && (
            <div style={styles.charLevel}>
              {displayTitle}
            </div>
          )}

          {/* Class · Subclass · Path strip under nickname */}
          {currentClass && (
            <div style={styles.headerClassStrip}>
              {/* Base class always shown */}
              <span style={{ ...styles.headerClassChip, color: baseClass.color, borderColor: baseClass.color + '55', background: baseClass.color + '18' }}>
                <baseClass.icon size={10} color={baseClass.color} />
                {baseClass.name}
              </span>
              {/* Combo subclass: shown when resolved (lvl 20+) */}
              {comboClass && (
                <>
                  <span style={styles.headerClassSep}>·</span>
                  <span style={{ ...styles.headerClassChip, color: currentClass.secondaryColor, borderColor: currentClass.secondaryColor + '55', background: currentClass.secondaryColor + '18' }}>
                    <currentClass.secondaryIcon size={10} color={currentClass.secondaryColor} />
                    {comboClass.name}
                  </span>
                </>
              )}
              {/* Chosen path */}
              {chosenPath && (
                <>
                  <span style={styles.headerClassSep}>·</span>
                  <span style={{ ...styles.headerClassChip, color: chosenPath.color, borderColor: chosenPath.color + '55', background: chosenPath.color + '18' }}>
                    {chosenPath.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {/* Header menu (three dots) — replaces separate mail/profile buttons */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowHeaderMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, position: 'relative',
              background: '#1a1a24', border: '1.5px solid #2a2a3a',
              borderRadius: 12, cursor: 'pointer',
            }}
            aria-label="Меню"
          >
            <span style={{ fontSize: 20, color: '#9a9aa8', lineHeight: 1, letterSpacing: 1 }}>⋮</span>
            {unreadMailCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#e05f4a', color: '#fff', fontSize: 9, fontWeight: 800,
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unreadMailCount}</span>
            )}
          </button>

          {showHeaderMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={() => setShowHeaderMenu(false)} />
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 90,
                background: '#1c1c22', border: '1.5px solid #2c2c34', borderRadius: 12,
                padding: 6, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <button
                  onClick={() => { setShowHeaderMenu(false); onOpenMail(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
                    padding: '9px 10px', color: '#dcdce2', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <Mail size={16} color={unreadMailCount > 0 ? '#4f7cff' : '#6a6a82'} />
                  Почта
                  {unreadMailCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: '#e05f4a', color: '#fff', fontSize: 9, fontWeight: 800,
                      borderRadius: '50%', width: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unreadMailCount}</span>
                  )}
                </button>
                <button
                  onClick={() => { setShowHeaderMenu(false); setShowProfileModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
                    padding: '9px 10px', color: '#dcdce2', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, width: 16, textAlign: 'center' }}>👤</span>
                  Профиль
                </button>
                <button
                  onClick={() => { setShowHeaderMenu(false); setShowTitlesModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
                    padding: '9px 10px', color: '#dcdce2', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <Crown size={16} color="#f0d272" />
                  Титулы
                  {activeTitle && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, color: activeTitle.color, background: activeTitle.color + '22',
                      borderRadius: 5, padding: '2px 6px', fontWeight: 700,
                    }}>★ {activeTitle.text}</span>
                  )}
                </button>
                <div style={{ height: 1, background: '#28282f', margin: '2px 4px' }} />
                {[
                  { key: 'shop', icon: '🛒', label: 'Магазин' },
                  { key: 'bestiary', icon: '🦊', label: 'Бестиарий' },
                  { key: 'achievements', icon: '🏆', label: 'Ачивки' },
                  { key: 'history', icon: '📖', label: 'История' },
                  { key: 'rules', icon: '📜', label: 'Правила' },
                ].map(it => (
                  <button
                    key={it.key}
                    onClick={() => { setShowHeaderMenu(false); setTab(it.key); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
                      padding: '9px 10px', color: '#dcdce2', fontSize: 13, fontWeight: 600, textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, width: 16, textAlign: 'center' }}>{it.icon}</span>
                    {it.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.levelBarWrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={styles.levelBarLabel}>
            {levelState.isMaxLevel
              ? `Максимальный уровень · ${levelState.totalXp} XP всего`
              : `${levelState.xpIntoLevel}/${levelState.xpNeededForLevel} XP до уровня ${levelState.level + 1} (${levelState.progressPct}%)`}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {raidShields > 0 && (
              <button onClick={() => setShowShieldConfirm(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4ce0c0',
                background: '#0f2a1a', border: '1px solid #2a5a3a', borderRadius: 8, padding: '2px 8px',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <Shield size={11} color="#4ce0c0" />
                <span style={{ fontWeight: 700 }}>{raidShields}</span>
              </button>
            )}
            {receivedLikes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#c9a8f5' }}>
                <HeartHandshake size={11} color="#c9a8f5" />
                <span>{receivedLikes}</span>
              </div>
            )}
            <div style={styles.currencyBadge}>
              <Gem size={11} color="#5b9bf0" />
              <span style={{ marginLeft: 4 }}>{currencyBalance}</span>
            </div>
          </div>
        </div>
        <div style={styles.levelBarTrack}>
          <div style={{ ...styles.levelBarFill, width: `${levelState.progressPct}%` }} />
        </div>
        {/* Shield active green strip — hugs the XP bar */}
        {activeShield && (() => {
          const daysSince = Math.floor((new Date() - new Date(activeShield.date)) / 86400000);
          if (daysSince >= 1) return null;
          return (
            <div style={{ height: 3, background: 'linear-gradient(90deg, #1adf8a, #4ce0c0)', borderRadius: '0 0 4px 4px', marginTop: 1, boxShadow: '0 0 6px #4ce0c055' }} />
          );
        })()}
      </div>

      {(ritualXpBonus > 0 || activeChallengeBuff || challengeFailDebuff || unomieDebuff) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          {ritualXpBonus > 0 && (() => {
            const today = dateKey(new Date());
            const todayEntry = (morningRitualLog || []).find(r => r.date === today);
            const todayRitual = todayEntry ? MORNING_RITUALS.find(r => r.id === todayEntry.ritualId) : null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: '#1a0f2a', border: '1px solid #3a2a5a', borderRadius: 8 }}>
                <span style={{ fontSize: 11 }}>{todayRitual ? todayRitual.emoji : '🌄'}</span>
                <span style={{ fontSize: 10, color: '#c9a8f5', fontWeight: 700 }}>
                  {todayRitual ? todayRitual.name : 'Ритуал'} · +5% XP
                </span>
              </div>
            );
          })()}
          {activeChallengeBuff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: '#0f2a12', border: '1px solid #2a5a2a', borderRadius: 8 }}>
              <Sparkles size={11} color="#7adf5a" />
              <span style={{ fontSize: 10, color: '#7adf5a', fontWeight: 700 }}>{activeChallengeBuff.name} · +{activeChallengeBuff.xpBonusPct}%</span>
            </div>
          )}
          {challengeFailDebuff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: '#2a1212', border: '1px solid #5a2a2a', borderRadius: 8 }}>
              <Skull size={11} color="#e05f4a" />
              <span style={{ fontSize: 10, color: '#e05f4a', fontWeight: 700 }}>Сломленная клятва · −10%</span>
            </div>
          )}
          {unomieDebuff && new Date(unomieDebuff.expiresDate) > new Date() && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: '#1a1a2a', border: '1px solid #3a3a5a', borderRadius: 8 }}>
              <span style={{ fontSize: 11 }}>😔</span>
              <span style={{ fontSize: 10, color: '#8a8ae0', fontWeight: 700 }}>Уныние · −10%</span>
            </div>
          )}
        </div>
      )}

      <div style={styles.healthBarsWrap}>
        <div>
          <HealthBar icon={Heart} label="" value={healthState.physical} color="#e8633c" />
          {healthState.fatigueDebuffCount > 0 && (
            <DebuffBadge icon={Zap} label="Усталость" count={healthState.fatigueDebuffCount} />
          )}
        </div>
        <div>
          <HealthBar icon={Brain} label="" value={healthState.mental} color="#4f7cff" />
          {healthState.stressDebuffCount > 0 && (
            <DebuffBadge icon={Zap} label="Стресс" count={healthState.stressDebuffCount} />
          )}
          {healthState.poisonCount > 0 && <PoisonVials count={healthState.poisonCount} max={POISON_THRESHOLD} />}
          {healthState.poisonCount > 0 && healthState.poisonCount < POISON_THRESHOLD && (
            <span style={{ fontSize: 9.5, color: '#e08a8a', marginTop: 2 }}>
              ещё {POISON_THRESHOLD - healthState.poisonCount} {(POISON_THRESHOLD - healthState.poisonCount) === 1 ? 'зажор' : (POISON_THRESHOLD - healthState.poisonCount) < 5 ? 'зажора' : 'зажоров'} до штрафа −10 XP
            </span>
          )}
        </div>
      </div>

      {healthState.xpBlocked && (
        <div style={styles.xpBlockedBanner}>
          Рост опыта остановлен — восстанови здоровье до 50%, чтобы продолжить прокачку
        </div>
      )}

      {nudges && nudges.length > 0 && (
        <div style={{
          margin: '8px 0 0', padding: '8px 14px',
          background: 'linear-gradient(135deg, #2a1a3a, #1a1228)',
          border: '1px solid #5a3a8a', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>👊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c9a8f5' }}>
              {nudges[nudges.length - 1].from.replace(/_/g, ' ')} пнул тебя!
            </div>
            <div style={{ fontSize: 10, color: '#7a5aaa' }}>Давай, не отлынивай от тренировок!</div>
          </div>
          <button onClick={onDismissNudges} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a3a6a', fontSize: 16 }}>✕</button>
        </div>
      )}

      {showAchModal && (
        <AchievementsModal
          achievements={achievements}
          mythicAchievements={mythicAchievements}
          pentaResults={pentaResults}
          comboCounts={comboCounts}
          balanceCounts={balanceCounts}
          secretAchievements={secretAchievements}
          unlockedCount={unlockedCount}
          totalAchievements={totalAchievements}
          onClose={() => setShowAchModal(false)}
        />
      )}

      {showShieldConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: '#1c1c24', border: '1.5px solid #2a5a3a', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#4ce0c0', marginBottom: 8 }}>Активировать щит?</div>
            <div style={{ fontSize: 12, color: '#7a9a92', lineHeight: 1.5, marginBottom: 20 }}>
              Щит рейда защитит твой стрик сегодня. Осталось: <span style={{ color: '#4ce0c0', fontWeight: 700 }}>{raidShields}/{MAX_RAID_SHIELDS}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowShieldConfirm(false)} style={{
                flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                background: 'none', border: '1px solid #3a3a42', fontSize: 13, fontWeight: 700, color: '#6a6a72',
              }}>Нет</button>
              <button onClick={() => { onUseRaidShield(); setShowShieldConfirm(false); }} style={{
                flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                background: 'linear-gradient(135deg, #0f2a1a, #1a4a2a)', border: '1.5px solid #2a7a4a',
                fontSize: 13, fontWeight: 800, color: '#4ce0c0',
              }}>Да, активировать</button>
            </div>
          </div>
        </div>
      )}

      {showTitlesModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0e0e13', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))', position: 'sticky', top: 0, background: '#0e0e13', borderBottom: '1px solid #22222a', zIndex: 2, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crown size={17} color="#f0d272" />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#f0f0f4' }}>Титулы</span>
              <span style={{ fontSize: 11, color: '#6a6a72' }}>{earnedTitles.length} получено</span>
            </div>
            <button onClick={() => setShowTitlesModal(false)} style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 10, cursor: 'pointer', padding: 8, display: 'flex' }}>
              <X size={18} color="#9a9aa2" />
            </button>
          </div>
          <div style={{ padding: '16px 14px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', animation: 'fadeUp 0.2s ease' }}>
            <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 12 }}>
              Выбери активный титул — он будет отображаться в шапке.
              {titleCooldownDays > 0 && (
                <span style={{ display: 'block', color: '#8a5a2a', fontWeight: 700, marginTop: 4 }}>
                  ⏳ Смена титула доступна через {titleCooldownDays} {titleCooldownDays === 1 ? 'день' : titleCooldownDays < 5 ? 'дня' : 'дней'}
                </span>
              )}
            </div>

            {/* Reset to level title */}
            <div
              onClick={() => { if (titleCooldownDays > 0) return; setActiveTitle(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: !activeTitle ? '#1f2e1a' : '#1e1e26', borderRadius: 9, padding: '9px 12px', marginBottom: 8, border: `1px solid ${!activeTitle ? '#3a5a3a' : '#28282f'}`, cursor: titleCooldownDays > 0 ? 'not-allowed' : 'pointer', opacity: titleCooldownDays > 0 && activeTitle ? 0.5 : 1 }}
            >
              <Star size={13} color={levelState.titleColor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: !activeTitle ? levelState.titleColor : '#dcdce2' }}>{levelState.title}</div>
                <div style={{ fontSize: 10.5, color: '#6a6a72' }}>Уровневый титул (по умолчанию)</div>
              </div>
              {!activeTitle && <div style={{ fontSize: 10, color: '#7de87d', fontWeight: 700 }}>Активен</div>}
            </div>

            {earnedTitles.length === 0 && (
              <div style={{ fontSize: 12, color: '#5a5a62', textAlign: 'center', padding: 16 }}>Выполняй ачивки, комбо и рейды чтобы получить новые титулы</div>
            )}

            {earnedTitles.map((t) => {
              const isActive = activeTitle?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => { if (titleCooldownDays > 0) return; setActiveTitle(isActive ? null : t); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: isActive ? t.color + '18' : '#1e1e26', borderRadius: 9, padding: '9px 12px', marginBottom: 6, border: `1px solid ${isActive ? t.color + '55' : '#28282f'}`, cursor: titleCooldownDays > 0 ? 'not-allowed' : 'pointer', opacity: titleCooldownDays > 0 && !isActive ? 0.5 : 1 }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? t.color : '#dcdce2' }}>{t.text}</div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72' }}>{t.source}</div>
                  </div>
                  {isActive && <div style={{ fontSize: 10, color: t.color, fontWeight: 700 }}>★ Активен</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showProfileModal && (() => {
        // Build a self-member object matching GuildMemberDetail's expected shape
        const selfLogs = logs || [];
        const totalKm = selfLogs.filter(l => l.activity === 'running').reduce((s, l) => s + (Number(l.distance) || 0), 0);
        const totalPages = selfLogs.filter(l => l.activity === 'reading').reduce((s, l) => s + (Number(l.pages) || 0), 0);
        const totalTrainings = selfLogs.filter(l => ['strength_gym','strength_park','wrestling'].includes(l.activity)).length;
        const totalKcal = selfLogs.filter(l => l.activity === 'calories').reduce((s, l) => s + (Number(l.kcal) || 0), 0);
        const totalSteps = selfLogs.filter(l => l.activity === 'walking').reduce((s, l) => s + (Number(l.steps) || 0), 0);
        const activityCounts = {};
        selfLogs.forEach(l => { activityCounts[l.activity] = (activityCounts[l.activity] || 0) + 1; });
        const receivedLikesTotal = receivedLikes || 0;
        const clsColor = (currentClass?.combo ? currentClass.classA : currentClass)?.color || '#8a8a92';
        const baseClass = currentClass?.combo ? currentClass.classA : currentClass;
        const chosenPath = lockedClassId && chosenPathId ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId) : null;
        // Top achievements from achievementsEvaluated
        const tierW = { platinum: 5, diamond: 4, gold: 3, silver: 2, bronze: 1, special: 3 };
        const selfBadges = (achievements || [])
          .filter(a => a.achievedTierIndex >= 0)
          .map(a => ({ name: a.tiers[a.achievedTierIndex].name, tier: a.tiers[a.achievedTierIndex].tier, achTitle: a.title }))
          .sort((a, b) => (tierW[b.tier] || 0) - (tierW[a.tier] || 0))
          .slice(0, 3);
        const selfMember = {
          name: name, characterName: name,
          level: levelState.level,
          cls: baseClass,
          subclassName: currentClass?.combo ? currentClass.name : null,
          pathName: chosenPath?.name || null,
          titleText: displayTitle, titleColor: displayTitleColor,
          physicalHp: healthState.physical, mentalHp: healthState.mental,
          achievementNames: selfBadges.map(b => b.name),
          achievementBadges: selfBadges,
          totalAchievementCount: (achievements || []).filter(a => a.achievedTierIndex >= 0).length,
          raidIds: [],
          isPlayer: true,
          likes: {},
          activityCounts,
          streaks: streaksByActivity || {},
          totalKm: Math.round(totalKm * 10) / 10,
          totalPages,
          totalTrainings,
          totalKcal: Math.round(totalKcal),
          totalSteps,
          totalLogs: selfLogs.length,
          equippedCount: Object.values(equippedShopItems || {}).filter(Boolean).length,
          bestiaryCount: bestiary.length,
          activeBackground,
          avatarFrameId: equippedAvatarFrame || null,
          lockedClassId, chosenPathId,
          unlockedSkillLevels: [],
          classChoiceMode, comboClassId, comboPathId, unlockedComboSkillLevels,
          specPathId, unlockedSpecSkillLevels,
          personalRecords,
        };
        return (
          <GuildMemberDetail
            member={selfMember}
            onClose={() => setShowProfileModal(false)}
            isSelf={true}
            receivedLikesOverride={receivedLikesTotal}
            onNudge={null}
            onTransferCrystals={null}
            onGiftItem={null}
            myPurchasedItemIds={[]}
            myEquippedShopItems={{}}
            myCurrencyBalance={currencyBalance}
          />
        );
      })()}
    </div>
  );
});

const PoisonVials = React.memo(function PoisonVials({ count, max }) {
  return (
    <div style={styles.poisonVialsRow}>
      {Array.from({ length: max }).map((_, idx) => {
        const filled = idx < count;
        return (
          <FlaskConical
            key={idx}
            size={14}
            color={filled ? '#c9a8f5' : '#3a3a44'}
            fill={filled ? '#c9a8f555' : 'none'}
            strokeWidth={filled ? 2.2 : 1.8}
            style={{ animation: filled ? 'popIn 0.3s ease' : 'none' }}
          />
        );
      })}
      <span style={styles.poisonVialsLabel}>Отравление {count}/{max}</span>
    </div>
  );
});

const DebuffBadge = React.memo(function DebuffBadge({ icon: Icon, label, count }) {
  return (
    <div style={styles.debuffBadge}>
      <Icon size={11} color="#ff5c7a" />
      <span style={styles.debuffBadgeText}>{label} ×{count}</span>
    </div>
  );
});

const HealthBar = React.memo(function HealthBar({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.healthBarItem}>
      <div style={styles.healthBarLabelRow}>
        <Icon size={11} color={color} />
        <span style={styles.healthBarLabel}>{label}</span>
        <span style={styles.healthBarValue}>{value}%</span>
      </div>
      <div style={styles.statBarTrack}>
        <div style={{ ...styles.statBarFill, width: `${value}%`, background: color }} />
      </div>
    </div>
  );
});

const Tabs = React.memo(function Tabs({ tab, setTab, archiveUnlocked }) {
  const items = [
    { key: 'dashboard', label: 'Прогресс' },
    { key: 'character', label: 'Персонаж' },
    { key: 'challenges', label: '🔥 Вызовы' },
    { key: 'raids', label: '⚔️ Рейды' },
    { key: 'guild', label: '🛡️ Гильдия' },
    { key: 'classes', label: 'Пути' },
  ];
  if (archiveUnlocked) items.push({ key: 'archive', label: 'Архив премудростей' });
  return (
    <div className="tabBarScroll" style={styles.tabBar}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          style={{
            ...styles.tabBtn,
            color: tab === it.key ? '#f0d272' : '#8a8a92',
            borderBottom: tab === it.key ? '2px solid #f0d272' : '2px solid transparent',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
});

const MorningRitualSection = React.memo(function MorningRitualSection({ morningRitualLog, onPerformRitual, ritualXpBonus, currentClassId }) {
  const today = dateKey(new Date());
  const todayRitual = morningRitualLog?.find(r => r.date === today);
  const ritual = todayRitual ? MORNING_RITUALS.find(r => r.id === todayRitual.ritualId) : null;
  const now = new Date();
  const isMorning = now.getHours() < 12;

  // Блок полностью скрыт если: ритуал уже выбран (бафф ушёл в хедер) ИЛИ уже после 12:00
  if (ritual || !isMorning) return null;

  const [open, setOpen] = useState(true);

  function handlePick(id) {
    onPerformRitual(id);
  }

  return (
    <div style={{
      marginBottom: 16, borderRadius: 14, overflow: 'hidden',
      background: '#1a1428',
      border: '1.5px solid #6a3a9a',
      boxShadow: '0 0 18px #7a3aaa55, 0 0 6px #c9a8f533',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18 }}>🌄</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#d4b8ff' }}>
            Утренний ритуал
          </div>
          <div style={{ fontSize: 10.5, marginTop: 1, color: '#9a6acd' }}>
            Нажми чтобы выбрать ритуал · +5% XP на день
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#c9a8f5', animation: open ? 'none' : 'pulse 2s infinite' }}>✨</div>
        <ChevronDown size={14} color="#5a5a72" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '0 12px 12px' }}>
          {MORNING_RITUALS.map(r => (
            <button
              key={r.id}
              onClick={() => handlePick(r.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                cursor: 'pointer',
                background: '#1e1428', border: '1px solid #3a2a4a',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{r.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#d0b8f5', lineHeight: 1.2 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: '#8a7a9a', marginTop: 3, fontStyle: 'italic', lineHeight: 1.4 }}>{r.lore}</div>
                <div style={{ fontSize: 10.5, color: '#c0a8e0', marginTop: 5, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: '#9a6acd' }}>Что делать: </span>{r.howTo}
                </div>
                <div style={{ fontSize: 9.5, color: '#6a5a7a', marginTop: 4 }}>+5% XP на день · +1 {r.stat}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const Dashboard = React.memo(function Dashboard({ statTotals, onLogActivity, streaksByActivity, achievementsEvaluated, expandedActivity, setExpandedActivity, passiveLogs, onTogglePassive, books, onAddBook, onToggleBookFinished, onRemoveBook, onLogRecovery, recoveryLogs, morningRitualLog, onPerformRitual, ritualXpBonus, challengeState, challengeProgress, activeRoadBuffs }) {
  function achievementsForActivity(key) {
    return achievementsEvaluated.filter((a) => (Array.isArray(a.activity) ? a.activity.includes(key) : a.activity === key));
  }

  // Compact active challenge card for Dashboard
  const activeChallengeCard = (() => {
    if (!challengeState?.active || !challengeProgress) return null;
    const { def, dayResults, elapsed, missedSoFar, maxAllowed, completedSoFar } = challengeProgress;
    const catDef = CHALLENGE_CATEGORIES.find(c => c.id === def.category);
    const catColor = catDef?.color || '#e0a868';
    const CatIcon = catDef?.icon || Star;
    const progressPct = Math.round((elapsed / def.duration) * 100);
    const endDate = new Date(challengeState.active.startDate);
    endDate.setDate(endDate.getDate() + def.duration);
    const diff = endDate - new Date();
    const timeLeft = diff <= 0 ? 'Завершение...' : Math.floor(diff / 86400000) > 0
      ? `${Math.floor(diff / 86400000)} дн.`
      : `${Math.floor(diff / 3600000)}ч`;
    return (
      <div style={{ background: '#1c1c22', border: `1.5px solid ${catColor}33`, borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {def.icon ? <img src={def.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CatIcon size={13} color={catColor} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f0f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔥 {def.name}</div>
            <div style={{ fontSize: 9.5, color: '#6a6a72' }}>{def.description}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: catColor, flexShrink: 0 }}>{timeLeft}</div>
        </div>
        <div style={{ height: 4, background: '#25252c', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
          <div style={{ height: '100%', width: progressPct + '%', background: catColor, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6a6a72' }}>
          {def.countBased
            ? <span style={{ color: catColor }}>✓ {completedSoFar}/{def.countGoal} выполнено</span>
            : <><span style={{ color: '#5adf5a' }}>✓ {dayResults.slice(0, elapsed).filter(Boolean).length}</span><span style={{ color: '#e05f4a' }}>✕ {missedSoFar}/{maxAllowed}</span></>
          }
          <span>День {elapsed}/{def.duration}</span>
        </div>
      </div>
    );
  })();

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <MorningRitualSection
        morningRitualLog={morningRitualLog}
        onPerformRitual={onPerformRitual}
        ritualXpBonus={ritualXpBonus}
        currentClassId={null}
      />
      {activeChallengeCard}
      {activeRoadBuffs && activeRoadBuffs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {activeRoadBuffs.map((b, i) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(b.expiresDate) - new Date()) / 86400000));
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
                background: '#1a2a1a', border: '1px solid #3a5a2a', fontSize: 10.5,
              }}>
                <span style={{ color: '#7adf5a', fontWeight: 700 }}>🗺️ {b.name}</span>
                <span style={{ color: '#5a8a4a' }}>+{b.xpBonusPct}% · {daysLeft}д</span>
              </div>
            );
          })}
        </div>
      )}
      <SectionLabel text="Записать активность" />
      <div style={styles.activityGrid}>
        {Object.entries(ACTIVITY_TYPES).map(([key, def]) => {
          const Icon = def.icon;
          const streak = streaksByActivity[key];
          const isOpen = expandedActivity === key;
          const acts = achievementsForActivity(key);
          const numericAch = acts.find((a) => a.kind === 'cumulative_value' || a.kind === 'cumulative_count' || a.kind === 'cal_cumulative' || a.kind === 'cal_single_day');
          const streakAch = acts.find((a) => a.kind === 'streak' || a.kind === 'cal_streak_threshold');

          return (
            <div key={key} style={{ ...styles.activityCard, gridColumn: isOpen ? '1 / -1' : 'auto' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedActivity(isOpen ? null : key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedActivity(isOpen ? null : key);
                  }
                }}
                style={{
                  cursor: 'pointer', position: 'relative', aspectRatio: '5 / 4', width: '100%',
                }}
              >
                {def.bgImage ? (
                  <img src={def.bgImage} alt="" style={styles.activityBgImage} />
                ) : (
                  <Icon size={64} color={def.color} style={styles.activityIconBg} strokeWidth={1.5} />
                )}
                <div style={styles.activityCardTextOverlay}>
                  <div style={styles.activityCardLabel}>{def.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    {streak > 0 && (
                      <div style={styles.streakPill}>
                        <Flame size={11} color="#e0a868" /> {streak}
                      </div>
                    )}
                    <ChevronDown
                      size={13}
                      color="#5a5a62"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: 'auto' }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogActivity(key); }}
                style={styles.cardPlusBtn}
                aria-label={`Записать: ${def.label}`}
              >
                <Plus size={16} color="#f0f0f4" />
              </button>

              {isOpen && (
                <div style={styles.cardExpand}>
                  {numericAch ? (
                    <MiniProgress
                      label={numericAch.nextTier ? `До «${numericAch.nextTier.name}»` : 'Все тиры открыты'}
                      current={numericAch.currentValue}
                      target={numericAch.nextTier ? numericAch.nextTier.need : numericAch.currentValue}
                      unit={numericAch.unit}
                      color={def.color}
                    />
                  ) : (
                    <div style={styles.cardExpandEmpty}>Нет числовой ачивки</div>
                  )}
                  {streakAch ? (
                    <MiniProgress
                      label={streakAch.nextTier ? `До «${streakAch.nextTier.name}»` : 'Все тиры открыты'}
                      current={streakAch.currentValue}
                      target={streakAch.nextTier ? streakAch.nextTier.need : streakAch.currentValue}
                      unit="дней подряд"
                      color="#e0a868"
                    />
                  ) : (
                    <div style={styles.cardExpandEmpty}>Нет ачивки на стрик</div>
                  )}
                  {key === 'reading' && (
                    <BookTracker books={books} onAddBook={onAddBook} onToggleFinished={onToggleBookFinished} onRemoveBook={onRemoveBook} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SectionLabel text="Дебаффы" style={{ marginTop: 24 }} />
      <PassiveTracker passiveLogs={passiveLogs} onTogglePassive={onTogglePassive} />

      <RecoverySection onLogRecovery={onLogRecovery} recoveryLogs={recoveryLogs} />
    </div>
  );
});

const MiniProgress = React.memo(function MiniProgress({ label, current, target, unit, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 100;
  return (
    <div style={styles.miniProgressBlock}>
      <div style={styles.miniProgressLabelRow}>
        <span style={styles.miniProgressLabel}>{label}</span>
        <span style={styles.miniProgressValue}>{current}/{target} {unit}</span>
      </div>
      <div style={styles.statBarTrack}>
        <div style={{ ...styles.statBarFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
});

// 6 radar vertices, one per activity group, each averaging its pair of stats.
// Strength (park) and strength (gym) share identical stats, so they collapse into one "Силовая" vertex.
const RADAR_GROUPS = [
  { label: 'Бег', statLabel: 'Стойкость', stats: ['Выносливость', 'Воля'], color: ACTIVITY_TYPES.running.color },
  { label: 'Силовая', statLabel: 'Мощь', stats: ['Сила', 'Упорство'], color: ACTIVITY_TYPES.strength_gym.color },
  { label: 'Борьба', statLabel: 'Рефлексы', stats: ['Силовая выносливость', 'Гибкость'], color: ACTIVITY_TYPES.wrestling.color },
  { label: 'Питание', statLabel: 'Самоконтроль', stats: ['Фокус', 'Дисциплина'], color: ACTIVITY_TYPES.nutrition.color },
  { label: 'Сон', statLabel: 'Жизненная сила', stats: ['Дух', 'ХП'], color: ACTIVITY_TYPES.sleep.color },
  { label: 'Чтение', statLabel: 'Разум', stats: ['Интеллект', 'Мышление'], color: ACTIVITY_TYPES.reading.color },
];

const RADAR_MAX = 600; // max stat for a 50-level active player

const StatRadar = React.memo(function StatRadar({ statTotals }) {
  const size = 420;
  const center = size / 2;
  const radius = 150;
  const n = RADAR_GROUPS.length;

  function groupValue(group) {
    const sum = group.stats.reduce((acc, s) => acc + (statTotals[s] || 0), 0);
    return sum / group.stats.length;
  }

  function pointFor(idx, value) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const ratio = Math.min(value, RADAR_MAX) / RADAR_MAX;
    const r = ratio * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  function axisEndFor(idx) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
  }

  function labelPointFor(idx) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = radius + 32;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  const dataPoints = RADAR_GROUPS.map((group, idx) => pointFor(idx, groupValue(group)));
  const dataPath = dataPoints.map((p) => p.join(',')).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div style={styles.radarWrap}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Радар характеристик персонажа">
        {/* grid rings, labeled with the actual stat % they represent under the sqrt scale */}
        {gridLevels.map((lvl) => {
          const pts = RADAR_GROUPS.map((_, idx) => {
            const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
            const r = radius * lvl;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          const realPct = Math.round(lvl * 100);
          return (
            <g key={lvl}>
              <polygon points={pts} fill="none" stroke="#2a2a32" strokeWidth="1" />
              <text x={center + 4} y={center - radius * lvl - 2} fill="#4a4a52" fontSize="8" textAnchor="start">
                {realPct}%
              </text>
            </g>
          );
        })}

        {/* axes, colored by owning activity */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = axisEndFor(idx);
          return <line key={group.label} x1={center} y1={center} x2={x} y2={y} stroke={group.color} strokeOpacity="0.35" strokeWidth="1" />;
        })}

        {/* data shape */}
        <polygon points={dataPath} fill="#7a6ae0" fillOpacity="0.22" stroke="#7a6ae0" strokeWidth="1.5" />

        {/* data points, colored by activity */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = dataPoints[idx];
          return <circle key={group.label} cx={x} cy={y} r="2.6" fill={group.color} />;
        })}

        {/* labels */}
        {RADAR_GROUPS.map((group, idx) => {
          const [x, y] = labelPointFor(idx);
          return (
            <text
              key={group.label}
              x={x}
              y={y}
              fill={group.color}
              fontSize="13"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {group.statLabel}
            </text>
          );
        })}
      </svg>

      <div style={styles.radarLegend}>
        {Object.values(ACTIVITY_TYPES).map((def) => (
          <div key={def.label} style={styles.radarLegendItem}>
            <span style={{ ...styles.radarLegendDot, background: def.color }} />
            {def.label}
          </div>
        ))}
      </div>
    </div>
  );
});

const BookTracker = React.memo(function BookTracker({ books, onAddBook, onToggleFinished, onRemoveBook }) {
  const [draft, setDraft] = useState('');

  function submit() {
    if (!draft.trim()) return;
    onAddBook(draft);
    setDraft('');
  }

  return (
    <div style={styles.bookTrackerWrap}>
      <div style={styles.bookTrackerLabel}>Гол-скор по книгам</div>
      <div style={styles.bookInputRow}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Название книги"
          style={styles.bookInput}
        />
        <button onClick={submit} style={styles.bookAddBtn} aria-label="Добавить книгу">
          <Plus size={14} color="#1c1505" />
        </button>
      </div>
      {books.length === 0 ? (
        <div style={styles.cardExpandEmpty}>Пока нет книг в списке</div>
      ) : (
        <div style={styles.bookList}>
          {books.map((b) => (
            <div key={b.id} style={styles.bookRow}>
              <button
                onClick={() => onToggleFinished(b.id)}
                style={{
                  ...styles.bookCheck,
                  background: b.finished ? '#4caf6d22' : 'transparent',
                  borderColor: b.finished ? '#4caf6d' : '#3a3a42',
                }}
                aria-label={b.finished ? 'Отметить непрочитанной' : 'Отметить прочитанной'}
              >
                {b.finished && <Check size={12} color="#4caf6d" />}
              </button>
              <span style={{ ...styles.bookTitle, textDecoration: b.finished ? 'line-through' : 'none', opacity: b.finished ? 0.6 : 1 }}>
                {b.title}
              </span>
              <button onClick={() => onRemoveBook(b.id)} style={styles.bookRemoveBtn} aria-label="Удалить книгу">
                <X size={12} color="#5a5a62" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const RecoverySection = React.memo(function RecoverySection({ onLogRecovery, recoveryLogs }) {
  const [open, setOpen] = useState(false);
  const today = dateKey(new Date());
  const todayTypes = new Set(recoveryLogs.filter((r) => r.date === today).map((r) => r.type));
  const todayCount = todayTypes.size;

  const shortTypes = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'short');
  const longTypes  = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'long');
  const restTypes  = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'rest');
  const fatigueTypes = Object.entries(RECOVERY_TYPES).filter(([, def]) => def.tier === 'fatigue_relief');

  const TIER_COLOR = { short: '#4ce0c0', long: '#f0c14b', rest: '#8a8a92' };

  function renderCard([key, def]) {
    const Icon = def.icon;
    const doneToday = todayTypes.has(key);
    const color = TIER_COLOR[def.tier];
    return (
      <button
        key={key}
        onClick={() => onLogRecovery(key)}
        disabled={doneToday}
        style={{
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: doneToday ? '#0d1e1b' : '#0f2622cc',
          border: `1px solid ${doneToday ? '#1a3830' : color + '44'}`,
          borderRadius: 10, padding: '10px 10px 8px',
          cursor: doneToday ? 'not-allowed' : 'pointer',
          minHeight: 72, textAlign: 'left',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        <Icon
          size={48}
          color={doneToday ? '#2a3f3a' : color}
          style={{
            position: 'absolute', right: -6, top: '50%',
            transform: 'translateY(-50%)',
            opacity: doneToday ? 0.12 : 0.18,
            pointerEvents: 'none',
          }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: doneToday ? '#3a5a54' : '#d6f5ec', lineHeight: 1.25, position: 'relative', zIndex: 1 }}>
          {def.label}
        </span>
        {doneToday && (
          <span style={{ fontSize: 9.5, color: '#2a7a6a', fontWeight: 700, marginTop: 2, position: 'relative', zIndex: 1 }}>
            ✓ сегодня
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={styles.recoveryWrap}>
      <button
        onClick={() => setOpen(!open)}
        style={{ ...styles.recoverySectionHeader, cursor: 'pointer', background: 'none', border: 'none', width: '100%', padding: 0, textAlign: 'left', marginBottom: open ? 12 : 0 }}
      >
        <Sparkles size={15} color="#4ce0c0" />
        <span style={styles.recoverySectionTitle}>Восстановление</span>
        {todayCount > 0 && <span style={{ fontSize: 10, color: '#2a7a6a', fontWeight: 700 }}>✓ {todayCount} сегодня</span>}
        <ChevronDown size={14} color="#4ce0c0" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#4ce0c0aa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              Короткие
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {shortTypes.map(renderCard)}
              {restTypes.map(renderCard)}
              {fatigueTypes.map(renderCard)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#f0c14baa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              Длительные
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {longTypes.map(renderCard)}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

const PassiveTracker = React.memo(function PassiveTracker({ passiveLogs, onTogglePassive }) {
  const today = dateKey(new Date());
  const todaySet = new Set(passiveLogs.filter((p) => p.date === today).map((p) => p.type));

  return (
    <div style={styles.passiveGrid}>
      {Object.entries(PASSIVE_TYPES).filter(([key]) => key !== 'stagnation').map(([key, def]) => {
        const Icon = def.icon;
        const active = todaySet.has(key);
        return (
          <button
            key={key}
            onClick={() => onTogglePassive(key)}
            style={{
              ...styles.passiveCard,
              borderColor: active ? '#6a4f9c' : '#28282f',
              background: active ? '#241c30' : '#1c1c22',
            }}
          >
            <Icon size={16} color={active ? '#c9a8f5' : '#6a6a72'} />
            <span style={{ ...styles.passiveLabel, color: active ? '#dcc8f5' : '#9a9aa2' }}>{def.label}</span>
          </button>
        );
      })}
    </div>
  );
});

const StatBars = React.memo(function StatBars({ statTotals }) {
  const max = RADAR_MAX;
  return (
    <div style={styles.statGrid}>
      {ALL_STATS.map((stat) => {
        const val = Math.round(statTotals[stat]);
        const pct = Math.min(100, (val / max) * 100);
        return (
          <div key={stat} style={styles.statRow}>
            <div style={styles.statLabelRow}>
              <span style={styles.statLabel}>{stat}</span>
              <span style={styles.statValue}>{val}</span>
            </div>
            <div style={styles.statBarTrack}>
              <div style={{ ...styles.statBarFill, width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
});

const HallOfFameButton = React.memo(function HallOfFameButton({ unlockedTiers }) {
  const [showModal, setShowModal] = useState(false);
  if (unlockedTiers.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #1e1c10, #1a1810)',
          border: '1.5px solid #4a3a1f', borderRadius: 12,
          padding: '12px 16px', cursor: 'pointer', marginBottom: 16, marginTop: 8,
          textAlign: 'left',
        }}
      >
        <Medal size={18} color="#d4af37" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0d272' }}>Доска почёта</div>
          <div style={{ fontSize: 10.5, color: '#8a7a52' }}>{unlockedTiers.length} достижений разблокировано</div>
        </div>
        <div style={{ display: 'flex', gap: -4 }}>
          {unlockedTiers.slice(0, 4).map((item, i) => {
            const colors = TIER_COLORS[item.tier.tier] || TIER_COLORS.special;
            return <Trophy key={i} size={14} color={colors.text} style={{ marginLeft: i > 0 ? -3 : 0 }} />;
          })}
          {unlockedTiers.length > 4 && <span style={{ fontSize: 10, color: '#8a7a52', marginLeft: 4 }}>+{unlockedTiers.length - 4}</span>}
        </div>
      </button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#111118', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>

            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              background: 'linear-gradient(135deg, #1e1a0e, #15130a)',
              borderBottom: '1px solid #3a2e14',
              padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Medal size={24} color="#d4af37" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#f0d272', letterSpacing: 0.5 }}>Доска почёта</div>
                <div style={{ fontSize: 11, color: '#8a7a52' }}>{unlockedTiers.length} подвигов увековечено</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>

            {/* Board */}
            <div style={{ padding: '20px 16px 40px' }}>
              <div style={{
                background: 'linear-gradient(180deg, #1a1708 0%, #12100a 100%)',
                border: '2px solid #3a2e14',
                borderRadius: 16,
                padding: '20px 16px',
                boxShadow: 'inset 0 0 40px rgba(212,175,55,0.06)',
              }}>
                {/* Decorative top */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 28 }}>🏛️</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6a5a2a', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>Зал воинской славы</div>
                  <div style={{ width: 60, height: 1, background: '#3a2e14', margin: '10px auto' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {unlockedTiers.map((item, idx) => {
                    const colors = TIER_COLORS[item.tier.tier] || TIER_COLORS.special;
                    return (
                      <div key={`${item.achId}-${idx}`} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        borderRadius: 10, padding: '10px 14px',
                      }}>
                        <Trophy size={18} color={colors.text} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: colors.text }}>{item.tier.name}</div>
                          <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 1 }}>{item.achTitle}</div>
                        </div>
                        <div style={{
                          fontSize: 8.5, fontWeight: 700, color: colors.text, opacity: 0.6,
                          textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0,
                        }}>
                          {item.tier.tier === 'platinum' ? '💎' : item.tier.tier === 'gold' ? '🥇' : item.tier.tier === 'silver' ? '🥈' : item.tier.tier === 'bronze' ? '🥉' : '⭐'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Decorative bottom */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <div style={{ width: 60, height: 1, background: '#3a2e14', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 9, color: '#4a3a1a', fontStyle: 'italic' }}>«Слава тем, кто не отступает»</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

const HallOfFame = React.memo(function HallOfFame({ unlockedTiers }) {
  if (unlockedTiers.length === 0) return null;
  return (
    <div style={styles.hallOfFameWrap}>
      <div style={styles.hallOfFameHeader}>
        <Medal size={14} color="#d4af37" />
        <span style={styles.hallOfFameTitle}>Доска почёта</span>
        <span style={styles.hallOfFameCount}>{unlockedTiers.length}</span>
      </div>
      <div className="hallOfFameScroll" style={styles.hallOfFameScroll}>
        {unlockedTiers.map((item, idx) => {
          const colors = TIER_COLORS[item.tier.tier] || TIER_COLORS.special;
          return (
            <div key={`${item.achId}-${idx}`} style={{ ...styles.hallOfFameMedal, borderColor: colors.border, background: colors.bg }}>
              <Trophy size={16} color={colors.text} />
              <span style={{ ...styles.hallOfFameMedalName, color: colors.text }}>{item.tier.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ProgressRow = React.memo(function ProgressRow({ achievement }) {
  const def = Array.isArray(achievement.activity) ? null : ACTIVITY_TYPES[achievement.activity];
  const pct = Math.min(100, (achievement.currentValue / achievement.nextTier.need) * 100);
  return (
    <div style={styles.progressRow}>
      <div style={{ flex: 1 }}>
        <div style={styles.progressTitle}>{achievement.title}</div>
        <div style={styles.progressSub}>
          {achievement.nextTier.name} · {achievement.currentValue}/{achievement.nextTier.need} {achievement.unit}
        </div>
        <div style={styles.statBarTrack}>
          <div style={{ ...styles.statBarFill, width: `${pct}%`, background: '#e8633c' }} />
        </div>
      </div>
    </div>
  );
});

const SectionLabel = React.memo(function SectionLabel({ text, style }) {
  return <div style={{ ...styles.sectionLabel, ...style }}>{text}</div>;
});

const ACHIEVEMENT_GROUPS = [
  { label: 'Бег', icon: Flame, color: ACTIVITY_TYPES.running.color, ids: ['run_distance', 'run_streak', 'run_total_km'] },
  { label: 'Силовая в парке', icon: Dumbbell, color: ACTIVITY_TYPES.strength_park.color, ids: ['strength_park_style', 'strength_park_total'] },
  { label: 'Силовая в зале', icon: Dumbbell, color: ACTIVITY_TYPES.strength_gym.color, ids: ['strength_gym_style', 'strength_gym_total'] },
  { label: 'Борьба', icon: Swords, color: ACTIVITY_TYPES.wrestling.color, ids: ['wrestling_style', 'wrestling_total'] },
  { label: 'Силовые', icon: Dumbbell, color: '#c9a227', ids: ['strength_weekly'] },
  { label: 'Питание', icon: Salad, color: ACTIVITY_TYPES.nutrition.color, ids: ['nutrition_streak', 'nutrition_total'] },
  { label: 'Сон', icon: Moon, color: ACTIVITY_TYPES.sleep.color, ids: ['sleep_streak', 'sleep_total'] },
  { label: 'Чтение', icon: BookOpen, color: ACTIVITY_TYPES.reading.color, ids: ['reading_streak', 'reading_total', 'reading_pages', 'reading_books'] },
  { label: 'Пепел калорий', icon: Gauge, color: ACTIVITY_TYPES.calories.color, ids: ['cal_best_day', 'cal_streak_300', 'cal_streak_500', 'cal_total'] },
  { label: 'Ходьба / шаги', icon: Footprints, color: ACTIVITY_TYPES.walking.color, ids: ['steps_first_day', 'steps_total_100k', 'steps_20k_day', 'steps_streak_5k_7d', 'steps_streak_7k_14d', 'steps_streak_10k_30d'] },
];

const LegendaryView = React.memo(function LegendaryView({ pentaResults, comboCounts, balanceCounts, secretAchievements }) {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PentaAchievementsSection pentaResults={pentaResults} />
      <ComboAchievementsSection comboCounts={comboCounts} />
      <BalanceAchievementsSection balanceCounts={balanceCounts} />
      <SecretAchievementsSection secretAchievements={secretAchievements} />
    </div>
  );
});

const PentaAchievementsSection = React.memo(function PentaAchievementsSection({ pentaResults }) {
  const legendUnlocked = pentaResults.legendCount > 0;
  const godUnlocked = pentaResults.godUnlocked;

  const TIER_META = {
    gold:     { label: 'Золото',   color: '#f5c84a' },
    silver:   { label: 'Серебро',  color: '#d4dae3' },
    bronze:   { label: 'Бронза',   color: '#e0a868' },
    symbolic: { label: 'Привычка', color: '#8a8a92' },
  };
  const currentTier = TIER_META[pentaResults.currentTierKey];
  const breakdown = pentaResults.legendTierBreakdown;

  return (
    <div style={styles.comboList}>
        <div
          style={{
            ...styles.pentaCard,
            borderColor: legendUnlocked ? '#f5c84a' : '#28282f',
            background: legendUnlocked ? '#332710' : '#1c1c22',
          }}
        >
          <div style={styles.comboCardTop}>
            <span style={{ ...styles.comboTitle, color: legendUnlocked ? '#f5c84a' : '#9a9aa2' }}>
              Пента-удар: Легенда своего Сити
            </span>
            {legendUnlocked && (
              <span style={{ ...styles.comboCount, color: '#f5c84a' }}>
                <Trophy size={11} color="#f5c84a" /> ×{pentaResults.legendCount}
              </span>
            )}
          </div>
          <div style={styles.comboReward}>
            5 из 6 активностей за день · Награда затухает по тирам
          </div>

          {legendUnlocked && currentTier && (
            <div style={{
              marginTop: 8, padding: '8px 10px', borderRadius: 8,
              background: currentTier.color + '18', border: `1px solid ${currentTier.color}44`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: currentTier.color }}>
                  Текущий тир: {currentTier.label}
                </span>
                <span style={{ fontSize: 11, color: currentTier.color, fontWeight: 700 }}>
                  +{pentaResults.currentTierXp} ко всем стат за день
                </span>
              </div>
              {pentaResults.nextTierAtDay ? (
                <div style={{ fontSize: 10.5, color: '#7a7a82' }}>
                  Следующий тир начнётся с {pentaResults.nextTierAtDay}-го идеального дня
                </div>
              ) : (
                <div style={{ fontSize: 10.5, color: '#7a7a82' }}>
                  Дисциплина закреплена — награда стабилизирована
                </div>
              )}
              <div style={{ fontSize: 10, color: '#6a6a72', marginTop: 6, lineHeight: 1.5 }}>
                Дни 1–5: +15 · дни 6–10: +8 · дни 11–20: +4 · дни 21+: +2
              </div>
              {(breakdown.silver.count + breakdown.bronze.count + breakdown.symbolic.count) > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {breakdown.gold.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#f5c84a22', color: '#f5c84a' }}>
                      золото ×{breakdown.gold.count}
                    </span>
                  )}
                  {breakdown.silver.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#d4dae322', color: '#d4dae3' }}>
                      серебро ×{breakdown.silver.count}
                    </span>
                  )}
                  {breakdown.bronze.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#e0a86822', color: '#e0a868' }}>
                      бронза ×{breakdown.bronze.count}
                    </span>
                  )}
                  {breakdown.symbolic.count > 0 && (
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: '#8a8a9222', color: '#8a8a92' }}>
                      привычка ×{breakdown.symbolic.count}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.pentaCard,
            borderColor: godUnlocked ? '#f5c84a' : '#28282f',
            background: godUnlocked ? '#332710' : '#1c1c22',
          }}
        >
          <div style={styles.comboCardTop}>
            <span style={{ ...styles.comboTitle, color: godUnlocked ? '#f5c84a' : '#9a9aa2' }}>
              {godUnlocked ? 'Пента-удар: Бог нового мира (как ты это сделал?)' : '???'}
            </span>
            {godUnlocked && <Trophy size={14} color="#f5c84a" />}
          </div>
          <div style={styles.comboReward}>
            {godUnlocked
              ? '5 идеальных дней подряд · Награда: +30 ко всем характеристикам'
              : `Лучшая серия идеальных дней подряд: ${pentaResults.longestStreak}/5`}
          </div>
        </div>
    </div>
  );
});

const ComboAchievementsSection = React.memo(function ComboAchievementsSection({ comboCounts }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div style={styles.comboList}>
        {COMBO_ACHIEVEMENTS.map((combo) => {
          const count = comboCounts[combo.id] || 0;
          const triggered = count > 0;
          const isOpen = openId === combo.id;
          return (
            <button
              key={combo.id}
              onClick={() => setOpenId(isOpen ? null : combo.id)}
              style={{
                ...styles.comboCard,
                borderColor: triggered ? '#e0a868' : '#28282f',
                background: triggered ? '#241c10' : '#1c1c22',
                textAlign: 'left', width: '100%', cursor: 'pointer',
              }}
            >
              <div style={styles.comboCardTop}>
                <span style={{ ...styles.comboTitle, color: triggered ? '#f0d272' : '#9a9aa2' }}>{combo.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {triggered && (
                    <span style={styles.comboCount}>
                      <Flame size={11} color="#e0a868" /> ×{count}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    color="#5a5a62"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  />
                </div>
              </div>
              <div style={styles.comboReward}>
                Награда: {Object.entries(combo.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(', ')}
              </div>
              {isOpen && (
                <div style={styles.comboCondition}>Условие: {combo.description}</div>
              )}
            </button>
          );
        })}
    </div>
  );
});

const BalanceAchievementsSection = React.memo(function BalanceAchievementsSection({ balanceCounts }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div style={styles.comboList}>
        {BALANCE_ACHIEVEMENTS.map((b) => {
          const count = balanceCounts[b.id] || 0;
          const triggered = count > 0;
          const isOpen = openId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setOpenId(isOpen ? null : b.id)}
              style={{
                ...styles.comboCard,
                borderColor: triggered ? '#4ce0c0' : '#28282f',
                background: triggered ? '#0f2622' : '#1c1c22',
                textAlign: 'left', width: '100%', cursor: 'pointer',
              }}
            >
              <div style={styles.comboCardTop}>
                <span style={{ ...styles.comboTitle, color: triggered ? '#4ce0c0' : '#9a9aa2' }}>{b.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {triggered && (
                    <span style={{ ...styles.comboCount, color: '#4ce0c0' }}>
                      <Scale size={11} color="#4ce0c0" /> ×{count}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    color="#5a5a62"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  />
                </div>
              </div>
              <div style={styles.comboReward}>
                Награда: {Object.entries(b.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(', ')}
              </div>
              {isOpen && (
                <div style={styles.comboCondition}>Условие: {b.description}</div>
              )}
            </button>
          );
        })}
    </div>
  );
});

const MythicView = React.memo(function MythicView({ mythicAchievements }) {
  const [openId, setOpenId] = useState(null);
  const unlockedCount = mythicAchievements.filter((m) => m.unlocked).length;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={styles.mythicHeader}>
        <Sparkles size={16} color="#f5c84a" />
        <span style={styles.mythicHeaderTitle}>Мифические ачивки</span>
        <span style={styles.mythicHeaderCount}>{unlockedCount}/{mythicAchievements.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mythicAchievements.map((m) => {
          const isOpen = openId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setOpenId(isOpen ? null : m.id)}
              style={{
                ...styles.mythicCard,
                borderColor: m.unlocked ? '#f5c84a' : '#28282f',
                background: m.unlocked
                  ? 'linear-gradient(165deg, #332710 0%, #1c1c22 100%)'
                  : '#1c1c22',
              }}
            >
              <div style={styles.mythicCardTop}>
                {m.unlocked ? <Trophy size={18} color="#f5c84a" /> : <Lock size={18} color="#5a5a62" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.mythicTitle, color: m.unlocked ? '#f5c84a' : '#dcdce2' }}>{m.title}</div>
                  <div style={styles.mythicCharacter}>{m.character}</div>
                </div>
                <ChevronDown
                  size={14}
                  color="#5a5a62"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
                />
              </div>

              {isOpen && (
                <div style={styles.mythicExpand}>
                  <div style={styles.mythicConditionLabel}>Условие</div>
                  <div style={styles.mythicConditionText}>{m.description}</div>
                  <div style={styles.mythicConditionLabel}>Награда</div>
                  <div style={styles.mythicConditionText}>
                    {Object.entries(m.rewards).map(([stat, amt]) =>
                      stat === 'all' ? `+${amt} ко всем характеристикам` : `+${amt} ${stat}`
                    ).join(', ')}
                  </div>
                  {m.unlocked && (
                    <div style={styles.mythicQuote}>«{m.quote}»</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const SecretAchievementsSection = React.memo(function SecretAchievementsSection({ secretAchievements }) {
  const unlockedCount = secretAchievements.filter((s) => s.unlocked).length;
  return (
    <div style={styles.achSection}>
      <div style={styles.achSectionHeader}>
        <Sparkles size={15} color="#c9a8f5" />
        <span style={{ ...styles.achSectionTitle, color: '#c9a8f5' }}>
          Секретные ачивки ({unlockedCount}/{secretAchievements.length})
        </span>
      </div>
      <div style={styles.secretGrid}>
        {secretAchievements.map((s) => (
          <div
            key={s.id}
            style={{
              ...styles.secretCard,
              background: s.unlocked ? '#2a1f3a' : '#1c1c22',
              borderColor: s.unlocked ? '#9c6fe0' : '#28282f',
              animation: s.unlocked ? 'popIn 0.35s ease' : 'none',
            }}
          >
            {s.unlocked ? <Trophy size={16} color="#c9a8f5" /> : <Lock size={16} color="#4a4a52" />}
            <div style={{ ...styles.secretTitle, color: s.unlocked ? '#dcc8f5' : '#6a6a72' }}>
              {s.unlocked ? s.title : '???'}
            </div>
            <div style={styles.secretHint}>{s.unlocked ? 'Разблокировано' : s.hint}</div>
            {s.unlocked && s.rewards && (
              <div style={{ fontSize: 9.5, color: '#9af0e0', marginTop: 4, textAlign: 'center', lineHeight: 1.4 }}>
                {Object.entries(s.rewards).map(([stat, amt]) => `+${amt} ${stat}`).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const AchievementCategoryModal = React.memo(function AchievementCategoryModal({ group, achievements, byId, onClose }) {
  const groupAchs = group.ids ? group.ids.map(id => byId[id]).filter(Boolean) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {group.iconEl || <Trophy size={20} color={group.color} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: group.color }}>{group.label}</div>
            <div style={{ fontSize: 11, color: '#5a5a6a' }}>{groupAchs.filter(a => a.achievedTierIndex >= 0).length}/{groupAchs.length} разблокировано</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ padding: '16px' }}>
          {groupAchs.map(ach => (
            <div key={ach.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e8', marginBottom: 4 }}>{ach.title}</div>
              {ach.flavor && <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 8 }}>{ach.flavor}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ach.tiers.map((t, idx) => {
                  const unlocked = idx <= ach.achievedTierIndex;
                  const colors = unlocked ? (TIER_COLORS[t.tier] || TIER_COLORS.special) : TIER_COLORS.locked;
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: colors.bg, border: `1.5px solid ${colors.border}`,
                      borderRadius: 10, padding: '10px 12px',
                      opacity: unlocked ? 1 : 0.5,
                    }}>
                      <Trophy size={18} color={colors.text} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: colors.text }}>{t.name}</div>
                        <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 1 }}>{t.need} {ach.unit}</div>
                      </div>
                      {unlocked && <span style={{ fontSize: 10, color: colors.text, fontWeight: 700 }}>✓</span>}
                    </div>
                  );
                })}
              </div>

              {ach.tiers.length > 1 && (
                <div style={{ marginTop: 8 }}>
                  <MiniProgress
                    label={ach.nextTier ? `До «${ach.nextTier.name}»` : 'Все тиры открыты'}
                    current={ach.currentValue}
                    target={ach.nextTier ? ach.nextTier.need : ach.currentValue}
                    unit={ach.unit}
                    color={group.color}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const AchievementsView = React.memo(function AchievementsView({ achievements, pentaResults, comboCounts, balanceCounts, secretAchievements, mythicAchievements, bestiaryAchievements, challengeAchievements, roadStoryAchievements, onOpenRecordsWall }) {
  const byId = {};
  achievements.forEach((a) => (byId[a.id] = a));
  const [openModal, setOpenModal] = useState(null); // group key

  const closeAchievements = achievements
    .filter((a) => a.nextTier)
    .map((a) => ({ ...a, remaining: a.nextTier.need - a.currentValue }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);

  const pentaCount = (pentaResults?.legendCount || 0) + (pentaResults?.godUnlocked ? 1 : 0);
  const comboCount = Object.values(comboCounts || {}).filter(v => v > 0).length;
  const balanceCount = Object.values(balanceCounts || {}).filter(v => v > 0).length;
  const secretCount = (secretAchievements || []).filter(s => s.unlocked).length;
  const mythicCount = (mythicAchievements || []).filter(m => m.unlocked).length;
  const bestiaryUnlockedCount = (bestiaryAchievements || []).filter(b => b.unlocked).length;
  const challengeUnlockedCount = (challengeAchievements || []).filter(c => c.unlocked).length;
  const roadUnlockedCount = (roadStoryAchievements || []).filter(r => r.unlocked).length;

  const ACTIVITY_EMOJIS = {
    running: '🏃', strength_park: '🌳', strength_gym: '🏋️',
    wrestling: '🥋', nutrition: '🥗', sleep: '😴',
    reading: '📖', calories: '🔥',
  };

  // Build tile data
  const tiles = ACHIEVEMENT_GROUPS.map(group => {
    const achs = group.ids.map(id => byId[id]).filter(Boolean);
    const unlocked = achs.filter(a => a.achievedTierIndex >= 0).length;
    const emoji = ACTIVITY_EMOJIS[achs[0]?.activity] || '🏅';
    return { ...group, achs, unlocked, total: achs.length, emoji, type: 'regular' };
  }).filter(t => t.total > 0);

  const openGroup = openModal && (
    tiles.find(t => t.label === openModal) ||
    (openModal === 'penta' ? { label: 'Пента-удар', color: '#f5c84a' } : null) ||
    (openModal === 'combo' ? { label: 'Тройной удар', color: '#e0a868' } : null) ||
    (openModal === 'balance' ? { label: 'Баланс', color: '#4ce0c0' } : null) ||
    (openModal === 'secret' ? { label: 'Секретные', color: '#c9a8f5' } : null) ||
    (openModal === 'mythic' ? { label: 'Мифические', color: '#f5c84a' } : null)
  );

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Стена подвигов */}
      <button
        onClick={onOpenRecordsWall}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#241c10', border: '1.5px solid #4a3410', borderRadius: 12,
          padding: '12px 16px', cursor: 'pointer', color: '#f0d272', marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Стена подвигов</span>
        </div>
        <ChevronDown size={16} color="#e0a868" style={{ transform: 'rotate(-90deg)' }} />
      </button>

      {/* Доска почёта — сразу под Стеной подвигов */}
      {achievements && (() => {
        const tierSortWeight = { platinum: 5, diamond: 4, special: 3, gold: 3, silver: 2, bronze: 1 };
        const unlockedTiers = achievements
          .filter(a => a.achievedTierIndex >= 0)
          .map(a => ({ achId: a.id, achTitle: a.title, tier: a.tiers[a.achievedTierIndex] }))
          .sort((a, b) => (tierSortWeight[b.tier.tier] || 0) - (tierSortWeight[a.tier.tier] || 0));
        return unlockedTiers.length > 0 ? <div style={{ marginBottom: 16 }}><HallOfFameButton unlockedTiers={unlockedTiers} /></div> : null;
      })()}

      {/* Close to unlock */}
      {closeAchievements.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#5a4a8a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>🎯 Близко к разблокировке</div>
          {closeAchievements.map(a => (
            <ProgressRow key={a.id} achievement={a} />
          ))}
        </div>
      )}

      {/* Activity tiles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {tiles.map(tile => {
          return (
            <button key={tile.label} onClick={() => setOpenModal(tile.label)} style={{
              background: 'linear-gradient(135deg, ' + tile.color + '0a, #18161000)',
              border: '1.5px solid ' + tile.color + '33', borderRadius: 12,
              padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, opacity: 0.07, pointerEvents: 'none' }}>{tile.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: tile.color, position: 'relative' }}>{tile.label}</div>
              <div style={{ fontSize: 11, color: tile.unlocked > 0 ? tile.color + 'aa' : '#4a4a52', marginTop: 3, position: 'relative' }}>{tile.unlocked > 0 ? tile.unlocked + ' получено' : 'Не получено'}</div>
            </button>
          );
        })}
      </div>

      {/* Legendary + Mythic tiles */}
      <div style={{ fontSize: 10, fontWeight: 800, color: '#5a4a3a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Особые достижения</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setOpenModal('penta')} style={{
          background: 'linear-gradient(135deg, #1e1a0e, #18160a)', border: '1.5px solid #4a3a1f', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f5c84a', position: 'relative' }}>Пента-удар</div>
          <div style={{ fontSize: 11, color: pentaCount > 0 ? '#a89040' : '#4a4030', marginTop: 3, position: 'relative' }}>{pentaCount > 0 ? `${pentaCount} получено` : 'Не получено'}</div>
        </button>

        <button onClick={() => setOpenModal('combo')} style={{
          background: 'linear-gradient(135deg, #1e1610, #18120a)', border: '1.5px solid #4a3020', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>🔥</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e0a868', position: 'relative' }}>Тройной удар</div>
          <div style={{ fontSize: 11, color: comboCount > 0 ? '#a08040' : '#4a3a28', marginTop: 3, position: 'relative' }}>{comboCount > 0 ? `${comboCount} получено` : 'Не получено'}</div>
        </button>

        <button onClick={() => setOpenModal('balance')} style={{
          background: 'linear-gradient(135deg, #0e1a18, #0a1614)', border: '1.5px solid #1f4a40', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>⚖️</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#4ce0c0', position: 'relative' }}>Баланс</div>
          <div style={{ fontSize: 11, color: balanceCount > 0 ? '#3a8a7a' : '#2a4a42', marginTop: 3, position: 'relative' }}>{balanceCount > 0 ? `${balanceCount} получено` : 'Не получено'}</div>
        </button>

        <button onClick={() => setOpenModal('secret')} style={{
          background: 'linear-gradient(135deg, #18122a, #120e20)', border: '1.5px solid #3a2a5a', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#c9a8f5', position: 'relative' }}>Секретные</div>
          <div style={{ fontSize: 11, color: secretCount > 0 ? '#8a6ab0' : '#3a2a4a', marginTop: 3, position: 'relative' }}>{secretCount}/{(secretAchievements||[]).length}</div>
        </button>

        <button onClick={() => setOpenModal('bestiary')} style={{
          background: 'linear-gradient(135deg, #14200e, #0e1a0a)', border: '1.5px solid #2a4a1f', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>🦊</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#7dd88a', position: 'relative' }}>Бестиарий</div>
          <div style={{ fontSize: 11, color: bestiaryUnlockedCount > 0 ? '#5a9a5a' : '#2a4a2a', marginTop: 3, position: 'relative' }}>{bestiaryUnlockedCount}/{(bestiaryAchievements||[]).length}</div>
        </button>

        <button onClick={() => setOpenModal('challenges')} style={{
          background: 'linear-gradient(135deg, #201a0e, #1a140a)', border: '1.5px solid #4a3a1f', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>📜</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e0c070', position: 'relative' }}>Испытания духа</div>
          <div style={{ fontSize: 11, color: challengeUnlockedCount > 0 ? '#9a8a4a' : '#4a3a2a', marginTop: 3, position: 'relative' }}>{challengeUnlockedCount}/{(challengeAchievements||[]).length}</div>
        </button>

        <button onClick={() => setOpenModal('roadstory')} style={{
          background: 'linear-gradient(135deg, #1a1830, #120e22)', border: '1.5px solid #3a2f5a', borderRadius: 12,
          padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.08, pointerEvents: 'none' }}>🗺️</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#a89af5', position: 'relative' }}>Дорожные истории</div>
          <div style={{ fontSize: 11, color: roadUnlockedCount > 0 ? '#7a6ab0' : '#2a2a4a', marginTop: 3, position: 'relative' }}>{roadUnlockedCount}/{(roadStoryAchievements||[]).length}</div>
        </button>
      </div>

      {/* Mythic — full width */}
      <button onClick={() => setOpenModal('mythic')} style={{
        width: '100%',
        background: 'linear-gradient(135deg, #1e1a0e 0%, #1a1228 50%, #18160a 100%)',
        border: '1.5px solid #4a3a2a', borderRadius: 12,
        padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
        position: 'relative', overflow: 'hidden', marginBottom: 8,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, opacity: 0.06, pointerEvents: 'none' }}>🏛️</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f5c84a', position: 'relative' }}>Мифические ачивки</div>
        <div style={{ fontSize: 12, color: '#8a7a42', marginTop: 3, position: 'relative' }}>{mythicCount}/{(mythicAchievements||[]).length} разблокировано · Высший уровень</div>
      </button>

      {/* ── Modals ── */}
      {openModal && tiles.find(t => t.label === openModal) && (
        <AchievementCategoryModal
          group={tiles.find(t => t.label === openModal)}
          achievements={achievements}
          byId={byId}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === 'penta' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={20} color="#f5c84a" />
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#f5c84a' }}>Пента-удар</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}><PentaAchievementsSection pentaResults={pentaResults} /></div>
          </div>
        </div>
      )}

      {openModal === 'combo' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flame size={20} color="#e0a868" />
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#e0a868' }}>Тройной удар</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}><ComboAchievementsSection comboCounts={comboCounts} /></div>
          </div>
        </div>
      )}

      {openModal === 'balance' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={20} color="#4ce0c0" />
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#4ce0c0' }}>Баланс</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}><BalanceAchievementsSection balanceCounts={balanceCounts} /></div>
          </div>
        </div>
      )}

      {openModal === 'secret' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} color="#c9a8f5" />
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#c9a8f5' }}>Секретные</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}><SecretAchievementsSection secretAchievements={secretAchievements} /></div>
          </div>
        </div>
      )}

      {openModal === 'mythic' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} color="#f5c84a" />
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#f5c84a' }}>Мифические</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}><MythicView mythicAchievements={mythicAchievements} /></div>
          </div>
        </div>
      )}

      {openModal === 'bestiary' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🦊</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#7dd88a' }}>Бестиарий</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(bestiaryAchievements || []).map(a => (
                <div key={a.id} style={{
                  background: a.unlocked ? '#1a2a1a' : '#161619', border: '1px solid ' + (a.unlocked ? '#2f5c33' : '#24242c'),
                  borderRadius: 8, padding: '9px 12px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.unlocked ? '#7de87d' : (a.secret ? '#6a6a72' : '#c0c0ca') }}>
                    {a.unlocked || !a.secret ? a.title : '???'} {a.mythic && '✨'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>
                    {a.unlocked || !a.secret ? a.description : 'Секретная ачивка'} · {a.current}/{a.need}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {openModal === 'challenges' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📜</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#e0c070' }}>Испытания духа</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <ChallengeAchievementsSection achievements={challengeAchievements || []} />
            </div>
          </div>
        </div>
      )}

      {openModal === 'roadstory' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setOpenModal(null); }}>
          <div style={{ background: '#13131a', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#13131a', borderBottom: '1px solid #22222a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🗺️</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: '#a89af5' }}>Дорожные истории</div></div>
              <button onClick={() => setOpenModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 22 }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(roadStoryAchievements || []).map(a => (
                <div key={a.id} style={{
                  background: a.unlocked ? '#1a2a1a' : '#161619', border: '1px solid ' + (a.unlocked ? '#2f5c33' : '#24242c'),
                  borderRadius: 8, padding: '9px 12px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.unlocked ? '#7de87d' : (a.secret ? '#6a6a72' : '#c0c0ca') }}>
                    {a.unlocked || !a.secret ? a.title : '???'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>
                    {a.unlocked || !a.secret ? a.description : 'Секретная ачивка'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ---------- RAID BATTLE LOG ----------

// ---------- RAID BATTLE LOG ----------
const BERSERKER_ATTACKS = {
  quantitative: {
    low: ['{name} с рёвом бросается на {boss}, но толстая шкура не пропускает удар глубоко.','{name} замахивается боевым топором — удар скользит по броне.','{name} в слепой ярости бьёт по {boss} — искры летят, но рана неглубокая.','{name} рычит и вгрызается в защиту {boss}. Пока лишь царапина.','{name} разбегается и прыгает на {boss} с топором — удар вязнет в мышцах зверя.','{name} бьёт кулаком по земле, поднимая пыль, и бросается в атаку. {boss} едва покачнулся.'],
    mid: ['{name} входит в ярость! Кровавый топор рассекает плоть {boss}!','{name} оглушает {boss} серией бешеных ударов — земля трясётся!','{name} ревёт как зверь и обрушивает двойной удар! {boss} отступает, истекая кровью!','{name} срывает с себя броню и атакует вдвое быстрее! Топор свистит — {boss} не успевает уклониться!','{name} хватает {boss} за рог и вбивает топор прямо в череп! Мощный удар!','{name} разгоняется до предела и врезается в {boss} всем телом — оба летят в скалу!','{name} выбивает сноп искр из брони {boss}! Ярость берсерка нарастает!'],
    high: ['{name} теряет рассудок от ярости! МОЩНЕЙШИЙ удар топором РАЗРУБАЕТ {boss} до кости! {value} урона!','{name} превращается в берсерка древних! Кровавый вихрь ударов разрывает {boss} в клочья!','{name} в состоянии абсолютного безумия! Каждый удар — как удар молнии! {boss} содрогается! {value} урона!','{name} поднимает топор над головой — лезвие пылает красным! КРИТИЧЕСКИЙ УДАР по {boss}!','{name} РАССЕКАЕТ ВОЗДУХ НАДВОЕ! Ударная волна сносит {boss} с ног! {value} сокрушительного урона!','{name} входит в режим «Кровавый Прилив»! Глаза горят красным — {boss} в панике отступает перед неостановимой силой!','{name} хватает {boss} и с нечеловеческой силой швыряет в стену! Скала раскалывается! {value} урона!','{name} бьёт так, что топор ломается пополам — но {boss} уже на земле! Берсерк достаёт ВТОРОЙ топор!'],
  },
  endurance: {
    early: ['{name} стискивает зубы и держит боевую стойку. {boss} пытается сломить волю берсерка.','{name} рычит сквозь зубы — ярость не даёт отступить. {boss} давит, но берсерк стоит.','{name} вбивает топор в землю и упирается ногами. «Не сегодня, тварь!»','{name} чувствует давление {boss} на разум. Кулаки сжимаются до хруста — берсерк не сдаётся.','{name} плюёт в сторону {boss} и принимает оборонительную стойку. День только начался.'],
    mid: ['{name} рычит от напряжения — {boss} давит на разум, но ярость берсерка не угасает!','{name} бьёт себя кулаком в грудь! «Я ЗДЕСЬ СТОЮ!» {boss} не может сломить эту волю!','{name} чувствует как тьма {boss} обволакивает — но ЯРОСТЬ сжигает её изнутри!','{name} кричит боевой клич предков — стены трясутся! {boss} отшатывается!','{name} покрывается боевыми рунами — древняя ярость защищает от ментальных атак {boss}!','{name} грызёт рукоять топора от злости — но стоит как скала! {boss} не может пробиться!'],
    late: ['{name} ревёт как обезумевший зверь! Никакая магия {boss} не сломит его железную волю!','{name} стоит в луже собственной крови и СМЕЁТСЯ! {boss} в ужасе — берсерк не падает!','{name} вошёл в состояние «Вечной Ярости»! Ничто не может остановить берсерка — НИ-ЧТО!','{name} поднимает руки к небу — молния бьёт в топор! {boss} чувствует: конец близок!','{name} прошёл через все испытания {boss} и стоит непоколебимо! Даже боги аплодируют!','{name} превратился в саму ярость! {boss} истощил все силы впустую — берсерк НЕСОКРУШИМ!'],
  },
  strength_count: {
    1: ['{name} пробует силу на {boss} — первый удар оставляет лишь царапину.','{name} разминает шею и наносит пробный удар. {boss} даже не заметил.','{name} замахивается и бьёт — топор отскакивает от брони. Нужно больше силы...','{name} прощупывает защиту {boss} серией лёгких ударов. Пока без результата.','{name} плюёт на ладони, перехватывает топор и делает первый замах. Начало положено.'],
    2: ['{name} наращивает темп! Топор врезается глубже — {boss} отступает!','{name} находит слабое место в броне! Второй удар пробивает защиту {boss}!','{name} разогрелся — удары идут мощнее и точнее! {boss} пошатнулся!','{name} с рёвом обрушивает топор на ту же точку — трещина в броне {boss} расширяется!','{name} входит в ритм! Мускулы горят, но каждый удар бьёт всё сильнее!'],
    3: ['{name} в боевом трансе! Удары сыпятся как град — {boss} теряет равновесие!','{name} крутит топор над головой как мельницу! {boss} не может подступиться!','{name} ревёт и наносит тройной удар — броня {boss} разлетается осколками!','{name} вошёл в берсерк-режим! Скорость и сила утроились — {boss} еле успевает защищаться!','{name} бьёт так быстро, что топор оставляет огненный след! {boss} горит!'],
    4: ['{name} НАНОСИТ СОКРУШИТЕЛЬНЫЙ УДАР! {boss} падает на колени — земля раскалывается!','{name} АКТИВИРУЕТ РЕЖИМ «КРОВАВЫЙ БЕРСЕРК»! Финальный удар РАСКАЛЫВАЕТ {boss} НАДВОЕ!','{name} собирает ВСЮ ЯРОСТЬ в один удар — топор проходит НАСКВОЗЬ через {boss}!','{name} поднимает {boss} над головой и РАЗБИВАЕТ о землю! ФАТАЛЬНЫЙ УРОН!','{name} наносит удар такой силы, что ударная волна сносит всё в радиусе 10 метров! {boss} УНИЧТОЖЕН!'],
  },
};
const PATHFINDER_ATTACKS = {
  quantitative: {
    low: ['{name} выпускает стрелу — она вонзается в шкуру {boss}, но неглубоко.','{name} стремительно обегает {boss} с фланга и наносит удар на ходу.','{name} пускает стрелу на бегу — попадание! Но {boss} лишь раздражённо рычит.','{name} проносится мимо {boss} как тень и оставляет порез на боку.','{name} закидывает ловушку под ноги {boss} — зверь спотыкается, но не падает.','{name} бесшумно подбирается к {boss} и бьёт в подколенную впадину.'],
    mid: ['{name} метким выстрелом попадает в слабое место {boss}! Стрела пробивает броню!','{name} набирает невероятную скорость и врезается в {boss} как ветер!','{name} выпускает три стрелы одновременно — все три находят цель! {boss} ревёт от боли!','{name} использует деревья как трамплины и атакует {boss} сверху! Удар в затылок!','{name} рассыпает горсть отравленных шипов — {boss} наступает и шатается от яда!','{name} разгоняется до предела и наносит удар копьём с разбега! {boss} проскальзывает назад!','{name} стреляет на звук — стрела летит в темноте и ТОЧНО попадает в {boss}!'],
    high: ['{name} метким выстрелом отравленной стрелы попадает в глаз {boss}! Монстр ослеплён! {value} урона!','{name} выпускает залп стрел — каждая находит слабое место! {boss} пронзён десятком стрел!','{name} активирует технику «Призрачный Бег»! Становится невидимым и наносит СЕРИЮ смертельных ударов! {value} урона!','{name} взлетает на скалу и выпускает СТРЕЛУ ВОЗМЕЗДИЯ — она прошивает {boss} насквозь!','{name} бежит ТАК БЫСТРО, что создаёт звуковой барьер! Ударная волна сносит {boss} с ног! {value} урона!','{name} выпускает стрелу с привязанной молнией — {boss} получает ЭЛЕКТРИЧЕСКИЙ КРИТИЧЕСКИЙ УДАР!','{name} призывает ураганный ветер и стреляет сквозь торнадо — стрела набирает ТРОЙНУЮ скорость! {value} урона!','{name} находит ЕДИНСТВЕННОЕ уязвимое место на теле {boss} и поражает его ИДЕАЛЬНЫМ выстрелом!'],
  },
  endurance: {
    early: ['{name} занимает позицию на расстоянии, следя за каждым движением {boss}.','{name} отступает в тень и наблюдает. {boss} не может обнаружить следопыта.','{name} сливается с окружением — {boss} теряет его из виду.','{name} бесшумно перемещается между укрытиями. {boss} бьёт по воздуху.','{name} оставляет ложные следы — {boss} уходит в неверном направлении.'],
    mid: ['{name} уворачивается от атак {boss} с невероятной ловкостью — ни одна не достигает цели!','{name} бежит по стенам и потолку! {boss} не может угнаться за следопытом!','{name} ставит ловушку за ловушкой — {boss} запутывается и теряет время!','{name} перемещается быстрее, чем {boss} может повернуть голову! «Поймай меня, если сможешь!»','{name} использует рельеф как оружие — камнепад обрушивается на {boss}, а следопыт уже далеко!','{name} читает каждое движение {boss} на три шага вперёд — все атаки проходят мимо!'],
    late: ['{name} стал неуловимым призраком! {boss} бессильно хлещет воздух — следопыт всегда на шаг впереди!','{name} превратился в сам ветер! {boss} не может даже УВИДЕТЬ его, не то что ударить!','{name} провёл {boss} через лабиринт ловушек — зверь измотан и едва стоит на ногах!','{name} стоит прямо перед {boss}, но тот не может его заметить — маскировка ИДЕАЛЬНА!','{name} достиг скорости, недоступной смертным! Даже время замедляется вокруг следопыта!','{name} пережил все атаки {boss}, не получив НИ ОДНОЙ царапины! Абсолютное уклонение!'],
  },
  strength_count: {
    1: ['{name} осторожно пускает разведывательную стрелу в {boss}.','{name} изучает повадки {boss} с безопасного расстояния. Первая стрела — пристрелочная.','{name} делает контрольный забег вокруг {boss}, оценивая слабые места.','{name} устанавливает первую ловушку на пути {boss}. Охота началась.','{name} отмечает уязвимые точки {boss} метками из краски. Подготовка завершена.'],
    2: ['{name} находит уязвимое место — стрелы летят точнее!','{name} активирует «Глаз охотника»! Теперь каждая стрела знает, куда лететь!','{name} ускоряется — два попадания подряд! {boss} начинает хромать!','{name} стреляет из укрытия — {boss} не может определить направление атаки!','{name} подрезает сухожилие {boss} точным выстрелом — зверь замедляется!'],
    3: ['{name} в идеальном ритме! Стрелы свистят одна за другой — {boss} не может укрыться!','{name} бежит по кругу и стреляет без остановки — {boss} превращается в подушечку для иголок!','{name} активирует «Дождь стрел»! Небо темнеет от стрел — {boss} в ужасе!','{name} перешёл на скоростную стрельбу — 10 стрел в секунду! {boss} не успевает уворачиваться!','{name} пускает тройную стрелу — все три попадают в одну точку! Броня {boss} трещит!'],
    4: ['{name} ВЫПУСКАЕТ СТРЕЛУ ВОЗМЕЗДИЯ! Она прошивает {boss} НАСКВОЗЬ!','{name} активирует ТЕХНИКУ ПРЕДКОВ — «ТЫСЯЧА СТРЕЛ»! {boss} ПОКРЫТ стрелами с ног до головы!','{name} РАЗГОНЯЕТСЯ ДО СКОРОСТИ СВЕТА и наносит ФИНАЛЬНЫЙ УДАР копьём прямо в сердце {boss}!','{name} СТРЕЛЯЕТ ОДНОЙ СТРЕЛОЙ — но она РАЗДЕЛЯЕТСЯ на сотню в полёте! {boss} УНИЧТОЖЕН!','{name} призывает ВСЮ СИЛУ ВЕТРА в один выстрел! Стрела ПРОБИВАЕТ {boss} и гору за ним!'],
  },
};
const MONK_ATTACKS = {
  quantitative: {
    low: ['{name} сосредотачивает ки и усиливает защиту союзников. Бафф: +сопротивление!','{name} входит в медитацию и окутывает команду аурой спокойствия.','{name} касается союзника — небольшой бафф к скорости восстановления.','{name} начинает ритуальное дыхание — энергия ки медленно наполняет пространство.','{name} ставит защитную печать на земле — {boss} замедляется при приближении.','{name} шепчет мантру — союзники чувствуют лёгкий прилив уверенности.'],
    mid: ['{name} активирует Стальную Стойку! Вся команда получает +30% к защите!','{name} направляет поток ки через всех союзников — их раны затягиваются!','{name} бьёт ладонью по воздуху — ударная волна ки отбрасывает {boss} назад!','{name} открывает Вторые Врата! Ки хлещет как огненный гейзер — команда горит боевым духом!','{name} создаёт «Сферу Гармонии» — внутри неё команда восстанавливается втрое быстрее!','{name} проводит «Удар Тысячи Ладоней» — каскад ки-ударов оглушает {boss}!','{name} касается земли двумя пальцами — золотая волна ки прокатывается по полю битвы, усиливая всех!'],
    high: ['{name} раскрывает Врата Силы! МОЩНЕЙШИЙ бафф — {boss} чувствует нарастающую угрозу!','{name} входит в состояние Абсолютного Фокуса! Каждый удар команды наносит двойной урон!','{name} открывает ВСЕ ВРАТА одновременно! Ки взрывается золотым сиянием — {value} урона через баффы команды!','{name} произносит Запретную Мантру — тело светится белым! Команда получает АБСОЛЮТНЫЙ БАФФ!','{name} проводит «Касание Просветлённого» — один удар пальцем парализует {boss} на 10 секунд!','{name} достигает состояния «Пустоты» — ки течёт как река, исцеляя и усиливая ВСЁ вокруг! {value} урона!','{name} активирует «Небесный Удар Монаха»! Колонна чистой ки пронзает {boss} с неба!','{name} сводит ладони — между ними формируется сфера АБСОЛЮТНОЙ энергии! {boss} ИСПЕПЕЛЁН!'],
  },
  endurance: {
    early: ['{name} создаёт ментальный щит вокруг команды. {boss} не может пробить защиту разума.','{name} садится в позу лотоса и закрывает глаза. Тёмная энергия {boss} обтекает его как вода.','{name} начинает медитацию — внутренний мир монаха неприступен для хаоса {boss}.','{name} дышит ровно и глубоко. «Твоя тьма — лишь иллюзия, {boss}.»','{name} касается лба каждого союзника — их разум укрепляется.'],
    mid: ['{name} укрепляет дух союзников! «Ваш разум — ваша крепость! Не сдавайтесь!»','{name} направляет ки в защитный купол — ментальные атаки {boss} разбиваются как волны о скалу!','{name} открывает Третье Око — видит атаки {boss} до того, как они произойдут!','{name} входит в транс — тело неподвижно, но ки-щит пульсирует всё сильнее!','{name} произносит: «Тысяча лет медитации в одном вдохе!» Аура спокойствия усиливается втрое!','{name} создаёт ки-связь между всеми союзниками — боль делится поровну, сила умножается!'],
    late: ['{name} достигает просветления! Аура монаха делает всю команду неуязвимой к ментальным атакам {boss}!','{name} стал единым с потоком ки! {boss} атакует пустоту — монах везде и нигде!','{name} открыл Врата Вечности! Время замедляется — команда действует в десять раз быстрее!','{name} произносит: «Я видел тьму внутри себя и победил её. Ты, {boss}, не страшнее тени.»','{name} светится как маленькое солнце! {boss} не может приблизиться — ки отталкивает тьму!','{name} вошёл в состояние НИРВАНЫ! Абсолютный покой — абсолютная сила! {boss} БЕССИЛЕН!'],
  },
  strength_count: {
    1: ['{name} благословляет команду перед боем — лёгкий бафф к атаке.','{name} разминает суставы и начинает серию медленных ката. Ки только пробуждается.','{name} ставит первую защитную печать — разминка завершена.','{name} совершает поклон {boss} перед боем. Уважение к противнику — путь монаха.','{name} проводит первый удар открытой ладонью — тестирует защиту {boss}.'],
    2: ['{name} направляет ки в удар союзника — следующая атака бьёт вдвое сильнее!','{name} ускоряет поток ки! Два точных удара по нервным узлам {boss} — правая лапа немеет!','{name} создаёт ки-кнут и хлещет {boss} по морде! Зверь ошеломлён!','{name} находит энергетическую точку на теле {boss} и блокирует её! Сила монстра падает!','{name} проводит серию «Текучих Ударов» — каждый бьёт точно в уязвимость!'],
    3: ['{name} активирует Ки-Взрыв! Волна энергии оглушает {boss} и усиливает всю команду!','{name} выполняет «Танец Журавля» — каскад ударов ногами обрушивается на {boss}!','{name} открывает Пятые Врата! Тело светится — каждое движение оставляет след из ки!','{name} наносит «Удар Сотни Рук» — {boss} получает сто ударов за одну секунду!','{name} создаёт ки-клон! Теперь ДВА монаха атакуют {boss} одновременно!'],
    4: ['{name} ОТКРЫВАЕТ ВСЕ ВОСЕМЬ ВРАТ! Команда сражается с силой десятерых!','{name} выполняет ЗАПРЕТНУЮ ТЕХНИКУ — «УДАР ПУСТОТЫ»! Ки проходит СКВОЗЬ материю и разрушает {boss} ИЗНУТРИ!','{name} достигает МГНОВЕННОГО ПРОСВЕТЛЕНИЯ! Один палец — и {boss} ПАРАЛИЗОВАН НАВЕЧНО!','{name} СОБИРАЕТ КИ ВСЕЙ КОМАНДЫ В ОДИН УДАР! Сфера чистой энергии СТИРАЕТ {boss} из реальности!','{name} выполняет «КУЛАК БУДДЫ» — удар настолько мощный, что даже ПРОСТРАНСТВО трескается!'],
  },
};
const SHAMAN_ATTACKS = {
  quantitative: {
    low: ['{name} призывает духов-волков — они кусают {boss}, отвлекая внимание.','{name} ставит тотем исцеления — команда восстанавливает силы.','{name} бросает горсть рунных камней — они слабо светятся и замедляют {boss}.','{name} призывает духа лисы — хитрый призрак путает {boss}, заставляя промахиваться.','{name} варит зелье на ходу и выплёскивает в {boss} — кислота разъедает броню.','{name} шепчет заклинание дождя — капли обжигают {boss} как кипяток.'],
    mid: ['{name} призывает духов волков — они раздирают {boss} до крови!','{name} вызывает грозовой тотем! Молния бьёт в {boss}, парализуя монстра!','{name} призывает дух медведя — призрачный зверь хватает {boss} в стальные объятия!','{name} окутывает союзников тотемом регенерации — раны затягиваются на глазах!','{name} бьёт посохом о землю — из трещин вырываются корни и опутывают {boss}!','{name} накладывает «Проклятие Слабости» — атаки {boss} теряют половину силы!','{name} призывает стаю призрачных орлов — они пикируют на {boss} с когтями из света!'],
    high: ['{name} призывает ВЕЛИКОГО ДУХА! Призрачный медведь обрушивается на {boss}! {value} урона!','{name} входит в транс предков — духи СОТЕН шаманов атакуют {boss} одновременно!','{name} вызывает ТОТЕМ РАЗРУШЕНИЯ! Земля разверзается под ногами {boss}! {value} урона!','{name} открывает Врата Мира Духов — АРМИЯ призраков хлынула в бой! {boss} в панике!','{name} призывает Духа-Левиафана! ГИГАНТСКИЙ призрачный змей обвивает {boss} и СЖИМАЕТ!','{name} активирует «Гнев Природы»! Деревья, камни, ветер — ВСЁ ополчилось против {boss}! {value} урона!','{name} призывает ДУХА ПРЕДКОВ-ВОИНОВ! Тысяча призрачных копий пронзают {boss} насквозь!','{name} накладывает «ПЕЧАТЬ ВЕЧНОГО СНА» — {boss} погружается в кошмар, из которого нет выхода!'],
  },
  endurance: {
    early: ['{name} окуривает лагерь целебным дымом. Команда чувствует прилив сил.','{name} ставит защитный тотем — духи-хранители занимают свои посты.','{name} общается с духами леса — они предупреждают о каждой атаке {boss}.','{name} разбрасывает руны-обереги — лагерь окутывает защитная аура.','{name} готовит отвар бодрости — команда пьёт и чувствует обновление.'],
    mid: ['{name} вызывает духов-хранителей — они окружают команду, отгоняя тёмные чары {boss}!','{name} призывает духа-черепаху — непробиваемый панцирь защищает всю команду!','{name} входит в транс — глаза белеют, голос звучит как эхо тысячи голосов! «Мы стоим!»','{name} накладывает «Круг Очищения» — тёмная магия {boss} рассеивается при контакте!','{name} призывает духов деревьев-великанов — их корни держат землю, не давая {boss} сотрясти её!','{name} варит «Зелье Абсолютного Спокойствия» — команда перестаёт чувствовать страх!'],
    late: ['{name} достигает связи с миром духов! Целительная аура полностью восстанавливает команду!','{name} стал проводником ВСЕХ духов природы! Лес, небо и земля защищают команду!','{name} призвал Древнего Духа-Хранителя — гигантский призрак встаёт над полем битвы как щит!','{name} открыл портал в мир духов — оттуда идёт непрерывный поток исцеляющей энергии!','{name} слился с Мировым Древом! Его корни питают команду силой самой земли! {boss} БЕССИЛЕН!','{name} произнёс Истинное Имя {boss} — духи природы обрушили на монстра кару всего живого!'],
  },
  strength_count: {
    1: ['{name} ставит тотем подготовки — духи присматриваются к {boss}.','{name} рисует первый рунный круг на земле. Духи начинают собираться.','{name} призывает маленького духа-разведчика — тот облетает {boss} и докладывает о слабостях.','{name} вкапывает первый тотем — он слабо пульсирует энергией.','{name} кидает горсть костей для гадания — духи показывают путь к победе.'],
    2: ['{name} активирует тотем ярости — духи начинают атаковать {boss}!','{name} призывает пару духов-волков — они рвут {boss} с двух сторон!','{name} ставит второй тотем — между тотемами появляется энергетическая стена!','{name} накладывает «Проклятие Хромоты» на {boss} — зверь замедляется вдвое!','{name} варит «Зелье Силы» и раздаёт союзникам — +50% к атаке на минуту!'],
    3: ['{name} входит в боевой транс! Тотемы полыхают — духи рвут {boss} на части!','{name} призывает целую СТАЮ призрачных волков! {boss} окружён и не может сбежать!','{name} активирует ВСЕ тотемы одновременно — энергетический шторм бьёт по {boss}!','{name} открывает «Око Шамана» — видит слабости {boss} и направляет туда ВСЮ мощь духов!','{name} призывает духа грома — молния бьёт в {boss} трижды подряд!'],
    4: ['{name} ПРИЗЫВАЕТ ДУХА-РАЗРУШИТЕЛЯ! Колоссальный призрак СОКРУШАЕТ {boss}!','{name} ОТКРЫВАЕТ ВРАТА ДУХОВ НАСТЕЖЬ! АРМИЯ ПРЕДКОВ обрушивается на {boss}! ТОТАЛЬНОЕ УНИЧТОЖЕНИЕ!','{name} ПРОИЗНОСИТ ЗАПРЕТНОЕ ЗАКЛИНАНИЕ ПРЕДКОВ! {boss} поглощён ВИХРЕМ ДУХОВ и исчезает!','{name} СТАНОВИТСЯ АВАТАРОМ ВЕЛИКОГО ДУХА! Его сила БЕЗГРАНИЧНА — один взгляд ИСПЕПЕЛЯЕТ {boss}!','{name} СТАВИТ ТОТЕМ СУДНОГО ДНЯ! Земля разверзается — {boss} падает в бездну!'],
  },
};
const BATTLEMASTER_ATTACKS = {
  quantitative: {
    low: ['{name} сближается с {boss} и проводит серию ударов — монстр пошатнулся.','{name} перехватывает атаку {boss} и контратакует в ближнем бою.','{name} делает подсечку {boss} — зверь спотыкается, но остаётся на ногах.','{name} проводит захват лапы {boss} и заламывает — монстр рычит от боли.','{name} уклоняется от удара и бьёт локтем в ребро {boss}. Техничный, но слабый удар.','{name} блокирует удар {boss} предплечьем и проводит контратаку коленом.'],
    mid: ['{name} проводит мощный комбо-удар! Кулаки мелькают как молнии — {boss} отступает!','{name} захватывает {boss} в клинч и наносит серию разрушительных апперкотов!','{name} проводит бросок через бедро — {boss} летит на землю с грохотом!','{name} активирует «Стиль Текучей Воды» — каждое движение {boss} обращается против него!','{name} переводит бой в партер и проводит удушающий — {boss} хрипит и слабеет!','{name} наносит серию из 8 ударов за 2 секунды — {boss} не успевает защищаться!','{name} ловит кулак {boss} и проводит болевой на руку — хруст эхом разносится по арене!'],
    high: ['{name} входит в идеальный боевой ритм! Каждый удар — критический! {boss} не может защититься! {value} урона!','{name} проводит ФИНИШЕР! Мощнейший удар пробивает защиту {boss} насквозь!','{name} проводит «КОМБО СУДНОГО ДНЯ» — 16 ударов за секунду! {boss} разлетается! {value} урона!','{name} хватает {boss} за шею и проводит ЗАПРЕЩЁННЫЙ БРОСОК — монстр врезается в землю с такой силой, что остаётся кратер!','{name} активирует «СТИЛЬ ДРАКОНА»! Каждый удар сопровождается ударной волной! {value} урона!','{name} проводит «УДАР СТОЛЕТИЯ» — кулак проходит СКВОЗЬ броню {boss} как сквозь бумагу!','{name} выходит на ИДЕАЛЬНУЮ дистанцию и наносит ONE PUNCH — {boss} УЛЕТАЕТ за горизонт! {value} урона!','{name} входит в «ЗОНУ» — время замедляется, каждый удар ИДЕАЛЕН! {boss} получает АБСОЛЮТНОЕ КОМБО!'],
  },
  endurance: {
    early: ['{name} принимает боевую стойку, готовый к длительному бою с {boss}.','{name} ставит высокий блок и оценивает ритм атак {boss}. Терпение — главное оружие.','{name} дышит ровно и контролирует пульс. {boss} бьёт, но мастер держит дистанцию.','{name} уклоняется минимальными движениями — экономит энергию для долгого боя.','{name} блокирует удар {boss} и не контратакует. «Жди свой момент.»'],
    mid: ['{name} держит оборону стальным захватом! {boss} не может пробить защиту мастера!','{name} перехватывает каждую атаку {boss} и обращает силу монстра против него!','{name} двигается как тень — {boss} бьёт, бьёт, бьёт — и всё мимо!','{name} изматывает {boss} техникой «Тысяча Уклонений» — монстр теряет энергию!','{name} проводит «Клинч Вечности» — {boss} не может вырваться из захвата мастера!','{name} читает каждое микродвижение {boss} — «Твоё тело говорит мне всё за секунду до удара!»'],
    late: ['{name} стоит как скала! {boss} измотан попытками сломить несокрушимого мастера битвы!','{name} НЕ СДВИНУЛСЯ НИ НА МИЛЛИМЕТР! {boss} разбил все кулаки о защиту мастера!','{name} провёл весь бой в ИДЕАЛЬНОЙ обороне! {boss} не нанёс НИ ОДНОГО чистого удара!','{name} достиг состояния «Абсолютного Бойца» — тело реагирует БЫСТРЕЕ мысли!','{name} стоит с закрытыми глазами и ВСЕХ РАВНО блокирует каждый удар {boss}! МАСТЕРСТВО!','{name} измотал {boss} до полного бессилия! Монстр лежит и тяжело дышит — а мастер даже не вспотел!'],
  },
  strength_count: {
    1: ['{name} делает разведку боем — первый удар оценивает защиту {boss}.','{name} тестирует рефлексы {boss} лёгким джебом. Начинаем.','{name} обходит {boss} по кругу, изучая стойку. Один пробный удар — и отступает.','{name} проводит лёгкий лоу-кик — проверяет устойчивость {boss}.','{name} делает финт — {boss} дёргается. «Ага, нервничаешь. Хорошо.»'],
    2: ['{name} нащупал слабое место! Серия точных ударов ломает защиту {boss}!','{name} проводит двойку — джеб-кросс! {boss} шатается от точности!','{name} ловит ритм — удары идут точнее и мощнее! {boss} начинает отступать!','{name} находит брешь в обороне {boss} — локоть влетает точно в висок!','{name} проводит комбинацию «Шторм» — три удара в разные точки за полсекунды!'],
    3: ['{name} в режиме полного контроля! Каждое движение — идеальная техника!','{name} активирует «Рефлексы Хищника»! Скорость рук УТРОИЛАСЬ — {boss} не успевает!','{name} проводит серию из апперкотов и хуков — {boss} летает как боксёрская груша!','{name} перешёл в «Стиль Журавля» — удары ногами сыпятся с невероятной точностью!','{name} выполняет «Танец Смерти» — каждое движение одновременно уклонение и атака!'],
    4: ['{name} РАСКРЫВАЕТ ЗАПРЕТНУЮ ТЕХНИКУ! Удар проходит сквозь любую защиту — {boss} ПОВЕРЖЕН!','{name} ПРОВОДИТ «УДАР БОГА»! Один кулак — ОДНА ПОБЕДА! {boss} ВБИТ В ЗЕМЛЮ ПО ПЛЕЧИ!','{name} ВЫХОДИТ ЗА ПРЕДЕЛЫ ЧЕЛОВЕЧЕСКИХ ВОЗМОЖНОСТЕЙ! Финальная комбинация из 32 ударов УНИЧТОЖАЕТ {boss}!','{name} ВХОДИТ В «УЛЬТРА-ИНСТИНКТ»! Тело двигается само — каждый удар ИДЕАЛЕН! {boss} НЕ ИМЕЕТ ШАНСОВ!','{name} ПРОИЗНОСИТ: «Ты был достойным противником.» Один щелчок пальцев — {boss} РАССЫПАЕТСЯ!'],
  },
};
const ARCHMAGE_ATTACKS = {
  quantitative: {
    low: ['{name} произносит заклинание — магический снаряд ударяет в {boss}, оставляя ожог.','{name} открывает книгу заклятий и наносит лёгкий магический удар по {boss}.','{name} создаёт маленький файербол и швыряет в {boss} — попадание! Но урон невелик.','{name} касается посохом земли — ледяная дорожка бежит к {boss} и замораживает лапу.','{name} щёлкает пальцами — искра летит в {boss}. Больше раздражает, чем вредит.','{name} пролистывает заклинание из справочника и осторожно применяет. Взрыв небольшой, но эффектный.'],
    mid: ['{name} читает древнее заклинание! Огненный шар врезается в {boss} — земля плавится!','{name} призывает ледяную бурю — {boss} скован морозом и не может двигаться!','{name} создаёт «Копьё Света» и метает в {boss} — магия прожигает дыру в броне!','{name} произносит «Цепную Молнию» — электричество скачет по телу {boss}!','{name} открывает портал — из него вылетает поток магмы прямо в {boss}!','{name} создаёт «Гравитационный Колодец» — {boss} вдавливается в землю под десятикратной тяжестью!','{name} читает заклинание «Хаоса» — реальность вокруг {boss} начинает ПЛАВИТЬСЯ!'],
    high: ['{name} произносит ЗАКЛИНАНИЕ ВЫСШЕГО ПОРЯДКА! Поток чистой магии испепеляет {boss}! {value} урона!','{name} призывает метеорный дождь! Небеса обрушиваются на {boss}!','{name} открывает «АРХИВ ЗАПРЕТНЫХ ЗНАНИЙ»! Заклинание 9-го круга СТИРАЕТ {boss} из реальности! {value} урона!','{name} создаёт ЧЁРНУЮ ДЫРУ прямо под {boss}! Гравитация сжимает монстра в точку!','{name} произносит ИСТИННОЕ ИМЯ ОГНЯ — {boss} вспыхивает магическим пламенем в 10,000°C! {value} урона!','{name} останавливает ВРЕМЯ вокруг {boss} и наносит 100 магических ударов за «мгновение»!','{name} призывает «МЕТЕОР УНИЧТОЖЕНИЯ»! Камень размером с дом падает на {boss} с орбиты! {value} урона!','{name} складывает «ЗАКЛИНАНИЕ КОНЦА» — ткань реальности рвётся, поглощая {boss} в пустоту!'],
  },
  endurance: {
    early: ['{name} плетёт магический барьер. {boss} не может проникнуть сквозь чары.','{name} открывает щит из чистого света — тёмные чары {boss} рассеиваются.','{name} создаёт «Руну Спокойствия» — ментальное давление {boss} ослабевает.','{name} окружает себя кольцом парящих книг — каждая содержит защитное заклинание.','{name} произносит мантру ясности — разум остаётся чистым несмотря на давление {boss}.'],
    mid: ['{name} усиливает защитные чары! Ментальные атаки {boss} разбиваются о щит архимага!','{name} создаёт «Зеркало Отражения» — тёмная магия {boss} бьёт по нему же самому!','{name} активирует «Библиотеку Разума» — тысячи заклинаний защиты работают одновременно!','{name} плетёт многослойный барьер — {boss} пробивает один, но за ним ещё десять!','{name} входит в «Состояние Потока» — магия течёт непрерывно, восстанавливая щиты быстрее, чем {boss} их ломает!','{name} произносит: «Я прочёл 10 000 книг. Ты думаешь, твои иллюзии меня обманут?»'],
    late: ['{name} создаёт АБСОЛЮТНЫЙ БАРЬЕР! {boss} истощает свою силу впустую — магия архимага непробиваема!','{name} стал ЕДИНЫМ С ПОТОКОМ МАГИИ! Вся энергия мира защищает архимага и его команду!','{name} произносит «ЗАКЛИНАНИЕ БЕССМЕРТИЯ» — команда не может быть повреждена, пока архимаг стоит!','{name} создал ИЗМЕРЕНИЕ-УБЕЖИЩЕ! Команда отдыхает в безопасности, пока {boss} бьётся о стены портала!','{name} понял СУТЬ магии {boss} и обратил её ПРОТИВ НЕГО! Тёмные чары теперь ЛЕЧАТ команду!','{name} достиг уровня «ВЕЛИКОГО АРХИМАГА»! Его воля СОЗДАЁТ реальность — {boss} НЕ СУЩЕСТВУЕТ в этой реальности!'],
  },
  strength_count: {
    1: ['{name} изучает слабости {boss} магическим зрением.','{name} листает книгу заклинаний в поисках нужного. «Так-так, что тут у нас...»','{name} накладывает «Анализ Слабостей» — магический глаз сканирует {boss}.','{name} пробует базовый огненный шар — {boss} получает лёгкий ожог.','{name} создаёт магическую линзу и изучает структуру брони {boss}.'],
    2: ['{name} наносит точечный магический удар в слабое место {boss}!','{name} нашёл нужное заклинание! «ЛЕДЯНОЕ КОПЬЁ!» — {boss} пронзён насквозь!','{name} комбинирует огонь и молнию — двойное заклинание бьёт по {boss} с удвоенной силой!','{name} создаёт магический резонанс — каждое следующее заклинание бьёт СИЛЬНЕЕ!','{name} накладывает «Проклятие Уязвимости» — магическая защита {boss} рушится!'],
    3: ['{name} складывает многослойное заклинание — магия пронизывает {boss} насквозь!','{name} призывает «Элементальный Шторм» — огонь, лёд, молния и земля атакуют {boss} РАЗОМ!','{name} открывает «Третий Глаз Архимага» — видит будущее на 3 секунды вперёд и кастует ИДЕАЛЬНО!','{name} создаёт «Магическую Пушку» — луч чистой энергии прожигает {boss} насквозь!','{name} активирует «Режим Перегрузки» — магия хлещет из тела как гейзер! {boss} тонет в заклинаниях!'],
    4: ['{name} ПРИЗЫВАЕТ МЕТЕОР УНИЧТОЖЕНИЯ! Магия архимага СТИРАЕТ {boss} с лица земли!','{name} ПРОИЗНОСИТ ЗАКЛИНАНИЕ ДЕСЯТОГО КРУГА — «АБСОЛЮТНЫЙ НОЛЬ»! {boss} ЗАМОРОЖЕН ВО ВРЕМЕНИ И ПРОСТРАНСТВЕ!','{name} СОЗДАЁТ СИНГУЛЯРНОСТЬ! Чёрная дыра поглощает {boss} — от монстра не остаётся НИЧЕГО!','{name} ЧИТАЕТ «СЛОВО СИЛЫ: СМЕРТЬ»! Одно слово — и {boss} ПЕРЕСТАЁТ СУЩЕСТВОВАТЬ!','{name} ОБЪЕДИНЯЕТ ВСЕ ЭЛЕМЕНТЫ В ОДНО ЗАКЛИНАНИЕ! «ULTIMA!» — взрыв СТИРАЕТ ВСЁ в радиусе километра!'],
  },
};
const RAID_BATTLE_TEXTS = { sledopyt: PATHFINDER_ATTACKS, berserk: BERSERKER_ATTACKS, monk: MONK_ATTACKS, shaman: SHAMAN_ATTACKS, master_bitvy: BATTLEMASTER_ATTACKS, archmage: ARCHMAGE_ATTACKS };
const DEFAULT_ATTACKS = {
  quantitative: {
    low: ['{name} атакует {boss} — урон невелик, но удар засчитан.','{name} наносит удар по {boss} — зверь едва заметил.','{name} бьёт {boss} чем попало — попадание есть, но без эффекта.','{name} швыряет камень в {boss} — попал! Но монстр лишь фыркнул.','{name} делает выпад — {boss} уклоняется, но получает касательный удар.'],
    mid: ['{name} наносит мощный удар по {boss}! Монстр отступает!','{name} находит слабое место и бьёт точно туда! {boss} ревёт!','{name} разгоняется и врезается в {boss} — серьёзный урон!','{name} проводит серию ударов — каждый точнее предыдущего! {boss} в замешательстве!','{name} использует окружение — {boss} получает удар, которого не ожидал!'],
    high: ['{name} обрушивает СОКРУШИТЕЛЬНЫЙ удар на {boss}! {value} урона!','{name} выходит за пределы возможностей! КРИТИЧЕСКИЙ удар по {boss}! {value} урона!','{name} наносит ИДЕАЛЬНЫЙ удар — {boss} падает! {value} урона!','{name} собирает все силы в один удар — {boss} ОТЛЕТАЕТ! {value} урона!','{name} ПРЕВОСХОДИТ СЕБЯ! Невероятный удар сотрясает {boss} до основания!'],
  },
  endurance: {
    early: ['{name} держится стойко против {boss}.','{name} готовится к долгому противостоянию с {boss}.','{name} стоит на позиции — {boss} пока не может пробиться.','{name} принимает вызов {boss}. Битва воли начинается.'],
    mid: ['{name} выдерживает натиск {boss} — воля не сломлена!','{name} сопротивляется давлению {boss} — каждый час делает героя сильнее!','{name} стоит, несмотря на всё! {boss} начинает уставать от бесполезных атак!','{name} черпает силу из упорства — {boss} не может сломить эту волю!'],
    late: ['{name} стоит до конца! {boss} не может сломить героя!','{name} НЕСОКРУШИМ! {boss} истощил все свои силы — а герой всё стоит!','{name} прошёл все испытания и стоит СИЛЬНЕЕ, чем в начале!','{name} превратил стойкость в ОРУЖИЕ — {boss} побеждён терпением!'],
  },
  strength_count: {
    1: ['{name} наносит первый осторожный удар по {boss}.','{name} пробует силы — первая попытка против {boss}.'],
    2: ['{name} усиливает натиск — {boss} чувствует давление!','{name} набирает обороты — второй удар мощнее первого!'],
    3: ['{name} входит в раж! Удары сыпятся один за другим!','{name} в режиме полной атаки — {boss} не успевает защищаться!'],
    4: ['{name} НАНОСИТ ФИНАЛЬНЫЙ УДАР! {boss} содрогается от мощи!','{name} ВЫХОДИТ ЗА ПРЕДЕЛЫ! Последний удар СОКРУШАЕТ {boss}!'],
  },
};

function generateRaidBattleLog(boss, raid, guildMembers) {
  if (!raid || !raid.contributions?.length) return [];
  const cond = boss.condition;
  const bossName = boss.name;
  const participantClassMap = {};
  raid.participants.forEach(p => {
    const member = guildMembers.find(m => m.name === p.name || m.characterName === p.name);
    participantClassMap[p.name] = member?.locked_class_id || null;
  });
  const isEndurance = ['each_player_all_days', 'perfect_discipline'].includes(cond.type);
  const isStrengthCount = cond.type === 'shared_count';
  const isQuantitative = cond.type === 'shared_total';
  const sorted = [...raid.contributions].sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.id - b.id);
  const participantContribCount = {};
  return sorted.map(contrib => {
    const { participantName, value, date } = contrib;
    const classId = participantClassMap[participantName];
    const texts = RAID_BATTLE_TEXTS[classId] || DEFAULT_ATTACKS;
    let tier, category;
    if (isEndurance) {
      const prevDays = sorted.filter(c => c.participantName === participantName && c.date <= date).length;
      tier = prevDays <= 2 ? 'early' : prevDays <= 5 ? 'mid' : 'late';
      category = 'endurance';
    } else if (isStrengthCount) {
      participantContribCount[participantName] = (participantContribCount[participantName] || 0) + 1;
      tier = Math.min(participantContribCount[participantName], 4);
      category = 'strength_count';
    } else if (isQuantitative) {
      const perPlayer = cond.target / (raid.participants.length || 1);
      const pct = value / perPlayer;
      tier = pct <= 0.25 ? 'low' : pct <= 0.60 ? 'mid' : 'high';
      category = 'quantitative';
    } else if (cond.type === 'combo_roles') {
      const participant = raid.participants.find(p => p.name === participantName);
      const roleDef = participant?.role ? cond.roles[participant.role] : null;
      if (roleDef?.field) {
        const pct = value / roleDef.target;
        tier = pct <= 0.25 ? 'low' : pct <= 0.60 ? 'mid' : 'high';
        category = 'quantitative';
      } else {
        participantContribCount[participantName] = (participantContribCount[participantName] || 0) + 1;
        tier = Math.min(participantContribCount[participantName], 4);
        category = 'strength_count';
      }
    }
    const pool = texts[category]?.[tier] || DEFAULT_ATTACKS[category]?.[tier] || ['...'];
    const idx = (typeof contrib.id === 'number' ? Math.abs(Math.round(contrib.id)) : 0) % pool.length;
    let text = pool[idx];
    text = text.replace(/\{name\}/g, participantName).replace(/\{boss\}/g, bossName).replace(/\{value\}/g, String(Math.round(value * 10) / 10));
    return { id: contrib.id, date, participantName, classId, text, value, category, tier };
  });
}

const RaidBattleLogModal = React.memo(function RaidBattleLogModal({ boss, raid, guildMembers, onClose }) {
  const entries = useMemo(() => generateRaidBattleLog(boss, raid, guildMembers), [boss, raid, guildMembers]);
  const rc = RAID_RARITY_COLORS[boss.rarity];
  const byDate = useMemo(() => {
    const map = {};
    entries.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111118', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${rc.border}`, position: 'sticky', top: 0, background: '#111118', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{boss.image ? <img src={boss.image} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>{boss.creature}</span>}<div><div style={{ fontSize: 14, fontWeight: 800, color: rc.color }}>Боевой лог</div><div style={{ fontSize: 10, color: '#5a5a6a' }}>{boss.name}</div></div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#6a6a72" /></button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {entries.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#4a4a58', fontSize: 13 }}>Ещё нет записей. Начните вносить активности!</div>}
          {byDate.map(([date, dayEntries]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ height: 1, flex: 1, background: '#2a2a32' }} /><span style={{ fontSize: 10, fontWeight: 700, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span><div style={{ height: 1, flex: 1, background: '#2a2a32' }} /></div>
              {dayEntries.map(entry => {
                const cls = CHARACTER_CLASSES.find(c => c.id === entry.classId);
                const clsColor = cls?.color || '#6a6a82';
                const ClsIcon = cls?.icon || Swords;
                const epicMap = { low: '#8a8a92', mid: '#c0c0ca', high: '#f0d272', early: '#8a8a92', 1: '#8a8a92', 2: '#b0b0ba', 3: '#c0c0ca', 4: '#f0d272' };
                const textColor = epicMap[entry.tier] || '#a0a0b0';
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 4, background: '#16161e', border: '1px solid #1e1e28', borderRadius: 10, borderLeft: `3px solid ${clsColor}44` }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: clsColor + '22', border: `1px solid ${clsColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClsIcon size={13} color={clsColor} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11.5, color: textColor, lineHeight: 1.5 }}>{entry.text}</div></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const ArchiveDetailModal = React.memo(function ArchiveDetailModal({ entry, onClose }) {
  const [story, setStory] = React.useState(entry.story || null);
  const [loading, setLoading] = React.useState(false);
  const rc = RAID_RARITY_COLORS[entry.bossRarity] || RAID_RARITY_COLORS.rare;

  async function generateStory() {
    setLoading(true);
    try {
      const participants = (entry.participants || []).join(', ');
      const result = entry.result === 'victory' ? 'победили' : 'потерпели поражение';
      const prompt = `Ты — рассказчик эпических легенд в стиле аниме (Наруто, Bleach, One Piece). Напиши короткую историю битвы (4-6 предложений) о том, как отряд игроков ${result} в схватке с боссом "${entry.bossName}". Участники отряда: ${participants}. Упомяни каждого по имени. Исход: ${entry.result === 'victory' ? 'эпическая победа' : 'героическое поражение'}. Пиши на русском, ярко и пафосно.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || 'История не сгенерирована.';
      setStory(text);
      // Cache in entry
      entry.story = text;
    } catch (e) {
      setStory('Хроники этой битвы утеряны во тьме...');
    }
    setLoading(false);
  }

  React.useEffect(() => {
    if (!story && !loading) generateStory();
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}>
      <div style={{ background: '#1c1c22', border: `1.5px solid ${rc.color}44`, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {(() => {
            // Ищем актуальную картинку по bossId (а не по устаревшему снимку в архиве) —
            // так старые записи архива тоже сразу получают новую картинку, без пересохранения.
            const liveBoss = RAID_BOSSES.find(b => b.id === entry.bossId);
            const img = liveBoss?.image || entry.bossImage;
            return img
              ? <img src={img} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
              : <span style={{ fontSize: 40 }}>{entry.bossCreature}</span>;
          })()}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: entry.result === 'victory' ? '#7de87d' : '#e87d7d' }}>
              {entry.result === 'victory' ? '🏆 Победа' : '💀 Поражение'}
            </div>
            <div style={{ fontSize: 11, color: rc.color, fontWeight: 700 }}>{entry.bossName}</div>
            <div style={{ fontSize: 10, color: '#5a5a6a' }}>{entry.date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 20 }}>✕</button>
        </div>

        {/* Participants */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(entry.participants || []).map(p => (
            <div key={p} style={{ fontSize: 11, fontWeight: 700, color: rc.color, background: rc.color + '18', border: `1px solid ${rc.color}44`, borderRadius: 6, padding: '2px 8px' }}>
              ⚔️ {p}
            </div>
          ))}
        </div>

        {/* Loot */}
        {entry.lootName && (
          <div style={{ fontSize: 11.5, color: rc.color, background: rc.color + '12', border: `1px solid ${rc.color}33`, borderRadius: 8, padding: '6px 10px', marginBottom: 14 }}>
            🎁 {entry.lootName}
          </div>
        )}

        {/* Story */}
        <div style={{ borderTop: `1px solid ${rc.color}22`, paddingTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: rc.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>📜 Хроники битвы</div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #3a3a42', borderTopColor: rc.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 12, color: '#6a6a72' }}>Духи рассказывают историю...</span>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#c0c0ca', lineHeight: 1.7 }}>{story}</div>
          )}
          {!loading && story && (
            <button onClick={generateStory} style={{ marginTop: 12, fontSize: 10, color: '#5a5a6a', background: 'none', border: '1px solid #2a2a32', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              ↺ Другая версия
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const RaidsView = React.memo(function RaidsView({ raids, currentClass, characterName, onStartRaid, onJoinRaid, onSetReady, onLaunchRaid, onAddContribution, onResolve, onLeave, onCloseRaid, onRefresh, guildMembers, onCancelRaid, raidArchive, unomieDebuff }) {
  const [refreshing, setRefreshing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveDetail, setArchiveDetail] = useState(null);
  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  const isDebuffActive = unomieDebuff && new Date(unomieDebuff.expiresDate) > new Date();
  const debuffDaysLeft = isDebuffActive ? Math.ceil((new Date(unomieDebuff.expiresDate) - new Date()) / 86400000) : 0;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Unomie debuff banner */}
      {isDebuffActive && (
        <div style={{ padding: '10px 14px', background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>😔</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#e05f4a' }}>Уныние</div>
            <div style={{ fontSize: 10.5, color: '#8a5a5a' }}>Новые рейды заблокированы ещё {debuffDaysLeft} дн. · −10% XP активно</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, padding: '10px 14px', background: '#1c1c22', borderRadius: 12, border: '1px solid #28282f' }}>
        <div style={{ fontSize: 11.5, color: '#7a7a82', lineHeight: 1.6, flex: 1 }}>
          ⚔️ Рейды — совместные испытания на 3 игроков. Инициатор нажимает «Начать рейд» когда все готовы. При провале — дебафф <span style={{ color: '#ff5c7a', fontWeight: 700 }}>«Уныние»</span> (блок рейдов 3 дн. + штраф XP).
        </div>
        <button onClick={handleRefresh} style={{ background: 'none', border: '1px solid #3a3a42', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 12, color: refreshing ? '#e0a868' : '#6a6a72', flexShrink: 0 }}>
          {refreshing ? '⟳' : '↺'}
        </button>
      </div>

      {/* Archive panel */}
      {raidArchive && raidArchive.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setArchiveOpen(!archiveOpen)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#1c1c22', border: '1.5px solid #28282f', borderRadius: 12,
            padding: '10px 14px', cursor: 'pointer', color: '#dcdce2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📜</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Архив рейдов</span>
              <span style={{ fontSize: 10.5, color: '#6a6a72' }}>{raidArchive.filter(e => e.result === 'victory').length} побед · {raidArchive.filter(e => e.result === 'defeat').length} провалов</span>
            </div>
            <span style={{ fontSize: 13, color: '#5a5a6a' }}>{archiveOpen ? '▲' : '▼'}</span>
          </button>
          {archiveOpen && (
            <div style={{ background: '#18181f', border: '1.5px solid #28282f', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {raidArchive.map((entry, i) => {
                  const rc = RAID_RARITY_COLORS[entry.bossRarity] || RAID_RARITY_COLORS.rare;
                  const isVic = entry.result === 'victory';
                  return (
                    <button key={i} onClick={() => setArchiveDetail(entry)} style={{
                      width: 56, height: 56, borderRadius: 12, border: `2px solid ${isVic ? rc.color + '88' : '#3a3a42'}`,
                      background: isVic ? rc.color + '18' : '#1a1a20',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', gap: 2, position: 'relative',
                    }}>
                      {(() => {
                        const liveBoss = RAID_BOSSES.find(b => b.id === entry.bossId);
                        const img = liveBoss?.image || entry.bossImage;
                        return img
                          ? <img src={img} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                          : <span style={{ fontSize: 22 }}>{entry.bossCreature}</span>;
                      })()}
                      <span style={{ fontSize: 9, color: isVic ? rc.color : '#5a5a6a', fontWeight: 700 }}>{isVic ? '✓' : '✗'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archive detail modal */}
      {archiveDetail && (
        <ArchiveDetailModal
          entry={archiveDetail}
          onClose={() => setArchiveDetail(null)}
        />
      )}

      {/* Побеждённые боссы исчезают из пула */}
      {(() => {
        const defeatedBossIds = new Set((raidArchive || []).filter(e => e.result === 'victory').map(e => e.bossId));
        return [...RAID_BOSSES]
          .filter(boss => !defeatedBossIds.has(boss.id) || raids[boss.id])
          .sort((a, b) => {
            const order = { rare: 0, epic: 1, legendary: 2, mythic: 3 };
            return (order[a.rarity] ?? 99) - (order[b.rarity] ?? 99);
          })
          .map((boss) => (
            <RaidBossCard
              key={boss.id}
              boss={boss}
              raid={raids[boss.id]}
              currentClass={currentClass}
              characterName={characterName}
              onStart={() => onStartRaid(boss.id)}
              onJoin={(role) => onJoinRaid(boss.id, role)}
              onReady={() => onSetReady(boss.id)}
              onLaunch={() => onLaunchRaid(boss.id)}
              onAddContribution={(value, override, subKey) => onAddContribution(boss.id, characterName, value, override, subKey)}
              onResolve={() => onResolve(boss.id)}
              onLeave={() => onLeave(boss.id)}
              onCloseRaid={() => onCloseRaid(boss.id)}
              guildMembers={guildMembers}
              onCancelRaid={() => onCancelRaid(boss.id)}
            />
          ));
      })()}
    </div>
  );
});

const RaidBossCard = React.memo(function RaidBossCard({ boss, raid, currentClass, characterName, onStart, onJoin, onReady, onLaunch, onAddContribution, onResolve, onLeave, onCloseRaid, guildMembers, onCancelRaid }) {
  const [contribValue, setContribValue] = useState('');
  const [showBattleLog, setShowBattleLog] = useState(false);

  const rc = RAID_RARITY_COLORS[boss.rarity];
  const status = raid?.status;

  const isParticipant = raid?.participants?.some(p => p.name === characterName);
  const myEntry = raid?.participants?.find(p => p.name === characterName);
  const iAmReady = myEntry?.ready || false;
  const allReady = raid?.participants?.length >= (boss.minPlayers || 3) && raid?.participants?.every(p => p.ready);
  const spotsLeft = (boss.maxPlayers || 3) - (raid?.participants?.length || 0);

  // Progress
  let progressValue = 0, progressTarget = 1, progressLabel = '';
  if (raid && boss.condition.type === 'shared_total') {
    progressValue = raid.contributions.reduce((s, c) => s + c.value, 0);
    progressTarget = boss.condition.target;
    progressLabel = `${Math.round(progressValue * 10) / 10} / ${progressTarget} ${boss.condition.unit}`;
  } else if (raid && boss.condition.type === 'shared_count') {
    progressValue = raid.contributions.length;
    progressTarget = boss.condition.target;
    progressLabel = `${progressValue} / ${progressTarget} ${boss.condition.unit}`;
  } else if (raid && boss.condition.type === 'combo_roles') {
    const roleEntries = Object.entries(boss.condition.roles);
    let doneCount = 0;
    roleEntries.forEach(([roleKey, roleDef]) => {
      const p = raid.participants.find(pp => pp.role === roleKey);
      if (!p) return;
      const myContribs = raid.contributions.filter(c => c.participantName === p.name);
      const done = roleDef.subtargets
        ? roleDef.subtargets.every((st, idx) => myContribs.filter(c => c.subKey === idx).reduce((s, c) => s + c.value, 0) >= st.target)
        : myContribs.reduce((s, c) => s + c.value, 0) >= roleDef.target;
      if (done) doneCount++;
    });
    progressValue = doneCount; progressTarget = roleEntries.length;
    progressLabel = `${doneCount} / ${roleEntries.length} ролей выполнено`;
  } else if (raid && boss.condition.type === 'each_player_all_days') {
    const total = (raid.participants?.length || 0) * boss.condition.daysRequired;
    const covered = new Set(raid.contributions.map(c => c.participantName + '_' + c.date)).size;
    progressValue = covered; progressTarget = total;
    progressLabel = `${covered} / ${total} дней-участников`;
  }
  const progressPct = progressTarget > 0 ? Math.min(100, (progressValue / progressTarget) * 100) : 0;

  let deadlineStr = '', expired = false, countdownStr = '';
  if (raid?.startDate) {
    const deadline = new Date(raid.startDate);
    deadline.setDate(deadline.getDate() + boss.durationDays);
    deadlineStr = deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    expired = new Date() > deadline;
    if (!expired) {
      const diff = deadline - new Date();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      countdownStr = d > 0 ? `${d}д ${h}ч` : h > 0 ? `${h}ч ${m}м` : `${m}м`;
    }
  }

  const classId = raid?.startClassId || (currentClass ? (currentClass.combo ? currentClass.classA.id : currentClass.id) : null);
  const loot = RAID_LOOT_BY_CLASS[boss.id]?.[classId];

  const [overrideMode, setOverrideMode] = useState(false);
  const [collapsed, setCollapsed] = useState(!raid); // collapsed by default if no active raid
  const subOverrideDraft = useRef({});

  function handleContrib() {
    const v = Number(contribValue);
    if (overrideMode) {
      if (contribValue === '' || isNaN(v) || v < 0) return;
    } else {
      if (!v || v <= 0) return;
    }
    onAddContribution(v, overrideMode);
    setContribValue('');
    setOverrideMode(false);
  }

  return (
    <div style={{ border: `1.5px solid ${rc.border}`, background: rc.bg, borderRadius: 16, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      {/* Collapsed header — always visible */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        position: 'relative',
      }}>
        {boss.image
          ? <img src={boss.image} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          : (boss.creature && <span style={{ fontSize: 22, flexShrink: 0 }}>{boss.creature}</span>)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: rc.color, letterSpacing: 0.3 }}>{boss.name}</div>
          <div style={{ fontSize: 10, color: '#6a6a72', marginTop: 1 }}>{boss.subtitle} · {boss.durationDays} дн.</div>
        </div>
        {/* Status chip */}
        <div style={{ fontSize: 9, fontWeight: 700, color: rc.color, background: rc.color + '22', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
          {status === 'victory' ? '✓ ПОБЕДА' : status === 'defeat' ? '✗ ПРОВАЛ' : status === 'active' ? '⚔️ АКТИВЕН' : status === 'gathering' ? '⌛ СБОР' : 'ДОСТУПЕН'}
        </div>
        {/* Progress bar strip when active */}
        {status === 'active' && progressTarget > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#1a1a22' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: rc.color, borderRadius: 1 }} />
          </div>
        )}
        <span style={{ fontSize: 12, color: '#4a4a52', marginLeft: 4 }}>{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Expanded content */}
      {!collapsed && (
      <div style={{ padding: '0 14px 14px', position: 'relative' }}>
      <div style={{ fontSize: 11.5, color: '#9a9aa2', lineHeight: 1.5, marginBottom: 12 }}>{boss.description}</div>

      {/* GATHERING PHASE */}
      {status === 'gathering' && (
        <div style={{ background: '#1a1a22', border: '1px solid #2a2a32', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d0d0da', marginBottom: 8 }}>⌛ Сбор участников ({raid.participants.length}/{boss.maxPlayers || 3})</div>

          {/* Participant list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {Array.from({ length: boss.maxPlayers || 3 }, (_, i) => {
              const p = raid.participants[i];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: p ? '#1e2030' : '#16161e', border: `1px solid ${p ? rc.border : '#1e1e26'}`, borderRadius: 8 }}>
                  {p ? (
                    <>
                      <span style={{ fontSize: 13 }}>{p.ready ? '✅' : '⏳'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.name === characterName ? rc.color : '#c0c0ca' }}>{p.name}{p.name === characterName ? ' (ты)' : ''}</span>
                      {p.role && boss.condition.roles?.[p.role] && (
                        <span style={{ fontSize: 10, color: rc.color, background: rc.color + '18', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>
                          {boss.condition.roles[p.role].emoji}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: p.ready ? '#4ce0c0' : '#6a6a72', marginLeft: 'auto' }}>{p.ready ? 'Готов' : 'Ждёт'}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: '#3a3a42' }}>Место {i + 1} — свободно</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Join/Ready buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!isParticipant && spotsLeft > 0 && boss.condition.type === 'combo_roles' && (
              <div>
                <div style={{ fontSize: 10.5, color: '#7a7a82', marginBottom: 6 }}>Выбери свою роль:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(boss.condition.roles).map(([roleKey, roleDef]) => {
                    const taken = raid.participants.find(p => p.role === roleKey);
                    return (
                      <button key={roleKey} onClick={() => !taken && onJoin(roleKey)}
                        disabled={!!taken}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 8, cursor: taken ? 'not-allowed' : 'pointer',
                          background: taken ? '#1a1a22' : rc.color + '22',
                          border: `1px solid ${taken ? '#2a2a32' : rc.color + '55'}`,
                          fontSize: 11, fontWeight: 700, color: taken ? '#3a3a42' : rc.color,
                          opacity: taken ? 0.5 : 1,
                        }}>
                        {roleDef.emoji} {roleDef.label.split(' ').slice(1).join(' ')}<br/>
                        <span style={{ fontSize: 9.5, fontWeight: 400 }}>
                          {taken
                            ? `(${taken.name})`
                            : roleDef.subtargets
                              ? roleDef.subtargets.map(st => `${st.target} ${st.unit}`).join(' + ')
                              : roleDef.target + ' ' + roleDef.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {!isParticipant && spotsLeft > 0 && boss.condition.type !== 'combo_roles' && (
              <button onClick={() => onJoin(null)} style={{
                padding: '9px', borderRadius: 8, cursor: 'pointer',
                background: rc.color + '22', border: `1px solid ${rc.color}55`,
                fontSize: 12, fontWeight: 700, color: rc.color,
              }}>
                ⚔️ Вступить в рейд
              </button>
            )}
            {isParticipant && !iAmReady && (
              <button onClick={onReady} style={{
                flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                background: '#1a3a1a', border: '1px solid #3a6a3a',
                fontSize: 12, fontWeight: 700, color: '#7de87d',
              }}>
                ✅ Я готов!
              </button>
            )}
            {isParticipant && iAmReady && !allReady && (
              <div style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#1a2a1a', border: '1px solid #2a4a2a', fontSize: 12, color: '#4ce0c0', textAlign: 'center' }}>
                Ждём остальных...
              </div>
            )}
          </div>
          {/* Launch button — initiator only, all must be ready */}
          {raid.initiator === characterName && (
            (() => {
              const allReady2 = raid.participants.every(p => p.ready) && raid.participants.length >= (boss.minPlayers || 3);
              return (
                <button onClick={onLaunch} disabled={!allReady2} style={{
                  width: '100%', padding: '10px', marginTop: 8, borderRadius: 10, cursor: allReady2 ? 'pointer' : 'not-allowed',
                  background: allReady2 ? 'linear-gradient(135deg, #1a3a1a, #0f2a0f)' : '#1a1a22',
                  border: `1.5px solid ${allReady2 ? '#4a9a4a' : '#2a2a32'}`,
                  fontSize: 13, fontWeight: 800, color: allReady2 ? '#7de87d' : '#3a3a42',
                }}>
                  {allReady2 ? '⚔️ Начать рейд!' : `⏳ Ждём готовности (${raid.participants.filter(p => p.ready).length}/${raid.participants.length})`}
                </button>
              );
            })()
          )}
          {isParticipant && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {raid.initiator === characterName ? (
                <button onClick={onCloseRaid} style={{ flex: 1, padding: '6px', borderRadius: 8, cursor: 'pointer', background: 'none', border: '1px solid #4a2a2a', fontSize: 11, color: '#8a4a4a', fontWeight: 700 }}>
                  ✕ Отменить сбор
                </button>
              ) : (
                <button onClick={onLeave} style={{ flex: 1, padding: '6px', borderRadius: 8, cursor: 'pointer', background: 'none', border: '1px solid #3a2a2a', fontSize: 11, color: '#6a4a4a' }}>
                  Выйти из рейда
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel button for active raids — initiator only, first hour */}
      {status === 'active' && raid.initiator === characterName && raid.activatedAt && (Date.now() - new Date(raid.activatedAt).getTime()) < 3600000 && (
        <button onClick={onCancelRaid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '7px', marginTop: 8, background: '#2a1818', border: '1px solid #5a2a2a', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#e05f4a' }}>
          ✕ Отменить рейд <span style={{ fontSize: 9, color: '#8a4a4a' }}>({Math.max(0, Math.ceil((3600000 - (Date.now() - new Date(raid.activatedAt).getTime())) / 60000))} мин.)</span>
        </button>
      )}

      {/* ACTIVE PHASE */}
      {status === 'active' && (
        <>
          {/* Participants */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {raid.participants.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: p.name === characterName ? rc.color + '22' : '#1e1e28', border: `1px solid ${p.name === characterName ? rc.color + '55' : '#2a2a32'}`, borderRadius: 6, fontSize: 10.5, color: p.name === characterName ? rc.color : '#8a8a92', fontWeight: 600 }}>
                <span>⚔️</span><span>{p.name}{p.name === characterName ? ' (ты)' : ''}</span>
              </div>
            ))}
          </div>

          {/* Battle Log button */}
          <button onClick={() => setShowBattleLog(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '8px', marginBottom: 10,
            background: rc.color + '11', border: `1px solid ${rc.color}33`,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 11, fontWeight: 700, color: rc.color,
          }}>
            <Swords size={13} color={rc.color} />
            Боевой лог ({raid.contributions.length})
          </button>
          {showBattleLog && <RaidBattleLogModal boss={boss} raid={raid} guildMembers={guildMembers || []} onClose={() => setShowBattleLog(false)} />}

          {/* Progress */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a7a82', marginBottom: 4 }}>
              <span>{boss.condition.label}</span>
              <span style={{ color: rc.color, fontWeight: 700 }}>{progressLabel}</span>
            </div>
            <div style={{ height: 8, background: '#24242b', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: rc.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
            {deadlineStr && <div style={{ fontSize: 10.5, color: expired ? '#ff5c7a' : '#6a6a72', marginTop: 4 }}>
              {expired && status === 'active'
                ? '⏰ ВРЕМЯ ВЫШЛО!'
                : `⏳ Осталось: ${countdownStr} · до ${deadlineStr}`}
            </div>}
          </div>

          {/* My contribution */}
          {isParticipant && (() => {
            const myAllContribs = raid.contributions.filter(c => c.participantName === characterName);
            const myAllTotal = myAllContribs.reduce((s, c) => s + c.value, 0);
            const myRole = raid.participants.find(p => p.name === characterName)?.role;
            const roleDef = myRole && boss.condition.roles?.[myRole] ? boss.condition.roles[myRole] : null;

            if (roleDef?.subtargets) {
              const subDone = roleDef.subtargets.map((st, idx) =>
                myAllContribs.filter(c => c.subKey === idx).reduce((s, c) => s + c.value, 0)
              );
              return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ padding: '8px 10px', background: '#1a1a26', borderRadius: 8, marginBottom: overrideMode ? 8 : 0 }}>
                    <div style={{ fontSize: 11, color: '#7a7a82', marginBottom: 4 }}>{roleDef.emoji} {roleDef.label}:</div>
                    {roleDef.subtargets.map((st, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: subDone[idx] >= st.target ? '#7de87d' : '#dcdce2', marginBottom: 2 }}>
                        {subDone[idx] >= st.target ? '✓' : '·'} {subDone[idx]} / {st.target} {st.unit}
                      </div>
                    ))}
                    <button
                      onClick={() => setOverrideMode(!overrideMode)}
                      style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 5, cursor: 'pointer', fontWeight: 700, marginTop: 6,
                        background: overrideMode ? '#4a1a1a' : 'none',
                        border: `1px solid ${overrideMode ? '#e05f4a' : '#3a3a42'}`,
                        color: overrideMode ? '#e05f4a' : '#5a5a6a',
                      }}
                    >
                      ✎ Исправить
                    </button>
                  </div>
                  {overrideMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {roleDef.subtargets.map((st, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="number"
                            placeholder={`Итого ${st.unit}...`}
                            defaultValue={subDone[idx] || ''}
                            onChange={e => { subOverrideDraft.current[idx] = e.target.value; }}
                            style={{ flex: 1, background: '#13131a', border: '1px solid #e05f4a55', borderRadius: 8, padding: '8px 10px', color: '#d0d0da', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                          />
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => {
                          roleDef.subtargets.forEach((st, idx) => {
                            const raw = subOverrideDraft.current[idx];
                            if (raw === undefined || raw === '') return;
                            const v = Number(raw);
                            if (isNaN(v) || v < 0) return;
                            onAddContribution(v, true, idx);
                          });
                          setOverrideMode(false);
                        }} style={{ flex: 1, padding: '8px 14px', background: '#e05f4a22', border: '1px solid #e05f4a55', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#e05f4a' }}>
                          Сохранить
                        </button>
                        <button onClick={() => setOverrideMode(false)} style={{ padding: '8px 10px', background: 'none', border: '1px solid #3a3a42', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#6a6a72' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#1a1a26', borderRadius: 8, marginBottom: overrideMode ? 8 : 0 }}>
                  <span style={{ fontSize: 11, color: '#7a7a82', flex: 1 }}>
                    {roleDef
                      ? `${roleDef.emoji} ${roleDef.label}: ${myAllTotal} / ${roleDef.target} ${roleDef.unit}`
                      : `Мой вклад: ${myAllTotal} ${boss.condition.unit}`}
                  </span>
                  <button
                    onClick={() => setOverrideMode(!overrideMode)}
                    style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 5, cursor: 'pointer', fontWeight: 700,
                      background: overrideMode ? '#4a1a1a' : 'none',
                      border: `1px solid ${overrideMode ? '#e05f4a' : '#3a3a42'}`,
                      color: overrideMode ? '#e05f4a' : '#5a5a6a',
                    }}
                  >
                    ✎ Исправить
                  </button>
                </div>
                {overrideMode && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder={`Итого за рейд (${boss.condition.unit})...`}
                      value={contribValue}
                      onChange={e => setContribValue(e.target.value)}
                      style={{ flex: 1, background: '#13131a', border: '1px solid #e05f4a55', borderRadius: 8, padding: '8px 10px', color: '#d0d0da', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                      autoFocus
                    />
                    <button onClick={handleContrib} style={{ padding: '8px 14px', background: '#e05f4a22', border: '1px solid #e05f4a55', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#e05f4a' }}>
                      Сохранить
                    </button>
                    <button onClick={() => { setOverrideMode(false); setContribValue(''); }} style={{ padding: '8px 10px', background: 'none', border: '1px solid #3a3a42', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#6a6a72' }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {expired && (
            <button onClick={onResolve} style={{ width: '100%', padding: '9px', marginBottom: 8, borderRadius: 8, cursor: 'pointer', background: '#2a1a1a', border: '1px solid #6a2a2a', fontSize: 12, fontWeight: 700, color: '#ff5c7a' }}>
              Завершить рейд
            </button>
          )}
          {/* Рейд активен — отменить нельзя. Только победа или поражение по времени. */}
        </>
      )}

      {/* VICTORY */}
      {status === 'victory' && (
        <div style={{ background: '#1a2e1a', border: '1px solid #3a5a3a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7de87d', marginBottom: 6 }}>🏆 Победа! Общий титул: «{boss.sharedTitle}»</div>
          {loot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#c8e8c8' }}>
              {loot.image && <img src={loot.image} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
              <span><span style={{ color: rc.color, fontWeight: 700 }}>{loot.name}</span> — {Object.entries(loot.stats).map(([s, v]) => `+${v} ${s}`).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* DEFEAT */}
      {status === 'defeat' && (
        <div style={{ background: '#2e1a1a', border: '1px solid #5a3a3a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e87d7d' }}>💀 Провал — штраф: −{RAID_DEFEAT_PENALTY_BY_RARITY[boss.rarity]} HP</div>
        </div>
      )}

      {/* Loot preview */}
      {!status && loot && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#1e1e28', border: `1px solid ${rc.border}`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#5a5a6a', marginBottom: 3 }}>Лут предпросмотр:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loot.image && <img src={loot.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: 11.5, color: rc.color, fontWeight: 700 }}>{loot.name}</div>
              <div style={{ fontSize: 10.5, color: '#7a7a82' }}>{Object.entries(loot.stats).map(([s, v]) => `+${v} ${s}`).join(', ')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Start button */}
      {!status && (
        <button onClick={onStart} style={{ width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer', background: rc.color + '22', border: `1.5px solid ${rc.color}55`, fontSize: 13, fontWeight: 700, color: rc.color }}>
          ⚔️ Открыть рейд (нужно 3 игрока)
        </button>
      )}

      {/* Close completed raids */}
      {(status === 'victory' || status === 'defeat') && (
        <button onClick={onCloseRaid} style={{ width: '100%', padding: '8px', borderRadius: 8, cursor: 'pointer', background: 'none', border: '1px solid #2a2a32', fontSize: 11, color: '#5a5a6a', marginTop: 4 }}>
          Закрыть
        </button>
      )}
      </div>
      )}
    </div>
  );
});


const CosmeticsSection = React.memo(function CosmeticsSection({ purchasedFrameIds, equippedAvatarFrame, onBuyFrame, onEquipFrame, currencyBalance, ownedBackgrounds, onBuyBackground }) {
  const rarityGroups = ['cheap', 'rare', 'epic', 'legendary', 'mythic'];
  const [openFrameRarity, setOpenFrameRarity] = useState(null);
  const tierColors = {
    cheap:     { color: '#a0a0b0', label: '✨ Простые (5 💎)' },
    common:    { color: '#b0b0ba', label: 'Обычные' },
    rare:      { color: '#5b9bf0', label: 'Редкие' },
    epic:      { color: '#9a6ae0', label: 'Эпические' },
    legendary: { color: '#f0d272', label: 'Легендарные' },
    mythic:    { color: '#e05f9c', label: 'Мифические' },
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e05f9c', marginBottom: 4 }}>🖼 Рамки аватара</div>
      <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 16 }}>Покупай рамки и одевай их в разделе Персонаж → Экипировка</div>
      {rarityGroups.map(rarity => {
        const frames = AVATAR_FRAMES.filter(f => f.rarity === rarity);
        if (!frames.length) return null;
        const tc = tierColors[rarity];
        const isOpen = openFrameRarity === rarity;
        const ownedInGroup = frames.filter(f => purchasedFrameIds.includes(f.id)).length;
        return (
          <div key={rarity} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setOpenFrameRarity(isOpen ? null : rarity)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: isOpen ? tc.color + '14' : '#1a1a22', border: '1px solid ' + (isOpen ? tc.color + '44' : '#28282f'),
                borderRadius: isOpen ? '10px 10px 0 0' : 10, padding: '10px 14px',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: tc.color, textTransform: 'uppercase', letterSpacing: 0.8 }}>{tc.label}</span>
              <span style={{ fontSize: 10, color: '#6a6a72' }}>{ownedInGroup}/{frames.length}</span>
              <ChevronDown size={13} color="#9a9aa2" style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid ' + tc.color + '44', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 10, animation: 'fadeUp 0.15s ease' }}>
              {frames.map(frame => {
                const owned = purchasedFrameIds.includes(frame.id);
                const equipped = equippedAvatarFrame === frame.id;
                const canAfford = frame.price === 0 || currencyBalance >= frame.price;
                const isMythic = !!frame.requirement?.type;
                return (
                  <div key={frame.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: equipped ? tc.color + '18' : '#1a1a22',
                    border: `1px solid ${equipped ? tc.color + '66' : '#2a2a32'}`,
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    {/* Превью рамки */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: '#13131a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...frame.style,
                    }}>
                      <span style={{ fontSize: 18 }}>⚔️</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: equipped ? tc.color : '#d0d0da' }}>{frame.name}</div>
                      <div style={{ fontSize: 10, color: '#5a5a6a', marginTop: 1 }}>
                        {isMythic ? '🔒 Мифическая ачивка' : frame.price === 0 ? 'Бесплатно' : `${frame.price} 💎`}
                        {owned && <span style={{ color: '#4ce0c0', marginLeft: 6 }}>✓ Куплена</span>}
                      </div>
                    </div>
                    {owned ? (
                      <button onClick={() => onEquipFrame(frame.id)} style={{
                        padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        background: equipped ? tc.color : 'transparent',
                        border: `1px solid ${tc.color}`,
                        color: equipped ? '#13131a' : tc.color,
                      }}>
                        {equipped ? 'Снять' : 'Надеть'}
                      </button>
                    ) : (
                      <button onClick={() => onBuyFrame(frame.id)} disabled={!canAfford && !isMythic} style={{
                        padding: '5px 12px', borderRadius: 7, cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 700,
                        background: canAfford ? tc.color + '22' : '#1a1a22',
                        border: `1px solid ${canAfford ? tc.color + '66' : '#2a2a32'}`,
                        color: canAfford ? tc.color : '#4a4a52',
                        opacity: canAfford ? 1 : 0.5,
                      }}>
                        {isMythic ? '🔒' : `${frame.price} 💎`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        );
      })}

      {/* Фоны профиля */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #22222e' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0d272', marginBottom: 4 }}>🖼️ Фоны профиля</div>
        <div style={{ fontSize: 11, color: '#6a6a72', marginBottom: 12 }}>Покупай фоны здесь, надевай в Персонаж → Сундук экипировки. Активный фон видно всем в гильдии.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PROFILE_BACKGROUNDS.map(bg => {
            const owned = (ownedBackgrounds || []).includes(bg.id);
            const canAfford = currencyBalance >= bg.price;
            return (
              <div key={bg.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10, padding: '10px 12px',
                background: bg.gradient, border: owned ? '1.5px solid #f0d27266' : '1px solid #28282f',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f0f0f4' }}>{bg.name}</div>
                  {owned && <div style={{ fontSize: 10, color: '#7dd88a' }}>✓ Куплено</div>}
                </div>
                {!owned && (
                  <button onClick={() => onBuyBackground(bg.id)} disabled={!canAfford} style={{
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7,
                    background: canAfford ? '#f0d27222' : '#1a1a22', border: '1px solid ' + (canAfford ? '#f0d27266' : '#2a2a32'),
                    color: canAfford ? '#f0d272' : '#4a4a52', cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5,
                  }}>
                    {bg.price} 💎
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Renders an item's bonus with the activity's own color (running orange, strength green, etc.)
// so it's readable at a glance in the shop grid, instead of one flat gray label for everything.
function renderBonusColored(bonus) {
  if (!bonus) return null;
  if (bonus.crystalPct) {
    return <span style={{ color: '#4ce0c0', fontWeight: 700 }}>+{bonus.crystalPct}% 💎</span>;
  }
  if (!bonus.xpBonusPct) return null;
  const acts = bonus.activities || (bonus.activity ? [bonus.activity] : []);
  return (
    <span>
      {'+' + bonus.xpBonusPct + '% '}
      {acts.map((a, i) => {
        const at = ACTIVITY_TYPES[a];
        const color = a === 'all' ? '#f0d272' : (at?.color || '#dcdce2');
        const label = a === 'all' ? 'всем' : (at?.label || a);
        return (
          <span key={a} style={{ color, fontWeight: 700 }}>
            {label}{i < acts.length - 1 ? ' + ' : ''}
          </span>
        );
      })}
    </span>
  );
}

const ShopView = React.memo(function ShopView({ currencyBalance, purchasedItemIds, shopItemAvailability, equippedShopItems, onPurchase, onEquip, onSell, onBuyConsumable, consumableLog, level, lockedClassId, purchasedFrameIds, equippedAvatarFrame, onBuyFrame, onEquipFrame, ownedBackgrounds, onBuyBackground }) {
  const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic', 'consumables', 'cosmetics'];
  const RARITY_LEVEL_REQ = { common: 1, rare: 10, epic: 20, legendary: 1, mythic: 1 };
  const [activeRarity, setActiveRarity] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all');

  const isConsumables = activeRarity === 'consumables';
  const isCosmetics = activeRarity === 'cosmetics';
  const activeItems = (isConsumables || isCosmetics) ? [] : SHOP_ITEMS.filter((i) => i.rarity === activeRarity);
  const filteredItems = slotFilter === 'all' ? activeItems : activeItems.filter(i => i.slot === slotFilter);
  const rarity = RARITY_TIERS[activeRarity];
  const ownedCount = activeItems.filter((i) => purchasedItemIds.includes(i.id)).length;
  const rarityLevelReq = RARITY_LEVEL_REQ[activeRarity] || 1;
  const rarityLocked = level < rarityLevelReq;

  // A class-restricted item becomes "orphaned" if the player locks a different class after buying it.
  function isClassItemOrphaned(item) {
    return item.requirement?.type === 'class' && lockedClassId && lockedClassId !== item.requirement.id;
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={styles.shopBalanceWrap}>
        <Gem size={18} color="#5b9bf0" />
        <span style={styles.shopBalanceValue}>{currencyBalance}</span>
        <span style={styles.shopBalanceLabel}>кристаллов</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rarityOrder.map((rarityKey) => {
          const rTier = rarityKey === 'consumables' ? { color: '#4ce0c0', label: 'Расходники' } : rarityKey === 'cosmetics' ? { color: '#e05f9c', label: '🖼 Косметика' } : RARITY_TIERS[rarityKey];
          const isActive = activeRarity === rarityKey;
          const count = rarityKey === 'consumables' ? CONSUMABLES.length : rarityKey === 'cosmetics' ? AVATAR_FRAMES.length : SHOP_ITEMS.filter((i) => i.rarity === rarityKey).length;
          const lvlReq = RARITY_LEVEL_REQ[rarityKey] || 1;
          const isLocked = level < lvlReq;
          return (
            <div key={rarityKey}>
              <button
                onClick={() => setActiveRarity(isActive ? null : rarityKey)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '12px 14px', borderRadius: isActive ? '12px 12px 0 0' : 12,
                  border: '1.5px solid ' + (isActive ? rTier.color : '#28282f'),
                  background: isActive ? rTier.color + '1f' : '#1c1c22',
                  color: isActive ? rTier.color : '#9a9aa2',
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <span style={{ ...styles.shopRaritySectionDot, background: isLocked ? '#5a5a62' : rTier.color }} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>{rTier.label}</span>
                {isLocked ? <Lock size={11} style={{ marginLeft: 2 }} /> : <span style={{ fontSize: 11, color: isActive ? rTier.color : '#6a6a72' }}>{count}</span>}
                <ChevronDown size={15} style={{ marginLeft: 'auto', transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isActive && (
                <div style={{
                  border: '1.5px solid ' + rTier.color, borderTop: 'none', borderRadius: '0 0 12px 12px',
                  padding: '14px', animation: 'fadeUp 0.2s ease',
                }}>
                  {isCosmetics ? (
                    <CosmeticsSection purchasedFrameIds={purchasedFrameIds} equippedAvatarFrame={equippedAvatarFrame} onBuyFrame={onBuyFrame} onEquipFrame={onEquipFrame} currencyBalance={currencyBalance} ownedBackgrounds={ownedBackgrounds} onBuyBackground={onBuyBackground} />
                  ) : isConsumables ? (
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {CONSUMABLES.map(c => {
                          const today = dateKey(new Date());
                          const weekAgo = dateKey(new Date(Date.now() - 7 * 86400000));
                          const twoWeeksAgo = dateKey(new Date(Date.now() - 14 * 86400000));
                          const Icon = c.icon;

                          let usedCount = 0;
                          let cooldownLeft = 0;
                          if (c.type === 'shield') {
                            const lastShield = (consumableLog || []).filter(x => x.type === 'shield').sort((a, b) => b.date.localeCompare(a.date))[0];
                            if (lastShield && lastShield.date > twoWeeksAgo) {
                              const days = Math.floor((new Date() - new Date(lastShield.date)) / 86400000);
                              cooldownLeft = Math.max(0, 14 - days);
                            }
                          } else if (c.maxPerWeek) {
                            usedCount = (consumableLog || []).filter(x => x.type === c.type && x.date >= weekAgo).length;
                          }

                          const canBuy = cooldownLeft === 0 && usedCount < (c.maxPerWeek || 999) && currencyBalance >= c.price;

                          return (
                            <div key={c.id} style={{
                              background: '#1a1a22', border: '1.5px solid ' + c.color + '33',
                              borderRadius: 12, padding: '14px',
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                            }}>
                              <div style={{
                                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                background: c.color + '22', border: '1.5px solid ' + c.color + '44',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Icon size={22} color={c.color} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#e0e0e8' }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: '#6a6a72', marginTop: 2, lineHeight: 1.4 }}>{c.description}</div>
                                {c.maxPerWeek && <div style={{ fontSize: 10, color: '#5a5a6a', marginTop: 3 }}>Использовано: {usedCount}/{c.maxPerWeek} на этой неделе</div>}
                                {cooldownLeft > 0 && <div style={{ fontSize: 10, color: '#8a5a2a', marginTop: 3 }}>Кулдаун: {cooldownLeft} дн.</div>}
                                <div style={{ marginTop: 8 }}>
                                  <button
                                    onClick={() => canBuy && onBuyConsumable(c)}
                                    disabled={!canBuy}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 6,
                                      background: canBuy ? c.color + '22' : '#1e1e26',
                                      border: '1px solid ' + (canBuy ? c.color + '55' : '#28282f'),
                                      borderRadius: 8, padding: '6px 14px',
                                      cursor: canBuy ? 'pointer' : 'not-allowed',
                                      color: canBuy ? c.color : '#4a4a52',
                                      fontSize: 12, fontWeight: 700,
                                      opacity: canBuy ? 1 : 0.5,
                                    }}
                                  >
                                    <Gem size={11} color={canBuy ? '#5b9bf0' : '#3a3a42'} />
                                    {c.price} · Купить
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                  <>
                  {rarityLocked && (
                    <div style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 10, padding: '12px 16px', marginBottom: 12, textAlign: 'center' }}>
                      <Lock size={18} color={rarity.color} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: rarity.color }}>Открывается на {rarityLevelReq} уровне</div>
                      <div style={{ fontSize: 11, color: '#6a6a72', marginTop: 4 }}>Текущий уровень: {level}</div>
                    </div>
                  )}

                  <div style={styles.shopRaritySectionHeader}>
                    <span style={{ ...styles.shopRaritySectionTitle, color: rarity.color }}>{rarity.label}</span>
                    <span style={styles.shopRaritySectionCount}>{ownedCount}/{activeItems.length} собрано</span>
                  </div>

                  {/* Slot filter */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: 'Все', icon: '📦' },
                      { key: 'head', label: 'Голова', icon: '🪖' },
                      { key: 'body', label: 'Тело', icon: '🦺' },
                      { key: 'hands', label: 'Руки', icon: '🧤' },
                      { key: 'legs', label: 'Ноги', icon: '👢' },
                      { key: 'accessory', label: 'Аксессуар', icon: '💍' },
                      { key: 'weapon', label: 'Оружие', icon: '⚔️' },
                    ].map(s => (
                      <button key={s.key} onClick={() => setSlotFilter(s.key)} style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: slotFilter === s.key ? rarity.color + '22' : 'none',
                        border: '1px solid ' + (slotFilter === s.key ? rarity.color + '55' : '#2a2a32'),
                        color: slotFilter === s.key ? rarity.color : '#5a5a6a',
                      }}>
                        {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div style={styles.shopGrid}>
        {filteredItems.map((item) => {
          const owned = purchasedItemIds.includes(item.id);
          const available = shopItemAvailability[item.id];
          const isEquipped = equippedShopItems[item.slot] === item.id;
          const canAfford = currencyBalance >= item.price;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              style={{ ...styles.shopCard, borderColor: rarity.color + '66', background: rarity.bg, position: 'relative' }}
            >
              {owned && item.price > 0 && (
                <button
                  onClick={() => onSell(item)}
                  title={`Продать · +${Math.floor(item.price * SHOP_REFUND_RATE)} крист.`}
                  style={{
                    position: 'absolute', top: 6, right: 6, zIndex: 1,
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isClassItemOrphaned(item) ? '#3a1a1a' : 'rgba(10,10,13,0.75)',
                    border: '1px solid ' + (isClassItemOrphaned(item) ? '#7a3a3a' : '#3a3a42'),
                    color: isClassItemOrphaned(item) ? '#e08a8a' : '#8a8a92', cursor: 'pointer', padding: 0,
                  }}
                >
                  <Gem size={11} />
                </button>
              )}
              <div style={{ ...styles.shopCardIconWrap, background: rarity.color + '22' }}>
                {available || owned
                  ? (item.image
                      ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                      : <Icon size={30} color={rarity.color} />)
                  : <Lock size={24} color="#5a5a62" />}
              </div>
              <div style={styles.shopItemName}>{available || owned ? item.name : '???'}</div>

              {item.bonus && (available || owned) && (
                <div style={styles.shopItemBonus}>
                  {renderBonusColored(item.bonus)}
                </div>
              )}

              {!available && !owned && item.requirement && (
                <div style={styles.shopItemLockedHint}>
                  {item.requirement.type === 'mythic'
                    ? '🔒 Открыть: мифическая ачивка'
                    : item.requirement.type === 'achievement'
                    ? '🔒 Открыть: топовый тир ачивки'
                    : item.requirement.type === 'class'
                    ? '🔒 Стань этим классом'
                    : '🔒 Закрыто'}
                </div>
              )}
              {!available && !owned && !item.requirement && rarityLocked && (
                <div style={styles.shopItemLockedHint}>🔒 Уровень {rarityLevelReq}</div>
              )}

              {owned ? (
                <button
                  onClick={() => onEquip(item.slot, isEquipped ? null : item.id)}
                  style={{
                    ...styles.shopActionBtnSmall,
                    background: isEquipped ? rarity.color : 'transparent',
                    color: isEquipped ? '#15151a' : rarity.color,
                    borderColor: rarity.color,
                  }}
                >
                  {isEquipped ? (isClassItemOrphaned(item) ? 'Надето (неактивно)' : 'Надето') : 'Надеть'}
                </button>
              ) : available && item.price === 0 ? (
                <button
                  onClick={() => onPurchase(item)}
                  style={{
                    ...styles.shopActionBtnSmall,
                    background: rarity.color, color: '#15151a',
                    borderColor: rarity.color, cursor: 'pointer',
                  }}
                >
                  Получить
                </button>
              ) : available ? (
                <button
                  onClick={() => onPurchase(item)}
                  disabled={!canAfford}
                  style={{
                    ...styles.shopActionBtnSmall,
                    background: 'transparent', color: canAfford ? rarity.color : '#5a5a62',
                    borderColor: canAfford ? rarity.color : '#3a3a42',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}
                >
                  {item.price} <Gem size={9} style={{ marginLeft: 2 }} />
                </button>
              ) : (
                <div style={{ ...styles.shopActionBtnSmall, color: '#5a5a62', borderColor: '#3a3a42' }}>Закрыто</div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ClassTreeView = React.memo(function ClassTreeView({ currentClass, level, lockedClassId, top3Classes, chosenPathId, unlockedSkillLevels, availableSkillTiers, onLockClass, onChoosePath, onUnlockSkillTier,
  classChoiceMode, comboClassId, comboPathId, unlockedComboSkillLevels, availableComboSkillTiers,
  specPathId, unlockedSpecSkillLevels, availableSpecSkillTiers,
  onChooseCombo, onChoosePure, onUnlockComboSkillTier, onUnlockSpecSkillTier }) {
  const baseClass = lockedClassId
    ? CHARACTER_CLASSES.find(c => c.id === lockedClassId)
    : (currentClass?.combo ? currentClass.classA : currentClass);
  const isCombo = !!currentClass?.combo;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Current class card */}
      <SectionLabel text="Текущий класс" />
      <ClassCard currentClass={currentClass} baseClass={baseClass} isCombo={isCombo} chosenPath={chosenPath} level={level} />

      {/* Lock class at level 10 */}
      {!lockedClassId && level >= 10 && baseClass && (
        <div style={{ marginTop: 12, padding: '12px 14px', background: '#1a1c14', border: '1.5px solid #4a5a1f', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c8e850', marginBottom: 6 }}>⚔️ Ты достиг 10 уровня — выбери основной класс!</div>
          <div style={{ fontSize: 11, color: '#7a8a52', marginBottom: 10 }}>После фиксации класс не изменить. Выбери тот, что отражает твой путь.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(top3Classes || []).map((item) => (
              <button key={item.cls.id} onClick={() => onLockClass(item.cls.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#1e2a14', border: '1.5px solid ' + item.cls.color + '55', borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
              }}>
                <item.cls.icon size={20} color={item.cls.color} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.cls.color }}>{item.cls.name}</div>
                  <div style={{ fontSize: 10, color: '#6a6a72' }}>{item.cls.statGroup}</div>
                </div>
                <div style={{ fontSize: 11, color: '#7a7a82' }}>{Math.round(item.avg)} XP avg</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Choose path */}
      {lockedClassId && !chosenPathId && (
        <div style={{ marginTop: 12 }}>
          <SectionLabel text="Выбери путь развития" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(CLASS_PATHS[lockedClassId] || []).map((path) => (
              <button key={path.id} onClick={() => onChoosePath(path.id)} style={{
                background: '#181828', border: '1.5px solid #3a3a5a', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {path.icon && (
                    <img src={path.icon} alt="" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#d0d0e8' }}>{path.name}</div>
                    <div style={{ fontSize: 11, color: '#6a6a82', marginTop: 3 }}>Фокус: {path.focus || path.description || ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {path.skills.map((s, i) => (
                    <div key={i} style={{ background: '#1e1e28', border: '1px solid #2a2a36', borderRadius: 8, padding: '6px 10px' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a8a9a' }}>
                        Ур.{s.level}: <span style={{ color: '#c0c0d0' }}>{s.name}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#5a5a6a', marginTop: 2, lineHeight: 1.35 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Path skills progress */}
      {lockedClassId && chosenPathId && (() => {
        const path = (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId);
        if (!path) return null;
        return (
          <div style={{ marginTop: 12 }}>
            <SectionLabel text={`Навыки: ${path.name}`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {path.skills.map((skill, i) => {
                const reqLvl = skill.level;
                const unlocked = unlockedSkillLevels.includes(reqLvl);
                const canUnlock = availableSkillTiers.includes(reqLvl);
                return (
                  <div key={i} style={{
                    background: unlocked ? '#1a2a1a' : '#18181e',
                    border: '1px solid ' + (unlocked ? '#3a6a3a' : canUnlock ? '#5a4a1f' : '#28282f'),
                    borderRadius: 10, padding: '10px 12px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    {skill.icon ? (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={skill.icon} alt="" style={{
                          width: 44, height: 44, borderRadius: 8,
                          filter: unlocked ? 'none' : 'grayscale(70%) brightness(0.6)',
                          opacity: unlocked ? 1 : canUnlock ? 0.85 : 0.55,
                        }} />
                        <div style={{
                          position: 'absolute', bottom: -4, right: -4, fontSize: 13,
                          background: '#101014', borderRadius: '50%', width: 18, height: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #28282f',
                        }}>
                          {unlocked ? '✅' : canUnlock ? '🔓' : '🔒'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 20 }}>{unlocked ? '✅' : canUnlock ? '🔓' : '🔒'}</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#7de87d' : canUnlock ? '#e0c878' : '#5a5a62' }}>{skill.name}</div>
                      <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{skill.desc}</div>
                      <div style={{ fontSize: 10, color: unlocked ? '#4a8a4a' : '#4a4a52', marginTop: 4 }}>Требует Ур.{reqLvl}</div>
                    </div>
                    {canUnlock && !unlocked && (
                      <button onClick={() => onUnlockSkillTier(reqLvl)} style={{
                        background: '#2a1a0a', border: '1px solid #6a4a1f', borderRadius: 8,
                        padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#e0a868', flexShrink: 0,
                      }}>
                        Открыть
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Level 20: choose Combo path or Pure specialization (permanent) */}
      {lockedClassId && chosenPathId && level >= 20 && !classChoiceMode && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: '#1a1c14', border: '1.5px solid #4a5a1f', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c8e850', marginBottom: 6 }}>⚔️ Ты достиг 20 уровня — выбери специализацию!</div>
          <div style={{ fontSize: 11, color: '#7a8a52', marginBottom: 10 }}>Комбо-путь — широта (две активности), «Чистый класс» — глубина (одна активность). Выбор постоянный.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.keys(COMBO_CLASS_NAMES)
              .filter(key => key.split('|').includes(lockedClassId))
              .map(key => {
                const path = COMBO_PATHS[key];
                const otherId = key.split('|').find(id => id !== lockedClassId);
                const otherCls = CHARACTER_CLASSES.find(c => c.id === otherId);
                return (
                  <button key={key} onClick={() => onChooseCombo(key, key)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#1e2a14', border: '1.5px solid ' + (path?.color || '#8a5cf6') + '55', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                  }}>
                    {otherCls && <otherCls.icon size={18} color={otherCls.color} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: path?.color || '#d0d0e8' }}>{path?.name}</div>
                      <div style={{ fontSize: 10, color: '#6a6a72' }}>«{path?.pathName}» · комбо с {otherCls?.name}</div>
                      {path?.skills?.[0] && (
                        <div style={{ fontSize: 9.5, color: '#5a5a6a', marginTop: 3 }}>Ур.20: {path.skills[0].name} — {path.skills[0].desc}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            <button onClick={() => onChoosePure(lockedClassId)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#221a0e', border: '1.5px solid #e0a86855', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e0a868' }}>Чистый класс: {SPEC_PATHS[lockedClassId]?.name}</div>
                <div style={{ fontSize: 10, color: '#6a6a72' }}>+10% XP к своей активности — глубокая специализация</div>
                {SPEC_PATHS[lockedClassId]?.skills?.[0] && (
                  <div style={{ fontSize: 9.5, color: '#5a5a6a', marginTop: 3 }}>Ур.20: {SPEC_PATHS[lockedClassId].skills[0].name} — {SPEC_PATHS[lockedClassId].skills[0].desc}</div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Combo path skills (if chosen) */}
      {classChoiceMode === 'combo' && comboClassId && COMBO_PATHS[comboClassId] && (
        <div style={{ marginTop: 12 }}>
          <SectionLabel text={`Комбо-путь: ${COMBO_PATHS[comboClassId].name}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {COMBO_PATHS[comboClassId].skills.length === 0 && (
              <div style={{ fontSize: 11, color: '#6a6a72', padding: '8px 4px' }}>Скиллы комбо-пути скоро появятся.</div>
            )}
            {COMBO_PATHS[comboClassId].skills.map((skill, i) => {
              const reqLvl = skill.level;
              const unlocked = unlockedComboSkillLevels.includes(reqLvl);
              const canUnlock = availableComboSkillTiers.includes(reqLvl);
              return (
                <div key={i} style={{
                  background: unlocked ? '#1a2a1a' : '#18181e',
                  border: '1px solid ' + (unlocked ? '#3a6a3a' : canUnlock ? '#5a4a1f' : '#28282f'),
                  borderRadius: 10, padding: '10px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ fontSize: 20 }}>{unlocked ? '✅' : canUnlock ? '🔓' : '🔒'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#7de87d' : canUnlock ? '#e0c878' : '#5a5a62' }}>{skill.name}</div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{skill.desc}</div>
                    <div style={{ fontSize: 10, color: unlocked ? '#4a8a4a' : '#4a4a52', marginTop: 4 }}>Требует Ур.{reqLvl}</div>
                  </div>
                  {canUnlock && !unlocked && (
                    <button onClick={() => onUnlockComboSkillTier(reqLvl)} style={{
                      background: '#2a1a0a', border: '1px solid #6a4a1f', borderRadius: 8,
                      padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#e0a868', flexShrink: 0,
                    }}>
                      Открыть
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specialization path skills (if chosen) */}
      {classChoiceMode === 'pure' && specPathId && SPEC_PATHS[specPathId] && (
        <div style={{ marginTop: 12 }}>
          <SectionLabel text={`Специализация: ${SPEC_PATHS[specPathId].name}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SPEC_PATHS[specPathId].skills.length === 0 && (
              <div style={{ fontSize: 11, color: '#6a6a72', padding: '8px 4px' }}>Скиллы специализации скоро появятся.</div>
            )}
            {SPEC_PATHS[specPathId].skills.map((skill, i) => {
              const reqLvl = skill.level;
              const unlocked = unlockedSpecSkillLevels.includes(reqLvl);
              const canUnlock = availableSpecSkillTiers.includes(reqLvl);
              return (
                <div key={i} style={{
                  background: unlocked ? '#1a2a1a' : '#18181e',
                  border: '1px solid ' + (unlocked ? '#3a6a3a' : canUnlock ? '#5a4a1f' : '#28282f'),
                  borderRadius: 10, padding: '10px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ fontSize: 20 }}>{unlocked ? '✅' : canUnlock ? '🔓' : '🔒'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#7de87d' : canUnlock ? '#e0c878' : '#5a5a62' }}>{skill.name}</div>
                    <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{skill.desc}</div>
                    <div style={{ fontSize: 10, color: unlocked ? '#4a8a4a' : '#4a4a52', marginTop: 4 }}>Требует Ур.{reqLvl}</div>
                  </div>
                  {canUnlock && !unlocked && (
                    <button onClick={() => onUnlockSpecSkillTier(reqLvl)} style={{
                      background: '#2a1a0a', border: '1px solid #6a4a1f', borderRadius: 8,
                      padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#e0a868', flexShrink: 0,
                    }}>
                      Открыть
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All classes overview */}
      <SectionLabel text="Все классы" style={{ marginTop: 20 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CHARACTER_CLASSES.map(cls => (
          <div key={cls.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: '#1a1a22', border: '1px solid ' + (lockedClassId === cls.id ? cls.color + '55' : '#26262e'),
            borderRadius: 10, opacity: lockedClassId && lockedClassId !== cls.id ? 0.55 : 1,
          }}>
            <cls.icon size={20} color={cls.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: cls.color }}>{cls.name} {lockedClassId === cls.id ? '★ (твой)' : ''}</div>
              <div style={{ fontSize: 10, color: '#6a6a72', marginTop: 1 }}>
                {cls.statGroup} · {cls.activities.map(a => ACTIVITY_TYPES[a]?.label || a).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CharacterView = React.memo(function CharacterView({ statTotals, currentClass, equippedShopItems, purchasedItemIds, onEquip, onSell, earnedTitles, activeTitle, setActiveTitle, titleCooldownDays, levelState, lockedClassId, chosenPathId, achievementsEvaluated, purchasedFrameIds, equippedAvatarFrame, onEquipFrame, avatarEmoji, onSelectAvatarEmoji, shopShields, lastShopShieldUse, activeShield, onUseShopShield, onOpenRecordsWall, ownedBackgrounds, activeBackground, onBuyBackground, onEquipBackground, currencyBalance, polishedItemIds, itemBonusOverrides, onPolishItem, onReforgeItem, getEffectiveBonus }) {
  const [chestOpen, setChestOpen] = useState(false);
  const [openChestSection, setOpenChestSection] = useState(null);

  // Resolve base class (always the locked class, not the combo name)
  const baseClass = lockedClassId ? CHARACTER_CLASSES.find(c => c.id === lockedClassId) : (currentClass?.combo ? currentClass.classA : currentClass);
  const isCombo = !!currentClass?.combo;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <SectionLabel text="Класс персонажа" />
      <ClassCard
        currentClass={currentClass}
        baseClass={baseClass}
        isCombo={isCombo}
        chosenPath={chosenPath}
        level={levelState.level}
      />

      <div style={{ marginTop: 10 }}>
        <EquippedGear
          equippedShopItems={equippedShopItems}
          lockedClassId={lockedClassId}
          classColor={baseClass?.color}
          onSell={onSell}
          onSlotTap={(slotKey) => {
            const sectionId = 'slot_' + slotKey;
            setChestOpen(true);
            setOpenChestSection(sectionId);
            setTimeout(() => {
              document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }}
        />
      </div>

      {/* GEAR CHEST */}
      <div style={{ marginTop: 14, marginBottom: 4 }}>
        <button
          onClick={() => setChestOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#1c1c22', border: '1.5px solid #28282f', borderRadius: 12,
            padding: '12px 16px', cursor: 'pointer', color: '#dcdce2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={16} color="#f0d272" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Сундук экипировки</span>
            <span style={{ fontSize: 11, color: '#6a6a72' }}>
              {purchasedItemIds.length} предметов
            </span>
          </div>
          <ChevronDown size={16} color="#9a9aa2" style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>

      {chestOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0e0e13', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))', position: 'sticky', top: 0, background: '#0e0e13', borderBottom: '1px solid #22222a', zIndex: 2, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={17} color="#f0d272" />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#f0f0f4' }}>Сундук экипировки</span>
            </div>
            <button onClick={() => setChestOpen(false)} style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 10, cursor: 'pointer', padding: 8, display: 'flex' }}>
              <X size={18} color="#9a9aa2" />
            </button>
          </div>
          <div style={{ padding: '16px 14px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', animation: 'fadeUp 0.2s ease' }}>
            {/* Рамка аватара */}
            {purchasedFrameIds && purchasedFrameIds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setOpenChestSection(openChestSection === 'frames' ? null : 'frames')} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: 'none', border: 'none', padding: '4px 0', marginBottom: openChestSection === 'frames' ? 8 : 0,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#e05f9c', textTransform: 'uppercase', letterSpacing: 0.6 }}>🖼 Рамка аватара</div>
                  <span style={{ fontSize: 10, color: '#6a6a72' }}>{purchasedFrameIds.length}</span>
                  <ChevronDown size={13} color="#9a9aa2" style={{ marginLeft: 'auto', transform: openChestSection === 'frames' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {openChestSection === 'frames' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeUp 0.15s ease' }}>
                  {purchasedFrameIds.map(fid => {
                    const frame = AVATAR_FRAMES.find(f => f.id === fid);
                    if (!frame) return null;
                    const isEq = equippedAvatarFrame === fid;
                    const tc = AVATAR_FRAME_RARITY_COLORS[frame.rarity] || AVATAR_FRAME_RARITY_COLORS.common;
                    return (
                      <div key={fid} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: isEq ? tc.color + '18' : '#1e1e26',
                        border: `1px solid ${isEq ? tc.color + '55' : '#28282f'}`,
                        borderRadius: 9, padding: '8px 12px',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#13131a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...frame.style }}>
                          <span style={{ fontSize: 14 }}>⚔️</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isEq ? tc.color : '#dcdce2' }}>{frame.name}</div>
                          <div style={{ fontSize: 10, color: '#5a5a6a' }}>{AVATAR_FRAME_RARITY_COLORS[frame.rarity]?.label || ''}</div>
                        </div>
                        <button onClick={() => onEquipFrame(fid)} style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7,
                          border: `1px solid ${tc.color}`,
                          background: isEq ? tc.color : 'transparent',
                          color: isEq ? '#15151a' : tc.color, cursor: 'pointer',
                        }}>
                          {isEq ? 'Снять' : 'Надеть'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}

            {/* Фоны профиля */}
            {ownedBackgrounds && ownedBackgrounds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setOpenChestSection(openChestSection === 'backgrounds' ? null : 'backgrounds')} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: 'none', border: 'none', padding: '4px 0', marginBottom: openChestSection === 'backgrounds' ? 8 : 0,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#f0d272', textTransform: 'uppercase', letterSpacing: 0.6 }}>🖼️ Фоны профиля</div>
                  <span style={{ fontSize: 10, color: '#6a6a72' }}>{ownedBackgrounds.length}</span>
                  <ChevronDown size={13} color="#9a9aa2" style={{ marginLeft: 'auto', transform: openChestSection === 'backgrounds' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {openChestSection === 'backgrounds' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeUp 0.15s ease' }}>
                  {ownedBackgrounds.map(bgId => {
                    const bg = PROFILE_BACKGROUNDS.find(b => b.id === bgId);
                    if (!bg) return null;
                    const isEq = activeBackground === bgId;
                    return (
                      <div key={bgId} style={{
                        display: 'flex', alignItems: 'center', gap: 10, borderRadius: 9, padding: '8px 12px',
                        background: bg.gradient, border: isEq ? '2px solid #f0d272' : '1px solid #28282f',
                      }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f4' }}>{bg.name}</div></div>
                        <button onClick={() => onEquipBackground(bgId)} style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7,
                          border: '1px solid ' + (isEq ? '#f0d272' : '#5a5a62'),
                          background: isEq ? '#f0d272' : 'transparent',
                          color: isEq ? '#15151a' : '#c0c0ca', cursor: 'pointer',
                        }}>
                          {isEq ? 'Снять' : 'Надеть'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5a62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Все купленные предметы</div>
              {SHOP_SLOTS.map((slot) => {
                const slotItems = ALL_ITEMS().filter((i) => i.slot === slot.key && purchasedItemIds.includes(i.id) && !i.raidLoot);
                if (slotItems.length === 0) return null;
                const sectionId = 'slot_' + slot.key;
                const isOpen = openChestSection === sectionId;
                return (
                  <div key={slot.key} id={sectionId} style={{ marginBottom: 8 }}>
                    <button onClick={() => setOpenChestSection(isOpen ? null : sectionId)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      background: 'none', border: 'none', padding: '4px 0', marginBottom: isOpen ? 6 : 0,
                    }}>
                      <div style={{ fontSize: 10, color: '#8a8a92', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{slot.label}</div>
                      <span style={{ fontSize: 10, color: '#5a5a62' }}>{slotItems.length}</span>
                      <ChevronDown size={13} color="#9a9aa2" style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, animation: 'fadeUp 0.15s ease' }}>
                      {slotItems.map((item) => {
                        const rarity = RARITY_TIERS[item.rarity] || RARITY_TIERS.common;
                        const isEquipped = equippedShopItems[slot.key] === item.id;
                        const Icon = item.icon;
                        const effBonus = getEffectiveBonus ? getEffectiveBonus(item) : item.bonus;
                        const isPolished = (polishedItemIds || []).includes(item.id);
                        const isReforged = !!(itemBonusOverrides || {})[item.id];
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isEquipped ? rarity.color + '18' : '#1e1e26', borderRadius: 9, padding: '8px 12px', border: `1px solid ${isEquipped ? rarity.color + '55' : '#28282f'}` }}>
                            {item.image
                              ? <img src={item.image} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                              : <Icon size={14} color={rarity.color} />}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: isEquipped ? rarity.color : '#dcdce2' }}>
                                {item.name}{isPolished && ' ✨'}{isReforged && ' 🔨'}
                              </div>
                              {(effBonus?.xpBonusPct > 0 || effBonus?.crystalPct > 0) && <div style={{ fontSize: 10.5, color: '#6a6a72' }}>{bonusLabel(effBonus)}</div>}
                            </div>
                            {onPolishItem && !isPolished && (
                              <button onClick={() => onPolishItem(item.id)} title="Полировка: +3% к бонусу (30💎)" style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 7, border: '1px solid #4ce0c0', background: 'transparent', color: '#4ce0c0', cursor: 'pointer' }}>
                                ✨30
                              </button>
                            )}
                            {onReforgeItem && (
                              <button onClick={() => onReforgeItem(item.id)} title="Перековка: случайный другой бонус той же редкости (50💎)" style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 7, border: '1px solid #e0a868', background: 'transparent', color: '#e0a868', cursor: 'pointer' }}>
                                🔨50
                              </button>
                            )}
                            <button onClick={() => onEquip(slot.key, isEquipped ? null : item.id)}
                              style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: `1px solid ${rarity.color}`, background: isEquipped ? rarity.color : 'transparent', color: isEquipped ? '#15151a' : rarity.color, cursor: 'pointer' }}>
                              {isEquipped ? 'Снять' : 'Надеть'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })}
              {purchasedItemIds.filter(id => !ALL_ITEMS().find(i => i.id === id)?.raidLoot).length === 0 && (
                <div style={{ fontSize: 12, color: '#5a5a62', textAlign: 'center', padding: 16 }}>Сундук пуст — зайди в Магазин</div>
              )}

              {/* ⚔️ Рейдовый лут — отдельная секция */}
              {(() => {
                const raidItems = RAID_LOOT_SHOP_ITEMS.filter(i => purchasedItemIds.includes(i.id));
                if (raidItems.length === 0) return null;
                const isOpen = openChestSection === 'raidloot';
                return (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #22222e' }}>
                    <button onClick={() => setOpenChestSection(isOpen ? null : 'raidloot')} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      background: 'none', border: 'none', padding: '4px 0', marginBottom: isOpen ? 8 : 0,
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#e05f9c', textTransform: 'uppercase', letterSpacing: 0.5 }}>⚔️ Трофеи рейдов</div>
                      <span style={{ fontSize: 10, color: '#6a6a72' }}>{raidItems.length}</span>
                      <ChevronDown size={13} color="#9a9aa2" style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeUp 0.15s ease' }}>
                      {raidItems.map(item => {
                        const rarity = RARITY_TIERS[item.rarity] || RARITY_TIERS.rare;
                        const isEquipped = equippedShopItems[item.slot] === item.id;
                        const Icon = item.icon;
                        const slot = SHOP_SLOTS.find(s => s.key === item.slot);
                        return (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: isEquipped ? rarity.color + '18' : '#1a1822',
                            border: `1px solid ${isEquipped ? rarity.color + '66' : rarity.color + '33'}`,
                            borderRadius: 9, padding: '8px 12px',
                          }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: rarity.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {item.image
                                ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Icon size={16} color={rarity.color} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isEquipped ? rarity.color : '#dcdce2' }}>{item.name}</div>
                              <div style={{ fontSize: 10, color: '#6a6a72' }}>
                                {slot?.label}{(item.bonus?.xpBonusPct > 0 || item.bonus?.crystalPct > 0) && ` · ${bonusLabel(item.bonus)}`}
                              </div>
                            </div>
                            <button onClick={() => onEquip(item.slot, isEquipped ? null : item.id)}
                              style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${rarity.color}`, background: isEquipped ? rarity.color : 'transparent', color: isEquipped ? '#15151a' : rarity.color, cursor: 'pointer', flexShrink: 0 }}>
                              {isEquipped ? 'Снять' : 'Надеть'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CONSUMABLES SECTION */}
      {shopShields > 0 && (() => {
        const isShieldActive = activeShield && activeShield.date === dateKey(new Date());
        const cooldownDaysLeft = lastShopShieldUse
          ? Math.max(0, 14 - Math.floor((new Date() - new Date(lastShopShieldUse)) / 86400000))
          : 0;
        const canActivate = !isShieldActive && cooldownDaysLeft === 0;
        return (
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <div style={{ background: '#1c1c22', border: '1.5px solid #28282f', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#4ce0c0', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>🛡️ Расходники</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0f2a1a', border: '1px solid #2a5a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>🛡️</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#dcdce2' }}>Щит стрика</div>
                  <div style={{ fontSize: 10.5, color: '#5a5a6a' }}>
                    {isShieldActive ? '✅ Активен сегодня'
                      : cooldownDaysLeft > 0 ? `⏳ Кулдаун ${cooldownDaysLeft} дн.`
                      : 'Защищает все стрики на 1 день'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4ce0c0', background: '#0f2a1a', border: '1px solid #2a5a3a', borderRadius: 8, padding: '3px 10px' }}>
                    ×{shopShields}
                  </div>
                  <button onClick={onUseShopShield} disabled={!canActivate} style={{
                    padding: '7px 14px', borderRadius: 9, cursor: canActivate ? 'pointer' : 'not-allowed',
                    background: canActivate ? 'linear-gradient(135deg, #0f2a1a, #1a4a2a)' : '#1a1a22',
                    border: `1.5px solid ${canActivate ? '#2a7a4a' : '#2a2a32'}`,
                    fontSize: 12, fontWeight: 800, color: canActivate ? '#4ce0c0' : '#3a3a42',
                  }}>
                    {isShieldActive ? 'Активен' : cooldownDaysLeft > 0 ? `${cooldownDaysLeft} дн.` : 'Активировать'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <SectionLabel text="Баланс прокачки" />
      <StatRadar statTotals={statTotals} />

      <SectionLabel text="Характеристики персонажа" style={{ marginTop: 24 }} />
      <div style={{
        background: activeBackground ? PROFILE_BACKGROUNDS.find(b => b.id === activeBackground)?.gradient : 'transparent',
        borderRadius: 14, padding: activeBackground ? 14 : 0, marginBottom: 4,
      }}>
        <StatBars statTotals={statTotals} />
      </div>
    </div>
  );
});

// Percent-based positions for the 6 equipment icons, laid out over the clean silhouette
// artwork (/public/character/equipment_silhouette.webp, 520x902 — widened canvas with the
// figure centered, so there's real room for big icon squares in the side margins).
// Three columns: left (weapon/accessory), center (body/legs), right (head/hands — head
// sits directly above hands, same column).
const SILHOUETTE_SLOT_BOXES = {
  head:      { left: 72,   top: 7.2,  width: 26,   height: 15.0 },
  body:      { left: 34.4, top: 24.2, width: 31.2, height: 18.0 },
  weapon:    { left: 2,    top: 36.9, width: 26,   height: 15.0 },
  hands:     { left: 72,   top: 36.9, width: 26,   height: 15.0 },
  legs:      { left: 37,   top: 66.2, width: 26,   height: 15.0 },
  accessory: { left: 2,    top: 66.0, width: 26,   height: 15.0 },
};

const EquippedGear = React.memo(function EquippedGear({ equippedShopItems, lockedClassId, classColor, onSell, onSlotTap }) {
  // Determine active/inactive status for each equipped item.
  // Class-restricted items are inactive if the player is locked into a different class.
  function isItemActive(item) {
    if (!item) return false;
    if (item.requirement?.type === 'class' && lockedClassId && lockedClassId !== item.requirement.id) {
      return false;
    }
    return true;
  }

  const equippedItems = SHOP_SLOTS
    .map((slot) => ({ slot, item: equippedShopItems[slot.key] ? ALL_ITEMS().find((i) => i.id === equippedShopItems[slot.key]) : null }))
    .filter((entry) => entry.item);

  const activeEquippedItems = equippedItems.filter(({ item }) => isItemActive(item));
  const allSlotsActive = activeEquippedItems.length === SHOP_SLOTS.length;
  const hasInactiveItem = equippedItems.some(({ item }) => !isItemActive(item));

  // Sum up XP bonuses granted by all ACTIVE equipped items, grouped by activity ('all' kept separate)
  const bonusByActivity = {};
  let equippedCrystalPct = 0;
  activeEquippedItems.forEach(({ item }) => {
    if (!item.bonus) return;
    if (item.bonus.crystalPct) { equippedCrystalPct += item.bonus.crystalPct; return; }
    if (!item.bonus.xpBonusPct) return;
    const acts = item.bonus.activities || (item.bonus.activity ? [item.bonus.activity] : []);
    acts.forEach((key) => {
      bonusByActivity[key] = (bonusByActivity[key] || 0) + item.bonus.xpBonusPct;
    });
  });
  const bonusEntries = Object.entries(bonusByActivity);

  // Raid-loot items carry flavor `stats` (Сила, Выносливость, etc.) that aren't shown
  // anywhere else in the UI yet — surface them here as informational combat stats.
  const statTotalsFromGear = {};
  activeEquippedItems.forEach(({ item }) => {
    if (!item.stats) return;
    Object.entries(item.stats).forEach(([stat, val]) => {
      statTotalsFromGear[stat] = (statTotalsFromGear[stat] || 0) + val;
    });
  });
  const statEntries = Object.entries(statTotalsFromGear);

  function renderSlotSquare(slot) {
    const box = SILHOUETTE_SLOT_BOXES[slot.key];
    const item = equippedShopItems[slot.key] ? ALL_ITEMS().find((i) => i.id === equippedShopItems[slot.key]) : null;
    const rarity = item ? RARITY_TIERS[item.rarity] : null;
    const active = isItemActive(item);
    const displayOpacity = item && !active ? 0.45 : 1;
    return (
      <React.Fragment key={slot.key}>
        <button
          onClick={() => onSlotTap && onSlotTap(slot.key)}
          title={slot.label}
          style={{
            position: 'absolute',
            left: box.left + '%', top: box.top + '%', width: box.width + '%', height: box.height + '%',
            borderRadius: '14%', border: '2px solid ' + (rarity ? rarity.color + '99' : '#3a3a42'),
            background: rarity ? rarity.color + '26' : 'rgba(20,20,26,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, cursor: 'pointer', opacity: displayOpacity, overflow: 'hidden',
          }}
        >
          {item
            ? (item.image
                ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <item.icon size={34} color={rarity.color} />)
            : <Plus size={25} color="#5a5a62" />}
          {item && !active && (
            <div style={{
              position: 'absolute', top: 4, right: 4,
              background: '#3a1a1a', border: '1px solid #7a3a3a', borderRadius: 6,
              padding: '1px 5px', fontSize: 9, color: '#e08a8a', fontWeight: 700,
            }}>
              !
            </div>
          )}
          {item && item.price > 0 && onSell && (
            <div
              onClick={(e) => { e.stopPropagation(); onSell(item); }}
              title={`Продать · +${Math.floor(item.price * SHOP_REFUND_RATE)} крист.`}
              style={{
                position: 'absolute', top: 4, left: 4,
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,10,13,0.8)', border: '1px solid #3a3a42', color: '#8a8a92',
              }}
            >
              <Gem size={12} />
            </div>
          )}
        </button>
        {item && (
          <div
            onClick={() => onSlotTap && onSlotTap(slot.key)}
            style={{
              position: 'absolute',
              left: (box.left - 3) + '%', top: (box.top + box.height + 1) + '%', width: (box.width + 6) + '%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              cursor: 'pointer', opacity: displayOpacity, pointerEvents: 'auto',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 700, color: active ? '#dcdce2' : '#8a8a92', textAlign: 'center',
              lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item.name}
            </span>
            {item.bonus && (item.bonus.xpBonusPct || item.bonus.crystalPct) && (
              <span style={{ fontSize: 8.5, lineHeight: 1.1, textAlign: 'center' }}>
                {renderBonusColored(item.bonus)}
              </span>
            )}
          </div>
        )}
      </React.Fragment>
    );
  }

  return (
    <div style={{
      ...styles.equippedGearWrap,
      background: classColor
        ? `linear-gradient(160deg, ${classColor}26, ${classColor}0d 55%, #1c1c22 100%)`
        : styles.equippedGearWrap.background,
      ...(classColor ? { borderColor: classColor + '44' } : {}),
    }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: `${(903 / 520) * 100}%` }}>
        <img
          src="/character/equipment_silhouette.webp"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
        {SHOP_SLOTS.map(renderSlotSquare)}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10.5, color: '#5a5a62', marginTop: 6 }}>
        Нажми на слот, чтобы выбрать предмет
      </div>

      {(bonusEntries.length > 0 || equippedCrystalPct > 0 || statEntries.length > 0) ? (
        <div style={{ ...styles.equippedBonusSummary, background: '#15151a', border: '1px solid #24242c', borderRadius: 12, padding: 14, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={styles.equippedBonusSummaryTitle}>Суммарный бонус от экипировки</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: allSlotsActive ? '#7de87d' : '#7a7a82' }}>
              {activeEquippedItems.length}/{SHOP_SLOTS.length} слотов
            </span>
          </div>
          <div style={styles.equippedBonusList}>
            {bonusEntries.map(([activity, pct]) => {
              const at = ACTIVITY_TYPES[activity];
              const color = activity === 'all' ? '#f0d272' : (at?.color || '#dcdce2');
              return (
                <div key={activity} style={styles.equippedBonusRow}>
                  <span style={styles.equippedBonusActivity}>
                    {activity === 'all' ? 'Все активности' : (at?.label || activity)}
                  </span>
                  <span style={{ ...styles.equippedBonusValue, color }}>+{pct}% XP</span>
                </div>
              );
            })}
            {equippedCrystalPct > 0 && (
              <div style={styles.equippedBonusRow}>
                <span style={styles.equippedBonusActivity}>💎 Кристаллы</span>
                <span style={{ ...styles.equippedBonusValue, color: '#4ce0c0' }}>+{equippedCrystalPct}%</span>
              </div>
            )}
            {allSlotsActive && (
              <div style={{ ...styles.equippedBonusRow, background: '#1f2a1a', borderRadius: 8, marginTop: 4 }}>
                <span style={{ ...styles.equippedBonusActivity, color: '#7de87d' }}>
                  🔥 Полный комплект — все слоты
                </span>
                <span style={{ ...styles.equippedBonusValue, color: '#7de87d' }}>+15% XP</span>
              </div>
            )}
          </div>

          {statEntries.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #24242c' }}>
              <div style={{ ...styles.equippedBonusSummaryTitle, marginBottom: 8 }}>Характеристики с трофеев рейдов</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {statEntries.map(([stat, val]) => (
                  <div key={stat} style={{
                    display: 'flex', alignItems: 'center', gap: 5, background: '#1c1c22',
                    border: '1px solid #28282f', borderRadius: 7, padding: '5px 9px',
                  }}>
                    <span style={{ fontSize: 11, color: '#9a9aa2', fontWeight: 600 }}>{stat}</span>
                    <span style={{ fontSize: 11, color: '#e0a868', fontWeight: 800 }}>+{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.equippedEmptyHint}>Зайди в «Магазин», чтобы купить и надеть снаряжение</div>
      )}
      {!allSlotsActive && activeEquippedItems.length > 0 && (
        <div style={{ fontSize: 11, color: '#5a5a62', textAlign: 'center', marginTop: 8 }}>
          Заполни все 6 слотов активной экипировкой → +15% XP ко всему ({SHOP_SLOTS.length - activeEquippedItems.length} осталось)
        </div>
      )}
      {hasInactiveItem && (
        <div style={{ fontSize: 11, color: '#e08a8a', textAlign: 'center', marginTop: 6 }}>
          Класс-предмет не подходит твоему залоченному классу — можешь продать его в магазине
        </div>
      )}
    </div>
  );
});

const ClassCard = React.memo(function ClassCard({ currentClass, baseClass, isCombo, chosenPath, level }) {
  if (!currentClass) {
    return (
      <div style={styles.classCardWrap}>
        <div style={styles.classCardEmpty}>Класс ещё не определён — начни прокачивать характеристики</div>
      </div>
    );
  }

  const BaseIcon = baseClass?.icon || currentClass.icon;
  const baseColor = baseClass?.color || currentClass.color;
  const comboName = isCombo ? currentClass.name : null;
  const comboColor = isCombo ? currentClass.secondaryColor : null;
  const ComboSecondaryIcon = isCombo ? currentClass.secondaryIcon : null;

  return (
    <div style={{
      ...styles.classCardWrap,
      flexDirection: 'column',
      alignItems: 'stretch',
      borderColor: baseColor,
      background: `linear-gradient(135deg, ${baseColor}3a 0%, ${baseColor}12 60%, #1c1c22 100%)`,
      boxShadow: `0 0 24px ${baseColor}40, inset 0 0 30px ${baseColor}14`,
      padding: '18px 16px',
      overflow: 'hidden',
    }}>
      {/* BASE CLASS — big, dominant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: (isCombo || chosenPath) ? 14 : 0 }}>
        <div style={{
          ...styles.classCardIconWrap,
          width: 58, height: 58,
          background: `radial-gradient(circle, ${baseColor}55 0%, ${baseColor}22 70%)`,
          boxShadow: `0 0 20px ${baseColor}99`,
          overflow: 'hidden',
        }}>
          {(baseClass?.portrait || currentClass.portrait)
            ? <img src={baseClass?.portrait || currentClass.portrait} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <BaseIcon size={34} color={baseColor} style={{ filter: `drop-shadow(0 0 8px ${baseColor})` }} />}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: baseColor + 'aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
            Базовый класс
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: baseColor, lineHeight: 1.1, textShadow: `0 0 14px ${baseColor}66` }}>
            {baseClass?.name || currentClass.name}
          </div>
          <div style={{ fontSize: 11, color: '#7a7a82', marginTop: 3 }}>
            {baseClass?.statGroup || currentClass.statGroup} · +10% XP
          </div>
        </div>
      </div>

      {/* SUBCLASS (combo) — shown from lvl 20 */}
      {isCombo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: chosenPath ? 12 : 0,
          padding: '10px 12px', borderRadius: 10,
          background: comboColor + '14', border: `1px solid ${comboColor}44`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle, ${comboColor}55 0%, ${comboColor}22 70%)`,
            boxShadow: `0 0 10px ${comboColor}66`,
          }}>
            <ComboSecondaryIcon size={17} color={comboColor} style={{ filter: `drop-shadow(0 0 4px ${comboColor})` }} />
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: comboColor + 'aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Подкласс
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: comboColor, lineHeight: 1.1 }}>{comboName}</div>
            <div style={{ fontSize: 10, color: '#7a7a82', marginTop: 1 }}>
              {currentClass.classA.name} + {currentClass.classB.name} · +8% XP обеим группам
            </div>
          </div>
        </div>
      )}

      {/* PATH */}
      {chosenPath && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: chosenPath.color + '14', border: `1px solid ${chosenPath.color}44`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: chosenPath.color + '22',
          }}>
            <Footprints size={16} color={chosenPath.color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: chosenPath.color + 'aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Путь
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: chosenPath.color, lineHeight: 1.1, wordBreak: 'break-word' }}>{chosenPath.name}</div>
            <div style={{ fontSize: 10, color: '#7a7a82', marginTop: 1, wordBreak: 'break-word' }}>{chosenPath.focus}</div>
          </div>
        </div>
      )}
    </div>
  );
});

// ---------- Бестиарий (Партия D) ----------
const SellConfirmModal = React.memo(function SellConfirmModal({ item, refund, onConfirm, onCancel }) {
  const rarity = RARITY_TIERS[item.rarity] || RARITY_TIERS.common;
  const Icon = item.icon;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        background: '#18181f', border: `2px solid ${rarity.color}66`, borderRadius: 16,
        padding: '20px 20px 16px', maxWidth: 300, width: '100%', textAlign: 'center', animation: 'fadeUp 0.2s ease',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: rarity.color + '22', margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {item.image
            ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon size={26} color={rarity.color} />}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f4', marginBottom: 4 }}>{item.name}</div>
        <div style={{ fontSize: 12.5, color: '#8a8a92', marginBottom: 18 }}>
          Продать за <span style={{ color: '#f0d272', fontWeight: 700 }}>+{refund}</span> <Gem size={11} style={{ verticalAlign: -1 }} />?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent', border: '1px solid #3a3a42', color: '#a0a0a8',
            borderRadius: 9, padding: '9px 0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
          }}>
            Отмена
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, background: '#e08a8a', border: '1px solid #e08a8a', color: '#15151a',
            borderRadius: 9, padding: '9px 0', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
          }}>
            Продать
          </button>
        </div>
      </div>
    </div>
  );
});

const BestiaryEncounterModal = React.memo(function BestiaryEncounterModal({ creature, onClose }) {
  const rc = BESTIARY_RARITY_COLORS[creature.rarity] || '#8a8a92';
  const rarityLabel = { common: 'Обычное', uncommon: 'Необычное', rare: 'Редкое', legendary: 'Легендарное' }[creature.rarity] || '';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, #182212, #0f150c)', border: `2px solid ${rc}`, borderRadius: 18,
        padding: '28px 24px', maxWidth: 360, width: '100%', textAlign: 'center', animation: 'fadeUp 0.3s ease',
        boxShadow: `0 0 40px ${rc}33`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: rc, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{rarityLabel} существо</div>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{creature.emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f4', marginBottom: 10 }}>{creature.name}</div>
        <div style={{ fontSize: 12.5, color: '#a0a0a8', lineHeight: 1.5, marginBottom: 20 }}>{creature.flavor}</div>
        <button onClick={onClose} style={{
          background: '#1a2a1a', border: `1.5px solid ${rc}`, color: rc,
          borderRadius: 10, padding: '10px 24px', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%',
        }}>
          Ок
        </button>
      </div>
    </div>
  );
});

const BESTIARY_CATEGORY_LABELS = {
  running: '🏃 Бег', strength: '💪 Силовые', wrestling: '🥊 Борьба', walking: '👟 Шаги',
  nutrition: '🥗 Питание', sleep: '😴 Сон', reading: '📖 Чтение', calories: '🔥 Калории',
};

const BestiaryView = React.memo(function BestiaryView({ owned }) {
  const [filter, setFilter] = useState('all');
  const ownedSet = new Set(owned);
  const total = BESTIARY_CATALOG.length;
  const ownedCount = owned.length;
  const categories = ['all', ...Object.keys(BESTIARY_CATEGORY_LABELS)];
  const filtered = filter === 'all' ? BESTIARY_CATALOG : BESTIARY_CATALOG.filter(c => c.category === filter);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <SectionLabel text="Бестиарий" />
      <div style={{ background: '#1c1c22', border: '1px solid #28282f', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: '#8a8a92' }}>Собрано существ</span>
          <span style={{ fontWeight: 800, color: '#f0d272' }}>{ownedCount}/{total}</span>
        </div>
        <div style={{ height: 8, background: '#0e0e13', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(ownedCount / total) * 100}%`, background: '#f0d272', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {categories.map(cat => (
          <div
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1.5px solid ' + (filter === cat ? '#e0a868' : '#2a2a34'),
              background: filter === cat ? '#3a2f1422' : '#17171d',
              color: filter === cat ? '#f0d272' : '#8a8a92',
            }}
          >
            {cat === 'all' ? 'Все' : BESTIARY_CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {filtered.map(creature => {
          const isOwned = ownedSet.has(creature.id);
          const rc = BESTIARY_RARITY_COLORS[creature.rarity] || '#8a8a92';
          return (
            <div key={creature.id} style={{
              background: isOwned ? '#1a1a22' : '#151519',
              border: '1px solid ' + (isOwned ? rc + '55' : '#22222a'),
              borderRadius: 10, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, marginBottom: 4, filter: isOwned ? 'none' : 'grayscale(1)', opacity: isOwned ? 1 : 0.35 }}>
                {isOwned ? creature.emoji : '❓'}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: isOwned ? '#d0d0da' : '#4a4a52', lineHeight: 1.2 }}>
                {isOwned ? creature.name : '???'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});


const NewRecordModal = React.memo(function NewRecordModal({ record, onClose }) {
  const { label, icon, unit, prevValue, newValue, diff } = record;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, #2a220e, #17140a)', border: '2px solid #e0a868', borderRadius: 18,
        padding: '28px 24px', maxWidth: 360, width: '100%', textAlign: 'center', animation: 'fadeUp 0.3s ease',
        boxShadow: '0 0 40px rgba(224,168,104,0.25)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f0d272', marginBottom: 4 }}>НОВЫЙ РЕКОРД!</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e0c8a0', marginBottom: 16 }}>{icon} {label}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
          {newValue.toLocaleString('ru-RU')}{unit ? ' ' + unit : ''}
        </div>
        <div style={{ fontSize: 11.5, color: '#a08858' }}>
          Было: {prevValue.toLocaleString('ru-RU')}{unit ? ' ' + unit : ''} · <span style={{ color: '#7de87d', fontWeight: 700 }}>+{diff.toLocaleString('ru-RU')}</span>
        </div>
        <button onClick={onClose} style={{
          marginTop: 20, background: '#3a2f14', border: '1.5px solid #e0a868', color: '#f0d272',
          borderRadius: 10, padding: '10px 24px', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%',
        }}>
          Ок
        </button>
      </div>
    </div>
  );
});

const RecordsWallView = React.memo(function RecordsWallView({ categories, records, onClose }) {
  const groups = {};
  categories.forEach(cat => {
    if (!groups[cat.group]) groups[cat.group] = [];
    groups[cat.group].push(cat);
  });
  const today = new Date();
  function isRecent(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diffDays = Math.floor((today - d) / 86400000);
    return diffDays >= 0 && diffDays <= 7;
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#13131a', width: '100%', maxWidth: 480, margin: '20px auto', borderRadius: 16, padding: '18px 18px 24px', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f0d272' }}>🏆 Стена подвигов</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 20 }}>✕</button>
        </div>
        {Object.entries(groups).map(([groupName, cats]) => (
          <div key={groupName} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#6a6a72', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{groupName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {cats.map(cat => {
                const rec = records[cat.id];
                const recent = rec && isRecent(rec.date);
                return (
                  <div key={cat.id} style={{
                    background: recent ? '#2a2410' : '#1a1a22',
                    border: '1px solid ' + (recent ? '#e0a868' : '#26262f'),
                    borderRadius: 10, padding: '10px 12px',
                    boxShadow: recent ? '0 0 12px rgba(224,168,104,0.25)' : 'none',
                  }}>
                    <div style={{ fontSize: 10, color: recent ? '#e0c8a0' : '#6a6a72' }}>{cat.icon} {cat.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: recent ? '#f0d272' : '#d0d0da', marginTop: 3 }}>
                      {rec ? rec.value.toLocaleString('ru-RU') : '—'}{rec && cat.unit ? ' ' + cat.unit : ''}
                    </div>
                    {rec && <div style={{ fontSize: 9, color: '#5a5a62', marginTop: 2 }}>{rec.date}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const MailModal = React.memo(function MailModal({ messages, onClose, onMarkRead, onMarkAllRead, onDeleteMessages, onSendReply, playerNickname }) {
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const filters = [
    { key: 'all', label: 'Все', icon: '📬' },
    { key: 'players', label: 'Сообщения', icon: '💬' },
    { key: 'system', label: 'Внутренний голос', icon: '🔮' },
    { key: 'raid_log', label: 'Боевой лог', icon: '⚔️' },
  ];
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return messages;
    if (activeFilter === 'players') return messages.filter(m => !m.system_type);
    if (activeFilter === 'system') return messages.filter(m => m.system_type && m.system_type !== 'raid_hit');
    if (activeFilter === 'raid_log') return messages.filter(m => m.system_type === 'raid_hit');
    return messages;
  }, [messages, activeFilter]);
  function toggleSelect(id) { setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function handleDeleteSelected() { if (selectedIds.size === 0) return; onDeleteMessages([...selectedIds]); setSelectedIds(new Set()); setSelectionMode(false); }
  function handleSendReply(toNickname) { if (!replyText.trim()) return; onSendReply(toNickname, replyText.trim()); setReplyText(''); setShowReplyBox(false); }
  function openMessage(msg) { setSelectedMsg(msg); if (!msg.read) onMarkRead(msg.id); }
  const isSystem = (msg) => msg.system_type != null;
  const senderName = (msg) => isSystem(msg) ? 'Внутренний голос' : (msg.from_display_name || msg.from_nickname || '???');
  const typeIcon = (msg) => { if (!msg.system_type) return '👤'; const icons = { nudge: '👊', achievement: '🏆', raid: '🏰', raid_hit: '⚔️', streak_warning: '🔥', level_up: '⚡', spirit_challenge: '🧿', record: '🏆', bestiary: '🦊', event: '📜' }; return icons[msg.system_type] || '🔮'; };
  const typeBorderColor = (msg) => { if (!msg.system_type) return '#3a5a3a'; const colors = { nudge: '#8a5cf6', achievement: '#f0d272', raid: '#e8633c', raid_hit: '#e8633c', streak_warning: '#e05f4a', level_up: '#4ce0c0', spirit_challenge: '#4f7cff', record: '#e0a868', bestiary: '#4caf6d', event: '#9a6acd' }; return colors[msg.system_type] || '#4f7cff'; };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111118', width: '100%', maxWidth: 460, margin: '0 auto', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #25252c', position: 'sticky', top: 0, background: '#111118', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} color="#4f7cff" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f4' }}>Почта</span>
            {messages.filter(m => !m.read).length > 0 && <span style={{ fontSize: 9, color: '#e05f4a', fontWeight: 700, background: '#e05f4a22', borderRadius: 6, padding: '2px 6px' }}>{messages.filter(m => !m.read).length}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {selectionMode ? (<>
              <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} style={{ fontSize: 10, color: selectedIds.size > 0 ? '#e05f4a' : '#3a3a42', background: selectedIds.size > 0 ? '#e05f4a18' : 'none', border: `1px solid ${selectedIds.size > 0 ? '#e05f4a44' : '#2a2a32'}`, borderRadius: 7, padding: '4px 10px', cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed', fontWeight: 700 }}>🗑 ({selectedIds.size})</button>
              <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} style={{ fontSize: 10, color: '#6a6a72', background: 'none', border: '1px solid #2a2a32', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>Отмена</button>
            </>) : (<>
              {messages.some(m => !m.read) && <button onClick={onMarkAllRead} style={{ fontSize: 10, color: '#4f7cff', background: 'none', border: '1px solid #4f7cff33', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>✓ Прочитано</button>}
              {messages.length > 0 && <button onClick={() => setSelectionMode(true)} style={{ fontSize: 10, color: '#6a6a72', background: 'none', border: '1px solid #2a2a32', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>Выбрать</button>}
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#6a6a72" /></button>
            </>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e26', padding: '0 12px' }}>
          {filters.map(f => {
            const count = f.key === 'all' ? messages.length : f.key === 'players' ? messages.filter(m => !m.system_type).length : f.key === 'system' ? messages.filter(m => m.system_type && m.system_type !== 'raid_hit').length : messages.filter(m => m.system_type === 'raid_hit').length;
            return (<button key={f.key} onClick={() => setActiveFilter(f.key)} style={{ flex: 1, padding: '10px 4px', cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeFilter === f.key ? '2px solid #4f7cff' : '2px solid transparent', color: activeFilter === f.key ? '#d0d0da' : '#4a4a58', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{f.icon} {f.label}{count > 0 && <span style={{ fontSize: 9, opacity: 0.6 }}> {count}</span>}</button>);
          })}
        </div>
        <div style={{ padding: '8px 12px' }}>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#4a4a58', fontSize: 12 }}>{activeFilter === 'raid_log' ? '⚔️ Нет записей' : activeFilter === 'system' ? '🔮 Тишина внутри...' : 'Нет сообщений'}</div>}
          {filtered.map(msg => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 5 }}>
              {selectionMode && <button onClick={() => toggleSelect(msg.id)} style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6, cursor: 'pointer', background: selectedIds.has(msg.id) ? '#e05f4a22' : '#1a1a22', border: `1.5px solid ${selectedIds.has(msg.id) ? '#e05f4a' : '#2a2a32'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, fontSize: 12, color: selectedIds.has(msg.id) ? '#e05f4a' : '#3a3a42' }}>{selectedIds.has(msg.id) ? '✓' : ''}</button>}
              <button onClick={() => selectionMode ? toggleSelect(msg.id) : openMessage(msg)} style={{ display: 'flex', gap: 10, padding: '10px 12px', flex: 1, background: msg.read ? 'transparent' : '#1a1a2e', border: `1px solid ${msg.read ? '#1e1e26' : typeBorderColor(msg) + '44'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: typeBorderColor(msg) + '18', border: `1.5px solid ${typeBorderColor(msg)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{typeIcon(msg)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}><span style={{ fontSize: 11.5, fontWeight: 700, color: isSystem(msg) ? '#9a8af5' : '#d0d0da' }}>{senderName(msg)}</span><span style={{ fontSize: 9, color: '#4a4a58', flexShrink: 0 }}>{new Date(msg.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span></div>
                  <div style={{ fontSize: 11, color: msg.read ? '#5a5a6a' : '#a0a0b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div>
                </div>
                {!msg.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f7cff', flexShrink: 0, marginTop: 6 }} />}
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedMsg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1010, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setSelectedMsg(null); setShowReplyBox(false); setReplyText(''); }}>
          <div style={{ background: '#18181e', border: `1.5px solid ${typeBorderColor(selectedMsg)}33`, borderRadius: 16, padding: 20, maxWidth: 380, width: '100%', maxHeight: '70vh', overflowY: 'auto', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ fontSize: 22 }}>{typeIcon(selectedMsg)}</span><div><div style={{ fontSize: 14, fontWeight: 800, color: isSystem(selectedMsg) ? '#9a8af5' : '#d0d0da' }}>{senderName(selectedMsg)}</div><div style={{ fontSize: 10, color: '#4a4a58' }}>{new Date(selectedMsg.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div></div></div>
            <div style={{ fontSize: 13, color: '#c0c0cc', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', marginBottom: 16 }}>{selectedMsg.message}</div>
            {!isSystem(selectedMsg) && selectedMsg.from_nickname !== playerNickname && (<>
              {showReplyBox ? (<div style={{ marginBottom: 12 }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Ответить..." rows={3} style={{ width: '100%', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: '8px 12px', color: '#d0d0da', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} autoFocus />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button onClick={() => handleSendReply(selectedMsg.from_nickname)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#1a2a3a', border: '1px solid #3a5a8a', color: '#4f7cff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Отправить</button><button onClick={() => { setShowReplyBox(false); setReplyText(''); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'none', border: '1px solid #2a2a32', color: '#6a6a72', fontSize: 12, cursor: 'pointer' }}>Отмена</button></div>
              </div>) : (<button onClick={() => setShowReplyBox(true)} style={{ width: '100%', padding: '8px', borderRadius: 10, marginBottom: 12, background: '#1a1a2a', border: '1px solid #2a2a3a', color: '#7a8af5', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Mail size={13} color="#7a8af5" /> Ответить</button>)}
            </>)}
            <button onClick={() => { setSelectedMsg(null); setShowReplyBox(false); setReplyText(''); }} style={{ width: '100%', padding: '8px', borderRadius: 10, background: '#1a1a22', border: '1px solid #2a2a32', color: '#6a6a72', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
});

const ArchiveView = React.memo(function ArchiveView() {
  const WISDOM_ENTRIES = [
    { icon: '📖', text: 'Дисциплина — это выбор между тем, чего хочешь сейчас, и тем, чего хочешь больше всего.' },
    { icon: '⚔️', text: 'Воин не ждёт мотивации. Воин точит клинок независимо от настроения.' },
    { icon: '🌊', text: 'Путь силы не прямой. Он течёт как вода — иногда вперёд, иногда в обход, но всегда к цели.' },
    { icon: '🔥', text: 'Пропущенный день не разрушает путь. Разрушает решение не возвращаться.' },
    { icon: '🌱', text: 'Каждый мастер когда-то был тем, кто едва мог закончить один подход.' },
    { icon: '🕯️', text: 'Тело помнит дисциплину дольше, чем разум помнит оправдания.' },
    { icon: '🗻', text: 'Гора не покоряется силой одного дня. Она покоряется постоянством многих.' },
    { icon: '📜', text: 'Знание без действия — просто красивый свиток на полке.' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 32 }}>📚</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#d6558c', marginTop: 6 }}>Архив премудростей</div>
        <div style={{ fontSize: 11.5, color: '#6a6a72', marginTop: 4, lineHeight: 1.5 }}>
          Открыт за книжный марафон — 4 книги за месяц.<br/>Здесь собраны фрагменты мудрости искателей пути.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {WISDOM_ENTRIES.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'linear-gradient(135deg, #1e1420, #16121c)',
            border: '1px solid #3a2a42', borderRadius: 12, padding: '14px 16px',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{w.icon}</span>
            <span style={{ fontSize: 12.5, color: '#c8b8d0', lineHeight: 1.6, fontStyle: 'italic' }}>{w.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const RulesSection = React.memo(function RulesSection({ id, icon, title, color, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: open ? color + '14' : '#1a1a22',
          border: `1.5px solid ${open ? color + '44' : '#26262e'}`,
          borderRadius: open ? '12px 12px 0 0' : 12,
          padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, flex: 1 }}>{title}</span>
        <ChevronDown size={14} color="#5a5a62" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          background: '#14141a', border: `1.5px solid ${color}44`, borderTop: 'none',
          borderRadius: '0 0 12px 12px', padding: '14px 16px',
          fontSize: 12, color: '#b0b0ba', lineHeight: 1.7,
        }}>
          {children}
        </div>
      )}
    </div>
  );
});

const RulesView = React.memo(function RulesView() {
  const [open, setOpen] = useState(null);
  function toggle(id) { setOpen(open === id ? null : id); }
  const [openUpdate, setOpenUpdate] = useState('1.9'); // какая версия апдейта развёрнута

  const P = ({ children }) => <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#aeaeb6', lineHeight: 1.65 }}>{children}</p>;
  const B = ({ children }) => <span style={{ color: '#e0d0e8', fontWeight: 700 }}>{children}</span>;
  const Li = ({ children }) => <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}><span style={{ color: '#5a5a6a', flexShrink: 0 }}>•</span><span style={{ fontSize: 12.5, color: '#aeaeb6', lineHeight: 1.6 }}>{children}</span></div>;
  const Note = ({ children }) => <div style={{ marginTop: 8, padding: '8px 12px', background: '#1a1a22', border: '1px solid #2a2a32', borderRadius: 8, fontSize: 11.5, color: '#7a7a82', lineHeight: 1.55 }}>{children}</div>;
  const UpdateEntry = ({ version, title, subtitle, children }) => {
    const isOpen = openUpdate === version;
    return (
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setOpenUpdate(isOpen ? null : version)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: '#0f2a1a', border: '1px solid #2a5a3a', borderRadius: isOpen ? '10px 10px 0 0' : 10,
            padding: '8px 12px', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4ce0c0' }}>{title}</div>
            <div style={{ fontSize: 10.5, color: '#5a8a72' }}>{subtitle}</div>
          </div>
          <ChevronDown size={14} color="#4ce0c0" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>
        {isOpen && (
          <div style={{ background: '#101410', border: '1px solid #2a5a3a', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 14px 4px', animation: 'fadeUp 0.15s ease' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 28 }}>📜</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#f0d272', marginTop: 4 }}>Правила игры</div>
        <div style={{ fontSize: 11, color: '#6a6a72', marginTop: 4 }}>Нажми на раздел, чтобы раскрыть подробности</div>
      </div>

      <RulesSection id="update" icon="🆕" title="Апдейты" color="#4ce0c0" open={open === 'update'} onToggle={toggle}>
        <UpdateEntry version="1.9" title="Версия 1.9 — Фоны и порядок в сундуке" subtitle="Косметика напоказ, вещи по полочкам">
          <Li><B>🖼️ Фонов профиля стало больше</B> — теперь их 12 вместо 5 (добавили Пустыню, Океан, Вулкан, Древний храм, Северное сияние, Кристальную пещеру, Космос).</Li>
          <Li><B>Фон теперь видно в гильдии</B> — какой фон выбрал у себя, тот и появится на твоей карточке у товарищей по гильдии. Это косметика — пусть видят.</Li>
          <Li><B>Покупка фонов переехала в Магазин</B> — вкладка «Косметика», рядом с рамками аватара. Наделось — в Сундуке экипировки.</Li>
          <Li><B>Сундук экипировки стал компактнее</B> — каждый раздел (по слотам, рамки, фоны, трофеи рейдов) теперь сворачивается отдельно, вместо одного длинного списка.</Li>
          <Li><B>Стена подвигов и Доска почёта переехали</B> — теперь наверху страницы «Ачивки», а не в «Персонаж».</Li>
        </UpdateEntry>

        <UpdateEntry version="1.8" title="Версия 1.8 — Магазин, расходники и второй вызов" subtitle="Больше снаряжения, новые способы им управлять">
          <Li><B>🛍️ Магазин расширен</B> — новые предметы во всех слотах, включая парные бонусы (один предмет усиливает сразу две активности) и предметы, увеличивающие добычу кристаллов.</Li>
          <Li><B>🧪 Новые расходники</B> — Подкова удачи (удваивает шанс встретить существо бестиария на 24ч), Карта странника (то же для дорожных историй), Свиток опыта (+15% XP ко всему на 24ч), Вторая попытка (сбрасывает кулдаун «Испытания духа»).</Li>
          <Li><B>🖼 Фоны профиля</B> — первая партия на выбор, покупаются навсегда и переключаются.</Li>
          <Li><B>✨ Полировка и перековка снаряжения</B> — в Сундуке экипировки теперь можно усилить бонус предмета или перекатать его в другой случайный бонус той же редкости.</Li>
          <Li><B>🔥 Второй слот «Испытания духа»</B> — можно держать сразу 2 активных вызова одновременно (разблокируется за кристаллы).</Li>
          <Li><B>🏆 Ачивки собраны в одном месте</B> — достижения Бестиария, Испытаний духа и Дорожных историй теперь на странице «Ачивки», рядом с остальными.</Li>
          <Li><B>📬 Мелкие удобства</B> — активные баффы от дорожных историй теперь видны прямо на «Прогрессе»; длинные сообщения в почте больше не вылезают за край экрана на телефоне.</Li>
          <Note>Как обычно, если что-то выглядит странно — пишите, разберёмся.</Note>
        </UpdateEntry>

        <UpdateEntry version="1.7" title="Версия 1.7 — Существа, подвиги и почта" subtitle="Мир стал больше: 73 существа, стена рекордов, живая почта">
          <Li><B>🦊 Бестиарий</B> — новая вкладка. При логе любой активности с 25% шансом встречаешь существо (73 штуки, 8 категорий). У каждой категории есть легендарное существо со своим условием — например, Вихревой Дракон появляется только после забега на 10+ км. Прогресс и коллекция — во вкладке «Бестиарий», ачивки — на странице «Ачивки».</Li>
          <Li><B>🏆 Стена подвигов</B> — личные рекорды по 21 категории (макс. дистанция, лучшие серии, суммы и т.д.), никогда не сбрасываются даже если серия прервалась. При новом рекорде — модалка с разницей от прошлого значения. У товарищей по гильдии — кнопкой «Подвиги» в их карточке (только для просмотра).</Li>
          <Li><B>📬 Почта ожила</B> — дорожные истории, новые существа и рекорды теперь сохраняются в почту, а не пропадают после закрытия модалки. Лимит поднят до 100 сообщений.</Li>
          <Li><B>👟 Шаги пересчитаны</B> — XP за шаги был завышен почти в 10 раз, поправлено. Пороги кристаллов (5к/8к/12к+) и магазинные предметы (Сапоги странника, Плащ дороги, Посох пилигрима) приведены в соответствие. Шаги 8000+ теперь дают небольшой бонусный урон в подходящих рейдах.</Li>
          <Li><B>📜 Испытания духа починены</B> — счётные клятвы («N тренировок за M дней») больше не проваливаются от одного пропущенного дня: это просто окно времени, а не ежедневный стрик. Сегодняшний день больше не засчитывается промахом, пока не закончится.</Li>
          <Li><B>🗺️ Дорожные истории</B> — проценты по уровням приведены к цифрам баланса (20% / 18% / 15%).</Li>
          <Note>Сохранение стало надёжнее: выход из аккаунта и закрытие вкладки больше не теряют последние действия.</Note>
        </UpdateEntry>

        <UpdateEntry version="1.5" title="Версия 1.5 — Живой мир" subtitle="Механики здоровья стали умнее">
          <Li><B>Шаги</B> — новая активность. Записывай шаги за день, получай XP. Перебор 20 000 шагов даёт усталость.</Li>
          <Li><B>Усталость теперь давит каждый день</B> — если стеки усталости висят, физическое здоровье тихо убывает. Чем больше стеков — тем быстрее. Лечи восстановлением.</Li>
          <Li><B>2 дня без сна → усталость</B> — если два дня подряд не логировать сон, тело само добавляет стек усталости.</Li>
          <Li><B>6+ тренировок за неделю без восстановления</B> — перетренированность. Добавляет стек усталости. Делай Recovery хотя бы раз в неделю.</Li>
          <Li><B>Зажор предупреждает заранее</B> — под счётчиком зажоров теперь видно, сколько осталось до штрафа −10 XP.</Li>
          <Li><B>Рейды</B> — 1 игрок = 1 рейд одновременно. Рейд стартует только когда инициатор нажимает «Начать». После победы босс исчезает из пула навсегда, появляется в Архиве с историей битвы.</Li>
          <Li><B>Щиты</B> — магазинный щит теперь лежит в «Расходниках» (Персонаж), активируется вручную раз в 14 дней. Рейдовый щит — раз в 7 дней, копится до 3 штук.</Li>
          <Li><B>Активная клятва</B> — карточка «Испытания духа» теперь видна прямо во вкладке «Прогресс» и на карточке товарища в Гильдии.</Li>
          <Li><B>Трофеи рейдов</B> — лут с боссов теперь в отдельной секции «⚔️ Трофеи рейдов» в Сундуке. Каждый предмет даёт +5% XP к основной активности класса.</Li>
          <Note>Если здоровье упало ниже 50% — рост опыта блокируется. Вылечись восстановлением или зельями.</Note>
        </UpdateEntry>
      </RulesSection>

      <RulesSection id="activities" icon="🏃" title="Активности и опыт" color="#e0a868" open={open === 'activities'} onToggle={toggle}>
        <P>Каждый день можно записывать: <B>бег, силовые (зал или парк), борьбу, питание, сон, чтение, шаги и пепел калорий</B>.</P>
        <P>За каждую запись начисляется <B>опыт (XP)</B>, который распределяется по характеристикам и поднимает уровень персонажа.</P>
        <Li><B>Бег</B> — XP растёт с дистанцией: ~6 XP за 1 км, максимум 14 XP за 12+ км.</Li>
        <Li><B>Силовые / борьба</B> — XP зависит от интенсивности: лёгкая / средняя / высокая.</Li>
        <Li><B>Питание</B> — фиксированные 3 XP за отметку «в норме»; бонус за «без сахара».</Li>
        <Li><B>Сон</B> — базовый XP + бонус за строгий режим (отбой до 23:30).</Li>
        <Li><B>Чтение</B> — XP растёт с числом страниц: от 2 XP (до 20 стр.) до 17 XP (300+ стр.).</Li>
        <Li><B>Шаги</B> — универсальная активность без привязки к классу; XP = шаги / 1000 × 3. Перебор 20 000 шагов даёт дебафф усталости.</Li>
        <Li><B>Пепел калорий</B> — даёт кристаллы и считается для рейда с Драконом, но не прокачивает статы.</Li>
        <P>Любую запись можно отменить в «Истории» (только сегодняшние).</P>
      </RulesSection>

      <RulesSection id="streaks" icon="🔥" title="Серии (стрики)" color="#e8633c" open={open === 'streaks'} onToggle={toggle}>
        <P>Серия — число дней подряд с записью одного типа активности. Серии дают бонусный XP и открывают достижения.</P>
        <P>Пропустил день — серия обнуляется. Защититься можно <B>щитом стрика</B>.</P>
        <Li><B>Щит из магазина</B> — покупается за 45 💎 раз в 2 недели. После покупки лежит в «Расходниках» в разделе «Персонаж». Активируется вручную, кулдаун активации — 14 дней. Под XP-баром появляется зелёная полоска.</Li>
        <Li><B>Рейдовый щит</B> — падает за победу в рейде, копится до 3 штук. Активируется из шапки, кулдаун — 7 дней.</Li>
      </RulesSection>

      <RulesSection id="debuffs" icon="⚡" title="Дебаффы и здоровье" color="#e05f4a" open={open === 'debuffs'} onToggle={toggle}>
        <P>Два вида здоровья: <B>физическое</B> (спорт, сон) и <B>ментальное</B> (чтение, питание, стресс). Если любой тип падает ниже 50% — рост XP блокируется до восстановления.</P>
        <Li><B>Стресс</B> — снижает ментальное здоровье, копится стеками.</Li>
        <Li><B>Усталость</B> — снижает физическое здоровье.</Li>
        <Li><B>Зажор</B> — «отравление»; при накоплении даёт штраф ко всем статам.</Li>
        <Li><B>Читмил</B> — безопасен реже раза в 14 дней; чаще — рвёт стрик питания.</Li>
        <Li><B>Апатия</B> — если за день не записано ни одной активности, персонаж автоматически получает штраф к ментальному здоровью.</Li>
        <Li><B>Уныние</B> — дебафф за поражение в рейде: блок новых рейдов на 3 дня + штраф −10% XP на срок рейда.</Li>
        <Li><B>Сломленная клятва</B> — провал «Испытания духа»: −10% XP на 3 дня + кулдаун 3 дня.</Li>
        <P>Дебаффы (стресс/усталость/зажор/читмил) можно снять восстановительными активностями или зельями.</P>
      </RulesSection>

      <RulesSection id="recovery" icon="💚" title="Восстановление" color="#4ce0c0" open={open === 'recovery'} onToggle={toggle}>
        <P>Восстановление возвращает здоровье и снимает стеки стресса/усталости. Каждый тип можно использовать <B>раз в день</B>.</P>
        <Li><B>Короткие</B> — прогулка, растяжка, дыхание, отдых.</Li>
        <Li><B>Длительные</B> — баня/сауна, массаж, медитация; снимают больше стеков за раз.</Li>
        <Li><B>Зелье здоровья / ясности</B> (магазин) — +10% физического или ментального здоровья, максимум 3 каждого в неделю.</Li>
      </RulesSection>

      <RulesSection id="daily" icon="🌅" title="Ежедневный вход и утренний ритуал" color="#c9a8f5" open={open === 'daily'} onToggle={toggle}>
        <P><B>Ежедневный вход</B> — первое открытие приложения в новый день даёт +2 💎. За 7 дней подряд — бонус +20 💎.</P>
        <P><B>Утренний ритуал</B> — до 12:00 выбираешь один ритуал на день (повторный выбор недоступен до следующего утра). Даёт +5% XP на весь день и +1 к характеристике.</P>
        <P><B>Активная клятва</B> — если принято «Испытание духа», компактная карточка с прогрессом показывается прямо во вкладке «Прогресс» над активностями.</P>
      </RulesSection>

      <RulesSection id="classes" icon="⚔️" title="Классы и путь" color="#9c6fe0" open={open === 'classes'} onToggle={toggle}>
        <P>Класс определяется доминирующей активностью: <B>Следопыт</B> (бег), <B>Берсерк</B> (силовые), <B>Мастер битвы</B> (борьба), <B>Монах</B> (питание), <B>Шаман</B> (сон), <B>Архимаг</B> (чтение).</P>
        <P>На <B>10 уровне</B> класс фиксируется, открывается выбор пути с пассивными навыками (тиры на 15, 20, 30 уровнях).</P>
        <P>На <B>20 уровне</B> — постоянный выбор: <B>Комбо-путь</B> (пара с другим классом, широта, скиллы на 20/25/30/35/40) или <B>Специализация</B> (углубление в свой класс, +10% XP и выше). Выбор нельзя изменить.</P>
      </RulesSection>

      <RulesSection id="shop" icon="💎" title="Магазин, экипировка и расходники" color="#5b9bf0" open={open === 'shop'} onToggle={toggle}>
        <P>5 уровней редкости: обычные, редкие (10 ур.), эпические (20 ур.), легендарные и мифические.</P>
        <P>Экипировка даёт бонус к XP определённой активности. <B>Полный комплект из 6 слотов</B> даёт дополнительные +15% XP ко всему.</P>
        <P>Предметы можно продать за 70% цены или <B>подарить товарищу</B> из его карточки в Гильдии.</P>
        <P><B>Трофеи рейдов</B> — лут с боссов отображается в отдельной секции «⚔️ Трофеи рейдов» в Сундуке. Каждый предмет даёт +5% XP к профильной активности класса.</P>
        <Li><B>Щит стрика</B> — 45 💎, раз в 2 недели. Попадает в «Расходники» в разделе «Персонаж», активируется вручную.</Li>
        <Li><B>Зелье здоровья</B> — 25 💎, до 3 в неделю. +10% физического здоровья.</Li>
        <Li><B>Зелье ясности</B> — 25 💎, до 3 в неделю. +10% ментального здоровья.</Li>
      </RulesSection>

      <RulesSection id="raids" icon="🗡️" title="Рейды" color="#e05f9c" open={open === 'raids'} onToggle={toggle}>
        <P>Рейд — совместное испытание на <B>3 игроков</B>. <B>1 игрок = 1 рейд одновременно.</B> Инициатор открывает рейд, все вступают и жмут «Готов», затем инициатор нажимает «Начать рейд».</P>
        <P>После завершения рейд исчезает из пула — каждый босс побеждается <B>один раз</B>. Победы хранятся в Архиве рейдов с эпической историей битвы.</P>
        <Li><B>🐗 Вепрь</B> (редкий, 3 дня) — суммарно 45 км бега на троих.</Li>
        <Li><B>🪨 Стальной Голем</B> (редкий, 10 дней) — суммарно 12 силовых тренировок.</Li>
        <Li><B>🐍 Лунный Орочи</B> (эпический, 7 дней) — каждый закрывает питание + сон + чтение все 7 дней.</Li>
        <Li><B>🐯 Подкрадывающийся Тигр</B> (эпический, 14 дней) — роли: Стальной Кулак (12 силовых), Железный Коготь (12 силовых), Ветер (18 км бега).</Li>
        <Li><B>🐉 Дракон</B> (легендарный, 30 дней) — суммарно 50 000 ккал на троих.</Li>
        <Li><B>🦅 Белый Феникс</B> (мифический, 21 день) — каждый каждый день минимум 3 разные активности. Рейдовый щит защищает от одного пропуска.</Li>
        <P>Победа — сразу при выполнении цели. Поражение при истечении срока: штраф HP по редкости (редкий −20, эпический −35, легендарный −50, мифический −70) + дебафф <B>«Уныние»</B>.</P>
        <P><B>Лут с рейдов</B> — каждый получает предмет под свой класс (попадает в Сундук экипировки) + 🛡️ Рейдовый щит (до 3 штук).</P>
        <Note>Смена никнейма автоматически обновляет имя во всех активных рейдах.</Note>
      </RulesSection>

      <RulesSection id="challenges" icon="🔥" title="Испытания духа" color="#e0a868" open={open === 'challenges'} onToggle={toggle}>
        <P>Принять одно испытание за раз. Нельзя отменить — только выполнить или провалить. Открывается на <B>5 уровне</B>.</P>
        <P>Категории: питание, бег, силовые, сон, чтение, комплексные. Длительность: 7, 14 или 30 дней.</P>
        <Li><B>Ежедневные</B> — выполнять условие каждый день (допуск 0–2 пропуска).</Li>
        <Li><B>Счётные</B> — набрать N тренировок/пробежек за срок; провал наступает только если цель математически недостижима.</Li>
        <P>Успех: кристаллы + временный бафф XP + прогресс достижений. Некоторые дают уникальный титул.</P>
        <P>Провал: дебафф <B>«Сломленная клятва»</B> −10% XP на 3 дня + кулдаун 3 дня.</P>
        <P>Активная клятва отображается на вкладке «Прогресс» под утренним ритуалом.</P>
      </RulesSection>

      <RulesSection id="achievements" icon="🏆" title="Достижения и титулы" color="#f0d272" open={open === 'achievements'} onToggle={toggle}>
        <P>Категории: <B>обычные</B> (по каждой активности), <B>Тройной удар</B> (комбо за день), <B>Баланс</B>, <B>Пента-удар</B> (5 из 6 активностей за день), <B>секретные</B> и <B>мифические</B> (аниме-референсы).</P>
        <P>Каждый разблокированный тир даёт <B>титул</B> — выбирается в «Персонаж». Меняется не чаще раза в 3 дня. Победа в рейде тоже даёт уникальный титул.</P>
      </RulesSection>

      <RulesSection id="guild" icon="🛡️" title="Гильдия" color="#f0d272" open={open === 'guild'} onToggle={toggle}>
        <P>Во вкладке «Гильдия» видны все игроки: уровень, класс, путь, здоровье, активные рейды (с % прогрессом и уроном каждого) и топ достижения.</P>
        <P>Можно поставить «Уважуху» 👍, «Пнуть» 👊 для мотивации, <B>передать кристаллы</B> или <B>подарить предмет</B> из карточки товарища.</P>
        <P>В карточке активного рейда видно кто сколько нанёс урона. Кнопка «📜 Лог» открывает полный боевой лог с нарративными ударами.</P>
      </RulesSection>
    </div>
  );
});

const HistoryView = React.memo(function HistoryView({ logs, passiveLogs, recoveryLogs, morningRitualLog, onUndoLog, onUndoPassive, onUndoRecovery, onUndoMorning }) {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedPassive = [...(passiveLogs || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedRecovery = [...(recoveryLogs || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = dateKey(new Date());
  const now = new Date();
  const isMorning = now.getHours() < 12;
  const todayRitualEntry = (morningRitualLog || []).find(r => r.date === today);
  const todayRitual = todayRitualEntry ? MORNING_RITUALS.find(r => r.id === todayRitualEntry.ritualId) : null;
  // Секция ритуала видна только если: ритуал выполнен сегодня И сейчас до 12:00
  const showRitualSection = !!todayRitual && isMorning;

  function UndoBtn({ onClick }) {
    return (
      <button onClick={onClick} style={{ background: 'none', border: '1px solid #3a2a2a', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: '#8a4a4a', fontWeight: 600, flexShrink: 0, marginLeft: 8 }} title="Отменить запись">
        ✕ Отменить
      </button>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Morning Ritual — visible only today before 12:00 */}
      {showRitualSection && (
        <>
          <SectionLabel text="Утренний ритуал" />
          <div style={{ ...styles.historyRow, display: 'flex', alignItems: 'center' }}>
            <div style={{ ...styles.activityIconWrap, background: '#c9a8f522', color: '#c9a8f5', width: 32, height: 32 }}>
              <span style={{ fontSize: 15 }}>{todayRitual.emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.historyLabel}>{todayRitual.name}</div>
              <div style={styles.historyDate}>+5% XP · +1 {todayRitual.stat}</div>
            </div>
            <UndoBtn onClick={onUndoMorning} />
          </div>
        </>
      )}
      {/* Activities */}
      <SectionLabel text="Активности" style={showRitualSection ? { marginTop: 20 } : undefined} />
      {sorted.length === 0 && <div style={styles.emptyState}>Пока нет записей. Залогируй первую активность на вкладке «Прогресс».</div>}
      {sorted.map((log) => {
        const def = ACTIVITY_TYPES[log.activity];
        if (!def) return null;
        const Icon = def.icon;
        const isToday = log.date === today;
        return (
          <div key={log.id} style={{ ...styles.historyRow, display: 'flex', alignItems: 'center' }}>
            <div style={{ ...styles.activityIconWrap, background: def.color + '22', color: def.color, width: 32, height: 32 }}>
              <Icon size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.historyLabel}>{def.label}</div>
              <div style={styles.historyDate}>
                <Calendar size={11} style={{ marginRight: 4, position: 'relative', top: 1 }} />
                {log.date}
                {log.distance && ` · ${Number(log.distance).toFixed(1)} км`}
                {log.pages && ` · ${log.pages} стр.`}
                {log.kcal && ` · ${Number(log.kcal)} ккал`}
                {log.intensity && ` · ${log.intensity}`}
              </div>
            </div>
            {isToday && <UndoBtn onClick={() => onUndoLog(log.id)} />}
          </div>
        );
      })}

      {/* Debuffs */}
      {sortedPassive.length > 0 && (
        <>
          <SectionLabel text="Дебаффы" style={{ marginTop: 20 }} />
          {sortedPassive.map((p) => {
            const def = PASSIVE_TYPES[p.type];
            if (!def) return null;
            const isToday = p.date === today;
            return (
              <div key={p.id} style={{ ...styles.historyRow, display: 'flex', alignItems: 'center' }}>
                <div style={{ ...styles.activityIconWrap, background: '#e8633c22', color: '#e8633c', width: 32, height: 32 }}>
                  <Zap size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.historyLabel}>{def.label}</div>
                  <div style={styles.historyDate}>{p.date}</div>
                </div>
                {isToday && <UndoBtn onClick={() => onUndoPassive(p.id)} />}
              </div>
            );
          })}
        </>
      )}

      {/* Recovery */}
      {sortedRecovery.length > 0 && (
        <>
          <SectionLabel text="Восстановление" style={{ marginTop: 20 }} />
          {sortedRecovery.map((r) => {
            const def = RECOVERY_TYPES[r.type];
            if (!def) return null;
            const isToday = r.date === today;
            return (
              <div key={r.id} style={{ ...styles.historyRow, display: 'flex', alignItems: 'center' }}>
                <div style={{ ...styles.activityIconWrap, background: '#4ce0c022', color: '#4ce0c0', width: 32, height: 32 }}>
                  <Heart size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.historyLabel}>{def.label}</div>
                  <div style={styles.historyDate}>{r.date}</div>
                </div>
                {isToday && <UndoBtn onClick={() => onUndoRecovery(r.id)} />}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
});

const LogModal = React.memo(function LogModal({ activityKey, value, setValue, strictSleep, setStrictSleep, intensity, setIntensity, nutritionInNorm, setNutritionInNorm, nutritionNoSugar, setNutritionNoSugar, onSubmit, onClose }) {
  const def = ACTIVITY_TYPES[activityKey];
  const Icon = def.icon;
  const field = def.logFields[0];
  const showIntensity = INTENSITY_ACTIVITIES.has(activityKey);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ ...styles.activityIconWrap, background: def.color + '22', color: def.color }}>
            <Icon size={18} />
          </div>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div style={styles.modalTitle}>{def.label}</div>
            <div style={styles.modalSub}>Записать на сегодня</div>
          </div>
          <button onClick={onClose} style={styles.modalClose}><X size={18} color="#8a8a92" /></button>
        </div>

        {field && (
          <div style={{ marginTop: 16 }}>
            <label style={styles.fieldLabel}>{field.label}</label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={styles.input}
              placeholder="0"
              autoFocus
            />
          </div>
        )}

        {activityKey === 'sleep' && (
          <button
            onClick={() => setStrictSleep(!strictSleep)}
            style={styles.strictSleepRow}
          >
            <div
              style={{
                ...styles.strictSleepCheck,
                background: strictSleep ? '#4f7cff22' : 'transparent',
                borderColor: strictSleep ? '#4f7cff' : '#3a3a42',
              }}
            >
              {strictSleep && <Check size={12} color="#4f7cff" />}
            </div>
            <span style={styles.strictSleepLabel}>Лёг до 23:00 и встал до 09:00</span>
          </button>
        )}

        {activityKey === 'nutrition' && (
          <>
            <button onClick={() => setNutritionInNorm(!nutritionInNorm)} style={{ ...styles.strictSleepRow, marginTop: 16 }}>
              <div style={{ ...styles.strictSleepCheck, background: nutritionInNorm ? '#4caf6d22' : 'transparent', borderColor: nutritionInNorm ? '#4caf6d' : '#3a3a42' }}>
                {nutritionInNorm && <Check size={12} color="#4caf6d" />}
              </div>
              <span style={styles.strictSleepLabel}>Попал в норму калорий</span>
            </button>
            <button onClick={() => setNutritionNoSugar(!nutritionNoSugar)} style={styles.strictSleepRow}>
              <div style={{ ...styles.strictSleepCheck, background: nutritionNoSugar ? '#5b9bf022' : 'transparent', borderColor: nutritionNoSugar ? '#5b9bf0' : '#3a3a42' }}>
                {nutritionNoSugar && <Check size={12} color="#5b9bf0" />}
              </div>
              <span style={styles.strictSleepLabel}>Без сахара сегодня</span>
            </button>
          </>
        )}

        {showIntensity && (
          <div style={{ marginTop: 16 }}>
            <label style={styles.fieldLabel}>Интенсивность</label>
            <div style={styles.intensityRow}>
              {Object.entries(INTENSITY_LEVELS).map(([key, cfg]) => {
                const active = intensity === key;
                return (
                  <button
                    key={key}
                    onClick={() => setIntensity(key)}
                    style={{
                      ...styles.intensityBtn,
                      background: active ? cfg.color + '22' : '#15151a',
                      borderColor: active ? cfg.color : '#2c2c34',
                      color: active ? cfg.color : '#8a8a92',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{cfg.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 4 }}>{cfg.xp} XP</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {def.stats.length > 0 && (
          <div style={styles.statsPreview}>
            <TrendingUp size={13} color="#6a6a72" />
            <span style={{ marginLeft: 6 }}>Прокачает: {def.stats.join(', ')}</span>
          </div>
        )}

        {activityKey === 'calories' && Number(value) >= 1000 && (
          <div style={{
            marginTop: 8, padding: '8px 10px', borderRadius: 8,
            background: '#3a1f10', border: '1px solid #e8633c55',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e8b090',
          }}>
            <Zap size={12} color="#e8633c" />
            <span>1000+ ккал за день → добавит 1 стек усталости к физ. здоровью</span>
          </div>
        )}

        {activityKey === 'reading' && Number(value) > 0 && Number(value) < 20 && (
          <div style={{
            marginTop: 8, padding: '8px 10px', borderRadius: 8,
            background: '#3a1f10', border: '1px solid #e8633c55',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e8b090',
          }}>
            <Zap size={12} color="#e8633c" />
            <span>Меньше 20 стр не даёт XP — засчитается только стрик</span>
          </div>
        )}

        {activityKey === 'calories' && !Number(def.stats.length) && (
          <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 6, textAlign: 'center' }}>
            Не даёт XP к статам, но приносит кристаллы
          </div>
        )}

        {activityKey === 'walking' && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Number(value) > 0 && Number(value) < 3000 && (
              <div style={{ padding: '7px 10px', borderRadius: 8, background: '#2a1a1a', border: '1px solid #5a3a3a', fontSize: 11, color: '#e08080' }}>
                Минимум 3 000 шагов для зачёта
              </div>
            )}
            {Number(value) >= 20000 && (
              <div style={{ padding: '7px 10px', borderRadius: 8, background: '#3a1f10', border: '1px solid #e8633c55', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e8b090' }}>
                <Zap size={12} color="#e8633c" />
                <span>20 000+ шагов → дебафф усталости, XP×0.2 за избыток</span>
              </div>
            )}
            <div style={{ fontSize: 10.5, color: '#6a6a72', textAlign: 'center' }}>
              Не влияет на статы · 5к→+5💎 · 8к→+10💎 · 12к+→+15💎
            </div>
          </div>
        )}

        <button style={styles.submitBtn} onClick={onSubmit}>Записать</button>
      </div>
    </div>
  );
});

const Toast = React.memo(function Toast({ text, onUndo }) {
  return (
    <div style={{ ...styles.toast, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Sparkles size={14} color="#f0d272" />
        <span style={{ marginLeft: 8 }}>{text}</span>
      </div>
      {onUndo && (
        <button onClick={onUndo} style={{
          background: '#3a2a10', border: '1px solid #6a4a20', borderRadius: 6,
          padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
          color: '#f0d272', marginLeft: 10, whiteSpace: 'nowrap',
        }}>
          ✕ Отменить
        </button>
      )}
    </div>
  );
});

// ---------- GUILD VIEW ----------

const GuildMemberDetail = React.memo(function GuildMemberDetail({ member, onClose, onNudge, onTransferCrystals, onGiftItem, myPurchasedItemIds, myEquippedShopItems, myCurrencyBalance, isSelf, receivedLikesOverride, onSendMessage }) {
  const clsColor = member.cls?.color || '#8a8a92';
  const [nudged, setNudged] = React.useState(false);
  const [crystalAmount, setCrystalAmount] = React.useState('');
  const [transferring, setTransferring] = React.useState(false);
  const [transferSent, setTransferSent] = React.useState(false);
  const [giftingId, setGiftingId] = React.useState(null);
  const [showRecords, setShowRecords] = React.useState(false);

  function handleNudge() {
    if (nudged) return;
    setNudged(true);
    if (onNudge) onNudge(member.name);
  }

  async function handleTransfer() {
    const num = Math.floor(Number(crystalAmount));
    if (!num || num <= 0 || num > (myCurrencyBalance || 0)) return;
    setTransferring(true);
    const ok = await onTransferCrystals(member.name, num);
    setTransferring(false);
    if (ok) { setTransferSent(true); setCrystalAmount(''); }
  }

  async function handleGift(item) {
    setGiftingId(item.id);
    await onGiftItem(member.name, item);
    setGiftingId(null);
  }

  // Items I own that are sellable/giftable (real purchases, not raid loot / class-locked freebies)
  const giftableItems = (myPurchasedItemIds || [])
    .map(id => ALL_ITEMS().find(i => i.id === id))
    .filter(i => i && i.price > 0 && !i.raidLoot);

  // Resolve path skills
  const skills = (member.lockedClassId && member.cls)
    ? (CLASS_PATHS[member.lockedClassId] || []).find(p => p.id === member.chosenPathId)?.skills || []
    : [];
  const unlockedSkills = skills.filter((_, i) => {
    const requiredLevels = [10, 15, 20, 30, 40];
    return member.unlockedSkillLevels?.includes(requiredLevels[i]);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: member.activeBackground ? PROFILE_BACKGROUNDS.find(b => b.id === member.activeBackground)?.gradient : '#13131a',
        width: '100%', maxWidth: 420, margin: '24px auto', borderRadius: 16, padding: '0 0 20px', animation: 'fadeUp 0.25s ease',
      }}>

        {/* Header — matches header avatar style */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #1e1e26' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Avatar — same style as header */}
            <div style={{
              width: 76, height: 76, borderRadius: 18, flexShrink: 0,
              background: member.avatarEmoji ? clsColor + '33' : (member.titleColor || clsColor) + '28',
              border: `2.5px solid ${clsColor}66`,
              ...getFrameStyle(member.avatarFrameId),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px ${clsColor}33`,
            }}>
              {renderAvatarContent(member.avatarEmoji, member.titleText, member.cls, clsColor, 36, 'square')}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + nickname */}
              <div style={{ fontSize: 18, fontWeight: 900, color: '#f0f0f4', lineHeight: 1.1 }}>
                {(member.characterName || member.name || '').replace(/_/g, ' ')}
              </div>
              {member.characterName && member.characterName !== member.name && (
                <div style={{ fontSize: 10, color: '#4a4a58', marginTop: 1 }}>@{(member.name || '').replace(/_/g, ' ')}</div>
              )}

              {/* Title */}
              <div style={{ fontSize: 12, fontWeight: 700, color: member.titleColor || '#e0a868', marginTop: 4 }}>
                {member.titleText || 'Новичок'}
              </div>

              {/* Level */}
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#e0e0e8', background: '#2a2a3a', border: '1px solid #3a3a4a', borderRadius: 6, padding: '2px 8px' }}>
                  Ур. {member.level}
                </span>
                {/* Class */}
                {member.cls && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: clsColor, background: clsColor + '18', border: `1px solid ${clsColor}44`, borderRadius: 6, padding: '2px 7px' }}>
                    {member.cls.name}
                  </span>
                )}
                {/* Subclass */}
                {member.subclassName && (
                  <span style={{ fontSize: 10, color: '#9a6ae0', background: '#2a1a3a', border: '1px solid #4a2a6a', borderRadius: 6, padding: '2px 7px' }}>
                    ✦ {member.subclassName}
                  </span>
                )}
                {/* Path */}
                {member.pathName && (
                  <span style={{ fontSize: 10, color: '#7a7a82' }}>
                    · {member.pathName}
                  </span>
                )}
              </div>

              {/* Path */}
              {member.pathName && (
                <div style={{ fontSize: 10.5, color: '#6a6a82', marginTop: 4 }}>
                  🗺️ {member.pathName}
                </div>
              )}
            </div>

            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a62', fontSize: 20, padding: '2px 4px', flexShrink: 0 }}>✕</button>
          </div>

          {/* Achievements row */}
          {(member.totalAchievementCount > 0 || member.achievementNames?.length > 0) && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#1a1810', border: '1px solid #3a3010', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: member.achievementNames?.length > 0 ? 8 : 0 }}>
                <Trophy size={13} color="#d4af37" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#d4af37' }}>
                  Достижений: {member.totalAchievementCount || member.achievementNames?.length || 0}
                </span>
              </div>
              {(member.achievementBadges || member.achievementNames) && (member.achievementBadges || member.achievementNames).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(member.achievementBadges || member.achievementNames.map(n => ({ name: n, tier: 'gold' }))).map((ach, i) => {
                    const tc = TIER_COLORS[ach.tier] || TIER_COLORS.gold;
                    const tierEmoji = ach.tier === 'platinum' ? '💎' : ach.tier === 'gold' ? '🥇' : ach.tier === 'silver' ? '🥈' : '🥉';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11 }}>{tierEmoji}</span>
                        <div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: tc.text }}>{ach.name}</span>
                          {ach.achTitle && <span style={{ fontSize: 9.5, color: '#5a5a6a', marginLeft: 5 }}>{ach.achTitle}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Level + Class strip — removed, now in header */}

        {/* HP bars */}
        <div style={{ padding: '0 18px 12px', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6a6a72', marginBottom: 4 }}>
              <span>❤️ Физическое</span><span>{member.physicalHp}%</span>
            </div>
            <div style={{ height: 6, background: '#22222a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${member.physicalHp}%`, background: '#e05f4a', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6a6a72', marginBottom: 4 }}>
              <span>🧠 Ментальное</span><span>{member.mentalHp}%</span>
            </div>
            <div style={{ height: 6, background: '#22222a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${member.mentalHp}%`, background: '#4f7cff', borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{ padding: '0 18px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Статистика</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { icon: '📊', label: 'Всего записей', value: member.totalLogs || 0 },
              { icon: '🏃', label: 'Набегал', value: `${member.totalKm || 0} км` },
              { icon: '📖', label: 'Прочитано', value: `${member.totalPages || 0} стр.` },
              { icon: '🥊', label: 'Тренировок', value: member.totalTrainings || 0 },
              { icon: '🔥', label: 'Сожжено ккал', value: `${(member.totalKcal || 0).toLocaleString('ru-RU')} ккал` },
              { icon: '👟', label: 'Шагов всего', value: (member.totalSteps || 0).toLocaleString('ru-RU') },
              { icon: '👍', label: 'Уважух получено', value: receivedLikesOverride != null ? receivedLikesOverride : (() => { const likes = member.likes || {}; return Object.values(likes).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0); })() },
              { icon: '🛡️', label: 'Экипировка', value: `${member.equippedCount || 0}/6 слотов` },
              { icon: '🦊', label: 'Бестиарий', value: `${member.bestiaryCount || 0}/73` },
              { icon: '⚔️', label: 'Активных рейдов', value: member.raidIds?.length || 0 },
            ].map(s => (
              <div key={s.label} style={{ background: '#1a1a22', border: '1px solid #22222a', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#5a5a6a' }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d0d0da', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Стена подвигов — read-only */}
          <button
            onClick={() => setShowRecords(true)}
            style={{
              width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#241c10', border: '1px solid #4a3410', borderRadius: 8,
              padding: '9px 12px', cursor: 'pointer', color: '#e0a868', fontSize: 12, fontWeight: 700,
            }}
          >
            🏆 Подвиги
          </button>
        </div>

        {/* Active streaks */}
        {member.streaks && Object.keys(member.streaks).length > 0 && (
          <div style={{ padding: '0 18px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>🔥 Активные серии</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(member.streaks).map(([act, streak]) => {
                const def = ACTIVITY_TYPES[act];
                if (!def) return null;
                return (
                  <div key={act} style={{ display: 'flex', alignItems: 'center', gap: 5, background: def.color + '15', border: `1px solid ${def.color}33`, borderRadius: 8, padding: '5px 10px' }}>
                    <Flame size={12} color={def.color} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: def.color }}>{streak}</span>
                    <span style={{ fontSize: 10, color: '#7a7a82' }}>{def.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity breakdown */}
        {member.activityCounts && Object.keys(member.activityCounts).length > 0 && (
          <div style={{ padding: '0 18px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Активности</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(member.activityCounts).sort((a, b) => b[1] - a[1]).map(([act, count]) => {
                const def = ACTIVITY_TYPES[act];
                if (!def) return null;
                const maxCount = Math.max(...Object.values(member.activityCounts));
                return (
                  <div key={act} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#6a6a72', width: 70, flexShrink: 0 }}>{def.label}</span>
                    <div style={{ flex: 1, height: 5, background: '#1e1e26', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(count / maxCount * 100)}%`, background: def.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#7a7a82', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unlocked skills */}
        {unlockedSkills.length > 0 && (
          <div style={{ padding: '0 18px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Навыки</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {unlockedSkills.map((skill, i) => (
                <div key={i} style={{ background: clsColor + '12', border: `1px solid ${clsColor}33`, borderRadius: 8, padding: '7px 10px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: clsColor }}>{skill.name}</div>
                  {skill.desc && <div style={{ fontSize: 10, color: '#6a6a72', marginTop: 2 }}>{skill.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active raids */}
        {member.raidIds && member.raidIds.length > 0 && (
          <div style={{ padding: '0 18px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Активные рейды</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {member.raidIds.map(rId => {
                const boss = RAID_BOSSES.find(b => b.id === rId);
                if (!boss) return null;
                const rc = RAID_RARITY_COLORS[boss.rarity]?.color || '#e05f9c';
                return (
                  <div key={rId} style={{ padding: '6px 10px', background: rc + '15', border: `1px solid ${rc}44`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: rc }}>
                    ⚔️ {boss.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transfer crystals / Gift / Nudge — hidden for self-view */}
        {!isSelf && <>
        <div style={{ padding: '8px 18px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>💎 Передать кристаллы</div>
          {transferSent ? (
            <div style={{ padding: '10px 12px', background: '#0f2a1a', border: '1px solid #2a5a3a', borderRadius: 10, fontSize: 12, color: '#7de8a8', textAlign: 'center', fontWeight: 700 }}>
              ✓ Отправлено!
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder={`До ${myCurrencyBalance || 0}`}
                value={crystalAmount}
                onChange={e => setCrystalAmount(e.target.value)}
                style={{ flex: 1, background: '#1a1a22', border: '1px solid #2a2a32', borderRadius: 8, padding: '8px 10px', color: '#d0d0da', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleTransfer}
                disabled={transferring || !crystalAmount}
                style={{
                  padding: '8px 16px', borderRadius: 8, cursor: transferring ? 'default' : 'pointer',
                  background: '#1a2a40', border: '1px solid #3a5a8a', fontSize: 12, fontWeight: 700,
                  color: '#5b9bf0', opacity: transferring ? 0.6 : 1,
                }}
              >
                {transferring ? '...' : 'Отправить'}
              </button>
            </div>
          )}
        </div>

        {/* Gift an item */}
        {giftableItems.length > 0 && (
          <div style={{ padding: '14px 18px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>🎁 Подарить предмет</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {giftableItems.map(item => {
                const ItemIcon = item.icon;
                const isEquipped = Object.values(myEquippedShopItems || {}).includes(item.id);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#1a1a22', border: '1px solid #2a2a32', borderRadius: 8 }}>
                    {item.image
                      ? <img src={item.image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                      : (ItemIcon && <ItemIcon size={14} color="#8a8a92" />)}
                    <span style={{ fontSize: 11.5, color: '#c0c0ca', flex: 1 }}>{item.name}{isEquipped ? ' (надето)' : ''}</span>
                    <button
                      onClick={() => handleGift(item)}
                      disabled={giftingId === item.id}
                      style={{
                        background: '#2a1a3a', border: '1px solid #4a2a6a', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: '#c9a8f5',
                      }}
                    >
                      {giftingId === item.id ? '...' : 'Подарить'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nudge button */}
        <div style={{ padding: '14px 18px 0' }}>
          <button
            onClick={handleNudge}
            disabled={nudged}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, cursor: nudged ? 'default' : 'pointer',
              background: nudged ? '#1a2a1a' : 'linear-gradient(135deg, #2a1a3a, #1a1228)',
              border: `1.5px solid ${nudged ? '#3a5a3a' : '#6a3a9a'}`,
              fontSize: 13, fontWeight: 800,
              color: nudged ? '#6a9a6a' : '#c9a8f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {nudged ? (
              <><span>✅</span> Пинок отправлен!</>
            ) : (
              <><span>👊</span> Пнуть для мотивации</>
            )}
          </button>
          {onSendMessage && (
            <button onClick={() => {
              const text = prompt('Сообщение для ' + (member.characterName || member.name) + ':');
              if (text && text.trim()) onSendMessage(member.name, text.trim());
            }} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#1a1a2e', border: '1px solid #3a3a5a',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: '#7a8af5',
            }}>
              <Mail size={13} color="#7a8af5" />
              Написать
            </button>
          )}
        </div>
        </>}

        {member.totalLogs === 0 && (
          <div style={{ padding: '12px 18px 0', textAlign: 'center', fontSize: 12, color: '#4a4a52' }}>
            Боец только начинает путь — данные скоро появятся
          </div>
        )}
      </div>
      {showRecords && (
        <RecordsWallView
          categories={RECORD_CATEGORIES}
          records={member.personalRecords || {}}
          onClose={() => setShowRecords(false)}
        />
      )}
    </div>
  );
});

// Считает прогресс рейда: итого, по каждому участнику, осталось до победы
function computeRaidStats(boss, raid) {
  const cond = boss.condition;
  const contribs = raid.contributions || [];
  const participants = raid.participants || [];

  // Урон по участникам
  const damageByPlayer = {};
  participants.forEach(p => { damageByPlayer[p.name] = 0; });
  contribs.forEach(c => {
    if (damageByPlayer[c.participantName] !== undefined)
      damageByPlayer[c.participantName] += c.value;
    else
      damageByPlayer[c.participantName] = c.value;
  });

  let totalDone = 0;
  let target = 1;
  let playerTargets = {}; // name -> { done, target, label }

  if (cond.type === 'shared_total' || cond.type === 'shared_count') {
    target = cond.target;
    totalDone = contribs.reduce((s, c) => s + c.value, 0);
    participants.forEach(p => {
      const done = damageByPlayer[p.name] || 0;
      playerTargets[p.name] = { done, target: null, label: null }; // personal target N/A here
    });

  } else if (cond.type === 'combo_roles') {
    let allDone = 0;
    let allTarget = 0;
    participants.forEach(p => {
      const roleDef = p.role ? cond.roles[p.role] : null;
      const myContribs = contribs.filter(c => c.participantName === p.name);
      if (roleDef?.subtargets) {
        const pTarget = roleDef.subtargets.reduce((s, st) => s + st.target, 0);
        const pDone = roleDef.subtargets.reduce((s, st, idx) => {
          const subDone = Math.min(myContribs.filter(c => c.subKey === idx).reduce((ss, c) => ss + c.value, 0), st.target);
          return s + subDone;
        }, 0);
        const subLabel = roleDef.subtargets.map(st => `${st.target} ${st.unit}`).join(' + ');
        playerTargets[p.name] = { done: pDone, target: pTarget, unit: '', label: roleDef.label, subLabel };
        allDone += pDone;
        allTarget += pTarget;
      } else {
        const pTarget = roleDef ? roleDef.target : 0;
        const pDone = Math.min(damageByPlayer[p.name] || 0, pTarget);
        const roleLabel = roleDef ? roleDef.label : p.role;
        playerTargets[p.name] = { done: pDone, target: pTarget, unit: roleDef?.unit || '', label: roleLabel };
        allDone += pDone;
        allTarget += pTarget;
      }
    });
    totalDone = allDone;
    target = allTarget;

  } else if (cond.type === 'each_player_all_days') {
    const daysReq = cond.daysRequired || 7;
    target = participants.length * daysReq;
    totalDone = 0;
    participants.forEach(p => {
      const days = new Set(contribs.filter(c => c.participantName === p.name).map(c => c.date)).size;
      playerTargets[p.name] = { done: days, target: daysReq, unit: 'дн', label: null };
      totalDone += Math.min(days, daysReq);
    });

  } else if (cond.type === 'perfect_discipline') {
    const daysReq = boss.durationDays || 21;
    target = participants.length * daysReq;
    totalDone = 0;
    participants.forEach(p => {
      const days = new Set(contribs.filter(c => c.participantName === p.name).map(c => c.date)).size;
      playerTargets[p.name] = { done: days, target: daysReq, unit: 'дн', label: null };
      totalDone += Math.min(days, daysReq);
    });
  }

  const pct = target > 0 ? Math.min(100, Math.round(totalDone / target * 100)) : 0;
  const remaining = Math.max(0, target - totalDone);

  return { totalDone, target, pct, remaining, playerTargets, damageByPlayer, unit: cond.unit || '' };
}

// Возвращает контент аватара: emoji если выбран, иначе старая логика (title emoji / иконка класса)
function renderAvatarContent(avatarEmoji, titleText, clsComponent, clsColor, size = 24, shape = 'circle') {
  const radius = shape === 'square' ? '22%' : '50%';
  if (avatarEmoji) {
    const foundPortrait = AVATAR_CLASS_PORTRAITS.find(a => a.id === avatarEmoji);
    if (foundPortrait) {
      return (
        <img
          src={foundPortrait.src}
          alt={foundPortrait.name}
          style={{ width: '100%', height: '100%', borderRadius: radius, objectFit: 'cover', display: 'block' }}
        />
      );
    }
    // Открываемые аватарки классов (AVATAR_UNLOCKABLES) — плоский поиск по всем классам,
    // так как id уже содержит classId и уникален (unlock_{classId}_{index}).
    const foundUnlockable = Object.values(AVATAR_UNLOCKABLES).flat().find(a => a.id === avatarEmoji);
    if (foundUnlockable) {
      return (
        <img
          src={foundUnlockable.src}
          alt=""
          style={{ width: '100%', height: '100%', borderRadius: radius, objectFit: 'cover', display: 'block' }}
        />
      );
    }
    const found = AVATAR_EMOJIS.find(a => a.id === avatarEmoji);
    if (found) return <span style={{ fontSize: size * 1.1, lineHeight: 1 }}>{found.svg}</span>;
  }
  const titleEmoji = getAvatarForTitle(titleText);
  if (titleEmoji) return <span style={{ fontSize: size, lineHeight: 1 }}>{titleEmoji}</span>;
  if (clsComponent) {
    const Icon = clsComponent.icon || clsComponent;
    return <Icon size={size} color={clsColor} />;
  }
  return <Skull size={size} color="#5a5a62" />;
}

// Compact battle log button for guild card
const RaidBattleLogButton = React.memo(function RaidBattleLogButton({ boss, raid, guildMembers }) {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <button onClick={e => { e.stopPropagation(); setShow(true); }} style={{
        background: 'none', border: '1px solid #3a3a4a', borderRadius: 6, padding: '2px 7px',
        cursor: 'pointer', fontSize: 9.5, color: '#7a7a92', flexShrink: 0,
      }}>📜 Лог</button>
      {show && <RaidBattleLogModal boss={boss} raid={raid} guildMembers={guildMembers || []} onClose={() => setShow(false)} />}
    </>
  );
});

const GuildView = React.memo(function GuildView({ playerName, playerCharacterName, playerLevel, playerClass, playerPhysical, playerMental, playerTitleEntry, activeTitle, earnedTitles, raids, guildLikes, onLike, lockedClassId, chosenPathId, guildMembers, onRefreshGuild, onLogout, onTransferCrystals, onGiftItem, myPurchasedItemIds, myEquippedShopItems, myCurrencyBalance, myEquippedAvatarFrame, myAvatarEmoji, onSendMessage }) {
  const [likedSet, setLikedSet] = React.useState(new Set());
  const [refreshing, setRefreshing] = React.useState(false);
  const [detailMember, setDetailMember] = React.useState(null); // member to show in detail modal

  // Auto-refresh guild when this tab is mounted, and every 30s
  React.useEffect(() => {
    onRefreshGuild();
    const interval = setInterval(onRefreshGuild, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefreshGuild();
    setRefreshing(false);
  }

  function handleLike(name) {
    if (likedSet.has(name)) return;
    setLikedSet(prev => new Set([...prev, name]));
    onLike(name);
  }

  // Compute health for a guild member from their logs, passive_logs, recovery_logs
  function computeMemberHealth(memberLogs, memberPassiveLogs, memberRecoveryLogs, memberConsumableLog) {
    const HEALTH_START = 50;
    const today = dateKey(new Date());

    // Zero-activity days (stagnation debuff)
    // Шаги ≥3000 ломают стагнацию (синхрон с основным движком)
    const memberStepsDates = new Set(
      memberLogs.filter(l => l.activity === 'walking' && (Number(l.steps) || 0) >= 3000).map(l => l.date)
    );
    const memberZeroActivityDays = computeZeroActivityDays(memberLogs.map(l => l.date), memberStepsDates);
    const stagnationEntries = [...memberZeroActivityDays]
      .filter(d => d < today)
      .map(d => ({ date: d, type: 'stagnation', id: -1, _kind: 'passive' }));

    // Recovery dates set (for overtraining check)
    const recoveryDates = new Set((memberRecoveryLogs || []).map(r => r.date));

    const combined = [
      ...memberLogs.map(l => ({ ...l, _kind: 'activity' })),
      ...(memberPassiveLogs || []).map(p => ({ ...p, _kind: 'passive' })),
      ...(memberRecoveryLogs || []).map(r => ({ ...r, _kind: 'recovery' })),
      ...stagnationEntries,
      ...(memberConsumableLog || []).filter(c => c.type === 'potion_hp' || c.type === 'potion_mp')
        .map(c => ({ ...c, _kind: 'consumable', id: c.id || Date.now() })),
    ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id || 0) - (b.id || 0)));

    let physical = HEALTH_START;
    let mental = HEALTH_START;
    let stressStack = [];
    let fatigueStack = [];
    let poisonCount = 0;
    let nutritionTowardPoisonRelief = 0;
    const kcalByDate = {};
    const calorieFatigueAppliedDates = new Set();
    // Sleep debt tracking (sync with main engine)
    let lastSleepDate = null;
    const sleepDebtAppliedDates = new Set();
    // Walking fatigue tracking
    const stepsByDate = {};
    const walkingFatigueAppliedDates = new Set();
    // Overtraining tracking
    const trainingCountByDate = {};
    const overtrainingAppliedDates = new Set();
    // Day boundary tracking for daily fatigue drain
    let lastSeenDate = null;

    combined.forEach(entry => {
      // --- Day boundary processing ---
      if (entry.date !== lastSeenDate) {
        // Daily fatigue drain from active stacks (sync with main engine)
        if (lastSeenDate !== null) {
          const fatigueDrainTable = [0, 2, 5, 8, 11, 15];
          const fatigueDrain = fatigueDrainTable[Math.min(fatigueStack.length, 5)];
          if (fatigueDrain > 0) physical = Math.max(0, physical - fatigueDrain);
        }
        // Auto-fatigue if 2+ days without sleep log (sync with main engine)
        if (lastSleepDate !== null && lastSeenDate !== null) {
          const daysSinceSleep = Math.floor((new Date(entry.date) - new Date(lastSleepDate)) / 86400000);
          if (daysSinceSleep >= 2 && !sleepDebtAppliedDates.has(entry.date)) {
            sleepDebtAppliedDates.add(entry.date);
            const magnitude = 8 + fatigueStack.length * 3;
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }
        lastSeenDate = entry.date;
      }

      if (entry._kind === 'activity') {
        const physGain = PHYSICAL_HEALTH_SOURCES[entry.activity];
        if (physGain) physical = Math.min(100, physical + physGain);
        const mentGain = MENTAL_HEALTH_SOURCES[entry.activity];
        if (mentGain) mental = Math.min(100, mental + mentGain);

        // Calorie fatigue: 1000+ kcal/day
        if (entry.activity === 'calories' && entry.kcal) {
          kcalByDate[entry.date] = (kcalByDate[entry.date] || 0) + (Number(entry.kcal) || 0);
          if (kcalByDate[entry.date] >= 1000 && !calorieFatigueAppliedDates.has(entry.date)) {
            calorieFatigueAppliedDates.add(entry.date);
            const magnitude = 8 + fatigueStack.length * 3;
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }

        // Walking: 8000+ steps → +5% phys HP; 20000+ → fatigue stack instead
        if (entry.activity === 'walking' && entry.steps) {
          stepsByDate[entry.date] = (stepsByDate[entry.date] || 0) + (Number(entry.steps) || 0);
          const totalW = stepsByDate[entry.date];
          if (!walkingFatigueAppliedDates.has(entry.date)) {
            if (totalW >= 20000) {
              walkingFatigueAppliedDates.add(entry.date);
              const magnitude = 8 + fatigueStack.length * 3;
              fatigueStack.push(magnitude);
              physical = Math.max(0, physical - magnitude);
            } else if (totalW >= 8000) {
              walkingFatigueAppliedDates.add(entry.date);
              physical = Math.min(100, physical + 5);
            }
          }
        }

        // Sleep removes fatigue + tracks last sleep date
        if (entry.activity === 'sleep' && fatigueStack.length > 0) {
          fatigueStack.pop();
        }
        if (entry.activity === 'sleep') lastSleepDate = entry.date;

        if (entry.activity === 'nutrition') {
          nutritionTowardPoisonRelief += 1;
          if (nutritionTowardPoisonRelief >= 3 && poisonCount > 0) {
            nutritionTowardPoisonRelief = 0;
            poisonCount -= 1;
          }
        }

        // Overtraining: 6+ workouts in 7 days without any recovery → fatigue
        if (INTENSITY_ACTIVITIES.has(entry.activity) || entry.activity === 'running') {
          trainingCountByDate[entry.date] = (trainingCountByDate[entry.date] || 0) + 1;
          const d = new Date(entry.date);
          let trainCount7d = 0;
          let hasRecovery7d = false;
          for (let i = 0; i < 7; i++) {
            const key = dateKey(new Date(d.getTime() - i * 86400000));
            trainCount7d += trainingCountByDate[key] || 0;
            if (recoveryDates.has(key)) hasRecovery7d = true;
          }
          if (trainCount7d >= 6 && !hasRecovery7d && !overtrainingAppliedDates.has(entry.date)) {
            overtrainingAppliedDates.add(entry.date);
            const magnitude = 8 + fatigueStack.length * 3;
            fatigueStack.push(magnitude);
            physical = Math.max(0, physical - magnitude);
          }
        }
      } else if (entry._kind === 'recovery') {
        const recDef = RECOVERY_TYPES[entry.type];
        const tier = RECOVERY_TIER_EFFECTS[recDef?.tier] || RECOVERY_TIER_EFFECTS.short;
        let removedMagnitude = 0;
        if (tier.targetFatigue) {
          // fatigue_relief: снимаем усталость, а не стресс (синхрон с основным движком)
          for (let i = 0; i < tier.stacksRemoved && fatigueStack.length > 0; i++) {
            removedMagnitude += fatigueStack.pop();
          }
          physical = Math.min(100, physical + tier.basePhysical + removedMagnitude);
          mental = Math.min(100, mental + tier.baseMental);
        } else {
          for (let i = 0; i < tier.stacksRemoved && stressStack.length > 0; i++) {
            removedMagnitude += stressStack.pop();
          }
          mental = Math.min(100, mental + tier.baseMental + removedMagnitude);
          physical = Math.min(100, physical + tier.basePhysical);
        }
      } else if (entry._kind === 'consumable') {
        // Potions: instant HP restore (+10%)
        if (entry.type === 'potion_hp') physical = Math.min(100, physical + 10);
        else if (entry.type === 'potion_mp') mental = Math.min(100, mental + 10);
      } else {
        const def = PASSIVE_TYPES[entry.type];
        if (!def) return;
        if (def.affects === 'mental') {
          const magnitude = 8 + stressStack.length * 3;
          stressStack.push(magnitude);
          mental = Math.max(0, mental - magnitude);
        } else if (def.affects === 'physical') {
          const magnitude = 8 + fatigueStack.length * 3;
          fatigueStack.push(magnitude);
          physical = Math.max(0, physical - magnitude);
        } else if (def.affects === 'poison') {
          poisonCount += 1;
          if (poisonCount >= POISON_THRESHOLD) {
            poisonCount = 0;
          }
        }
      }
    });

    return { physical: Math.round(physical), mental: Math.round(mental) };
  }

  // Build "you" card data from live props
  const playerCls = playerClass
    ? (playerClass.combo ? playerClass.classA : playerClass)
    : null;
  const lockedCls = lockedClassId ? CHARACTER_CLASSES.find(c => c.id === lockedClassId) : null;
  const displayCls = lockedCls || playerCls;
  const chosenPath = lockedClassId && chosenPathId
    ? (CLASS_PATHS[lockedClassId] || []).find(p => p.id === chosenPathId)
    : null;

  const playerTitleText = activeTitle
    ? activeTitle.text
    : (playerTitleEntry?.title || '');
  const playerTitleColor = activeTitle
    ? activeTitle.color
    : (playerTitleEntry?.titleColor || '#e0a868');

  // Active raids: which bosses are currently active guild-wide
  const activeRaidIds = RAID_BOSSES
    .filter(b => raids[b.id]?.status === 'active')
    .map(b => b.id);

  // Build live guild member cards from DB data
  function memberFromRow(row) {
    // Если класс зафиксирован — берём его, иначе показываем динамический (текущий ведущий)
    const cls = row.locked_class_id
      ? CHARACTER_CLASSES.find(c => c.id === row.locked_class_id) || null
      : null; // будет заменён динамическим после расчёта статов
    const pathObj = (row.locked_class_id && row.chosen_path_id)
      ? (CLASS_PATHS[row.locked_class_id] || []).find(p => p.id === row.chosen_path_id) || null
      : null;

    const memberLogs = row.logs || [];

    // Точный расчёт XP с учётом стриков — зеркало основного statTotals useMemo
    const MEMBER_STREAK_ACTIVITIES = new Set(['running', 'sleep', 'nutrition', 'reading']);
    const MEMBER_STREAK_MULTIPLIERS = { bronze: 1.25, silver: 1.5, gold: 2 };

    function memberBaseXp(l) {
      if (l.activity === 'running') {
        const dist = Number(l.distance) || 0;
        if (dist <= 0) return 0;
        return Math.round(Math.min(14, 6 + dist * 0.65));
      }
      if (l.activity === 'reading') {
        const p = Number(l.pages) || 0;
        if (p <= 0) return 0;
        if (p < 20)  return 0;  // < 20 стр — не активность, только стрик засчитается
        if (p < 50)  return 2;  // лёгкая глава перед сном
        if (p < 100) return 6;  // нормальная сессия
        return 8;                // 100+ стр — серьёзная дисциплина / вершина (единый верхний брекет)
      }
      if (l.activity === 'calories') return 0;
      if (INTENSITY_ACTIVITIES.has(l.activity)) {
        return (INTENSITY_LEVELS[l.intensity] || INTENSITY_LEVELS.medium)?.xp || 10;
      }
      if (l.activity === 'nutrition') return 4;
      if (l.activity === 'sleep') return 5;
      return 4;
    }

    function memberStreakMultiplier(activity, streakLen) {
      if (!MEMBER_STREAK_ACTIVITIES.has(activity)) return 1;
      const ach = ACHIEVEMENTS.find(a => a.kind === 'streak' && a.activity === activity);
      if (!ach) return 1;
      let tierName = null;
      ach.tiers.forEach(t => { if (streakLen >= t.need) tierName = t.tier; });
      // Кэп золотого стрика чтения — 1.5x вместо 2.0x (синхрон с основным движком)
      return tierName ? (activity === 'reading' && tierName === 'gold' ? 1.5 : (MEMBER_STREAK_MULTIPLIERS[tierName] || 1)) : 1;
    }

    // Воспроизводим стрики хронологически — как в основном приложении
    const memberSortedAsc = [...memberLogs].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    const streakByActivity = {}; // activity -> { currentStreak, lastDate }

    const memberStatTotals = {};
    ALL_STATS.forEach(s => { memberStatTotals[s] = 0; });

    memberSortedAsc.forEach(l => {
      const def = ACTIVITY_TYPES[l.activity];
      if (!def || !def.stats || def.stats.length === 0) return;
      const base = memberBaseXp(l);
      if (base <= 0) return;

      // Стрик
      let multiplier = 1;
      if (MEMBER_STREAK_ACTIVITIES.has(l.activity)) {
        const prev = streakByActivity[l.activity];
        if (!prev) {
          streakByActivity[l.activity] = { streak: 1, lastDate: l.date };
        } else {
          const prevD = new Date(prev.lastDate);
          const curD = new Date(l.date);
          const diff = Math.round((curD - prevD) / 86400000);
          if (diff === 1) {
            streakByActivity[l.activity] = { streak: prev.streak + 1, lastDate: l.date };
          } else if (diff > 1) {
            streakByActivity[l.activity] = { streak: 1, lastDate: l.date };
          }
        }
        multiplier = memberStreakMultiplier(l.activity, streakByActivity[l.activity].streak);
      }

      const xp = base * multiplier;
      def.stats.forEach(s => {
        if (memberStatTotals[s] !== undefined) memberStatTotals[s] += xp;
      });
    });

    const totalStatXp = Object.values(memberStatTotals).reduce((a, b) => a + b, 0);
    // Уровень — только из БД (пересчитывается у каждого игрока при заходе)
    const level = (row.current_level && row.current_level > 0) ? row.current_level : 1;
    const titleEntry = titleEntryForLevel(level);
    const memberActiveTitle = row.active_title || null;

    // Реальный HP из логов (вместо захардкоженных 70%)
    const memberHealth = computeMemberHealth(memberLogs, row.passive_logs, row.recovery_logs, row.consumable_log);
    // Рейд-штрафы за поражения
    RAID_BOSSES.forEach(boss => {
      const raid = raids[boss.id];
      if (raid?.status === 'defeat' && !raid.defeatPenaltyApplied) {
        const penalty = RAID_DEFEAT_PENALTY_BY_RARITY[boss.rarity] || 50;
        memberHealth.physical = Math.max(0, memberHealth.physical - penalty);
        memberHealth.mental = Math.max(0, memberHealth.mental - penalty);
      }
    });

    const memberIdentity = row.character_name || row.nickname;
    const memberRaidIds = Object.entries(raids || {})
      .filter(([, r]) => r?.status === 'active' && r.participants?.some(p => p.name === row.nickname || p.name === memberIdentity))
      .map(([id]) => id);

    // Count activities for detail display
    const activityCounts = {};
    memberLogs.forEach(l => {
      activityCounts[l.activity] = (activityCounts[l.activity] || 0) + 1;
    });

    // Streaks
    const memberStreaks = {};
    Object.keys(ACTIVITY_TYPES).forEach(act => {
      const actLogs = memberLogs.filter(l => l.activity === act);
      const dates = [...new Set(actLogs.map(l => l.date))].sort().reverse();
      let streak = 0;
      const today = dateKey(new Date());
      let checkDate = today;
      for (let i = 0; i < 365; i++) {
        if (dates.includes(checkDate)) { streak++; }
        else if (checkDate !== today) break;
        const d = new Date(checkDate); d.setDate(d.getDate() - 1);
        checkDate = dateKey(d);
      }
      if (streak > 0) memberStreaks[act] = streak;
    });

    // Total distance, pages
    const totalKm = memberLogs.filter(l => l.activity === 'running').reduce((s, l) => s + (Number(l.distance) || 0), 0);
    const totalPages = memberLogs.filter(l => l.activity === 'reading').reduce((s, l) => s + (Number(l.pages) || 0), 0);
    const booksFinished = (row.books || []).filter(b => b.finished).length;
    const totalTrainings = memberLogs.filter(l => ['strength_gym','strength_park','wrestling'].includes(l.activity)).length;

    // Equipment count
    const equippedCount = Object.values(row.equipped_shop_items || {}).filter(Boolean).length;

    // Total calories burned
    const totalKcal = memberLogs.filter(l => l.activity === 'calories').reduce((s, l) => s + (Number(l.kcal) || 0), 0);
    const totalSteps = memberLogs.filter(l => l.activity === 'walking').reduce((s, l) => s + (Number(l.steps) || 0), 0);

    // Вычисляем ачивки — зеркало evaluateAchievement из основного приложения
    const memberMaxRunDist = Math.max(0, ...memberLogs.filter(l => l.activity === 'running').map(l => Number(l.distance) || 0));
    const memberTotalRunDist = memberLogs.filter(l => l.activity === 'running').reduce((s, l) => s + (Number(l.distance) || 0), 0);
    const memberCountByActivity = {};
    memberLogs.forEach(l => { memberCountByActivity[l.activity] = (memberCountByActivity[l.activity] || 0) + 1; });
    const memberStyleCounts = {}; // count = 1 per activity (just having done it once)
    memberLogs.forEach(l => { memberStyleCounts[l.activity] = 1; });
    // Weekly strength count (last week)
    const memberWeekKey = getWeekKey(dateKey(new Date()));
    const memberWeeklyStrength = memberLogs.filter(l => INTENSITY_ACTIVITIES.has(l.activity) && getWeekKey(l.date) === memberWeekKey).length;
    const memberCalBestDay = (() => {
      const byDay = {};
      memberLogs.filter(l => l.activity === 'calories').forEach(l => { byDay[l.date] = (byDay[l.date] || 0) + (Number(l.kcal) || 0); });
      return Math.max(0, ...Object.values(byDay));
    })();
    const memberCalTotal = memberLogs.filter(l => l.activity === 'calories').reduce((s, l) => s + (Number(l.kcal) || 0), 0);
    const memberCalDays300 = (() => {
      const byDay = {};
      memberLogs.filter(l => l.activity === 'calories').forEach(l => { byDay[l.date] = (byDay[l.date] || 0) + (Number(l.kcal) || 0); });
      return Object.values(byDay).filter(v => v >= 300).length;
    })();
    const memberCalDays500 = (() => {
      const byDay = {};
      memberLogs.filter(l => l.activity === 'calories').forEach(l => { byDay[l.date] = (byDay[l.date] || 0) + (Number(l.kcal) || 0); });
      return Object.values(byDay).filter(v => v >= 500).length;
    })();
    const memberTotalPages = memberLogs.filter(l => l.activity === 'reading').reduce((s, l) => s + (Number(l.pages) || 0), 0);
    const memberBooksFinished = (row.books || []).filter(b => b.finished).length;

    function memberEvalAch(ach) {
      let v = 0;
      if (ach.kind === 'streak')              v = memberStreaks[ach.activity] || 0;
      else if (ach.kind === 'single_value')   v = memberMaxRunDist;
      else if (ach.kind === 'cumulative_value') v = Math.round(memberTotalRunDist * 10) / 10;
      else if (ach.kind === 'weekly_count')   v = memberWeeklyStrength;
      else if (ach.kind === 'count')          v = memberCountByActivity[ach.activity] ? 1 : 0;
      else if (ach.kind === 'cumulative_count') v = memberCountByActivity[ach.activity] || 0;
      else if (ach.kind === 'cal_single_day') v = memberCalBestDay;
      else if (ach.kind === 'cal_cumulative') v = memberCalTotal;
      else if (ach.kind === 'cal_streak_threshold') v = ach.threshold === 300 ? memberCalDays300 : memberCalDays500;
      else if (ach.kind === 'cumulative_pages') v = memberTotalPages;
      else if (ach.kind === 'books_finished') v = memberBooksFinished;
      return v;
    }

    const tierWeight = { platinum: 5, diamond: 4, gold: 3, silver: 2, bronze: 1, special: 3 };
    const memberAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
      const v = memberEvalAch(ach);
      let achievedTierIndex = -1;
      ach.tiers.forEach((t, idx) => { if (v >= t.need) achievedTierIndex = idx; });
      if (achievedTierIndex >= 0) {
        const topTier = ach.tiers[achievedTierIndex];
        memberAchievements.push({ name: topTier.name, tier: topTier.tier, achId: ach.id, achTitle: ach.title });
      }
    });
    memberAchievements.sort((a, b) => (tierWeight[b.tier] || 0) - (tierWeight[a.tier] || 0));
    const topAchievements = memberAchievements.slice(0, 3);
    const totalAchievementCount = memberAchievements.length;

    // Определяем живой класс по статам — показывается и до 10 уровня
    const resolvedLive = resolveCharacterClass(memberStatTotals, level, row.combo_class_id || null);
    // Если класс не зафиксирован — показываем динамический (ведущую активность)
    const displayCls = cls || (resolvedLive?.combo ? resolvedLive.classA : resolvedLive) || null;
    const subclassName = resolvedLive?.combo ? resolvedLive.name : null;

    // Today's motivational highlight — one random activity logged today, phrased casually
    const todayKey = dateKey(new Date());
    const todayLogs = memberLogs.filter(l => l.date === todayKey);
    let todayHighlight = null;
    if (todayLogs.length > 0) {
      const HIGHLIGHT_PHRASES = {
        running: ['🏃 сегодня уже пробежался', '🏃 размял ноги сегодня', '🏃 накрутил километры'],
        strength_gym: ['🏋️ хорошенько потренил в зале', '🏋️ погонял железо сегодня', '🏋️ качнулся сегодня'],
        strength_park: ['🌳 потренил на турниках', '🌳 поработал на улице сегодня'],
        wrestling: ['🥋 покрутил борьбу сегодня', '🥋 навалял на татами'],
        nutrition: ['🥗 хорошенько покушал', '🥗 поел правильно сегодня'],
        sleep: ['😴 выспался как надо', '😴 закрыл норму сна'],
        reading: ['📖 почитал сегодня', '📖 прокачал мозги книгой'],
        calories: ['🔥 сжёг калории сегодня', '🔥 устроил жиросжигание'],
      };
      const pick = todayLogs[Math.floor(Math.random() * todayLogs.length)];
      const phrases = HIGHLIGHT_PHRASES[pick.activity];
      if (phrases) todayHighlight = phrases[Math.floor(Math.random() * phrases.length)];
    }

    return {
      name: row.nickname,
      characterName: row.character_name || row.nickname,
      level: Math.max(1, level),
      cls: displayCls,
      subclassName,
      pathName: pathObj?.name || null,
      physicalHp: memberHealth.physical,
      mentalHp: memberHealth.mental,
      titleText: memberActiveTitle?.text || (titleEntry?.title || 'Новичок'),
      titleColor: memberActiveTitle?.color || (titleEntry?.color || '#7a7a82'),
      achievementNames: topAchievements.map(a => a.name),
      achievementBadges: topAchievements,
      totalAchievementCount,
      raidIds: memberRaidIds,
      isPlayer: false,
      likes: row.likes || {},
      activityCounts,
      streaks: memberStreaks,
      totalKm: Math.round(totalKm * 10) / 10,
      totalPages,
      booksFinished,
      totalTrainings,
      totalKcal: Math.round(totalKcal),
      totalSteps,
      totalLogs: memberLogs.length,
      equippedCount,
      lockedClassId: row.locked_class_id,
      chosenPathId: row.chosen_path_id,
      unlockedSkillLevels: row.unlocked_skill_levels || [],
      classChoiceMode: row.class_choice_mode || null,
      comboClassId: row.combo_class_id || null,
      comboPathId: row.combo_path_id || null,
      unlockedComboSkillLevels: row.unlocked_combo_skill_levels || [],
      specPathId: row.spec_path_id || null,
      unlockedSpecSkillLevels: row.unlocked_spec_skill_levels || [],
      personalRecords: row.personal_records || {},
      bestiaryCount: (row.bestiary || []).length,
      activeBackground: row.active_background || null,
      todayHighlight,
      avatarFrameId: row.equipped_avatar_frame || null,
      avatarEmoji: row.avatar_emoji || null,
      activeChallenge: (() => {
        const ch = row.challenge_state?.active;
        if (!ch) return null;
        const def = CHALLENGE_CATALOG.find(c => c.id === ch.id);
        if (!def) return null;
        const startDate = new Date(ch.startDate);
        const today = new Date(dateKey(new Date()));
        const elapsed = Math.min(def.duration, Math.floor((today - startDate) / 86400000) + 1);
        const catDef = CHALLENGE_CATEGORIES.find(c => c.id === def.category);
        return { name: def.name, category: def.category, color: catDef?.color || '#e0a868', elapsed, duration: def.duration };
      })(),
      rawRow: row,
    };
  }

  const allMembers = [
    {
      name: playerName,
      characterName: playerCharacterName || playerName,
      level: playerLevel,
      cls: displayCls,
      pathName: chosenPath?.name || null,
      physicalHp: playerPhysical,
      mentalHp: playerMental,
      titleText: playerTitleText,
      titleColor: playerTitleColor,
      achievementNames: earnedTitles.slice(0, 3).map(t => t.text),
      raidIds: activeRaidIds,
      isPlayer: true,
      avatarFrameId: myEquippedAvatarFrame || null,
      avatarEmoji: myAvatarEmoji || null,
    },
    ...guildMembers.map(memberFromRow),
  ];

  const sorted = [
    allMembers[0],
    ...allMembers.slice(1).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return (b.totalLogs || 0) - (a.totalLogs || 0);
    }),
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2a2a1a', border: '1px solid #4a3a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🛡️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0d272' }}>Гильдия Новой Эры</div>
          <div style={{ fontSize: 11, color: '#6a6a72' }}>
            {allMembers.length} {allMembers.length === 1 ? 'боец онлайн' : 'бойцов онлайн'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleRefresh}
            style={{ background: 'none', border: '1px solid #3a3a42', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: refreshing ? '#e0a868' : '#6a6a72' }}
          >
            {refreshing ? '⟳' : '↺'} Обновить
          </button>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid #3a2a2a', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#6a4a4a' }}
            title="Сменить бойца"
          >
            ⏏ Выйти
          </button>
        </div>
      </div>

      {/* Raid overview strip */}
      {RAID_BOSSES.some(b => raids[b.id]?.status === 'active') && (
        <div style={{ background: '#1a1218', border: '1px solid #4a2a3a', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#e05f9c', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>⚔️ Активные рейды гильдии</div>
          {RAID_BOSSES.filter(b => raids[b.id]?.status === 'active' || raids[b.id]?.status === 'gathering').map(boss => {
            const raid = raids[boss.id];
            const raidColor = RAID_RARITY_COLORS[boss.rarity]?.color || '#e05f9c';
            const statusLabel = raid.status === 'gathering' ? '⌛ Сбор' : '⚔️ Активен';
            const participantCount = raid.participants?.length || 0;
            return (
              <div key={boss.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {boss.image
                  ? <img src={boss.image} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }} />
                  : <span style={{ fontSize: 16 }}>{boss.creature || '⚔️'}</span>}
                <span style={{ fontSize: 12, fontWeight: 700, color: raidColor, flex: 1 }}>{boss.name}</span>
                <span style={{ fontSize: 10.5, color: '#6a6a72' }}>{participantCount} уч.</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: raidColor, background: raidColor + '18', border: `1px solid ${raidColor}44`, borderRadius: 5, padding: '2px 7px' }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Member cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((member) => {
          const isYou = member.isPlayer;
          const likeCount = guildLikes[member.name] || 0;
          const alreadyLiked = likedSet.has(member.name);
          const clsColor = member.cls?.color || '#8a8a92';
          // После 10 уровня фон карточки чуть подсвечивается цветом класса —
          // просто отличительная черта, не должно бросаться в глаза.
          const classTintBg = member.level >= 10 ? clsColor + '14' : null;

          return (
            <div
              key={member.name}
              style={{
                background: classTintBg || (isYou ? '#1c1e14' : '#1c1c22'),
                border: `1.5px solid ${isYou ? '#3a4a1f' : '#28282f'}`,
                borderRadius: 14, padding: '14px 14px 12px',
                position: 'relative', cursor: !isYou ? 'pointer' : 'default',
              }}
              onClick={() => !isYou && setDetailMember(member)}
            >
              {/* YOU badge */}
              {isYou && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: '#3a5a1f', border: '1px solid #5a8a2f',
                  borderRadius: 6, padding: '2px 8px',
                  fontSize: 9.5, fontWeight: 800, color: '#a8d86a', letterSpacing: 0.4,
                }}>
                  ВЫ
                </div>
              )}

              {/* Top row: avatar + name + level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 16, flexShrink: 0,
                  background: member.avatarEmoji ? clsColor + '33' : (member.titleColor || clsColor) + '28',
                  border: `2.5px solid ${clsColor}66`,
                  ...getFrameStyle(member.avatarFrameId),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${clsColor}22`,
                }}>
                  {renderAvatarContent(member.avatarEmoji, member.titleText, member.cls, clsColor, 32, 'square')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f4' }}>{(member.characterName || member.name || '').replace(/_/g, ' ')}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#e0e0e8',
                      background: '#2a2a3a', border: '1px solid #3a3a4a',
                      borderRadius: 5, padding: '1px 6px',
                    }}>Ур.{member.level}</span>
                  </div>
                  {/* Title */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: member.titleColor, marginTop: 1 }}>
                    {member.titleText}
                  </div>
                  {/* Class + path */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {member.cls && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, color: clsColor,
                        background: clsColor + '18', border: `1px solid ${clsColor}44`,
                        borderRadius: 5, padding: '1px 6px',
                      }}>
                        {member.cls.name}
                      </span>
                    )}
                    {member.pathName && (
                      <span style={{ fontSize: 9.5, color: '#7a7a82' }}>· {member.pathName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* HP bars */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6a6a72', marginBottom: 3 }}>
                    <span>❤️ Физ.</span><span>{member.physicalHp}%</span>
                  </div>
                  <div style={{ height: 5, background: '#28282f', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${member.physicalHp}%`, background: '#e05f4a', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#6a6a72', marginBottom: 3 }}>
                    <span>🧠 Мент.</span><span>{member.mentalHp}%</span>
                  </div>
                  <div style={{ height: 5, background: '#28282f', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${member.mentalHp}%`, background: '#4f7cff', borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              {/* Achievements row */}
              {(member.achievementBadges || member.achievementNames) && (member.achievementBadges || member.achievementNames).length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {(member.achievementBadges || member.achievementNames.map(n => ({ name: n, tier: 'gold' }))).map((ach, i) => {
                    const tc = TIER_COLORS[ach.tier] || TIER_COLORS.gold;
                    const tierEmoji = ach.tier === 'platinum' ? '💎' : ach.tier === 'gold' ? '🥇' : ach.tier === 'silver' ? '🥈' : '🥉';
                    return (
                      <span key={i} style={{
                        fontSize: 9.5, background: tc.bg, border: '1px solid ' + tc.border,
                        borderRadius: 5, padding: '2px 7px', color: tc.text,
                      }}>
                        {tierEmoji} {ach.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Active raid — compact with damage breakdown */}
              {member.raidIds && member.raidIds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {member.raidIds.map(rId => {
                    const boss = RAID_BOSSES.find(b => b.id === rId);
                    const raid = raids[rId];
                    if (!boss) return null;
                    const rc = RAID_RARITY_COLORS[boss.rarity]?.color || '#e05f9c';
                    const stats = raid ? computeRaidStats(boss, raid) : null;
                    const fmt = v => Number.isInteger(v) ? v : +v.toFixed(1);
                    return (
                      <div key={rId} style={{ padding: '8px 10px', background: rc + '12', border: `1px solid ${rc}33`, borderRadius: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: stats ? 6 : 0 }}>
                          {boss.image
                            ? <img src={boss.image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
                            : <span>{boss.creature}</span>}
                          <span style={{ fontSize: 11, fontWeight: 700, color: rc, flex: 1 }}>{boss.name}</span>
                          {stats && <span style={{ fontSize: 10, color: rc, fontWeight: 700 }}>{stats.pct}%</span>}
                          {raid && <RaidBattleLogButton boss={boss} raid={raid} guildMembers={guildMembers} />}
                        </div>
                        {raid && stats && raid.participants.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {raid.participants.map(p => {
                              const dmg = stats.damageByPlayer[p.name] || 0;
                              const pt = stats.playerTargets[p.name];
                              const hasTarget = pt?.target != null;
                              const pct = hasTarget && pt.target > 0 ? Math.min(100, Math.round(pt.done / pt.target * 100)) : null;
                              return (
                                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 9.5, color: '#7a7a82', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: rc, flexShrink: 0 }}>
                                    {hasTarget ? `${fmt(pt.done)}/${fmt(pt.target)} ${pt.subLabel || pt.unit || stats.unit}` : `${fmt(dmg)} ${stats.unit}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active challenge (клятва) */}
              {member.activeChallenge && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  padding: '6px 10px',
                  background: member.activeChallenge.color + '12',
                  border: `1px solid ${member.activeChallenge.color}33`,
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 13 }}>🔥</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: member.activeChallenge.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.activeChallenge.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#6a6a72' }}>
                      День {member.activeChallenge.elapsed}/{member.activeChallenge.duration}
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div style={{ width: 40, height: 4, background: '#2a2a32', borderRadius: 2, flexShrink: 0 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: member.activeChallenge.color, width: `${Math.round(member.activeChallenge.elapsed / member.activeChallenge.duration * 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Today's motivational highlight */}
              {!isYou && member.todayHighlight && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  padding: '6px 10px', background: '#132a1f', border: '1px solid #2a5a3a',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 11, color: '#7de8a8', fontWeight: 600 }}>{member.todayHighlight}</span>
                </div>
              )}

              {/* Like button */}
              {!isYou && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleLike(member.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: alreadyLiked ? '#2a1a3a' : '#1e1e28',
                      border: `1px solid ${alreadyLiked ? '#7a4aaa' : '#3a3a48'}`,
                      borderRadius: 20, padding: '5px 12px',
                      fontSize: 12, fontWeight: 700,
                      color: alreadyLiked ? '#c9a8f5' : '#6a6a82',
                      cursor: alreadyLiked ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{alreadyLiked ? '👍' : '👍'}</span>
                    <span>{likeCount > 0 ? likeCount : ''}</span>
                    <span style={{ fontSize: 10.5 }}>{alreadyLiked ? 'Оценено' : 'Уважуха'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Member detail modal */}
      {detailMember && (
        <GuildMemberDetail
          member={detailMember}
          onClose={() => setDetailMember(null)}
          onTransferCrystals={onTransferCrystals}
          onGiftItem={onGiftItem}
          myPurchasedItemIds={myPurchasedItemIds}
          myEquippedShopItems={myEquippedShopItems}
          myCurrencyBalance={myCurrencyBalance}
          onNudge={async (targetNick) => {
            // Save nudge notification to the target player's row in DB
            try {
              const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNick)}&select=likes`);
              if (res.ok) {
                const rows = await res.json();
                const row = rows[0];
                if (row) {
                  const currentLikes = row.likes || {};
                  const nudges = currentLikes.__nudges || [];
                  nudges.push({ from: playerName, at: new Date().toISOString() });
                  await sbFetch(`players?nickname=eq.${encodeURIComponent(targetNick)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ likes: { ...currentLikes, __nudges: nudges } }),
                  });
                }
              }
            } catch (_) {}
          }}
          onSendMessage={onSendMessage}
        />
      )}

      {/* Footer note */}
      {allMembers.length === 1 && (
        <div style={{ marginTop: 20, padding: '12px 14px', background: '#15151a', border: '1px solid #25252c', borderRadius: 10, fontSize: 11, color: '#4a4a52', textAlign: 'center', lineHeight: 1.6 }}>
          Ты первый в гильдии 🛡️<br/>
          Остальные появятся здесь как только залогинятся.
        </div>
      )}
    </div>
  );
});

// ---------- CHALLENGES VIEW ----------

const ChallengesView = React.memo(function ChallengesView({ challengeState, challengeProgress, activeChallengeBuff, challengeFailDebuff, challengeCooldownDays, level, onStart, secondChallengeSlotUnlocked, activeChallenge2, challengeProgress2, onStart2, onUnlockSecondSlot, currencyBalance }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const slot1Free = !challengeState.active;
  const slot2Free = secondChallengeSlotUnlocked && !activeChallenge2;
  const canStart = (slot1Free || slot2Free) && level >= CHALLENGE_MIN_LEVEL && challengeCooldownDays <= 0;
  const completedIds = new Set((challengeState.completed || []).map(c => c.id));

  // Универсальный рендер карточки активного вызова (переиспользуется для слота 1 и слота 2)
  function renderActiveCard(activeObj, progress, slotLabel) {
    if (!progress || !activeObj) return null;
    const { def, dayResults, elapsed, missedSoFar, maxAllowed, completedSoFar } = progress;
    const catDef = CHALLENGE_CATEGORIES.find(c => c.id === def.category);
    const CatIcon = catDef?.icon || Star;
    const catColor = catDef?.color || '#e0a868';
    const progressPct = Math.round((elapsed / def.duration) * 100);
    const successDays = dayResults.slice(0, elapsed).filter(d => d === true).length;
    const endDate = new Date(activeObj.startDate);
    endDate.setDate(endDate.getDate() + def.duration);
    const diff = endDate - new Date();
    const timeLeft = diff <= 0 ? 'Завершение...' : Math.floor(diff / 86400000) > 0 ? `${Math.floor(diff / 86400000)} дн.` : `${Math.floor(diff / 3600000)}ч ${Math.floor((diff % 3600000) / 60000)}м`;
    return (
      <div style={{ background: '#1c1c22', border: `1.5px solid ${catColor}44`, borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        {slotLabel && <div style={{ fontSize: 9.5, fontWeight: 800, color: '#6a6a72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{slotLabel}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{def.icon ? <img src={def.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CatIcon size={16} color={catColor} />}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#f0f0f4' }}>{def.name}</div><div style={{ fontSize: 10, color: '#6a6a72' }}>{def.description}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, fontWeight: 800, color: catColor }}>{timeLeft}</div><div style={{ fontSize: 9, color: '#5a5a62' }}>осталось</div></div>
        </div>
        <div style={{ height: 6, background: '#25252c', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}><div style={{ height: '100%', width: progressPct + '%', background: catColor, borderRadius: 3 }} /></div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', fontSize: 10 }}>
          {def.countBased ? (
            <span style={{ color: catColor }}>✓ {completedSoFar}/{def.countGoal} тренировок выполнено</span>
          ) : (
            <>
              <span style={{ color: '#5adf5a' }}>✓ {successDays} выполнено</span>
              <span style={{ color: '#e05f4a' }}>✕ {missedSoFar}/{maxAllowed} пропущено</span>
            </>
          )}
          <span style={{ color: '#8a8a92' }}>День {elapsed}/{def.duration}</span>
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 6 }}>
          {dayResults.map((r, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: r === null ? '#25252c' : r ? '#3a8a3a' : def.countBased ? '#3a3a44' : '#8a3a3a' }} />))}
        </div>
      </div>
    );
  }

  // Active challenge compact card(s) — слот 1 + слот 2 (если разблокирован)
  const activeCompact = renderActiveCard(challengeState.active, challengeProgress, secondChallengeSlotUnlocked ? 'Слот 1' : null);
  const activeCompact2 = secondChallengeSlotUnlocked ? renderActiveCard(activeChallenge2, challengeProgress2, 'Слот 2') : null;

  // Разблокировка второго слота (500💎, одноразово)
  const secondSlotUnlockCard = !secondChallengeSlotUnlocked ? (
    <div style={{ background: '#1c1a12', border: '1.5px solid #4a3a1f', borderRadius: 14, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 22 }}>🔓</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#e0c070' }}>Второй слот вызова</div>
        <div style={{ fontSize: 10.5, color: '#8a7a52' }}>Держи 2 клятвы одновременно — одноразовая покупка</div>
      </div>
      <button onClick={onUnlockSecondSlot} disabled={currencyBalance < 500} style={{
        fontSize: 11.5, fontWeight: 800, padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e0c070',
        background: 'transparent', color: '#e0c070', cursor: currencyBalance < 500 ? 'not-allowed' : 'pointer', opacity: currencyBalance < 500 ? 0.5 : 1,
      }}>
        💎 500
      </button>
    </div>
  ) : null;

  // Level gate
  if (level < CHALLENGE_MIN_LEVEL) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Lock size={32} color="#4a4a52" />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#dcdce2', marginTop: 12 }}>Испытание духа</div>
        <div style={{ fontSize: 12, color: '#6a6a72', marginTop: 6 }}>Открывается на уровне {CHALLENGE_MIN_LEVEL}</div>
        <div style={{ fontSize: 11, color: '#4a4a52', marginTop: 4 }}>Текущий уровень: {level}</div>
      </div>
    );
  }

  // Challenge detail view
  if (detailId) {
    const def = CHALLENGE_CATALOG.find(c => c.id === detailId);
    if (!def) { setDetailId(null); return null; }
    const catDef = CHALLENGE_CATEGORIES.find(c => c.id === def.category);
    const CatIcon = catDef?.icon || Star;
    const alreadyCompleted = completedIds.has(def.id);
    const completions = (challengeState.completed || []).filter(c => c.id === def.id);

    return (
      <div>
        <button onClick={() => setDetailId(null)} style={{ background: 'none', border: 'none', color: '#8a8a92', fontSize: 12, cursor: 'pointer', marginBottom: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Назад к каталогу
        </button>

        <div style={{ background: '#1c1c22', border: '1.5px solid ' + (catDef?.color || '#e0a868') + '44', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: (catDef?.color || '#e0a868') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {def.icon ? <img src={def.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CatIcon size={22} color={catDef?.color || '#e0a868'} />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f4' }}>{def.name}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a92' }}>
                {def.duration} дней · {def.countBased ? `нужно ${def.countGoal} тренировок за этот срок` : `допуск: ${def.allowedMisses} пропуск(ов)`}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: '#aeaeb6', lineHeight: 1.6, marginBottom: 12 }}>{def.description}</div>
          <div style={{ fontSize: 11.5, color: '#6a6a72', fontStyle: 'italic', marginBottom: 18 }}>«{def.quote}»</div>

          {/* Rewards */}
          <div style={{ padding: '12px 14px', background: '#15151a', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#dcdce2', marginBottom: 6 }}>Награда</div>
            <div style={{ fontSize: 12, color: '#f0d272', display: 'flex', alignItems: 'center', gap: 4 }}>💎 {def.crystals} кристаллов</div>
            <div style={{ fontSize: 12, color: '#7adf5a', marginTop: 4 }}>⚡ {def.buff.name}: +{def.buff.xpBonusPct}% XP ({def.buff.scope === 'all' ? 'ко всему' : def.buff.scope}), {def.buff.days} дн.</div>
            {def.title && <div style={{ fontSize: 12, color: '#f5c84a', marginTop: 4 }}>👑 Титул: {def.title}</div>}
          </div>

          {/* Penalty */}
          <div style={{ padding: '10px 14px', background: '#1a1215', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#e05f4a', marginBottom: 4 }}>Штраф за провал</div>
            <div style={{ fontSize: 11, color: '#8a5a5a' }}>«Сломленная клятва» — −10% XP на 3 дня + кулдаун 3 дня</div>
          </div>

          {/* Completion history */}
          {completions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, color: '#6a6a72', marginBottom: 6 }}>Завершений: {completions.length}</div>
              {completions.map((c, i) => (
                <div key={i} style={{ fontSize: 11, color: '#5adf5a', marginBottom: 2 }}>
                  ✓ {new Date(c.completedDate).toLocaleDateString('ru-RU')} · Пропусков: {c.missedDays || 0}
                </div>
              ))}
            </div>
          )}

          {/* Action */}
          {canStart ? (
            <button onClick={() => { if (slot1Free) onStart(def.id); else onStart2(def.id); setDetailId(null); }} style={{
              width: '100%', padding: '13px', border: '1.5px solid #c08a2a', borderRadius: 10,
              background: 'linear-gradient(135deg, #3a2a10, #2a1e08)', color: '#f0d272',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
            }}>
              🔥 Принять вызов{secondChallengeSlotUnlocked ? (slot1Free ? ' (слот 1)' : ' (слот 2)') : ''}
            </button>
          ) : challengeState.active && !slot2Free ? (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#6a6a72', padding: '10px 0' }}>
              {secondChallengeSlotUnlocked ? 'Оба слота заняты' : 'У тебя уже есть активный вызов'}
            </div>
          ) : challengeCooldownDays > 0 ? (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#e05f4a', padding: '10px 0' }}>⏳ Кулдаун: {challengeCooldownDays} дн.</div>
          ) : null}
        </div>
      </div>
    );
  }

  // Catalog view
  const currentCat = selectedCategory || 'all';
  const filtered = currentCat === 'all' ? CHALLENGE_CATALOG : CHALLENGE_CATALOG.filter(c => c.category === currentCat);

  return (
    <div>
      {/* Buff/debuff banners */}
      {activeChallengeBuff && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#1a2a18', border: '1px solid #3a5a2a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color="#7adf5a" />
          <div style={{ fontSize: 11, color: '#7adf5a' }}>{activeChallengeBuff.name} +{activeChallengeBuff.xpBonusPct}% XP</div>
        </div>
      )}
      {challengeFailDebuff && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#2a1818', border: '1px solid #5a2a2a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skull size={14} color="#e05f4a" />
          <div style={{ fontSize: 11, color: '#e05f4a' }}>Сломленная клятва −10% XP · {challengeFailDebuff.daysLeft} дн.</div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Flame size={18} color="#e0a868" />
        <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f4' }}>Испытание духа</div>
        <div style={{ fontSize: 11, color: '#6a6a72', marginLeft: 'auto' }}>
          Завершено: {(challengeState.completed || []).length}
        </div>
      </div>

      {activeCompact}
      {activeCompact2}
      {secondSlotUnlockCard}

      {/* Active buff/debuff */}
      {activeChallengeBuff && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#1a2a18', border: '1px solid #3a5a2a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <Sparkles size={13} color="#7adf5a" />
          <span style={{ color: '#7adf5a', fontWeight: 700 }}>{activeChallengeBuff.name}</span>
          <span style={{ color: '#5a8a4a' }}>+{activeChallengeBuff.xpBonusPct}% XP</span>
        </div>
      )}
      {challengeFailDebuff && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#2a1818', border: '1px solid #5a2a2a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <Skull size={13} color="#e05f4a" />
          <span style={{ color: '#e05f4a', fontWeight: 700 }}>Сломленная клятва</span>
          <span style={{ color: '#8a4a4a' }}>{challengeFailDebuff.daysLeft} дн.</span>
        </div>
      )}
      {challengeCooldownDays > 0 && !challengeState.active && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#1a1a22', border: '1px solid #3a3a42', marginBottom: 10, fontSize: 11, color: '#8a8a92' }}>
          ⏳ Кулдаун после провала: {challengeCooldownDays} дн.
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 2 }}>
        <button onClick={() => setSelectedCategory(null)} style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          border: '1px solid', flexShrink: 0, whiteSpace: 'nowrap',
          background: currentCat === 'all' ? '#e0a86822' : '#15151a',
          borderColor: currentCat === 'all' ? '#e0a868' : '#2c2c34',
          color: currentCat === 'all' ? '#e0a868' : '#8a8a92',
        }}>Все</button>
        {CHALLENGE_CATEGORIES.map(cat => {
          const CIcon = cat.icon;
          return (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
              padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1px solid', flexShrink: 0, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4,
              background: currentCat === cat.id ? cat.color + '22' : '#15151a',
              borderColor: currentCat === cat.id ? cat.color : '#2c2c34',
              color: currentCat === cat.id ? cat.color : '#8a8a92',
            }}>
              <CIcon size={12} /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Challenge cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(ch => {
          const catDef = CHALLENGE_CATEGORIES.find(c => c.id === ch.category);
          const CIcon = catDef?.icon || Star;
          const done = completedIds.has(ch.id);
          const doneCount = (challengeState.completed || []).filter(c => c.id === ch.id).length;
          const durationLabel = ch.duration === 7 ? '7 дн.' : ch.duration === 14 ? '14 дн.' : '30 дн.';

          return (
            <button key={ch.id} onClick={() => setDetailId(ch.id)} style={{
              background: '#1c1c22', border: '1px solid ' + (catDef?.color || '#e0a868') + '33',
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: (catDef?.color || '#e0a868') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {ch.icon ? <img src={ch.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CIcon size={16} color={catDef?.color || '#e0a868'} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dcdce2', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ch.name}
                  {done && <Check size={12} color="#5adf5a" />}
                </div>
                <div style={{ fontSize: 10.5, color: '#6a6a72', marginTop: 2 }}>{ch.description}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: catDef?.color || '#e0a868' }}>{durationLabel}</div>
                <div style={{ fontSize: 10, color: '#f0d272', marginTop: 2 }}>💎 {ch.crystals}</div>
                {doneCount > 1 && <div style={{ fontSize: 9, color: '#5adf5a', marginTop: 1 }}>×{doneCount}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const ChallengeAchievementsSection = React.memo(function ChallengeAchievementsSection({ achievements }) {
  const unlocked = achievements.filter(a => a.unlocked);
  if (achievements.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #25252c' }}>
        <Trophy size={14} color="#f0d272" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#dcdce2' }}>Ачивки вызовов</span>
        <span style={{ fontSize: 10.5, color: '#6a6a72', marginLeft: 'auto' }}>{unlocked.length}/{achievements.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {achievements.filter(a => !a.secret || a.unlocked).map(ach => {
          const bg = ach.unlocked ? (ach.mythic ? '#33150f' : '#1a2a18') : '#1a1a22';
          const border = ach.unlocked ? (ach.mythic ? '#6a2a1a' : '#3a5a2a') : '#25252c';
          const textColor = ach.unlocked ? (ach.mythic ? '#f0574b' : '#5adf5a') : '#6a6a72';
          return (
            <div key={ach.id} style={{
              border: '1px solid ' + border, borderRadius: 10, padding: '10px 10px',
              background: bg, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: textColor }}>
                {ach.unlocked ? (ach.mythic ? '🌟' : '✓') : (ach.secret ? '🔒' : '○')} {ach.title}
              </div>
              <div style={{ fontSize: 10, color: '#6a6a72', lineHeight: 1.3 }}>{ach.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});


// ---------- ERROR BOUNDARY ----------
// Ловит любые падения рендера, чтобы вместо пустого белого/чёрного экрана
// показывать реальный текст ошибки — это сильно ускоряет отладку "пустой экран" багов.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('FitnessRPG crash:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0e0e13', color: '#e4e4ea',
          fontFamily: "'Inter', system-ui, sans-serif", padding: '24px 18px',
        }}>
          <div style={{ maxWidth: 640, margin: '40px auto', background: '#1c1414', border: '1.5px solid #6a2a2a', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#e08a8a', marginBottom: 10 }}>⚠️ Что-то сломалось</div>
            <div style={{ fontSize: 13, color: '#c0a0a0', marginBottom: 14, lineHeight: 1.5 }}>
              Приложение поймало ошибку рендера вместо того, чтобы показать пустой экран.
              Скопируй текст ниже и отправь разработчику — с ним чинится за минуту.
            </div>
            <pre style={{
              fontSize: 11.5, color: '#e0a8a8', background: '#0e0e13', border: '1px solid #3a2020',
              borderRadius: 8, padding: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
              {this.state.info?.componentStack ? '\n\nComponent stack:' + this.state.info.componentStack : ''}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 14, background: '#2a1a1a', border: '1.5px solid #6a3a3a', color: '#e0a8a8',
                borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
              }}
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}
