// ---------- MAIL SYSTEM: системные и игровые сообщения ----------
import { sbFetch } from './supabaseClient';

// ---------- MAIL SYSTEM ----------
export async function dbLoadMessages(nickname) {
  try {
    const res = await sbFetch(`messages?to_nickname=eq.${encodeURIComponent(nickname)}&order=created_at.desc&limit=100`);
    if (!res.ok) return [];
    return await res.json();
  } catch (_) { return []; }
}
export async function dbSendMessage(from, to, text, fromDisplayName, systemType = null) {
  try {
    await sbFetch('messages', {
      method: 'POST',
      body: JSON.stringify({ from_nickname: from, to_nickname: to, from_display_name: fromDisplayName || from, message: text, system_type: systemType }),
    });
    // FIFO: держим не больше 100 сообщений на получателя — старые за пределами лимита удаляем.
    trimMailboxToLimit(to).catch(() => {});
  } catch (_) {}
}
export async function trimMailboxToLimit(to, limit = 100) {
  const res = await sbFetch(`messages?to_nickname=eq.${encodeURIComponent(to)}&select=id&order=created_at.desc`);
  if (!res.ok) return;
  const rows = await res.json();
  if (rows.length <= limit) return;
  const staleIds = rows.slice(limit).map(r => r.id);
  await dbDeleteMessages(staleIds);
}
export async function dbMarkMessageRead(messageId) {
  try { await sbFetch(`messages?id=eq.${messageId}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }); } catch (_) {}
}
export async function dbMarkAllRead(nickname) {
  try { await sbFetch(`messages?to_nickname=eq.${encodeURIComponent(nickname)}&read=eq.false`, { method: 'PATCH', body: JSON.stringify({ read: true }) }); } catch (_) {}
}
export async function dbDeleteMessages(ids) {
  if (!ids.length) return;
  try {
    const idStr = ids.map(id => `"${id}"`).join(',');
    await sbFetch(`messages?id=in.(${idStr})`, { method: 'DELETE' });
  } catch (_) {}
}

export const STREAK_WARNING_TEXTS = {
  running:   ['🏔 Горы зовут, следопыт! Твой беговой стрик в опасности!', '🌪 Дорога рождается под ногами бегущего. Не останавливайся!'],
  nutrition: ['🍜 Рис стынет, монах. Твой стрик питания может рухнуть!', '⚖️ Баланс на кону — закрой питание сегодня!'],
  sleep:     ['🌙 Луна уже высоко. Шаман, твой стрик сна в опасности!', '💤 Духи предков шепчут: «Ложись спать вовремя!»'],
  reading:   ['📜 Древний свиток пылится. Архимаг, твой стрик чтения под угрозой!', '📚 Знание не ждёт — открой книгу, пока стрик не рассыпался!'],
};
export const LEVEL_UP_TEXTS = [
  '⚡ Сила нарастает! Ты достиг {level} уровня!',
  '🌟 Путь продолжается — {level} уровень открывает новые горизонты!',
  '🔥 {level} уровень! Враги содрогаются при упоминании твоего имени!',
];


