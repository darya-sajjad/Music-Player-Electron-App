# Spotify Controller

A tiny, frameless, always-on-desktop Spotify widget built with Electron. It shows the currently playing track's cover art, a scrolling title marquee, a seekable progress bar, and play/pause/skip controls — all authenticated against your own Spotify account via OAuth (PKCE).

![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey) ![electron](https://img.shields.io/badge/Electron-Desktop%20App-47848F)

## Features

- 🎵 Live now-playing sync (cover art, title, progress) polling every second, with playback control.
- 🪟 Frameless, transparent, borderless window — sits on your desktop like a widget
- 🔐 Secure Spotify login using OAuth 2.0 with PKCE (no client secret stored)
- 🔁 Automatic token refresh, with re-auth fallback if a token is revoked
- 🚀 Optional launch-at-login

## Prerequisites

- [Node.js](https://nodejs.org/) (includes npm)
- A [Spotify account](https://www.spotify.com/) (Free or Premium — note that playback control endpoints require **Spotify Premium**)
- A Spotify Developer app (see setup below)

## Setup

### 1. Create a Spotify Developer App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill in an app name/description (anything you like).
4. Under **Redirect URIs**, add:
   ```
   http://127.0.0.1:8888/callback
   ```
5. Save, then open the app and copy the **Client ID**.

### 2. Add your Client ID

Open `main.js` and replace the placeholder with your own Spotify Client ID:

```js
const CLIENT_ID = 'your_spotify_client_id_here';
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app

```bash
npm start
```

On first launch, your default browser will open Spotify's login/consent screen. After you approve, the app exchanges the auth code for tokens locally and stores them in your OS's app data folder — tokens are refreshed automatically after that, so you shouldn't need to log in again.

## Usage

- **Click the cover/controls** to play, pause, skip, or go back a track.
- **Drag the progress bar** to seek within the current track.

## Setting it up as a Desktop Widget

The app is already built to behave like a widget — it launches as a small (234×365), frameless, transparent, borderless window with no dock/taskbar icon. To make it feel like a permanent fixture on your desktop rather than just another app window, follow the steps for your OS:

### Windows

1. Build the app into an executable (see [Packaging](#packaging-into-a-standalone-app) below), or run it via `npm start` from a shortcut.
2. Right-click the built `.exe` (or a shortcut to it) → **Send to → Desktop (create shortcut)**.
3. To have it launch automatically and sit ready on login, the app already enables **"Open at login"** via `app.setLoginItemSettings` in `main.js` — no extra configuration needed once it's been launched once.
4. Since the window is `skipTaskbar: true`, it won't clutter your taskbar — it will just appear as a floating panel on your desktop.
5. To position it, click and drag anywhere inside the widget (the window is frameless, so the whole surface is draggable by default in most setups — if not, hold `Alt` and drag).

### macOS

1. Build a `.app` bundle (see [Packaging](#packaging-into-a-standalone-app) below).
2. Drag the `.app` into your **Applications** folder.
3. On launch, the app automatically hides its Dock icon (`app.dock.hide()`) and stays visible across all Spaces/desktops (`setVisibleOnAllWorkspaces`), so it behaves like a native widget floating over your desktop.
4. To keep it running persistently in the background: System Settings → **General → Login Items** → add the app so it starts automatically when you log in.
5. Reposition it by clicking and dragging anywhere on the widget.

> 💡 Tip: If you want the widget to always stay on top of other windows instead of sitting at desktop level, change `win.setAlwaysOnTop(false)` to `true` in `main.js`'s `createWindow()` function.

## Packaging into a Standalone App

This project currently runs via `npm start` (Electron in dev mode). To distribute it as a real desktop app (`.exe`/`.app`) you can add a packager such as [Electron Forge](https://www.electronforge.io/) or [electron-builder](https://www.electron.build/):

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
npm run make
```

This will produce a platform-specific installer/executable in the `out/` folder that you can then set up as described above.

## Project Structure

```
Spotify-controller/
├── main.js         # Electron main process — window creation, Spotify OAuth/token handling
├── preload.js       # Secure bridge exposing electronAPI to the renderer
├── index.html        # Widget markup
├── script.js         # Renderer logic — playback state syncing, UI controls
├── styles.css         # Widget styling
└── assets/          # Fonts, background images, sample tracks
```

## Tech Stack

- [Electron](https://www.electronjs.org/) — desktop app shell
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) — playback state and control
- Vanilla JS/HTML/CSS — no frontend framework, kept lightweight for a widget

## Notes & Troubleshooting

- **"Nothing playing" shown constantly**: Make sure Spotify is open and actively playing on some device (desktop app, phone, web player) — the widget reflects your account's current playback, it doesn't play audio itself.
- **Controls don't do anything**: Playback control endpoints (play/pause/seek/skip) require a **Spotify Premium** account; Free accounts can only read state, not control it.
- **Login loop / 401 errors**: Delete the stored token file (path is logged to the console on startup as `Token file location: ...`) and restart the app to force a fresh login.
