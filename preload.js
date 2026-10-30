const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ebNative', {
  printHTML: (html, opts) => ipcRenderer.invoke('eb-print-html', html, opts || {})
});
