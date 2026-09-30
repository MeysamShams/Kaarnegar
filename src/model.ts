import jalaali from 'jalaali-js';
export type Segment = { start: number; end: number };
export type Entry = { id: string; title: string; date: string; durationMs: number; rate: number; source: 'manual' | 'timer'; createdAt: number };
export type Active = { id: string; title: string; rate: number; segments: Segment[]; runningSince: number | null };
export type State = { version: 1; rate: number; name: string; entries: Entry[]; active: Active | null };
export const emptyState: State = { version: 1, rate: 0, name: '', entries: [], active: null };
export const months = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
export const number = (n: number) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(n);
export const digits = (s: string) => s.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
export const latin = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,٬\s]/g, '');
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function fromDate(value: string) { return new Date(value + 'T12:00:00'); }
export function jalaliParts(value: string) { return jalaali.toJalaali(fromDate(value)); }
export function gregorian(jy: number, jm: number, jd: number) { const g = jalaali.toGregorian(jy,jm,jd); return localDate(new Date(g.gy,g.gm-1,g.gd,12)); }
export function dateLabel(value: string, long = false) { const p = jalaliParts(value); return long ? `${number(p.jd)} ${months[p.jm-1]} ${digits(String(p.jy))}` : digits(`${p.jy}/${String(p.jm).padStart(2,'0')}/${String(p.jd).padStart(2,'0')}`); }
export function duration(ms: number, seconds = false) { const s = Math.floor(ms / 1000); return digits(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}${seconds ? ':' + String(s%60).padStart(2,'0') : ''}`); }
export function activeDuration(a: Active | null, now = Date.now()) { return a ? a.segments.reduce((n,s) => n+s.end-s.start,0) + (a.runningSince === null ? 0 : Math.max(0,now-a.runningSince)) : 0; }
export function checkpoint(a: Active, now = Date.now()): Active { return a.runningSince === null ? a : { ...a, segments: [...a.segments, { start: a.runningSince, end: Math.max(a.runningSince, now) }], runningSince: now }; }
export function pauseActive(a: Active, now = Date.now()): Active { return { ...checkpoint(a,now), runningSince: null }; }
export function finishActive(a: Active, now = Date.now()): Entry[] {
  const sums = new Map<string,number>();
  for (const segment of pauseActive(a,now).segments) {
    let cursor = segment.start;
    while (cursor < segment.end) {
      const d = new Date(cursor), key = localDate(d);
      const midnight = new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime();
      const end = Math.min(midnight,segment.end);
      sums.set(key,(sums.get(key)||0)+end-cursor); cursor=end;
    }
  }
  return [...sums].map(([date,durationMs]) => ({ id: `${a.id}-${date}`, title: a.title, date, durationMs, rate: a.rate, source: 'timer', createdAt: now }));
}
export function rangePreset(preset: string, now = new Date()): [string,string] {
  const today = localDate(now);
  if (preset === 'today') return [today,today];
  if (preset === 'week') { const start = new Date(now); start.setDate(start.getDate()-((start.getDay()+1)%7)); return [localDate(start),today]; }
  const j = jalaliParts(today); return [gregorian(j.jy,j.jm,1),gregorian(j.jy,j.jm,jalaali.jalaaliMonthLength(j.jy,j.jm))];
}
export function totals(entries: Entry[]) { return { ms: entries.reduce((n,e)=>n+e.durationMs,0), amount: entries.reduce((n,e)=>n+e.durationMs/3600000*e.rate,0), tasks: new Set(entries.map(e=>e.title)).size }; }
export function filtered(entries: Entry[], start: string, end: string, query = '') { return entries.filter(e=>e.date>=start && e.date<=end && e.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt); }
export function groupTasks(entries: Entry[]) { const map = new Map<string,Entry[]>(); entries.forEach(e=>map.set(e.title,[...(map.get(e.title)||[]),e])); return [...map].map(([title,items])=>({title,...totals(items)})).sort((a,b)=>b.ms-a.ms); }
