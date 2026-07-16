const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

const CLIENT_ID = '997254b6783c4cebb15e47e9a1d2bf2e'; // <-- paste your Spotify Client ID
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const TOKEN_PATH = path.join(app.getPath('userData'), 'spotify-tokens.json');

let pendingLogin = null;

function base64url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function saveTokens(tokens) {
    tokens.obtained_at = Date.now();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
}

function loadTokens() {
    try {
        return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    } catch {
        return null;
    }
}

function loginWithSpotify() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());

  const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      res.end('Login successful — you can close this tab.');
      server.close();

      try {
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: verifier
          })
        });
        const tokens = await tokenRes.json();

        if (!tokenRes.ok || !tokens.access_token) {
          console.error('Spotify token exchange failed:', tokenRes.status, tokens);
          reject(new Error('Token exchange failed'));
          return;
        }

        saveTokens(tokens);
        resolve(tokens);
      } catch (err) {
        console.error('Token exchange threw an error:', err);
        reject(err);
      }
    });
    server.listen(8888, () => shell.openExternal(authUrl));
  });
}

async function refreshTokens(refresh_token) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token,
            client_id: CLIENT_ID
        })
    });
    const tokens = await res.json();
    if (!tokens.refresh_token) tokens.refresh_token = refresh_token; // Spotify may omit it on refresh
    saveTokens(tokens);
    return tokens;
}

async function getValidAccessToken() {
  let tokens = loadTokens();

  if (!tokens) {
    if (!pendingLogin) {
      pendingLogin = loginWithSpotify().finally(() => { pendingLogin = null; });
    }
    tokens = await pendingLogin;
    return tokens.access_token;
  }

  const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
  if (Date.now() > expiresAt - 60000) {
    tokens = await refreshTokens(tokens.refresh_token);
  }

  return tokens.access_token;
}

function createWindow() {
    console.log('Token file location:', TOKEN_PATH);
    const win = new BrowserWindow({
        width: 234,
        height: 365,
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

ipcMain.handle('spotify-get-token', async () => {
    return getValidAccessToken();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});