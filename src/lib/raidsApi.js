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
    if (!res.ok) return {};
    const rows = await res.json();
    const map = {};
    rows.forEach(r => { map[r.boss_id] = raidRowToObj(r); });
    return map;
  } catch (_) { return {}; }
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
    await sbFetch('raids?on_conflict=boss_id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
  } catch (_) {}
}

export async function dbDeleteRaid(bossId) {
  try {
    await sbFetch(`raids?boss_id=eq.${encodeURIComponent(bossId)}`, { method: 'DELETE' });
  } catch (_) {}
}

