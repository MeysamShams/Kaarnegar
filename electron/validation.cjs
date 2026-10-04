const finite = (x, max = Number.MAX_SAFE_INTEGER) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max;
const title = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 200;
const currencies=['IRT','IRR','USD','EUR','GBP','CAD','AUD','AED','CHF','JPY','TRY'];
const validSegments = segments => Array.isArray(segments) && segments.length <= 100000 && segments.every((v,i) => v && finite(v.start,8640000000000000) && finite(v.end,8640000000000000) && v.end >= v.start && (i === 0 || v.start >= segments[i-1].end));
function validate(s) {
  if (!s || s.version !== 1 || !finite(s.rate, 1e12) || !Array.isArray(s.entries) || s.entries.length > 100000 || typeof s.name !== 'string' || s.name.length > 100) throw Error('ساختار فایل معتبر نیست.');
  if (s.organizations === undefined && s.projects === undefined) {
    const hasHistory = s.entries.length > 0 || !!s.active;
    s.organizations = hasHistory ? [{ id:'legacy-organization', name:'General', rate:s.rate, currency:'IRT' }] : [];
    s.projects = [];
    s.entries = s.entries.map(e=>({...e,organizationId:'legacy-organization',projectId:null,currency:'IRT'}));
    if(s.active)s.active={...s.active,organizationId:'legacy-organization',projectId:null,currency:'IRT'};
  }
  if(!Array.isArray(s.organizations)||!Array.isArray(s.projects)||s.organizations.length>10000||s.projects.length>50000)throw Error('Invalid organizations or projects');
  const organizations=new Set(), projects=new Map();
  for(const o of s.organizations){if(!o||!title(o.id)||organizations.has(o.id)||!title(o.name)||!finite(o.rate,1e12)||!currencies.includes(o.currency))throw Error('Invalid organization');organizations.add(o.id)}
  for(const p of s.projects){if(!p||!title(p.id)||projects.has(p.id)||!title(p.name)||!organizations.has(p.organizationId)||!(p.rate===null||finite(p.rate,1e12)))throw Error('Invalid project');projects.set(p.id,p.organizationId)}
  const assignment = e => organizations.has(e.organizationId) && currencies.includes(e.currency) && (e.projectId===null || e.projectId===undefined || projects.get(e.projectId)===e.organizationId);
  const ids = new Set();
  for (const e of s.entries) {
    if (!e || !assignment(e) || typeof e.id !== 'string' || ids.has(e.id) || !title(e.title) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !finite(e.durationMs, 86400000) || !finite(e.rate, 1e12) || !finite(e.createdAt) || !['timer','manual'].includes(e.source)) throw Error('اطلاعات ثبت‌شده معتبر نیست.');
    const d = new Date(e.date + 'T12:00:00');
    if (!Number.isFinite(d.getTime()) || [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-') !== e.date) throw Error('تاریخ معتبر نیست.');
    if(e.segments!==undefined){
      if(!validSegments(e.segments)||!e.segments.length||e.segments.reduce((total,v)=>total+v.end-v.start,0)!==e.durationMs)throw Error('اطلاعات ثبت‌شده معتبر نیست.');
      const start=new Date(e.segments[0].start);
      if([start.getFullYear(),String(start.getMonth()+1).padStart(2,'0'),String(start.getDate()).padStart(2,'0')].join('-')!==e.date)throw Error('تاریخ معتبر نیست.');
    }
    ids.add(e.id);
  }
  if (s.active !== null) {
    const a = s.active;
    if (!a || !assignment(a) || typeof a.id !== 'string' || !title(a.title) || !finite(a.rate, 1e12) || !validSegments(a.segments) || !(a.runningSince === null || finite(a.runningSince,8640000000000000)) || (a.runningSince!==null&&a.segments.length&&a.runningSince<a.segments.at(-1).end)) throw Error('زمان‌سنج معتبر نیست.');
  }
  return s;
}
module.exports = { validate };
