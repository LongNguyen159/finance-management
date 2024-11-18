const { app, BrowserWindow, globalShortcut } = require('electron');
const { screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
// Import the app version from package.json
const { version } = require('./package.json');

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

  // Register a shortcut listener
  win.webContents.on('before-input-event', (event, input) => {
    if (
      input.type === 'keyDown' &&
      input.key === 'r' &&
      (input.control || input.meta) // Detect Ctrl (Windows/Linux) or Cmd (macOS)
    ) {
      event.preventDefault(); // Prevent default reload
      // win.reload(); // Reload the Electron app
    }
  });

  win.on('closed', () => {
    win = null;
  });
}

// Auto-update logic
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();


  // Notify the renderer process when an update is available
  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update_available', info);

    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  
  });

  // Notify the renderer process when an update is downloaded
  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update_downloaded', info);
  });

  // Handle errors
  autoUpdater.on('error', (err) => {
    console.error('Auto-Updater Error:', err);
  });
}




app.on('ready', () => {
  createWindow();
  // setupAutoUpdater();
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