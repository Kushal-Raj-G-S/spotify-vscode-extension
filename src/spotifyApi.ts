import axios from 'axios';
import { SpotifyAuthProvider } from './spotifyAuth';

export interface CurrentlyPlaying {
    is_playing: boolean;
    item: {
        id: string;
        name: string;
        uri: string;
        artists: Array<{ name: string }>;
        album: {
            name: string;
            images: Array<{ url: string; width: number; height: number }>;
        };
        duration_ms: number;
    };
    progress_ms: number;
    context?: {
        uri: string;
        type: string;
    };
    device: {
        id: string;
        name: string;
        type: string;
        is_active: boolean;
        volume_percent: number;
    };
}

export interface QueueItem {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string; width: number; height: number }>;
    };
    duration_ms: number;
    uri: string;
}

export interface Queue {
    currently_playing: QueueItem;
    queue: QueueItem[];
}

export interface PlaylistItem {
    id: string;
    name: string;
    description?: string;
    images: Array<{ url: string; width: number; height: number }>;
    tracks: {
        total: number;
    };
    uri: string;
    owner: {
        display_name: string;
    };
}

export interface PlaylistsResponse {
    items: PlaylistItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface PlaybackState {
    is_playing: boolean;
    shuffle_state: boolean;
    repeat_state: 'off' | 'context' | 'track';
    device: {
        id: string;
        name: string;
        type: string;
        is_active: boolean;
        volume_percent: number;
    };
}

export class SpotifyApiClient {
    private static readonly BASE_URL = 'https://api.spotify.com/v1';

    constructor(private authProvider: SpotifyAuthProvider) {}

    private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
        const token = await this.authProvider.getValidAccessToken();
        if (!token) {
            throw new Error('No access token available');
        }

        const config = {
            method,
            url: `${SpotifyApiClient.BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            ...(data && method !== 'GET' ? { data } : {})
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                // Token might be expired, try to refresh
                const newToken = await this.authProvider.getValidAccessToken();
                if (newToken) {
                    config.headers['Authorization'] = `Bearer ${newToken}`;
                    const response = await axios(config);
                    return response.data;
                }
            }
            throw error;
        }
    }

    public async getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
        try {
            const data = await this.makeRequest<CurrentlyPlaying>('/me/player/currently-playing');
            return data || null;
        } catch (error) {
            console.error('Error fetching currently playing:', error);
            return null;
        }
    }

    public async getPlaybackState(): Promise<PlaybackState | null> {
        try {
            const data = await this.makeRequest<PlaybackState>('/me/player');
            return data || null;
        } catch (error) {
            console.error('Error fetching playback state:', error);
            return null;
        }
    }

    public async getQueue(): Promise<Queue | null> {
        try {
            const data = await this.makeRequest<Queue>('/me/player/queue');
            return data || null;
        } catch (error) {
            console.error('Error fetching queue:', error);
            return null;
        }
    }

    public async play(deviceId?: string, trackUri?: string): Promise<void> {
        const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play';
        const body = trackUri ? { uris: [trackUri] } : undefined;
        
        try {
            await this.makeRequest(endpoint, 'PUT', body);
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async playPlaylist(playlistUri: string, deviceId?: string, offset?: number): Promise<void> {
        const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play';
        const body: any = {
            context_uri: playlistUri
        };
        
        if (offset !== undefined) {
            body.offset = { position: offset };
        }
        
        await this.makeRequest(endpoint, 'PUT', body);
    }



    public async getUserPlaylists(limit: number = 50): Promise<PlaylistsResponse> {
        return await this.makeRequest(`/me/playlists?limit=${limit}`);
    }

    public async pause(): Promise<void> {
        try {
            await this.makeRequest('/me/player/pause', 'PUT');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async skipToNext(): Promise<void> {
        try {
            await this.makeRequest('/me/player/next', 'POST');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async skipToPrevious(): Promise<void> {
        try {
            await this.makeRequest('/me/player/previous', 'POST');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async addToQueue(uri: string): Promise<void> {
        try {
            await this.makeRequest(`/me/player/queue?uri=${encodeURIComponent(uri)}`, 'POST');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async setShuffle(state: boolean): Promise<void> {
        try {
            await this.makeRequest(`/me/player/shuffle?state=${state}`, 'PUT');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async setRepeat(state: 'off' | 'context' | 'track'): Promise<void> {
        try {
            await this.makeRequest(`/me/player/repeat?state=${state}`, 'PUT');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start Spotify and begin playing music first.');
            }
            throw error;
        }
    }

    public async setVolume(volumePercent: number): Promise<void> {
        const volume = Math.max(0, Math.min(100, volumePercent));
        
        try {
            // First check if there's an active device
            const playbackState = await this.makeRequest<any>('/me/player');
            if (!playbackState || !playbackState.device) {
                throw new Error('No active Spotify device found. Please start playing music on Spotify first.');
            }
            
            await this.makeRequest(`/me/player/volume?volume_percent=${volume}`, 'PUT');
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('No active Spotify device found. Please start playing music on Spotify first.');
            }
            throw error;
        }
    }

    public async getDevices(): Promise<any> {
        return await this.makeRequest('/me/player/devices');
    }

    public async transferPlayback(deviceId: string, play: boolean = false): Promise<void> {
        await this.makeRequest('/me/player', 'PUT', {
            device_ids: [deviceId],
            play: play
        });
    }

    // Lyrics functionality
    public async getLyrics(trackName: string, artistName: string): Promise<string | null> {
        // Clean up track name (remove feat., remix, etc. from track name for better matching)
        const cleanTrack = trackName
            .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses content
            .replace(/\s*\[.*?\]\s*/g, '') // Remove brackets content
            .replace(/\s*-\s*(feat|ft|featuring|remix|remaster|remastered|version).*$/i, '') // Remove feat/remix
            .trim();

        const cleanArtist = artistName.split(',')[0].split('&')[0].trim(); // Take first artist only

        console.log(`🎤 Fetching lyrics for: "${cleanTrack}" by "${cleanArtist}"`);

        // Try multiple APIs in sequence
        const apis = [
            // API 1: lrclib.net (try first, more reliable)
            async () => {
                try {
                    const response = await axios.get(
                        `https://lrclib.net/api/get`,
                        {
                            params: {
                                artist_name: cleanArtist,
                                track_name: cleanTrack
                            },
                            timeout: 8000
                        }
                    );
                    if (response.data && (response.data.plainLyrics || response.data.syncedLyrics)) {
                        console.log('✅ Lyrics found via lrclib.net');
                        // Prefer synced lyrics for better timing, fallback to plain
                        return response.data.syncedLyrics || response.data.plainLyrics;
                    }
                } catch (err: any) {
                    console.log('❌ lrclib.net failed:', err.response?.status || err.message);
                }
                return null;
            },

            // API 2: lyrics.ovh
            async () => {
                try {
                    const response = await axios.get(
                        `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTrack)}`,
                        { timeout: 8000 }
                    );
                    if (response.data && response.data.lyrics) {
                        console.log('✅ Lyrics found via lyrics.ovh');
                        return response.data.lyrics;
                    }
                } catch (err: any) {
                    console.log('❌ lyrics.ovh failed:', err.response?.status || err.message);
                }
                return null;
            },
            
            // API 3: Genius API (search based - no API key needed for search)
            async () => {
                try {
                    // Search for the song on Genius
                    const searchResponse = await axios.get(
                        `https://api.genius.com/search`,
                        {
                            params: {
                                q: `${cleanTrack} ${cleanArtist}`
                            },
                            headers: {
                                'Authorization': 'Bearer _no_key_needed_for_basic_search_'
                            },
                            timeout: 8000,
                            validateStatus: () => true // Accept any status
                        }
                    );
                    
                    // Note: Genius API requires authentication for full access
                    // This is a placeholder - users would need their own API key
                    console.log('ℹ️ Genius API requires authentication key');
                } catch (err: any) {
                    console.log('❌ Genius API not configured');
                }
                return null;
            }
        ];

        // Try each API until one succeeds
        for (const api of apis) {
            const result = await api();
            if (result) {
                return result;
            }
        }

        console.warn(`⚠️ No lyrics found for "${cleanTrack}" by "${cleanArtist}"`);
        console.log('💡 Tip: Try different search terms or check if the song has official lyrics available');
        return null;
    }
}