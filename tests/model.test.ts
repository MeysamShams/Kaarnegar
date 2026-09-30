import {setLanguage} from '../src/i18n';
setLanguage('fa');
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { activeDuration, dateLabel, finishActive, filtered, gregorian, groupTasks, latin, pauseActive, rangePreset, totals, type Active, type Entry } from '../src/model';
import { reportHTML } from '../src/report';
const {validate}=createRequire(import.meta.url)('../electron/validation.cjs');
const base:Active={id:'timer',title:'طراحی',rate:250000,segments:[],runningSince:1000};
test('pause excludes elapsed time until resume, stop preserves both work segments',()=>{
 const paused=pauseActive(base,61000);assert.equal(activeDuration(paused,999000),60000);
 const resumed={...paused,runningSince:121000};const entries=finishActive(resumed,181000);
 assert.equal(totals(entries).ms,120000);assert.equal(activeDuration(resumed,181000),120000);
});
test('overnight work is attributed to each local day; pauses across midnight are excluded',()=>{
 const start=new Date(2026,8,29,23,30).getTime(),end=new Date(2026,8,30,1,30).getTime();
 const a={...base,runningSince:start};const entries=finishActive(a,end);
 assert.deepEqual(entries.map(e=>[e.date,e.durationMs]),[['2026-09-29',1800000],['2026-09-30',5400000]]);
 const paused={...base,runningSince:null,segments:[{start,end:start+600000},{start:end-600000,end}]};
 assert.equal(totals(finishActive(paused)).ms,1200000);
});
test('Jalali leap day and new year round trip correctly',()=>{
 assert.equal(gregorian(1403,12,30),'2025-03-20');assert.equal(gregorian(1404,1,1),'2025-03-21');
 assert.equal(dateLabel('2025-03-20'),'۱۴۰۳/۱۲/۳۰');assert.equal(dateLabel('2026-09-30',true),'۸ مهر ۱۴۰۵');
 assert.deepEqual(rangePreset('month',new Date(2025,2,20,12)),['2025-02-19','2025-03-20']);
 assert.deepEqual(rangePreset('week',new Date(2026,8,30,12)),['2026-09-26','2026-09-30']);
});
const entries:Entry[]=[{id:'1',title:'طراحی',date:'2026-09-30',durationMs:5400000,rate:250000,createdAt:1,source:'manual'},{id:'2',title:'طراحی',date:'2026-09-29',durationMs:3600000,rate:300000,createdAt:2,source:'timer'}];
test('reports use each historical rate and inclusive dates',()=>{
 assert.equal(totals(entries).amount,675000);assert.equal(totals(entries).tasks,1);
 assert.equal(groupTasks(entries)[0].ms,9000000);
 assert.equal(filtered(entries,'2026-09-30','2026-09-30').length,1);
 assert.equal(filtered(entries,'2026-09-29','2026-09-30','طراح').length,2);
 assert.equal(latin('۲۵۰٬۰۰۰'),'250000');
});
test('PDF uses Persian text, escapes task titles and includes earnings and date range',()=>{
 const html=reportHTML([{...entries[0],title:'<script>alert(1)</script>'}], '2026-09-29','2026-09-30','مریم & علی');
 assert.ok(html.includes('۳۷۵٬۰۰۰'));assert.ok(html.includes('۸ مهر ۱۴۰۵'));assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('dir="rtl"'));assert.ok(html.includes('مریم &amp; علی'));
 assert.ok(html.includes('میزان کارکر'));assert.ok(!html.includes('خلاصهٔ فعالیت‌ها'));assert.ok(!html.includes('ثبت دستی'));assert.ok(!html.includes('<th style="width:14%">'));
});
test('storage rejects invalid backups and duplicate entries',()=>{
 const state={version:1,rate:250000,name:'مریم',entries,active:null};assert.equal(validate(state),state);
 assert.throws(()=>validate({...state,entries:[entries[0],entries[0]]}));
 assert.throws(()=>validate({...state,entries:[{...entries[0],date:'2026-02-30'}]}));
 assert.throws(()=>validate({...state,rate:-1}));assert.throws(()=>validate({...state,active:{...base,segments:[{start:10,end:5}]}}));
});
