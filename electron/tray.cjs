const { Tray, Menu } = require('electron');
const path = require('node:path');
let tray, menu, window, quitApp;

function showApp() {
  if (!window || window.isDestroyed()) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}

function initializeTray(win, quit, language='fa') {
  window = win;
  quitApp = quit;
  tray = new Tray(path.join(__dirname, '../dist/icon.ico'));
  updateTrayLanguage(language);
  tray.on('click', showApp);
  tray.on('double-click', showApp);
}

function updateTrayLanguage(language) {
  tray.setToolTip(language==='en'?'Kaarnegar':'کارنگار');
  menu = Menu.buildFromTemplate([
    { id: 'open-app', label: language==='en'?'Open app':'باز کردن برنامه', click: showApp },
    { type: 'separator' },
    { id: 'quit-app', label: language==='en'?'Quit app':'خروج از برنامه', click: quitApp }
  ]);
  tray.setContextMenu(menu);
}

function destroyTray() {
  if (tray && !tray.isDestroyed()) tray.destroy();
}

module.exports = { initializeTray, updateTrayLanguage, showApp, destroyTray, getTray: () => tray, getMenu: () => menu };
