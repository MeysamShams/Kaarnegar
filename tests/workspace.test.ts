import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {effectiveRate,emptyState,filtered,finishActive,currencyTotals,moneySummary,migrateState,type State} from '../src/model';
import {language,withLanguage,t} from '../src/i18n';
import {reportHTML,reportFilename} from '../src/report';
const {validate}=createRequire(import.meta.url)('../electron/validation.cjs');
const state:State={...emptyState,organizations:[{id:'a',name:'Acme & Co',rate:50,currency:'USD'},{id:'b',name:'Europe',rate:40,currency:'EUR'}],projects:[{id:'p',organizationId:'a',name:'Website',rate:80},{id:'inherit',organizationId:'a',name:'Support',rate:null},{id:'free',organizationId:'a',name:'Volunteer',rate:0}]};
test('project rates override organization rates, blank inherits, and zero is respected',()=>{
 assert.equal(effectiveRate(state,'a','p'),80);assert.equal(effectiveRate(state,'a','inherit'),50);assert.equal(effectiveRate(state,'a','free'),0);assert.equal(effectiveRate(state,'a',null),50);assert.throws(()=>effectiveRate(state,'b','p'));assert.throws(()=>effectiveRate(state,'',null));
});
const usd=finishActive({id:'t',title:'Build',organizationId:'a',projectId:'p',currency:'USD',rate:80,segments:[{start:1000,end:3601000}],runningSince:null},3601000)[0];
const eur={...usd,id:'e',organizationId:'b',projectId:null,currency:'EUR' as const,rate:40};
test('timer snapshots assignment and currency, filters intersect, and totals separate currencies',()=>{
 assert.equal(usd.organizationId,'a');assert.equal(usd.projectId,'p');assert.equal(usd.currency,'USD');
 assert.equal(filtered([usd,eur],usd.date,usd.date,'','a','p').length,1);assert.equal(filtered([usd,eur],usd.date,usd.date,'','b','p').length,0);
 assert.deepEqual(currencyTotals([usd,eur]),[['EUR',40],['USD',80]]);assert.match(withLanguage('en',()=>moneySummary([usd,eur])),/40 EUR.*80 USD/);
 const changed={...state,projects:state.projects.map(p=>({...p,rate:120}))};assert.equal(effectiveRate(changed,'a','p'),120);assert.equal(usd.rate,80);
});
test('storage rejects missing organizations and projects belonging to another organization',()=>{
 assert.equal(validate({...state,entries:[usd,eur]}).entries.length,2);
 assert.throws(()=>validate({...state,entries:[{...usd,organizationId:''}]}));assert.throws(()=>validate({...state,entries:[{...usd,organizationId:'b'}]}));assert.throws(()=>validate({...state,entries:[{...usd,currency:'INVALID'}]}));
});
test('old history migrates without changing rates, duration, or currency',()=>{
 const old={version:1,rate:250000,name:'Test',entries:[{...usd,organizationId:undefined,projectId:undefined,currency:undefined,rate:250000}],active:null};
 const native=validate(structuredClone(old)),browser=migrateState(old as unknown as State);
 assert.deepEqual(native,browser);assert.equal(native.entries[0].rate,250000);assert.equal(native.entries[0].currency,'IRT');assert.equal(native.entries[0].organizationId,'legacy-organization');assert.equal(native.organizations[0].rate,250000);
});
test('English PDFs use English labels, Gregorian dates, filtered context, and escaped names',()=>{
 const html=reportHTML([usd,eur],'2026-09-01','2026-09-30','<Jane>',{language:'en',organizations:state.organizations,projects:state.projects,organizationId:'a',projectId:'p'});
 assert.match(html,/lang="en" dir="ltr"/);assert.match(html,/September 30, 2026/);assert.match(html,/Acme &amp; Co/);assert.match(html,/Website/);assert.match(html,/80 USD/);assert.match(html,/40 EUR/);assert.match(html,/&lt;Jane&gt;/);assert.ok(!html.includes('<Jane>'));assert.equal(reportFilename('2026-09-01','2026-09-30','en'),'2026-09-01_to_2026-09-30.pdf');assert.equal(language(),'en');
});
test('localization includes every extracted Persian interface message',()=>{
 const fs=createRequire(import.meta.url)('node:fs'), ts=createRequire(import.meta.url)('typescript');
 const en=JSON.parse(fs.readFileSync('src/locales/en.json','utf8'));
 for(const file of ['src/App.tsx','src/DatePicker.tsx','src/WindowControls.tsx']){
   const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
   function visit(node:any){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])&&/[\u0600-\u06ff]/.test(node.arguments[0].text))assert.ok(en[node.arguments[0].text],node.arguments[0].text);ts.forEachChild(node,visit)}visit(ast);
 }
 assert.equal(withLanguage('en',()=>t('تنظیمات')),'Settings');assert.equal(withLanguage('fa',()=>t('Select an organization')),'سازمان را انتخاب کنید');
});
