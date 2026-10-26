// منطق النقاط كله هنا: دوال نقية من غير Firebase.
import { CONFIG } from './config.js';

const r = Math.round;

export function plannedPoints(estMinutes, type, cfg = CONFIG) {
  return r(estMinutes * cfg.TYPE_FACTOR[type]);
}

export function efficiencyBonus({ estMinutes, actualMinutes, task }, cfg = CONFIG) {
  return actualMinutes <= estMinutes * cfg.EFFICIENCY_RATIO ? r(task * cfg.EFFICIENCY_BONUS) : 0;
}

export function taskPoints({ estMinutes, type, actualSeconds }, cfg = CONFIG) {
  const f = cfg.TYPE_FACTOR[type];
  const planned = r(estMinutes * f);
  if (!(actualSeconds >= cfg.MIN_ACTUAL_SECONDS)) return { planned, task: 0, efficiency: 0 };
  const actualMinutes = actualSeconds / 60;
  const task = actualMinutes > estMinutes
    ? planned
    : r(Math.min(estMinutes, actualMinutes * cfg.ACTUAL_TIME_CAP) * f);
  const efficiency = efficiencyBonus({ estMinutes, actualMinutes, task }, cfg);
  return { planned, task, efficiency };
}

// alreadyToday = نقاط المهام اللي اتحسبت النهارده قبل دي
export function applyDailyCap(alreadyToday, { task, efficiency }, cfg = CONFIG) {
  const room = Math.max(0, cfg.DAILY_POINTS_CAP - alreadyToday);
  const t = Math.min(task, room);
  const e = Math.min(efficiency, room - t);
  return { task: t, efficiency: e };
}

// members[uid] = { plannedPoints, donePlannedPoints, awardedPoints, focusSeconds }
// بترجّع { uid: مبلغ بونص الجلسة }
export function settleSession({ durationSeconds, members }, cfg = CONFIG) {
  const uids = Object.keys(members);
  const ratio = {};
  for (const u of uids) {
    const m = members[u];
    ratio[u] = m.plannedPoints > 0 ? Math.min(1, m.donePlannedPoints / m.plannedPoints) : 0;
  }
  const top = Math.max(...uids.map((u) => ratio[u]));
  const leaders = uids.filter((u) => ratio[u] === top);
  const winner = leaders.length === 1 && top > 0 ? leaders[0] : null;
  const out = {};
  for (const u of uids) {
    const m = members[u];
    const focusOk = durationSeconds <= 0 || (m.focusSeconds || 0) / durationSeconds >= cfg.SESSION_MIN_FOCUS_RATIO;
    let pct = 0;
    if (focusOk) {
      if (ratio[u] >= 1) pct += cfg.SESSION_FULL_BONUS;
      else if (ratio[u] >= cfg.SESSION_PARTIAL_THRESHOLD) pct += cfg.SESSION_PARTIAL_BONUS;
      if (u === winner) pct += cfg.SESSION_WINNER_BONUS;
    }
    out[u] = r(m.awardedPoints * pct);
  }
  return out;
}

export function streakBonus({ dayPoints, streak }, cfg = CONFIG) {
  return r(dayPoints * Math.min(cfg.STREAK_MAX, streak * cfg.STREAK_STEP));
}

// السلسلة الجديدة لما الهدف يتحقق النهارده
export function nextStreak(lastGoalDate, streak, today, yesterday) {
  if (lastGoalDate === today) return streak;
  return lastGoalDate === yesterday ? (streak || 0) + 1 : 1;
}

// السلسلة المعروضة: بتتصفّر لو فات يوم
export function currentStreak(user, today, yesterday) {
  return user && (user.lastGoalDate === today || user.lastGoalDate === yesterday) ? user.streak || 0 : 0;
}
