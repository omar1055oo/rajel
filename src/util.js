const z = (n) => String(n).padStart(2, '0');
export const todayStr = (d = new Date()) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
export const daysAgoStr = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return todayStr(d); };
export const ms = (t) => (t ? (t.toMillis ? t.toMillis() : +t) : 0);
export function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h ? h + ':' : '') + z(m) + ':' + z(s);
}
export const TYPE_LABEL = { review: 'مراجعة', reading: 'قراءة', problems: 'مسائل', memorize: 'حفظ' };
export const STATUS_LABEL = { studying: 'بيذاكر', idle: 'فاضي', away: 'بره شوية' };
export function sinceText(t, now) {
  const s = Math.floor((now - ms(t)) / 1000);
  if (!ms(t)) return 'مفيش بيانات';
  if (s < 60) return 'من شوية';
  if (s < 3600) return `من ${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `من ${Math.floor(s / 3600)} ساعة`;
  return `من ${Math.floor(s / 86400)} يوم`;
}
