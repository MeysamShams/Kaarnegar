const finite = (x, max = Number.MAX_SAFE_INTEGER) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max;
const title = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 200;
function validate(s) {
  if (!s || s.version !== 1 || !finite(s.rate, 1e12) || !Array.isArray(s.entries) || s.entries.length > 100000 || typeof s.name !== 'string' || s.name.length > 100) throw Error('ساختار فایل معتبر نیست.');
  const ids = new Set();
  for (const e of s.entries) {
    if (!e || typeof e.id !== 'string' || ids.has(e.id) || !title(e.title) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !finite(e.durationMs, 86400000) || !finite(e.rate, 1e12) || !finite(e.createdAt) || !['timer','manual'].includes(e.source)) throw Error('اطلاعات ثبت‌شده معتبر نیست.');
    const d = new Date(e.date + 'T12:00:00');
    if (!Number.isFinite(d.getTime()) || [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-') !== e.date) throw Error('تاریخ معتبر نیست.');
    ids.add(e.id);
  }
  if (s.active !== null) {
    const a = s.active;
    if (!a || typeof a.id !== 'string' || !title(a.title) || !finite(a.rate, 1e12) || !Array.isArray(a.segments) || a.segments.length > 100000 || !(a.runningSince === null || finite(a.runningSince)) || !a.segments.every(v => finite(v.start) && finite(v.end) && v.end >= v.start)) throw Error('زمان‌سنج معتبر نیست.');
  }
  return s;
}
module.exports = { validate };
