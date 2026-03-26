import React from 'react';
import { ChevronDown, Play, GripVertical, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

interface QueueViewProps {
    onClose: () => void;
}

export default function QueueView({ onClose }: QueueViewProps) {
    const { queue, currentTrack, playTrack } = usePlayer();

    // Find current track index to split queue into "Upcoming"
    const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    const upcomingTracks = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

    if (!currentTrack) return null;

    return (
        <div className="fixed inset-0 bg-zinc-950 z-[110] flex flex-col md:hidden overflow-hidden transition-all animate-in slide-in-from-bottom duration-300">
            {/* Immersive Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-40 blur-[100px] scale-150 transform-gpu"
                    style={{
                        backgroundImage: `url(${currentTrack.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-zinc-950/80" />
            </div>

            <div className="relative z-10 flex flex-col h-full safe-area-inset-top safe-area-inset-bottom">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
                        <ChevronDown size={28} />
                    </button>
                    <h2 className="text-lg font-bold text-white tracking-tight">Queue</h2>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none">
                    {/* Now Playing Section */}
                    <div className="mb-8">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-white/30 mb-4 px-2">Now Playing</h3>
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl shadow-2xl">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg relative">
                                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">{currentTrack.title}</div>
                                <div className="text-xs text-zinc-400 font-medium truncate mt-0.5">{currentTrack.artist}</div>
                            </div>
                            <Music size={18} className="text-cyan-400" />
                        </div>
                    </div>

                    {/* Upcoming Section */}
                    {upcomingTracks.length > 0 && (
                        <div>
                            <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-white/30 mb-4 px-2">Next In Queue</h3>
                            <div className="space-y-1">
                                {upcomingTracks.map((track, idx) => (
                                    <button
                                        key={`${track.id}-${idx}`}
                                        onClick={() => playTrack(track)}
                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-zinc-900 border border-white/5">
                                            <img src={track.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Play size={16} fill="white" className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{track.title}</div>
                                            <div className="text-xs text-zinc-500 font-medium truncate mt-0.5">{track.artist}</div>
                                        </div>
                                        <GripVertical size={18} className="text-white/10 group-hover:text-white/30 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
