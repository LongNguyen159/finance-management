const { app, BrowserWindow, globalShortcut } = require('electron');
const { screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
// Import the app version from package.json
const { version } = require('./package.json');
const path = require('path');

//#region Server Setup
/** Set up server to host the Machine Learning model. */
const express = require('express');
const Arima = require('arima');
const cors = require('cors');
const server = express();
const isArray = require('mathjs').isArray;
const port = 3223;


server.use(cors()); // Add this line before your routes
// Middleware to parse JSON body data
server.use(express.json());

// Define API endpoint for ARIMA prediction
server.post('/predict', (req, res) => {
  const data = req.body.data;
  const monthsToPredict = req.body.monthsToPredict || 5; // Default to 5 if not provided


  if (isArray(data) === false) {
    return res.status(400).json({ error: 'Data must be an array of numbers' });
  }
  // Set up ARIMA model
  const model = new Arima({
    p: 1,   // AR part, start with 1 for capturing the previous value
    d: 1,   // Differencing, try 1 for a simple trend removal
    q: 1    // MA part, start with 1 for modeling the error term
  });

  model.train(data);
  const forecast = model.predict(monthsToPredict); // Forecast the next 5 values

  // Send the prediction back as a response
  res.json({ forecast });
});

// Start the server
const serverInstance = server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
//#endregion


// let serverInstance;

// async function startServer() {
//   try {
//     serverInstance = server.listen(port, () => {
//       console.log(`Server running on http://localhost:${port}`);
//       dialog.showMessageBoxSync({
//         type: 'info',
//         title: 'Server Started',
//         detail: `The prediction service is running on http://localhost:${port}`,
//       });
//     });
//   } catch (error) {
//     console.error('Failed to start the server:', error.message);
//     dialog.showMessageBoxSync({
//       type: 'error',
//       title: 'Internal Server Error',
//       message: 'Failed to start the prediction service. The application will continue without prediction functionality.',
//       detail: error.message,
//     });
//   }
// }


//#region App Setup
/** Set up Electron App. */

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

    serverInstance.close(() => {
      console.log('Express server closed');
    });


    app.quit();
  }
});

app.on('before-quit', () => {
  serverInstance.close(() => {
    console.log('Express server closed before quit');
  });
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
//#endregion