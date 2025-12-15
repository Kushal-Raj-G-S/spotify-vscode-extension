import React from 'react';

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

interface NowPlayingProps {
    currentlyPlaying: CurrentlyPlaying | null;
    playbackState: PlaybackState | null;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({ currentlyPlaying, playbackState }) => {
    if (!currentlyPlaying || !currentlyPlaying.item) {
        return (
            <div className="bg-spotify-black rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center h-32 text-spotify-light-gray">
                    <div className="text-center">
                        <div className="text-lg mb-2">🎵</div>
                        <p>Nothing playing</p>
                    </div>
                </div>
            </div>
        );
    }

    const { item, progress_ms } = currentlyPlaying;
    const albumImage = item.album.images.find(img => img.width >= 200) || item.album.images[0];
    const progressPercent = (progress_ms / item.duration_ms) * 100;

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-spotify-black rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-4">
                {/* Album Art */}
                <div className="flex-shrink-0">
                    {albumImage ? (
                        <img
                            src={albumImage.url}
                            alt={item.album.name}
                            className="w-20 h-20 rounded-lg shadow-lg album-art"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-spotify-gray rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🎵</span>
                        </div>
                    )}
                </div>

                {/* Track Info */}
                <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-white text-lg truncate mb-1" title={item.name}>
                        {item.name}
                    </h3>
                    <p className="text-spotify-light-gray text-sm truncate mb-2" title={item.artists.map(a => a.name).join(', ')}>
                        {item.artists.map(artist => artist.name).join(', ')}
                    </p>
                    <p className="text-spotify-gray text-xs truncate mb-3" title={item.album.name}>
                        {item.album.name}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="w-full bg-spotify-gray rounded-full h-1">
                            <div
                                className="bg-spotify-green h-1 rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-spotify-light-gray">
                            <span>{formatTime(progress_ms)}</span>
                            <span>{formatTime(item.duration_ms)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Info */}
            {playbackState?.device && (
                <div className="mt-3 pt-3 border-t border-spotify-gray">
                    <div className="flex items-center justify-between text-xs text-spotify-light-gray">
                        <div className="flex items-center space-x-2">
                            <span>Playing on:</span>
                            <span className="font-medium text-white">{playbackState.device.name}</span>
                            <span className="text-spotify-gray">({playbackState.device.type})</span>
                        </div>
                        {playbackState.device.volume_percent !== null && (
                            <span>Volume: {playbackState.device.volume_percent}%</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};