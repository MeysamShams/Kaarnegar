const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  load: () => ipcRenderer.invoke('load'), save: state => ipcRenderer.invoke('save', state),
  exportPDF: html => ipcRenderer.invoke('pdf', html), backup: () => ipcRenderer.invoke('backup'),
  importBackup: () => ipcRenderer.invoke('import'), widget: compact => ipcRenderer.invoke('widget', compact),
  onState: callback => { const listener = (_, state) => callback(state); ipcRenderer.on('state', listener); return () => ipcRenderer.removeListener('state', listener); }
});
