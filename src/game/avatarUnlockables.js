// ---------- ОТКРЫВАЕМЫЕ АВАТАРКИ ПО КЛАССАМ ----------
// Доступны только тому, кто закрепил соответствующий класс (lockedClassId).
// Первые AVATAR_UNLOCK_FREE_COUNT открыты сразу при выборе класса.
// Остальные открываются последовательно каждые AVATAR_UNLOCK_THRESHOLD_STEP очков
// суммы двух характеристик класса (например, у Берсерка — Сила + Упорство).
// Порядок картинок внутри класса не имеет игрового значения — какая идёт за какой,
// не принципиально.
export const AVATAR_UNLOCK_FREE_COUNT = 3;
export const AVATAR_UNLOCK_THRESHOLD_STEP = 50;

export function avatarUnlockThreshold(indexInClass) {
  if (indexInClass < AVATAR_UNLOCK_FREE_COUNT) return 0;
  return (indexInClass - AVATAR_UNLOCK_FREE_COUNT + 1) * AVATAR_UNLOCK_THRESHOLD_STEP;
}

function buildClassList(classId, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `unlock_${classId}_${i}`,
    name: `${classId}_${i + 1}`,
    src: `/icons/unlockables/${classId}/${i}.webp`,
    classId,
    threshold: avatarUnlockThreshold(i),
  }));
}

export const AVATAR_UNLOCKABLES = {
  pathfinder: buildClassList('pathfinder', 9),
  berserker: buildClassList('berserker', 10),
  battlemaster: buildClassList('battlemaster', 6),
  monk: buildClassList('monk', 5),
  shaman: buildClassList('shaman', 5),
  archmage: buildClassList('archmage', 10),
};
