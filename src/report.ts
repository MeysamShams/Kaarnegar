import { dateLabel, duration, money, moneySummary, totals, type Entry, type Organization, type Project } from './model';
import { language, t, withLanguage, type Language } from './i18n';
export const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function reportFilename(start:string,end:string,lang:Language=language()) {
  return withLanguage(lang,()=>`${dateLabel(start).replaceAll('/','-')}_${lang==='en'?'to':'تا'}_${dateLabel(end).replaceAll('/','-')}.pdf`);
}
type ReportOptions={language?:Language;organizations?:Organization[];projects?:Project[];organizationId?:string;projectId?:string};
export function reportHTML(entries:Entry[],start:string,end:string,name:string,options:ReportOptions={}) {
  const lang=options.language??language();
  return withLanguage(lang,()=>{
    const total=totals(entries);
    const text=(value:string)=>escape(t(value));
    return `<!doctype html><html lang="${lang}" dir="${lang==='en'?'ltr':'rtl'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:"><style>/* FONT */
    @page{size:A4;margin:17mm 14mm}*{box-sizing:border-box}body{font-family:Arad,sans-serif;color:#1c2c3b;font-size:11px;line-height:1.9}header{border-bottom:3px solid #158575;padding-bottom:18px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:16px}h1{font-size:26px;margin:0}h2{font-size:16px;margin-top:26px}.brand{font-size:22px;font-weight:800;color:#158575}.muted{color:#667687}.summary{display:flex;gap:14px}.summary>div{flex:1;padding:16px;background:#eff5f3;border-radius:10px}.summary strong{display:block;font-size:20px;overflow-wrap:anywhere}.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}table{width:100%;border-collapse:collapse;margin:10px 0 24px;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th{text-align:start;background:#edf2f5;color:#445363;padding:10px 8px;font-weight:600}td{padding:10px 8px;border-bottom:1px solid #e6eaed;overflow-wrap:anywhere}.total td{font-weight:700;background:#eff5f3}p{margin:4px 0}</style></head><body>
    <header><div><h1>${text('Work summary report')}</h1><p>${dateLabel(start,true)} ${text('to')} ${dateLabel(end,true)}</p>${name?`<p>${text('Name')}: ${escape(name)}</p>`:''}</div><div class="brand">${text('Kaarnegar')}</div></header>
    <div class="summary"><div>${text('Total time')}<strong class="ltr">${duration(total.ms,true)}</strong></div><div>${text('Work amount')}<strong class="ltr">${moneySummary(entries)}</strong></div></div>
    <h2>${text('Time entry details')}</h2><table><thead><tr><th style="width:38%">${text('Task')}</th><th style="width:17%">${text('Date')}</th><th style="width:18%">${text('Duration')}</th><th style="width:27%">${text('Amount')}</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${escape(e.title)}</td><td>${dateLabel(e.date)}</td><td><span class="ltr">${duration(e.durationMs,true)}</span></td><td><span class="ltr">${money(e.durationMs/3600000*e.rate,e.currency)}</span></td></tr>`).join('')}<tr class="total"><td colspan="2">${text('Total')}</td><td><span class="ltr">${duration(total.ms,true)}</span></td><td><span class="ltr">${moneySummary(entries)}</span></td></tr></tbody></table>
    </body></html>`;
  });
}
