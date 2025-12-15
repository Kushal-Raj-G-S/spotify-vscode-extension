import React, { useState } from 'react';

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

interface QueueProps {
    queue: QueueData | null;
    onAddToQueue: (uri: string) => void;
}

export const Queue: React.FC<QueueProps> = ({ queue, onAddToQueue }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const formatDuration = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const QueueIcon = () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
    );

    const ChevronDownIcon = () => (
        <svg className="w-4 h-4 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );

    const AddIcon = () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div className="bg-spotify-black rounded-lg p-4">
            {/* Queue Header */}
            <div 
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <QueueIcon />
                    <h3 className="font-semibold text-white">Queue</h3>
                    {queue?.queue && (
                        <span className="text-spotify-light-gray text-sm">
                            ({queue.queue.length} tracks)
                        </span>
                    )}
                </div>
                <ChevronDownIcon />
            </div>

            {/* Expanded Queue Content */}
            {isExpanded && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for tracks to add to queue..."
                            className="w-full bg-spotify-gray text-white placeholder-spotify-light-gray px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        />
                        <button
                            onClick={() => {
                                if (searchQuery.trim()) {
                                    // For demo purposes, we'll just show a message
                                    // In a real app, you'd implement search functionality
                                    alert(`Searching for: ${searchQuery}`);
                                }
                            }}
                            className="absolute right-2 top-2 text-spotify-light-gray hover:text-white"
                        >
                            <AddIcon />
                        </button>
                    </div>

                    {/* Queue List */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {!queue || !queue.queue || queue.queue.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-spotify-light-gray mb-2">
                                    <QueueIcon />
                                </div>
                                <p className="text-spotify-light-gray">No tracks in queue</p>
                                <p className="text-spotify-gray text-sm mt-1">
                                    Search and add tracks above
                                </p>
                            </div>
                        ) : (
                            queue.queue.map((track, index) => {
                                const albumImage = track.album.images.find(img => img.width >= 64) || track.album.images[0];
                                
                                return (
                                    <div
                                        key={`${track.id}-${index}`}
                                        className="flex items-center space-x-3 p-2 rounded hover:bg-spotify-gray transition-colors group"
                                    >
                                        {/* Track Number */}
                                        <span className="text-spotify-light-gray text-sm w-6 text-center">
                                            {index + 1}
                                        </span>

                                        {/* Album Art */}
                                        <div className="flex-shrink-0">
                                            {albumImage ? (
                                                <img
                                                    src={albumImage.url}
                                                    alt={track.album.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-spotify-gray rounded flex items-center justify-center">
                                                    <span className="text-xs">🎵</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Track Info */}
                                        <div className="flex-grow min-w-0">
                                            <p className="text-white text-sm font-medium truncate" title={track.name}>
                                                {track.name}
                                            </p>
                                            <p className="text-spotify-light-gray text-xs truncate" title={track.artists.map(a => a.name).join(', ')}>
                                                {track.artists.map(artist => artist.name).join(', ')}
                                            </p>
                                        </div>

                                        {/* Duration */}
                                        <span className="text-spotify-light-gray text-xs">
                                            {formatDuration(track.duration_ms)}
                                        </span>

                                        {/* Remove from Queue Button (would be implemented) */}
                                        <button
                                            className="opacity-0 group-hover:opacity-100 text-spotify-light-gray hover:text-white transition-opacity"
                                            title="Remove from queue"
                                            onClick={() => {
                                                // This would implement queue removal
                                                alert('Queue removal not implemented in demo');
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Quick Add Section */}
                    <div className="border-t border-spotify-gray pt-4">
                        <div className="text-xs text-spotify-light-gray mb-2">Quick add by Spotify URI:</div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="spotify:track:..."
                                className="flex-grow bg-spotify-gray text-white placeholder-spotify-light-gray px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.target as HTMLInputElement;
                                        if (input.value.trim()) {
                                            onAddToQueue(input.value.trim());
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                    if (input.value.trim()) {
                                        onAddToQueue(input.value.trim());
                                        input.value = '';
                                    }
                                }}
                                className="bg-spotify-green hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};