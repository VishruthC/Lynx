import React, { useState, useEffect } from 'react';
import { Search, X, History, Trash2, ArrowLeft } from 'lucide-react';
import { searchMusic, getSearchSuggestions } from '../services/piped';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import TrackContextMenu from './TrackContextMenu';

interface SearchViewProps {
    onSearch: (q: string) => void;
    onTrackClick?: (track: Track, results: Track[]) => void;
    onClose?: () => void;
}

export default function SearchView({ onSearch, onTrackClick, onClose }: SearchViewProps) {
    const [query, setQuery] = useState('');
    const [liveResults, setLiveResults] = useState<Track[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { playTrack } = usePlayer();

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setLiveResults([]);
                setSuggestions([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                const [results, suggs] = await Promise.all([
                    searchMusic(query),
                    getSearchSuggestions(query)
                ]);
                setLiveResults(results.slice(0, 10));
                setSuggestions(suggs.filter(s => s.toLowerCase() !== query.toLowerCase()).slice(0, 5));
            } catch (error) {
                console.error('Mobile search failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleTrackClick = (track: Track) => {
        if (onTrackClick) {
            onTrackClick(track, liveResults);
        } else {
            playTrack(track, liveResults);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black md:pt-8">
            {/* Header */}
            <div className="flex items-center px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5 gap-3">
                {onClose && (
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                )}
                <form onSubmit={handleSubmit} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search songs, artists, playlists"
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    )}
                </form>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-safe">
                {!query.trim() ? (
                    <div className="p-6 text-center text-zinc-500 mt-20">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium text-zinc-400">Search for anything</p>
                        <p className="text-sm mt-1">Find your favorite music and artists</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="py-2 border-b border-white/5">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuery(s); onSearch(s); }}
                                        className="w-full flex items-center px-4 py-3 hover:bg-zinc-900 transition-colors text-zinc-300 text-left"
                                    >
                                        <History size={18} className="mr-3 text-zinc-500" />
                                        <span>{s}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Live Results */}
                        {isSearching ? (
                            <div className="p-8 text-center text-zinc-500">Searching...</div>
                        ) : liveResults.length > 0 ? (
                            <div className="py-2">
                                {liveResults.map((track) => (
                                    <div
                                        key={track.id}
                                        onClick={() => handleTrackClick(track)}
                                        className="flex items-center px-4 py-2.5 hover:bg-zinc-900 active:bg-zinc-800 cursor-pointer"
                                    >
                                        <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded object-cover mr-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-[15px] font-medium truncate">{track.title}</p>
                                            <p className="text-zinc-400 text-sm truncate">
                                                {track.itemType === 'artist' ? 'Artist' : track.itemType === 'playlist' ? 'Playlist' : `Track • ${track.artist}`}
                                            </p>
                                        </div>
                                        <div className="px-2" onClick={(e) => e.stopPropagation()}>
                                            <TrackContextMenu track={track} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-zinc-500">No results found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
