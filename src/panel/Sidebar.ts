import * as vscode from 'vscode';
import * as path from 'path';
import { SpotifyAuthProvider } from '../spotifyAuth';
import { SpotifyApiClient, CurrentlyPlaying, Queue, PlaybackState } from '../spotifyApi';

export class SpotifySidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'spotifyPlayer';
    private _view?: vscode.WebviewView;
    private _updateInterval?: NodeJS.Timeout;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _authProvider: SpotifyAuthProvider,
        private readonly _apiClient: SpotifyApiClient
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'play':
                    await this.handlePlayPause(true);
                    break;
                case 'pause':
                    await this.handlePlayPause(false);
                    break;
                case 'next':
                    await this.handleNext();
                    break;
                case 'previous':
                    await this.handlePrevious();
                    break;
                case 'setVolume':
                    await this.handleSetVolume(data.volume);
                    break;
                case 'addToQueue':
                    await this.handleAddToQueue(data.uri);
                    break;
                case 'requestUpdate':
                    await this.sendCurrentState();
                    break;
                case 'authenticate':
                    try {
                        await this._authProvider.authenticate();
                        vscode.window.showInformationMessage('Successfully authenticated with Spotify!');
                        await this.sendCurrentState();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Authentication failed: ${error}`);
                    }
                    break;
                case 'logout':
                    await this._authProvider.logout();
                    await this.sendCurrentState();
                    vscode.window.showInformationMessage('Logged out from Spotify!');
                    break;
            }
        });

        // Send initial state
        this.sendCurrentState();
    }

    private async handlePlayPause(play: boolean): Promise<void> {
        try {
            if (play) {
                await this._apiClient.play();
            } else {
                await this._apiClient.pause();
            }
            // Wait a moment for Spotify to update, then refresh
            setTimeout(() => this.sendCurrentState(), 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to ${play ? 'play' : 'pause'}: ${error}`);
        }
    }

    private async handleNext(): Promise<void> {
        try {
            await this._apiClient.skipToNext();
            setTimeout(() => this.sendCurrentState(), 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to skip to next track: ${error}`);
        }
    }

    private async handlePrevious(): Promise<void> {
        try {
            await this._apiClient.skipToPrevious();
            setTimeout(() => this.sendCurrentState(), 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to go to previous track: ${error}`);
        }
    }

    private async handleSetVolume(volume: number): Promise<void> {
        try {
            await this._apiClient.setVolume(volume);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to set volume: ${error}`);
        }
    }

    private async handleAddToQueue(uri: string): Promise<void> {
        try {
            await this._apiClient.addToQueue(uri);
            vscode.window.showInformationMessage('Track added to queue!');
            setTimeout(() => this.sendCurrentState(), 500);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add to queue: ${error}`);
        }
    }

    private async sendCurrentState(): Promise<void> {
        if (!this._view) {
            return;
        }

        const isAuthenticated = this._authProvider.isAuthenticated();
        
        if (!isAuthenticated) {
            this._view.webview.postMessage({
                type: 'stateUpdate',
                data: {
                    isAuthenticated: false,
                    currentlyPlaying: null,
                    queue: null,
                    playbackState: null
                }
            });
            return;
        }

        try {
            const [currentlyPlaying, queue, playbackState] = await Promise.all([
                this._apiClient.getCurrentlyPlaying(),
                this._apiClient.getQueue(),
                this._apiClient.getPlaybackState()
            ]);

            this._view.webview.postMessage({
                type: 'stateUpdate',
                data: {
                    isAuthenticated: true,
                    currentlyPlaying,
                    queue,
                    playbackState
                }
            });
        } catch (error) {
            console.error('Failed to get Spotify state:', error);
            this._view.webview.postMessage({
                type: 'error',
                message: `Failed to fetch Spotify data: ${error}`
            });
        }
    }

    public refresh(): void {
        if (this._view) {
            this.sendCurrentState();
        }
    }

    public startPeriodicUpdates(): void {
        // Update every 5 seconds
        this._updateInterval = setInterval(() => {
            this.sendCurrentState();
        }, 5000);
    }

    public stopPeriodicUpdates(): void {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = undefined;
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js'));
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'vscode.css'));

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <title>Spotify Player</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}