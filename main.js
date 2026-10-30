const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366, height: 768, show: false, title: 'EASY BILL LK',
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  win.maximize();
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));
  win.loadFile(path.join(__dirname, 'index.html'));
}

// Receipt / KOT printing without popups. silent:true prints straight to the default printer.
ipcMain.handle('eb-print-html', async (_e, html, opts) => {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise(r => setTimeout(r, 300));
    return await new Promise(resolve => {
      w.webContents.print(
        { silent: !!opts.silent, printBackground: true, margins: { marginType: 'none' } },
        (success, reason) => { try { w.close(); } catch (e) {} resolve({ ok: success, reason }); }
      );
    });
  } catch (err) {
    try { w.close(); } catch (e) {}
    return { ok: false, reason: String(err) };
  }
});

const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
