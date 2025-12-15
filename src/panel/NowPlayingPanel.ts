import * as vscode from 'vscode';

export class NowPlayingPanel {
    public static currentPanel: NowPlayingPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private currentTrack: any = null;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.One;

        // If we already have a panel, show it
        if (NowPlayingPanel.currentPanel) {
            NowPlayingPanel.currentPanel._panel.reveal(column);
            return NowPlayingPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'nowPlaying',
            'Now Playing',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist'),
                    vscode.Uri.joinPath(extensionUri, 'src', 'panel', 'ui')
                ]
            }
        );

        NowPlayingPanel.currentPanel = new NowPlayingPanel(panel, extensionUri);
        return NowPlayingPanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'play':
                        vscode.commands.executeCommand('spotify.play');
                        return;
                    case 'pause':
                        vscode.commands.executeCommand('spotify.pause');
                        return;
                    case 'next':
                        vscode.commands.executeCommand('spotify.next');
                        return;
                    case 'previous':
                        vscode.commands.executeCommand('spotify.previous');
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public updateTrack(track: any) {
        this.currentTrack = track;
        this._update();
    }

    public dispose() {
        NowPlayingPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        if (!this.currentTrack || !this.currentTrack.item) {
            return this._getEmptyStateHtml();
        }

        const track = this.currentTrack.item;
        const artists = track.artists.map((artist: any) => artist.name).join(', ');
        const progress = this._formatTime(this.currentTrack.progress_ms);
        const duration = this._formatTime(track.duration_ms);
        const progressPercent = (this.currentTrack.progress_ms / track.duration_ms) * 100;

        // Get the largest album image
        const albumImage = track.album.images && track.album.images.length > 0 
            ? track.album.images[0].url 
            : '';

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Now Playing</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-height: calc(100vh - 40px);
                }

                .now-playing-container {
                    max-width: 350px;
                    width: 100%;
                    text-align: center;
                }

                .album-cover {
                    width: 250px;
                    height: 250px;
                    border-radius: 8px;
                    object-fit: cover;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    margin-bottom: 20px;
                    background-color: var(--vscode-input-background);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                }

                .track-info {
                    margin-bottom: 20px;
                }

                .track-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    margin-bottom: 8px;
                    line-height: 1.3;
                }

                .artist-name {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 12px;
                }

                .progress-container {
                    margin-bottom: 20px;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background-color: var(--vscode-input-background);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-fill {
                    height: 100%;
                    background-color: var(--vscode-button-background);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .progress-time {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                }

                .control-btn {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                }

                .control-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                .control-btn.play-pause {
                    font-size: 24px;
                    padding: 12px;
                }

                .control-btn.skip {
                    font-size: 18px;
                }

                .status {
                    margin-top: 16px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="now-playing-container">
                ${albumImage ? 
                    `<img src="${albumImage}" alt="${track.album.name}" class="album-cover" />` :
                    `<div class="album-cover">🎵</div>`
                }
                
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="artist-name">${artists}</div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-time">
                        <span>${progress}</span>
                        <span>${duration}</span>
                    </div>
                </div>

                <div class="controls">
                    <button class="control-btn skip" onclick="sendCommand('previous')">⏮️</button>
                    <button class="control-btn play-pause" onclick="sendCommand('${this.currentTrack.is_playing ? 'pause' : 'play'}')">
                        ${this.currentTrack.is_playing ? '⏸️' : '▶️'}
                    </button>
                    <button class="control-btn skip" onclick="sendCommand('next')">⏭️</button>
                </div>

                <div class="status">
                    ${this.currentTrack.is_playing ? '▶️ Playing' : '⏸️ Paused'}
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function sendCommand(command) {
                    vscode.postMessage({ command: command });
                }
            </script>
        </body>
        </html>`;
    }

    private _getEmptyStateHtml() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Now Playing</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: calc(100vh - 40px);
                    text-align: center;
                }

                .empty-state {
                    max-width: 300px;
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .empty-title {
                    font-size: 18px;
                    margin-bottom: 8px;
                    color: var(--vscode-foreground);
                }

                .empty-description {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="empty-state">
                <div class="empty-icon">🎵</div>
                <div class="empty-title">Nothing Playing</div>
                <div class="empty-description">Start playing music on any Spotify device to see it here</div>
            </div>
        </body>
        </html>`;
    }

    private _formatTime(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}