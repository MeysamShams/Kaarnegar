const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  savePreferences: value => ipcRenderer.invoke('preferences', value),
  load: () => ipcRenderer.invoke('load'), save: state => ipcRenderer.invoke('save', state),
  exportPDF: (html, filename) => ipcRenderer.invoke('pdf', html, filename), backup: () => ipcRenderer.invoke('backup'),
  importBackup: () => ipcRenderer.invoke('import'), widget: compact => ipcRenderer.invoke('widget', compact),
  windowControl: action => ipcRenderer.invoke('window-control', action),
  syncChoose: disable => ipcRenderer.invoke('sync-choose', disable), syncStatus: () => ipcRenderer.invoke('sync-status'), syncNow: () => ipcRenderer.invoke('sync-now'),
  onSynced: callback => { const listener = (_, state) => callback(state); ipcRenderer.on('synced', listener); return () => ipcRenderer.removeListener('synced', listener); },
  onSyncStatus: callback => { const listener = (_, status) => callback(status); ipcRenderer.on('sync-status', listener); return () => ipcRenderer.removeListener('sync-status', listener); },
  isMaximized: () => ipcRenderer.invoke('window-maximized'),
  onMaximized: callback => { const listener = (_, value) => callback(value); ipcRenderer.on('window-maximized', listener); return () => ipcRenderer.removeListener('window-maximized', listener); },
  onState: callback => { const listener = (_, state) => callback(state); ipcRenderer.on('state', listener); return () => ipcRenderer.removeListener('state', listener); }
});
