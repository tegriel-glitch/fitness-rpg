// ---------- SHARED RAIDS: общая таблица рейдов, видна всей гильдии ----------
import { sbFetch } from './supabaseClient';

// ---------- SHARED RAIDS (single table, one row per boss, visible to the whole guild) ----------
export function raidRowToObj(r) {
  return {
    status: r.status,
    startDate: r.start_date,
    startClassId: r.start_class_id,
    participants: r.participants || [],
    contributions: r.contributions || [],
    defeatPenaltyApplied: r.defeat_penalty_applied || false,
    lootGrantedTo: r.loot_granted_to || [],
  };
}

export async function dbLoadAllRaids() {
  try {
    const res = await sbFetch('raids?select=*');
    if (!res.ok) {
      // Раньше здесь просто return {} без единого следа в консоли — рейды "молча"
      // выглядели пустыми, не отличить от "рейдов правда нет" на глаз.
      console.error('dbLoadAllRaids failed:', res.status, await res.text().catch(() => ''));
      return {};
    }
    const rows = await res.json();
    const map = {};
    rows.forEach(r => { map[r.boss_id] = raidRowToObj(r); });
    return map;
  } catch (e) {
    console.error('dbLoadAllRaids exception:', e.message);
    return {};
  }
}

export async function dbSaveRaid(bossId, raidObj) {
  const payload = {
    boss_id: bossId,
    status: raidObj.status,
    start_date: raidObj.startDate,
    start_class_id: raidObj.startClassId,
    participants: raidObj.participants,
    contributions: raidObj.contributions,
    defeat_penalty_applied: raidObj.defeatPenaltyApplied || false,
    loot_granted_to: raidObj.lootGrantedTo || [],
    updated_at: new Date().toISOString(),
  };
  try {
    const res = await sbFetch('raids?on_conflict=boss_id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    // Раньше ответ вообще не проверялся — PostgREST мог тихо отклонить весь payload
    // (например, если в таблице raids ещё нет одной из колонок), и прогресс рейда
    // "терялся" без единой ошибки, как это уже было с players.
    if (!res.ok) {
      console.error('dbSaveRaid failed:', bossId, res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('dbSaveRaid exception:', bossId, e.message);
  }
}

export async function dbDeleteRaid(bossId) {
  try {
    const res = await sbFetch(`raids?boss_id=eq.${encodeURIComponent(bossId)}`, { method: 'DELETE' });
    if (!res.ok) {
      console.error('dbDeleteRaid failed:', bossId, res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('dbDeleteRaid exception:', bossId, e.message);
  }
}
