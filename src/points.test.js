import { describe, it, expect } from 'vitest';
import { taskPoints, applyDailyCap, settleSession, streakBonus, nextStreak, currentStreak } from './points.js';

const T = (est, type, min) => taskPoints({ estMinutes: est, type, actualSeconds: min * 60 });

describe('taskPoints', () => {
  it('خلصت في الوقت', () => expect(T(60, 'reading', 60)).toEqual({ planned: 60, task: 60, efficiency: 0 }));
  it('أسرع بكتير', () => {
    const p = T(60, 'reading', 40); // 40 <= 48 => بونص
    expect(p.task).toBe(60);
    expect(p.efficiency).toBe(6);
  });
  it('تضخيم التقدير مش بيفيد', () => expect(T(100, 'reading', 20).task).toBe(30));
  it('أبطأ من التقدير: النقاط كاملة من غير خصم', () => expect(T(30, 'problems', 90)).toEqual({ planned: 36, task: 36, efficiency: 0 }));
  it('أقل من دقيقة', () => expect(taskPoints({ estMinutes: 30, type: 'reading', actualSeconds: 59 }).task).toBe(0));
  it('السقف اليومي', () => {
    expect(applyDailyCap(590, { task: 60, efficiency: 6 })).toEqual({ task: 10, efficiency: 0 });
    expect(applyDailyCap(600, { task: 60, efficiency: 6 })).toEqual({ task: 0, efficiency: 0 });
    expect(applyDailyCap(0, { task: 60, efficiency: 6 })).toEqual({ task: 60, efficiency: 6 });
  });
});

const M = (planned, done, awarded, focus) => ({ plannedPoints: planned, donePlannedPoints: done, awardedPoints: awarded, focusSeconds: focus });

describe('settleSession', () => {
  const D = 3600;
  it('الاتنين 100%: بونص كامل ومحدش ياخد بونص الأعلى', () => {
    const r = settleSession({ durationSeconds: D, members: { a: M(100, 100, 100, 3000), b: M(50, 50, 50, 3000) } });
    expect(r).toEqual({ a: 20, b: 10 });
  });
  it('واحد 100% والتاني 80%', () => {
    const r = settleSession({ durationSeconds: D, members: { a: M(100, 100, 100, 3000), b: M(100, 80, 80, 3000) } });
    expect(r).toEqual({ a: 25, b: 8 });
  });
  it('واحد أقل من 70%', () => {
    const r = settleSession({ durationSeconds: D, members: { a: M(100, 100, 100, 3000), b: M(100, 60, 60, 3000) } });
    expect(r).toEqual({ a: 25, b: 0 });
  });
  it('تركيز أقل من 50%: مفيش أي بونص', () => {
    const r = settleSession({ durationSeconds: D, members: { a: M(100, 100, 100, 1000), b: M(100, 80, 80, 3000) } });
    expect(r).toEqual({ a: 0, b: 8 });
  });
});

describe('streak', () => {
  it('بونص السلسلة بحد أقصى', () => {
    expect(streakBonus({ dayPoints: 200, streak: 3 })).toBe(12);
    expect(streakBonus({ dayPoints: 200, streak: 30 })).toBe(40);
  });
  it('تكرار وفوات يوم', () => {
    expect(nextStreak('2026-10-26', 4, '2026-10-26', '2026-10-25')).toBe(4);
    expect(nextStreak('2026-10-25', 4, '2026-10-26', '2026-10-25')).toBe(5);
    expect(nextStreak('2026-10-20', 4, '2026-10-26', '2026-10-25')).toBe(1);
    expect(currentStreak({ streak: 4, lastGoalDate: '2026-10-20' }, '2026-10-26', '2026-10-25')).toBe(0);
  });
});
