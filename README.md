# 🎵 Spotify Player Pro for VS Code

A complete Spotify integration for Visual Studio Code that brings your music experience directly into your coding environment. Features album artwork, intelligent queue navigation, status bar controls, and a beautiful sidebar.

> **✨ NEW in v1.3.0:** Auto-reconnect on startup! No more manual reconnections every time you open VS Code. Authenticate once and you're set forever! 🎉

## ☕ Support the Developer

If you love this extension and find it useful in your daily coding workflow, consider supporting its development!

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/kushal.raj.gs)

Your support helps me:
- 🚀 Continue developing new features
- 🐛 Fix bugs and improve performance  
- 📱 Add support for more platforms
- 🎵 Enhance the music experience for developers

Every coffee makes a difference! ☕💻

## ✨ Features

### 🎮 Complete Playback Control
- **Play/Pause, Skip, Previous**: Full transport controls in sidebar and status bar
- **Volume Control**: Adjust volume directly from VS Code
- **Shuffle & Repeat**: Toggle playback modes with visual state indicators

### 🎵 Rich Now Playing Display  
- **Album Artwork**: Large, high-quality album covers displayed prominently
- **Track Information**: Song name, artist, album with song-name-first display
- **Progress Tracking**: Real-time playback progress with time indicators
- **Status Bar Integration**: Current track info in status bar for seamless coding

### 📝 Smart Queue Management
- **Visual Queue**: See upcoming tracks with artwork and full track info
- **Click to Play**: Click any queue item to jump to that track instantly
- **Natural Queue Flow**: Queue continues naturally from selected track position
- **Add Tracks**: Add songs to queue via Spotify URI
- **Expandable Display**: Click "... and N more" to show all remaining queue tracks

### 🎵 Complete Playlist Management  
- **Browse All Playlists**: Dedicated section showing all your Spotify playlists
- **One-Click Playback**: Click any playlist to start playing it immediately
- **Playlist Information**: Shows playlist name, owner, and track count

### 🔄 Persistent Authentication
- **Auto-Connect**: Automatically connects on startup using stored credentials
- **Smart Token Refresh**: Handles token expiration seamlessly in background
- **OAuth 2.0 with PKCE**: Industry-standard secure authentication

## 📸 Interface Overview

The extension adds a **"Spotify"** tab to your VS Code activity bar with three organized sections:

### 🎵 Now Playing
- Large album artwork for immersive music experience
- Song-name-first display for easy track identification  
- Real-time progress with remaining time
- Artist and album info with clean typography

### 🎛️ Controls  
- Smart Play/Pause button that updates based on playback state
- Previous/Next track navigation
- Volume control with direct input
- Shuffle and Repeat toggles with current state indicators

### 📝 Queue & Playlists
- Visual track list with track numbers and full info
- **Click any track** to jump to that position in queue instantly
- Queue flows naturally from selected track (e.g., click track #5 → plays #5, #6, #7...)
- Browse all your Spotify playlists
- Add tracks by Spotify URI

## 🚀 Installation & Setup

### 1. Create a Spotify Developer App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the required information:
   - **App Name**: `VS Code Spotify Extension` (or any name you prefer)
   - **App Description**: `Spotify integration for VS Code`
   - **Redirect URI**: `http://127.0.0.1:8000/callback`
5. Click "Save"
6. Note down your **Client ID** and **Client Secret** (you'll need these later)

### 2. Configure the Extension

1. Open VS Code
2. Look for the **"Spotify"** icon in the Activity Bar (left side)
3. Click it to open the Spotify sidebar
4. In any of the three sections (Now Playing, Controls, Queue), click the **"Connect to Spotify"** button in the section header
5. Enter your **Client ID** from step 1
6. Enter your **Client Secret** from step 1
7. Click **"OK"** when prompted about opening the authorization page
8. Your browser will open with Spotify's authorization page - click **"Agree"** to authorize
9. You'll be redirected to a page that says "This site can't be reached" - **this is normal!**
10. **Copy the entire URL** from your browser's address bar (it will look like: `http://127.0.0.1:8000/callback?code=AQD79unik...`)
11. **Paste the complete URL** back in VS Code when prompted
12. The extension will extract the authorization code and complete the setup!

## 🎛️ Usage

### Sidebar Navigation
- **Click the Spotify icon** in the Activity Bar to open the sidebar
- **Three sections** will appear: Now Playing, Controls, and Queue
- **Use toolbar buttons** in each section header for authentication and refresh

### Playback Control
- **Play/Pause**: Click the "Play" or "Pause" item in the Controls section
- **Skip Forward/Backward**: Click "Next" or "Previous" in the Controls section  
- **Volume Control**: Click "Volume: XX%" and enter a new value (0-100)
- **Shuffle/Repeat**: Click to toggle these states

### Queue Management
- **View Queue**: Expand the Queue section to see upcoming tracks
- **Add to Queue**: Click "Add track to queue" and paste a Spotify URI
- **Track Info**: Hover over tracks to see full title and artist

### Available Commands (Ctrl/Cmd + Shift + P)
- `Spotify: Authenticate` - Connect your Spotify account
- `Spotify: Logout` - Disconnect from Spotify  
- `Spotify: Refresh` - Manually refresh all sections
- `Spotify: Play/Pause/Next/Previous` - Direct playback controls
- `Spotify: Set Volume` - Adjust volume with input
- `Spotify: Toggle Shuffle/Repeat` - Change playback modes
- `Spotify: Add to Queue` - Add track by URI

## 🛠️ Development

### Project Structure
```
spotify-vscode-extension/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── spotifyAuth.ts            # OAuth PKCE authentication
│   ├── spotifyApi.ts             # Spotify Web API wrapper
│   └── panel/
│       ├── Sidebar.ts            # Webview panel provider
│       └── ui/                   # React UI components
│           ├── index.tsx         # Main React app
│           ├── styles.css        # TailwindCSS styles
│           └── components/
│               ├── NowPlaying.tsx
│               ├── Controls.tsx
│               └── Queue.tsx
├── package.json                  # Extension manifest and dependencies
├── webpack.config.js             # Build configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Tech Stack
- **Backend**: TypeScript, Node.js
- **Frontend**: React 18, TailwindCSS
- **Bundling**: Webpack 5
- **Authentication**: OAuth 2.0 with PKCE
- **API**: Spotify Web API
- **Storage**: VS Code GlobalState

### Build Commands
```bash
# Development build with watch mode
npm run watch

# Production build
npm run compile

# Lint code
npm run lint

# Package extension
vsce package
```

### API Endpoints Used
- `/v1/me/player/currently-playing` - Get current track
- `/v1/me/player` - Get playback state
- `/v1/me/player/queue` - Get queue
- `/v1/me/player/play` - Start playback
- `/v1/me/player/pause` - Pause playback
- `/v1/me/player/next` - Skip to next track
- `/v1/me/player/previous` - Go to previous track
- `/v1/me/player/volume` - Set volume
- `/v1/me/player/queue?uri=...` - Add to queue

## 🔐 Security & Privacy

- **OAuth PKCE Flow**: Uses the most secure OAuth flow for public clients
- **No Secrets in Code**: Client secret is entered by user, not stored in source code
- **Local Storage**: Tokens stored securely in VS Code's global state
- **Automatic Refresh**: Tokens are refreshed automatically when they expire
- **Scopes**: Only requests minimal required permissions:
  - `user-read-currently-playing`
  - `user-read-playback-state`
  - `user-modify-playback-state`
  - `user-read-recently-played`
  - `playlist-read-private`
  - `playlist-read-collaborative`

## 🔧 Troubleshooting

### Common Issues

**1. "Authentication failed" error**
- Ensure your Spotify app has the correct redirect URI: `http://127.0.0.1:8000/callback`
- Check that your Client ID and Secret are correct
- When copying the redirect URL, make sure to copy the **entire URL** including the `?code=` part
- The "This site can't be reached" error page is normal - just copy the URL from the address bar
- Make sure you have a Spotify Premium account (required for playback control)

**2. "No active device" error**
- Open Spotify on any device (phone, computer, web player)
- Start playing something to activate the device
- The extension will detect and use the active device

**3. "Rate limited" error**
- You're making too many API requests
- Wait a moment and try again
- The extension automatically handles rate limiting

**4. Extension not appearing**
- Check that the extension is installed and enabled
- Look in the Explorer sidebar for "Spotify Player"
- Try reloading VS Code window (Ctrl/Cmd + Shift + P > "Developer: Reload Window")

**5. Extension keeps asking to reconnect?**
- **Fixed in v1.3.0!** Update to the latest version
- If still occurring: Logout and re-authenticate once
- Your session will now persist across VS Code restarts automatically

### Debug Mode
Enable debug logging by opening VS Code's Developer Console:
1. `Help` > `Toggle Developer Tools`
2. Check the Console tab for error messages

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin my-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🎵 Spotify Requirements

- **Spotify Premium**: Required for playback control features
- **Active Session**: Must have an active Spotify session on any device
- **Developer App**: Must create a Spotify Developer app to get credentials

## 🙏 Acknowledgments

- Built with the [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- Uses [React](https://reactjs.org/) for the UI
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Follows VS Code [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

---

Made with ❤️ for the developer community. Enjoy coding with your favorite tunes! 🎧