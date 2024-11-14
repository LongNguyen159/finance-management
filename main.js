const { app, BrowserWindow, globalShortcut } = require('electron');
const { screen } = require('electron');

const path = require('path');

let win;

function createWindow() {
  // Create the browser window.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 450,
    minHeight: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false, // disable devTools for production
    },
    frame: true,         // Show the window frame (this allows you to drag and resize the window)
    resizable: true,     // Allow resizing the window (optional)
  });

  // Load the Angular app (dist folder)
  win.loadFile(path.join(__dirname, 'dist/easy-sankey/browser/index.html'));

  // Open the DevTools for debugging.
  // win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });
}


app.on('ready', () => {
  createWindow();

  // Register shortcuts to prevent reloading
  globalShortcut.register('CommandOrControl+R', () => {
    // Do nothing to prevent reload
  });

  globalShortcut.register('F5', () => {
    // Do nothing to prevent reload
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});