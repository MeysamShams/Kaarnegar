import { t, language } from './i18n';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import jalaali from 'jalaali-js';
import { dateLabel, fromDate, gregorian, jalaliParts, localDate, months, number } from './model';
export default function DatePicker({ value, onChange, label }: {value:string;onChange:(v:string)=>void;label:string}) {
  const [open,setOpen]=useState(false), [view,setView]=useState(()=>jalaliParts(value));
  const trigger=useRef<HTMLButtonElement>(null),calendar=useRef<HTMLDivElement>(null);
  const [position,setPosition]=useState({top:0,left:0});
  useLayoutEffect(()=>{
    if(!open)return;
    const place=()=>{
      if(!trigger.current||!calendar.current)return;
      const rect=trigger.current.getBoundingClientRect(),width=calendar.current.offsetWidth,height=calendar.current.offsetHeight;
      const left=Math.max(8,Math.min(document.documentElement.dir==='rtl'?rect.right-width:rect.left,window.innerWidth-width-8));
      const top=window.innerHeight-rect.bottom>=height+8?rect.bottom+8:rect.top>=height+8?rect.top-height-8:Math.max(8,Math.min(rect.bottom+8,window.innerHeight-height-8));
      setPosition({top,left});
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true)};
  },[open]);
  const first = gregorian(view.jy,view.jm,1), offset = (fromDate(first).getDay()+1)%7;
  const days = jalaali.jalaaliMonthLength(view.jy,view.jm);
  function move(amount:number) { let m=view.jm+amount,y=view.jy; if(m<1){m=12;y--}if(m>12){m=1;y++}if(y>=1200&&y<=1600)setView({jy:y,jm:m,jd:1}); }
  if(language()==='en')return <label className="date-field"><span className="field-label">{label}</span><input className="date-trigger" type="date" aria-label={label} value={value} onChange={e=>{if(e.target.value)onChange(e.target.value)}}/></label>;
  return <div className="date-field"><span className="field-label">{label}</span><button ref={trigger} type="button" className="date-trigger" aria-expanded={open} aria-label={label} onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false)}}} onClick={()=>{setView(jalaliParts(value));setOpen(!open)}}><CalendarDays size={17}/><span>{dateLabel(value)}</span></button>{open&&createPortal(<><div className="calendar-scrim portal" onClick={()=>setOpen(false)}/><div ref={calendar} className="calendar portal" style={position} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);trigger.current?.focus()}}}><div className="calendar-head"><button type="button" aria-label={t("ماه قبل")} onClick={()=>move(-1)}><ChevronRight size={18}/></button><select aria-label={t("ماه")} value={view.jm} onChange={e=>setView({...view,jm:Number(e.target.value)})}>{months.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select><select aria-label={t("سال")} value={view.jy} onChange={e=>setView({...view,jy:Number(e.target.value)})}>{Array.from({length:401},(_,i)=>1200+i).map(y=><option key={y} value={y}>{number(y).replace(/٬/g,'')}</option>)}</select><button type="button" aria-label={t("ماه بعد")} onClick={()=>move(1)}><ChevronLeft size={18}/></button></div><div className="calendar-grid">{[t("ش"),t("ی"),t("د"),t("س"),t("چ"),t("پ"),t("ج")].map((d,i)=><span className="weekday" key={i}>{d}</span>)}{Array.from({length:offset},(_,i)=><span key={'b'+i}/>)}{Array.from({length:days},(_,i)=>{const d=gregorian(view.jy,view.jm,i+1);return <button type="button" key={i} className={`${d===value?'selected':''} ${d===localDate()?'today':''}`} onClick={()=>{onChange(d);setOpen(false)}}>{number(i+1)}</button>})}</div><button type="button" className="calendar-today" onClick={()=>{onChange(localDate());setOpen(false)}}>{t("امروز")}</button></div></>,document.body)}</div>;
}
