const { contextBridge, ipcRenderer } = require('electron');

// Securely expose native APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // You will add IPC functions here later (e.g., to read local music files)
});
