# Changelog

All notable changes to the "Spotify Player Pro" extension will be documented in this file.

## [1.4.0] - 2025-12-15

### Added
- 🎤 **Synchronized Lyrics Display**: View real-time lyrics for the currently playing track
- ✨ **Auto-Sync Highlighting**: Current line being sung is automatically highlighted
- 🔄 **Auto-Fetch Lyrics**: Lyrics load automatically when tracks change (toggleable)
- 📝 **Manual Refresh**: Retry button to fetch lyrics if they don't load initially
- 🌍 **Multi-Language Support**: Perfect for understanding songs in foreign languages
- 🎵 **Sing-Along Mode**: Great for developers who like to sing while coding
- 📊 **Lyrics Panel**: New dedicated sidebar section for lyrics display

### Improved
- 🎯 Enhanced user experience with automatic lyrics synchronization
- 💫 Better integration with playback progress tracking
- 🔧 Fallback API support for better lyrics availability

## [1.3.0] - 2025-12-15

### Added
- 🌟 **User feedback prompt**: Gentle reminder to rate the extension after successful authentication
- 🔄 **Intelligent auto-reconnect**: Extension now automatically reconnects on VS Code restart
- 🔁 **Retry logic**: Network failures now retry automatically instead of requiring re-authentication
- 📊 **Better connection status**: Clear notifications when connection succeeds or needs attention

### Fixed
- 🐛 **Session persistence bug**: Fixed issue where users had to reconnect every time VS Code restarted
- 🔑 **Token refresh improvements**: Smarter token refresh that preserves credentials on network errors
- ⚡ **Faster startup**: Auto-authentication now happens in background with retry logic

### Improved
- 📝 Better logging for debugging authentication issues
- 🎯 More helpful error messages when re-authentication is actually needed
- ⏱️ Exponential backoff for network retries

## [1.2.1] - Previous Release

### Features
- Full Spotify playback control integration
- Album artwork display
- Queue management with click-to-play
- Playlist browsing and playback
- Status bar controls
- Auto-authentication on startup
- Real-time playback sync
