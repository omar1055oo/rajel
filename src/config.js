export const CONFIG = {
  TYPE_FACTOR: { review: 0.8, reading: 1.0, problems: 1.2, memorize: 1.3 }, // معامل نوع المهمة
  ACTUAL_TIME_CAP: 1.5,                // النقاط ماتزيدش عن (الوقت الفعلي × 1.5)
  EFFICIENCY_RATIO: 0.8,               // لو خلصت في 80% من التقدير أو أقل
  EFFICIENCY_BONUS: 0.10,              // بونص كفاءة +10%
  MIN_ACTUAL_SECONDS: 60,              // أقل من دقيقة فعلية = صفر نقاط
  SESSION_FULL_BONUS: 0.20,            // نسبة إنجاز 100% = +20%
  SESSION_PARTIAL_BONUS: 0.10,         // نسبة إنجاز 70% فأكتر = +10%
  SESSION_PARTIAL_THRESHOLD: 0.7,
  SESSION_WINNER_BONUS: 0.05,          // أعلى نسبة إنجاز في الجلسة = +5% إضافية
  SESSION_MIN_FOCUS_RATIO: 0.5,        // لو وقت التركيز أقل من 50% من وقت الجلسة مفيش بونص
  DAILY_GOAL_MINUTES: 120,             // هدف يومي بالدقايق (يتغير من الإعدادات)
  STREAK_STEP: 0.02,                   // كل يوم متتالي +2%
  STREAK_MAX: 0.20,                    // حد أقصى +20%
  DAILY_POINTS_CAP: 600,               // سقف نقاط المهام في اليوم
  HEARTBEAT_SECONDS: 30,               // تحديث "آخر ظهور"
  ONLINE_THRESHOLD_SECONDS: 90,        // لو lastSeen أقدم من كده يبقى أوفلاين
  QUICK_MESSAGES: [
    "رايح أصلي وجاي",
    "هشرب شاي وراجع",
    "وقفت شوية",
    "رجعت",
    "خلصت!"
  ]
};
