const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAccessToken: () => ipcRenderer.invoke('spotify-get-token'),
  logout: () => ipcRenderer.invoke('spotify-logout'),
});