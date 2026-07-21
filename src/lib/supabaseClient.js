// ---------- SUPABASE: клиент и функции работы с players ----------
import { SAVEABLE_FIELDS } from '../game/saveableFields';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// ---------- SUPABASE ----------
export const SUPABASE_URL = 'https://zwtzqtdtbbxeebiyaesj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dHpxdGR0YmJ4ZWViaXlhZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMTQwMTQsImV4cCI6MjA5ODU5MDAxNH0.PsxufVIfo_ifO3tKizCujdo1j5J_2mZAuwrewlQRoso';

export function sbFetch(path, options = {}) {
  return fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers,
    },
  });
}

// Load a player's full profile by nickname. Returns null if not found.
export async function dbLoadPlayer(nickname) {
  const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(nickname)}&limit=1`);
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Create a brand-new player row with empty state.
export async function dbCreatePlayer(nickname) {
  const res = await sbFetch('players', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Persist the full profile snapshot for a player.
export async function dbSavePlayer(nickname, snapshot, opts = {}) {
  // Самолечение: если Supabase отвечает PGRST204 "Could not find the 'X' column",
  // это значит вся таблица players ещё не мигрирована под новое поле — PostgREST
  // отклоняет ВЕСЬ PATCH целиком, даже если остальные 40+ полей валидны.
  // Вырезаем упомянутую колонку из тела и повторяем — так новые фичи не роняют
  // сохранение логов/статов для всех игроков разом, пока миграция не докатится.
  let body = { ...snapshot };
  const attemptedRemovals = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    const payload = JSON.stringify(body);
    const wantKeepalive = !!opts.keepalive;
    const safeForKeepalive = payload.length < 60000; // 60 KB с запасом от 64 KB лимита keepalive
    const useKeepalive = wantKeepalive && safeForKeepalive;
    try {
      const res = await sbFetch(`players?nickname=eq.${encodeURIComponent(nickname)}`, {
        method: 'PATCH',
        body: payload,
        keepalive: useKeepalive,
      });
      if (res.ok) {
        if (attemptedRemovals.length > 0) {
          console.error('[FitnessRPG] save succeeded AFTER dropping missing columns:', attemptedRemovals.join(', '), '— добавь их в схему БД!');
        }
        return true;
      }
      const errText = await res.text().catch(() => '');
      console.error('[FitnessRPG] save FAILED:', res.status, errText);
      // PGRST204: "Could not find the 'col_name' column of 'players' in the schema cache"
      const m = errText.match(/Could not find the '([^']+)' column/);
      if (res.status === 400 && m && body[m[1]] !== undefined) {
        delete body[m[1]];
        attemptedRemovals.push(m[1]);
        continue; // retry без этой колонки
      }
      return false; // необрабатываемая ошибка
    } catch (e) {
      console.error('[FitnessRPG] save exception:', e.message, '| keepalive:', useKeepalive);
      if (useKeepalive) {
        // keepalive мог упасть из-за размера тела — повтор без keepalive
        try {
          const res2 = await sbFetch(`players?nickname=eq.${encodeURIComponent(nickname)}`, {
            method: 'PATCH', body: payload, keepalive: false,
          });
          if (res2.ok) return true;
          console.error('[FitnessRPG] save retry FAILED:', res2.status);
        } catch (e2) { console.error('[FitnessRPG] save retry exception:', e2.message); }
      }
      return false;
    }
  }
  console.error('[FitnessRPG] save gave up after removing columns:', attemptedRemovals.join(', '));
  return false;
}

// Колонки для вкладки "Гильдия" — генерируются из SAVEABLE_FIELDS (game/saveableFields.js),
// где guildVisible: true отмечает, какие поля игрока видны остальным.
// Раньше список был продублирован тут вручную — забытое поле означало,
// что новая фича молча не появлялась в профилях гильдии.
const GUILD_SELECT_COLUMNS = [
  'nickname', 'raids', 'current_level',
  ...SAVEABLE_FIELDS.filter((f) => f.guildVisible).map((f) => f.column),
].join(',');

// Fetch all players except the current one (for the Guild tab).
export async function dbLoadGuildMembers(excludeNickname) {
  const res = await sbFetch(`players?nickname=neq.${encodeURIComponent(excludeNickname)}&select=${GUILD_SELECT_COLUMNS}`);
  if (!res.ok) {
    // Раньше ошибка тихо проглатывалась (пустой список гильдии без единого следа в консоли).
    // Логируем причину — например, если в таблице ещё нет одной из новых колонок (400 от PostgREST),
    // это сразу будет видно в консоли браузера вместо "гильдия пуста" без объяснений.
    console.error('dbLoadGuildMembers failed:', res.status, await res.text().catch(() => ''));
    return [];
  }
  return await res.json();
}

