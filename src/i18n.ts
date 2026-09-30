import en from './locales/en.json';
import fa from './locales/fa.json';
export type Language='fa'|'en';
let current:Language='en';
export const language=()=>current;
export function setLanguage(value:Language){current=value}
export function withLanguage<T>(value:Language,fn:()=>T):T {const previous=current;current=value;try{return fn()}finally{current=previous}}
export function t(source:string,...values:(string|number)[]) {
  const dictionary:Record<string,string>=current==='en'?en:fa;
  return (dictionary[source]??source).replace(/\{(\d+)\}/g,(_,i)=>String(values[Number(i)]??''));
}
