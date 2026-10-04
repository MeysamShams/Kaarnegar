import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Pencil } from 'lucide-react';
import { t } from './i18n';
import type { Entry, State } from './model';

const normalize=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u064b-\u065f]/g,'').replace(/[\s\u200c]+/g,' ').trim();
function distance(a:string,b:string) {
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=0;i<a.length;i++){
    const next=[i+1];
    for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1)));
    row=next;
  }
  return row[b.length];
}
export default function TaskTitleInput({state,value,onChange,onSelect,onEnter,disabled=false,label,placeholder}:{state:State;value:string;onChange:(value:string)=>void;onSelect:(entry:Entry)=>void;onEnter?:()=>void;disabled?:boolean;label:string;placeholder:string}) {
  const id=useId(),[open,setOpen]=useState(false),[selected,setSelected]=useState(-1);
  const suggestions=useMemo(()=>{
    const seen=new Set<string>(),query=normalize(value);
    return [...state.entries].sort((a,b)=>b.createdAt-a.createdAt).flatMap(entry=>{
      const title=normalize(entry.title),key=JSON.stringify([title,entry.organizationId,entry.projectId??null]);
      if(seen.has(key)||!state.organizations.some(o=>o.id===entry.organizationId))return [];
      seen.add(key);
      const score=!query||title===query?0:title.startsWith(query)?1:title.includes(query)||query.includes(title)?2:query.length>=3&&Math.abs(title.length-query.length)<=2&&distance(title,query)<=2?3:-1;
      return score<0?[]:[{entry,score}];
    }).sort((a,b)=>a.score-b.score).slice(0,8).map(item=>item.entry);
  },[state.entries,state.organizations,value]);
  const visible=open&&!disabled&&suggestions.length>0;
  function choose(entry:Entry){onSelect(entry);setOpen(false);setSelected(-1)}
  function keyDown(event:KeyboardEvent<HTMLInputElement>){
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();setOpen(true);
      setSelected(index=>event.key==='ArrowDown'?Math.min(index+1,suggestions.length-1):index<0?suggestions.length-1:Math.max(0,index-1));
    }else if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);setSelected(-1)}
    else if(event.key==='Enter'){
      if(visible&&selected>=0&&suggestions[selected]){event.preventDefault();choose(suggestions[selected])}
      else if(onEnter){event.preventDefault();setOpen(false);onEnter()}
    }
  }
  return <div className="task-title-picker" onBlur={event=>{
    if(!event.currentTarget.contains(event.relatedTarget as Node|null)){setOpen(false);setSelected(-1)}
  }}>
    <div className="task-input"><Pencil size={18}/><input role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&selected>=0?`${id}-${selected}`:undefined} autoComplete="off" placeholder={placeholder} maxLength={200} value={value} disabled={disabled} onClick={()=>setOpen(true)} onChange={event=>{onChange(event.target.value);setSelected(-1);setOpen(true)}} onKeyDown={keyDown}/></div>
    {visible&&<div className="task-suggestions" id={id} role="listbox" aria-label={t('Previous tasks')}>
      {suggestions.map((entry,index)=><button type="button" role="option" aria-selected={selected===index} id={`${id}-${index}`} className={selected===index?'selected':''} key={entry.id} tabIndex={-1} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(entry)}><strong>{entry.title}</strong><small>{state.organizations.find(o=>o.id===entry.organizationId)?.name} · {state.projects.find(p=>p.id===entry.projectId)?.name??t('No project')}</small></button>)}
    </div>}
  </div>;
}
