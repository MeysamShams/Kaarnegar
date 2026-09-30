const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const artifacts=path.resolve('test-artifacts');fs.mkdirSync(artifacts,{recursive:true});
const userDir=fs.mkdtempSync(path.join(os.tmpdir(),'kaarnegar-workspace-'));
const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
fs.writeFileSync(path.join(userDir,'work-data.json'),JSON.stringify({version:1,name:'Meysam Shams',rate:250000,active:null,entries:[{id:'legacy',title:'Legacy work',date:today,rate:250000,durationMs:3600000,source:'manual',createdAt:1}]}));
const pdf=path.join(artifacts,'workspace-english.pdf'),errors=[];
let app;
const stored=()=>JSON.parse(fs.readFileSync(path.join(userDir,'work-data.json'),'utf8'));
async function launch(){const env={...process.env,KAARNEGAR_DATA_DIR:userDir,KAARNEGAR_TEST_PDF:pdf};delete env.ELECTRON_RUN_AS_NODE;const executablePath=process.env.KAARNEGAR_TEST_EXECUTABLE;app=await electron.launch({executablePath,args:executablePath?[]:[path.resolve('.')],env});const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.locator('.sidebar').waitFor();return page}
async function saveOrg(page,name,rate,currency){await page.getByRole('button',{name:'Add organization',exact:true}).click();await page.getByRole('textbox',{name:'Organization name',exact:true}).fill(name);await page.getByRole('textbox',{name:'Organization hourly rate',exact:true}).fill(rate);await page.getByRole('combobox',{name:'Organization currency',exact:true}).selectOption(currency);await page.getByRole('button',{name:'Save organization',exact:true}).click();await page.getByRole('button',{name:'Save organization',exact:true}).waitFor({state:'hidden'});return stored().organizations.find(o=>o.name===name).id}
async function saveProject(page,name,rate){await page.getByRole('button',{name:'Add project',exact:true}).click();await page.getByRole('textbox',{name:'Project name',exact:true}).fill(name);await page.getByRole('textbox',{name:'Project hourly rate',exact:true}).fill(rate);await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByRole('button',{name:'Save project',exact:true}).waitFor({state:'hidden'});return stored().projects.find(p=>p.name===name).id}
async function manual(page,title,org,project,hours='1'){await page.getByRole('button',{name:'Add manual time',exact:true}).first().click();const modal=page.getByRole('dialog');await modal.getByRole('textbox',{name:'Manual task title'}).fill(title);await modal.getByRole('combobox',{name:'Organization',exact:true}).selectOption(org);if(project)await modal.getByRole('combobox',{name:'Project',exact:true}).selectOption(project);await modal.getByRole('textbox',{name:'Hours',exact:true}).fill(hours);await modal.getByRole('button',{name:'Save time',exact:true}).click();await modal.waitFor({state:'hidden'})}
(async()=>{try{
 let page=await launch();
 const migrated=(await page.evaluate(()=>window.desktop.load())).state;
 assert.equal(migrated.entries[0].organizationId,'legacy-organization');assert.equal(migrated.entries[0].rate,250000);assert.equal(migrated.entries[0].currency,'IRT');
 await page.locator('nav button').last().click();await page.locator('#language').selectOption('en');
 await page.getByRole('heading',{name:'Workspace settings',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.dir),'ltr');
 assert.equal(await app.evaluate(({app})=>process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')('./electron/tray.cjs').getMenu().getMenuItemById('quit-app').label),'Quit app');
 const acme=await saveOrg(page,'Acme', '50','USD'), website=await saveProject(page,'Website','80'),support=await saveProject(page,'Support',''), europe=await saveOrg(page,'Europe','40','EUR');
 await page.locator('#theme').selectOption('dark');await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
 await page.screenshot({path:path.join(artifacts,'workspace-settings.png'),fullPage:true,style:'.toast{visibility:hidden}'});
 await page.getByRole('button',{name:'Track time',exact:true}).click();
 await page.getByRole('textbox',{name:'Task title',exact:true}).fill('Timed website');await page.getByRole('button',{name:/^Start task/}).click();
 await page.getByRole('alert').filter({hasText:'Select an organization before starting.'}).waitFor();
 await page.getByRole('combobox',{name:'Organization',exact:true}).selectOption(acme);await page.getByRole('combobox',{name:'Project',exact:true}).selectOption(website);
 await page.getByRole('button',{name:/^Start task/}).click();await page.waitForTimeout(1200);await page.getByRole('button',{name:'Pause',exact:true}).click();
 assert.equal(stored().active.rate,80);assert.equal(stored().active.currency,'USD');
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:/^Acme/}).click();await page.getByRole('button',{name:'Edit project Website',exact:true}).click();await page.getByRole('textbox',{name:'Project hourly rate',exact:true}).fill('100');await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByRole('button',{name:'Save project',exact:true}).waitFor({state:'hidden'});
 assert.equal(stored().active.rate,80);
 await page.getByRole('button',{name:'Track time',exact:true}).click();await page.getByRole('button',{name:'Stop and save',exact:true}).click();await page.getByRole('button',{name:/^Start task/}).waitFor();
 await manual(page,'USD support',acme,support);await manual(page,'EUR work',europe,'');
 assert.equal(stored().entries.find(e=>e.title==='USD support').rate,50);assert.equal(stored().entries.find(e=>e.title==='EUR work').currency,'EUR');assert.equal(stored().entries.find(e=>e.title==='Timed website').rate,80);
 await page.getByRole('button',{name:'Reports',exact:true}).click();await page.getByRole('button',{name:'Today',exact:true}).click();
 assert.match(await page.locator('.report-total').innerText(),/EUR/);assert.match(await page.locator('.report-total').innerText(),/USD/);assert.match(await page.locator('.report-total').innerText(),/IRT/);
 await page.getByRole('combobox',{name:'Filter organization',exact:true}).selectOption(acme);await page.getByRole('combobox',{name:'Filter project',exact:true}).selectOption(support);
 assert.equal(await page.locator('.entries-table tbody tr').count(),1);assert.equal(await page.locator('.entries-table tbody tr').getByText('USD support',{exact:true}).count(),1);assert.match(await page.locator('.report-total').innerText(),/50 USD/);assert.ok(!/EUR|IRT/.test(await page.locator('.report-total').innerText()));
 await page.getByRole('button',{name:'Export PDF report',exact:true}).click();await page.getByRole('status').filter({hasText:'PDF report saved.'}).waitFor();assert.equal(fs.readFileSync(pdf).subarray(0,4).toString(),'%PDF');assert.ok(fs.statSync(pdf).size>10000);
 await page.screenshot({path:path.join(artifacts,'workspace-reports.png'),fullPage:true,style:'.toast{visibility:hidden}'});
 const englishText=await page.locator('.content').innerText();assert.ok(!/[\u0600-\u06ff]/.test(englishText),englishText);
 await page.getByRole('button',{name:'Settings',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Delete organization Acme',exact:true}).isDisabled(),true);await page.getByRole('button',{name:/^Acme/}).click();assert.equal(await page.getByRole('button',{name:'Delete project Support',exact:true}).isDisabled(),true);
 await app.close();page=await launch();await page.getByRole('heading',{name:'Make your time count.',exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');assert.equal(stored().entries.find(e=>e.id==='legacy').rate,250000);assert.deepEqual(errors,[]);
 console.log('PASS: migration, required organizations, optional projects, rate inheritance and snapshots, currencies, English layout, tray, dates, report filters, native PDF export, protected deletion, and restart persistence.');
}finally{if(app)await app.close().catch(()=>{})}})().catch(e=>{console.error(e);process.exitCode=1});
