import * as vscode from 'vscode';
import axios from 'axios';
import * as crypto from 'crypto';

interface SpotifyTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    scope: string;
}

interface SpotifyCredentials {
    clientId: string;
    clientSecret: string;
}

export class SpotifyAuthProvider {
    private static readonly SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
    private static readonly SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
    private static readonly REDIRECT_URI = 'http://127.0.0.1:8000/callback';
    private static readonly SCOPES = [
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-recently-played',
        'playlist-read-private',
        'playlist-read-collaborative'
    ].join(' ');

    private tokens: SpotifyTokens | null = null;
    private credentials: SpotifyCredentials | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.loadStoredData();
    }

    private loadStoredData(): void {
        this.tokens = this.context.globalState.get('spotifyTokens') || null;
        this.credentials = this.context.globalState.get('spotifyCredentials') || null;
    }

    private async saveTokens(): Promise<void> {
        await this.context.globalState.update('spotifyTokens', this.tokens);
    }

    private async saveCredentials(): Promise<void> {
        await this.context.globalState.update('spotifyCredentials', this.credentials);
    }

    public async authenticate(): Promise<void> {
        // First, get client credentials if not available
        if (!this.credentials) {
            await this.getClientCredentials();
        }

        if (!this.credentials) {
            throw new Error('Client credentials are required');
        }

        // Generate PKCE parameters
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const state = this.generateRandomString(16);

        // Build authorization URL
        const authUrl = new URL(SpotifyAuthProvider.SPOTIFY_AUTH_URL);
        authUrl.searchParams.append('client_id', this.credentials.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', SpotifyAuthProvider.REDIRECT_URI);
        authUrl.searchParams.append('scope', SpotifyAuthProvider.SCOPES);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('state', state);

        // Show instructions to user
        const proceed = await vscode.window.showInformationMessage(
            'Click OK to open Spotify authorization page. After authorizing, you\'ll be redirected to a page that won\'t load. Copy the entire URL from your browser\'s address bar.',
            { modal: true },
            'OK'
        );

        if (proceed !== 'OK') {
            throw new Error('Authentication cancelled');
        }

        // Open authorization URL
        vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

        // Get the full redirect URL from user
        const redirectUrl = await vscode.window.showInputBox({
            prompt: 'Paste the complete redirect URL from your browser address bar',
            placeHolder: 'http://127.0.0.1:8000/callback?code=AQD79unik...',
            ignoreFocusOut: true,
        });

        if (!redirectUrl) {
            throw new Error('Redirect URL is required');
        }

        // Extract authorization code from URL
        const url = new URL(redirectUrl);
        const authCode = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');

        if (!authCode) {
            const error = url.searchParams.get('error');
            throw new Error(`Authorization failed: ${error || 'No authorization code received'}`);
        }

        if (returnedState !== state) {
            throw new Error('State parameter mismatch. This might be a security issue.');
        }

        // Exchange authorization code for tokens
        await this.exchangeCodeForTokens(authCode, codeVerifier);
    }

    private async getClientCredentials(): Promise<void> {
        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter your Spotify Client ID',
            placeHolder: 'Your Spotify app Client ID',
        });

        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter your Spotify Client Secret',
            placeHolder: 'Your Spotify app Client Secret',
            password: true,
        });

        if (!clientId || !clientSecret) {
            throw new Error('Client ID and Secret are required');
        }

        this.credentials = { clientId, clientSecret };
        await this.saveCredentials();
    }

    private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<void> {
        if (!this.credentials) {
            throw new Error('Client credentials not available');
        }

        try {
            const response = await axios.post(SpotifyAuthProvider.SPOTIFY_TOKEN_URL, 
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: SpotifyAuthProvider.REDIRECT_URI,
                    client_id: this.credentials.clientId,
                    code_verifier: codeVerifier,
                }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            this.tokens = {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_at: Date.now() + (response.data.expires_in * 1000),
                token_type: response.data.token_type,
                scope: response.data.scope,
            };

            await this.saveTokens();
        } catch (error) {
            console.error('Token exchange error:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    public async getValidAccessToken(): Promise<string | null> {
        if (!this.tokens) {
            return null;
        }

        // Check if token needs refresh
        if (Date.now() >= this.tokens.expires_at - 60000) { // Refresh 1 minute before expiry
            await this.refreshTokens();
        }

        return this.tokens?.access_token || null;
    }

    private async refreshTokens(): Promise<void> {
        if (!this.tokens?.refresh_token || !this.credentials) {
            throw new Error('Refresh token or credentials not available');
        }

        try {
            console.log('Refreshing Spotify access token...');
            const response = await axios.post(SpotifyAuthProvider.SPOTIFY_TOKEN_URL,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.tokens.refresh_token,
                    client_id: this.credentials.clientId,
                }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 10000 // 10 second timeout
            });

            this.tokens = {
                ...this.tokens,
                access_token: response.data.access_token,
                expires_at: Date.now() + (response.data.expires_in * 1000),
                refresh_token: response.data.refresh_token || this.tokens.refresh_token,
            };

            await this.saveTokens();
            console.log('Token refresh successful');
        } catch (error: any) {
            console.error('Token refresh error:', error.response?.data || error.message);
            
            // Only clear tokens if it's a permanent error (400 - invalid refresh token)
            // Don't clear on network errors (let retry handle it)
            if (error.response?.status === 400 || error.response?.status === 401) {
                console.log('Refresh token is invalid, clearing stored tokens');
                this.tokens = null;
                await this.saveTokens();
                throw new Error('Refresh token expired. Please re-authenticate.');
            }
            
            // For network errors, keep tokens and let retry logic handle it
            throw new Error('Network error during token refresh. Will retry.');
        }
    }

    public async tryAutoAuthenticate(): Promise<boolean> {
        // Try to automatically authenticate using stored credentials and tokens
        if (!this.tokens || !this.credentials) {
            console.log('No stored tokens or credentials found');
            return false;
        }

        // Try multiple times in case of network issues
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Auto-authentication attempt ${attempt}/${maxRetries}...`);
                const validToken = await this.getValidAccessToken();
                
                if (validToken !== null) {
                    console.log('Auto-authentication successful!');
                    return true;
                }
            } catch (error: any) {
                console.log(`Auto authentication attempt ${attempt} failed:`, error.message);
                
                // If refresh token is invalid (not network error), stop retrying
                if (error.message.includes('expired') || error.message.includes('invalid')) {
                    console.log('Refresh token is invalid, manual re-authentication required');
                    return false;
                }
                
                // For network errors, retry with delay
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
                }
            }
        }
        
        console.log('Auto authentication failed after all retries');
        return false;
    }

    public async logout(): Promise<void> {
        this.tokens = null;
        this.credentials = null;
        await this.context.globalState.update('spotifyTokens', null);
        await this.context.globalState.update('spotifyCredentials', null);
    }

    public isAuthenticated(): boolean {
        return this.tokens !== null && this.credentials !== null;
    }

    public hasStoredCredentials(): boolean {
        return this.credentials !== null;
    }

    public hasStoredTokens(): boolean {
        return this.tokens !== null;
    }

    private generateCodeVerifier(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    private async generateCodeChallenge(codeVerifier: string): Promise<string> {
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        return hash.toString('base64url');
    }

    private generateRandomString(length: number): string {
        return crypto.randomBytes(length).toString('hex');
    }
}