import { dateLabel, duration, localDate, moneySummary, number, totals, type Entry, type Organization, type Project } from './model';
import { language, t, withLanguage, type Language } from './i18n';
export const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function reportFilename(start:string,end:string,lang:Language=language()) {
  return withLanguage(lang,()=>`${dateLabel(start).replaceAll('/','-')}_${lang==='en'?'to':'تا'}_${dateLabel(end).replaceAll('/','-')}.pdf`);
}
type ReportOptions={language?:Language;organizations?:Organization[];projects?:Project[];organizationId?:string;projectId?:string};
export function reportHTML(entries:Entry[],start:string,end:string,name:string,options:ReportOptions={}) {
  const lang=options.language??language();
  return withLanguage(lang,()=>{
    const total=totals(entries), orgs=options.organizations??[], projects=options.projects??[];
    const text=(value:string)=>escape(t(value));
    const projectName=(entry:Entry)=>projects.find(p=>p.id===entry.projectId)?.name;
    const selectedOrg=orgs.find(o=>o.id===options.organizationId),selectedProject=projects.find(p=>p.id===options.projectId);
    return `<!doctype html><html lang="${lang}" dir="${lang==='en'?'ltr':'rtl'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:"><style>/* FONT */
    @page{size:A4;margin:17mm 14mm}*{box-sizing:border-box}body{font-family:Arad,sans-serif;color:#1c2c3b;font-size:11px;line-height:1.9}header{border-bottom:3px solid #158575;padding-bottom:18px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:16px}h1{font-size:26px;margin:0}h2{font-size:16px;margin-top:26px}.brand{font-size:22px;font-weight:800;color:#158575}.muted{color:#667687}.summary{display:flex;gap:14px}.summary>div{flex:1;padding:16px;background:#eff5f3;border-radius:10px}.summary strong{display:block;font-size:20px;overflow-wrap:anywhere}.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}table{width:100%;border-collapse:collapse;margin:10px 0 24px;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th{text-align:start;background:#edf2f5;color:#445363;padding:10px 8px;font-weight:600}td{padding:10px 8px;border-bottom:1px solid #e6eaed;overflow-wrap:anywhere}footer{border-top:1px solid #d9e2e7;margin-top:26px;padding-top:12px;font-size:10px;color:#667687}p{margin:4px 0}</style></head><body>
    <header><div><h1>${text('Time & earnings report')}</h1><p>${dateLabel(start,true)} ${text('to')} ${dateLabel(end,true)}</p>${name?`<p>${text('Name')}: ${escape(name)}</p>`:''}<p class="muted">${text('Organization')}: ${selectedOrg?escape(selectedOrg.name):text('All organizations')} · ${text('Project')}: ${selectedProject?escape(selectedProject.name):text('All projects')}</p></div><div class="brand">${text('Kaarnegar')}<p class="muted" style="font-size:11px;font-weight:400">${text('Your time, your value')}</p></div></header>
    <div class="summary"><div>${text('Total time')}<strong class="ltr">${duration(total.ms,true)}</strong></div><div>${text('Work amount')}<strong class="ltr">${moneySummary(entries)}</strong></div><div>${text('Tasks')}<strong>${number(total.tasks)}</strong>${number(entries.length)} ${text('time entries')}</div></div>
    <h2>${text('Time entry details')}</h2><table><thead><tr><th style="width:70%">${text('Task')} / ${text('Project')}</th><th style="width:30%">${text('Date')}</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${escape(e.title)}${projectName(e)?`<p class="muted">${escape(projectName(e)!)}</p>`:''}</td><td>${dateLabel(e.date)}</td></tr>`).join('')}</tbody></table>
    <footer><p>${text('Amounts are totaled separately for each currency. No currency conversion is applied.')}</p><p>${text("Recorded rates are preserved. Paused time is excluded. Dates use your selected calendar and the device's local day.")}</p><p>${text('Generated with Kaarnegar')} · ${dateLabel(localDate(),true)}</p></footer></body></html>`;
  });
}
