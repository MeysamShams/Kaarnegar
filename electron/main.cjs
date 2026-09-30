const { app, BrowserWindow, ipcMain, dialog, powerMonitor, Menu } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { validate } = require('./validation.cjs');
const { initializeTray, showApp, destroyTray } = require('./tray.cjs');
if (process.env.KAARNEGAR_DATA_DIR) app.setPath('userData', process.env.KAARNEGAR_DATA_DIR);
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();
let win, state, loadError = '', compact = false, normalBounds, normalMaximized = false, quitting = false;
const dataPath = () => path.join(app.getPath('userData'), 'work-data.json');
function write(s) {
  validate(s);
  const p = dataPath(); fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) fs.copyFileSync(p, p + '.bak');
  fs.writeFileSync(p + '.tmp', JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(p + '.tmp', p); state = s;
}
function pause() {
  if (state?.active?.runningSince !== null && state?.active) {
    const a = state.active;
    write({ ...state, active: { ...a, segments: [...a.segments, { start: a.runningSince, end: Math.max(a.runningSince, Date.now()) }], runningSince: null } });
    if (win && !win.isDestroyed()) win.webContents.send('state', state);
  }
}
function read() {
  for (const p of [dataPath(), dataPath() + '.bak']) {
    if (!fs.existsSync(p)) continue;
    try { state = validate(JSON.parse(fs.readFileSync(p, 'utf8'))); if (p.endsWith('.bak')) loadError = 'اطلاعات از نسخهٔ پشتیبان بازیابی شد.'; return; }
    catch { loadError = 'فایل اطلاعات آسیب دیده است. فایل اصلی محفوظ است؛ از تنظیمات نسخهٔ پشتیبان را وارد کنید.'; }
  }
  state = { version: 1, rate: 0, name: '', entries: [], active: null };
  if (loadError && fs.existsSync(dataPath())) fs.copyFileSync(dataPath(), dataPath() + '.damaged-' + Date.now());
}
if (locked) app.whenReady().then(() => {
  read();
  // Explicit quitting pauses before exit. Interrupted processes restore the last checkpoint as paused.
  if (state.active?.runningSince != null) {
    state = { ...state, active: { ...state.active, runningSince: null } }; write(state);
    loadError = 'زمان‌سنج پس از بسته‌شدن غیرمنتظره، در حالت مکث بازیابی شد. زمان تأییدنشده را می‌توانید دستی اضافه کنید.';
  }
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width: 1320, height: 900, minWidth: 1000, minHeight: 720, frame: false, title: 'کارنگار', icon: path.join(__dirname, '../dist/icon.png'), backgroundColor: '#f5f6f8', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  initializeTray(win, () => app.quit());
  win.on('maximize', () => win.webContents.send('window-maximized', true));
  win.on('unmaximize', () => win.webContents.send('window-maximized', false));
  win.on('close', event => {
    if (!quitting) { event.preventDefault(); win.hide(); }
  });
  // Windows shutdown may skip before-quit; persist the timer at its session-end boundary too.
  win.on('query-session-end', event => {
    try { pause(); } catch (e) { event.preventDefault(); dialog.showErrorBox('خطا در ذخیره', e.message); }
  });
  win.on('session-end', () => { quitting = true; destroyTray(); });
  powerMonitor.on('suspend', () => { try { pause(); } catch (e) { dialog.showErrorBox('خطا در ذخیره', e.message); } });
  ipcMain.handle('load', () => ({ state, warning: loadError, dataPath: dataPath() }));
  ipcMain.handle('save', (_, s) => { write(s); return true; });
  ipcMain.handle('window-control', (_, action) => {
    if (action === 'minimize') win.minimize();
    else if (action === 'close') win.close();
    else if (action === 'maximize') { if (win.isMaximized()) win.unmaximize(); else win.maximize(); }
  });
  ipcMain.handle('window-maximized', () => win.isMaximized());
  ipcMain.handle('widget', (_, value) => {
    compact = !!value;
    if (compact) {
      normalBounds = win.getNormalBounds(); normalMaximized = win.isMaximized();
      if (normalMaximized) win.unmaximize();
      win.setMinimumSize(390, 360); win.setSize(430, 430); win.setAlwaysOnTop(true);
    } else {
      if (win.isMaximized()) win.unmaximize();
      win.setAlwaysOnTop(false); win.setMinimumSize(1000, 720);
      if (normalBounds) win.setBounds(normalBounds);
      if (normalMaximized) win.maximize();
    }
    return compact;
  });
  ipcMain.handle('backup', async () => {
    const result = await dialog.showSaveDialog(win, { title: 'ذخیرهٔ نسخهٔ پشتیبان', defaultPath: 'kaarnegar-backup.json', filters: [{ name: 'نسخهٔ پشتیبان', extensions: ['json'] }] });
    if (result.canceled) return false;
    fs.writeFileSync(result.filePath, JSON.stringify(state, null, 2), 'utf8'); return true;
  });
  ipcMain.handle('import', async () => {
    if (state.active) throw Error('ابتدا زمان‌سنج را متوقف و ذخیره کنید.');
    const result = await dialog.showOpenDialog(win, { title: 'بازیابی نسخهٔ پشتیبان', properties: ['openFile'], filters: [{ name: 'نسخهٔ پشتیبان', extensions: ['json'] }] });
    if (result.canceled) return null;
    const p = result.filePaths[0]; if (fs.statSync(p).size > 30e6) throw Error('حجم فایل بیش از حد مجاز است.');
    const imported = validate(JSON.parse(fs.readFileSync(p, 'utf8')));
    if (imported.active) imported.active.runningSince = null;
    write(imported); return imported;
  });
  ipcMain.handle('pdf', async (_, html) => {
    if (typeof html !== 'string' || html.length > 10e6) throw Error('گزارش بیش از حد بزرگ است.');
    const result = process.env.KAARNEGAR_TEST_PDF ? { filePath: process.env.KAARNEGAR_TEST_PDF } : await dialog.showSaveDialog(win, { title: 'ذخیرهٔ گزارش PDF', defaultPath: 'گزارش-کارنگار.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (result.canceled) return false;
    const font = fs.readFileSync(path.join(__dirname, '../dist/fonts/Arad-Regular.woff2')).toString('base64');
    const bold = fs.readFileSync(path.join(__dirname, '../dist/fonts/Arad-Bold.woff2')).toString('base64');
    const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: true } });
    pdfWin.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*','https://*/*'] }, (_, cb) => cb({ cancel: true }));
    try {
      await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html.replace('/* FONT */', `@font-face{font-family:Arad;src:url("data:font/woff2;base64,${font}") format("woff2");font-weight:400}@font-face{font-family:Arad;src:url("data:font/woff2;base64,${bold}") format("woff2");font-weight:600 900}`)));
      await pdfWin.webContents.executeJavaScript('Promise.all([document.fonts.load("14px Arad"),document.fonts.load("700 14px Arad")]).then(() => document.fonts.ready).then(() => true)');
      const buffer = await pdfWin.webContents.printToPDF({ printBackground: true, pageSize: 'A4', preferCSSPageSize: true });
      fs.writeFileSync(result.filePath, buffer); return true;
    } finally { pdfWin.destroy(); }
  });
});
app.on('before-quit', event => {
  try { pause(); quitting = true; destroyTray(); }
  catch (e) { event.preventDefault(); quitting = false; showApp(); dialog.showErrorBox('خطا در ذخیره', e.message); }
});
app.on('second-instance', showApp);
app.on('window-all-closed', () => app.quit());
