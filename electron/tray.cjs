const { Tray, Menu } = require('electron');
const path = require('node:path');
let tray, menu, window;

function showApp() {
  if (!window || window.isDestroyed()) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}

function initializeTray(win, quit) {
  window = win;
  tray = new Tray(path.join(__dirname, '../dist/icon.ico'));
  tray.setToolTip('کارنگار');
  menu = Menu.buildFromTemplate([
    { id: 'open-app', label: 'باز کردن برنامه', click: showApp },
    { type: 'separator' },
    { id: 'quit-app', label: 'خروج از برنامه', click: quit }
  ]);
  tray.setContextMenu(menu);
  tray.on('click', showApp);
  tray.on('double-click', showApp);
}

function destroyTray() {
  if (tray && !tray.isDestroyed()) tray.destroy();
}

module.exports = { initializeTray, showApp, destroyTray, getTray: () => tray, getMenu: () => menu };
