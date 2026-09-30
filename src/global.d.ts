import type { State } from './model';
declare global { interface Window { desktop?: { load(): Promise<{state:State;warning:string;dataPath:string}>; save(state:State):Promise<boolean>; exportPDF(html:string):Promise<boolean>; backup():Promise<boolean>; importBackup():Promise<State|null>; widget(compact:boolean):Promise<boolean>; onState(callback:(s:State)=>void):()=>void } } }
