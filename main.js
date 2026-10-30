const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 620,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#f5f7fb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Permit same-app local popup windows. The POS print routine may use
  // window.open() to create a temporary bill/KOT print document.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file://')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 900,
          height: 700,
          autoHideMenuBar: true,
          parent: win,
          modal: false,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true
          }
        }
      };
    }

    // Open external websites in the user's default browser, never as app popups.
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://')) {
        shell.openExternal(url);
      }
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'index.html')).catch((error) => {
    dialog.showErrorBox('EASY BILL LK', `Could not open index.html: ${error.message}`);
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    dialog.showErrorBox(
      'EASY BILL LK',
      `The app window stopped unexpectedly (${details.reason}). Please reopen the application.`
    );
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
