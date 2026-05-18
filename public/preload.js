const { contextBridge, ipcRenderer } = require('electron');

// Expose safe IPC methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Save trades to file
  saveTrades: (trades) => ipcRenderer.invoke('save-trades', trades),
  
  // Load trades from file
  loadTrades: () => ipcRenderer.invoke('load-trades'),
  
  // Backup trades
  backupTrades: (trades) => ipcRenderer.invoke('backup-trades', trades),
  
  // Get app data path
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
});

// Log that preload script loaded
console.log('Electron preload script loaded - IPC bridge ready');
