import { Play, Pause, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { toggleLikedSong, getLikedSongs } from '../services/db';
import React, { useState, useEffect } from 'react';
import TrackContextMenu from './TrackContextMenu';
import MarqueeText from './MarqueeText';

export default function TrackList({ tracks: initialTracks, onTrackClick }: { tracks: Track[], onTrackClick?: (track: Track) => void }) {
  const { currentTrack, isPlaying, playTrack, pause, resume } = usePlayer();
  const { user } = useAuth();
  const [likedSync, setLikedSync] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);

  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  useEffect(() => {
    if (user) {
      getLikedSongs(user.uid).then(songs => setLikedSync(songs.map(s => s.id)));
    } else {
      setLikedSync([]);
    }
  }, [user]);

  const handleLike = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to like songs");
      return;
    }
    const isLiked = likedSync.includes(track.id);
    if (isLiked) {
      setLikedSync(prev => prev.filter(id => id !== track.id));
    } else {
      setLikedSync(prev => [...prev, track.id]);
    }
    await toggleLikedSong(user.uid, track);
  };

  return (
    <div className="w-full pb-8">
      <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 mb-2">
        <div className="w-8 text-center">#</div>
        <div>Title</div>
        <div className="w-16 text-right">Time</div>
      </div>

      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              key={track.id}
              onClick={() => {
                if (track.itemType === 'song') {
                  if (window.innerWidth < 768) {
                    playTrack(track, tracks);
                  }
                } else if (onTrackClick) {
                  onTrackClick(track);
                }
              }}
              onDoubleClick={() => {
                if (track.itemType === 'song' && window.innerWidth >= 768) {
                  playTrack(track, tracks);
                }
              }}
              className={`group flex md:grid md:grid-cols-[auto_1fr_auto] gap-2 md:gap-4 items-center px-2 md:px-4 py-2 md:py-2 rounded-md transition-colors hover:bg-zinc-800/50 cursor-pointer ${isCurrent ? 'bg-zinc-800/30' : ''}`}
            >
              <div className="hidden md:flex w-8 text-center text-zinc-500 text-sm items-center justify-center">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end space-x-1 h-4">
                    <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_0ms] h-full"></div>
                    <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_200ms] h-2/3"></div>
                    <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_400ms] h-4/5"></div>
                  </div>
                ) : track.itemType === 'song' ? (
                  <span className="group-hover:hidden">{index + 1}</span>
                ) : null}

                {track.itemType === 'song' && (
                  <button
                    className={`hidden group-hover:flex items-center justify-center text-white ${isCurrent && isPlaying ? '!flex' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        isPlaying ? pause() : resume();
                      } else {
                        playTrack(track, tracks);
                      }
                    }}
                  >
                    {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <img src={track.thumbnail} alt={track.title} className="w-12 h-12 md:w-10 md:h-10 object-cover rounded shadow-sm" />
                  {/* Mobile playing indicator overlay */}
                  {isCurrent && (
                    <div className="md:hidden absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                      {isPlaying ? (
                        <div className="flex items-end space-x-0.5 h-3">
                          <div className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_0ms] h-full"></div>
                          <div className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_200ms] h-2/3"></div>
                          <div className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_400ms] h-4/5"></div>
                        </div>
                      ) : (
                        <Pause size={12} className="text-cyan-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <MarqueeText className={`font-medium text-sm md:text-base ${isCurrent ? 'text-cyan-400' : 'text-zinc-100'}`}>
                    {track.title}
                  </MarqueeText>
                  <MarqueeText className="text-xs md:text-sm text-zinc-400">
                    {track.artist}
                  </MarqueeText>
                </div>
              </div>

              <div className="flex items-center space-x-2 md:space-x-4">
                {track.itemType === 'song' && (
                  <button
                    onClick={(e) => handleLike(e, track)}
                    className={`hidden md:block transition-colors ${likedSync.includes(track.id) ? "text-cyan-400 hover:text-cyan-300" : "text-zinc-500 hover:text-white"}`}
                  >
                    <Heart size={18} fill={likedSync.includes(track.id) ? "currentColor" : "none"} />
                  </button>
                )}
                {track.itemType === 'song' ? (
                  <div className="hidden md:block w-16 text-right text-sm text-zinc-500">
                    {formatTime(track.duration)}
                  </div>
                ) : track.itemType === 'playlist' ? (
                  <div className="hidden md:block w-16 text-right text-xs text-zinc-500 font-bold uppercase">
                    {track.trackCount || 0} Tracks
                  </div>
                ) : (
                  <div className="hidden md:block w-16" />
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  {track.itemType === 'song' && (
                    <TrackContextMenu
                      track={track}
                      isLiked={likedSync.includes(track.id)}
                      onToggleLike={(t) => handleLike({ stopPropagation: () => { } } as any, t)}
                      onRemove={(id) => {
                        setTracks(prev => prev.filter(t => t.id !== id));
                        setLikedSync(prev => prev.filter(tid => tid !== id));
                      }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
