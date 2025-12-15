import * as vscode from 'vscode';
import { SpotifyAuthProvider } from './spotifyAuth';
import { SpotifyApiClient } from './spotifyApi';
import { NowPlayingProvider, ControlsProvider, QueueProvider, PlaylistsProvider } from './panel/TreeViewProviders';

export function activate(context: vscode.ExtensionContext) {
    console.log('Spotify VS Code Extension is now active!');

    // Initialize providers
    const authProvider = new SpotifyAuthProvider(context);
    const apiClient = new SpotifyApiClient(authProvider);
    
    // Initialize tree view providers
    const nowPlayingProvider = new NowPlayingProvider();
    const controlsProvider = new ControlsProvider();
    const queueProvider = new QueueProvider();
    const playlistsProvider = new PlaylistsProvider();

    // Try auto-authentication on startup
    (async () => {
        try {
            console.log('🎵 Spotify: Starting auto-authentication...');
            const autoAuthSuccess = await authProvider.tryAutoAuthenticate();
            
            if (autoAuthSuccess) {
                console.log('✅ Spotify: Auto-authentication successful!');
                vscode.window.setStatusBarMessage('$(check) Spotify connected', 3000);
                updateAllProviders();
            } else {
                console.log('⚠️ Spotify: Auto-authentication failed');
                
                // Check if we have credentials but tokens expired
                if (authProvider.hasStoredCredentials() && !authProvider.hasStoredTokens()) {
                    // Show helpful notification
                    const response = await vscode.window.showWarningMessage(
                        '🎵 Spotify session expired. Reconnect to continue using controls.',
                        'Reconnect Now',
                        'Later'
                    );
                    
                    if (response === 'Reconnect Now') {
                        vscode.commands.executeCommand('spotify.authenticate');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Spotify: Auto-authentication error:', error);
        }
    })();

    // Create status bar items for music controls
    let statusBarItem: vscode.StatusBarItem;
    let prevButton: vscode.StatusBarItem;
    let playPauseButton: vscode.StatusBarItem;
    let nextButton: vscode.StatusBarItem;

    // Initialize status bar items
    function createStatusBarItems() {
        // Main status bar item showing current song
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 200);
        statusBarItem.command = 'spotify.togglePlayPause';
        statusBarItem.text = '🎵 No music playing';
        statusBarItem.tooltip = 'Click to play/pause music';
        statusBarItem.show();

        // Previous button
        prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 199);
        prevButton.text = '⏮️';
        prevButton.command = 'spotify.previous';
        prevButton.tooltip = 'Previous track';
        prevButton.show();

        // Play/Pause button
        playPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 198);
        playPauseButton.text = '▶️';
        playPauseButton.command = 'spotify.togglePlayPause';
        playPauseButton.tooltip = 'Play/Pause';
        playPauseButton.show();

        // Next button
        nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 197);
        nextButton.text = '⏭️';
        nextButton.command = 'spotify.next';
        nextButton.tooltip = 'Next track';
        nextButton.show();

        return [statusBarItem, prevButton, playPauseButton, nextButton];
    }

    const statusBarItems = createStatusBarItems();

    // Register tree view providers
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('spotifyPlayer', nowPlayingProvider),
        vscode.window.registerTreeDataProvider('spotifyControls', controlsProvider),
        vscode.window.registerTreeDataProvider('spotifyQueue', queueProvider),
        vscode.window.registerTreeDataProvider('spotifyPlaylists', playlistsProvider)
    );

    // Register commands
    const authenticateCommand = vscode.commands.registerCommand('spotify.authenticate', async () => {
        try {
            await authProvider.authenticate();
            vscode.window.showInformationMessage('Successfully authenticated with Spotify!');
            updateAllProviders();
            
            // Show review prompt after successful first-time authentication
            const hasShownReviewPrompt = context.globalState.get('hasShownReviewPrompt', false);
            if (!hasShownReviewPrompt) {
                setTimeout(async () => {
                    const response = await vscode.window.showInformationMessage(
                        '🎵 Enjoying Spotify Player Pro? Your review helps others discover it!',
                        'Rate Extension ⭐',
                        'Maybe Later'
                    );
                    
                    if (response === 'Rate Extension ⭐') {
                        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=kushal-raj-g-s.spotify-vscode-extension&ssr=false#review-details'));
                    }
                    
                    await context.globalState.update('hasShownReviewPrompt', true);
                }, 10000); // Wait 10 seconds after successful auth
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to authenticate: ${error}`);
        }
    });

    const logoutCommand = vscode.commands.registerCommand('spotify.logout', async () => {
        try {
            await authProvider.logout();
            vscode.window.showInformationMessage('Successfully logged out from Spotify!');
            updateAllProviders();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to logout: ${error}`);
        }
    });

    const refreshCommand = vscode.commands.registerCommand('spotify.refresh', () => {
        updateAllProviders();
        vscode.window.showInformationMessage('Spotify player refreshed!');
    });

    // Playback control commands
    const playCommand = vscode.commands.registerCommand('spotify.play', async () => {
        try {
            await apiClient.play();
            setTimeout(updateAllProviders, 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to play: ${error}`);
        }
    });

    const pauseCommand = vscode.commands.registerCommand('spotify.pause', async () => {
        try {
            await apiClient.pause();
            setTimeout(updateAllProviders, 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to pause: ${error}`);
        }
    });

    const nextCommand = vscode.commands.registerCommand('spotify.next', async () => {
        try {
            await apiClient.skipToNext();
            setTimeout(updateAllProviders, 1000);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to skip: ${error}`);
        }
    });

    const previousCommand = vscode.commands.registerCommand('spotify.previous', async () => {
        try {
            await apiClient.skipToPrevious();
            setTimeout(updateAllProviders, 1000);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to go back: ${error}`);
        }
    });

    const setVolumeCommand = vscode.commands.registerCommand('spotify.setVolume', async () => {
        const volume = await vscode.window.showInputBox({
            prompt: 'Enter volume (0-100)',
            placeHolder: '50',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 0 || num > 100) {
                    return 'Please enter a number between 0 and 100';
                }
                return null;
            }
        });

        if (volume) {
            try {
                await apiClient.setVolume(parseInt(volume));
                setTimeout(updateAllProviders, 500);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to set volume: ${error}`);
            }
        }
    });

    const toggleShuffleCommand = vscode.commands.registerCommand('spotify.toggleShuffle', async () => {
        try {
            const state = await apiClient.getPlaybackState();
            if (state) {
                await apiClient.setShuffle(!state.shuffle_state);
                setTimeout(updateAllProviders, 500);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle shuffle: ${error}`);
        }
    });

    const toggleRepeatCommand = vscode.commands.registerCommand('spotify.toggleRepeat', async () => {
        try {
            const state = await apiClient.getPlaybackState();
            if (state) {
                const nextState = state.repeat_state === 'off' ? 'context' : 
                                state.repeat_state === 'context' ? 'track' : 'off';
                await apiClient.setRepeat(nextState);
                setTimeout(updateAllProviders, 500);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle repeat: ${error}`);
        }
    });

    const addToQueueCommand = vscode.commands.registerCommand('spotify.addToQueue', async () => {
        const uri = await vscode.window.showInputBox({
            prompt: 'Enter Spotify track URI',
            placeHolder: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
            validateInput: (value) => {
                if (!value.startsWith('spotify:track:')) {
                    return 'Please enter a valid Spotify track URI (spotify:track:...)';
                }
                return null;
            }
        });

        if (uri) {
            try {
                await apiClient.addToQueue(uri);
                vscode.window.showInformationMessage('Track added to queue!');
                setTimeout(updateAllProviders, 500);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add to queue: ${error}`);
            }
        }
    });

    const togglePlayPauseCommand = vscode.commands.registerCommand('spotify.togglePlayPause', async () => {
        try {
            const currentTrack = await apiClient.getCurrentlyPlaying();
            if (currentTrack?.is_playing) {
                await apiClient.pause();
            } else {
                await apiClient.play();
            }
            setTimeout(updateAllProviders, 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle playback: ${error}`);
        }
    });

    // Queue management commands - Removed playQueueTrack functionality per user request
    // New queue expansion commands
    const showMoreQueueCommand = vscode.commands.registerCommand('spotify.showMoreQueue', async () => {
        queueProvider.toggleShowAll();
    });

    const showLessQueueCommand = vscode.commands.registerCommand('spotify.showLessQueue', async () => {
        queueProvider.toggleShowAll();
    });

    // New playlist commands
    const playPlaylistCommand = vscode.commands.registerCommand('spotify.playPlaylist', async (playlistUri) => {
        if (playlistUri) {
            try {
                await apiClient.playPlaylist(playlistUri);
                vscode.window.showInformationMessage('Playing playlist!');
                setTimeout(updateAllProviders, 1000);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to play playlist: ${error}`);
            }
        } else {
            vscode.window.showErrorMessage('No playlist URI provided');
        }
    });

    context.subscriptions.push(
        authenticateCommand, logoutCommand, refreshCommand,
        playCommand, pauseCommand, nextCommand, previousCommand,
        setVolumeCommand, toggleShuffleCommand, toggleRepeatCommand,
        addToQueueCommand, togglePlayPauseCommand,
        showMoreQueueCommand, showLessQueueCommand, playPlaylistCommand,
        ...statusBarItems
    );

    // Function to update status bar with current track info
    function updateStatusBar(currentlyPlaying: any, isAuthenticated: boolean) {
        if (!isAuthenticated) {
            statusBarItem.text = '🎵 Spotify: Not connected';
            statusBarItem.tooltip = 'Click to connect to Spotify';
            statusBarItem.command = 'spotify.authenticate';
            
            // Hide control buttons when not connected
            prevButton.hide();
            playPauseButton.hide();
            nextButton.hide();
            return;
        }

        if (!currentlyPlaying || !currentlyPlaying.item) {
            statusBarItem.text = '🎵 No music playing';
            statusBarItem.tooltip = 'Start playing music on Spotify';
            statusBarItem.command = 'spotify.togglePlayPause';
            
            // Show control buttons but with default states
            prevButton.show();
            playPauseButton.show();
            nextButton.show();
            playPauseButton.text = '▶️';
            return;
        }

        const track = currentlyPlaying.item;
        const artist = track.artists[0]?.name || 'Unknown Artist';
        const trackName = track.name.length > 25 ? track.name.substring(0, 25) + '...' : track.name;
        
        // Update main status bar item with current song
        statusBarItem.text = `🎵 ${trackName} • ${artist}`;
        statusBarItem.tooltip = `${track.name}\nby ${track.artists.map((a: any) => a.name).join(', ')}\nAlbum: ${track.album.name}\n\nClick to ${currentlyPlaying.is_playing ? 'pause' : 'play'}`;
        statusBarItem.command = 'spotify.togglePlayPause';

        // Update play/pause button
        playPauseButton.text = currentlyPlaying.is_playing ? '⏸️' : '▶️';
        playPauseButton.tooltip = currentlyPlaying.is_playing ? 'Pause' : 'Play';

        // Show all control buttons
        prevButton.show();
        playPauseButton.show();
        nextButton.show();
    }

    // Function to update all providers
    async function updateAllProviders() {
        const isAuthenticated = authProvider.isAuthenticated();
        
        // Update auth status for all providers
        nowPlayingProvider.updateAuthStatus(isAuthenticated);
        controlsProvider.updateAuthStatus(isAuthenticated);
        queueProvider.updateAuthStatus(isAuthenticated);
        playlistsProvider.updateAuthStatus(isAuthenticated);

        if (!isAuthenticated) {
            updateStatusBar(null, false);
            return;
        }

        try {
            const [currentlyPlaying, queueData, playbackState, playlists] = await Promise.all([
                apiClient.getCurrentlyPlaying(),
                apiClient.getQueue(),
                apiClient.getPlaybackState(),
                apiClient.getUserPlaylists().catch(() => ({ items: [] })) // Gracefully handle playlists failure
            ]);

            // Update providers with new data
            nowPlayingProvider.updateCurrentTrack(currentlyPlaying);
            controlsProvider.updatePlaybackState(
                currentlyPlaying?.is_playing || false, 
                playbackState
            );
            queueProvider.updateQueue(queueData);
            playlistsProvider.updatePlaylists(playlists.items || []);

            // Update status bar with current track info
            updateStatusBar(currentlyPlaying, isAuthenticated);

        } catch (error) {
            console.error('Failed to update Spotify data:', error);
            // Update status bar with error state
            updateStatusBar(null, isAuthenticated);
        }
    }

    // Start periodic updates
    const updateInterval = setInterval(updateAllProviders, 5000);
    context.subscriptions.push({ dispose: () => clearInterval(updateInterval) });

    // Initial update
    updateAllProviders();
}

export function deactivate() {
    console.log('Spotify VS Code Extension is now deactivated!');
}