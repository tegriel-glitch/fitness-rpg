// ---------- ОБЩИЕ ХЕЛПЕРЫ: даты, стрики ----------

// ---------- HELPERS ----------

export function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function isConsecutiveStreak(dateStrings, blockedDatesSet) {
  // dateStrings: sorted unique array of 'YYYY-MM-DD', most recent first
  // blockedDatesSet (optional): dates that hard-break the streak, e.g. "Загул" days
  // (zero activity at all) or a violating "Читмил" (cheat meal sooner than the safe interval).
  if (dateStrings.length === 0) return 0;

  // A blocked date strictly after the most recent activity date (including today) resets the streak to 0
  // — e.g. last run was yesterday, but today was a Загул day.
  if (blockedDatesSet) {
    const mostRecent = new Date(dateStrings[0]);
    const today = new Date(dateKey(new Date()));
    const cursor = new Date(mostRecent);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= today) {
      if (blockedDatesSet.has(dateKey(cursor))) return 0;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (blockedDatesSet && blockedDatesSet.has(dateStrings[0])) return 0;

  let streak = 1;
  for (let i = 0; i < dateStrings.length - 1; i++) {
    const cur = new Date(dateStrings[i]);
    const next = new Date(dateStrings[i + 1]);
    const diff = (cur - next) / (1000 * 60 * 60 * 24);
    if (diff !== 1) break;
    // A blocked date can coincide with cur itself (e.g. a violating cheat meal logged
    // on the same day as a nutrition log) — treat that day as breaking the streak too.
    if (blockedDatesSet && blockedDatesSet.has(dateStrings[i])) break;
    streak++;
  }
  return streak;
}

// Returns the set of 'YYYY-MM-DD' dates strictly between the earliest and latest activity logs
// (inclusive of latest) that have zero activity logs at all — i.e. "Загул" days.
export function computeZeroActivityDays(allActivityDates, stepsDates) {
  // stepsDates: Set of dates where 3000+ steps were logged (breaks apathy)
  const result = new Set();
  if (allActivityDates.length === 0) return result;
  const sorted = [...allActivityDates].sort();
  const earliest = new Date(sorted[0]);
  const today = new Date();
  const loggedSet = new Set(allActivityDates);
  const stepsBreakSet = stepsDates || new Set();
  const cursor = new Date(earliest);
  while (cursor <= today) {
    const key = dateKey(cursor);
    if (!loggedSet.has(key) && !stepsBreakSet.has(key)) result.add(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function getWeekKey(d) {
  const date = new Date(d);
  const day = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() - day + 1); // Monday of that week
  return dateKey(date);
}

