import jalaali from 'jalaali-js';
import { language } from './i18n';
export const currencies=['IRT','IRR','USD','EUR','GBP','CAD','AUD','AED','CHF','JPY','TRY'] as const;
export type Currency=typeof currencies[number];
export type Organization = { id:string; name:string; rate:number; currency:Currency };
export type Project = { id:string; organizationId:string; name:string; rate:number|null };
export type Segment = { start: number; end: number };
export type Entry = { id: string; title: string; date: string; durationMs: number; rate: number; currency?:Currency; organizationId?:string; projectId?:string|null; source: 'manual' | 'timer'; createdAt: number };
export type Active = { id: string; title: string; rate: number; currency?:Currency; organizationId?:string; projectId?:string|null; segments: Segment[]; runningSince: number | null };
export type State = { version: 1; rate: number; name: string; organizations:Organization[]; projects:Project[]; entries: Entry[]; active: Active | null };
export const emptyState: State = { version: 1, rate: 0, name: '', organizations:[], projects:[], entries: [], active: null };
export function migrateState(s:State):State {
  if (s.organizations && s.projects) return s;
  const hasHistory = s.entries.length > 0 || !!s.active;
  return {...s, organizations:hasHistory?[{id:'legacy-organization',name:'General',rate:s.rate,currency:'IRT'}]:[], projects:[], entries:s.entries.map(e=>({...e,organizationId:'legacy-organization',projectId:null,currency:'IRT'})), active:s.active?{...s.active,organizationId:'legacy-organization',projectId:null,currency:'IRT'}:null};
}
export function effectiveRate(s:State, organizationId:string, projectId:string|null) {
  const org=s.organizations.find(o=>o.id===organizationId);
  if (!org) throw Error('Organization is required');
  const project=projectId?s.projects.find(p=>p.id===projectId&&p.organizationId===organizationId):null;
  if (projectId&&!project) throw Error('Project does not belong to this organization');
  return project?.rate??org.rate;
}
export const months = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
export const number = (n: number) => new Intl.NumberFormat(language()==='en'?'en-US':'fa-IR', { maximumFractionDigits: 0 }).format(n);
export function money(value:number,currency:Currency='IRT') { return new Intl.NumberFormat(language()==='en'?'en-US':'fa-IR',{maximumFractionDigits:['IRT','IRR','JPY'].includes(currency)?0:2}).format(value)+' '+currency; }
export function currencyTotals(entries:Entry[]) { const amounts=new Map<Currency,number>();for(const e of entries){const c=e.currency??'IRT';amounts.set(c,(amounts.get(c)??0)+e.durationMs/3600000*e.rate)}return [...amounts].sort(([a],[b])=>a.localeCompare(b)); }
export function moneySummary(entries:Entry[]) { return currencyTotals(entries).map(([c,n])=>money(n,c)).join(' · ')||'—'; }
export const digits = (s: string) => language()==='en'?s:s.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
export const latin = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,٬\s]/g, '');
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function fromDate(value: string) { return new Date(value + 'T12:00:00'); }
export function jalaliParts(value: string) { return jalaali.toJalaali(fromDate(value)); }
export function gregorian(jy: number, jm: number, jd: number) { const g = jalaali.toGregorian(jy,jm,jd); return localDate(new Date(g.gy,g.gm-1,g.gd,12)); }
export function dateLabel(value: string, long = false) { if(language()==='en')return long?new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric'}).format(fromDate(value)):value;const p = jalaliParts(value); return long ? `${number(p.jd)} ${months[p.jm-1]} ${digits(String(p.jy))}` : digits(`${p.jy}/${String(p.jm).padStart(2,'0')}/${String(p.jd).padStart(2,'0')}`); }
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
  return [...sums].map(([date,durationMs]) => ({ id: `${a.id}-${date}`, title: a.title, date, durationMs, rate: a.rate, currency:a.currency??'IRT', organizationId:a.organizationId, projectId:a.projectId??null, source: 'timer', createdAt: now }));
}
export function rangePreset(preset: string, now = new Date()): [string,string] {
  const today = localDate(now);
  if (preset === 'today') return [today,today];
  if (preset === 'week') { const start = new Date(now); start.setDate(start.getDate()-((start.getDay()+(language()==='en'?6:1))%7)); return [localDate(start),today]; }
  if(language()==='en')return [localDate(new Date(now.getFullYear(),now.getMonth(),1)),localDate(new Date(now.getFullYear(),now.getMonth()+1,0))];
  const j = jalaliParts(today); return [gregorian(j.jy,j.jm,1),gregorian(j.jy,j.jm,jalaali.jalaaliMonthLength(j.jy,j.jm))];
}
export function totals(entries: Entry[]) { return { ms: entries.reduce((n,e)=>n+e.durationMs,0), amount: entries.reduce((n,e)=>n+e.durationMs/3600000*e.rate,0), tasks: new Set(entries.map(e=>e.title)).size }; }
export function filtered(entries: Entry[], start: string, end: string, query = '', organizationId='', projectId='') { return entries.filter(e=>e.date>=start && e.date<=end && (!organizationId||e.organizationId===organizationId) && (!projectId||e.projectId===projectId) && e.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt); }
export function groupTasks(entries: Entry[]) { const map = new Map<string,Entry[]>(); entries.forEach(e=>map.set(e.title,[...(map.get(e.title)||[]),e])); return [...map].map(([title,items])=>({title,...totals(items)})).sort((a,b)=>b.ms-a.ms); }
