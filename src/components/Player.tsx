import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Shuffle, Repeat, Repeat1, Heart, ListMusic } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { toggleLikedSong, isSongLiked } from '../services/db';
import { formatTime } from '../utils/format';
import MarqueeText from './MarqueeText';
import NowPlayingView from './NowPlayingView';

export default function Player() {
  const { user } = useAuth();
  const {
    currentTrack, isPlaying, isLoading, currentTime, duration, volume,
    isShuffle, repeatMode,
    pause, resume, next, prev, setVolume, seek, toggleShuffle, toggleRepeat,
    isNowPlayingOpen, setIsNowPlayingOpen
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (user && currentTrack) {
      isSongLiked(user.uid, currentTrack.id).then(setIsLiked);
    }
  }, [user, currentTrack]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !currentTrack) return;
    const liked = await toggleLikedSong(user.uid, currentTrack);
    setIsLiked(liked);
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Desktop Player - Premium Floating Island */}
      <div className="hidden md:flex fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] h-24 glass-morphism border border-white/10 rounded-[28px] items-center px-8 justify-between z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Track Info & Actions */}
        <div className="flex items-center space-x-5 w-[30%] min-w-[320px]">
          <div className="relative group/player-art cursor-pointer flex-shrink-0" onClick={() => setIsNowPlayingOpen(true)}>
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-14 h-14 object-cover rounded-xl shadow-lg ring-1 ring-white/20 transition-transform group-hover/player-art:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/player-art:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
              <SkipForward className="text-white w-5 h-5 rotate-90" />
            </div>
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              <div
                className="cursor-pointer hover:underline min-w-0 flex-shrink-1"
                onClick={() => setIsNowPlayingOpen(true)}
              >
                <MarqueeText className="text-white font-bold text-[15.5px]">
                  {currentTrack.title}
                </MarqueeText>
              </div>
              <button
                onClick={handleLike}
                className="flex-shrink-0 group/heart transition-transform hover:scale-125 active:scale-95"
              >
                <Heart
                  size={19}
                  fill={isLiked ? "currentColor" : "none"}
                  className={isLiked ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-zinc-500 group-hover/heart:text-zinc-300"}
                />
              </button>
            </div>
            <MarqueeText className="text-zinc-400 text-xs mt-0.5">
              {currentTrack.artist}
            </MarqueeText>
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex flex-col items-center w-[40%] max-w-[600px] gap-2.5">
          <div className="flex items-center space-x-7">
            <button
              onClick={toggleShuffle}
              className={`transition-all hover:scale-110 ${isShuffle ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button onClick={prev} className="text-white hover:text-white transition-all hover:scale-110 active:scale-95">
              <SkipBack size={24} fill="currentColor" />
            </button>

            <button
              onClick={isPlaying ? pause : resume}
              className="text-white hover:scale-110 active:scale-95 transition-all drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            >
              {isLoading ? (
                <Loader2 size={30} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button onClick={next} className="text-white hover:text-white transition-all hover:scale-110 active:scale-95">
              <SkipForward size={24} fill="currentColor" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition-all hover:scale-110 ${repeatMode !== 'off' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title={repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat All' : 'Repeat Off'}
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex items-center w-full space-x-3 text-[11px] text-zinc-500 font-medium">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group/progress h-6 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 group-hover/progress:[&::-webkit-slider-thumb]:w-3 group-hover/progress:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full transition-all"
                style={{
                  background: `linear-gradient(to right, #fff ${(currentTime / (duration || 1)) * 100}%, #3f3f46 ${(currentTime / (duration || 1)) * 100}%)`
                }}
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-end space-x-6 w-[30%] min-w-[280px]">
          <div className="flex items-center space-x-4 pr-4 border-r border-white/10 text-zinc-500">
            <button
              className="hover:text-white transition-colors"
              title="Queue"
              onClick={() => setIsNowPlayingOpen(true)}
            >
              <ListMusic size={20} />
            </button>
          </div>
          <div className="flex items-center space-x-3 group/volume">
            <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-zinc-400 hover:text-white transition-colors">
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-24 h-6 flex items-center text-white">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 group-hover/volume:[&::-webkit-slider-thumb]:w-3 group-hover/volume:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full transition-all"
                style={{
                  background: `linear-gradient(to right, #fff ${volume * 100}%, #3f3f46 ${volume * 100}%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {isNowPlayingOpen && <NowPlayingView onClose={() => setIsNowPlayingOpen(false)} />}
    </>
  );
}

export function MiniPlayerContent() {
  const {
    currentTrack, isPlaying, isLoading, pause, resume, next, setIsNowPlayingOpen, currentTime, duration
  } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div
      className="h-16 flex items-center px-4 justify-between relative"
      onClick={() => setIsNowPlayingOpen(true)}
    >
      {/* Mini Progress Bar */}
      <div className="absolute top-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-400"
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        />
      </div>

      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-10 h-10 object-cover rounded-lg shadow-lg flex-shrink-0" />
        <div className="min-w-0 flex-1 pr-2">
          <MarqueeText className="text-white font-semibold text-sm">
            {currentTrack.title}
          </MarqueeText>
          <MarqueeText className="text-zinc-400 text-xs">
            {currentTrack.artist}
          </MarqueeText>
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={isPlaying ? pause : resume}
          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button onClick={next} className="text-zinc-400">
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
