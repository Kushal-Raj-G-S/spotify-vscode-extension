import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { NowPlaying } from './components/NowPlaying';
import { Controls } from './components/Controls';
import { Queue } from './components/Queue';

declare global {
    interface Window {
        acquireVsCodeApi(): {
            postMessage: (message: any) => void;
            setState: (state: any) => void;
            getState: () => any;
        };
    }
}

interface CurrentlyPlaying {
    is_playing: boolean;
    item: {
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: {
            name: string;
            images: Array<{ url: string; width: number; height: number }>;
        };
        duration_ms: number;
    };
    progress_ms: number;
    device: {
        id: string;
        name: string;
        type: string;
        is_active: boolean;
        volume_percent: number;
    };
}

interface QueueItem {
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

interface QueueData {
    currently_playing: QueueItem;
    queue: QueueItem[];
}

interface PlaybackState {
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

interface AppState {
    isAuthenticated: boolean;
    currentlyPlaying: CurrentlyPlaying | null;
    queue: QueueData | null;
    playbackState: PlaybackState | null;
}

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        isAuthenticated: false,
        currentlyPlaying: null,
        queue: null,
        playbackState: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const vscode = window.acquireVsCodeApi();

    useEffect(() => {
        // Request initial state
        vscode.postMessage({ type: 'requestUpdate' });

        // Listen for messages from extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.type) {
                case 'stateUpdate':
                    setState(message.data);
                    setLoading(false);
                    setError(null);
                    break;
                case 'error':
                    setError(message.message);
                    setLoading(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleAuthenticate = () => {
        vscode.postMessage({ type: 'authenticate' });
    };

    const handleLogout = () => {
        vscode.postMessage({ type: 'logout' });
    };

    const handlePlay = () => {
        vscode.postMessage({ type: 'play' });
    };

    const handlePause = () => {
        vscode.postMessage({ type: 'pause' });
    };

    const handleNext = () => {
        vscode.postMessage({ type: 'next' });
    };

    const handlePrevious = () => {
        vscode.postMessage({ type: 'previous' });
    };

    const handleVolumeChange = (volume: number) => {
        vscode.postMessage({ type: 'setVolume', volume });
    };

    const handleAddToQueue = (uri: string) => {
        vscode.postMessage({ type: 'addToQueue', uri });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button
                    onClick={() => vscode.postMessage({ type: 'requestUpdate' })}
                    className="bg-spotify-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!state.isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-64 p-4">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-2 text-spotify-green">Spotify Player</h2>
                    <p className="text-spotify-light-gray">
                        Connect your Spotify account to control playback from VS Code
                    </p>
                </div>
                <button
                    onClick={handleAuthenticate}
                    className="bg-spotify-green hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
                >
                    Connect to Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="spotify-player bg-spotify-dark-gray text-white min-h-screen">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-spotify-green">Spotify Player</h2>
                    <button
                        onClick={handleLogout}
                        className="text-spotify-light-gray hover:text-white text-sm"
                    >
                        Logout
                    </button>
                </div>

                {/* Currently Playing */}
                <NowPlaying 
                    currentlyPlaying={state.currentlyPlaying}
                    playbackState={state.playbackState}
                />

                {/* Controls */}
                <Controls
                    isPlaying={state.currentlyPlaying?.is_playing || false}
                    playbackState={state.playbackState}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onVolumeChange={handleVolumeChange}
                />

                {/* Queue */}
                <Queue 
                    queue={state.queue}
                    onAddToQueue={handleAddToQueue}
                />
            </div>
        </div>
    );
};

// Initialize the app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}