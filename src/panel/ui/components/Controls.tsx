import React, { useState } from 'react';

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

interface ControlsProps {
    isPlaying: boolean;
    playbackState: PlaybackState | null;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onVolumeChange: (volume: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
    isPlaying,
    playbackState,
    onPlay,
    onPause,
    onNext,
    onPrevious,
    onVolumeChange
}) => {
    const [volume, setVolume] = useState(playbackState?.device?.volume_percent || 50);

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(event.target.value);
        setVolume(newVolume);
        onVolumeChange(newVolume);
    };

    const PlayIcon = () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
    );

    const PauseIcon = () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );

    const SkipBackIcon = () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
        </svg>
    );

    const SkipForwardIcon = () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
        </svg>
    );

    const ShuffleIcon = () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
    );

    const RepeatIcon = () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
    );

    const VolumeIcon = () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.8 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.8l3.583-2.816a1 1 0 011.6-.108zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div className="bg-spotify-black rounded-lg p-4 mb-4">
            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-6 mb-4">
                <button
                    onClick={onPrevious}
                    className="control-button text-spotify-light-gray hover:text-white p-2 rounded-full hover:bg-spotify-gray transition-colors"
                    title="Previous track"
                >
                    <SkipBackIcon />
                </button>

                <button
                    onClick={isPlaying ? onPause : onPlay}
                    className="control-button bg-spotify-green hover:bg-green-600 text-white p-3 rounded-full transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <button
                    onClick={onNext}
                    className="control-button text-spotify-light-gray hover:text-white p-2 rounded-full hover:bg-spotify-gray transition-colors"
                    title="Next track"
                >
                    <SkipForwardIcon />
                </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between text-sm">
                {/* Left side - Shuffle and Repeat */}
                <div className="flex items-center space-x-3">
                    <button
                        className={`control-button p-2 rounded transition-colors ${
                            playbackState?.shuffle_state
                                ? 'text-spotify-green'
                                : 'text-spotify-light-gray hover:text-white'
                        }`}
                        title="Toggle shuffle"
                    >
                        <ShuffleIcon />
                    </button>
                    <button
                        className={`control-button p-2 rounded transition-colors ${
                            playbackState?.repeat_state !== 'off'
                                ? 'text-spotify-green'
                                : 'text-spotify-light-gray hover:text-white'
                        }`}
                        title={`Repeat: ${playbackState?.repeat_state || 'off'}`}
                    >
                        <RepeatIcon />
                        {playbackState?.repeat_state === 'track' && (
                            <span className="absolute -top-1 -right-1 text-xs">1</span>
                        )}
                    </button>
                </div>

                {/* Right side - Volume */}
                <div className="flex items-center space-x-2">
                    <VolumeIcon />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-spotify-green"
                        title={`Volume: ${volume}%`}
                    />
                    <span className="text-xs text-spotify-light-gray w-8 text-right">{volume}%</span>
                </div>
            </div>
        </div>
    );
};