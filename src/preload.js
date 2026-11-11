const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hbapp', {
  getState: () => ipcRenderer.invoke('state:get'),
  setConfig: (patch) => ipcRenderer.invoke('config:set', patch),
  action: (name, arg) => ipcRenderer.invoke('action', name, arg),
  log: (text) => ipcRenderer.send('log', String(text))
});
