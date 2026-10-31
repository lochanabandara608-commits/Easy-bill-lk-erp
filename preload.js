const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ebNative', {
  printHTML: (html, opts) => ipcRenderer.invoke('eb-print-html', html, opts || {}),
  alertSync: (msg) => ipcRenderer.sendSync('eb-alert', String(msg)),
  confirmSync: (msg) => ipcRenderer.sendSync('eb-confirm', String(msg))
});
