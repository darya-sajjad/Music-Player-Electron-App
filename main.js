const { app, BrowserWindow } = require("electron");
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 234,
        height: 335,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        frame: false, 
        transparent: true,
        hasShadow: true,
        webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});