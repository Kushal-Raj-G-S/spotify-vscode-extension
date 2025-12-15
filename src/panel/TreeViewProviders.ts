import * as vscode from 'vscode';

export class SpotifyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly iconPath?: string | vscode.Uri | vscode.ThemeIcon,
        public readonly contextValue?: string,
        public readonly tooltip?: string,
        public readonly data?: any
    ) {
        super(label, collapsibleState);
        this.command = command;
        this.iconPath = iconPath;
        this.contextValue = contextValue;
        this.tooltip = tooltip;
    }
}

export class NowPlayingProvider implements vscode.TreeDataProvider<SpotifyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SpotifyTreeItem | undefined | null | void> = new vscode.EventEmitter<SpotifyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SpotifyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentTrack: any = null;
    private isAuthenticated: boolean = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateCurrentTrack(track: any): void {
        this.currentTrack = track;
        this.refresh();
    }

    updateAuthStatus(isAuthenticated: boolean): void {
        this.isAuthenticated = isAuthenticated;
        this.refresh();
    }

    getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SpotifyTreeItem): Thenable<SpotifyTreeItem[]> {
        if (!this.isAuthenticated) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🔌 Click to connect',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.authenticate',
                        title: 'Connect to Spotify'
                    },
                    new vscode.ThemeIcon('plug'),
                    'authenticate',
                    'Connect your Spotify account'
                )
            ]);
        }

        if (!this.currentTrack || !this.currentTrack.item) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🎵 Nothing playing',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('music'),
                    'noTrack',
                    'Start playing music on any Spotify device'
                ),
                new SpotifyTreeItem(
                    '💡 Tip: Play music on Spotify first',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('lightbulb'),
                    'tip'
                )
            ]);
        }

        const track = this.currentTrack.item;
        const artists = track.artists.map((artist: any) => artist.name).join(', ');
        const progress = this.formatTime(this.currentTrack.progress_ms);
        const duration = this.formatTime(track.duration_ms);
        const progressPercent = Math.round((this.currentTrack.progress_ms / track.duration_ms) * 100);

        // Get album image URL (prefer largest available for maximum album cover size)
        let albumImageUri: vscode.Uri | vscode.ThemeIcon | undefined;
        if (track.album.images && track.album.images.length > 0) {
            // Use the largest image available (first in array is usually largest) for prominent display
            const albumImage = track.album.images[0]; // Largest available image
            if (albumImage?.url) {
                albumImageUri = vscode.Uri.parse(albumImage.url);
            }
        }
        
        // If no album image, use music icon
        if (!albumImageUri) {
            albumImageUri = new vscode.ThemeIcon('music');
        }

        // Create hierarchical structure with song as parent for prominent display
        if (!element) {
            return Promise.resolve([
                // MAIN SONG TITLE with album artwork - Make it as large and prominent as possible
                new SpotifyTreeItem(
                    `${track.name}`, // Show song name as the main item
                    vscode.TreeItemCollapsibleState.Expanded, // Always expanded to show content
                    {
                        command: this.currentTrack.is_playing ? 'spotify.pause' : 'spotify.play',
                        title: this.currentTrack.is_playing ? 'Pause' : 'Play'
                    },
                    albumImageUri, // Large album artwork as the icon
                    'songParent',
                    `🎵 NOW PLAYING\n\n"${track.name}"\nby ${artists}\n\nAlbum: ${track.album.name}\nProgress: ${progress} / ${duration}\n${this.currentTrack.is_playing ? '▶️ Currently Playing' : '⏸️ Paused'}\n\n🖼️ Click to ${this.currentTrack.is_playing ? 'pause' : 'play'}`
                )
            ]);
        }

        // Show track details as children under the song - music player style layout
        if (element.contextValue === 'songParent') {
            return Promise.resolve([
                // Artist - Now shows prominently under the song name
                new SpotifyTreeItem(
                    `by ${artists}`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('person'),
                    'artist',
                    `Artist(s): ${artists}`
                ),
                // Album name - Secondary info
                new SpotifyTreeItem(
                    `from "${track.album.name}"`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('package'),
                    'album',
                    `Album: ${track.album.name}`
                ),
                // Progress - Time format with visual progress indicator
                new SpotifyTreeItem(
                    `${progress} / ${duration} (${progressPercent}%)`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('clock'),
                    'progress',
                    `Progress: ${progressPercent}% complete\n\nProgress bar:\n${'█'.repeat(Math.floor(progressPercent/5))}${'░'.repeat(20-Math.floor(progressPercent/5))}\n\n${progress} of ${duration} elapsed`
                ),
                // Playback status with controls
                new SpotifyTreeItem(
                    `${this.currentTrack.is_playing ? '⏸️ Currently Playing' : '▶️ Paused'}`,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: this.currentTrack.is_playing ? 'spotify.pause' : 'spotify.play',
                        title: this.currentTrack.is_playing ? 'Pause' : 'Play'
                    },
                    new vscode.ThemeIcon(this.currentTrack.is_playing ? 'debug-pause' : 'play'),
                    'playState',
                    `${this.currentTrack.is_playing ? 'Music is currently playing' : 'Music is paused'}\nClick to ${this.currentTrack.is_playing ? 'pause' : 'play'}`
                )
            ]);
        }

        return Promise.resolve([]);
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export class ControlsProvider implements vscode.TreeDataProvider<SpotifyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SpotifyTreeItem | undefined | null | void> = new vscode.EventEmitter<SpotifyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SpotifyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private isAuthenticated: boolean = false;
    private isPlaying: boolean = false;
    private playbackState: any = null;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateAuthStatus(isAuthenticated: boolean): void {
        this.isAuthenticated = isAuthenticated;
        this.refresh();
    }

    updatePlaybackState(isPlaying: boolean, playbackState?: any): void {
        this.isPlaying = isPlaying;
        this.playbackState = playbackState;
        this.refresh();
    }

    getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SpotifyTreeItem): Thenable<SpotifyTreeItem[]> {
        if (!this.isAuthenticated) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🔌 Not connected',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.authenticate',
                        title: 'Connect to Spotify'
                    },
                    new vscode.ThemeIcon('plug'),
                    'authenticate',
                    'Connect your Spotify account'
                )
            ]);
        }

        return Promise.resolve([
            new SpotifyTreeItem(
                '⏮️ Previous',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.previous',
                    title: 'Previous Track'
                },
                new vscode.ThemeIcon('debug-step-back'),
                'previous',
                'Play previous track'
            ),
            new SpotifyTreeItem(
                `${this.isPlaying ? '⏸️ Pause' : '▶️ Play'}`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: this.isPlaying ? 'spotify.pause' : 'spotify.play',
                    title: this.isPlaying ? 'Pause' : 'Play'
                },
                new vscode.ThemeIcon(this.isPlaying ? 'debug-pause' : 'play'),
                'playPause',
                `Click to ${this.isPlaying ? 'pause' : 'play'}`
            ),
            new SpotifyTreeItem(
                '⏭️ Next',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.next',
                    title: 'Next Track'
                },
                new vscode.ThemeIcon('debug-step-over'),
                'next',
                'Play next track'
            ),
            new SpotifyTreeItem(
                `🔊 Volume: ${this.playbackState?.device?.volume_percent || 50}%`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.setVolume',
                    title: 'Set Volume'
                },
                new vscode.ThemeIcon('unmute'),
                'volume',
                'Click to set volume'
            ),
            new SpotifyTreeItem(
                `🔀 Shuffle: ${this.playbackState?.shuffle_state ? 'On' : 'Off'}`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.toggleShuffle',
                    title: 'Toggle Shuffle'
                },
                new vscode.ThemeIcon('symbol-misc'),
                'shuffle',
                `Shuffle is ${this.playbackState?.shuffle_state ? 'on' : 'off'} - click to toggle`
            ),
            new SpotifyTreeItem(
                `🔁 Repeat: ${this.playbackState?.repeat_state || 'off'}`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.toggleRepeat',
                    title: 'Toggle Repeat'
                },
                new vscode.ThemeIcon('sync'),
                'repeat',
                `Repeat is ${this.playbackState?.repeat_state || 'off'} - click to toggle`
            ),
            new SpotifyTreeItem(
                `📱 Device: ${this.playbackState?.device?.name || 'Unknown'}`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                new vscode.ThemeIcon('device-mobile'),
                'device',
                `Playing on: ${this.playbackState?.device?.name || 'Unknown device'}`
            )
        ]);
    }
}

export class QueueProvider implements vscode.TreeDataProvider<SpotifyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SpotifyTreeItem | undefined | null | void> = new vscode.EventEmitter<SpotifyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SpotifyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private queueData: any = null;
    private isAuthenticated: boolean = false;
    private showAllItems: boolean = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateQueue(queueData: any): void {
        this.queueData = queueData;
        this.refresh();
    }

    updateAuthStatus(isAuthenticated: boolean): void {
        this.isAuthenticated = isAuthenticated;
        this.refresh();
    }

    toggleShowAll(): void {
        this.showAllItems = !this.showAllItems;
        this.refresh();
    }

    getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SpotifyTreeItem): Thenable<SpotifyTreeItem[]> {
        if (!this.isAuthenticated) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🔌 Not connected',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.authenticate',
                        title: 'Connect to Spotify'
                    },
                    new vscode.ThemeIcon('plug'),
                    'authenticate',
                    'Connect your Spotify account'
                )
            ]);
        }

        if (!this.queueData || !this.queueData.queue || this.queueData.queue.length === 0) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '📋 Queue: Empty (0)',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('list-ordered'),
                    'queueHeader',
                    'No tracks in queue'
                ),
                new SpotifyTreeItem(
                    '➕ Add to queue',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.addToQueue',
                        title: 'Add to Queue'
                    },
                    new vscode.ThemeIcon('add'),
                    'addToQueue',
                    'Click to add a track to the queue'
                )
            ]);
        }

        const items = [
            new SpotifyTreeItem(
                `📋 Queue: (${this.queueData.queue.length} tracks)`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                new vscode.ThemeIcon('list-ordered'),
                'queueHeader',
                `${this.queueData.queue.length} tracks in queue`
            )
        ];

        // Determine how many items to show
        const maxItems = this.showAllItems ? this.queueData.queue.length : 10;
        const itemsToShow = this.queueData.queue.slice(0, maxItems);

        // Add queue items with track numbers
        itemsToShow.forEach((track: any, index: number) => {
            const artists = track.artists.map((artist: any) => artist.name).join(', ');
            
            items.push(
                new SpotifyTreeItem(
                    `${index + 1}. ${track.name}`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined, // Removed click command - queue items are now display-only
                    new vscode.ThemeIcon('music'),
                    'queueTrack',
                    `🎵 ${track.name}\n🎤 ${artists}\n🎼 ${track.album.name}\n📍 Position ${index + 1} in queue\n\n� Queue display only - no playback functionality`,
                    { uri: track.uri, index: index }
                )
            );
        });

        // Add "show more" or "show less" button if needed
        if (!this.showAllItems && this.queueData.queue.length > 10) {
            items.push(
                new SpotifyTreeItem(
                    `... and ${this.queueData.queue.length - 10} more`,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.showMoreQueue',
                        title: 'Show All Queue Items'
                    },
                    new vscode.ThemeIcon('chevron-down'),
                    'showMoreItems',
                    `Click to show all ${this.queueData.queue.length - 10} remaining tracks`
                )
            );
        } else if (this.showAllItems && this.queueData.queue.length > 10) {
            items.push(
                new SpotifyTreeItem(
                    '▲ Show less',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.showLessQueue',
                        title: 'Show Less Queue Items'
                    },
                    new vscode.ThemeIcon('chevron-up'),
                    'showLessItems',
                    'Click to show only first 10 tracks'
                )
            );
        }

        items.push(
            new SpotifyTreeItem(
                '➕ Add to queue',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.addToQueue',
                    title: 'Add to Queue'
                },
                new vscode.ThemeIcon('add'),
                'addToQueue',
                'Click to add a track to the queue'
            )
        );

        return Promise.resolve(items);
    }
}

export class PlaylistsProvider implements vscode.TreeDataProvider<SpotifyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SpotifyTreeItem | undefined | null | void> = new vscode.EventEmitter<SpotifyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SpotifyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private playlists: any[] = [];
    private isAuthenticated: boolean = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updatePlaylists(playlists: any[]): void {
        this.playlists = playlists;
        this.refresh();
    }

    updateAuthStatus(isAuthenticated: boolean): void {
        this.isAuthenticated = isAuthenticated;
        this.refresh();
    }

    getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SpotifyTreeItem): Thenable<SpotifyTreeItem[]> {
        if (!this.isAuthenticated) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🔌 Not connected',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.authenticate',
                        title: 'Connect to Spotify'
                    },
                    new vscode.ThemeIcon('plug'),
                    'authenticate',
                    'Connect your Spotify account'
                )
            ]);
        }

        if (!this.playlists || this.playlists.length === 0) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🎵 No playlists found',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.refresh',
                        title: 'Refresh'
                    },
                    new vscode.ThemeIcon('refresh'),
                    'noPlaylists',
                    'Click to refresh and load playlists'
                )
            ]);
        }

        const items = this.playlists.slice(0, 20).map((playlist: any) => {
            const playlistName = playlist.name.length > 25 ? 
                playlist.name.substring(0, 25) + '...' : playlist.name;
            
            return new SpotifyTreeItem(
                `🎵 ${playlistName}`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'spotify.playPlaylist',
                    title: 'Play Playlist',
                    arguments: [playlist.uri]
                },
                new vscode.ThemeIcon('play'),
                'playlist',
                `🎵 ${playlist.name}\n👤 by ${playlist.owner?.display_name || 'You'}\n🎼 ${playlist.tracks?.total || 0} tracks\n\n▶️ Click to start playing this playlist`,
                { uri: playlist.uri, name: playlist.name, trackCount: playlist.tracks?.total || 0 }
            );
        });

        if (this.playlists.length > 20) {
            items.push(
                new SpotifyTreeItem(
                    `... and ${this.playlists.length - 20} more playlists`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('ellipsis'),
                    'morePlaylists',
                    `${this.playlists.length - 20} more playlists available`
                )
            );
        }

        return Promise.resolve(items);
    }
}