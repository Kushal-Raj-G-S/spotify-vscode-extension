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

export class LyricsProvider implements vscode.TreeDataProvider<SpotifyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SpotifyTreeItem | undefined | null | void> = new vscode.EventEmitter<SpotifyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SpotifyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private lyrics: string | null = null;
    private currentTrack: any = null;
    private currentProgress: number = 0;
    private isAuthenticated: boolean = false;
    private isLoading: boolean = false;
    private syncedLyrics: Array<{time: number, text: string}> = [];

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateLyrics(lyrics: string | null, track: any): void {
        this.lyrics = lyrics;
        this.currentTrack = track;
        this.isLoading = false;
        
        // Parse LRC format if present (format: [mm:ss.xx]lyric text)
        this.syncedLyrics = [];
        if (lyrics && lyrics.includes('[')) {
            const lrcRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/g;
            let match;
            const lines: string[] = lyrics.split('\n');
            
            for (const line of lines) {
                const match = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/.exec(line);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
                    const timeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
                    const text = match[4].trim();
                    if (text) {
                        this.syncedLyrics.push({ time: timeMs, text });
                    }
                }
            }
            console.log(`📝 Parsed ${this.syncedLyrics.length} synced lyric lines`);
        }
        
        this.refresh();
    }

    updateProgress(progressMs: number): void {
        this.currentProgress = progressMs;
        // Only refresh if lyrics are loaded (avoids unnecessary refreshes)
        if (this.lyrics && this.syncedLyrics.length > 0) {
            this.refresh();
        }
    }

    setLoading(loading: boolean): void {
        this.isLoading = loading;
        this.refresh();
    }

    clearLyrics(): void {
        this.lyrics = null;
        this.currentTrack = null;
        this.currentProgress = 0;
        this.isLoading = false;
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
                    'Connect your Spotify account to see lyrics'
                )
            ]);
        }

        if (this.isLoading) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '⏳ Loading lyrics...',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('loading~spin'),
                    'loading',
                    'Fetching lyrics from server'
                )
            ]);
        }

        if (!this.currentTrack) {
            return Promise.resolve([
                new SpotifyTreeItem(
                    '🎵 No track playing',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('music'),
                    'noTrack',
                    'Start playing music to see lyrics'
                ),
                new SpotifyTreeItem(
                    '💡 Lyrics appear automatically',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('lightbulb'),
                    'tip',
                    'Lyrics will sync with the currently playing track'
                )
            ]);
        }

        if (!this.lyrics) {
            const trackName = this.currentTrack.item?.name || 'Unknown';
            const artistName = this.currentTrack.item?.artists?.[0]?.name || 'Unknown';
            
            return Promise.resolve([
                new SpotifyTreeItem(
                    '❌ Lyrics not available',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('error'),
                    'noLyrics',
                    `No lyrics found for "${trackName}" by ${artistName}`
                ),
                new SpotifyTreeItem(
                    `🎵 "${trackName}"`,
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('note'),
                    'trackInfo',
                    `Search online: ${trackName} ${artistName} lyrics`
                ),
                new SpotifyTreeItem(
                    '━'.repeat(30),
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    undefined,
                    'separator'
                ),
                new SpotifyTreeItem(
                    '💡 Why lyrics aren\'t showing:',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('lightbulb'),
                    'info',
                    'Common reasons for missing lyrics'
                ),
                new SpotifyTreeItem(
                    '   • Song may not be in free lyrics databases',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('circle-outline'),
                    'reason'
                ),
                new SpotifyTreeItem(
                    '   • Regional/non-English songs have limited coverage',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('circle-outline'),
                    'reason'
                ),
                new SpotifyTreeItem(
                    '   • New releases may not be indexed yet',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('circle-outline'),
                    'reason'
                ),
                new SpotifyTreeItem(
                    '━'.repeat(30),
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    undefined,
                    'separator'
                ),
                new SpotifyTreeItem(
                    '🔄 Click to retry',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.fetchLyrics',
                        title: 'Fetch Lyrics'
                    },
                    new vscode.ThemeIcon('refresh'),
                    'retry',
                    'Try fetching lyrics again'
                ),
                new SpotifyTreeItem(
                    '🌐 Search lyrics online',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'spotify.searchLyricsOnline',
                        title: 'Search Lyrics Online',
                        arguments: [trackName, artistName]
                    },
                    new vscode.ThemeIcon('globe'),
                    'searchOnline',
                    `Open Google search for "${trackName} ${artistName} lyrics"`
                )
            ]);
        }

        // Parse and display lyrics with sync highlighting
        const items: SpotifyTreeItem[] = [];
        
        // Add track info header
        const trackName = this.currentTrack.item?.name || 'Unknown';
        const artistName = this.currentTrack.item?.artists?.[0]?.name || 'Unknown';
        
        items.push(
            new SpotifyTreeItem(
                `🎤 "${trackName}"`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                new vscode.ThemeIcon('note'),
                'trackName',
                `Lyrics for ${trackName} by ${artistName}`
            )
        );

        items.push(
            new SpotifyTreeItem(
                `👤 ${artistName}`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                new vscode.ThemeIcon('person'),
                'artistName',
                `Artist: ${artistName}`
            )
        );

        items.push(
            new SpotifyTreeItem(
                '━'.repeat(30),
                vscode.TreeItemCollapsibleState.None,
                undefined,
                undefined,
                'separator'
            )
        );

        // Use synced lyrics if available, otherwise fall back to simple division
        if (this.syncedLyrics.length > 0) {
            // Display synced lyrics with accurate timestamps
            this.syncedLyrics.forEach((lyricLine, index) => {
                const nextLine = this.syncedLyrics[index + 1];
                const isCurrentLine = this.currentProgress >= lyricLine.time && 
                                     (!nextLine || this.currentProgress < nextLine.time);
                
                const displayLine = isCurrentLine ? `▶️ ${lyricLine.text}` : `   ${lyricLine.text}`;
                const icon = isCurrentLine ? new vscode.ThemeIcon('play-circle') : new vscode.ThemeIcon('circle-outline');
                
                items.push(
                    new SpotifyTreeItem(
                        displayLine,
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        icon,
                        'lyricLine',
                        isCurrentLine ? `🎵 Currently singing: ${lyricLine.text}` : lyricLine.text
                    )
                );
            });
        } else {
            // Fallback: Split lyrics into lines and estimate timing
            const lyricsLines = this.lyrics.split('\n').filter(line => {
                // Filter out LRC timestamps and empty lines
                const cleaned = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
                return cleaned !== '';
            });
            const totalDuration = this.currentTrack.item?.duration_ms || 1;
            const timePerLine = totalDuration / lyricsLines.length;

            lyricsLines.forEach((line, index) => {
                // Remove any remaining timestamps from display
                const cleanLine = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
                const lineStartTime = index * timePerLine;
                const isCurrentLine = this.currentProgress >= lineStartTime && 
                                     this.currentProgress < (lineStartTime + timePerLine);
                
                const displayLine = isCurrentLine ? `▶️ ${cleanLine}` : `   ${cleanLine}`;
                const icon = isCurrentLine ? new vscode.ThemeIcon('play-circle') : new vscode.ThemeIcon('circle-outline');
                
                items.push(
                    new SpotifyTreeItem(
                        displayLine,
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        icon,
                        'lyricLine',
                        isCurrentLine ? `🎵 Currently singing: ${cleanLine}` : cleanLine
                    )
                );
            });
        }

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