import React, { useState, useEffect } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Loader2, Heart, ListMusic, Share2, Info, Cast } from 'lucide-react';
import TrackContextMenu from './TrackContextMenu';
import QueueView from './QueueView';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/format';
import MarqueeText from './MarqueeText';
import { useAuth } from '../context/AuthContext';
import { toggleLikedSong, isSongLiked } from '../services/db';

interface NowPlayingViewProps {
    onClose: () => void;
}

export default function NowPlayingView({ onClose }: { onClose: () => void }) {
    const {
        currentTrack, isPlaying, isLoading, currentTime, duration,
        isShuffle, repeatMode,
        pause, resume, next, prev, seek, toggleShuffle, toggleRepeat
    } = usePlayer();
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

    useEffect(() => {
        if (user && currentTrack) {
            isSongLiked(user.uid, currentTrack.id).then(setIsLiked);
        }
    }, [user, currentTrack]);

    const handleLike = async () => {
        if (!user || !currentTrack) return;
        const liked = await toggleLikedSong(user.uid, currentTrack);
        setIsLiked(liked);
    };

    if (!currentTrack) return null;

    if (showQueue) {
        return <QueueView onClose={() => setShowQueue(false)} />;
    }

    return (
        <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col md:hidden overflow-hidden">
            {/* Immersive Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-50 blur-[100px] scale-150 transform-gpu"
                    style={{
                        backgroundImage: `url(${currentTrack.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-zinc-950" />
            </div>

            <div className="relative z-10 flex flex-col h-full px-8 pt-4 pb-8 safe-area-inset-top safe-area-inset-bottom">
                {/* Header - Minimal Back button */}
                <div className="flex items-center justify-start h-12 mb-4">
                    <button onClick={onClose} className="p-2 -ml-3 text-white/50 hover:text-white transition-colors">
                        <ChevronDown size={32} />
                    </button>
                </div>

                {/* Album Art Section */}
                <div className="flex-1 flex flex-col justify-center items-center mb-6">
                    <div className="w-full aspect-square max-w-[320px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border border-white/5">
                        <img
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Track Info & Actions */}
                <div className="mb-8">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <MarqueeText className="text-2xl font-black text-white tracking-tight">
                                {currentTrack.title}
                            </MarqueeText>
                            <div className="text-sm text-zinc-400 mt-1 font-medium line-clamp-1">
                                {currentTrack.artist}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLike}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <Heart
                                    size={22}
                                    fill={isLiked ? "currentColor" : "none"}
                                    className={isLiked ? "text-cyan-400" : "text-white/80"}
                                />
                            </button>
                            <div className="relative">
                                <TrackContextMenu
                                    track={currentTrack}
                                    isLiked={isLiked}
                                    onToggleLike={handleLike}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Section */}
                <div className="mb-10">
                    <div className="relative group/progress h-6 flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer z-10 accent-white"
                            style={{
                                background: `linear-gradient(to right, #ffffff ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-bold mt-2 px-0.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(duration - currentTime)}</span>
                    </div>
                </div>

                {/* Main Playback Controls */}
                <div className="flex items-center justify-center gap-16 mb-8 px-2">
                    <button onClick={prev} className="p-2 text-white hover:scale-110 active:scale-95 transition-all">
                        <SkipBack size={36} fill="currentColor" />
                    </button>

                    <button
                        onClick={isPlaying ? pause : resume}
                        className="p-2 text-white hover:scale-110 active:scale-95 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 size={48} className="animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={56} fill="currentColor" />
                        ) : (
                            <Play size={56} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button onClick={next} className="p-2 text-white hover:scale-110 active:scale-95 transition-all">
                        <SkipForward size={36} fill="currentColor" />
                    </button>
                </div>

                {/* Bottom Bar Actions */}
                <div className="flex justify-around items-center pt-4 border-t border-white/5">
                    <button
                        onClick={toggleShuffle}
                        className={`p-2 transition-colors ${isShuffle ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <Shuffle size={20} />
                    </button>
                    <button
                        onClick={toggleRepeat}
                        className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                    <button
                        onClick={() => setShowQueue(true)}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <ListMusic size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
