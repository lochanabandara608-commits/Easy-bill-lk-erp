const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWin = null;
function createWindow() {
  const win = new BrowserWindow({
    width: 1366, height: 768, show: false, title: 'EASY BILL LK',
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }
  });
  mainWin = win;
  Menu.setApplicationMenu(null);
  win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('focus', () => { try { win.webContents.focus(); } catch (e) {} });
  win.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));
  win.loadFile(path.join(__dirname, 'index.html'));
}

// alert()/confirm() replacements. After a native dialog we hand keyboard focus back to the page,
// otherwise typing in the POS can stay "stuck" until the window is clicked away and back.
function refocus() {
  if (!mainWin || mainWin.isDestroyed()) return;
  mainWin.blur(); mainWin.focus(); mainWin.webContents.focus();
}
ipcMain.on('eb-alert', (e, msg) => {
  dialog.showMessageBoxSync(mainWin, { type: 'info', title: 'EASY BILL LK', message: msg, buttons: ['OK'] });
  refocus(); e.returnValue = true;
});
ipcMain.on('eb-confirm', (e, msg) => {
  const r = dialog.showMessageBoxSync(mainWin, { type: 'question', title: 'EASY BILL LK', message: msg, buttons: ['OK', 'Cancel'], defaultId: 0, cancelId: 1 });
  refocus(); e.returnValue = (r === 0);
});

// Receipt / KOT printing without popups. silent:true prints straight to the default printer.
ipcMain.handle('eb-print-html', async (_e, html, opts) => {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise(r => setTimeout(r, 300));
    return await new Promise(resolve => {
      w.webContents.print(
        { silent: !!opts.silent, printBackground: true, margins: { marginType: 'none' } },
        (success, reason) => { try { w.close(); } catch (e) {} setTimeout(refocus, 50); setTimeout(refocus, 400); resolve({ ok: success, reason }); }
      );
    });
  } catch (err) {
    try { w.close(); } catch (e) {}
    setTimeout(refocus, 50);
    return { ok: false, reason: String(err) };
  }
});

const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
