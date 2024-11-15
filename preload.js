const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer process in a controlled way
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages from the renderer to the main process
  sendToMain: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  // Listen for messages from the main process
  receiveFromMain: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
});