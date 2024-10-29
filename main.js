const { app, BrowserWindow } = require('electron');
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
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

app.on('ready', createWindow);

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