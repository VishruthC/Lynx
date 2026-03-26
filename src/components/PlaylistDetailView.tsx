import React, { useState, useEffect } from 'react';
import { Play, Pause, Shuffle, Edit, Lock, Share, MoreHorizontal, Search, Heart, Clock, Loader2, Music, BookmarkPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlaylistById, getLikedSongs, toggleLikedSong, Playlist, saveExternalPlaylist, subscribeToUserPlaylists } from '../services/db';
import { getPlaylistTracks } from '../services/piped';
import { Track } from '../types';
import { formatTime } from '../utils/format';
import { usePlayer } from '../context/PlayerContext';
import { motion } from 'motion/react';
import EditPlaylistModal from './EditPlaylistModal';
import TrackContextMenu from './TrackContextMenu';
import MarqueeText from './MarqueeText';

export default function PlaylistDetailView({ playlistId, onViewChange }: { playlistId: string; onViewChange?: (view: string, query?: string, title?: string) => void }) {
    const { user } = useAuth();
    const { currentTrack, isPlaying, playTrack, pause, resume, isShuffle, toggleShuffle } = usePlayer();

    const [playlistInfo, setPlaylistInfo] = useState<{ title: string; description: string; creator: string; trackCount: number; duration: string; images: string[] } | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [likedSync, setLikedSync] = useState<string[]>([]);
    const [isSaved, setIsSaved] = useState(false);

    const isLikedSongsView = playlistId === 'liked';
    const isPublicCandidate = playlistId && /^(PL|RD|UU|LL|LM|OL|MC)/.test(playlistId);

    useEffect(() => {
        if (user) {
            getLikedSongs(user.uid).then(songs => setLikedSync(songs.map(s => s.id)));

            if (isPublicCandidate) {
                const unsubscribe = subscribeToUserPlaylists(user.uid, (pls) => {
                    setIsSaved(pls.some(p => p.originalId === playlistId));
                });
                return () => unsubscribe();
            }
        } else {
            setLikedSync([]);
            setIsSaved(false);
        }
    }, [user, playlistId, isPublicCandidate]);

    useEffect(() => {
        const fetchData = async () => {
            if (!playlistId) {
                setIsLoading(false);
                return;
            }

            if (!user && !isPublicCandidate && !isLikedSongsView) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            if (isLikedSongsView && user) {
                const songs = await getLikedSongs(user.uid);
                setTracks(songs);
                const totalDuration = songs.reduce((acc, curr) => acc + curr.duration, 0);

                setPlaylistInfo({
                    title: 'Liked Songs',
                    description: '',
                    creator: user.email?.split('@')[0] || 'User',
                    trackCount: songs.length,
                    duration: formatTime(totalDuration),
                    images: [] // handled specially in render
                });
            } else {
                // Try local DB first if user is logged in
                let p = user ? await getPlaylistById(playlistId) : null;

                if (p) {
                    setTracks(p.tracks);
                    const totalDuration = p.tracks.reduce((acc, curr) => acc + curr.duration, 0);
                    setPlaylistInfo({
                        title: p.name,
                        description: p.description || '',
                        creator: user.email?.split('@')[0] || 'User',
                        trackCount: p.tracks.length,
                        duration: formatTime(totalDuration),
                        images: p.coverImage ? [p.coverImage] : []
                    });
                } else {
                    // Fallback to public Piped playlist
                    try {
                        const publicP = await getPlaylistTracks(playlistId);
                        if (publicP && publicP.tracks.length > 0) {
                            setTracks(publicP.tracks);
                            const totalDuration = publicP.tracks.reduce((acc, curr) => acc + curr.duration, 0);
                            setPlaylistInfo({
                                title: publicP.title,
                                description: `Public playlist by ${publicP.uploader}`,
                                creator: publicP.uploader,
                                trackCount: publicP.tracks.length,
                                duration: formatTime(totalDuration),
                                images: publicP.thumbnail ? [publicP.thumbnail] : []
                            });
                        }
                    } catch (error) {
                        console.error("Failed to fetch public playlist:", error);
                    }
                }
            }

            setIsLoading(false);
        };

        fetchData();
    }, [playlistId, user, isLikedSongsView]);

    if (!user && !isPublicCandidate && !isLikedSongsView) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center max-w-md w-full">
                    <Heart className="mx-auto text-zinc-500 mb-4 w-12 h-12" />
                    <h3 className="text-xl font-bold text-white mb-2">Sign in to see playlists</h3>
                    <p className="text-zinc-400">Log in or create an account to view your saved songs and custom playlists.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="animate-spin text-cyan-400 w-12 h-12" />
            </div>
        );
    }

    if (!playlistInfo) {
        return (
            <div className="p-8 text-center mt-20">
                <Music className="mx-auto text-zinc-500 mb-4 w-12 h-12" />
                <h2 className="text-2xl font-bold text-white mb-2">Playlist not found</h2>
                <p className="text-zinc-400">The playlist you are looking for does not exist or you do not have permission to view it.</p>
            </div>
        );
    }

    const filteredTracks = tracks.filter(t =>
        t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const handleLike = async (e: React.MouseEvent, track: Track) => {
        e.stopPropagation();
        if (!user) return;
        const isLiked = likedSync.includes(track.id);
        if (isLiked) {
            setLikedSync(prev => prev.filter(id => id !== track.id));
        } else {
            setLikedSync(prev => [...prev, track.id]);
        }
        await toggleLikedSong(user.uid, track);
    };

    const handleSaveToLibrary = async () => {
        if (!user || !playlistInfo || isSaved) return;
        const newId = await saveExternalPlaylist(
            user.uid,
            playlistInfo.title,
            tracks,
            playlistId,
            playlistInfo.images[0]
        );
        if (onViewChange) {
            onViewChange('playlist', newId, playlistInfo.title);
        }
    };

    return (
        <div className="w-full pb-24 relative font-sans bg-black min-h-screen pt-4 md:pt-8">
            {/* Ambient Blurred Background from Cover Art */}
            <div className="absolute top-0 left-0 right-0 h-[700px] md:h-[800px] overflow-hidden pointer-events-none z-0">
                {isLikedSongsView ? (
                    <div className="absolute inset-0 bg-zinc-700 opacity-50 blur-[100px] scale-150 transform-gpu" />
                ) : playlistInfo.images.length > 0 ? (
                    <div
                        className="absolute inset-0 opacity-70 blur-[120px] scale-[2.2] origin-top transform-gpu"
                        style={{
                            backgroundImage: `url(${playlistInfo.images[0]})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-zinc-800 opacity-50 blur-[100px] scale-150 transform-gpu" />
                )}
                {/* Smoother gradient transition to black */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black pointer-events-none" />
            </div>

            {/* Header Section */}
            <div className="p-4 md:px-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Cover Art Wrapper with Glow */}
                <div className="relative group/cover flex-shrink-0">
                    {!isLikedSongsView && playlistInfo.images.length > 0 && (
                        <div
                            className="absolute -inset-1 blur-[35px] opacity-90 scale-110 z-0 transform-gpu bg-cover bg-center"
                            style={{ backgroundImage: `url(${playlistInfo.images[0]})` }}
                        />
                    )}
                    {isLikedSongsView && (
                        <div className="absolute -inset-1 blur-[35px] opacity-70 scale-110 z-0 transform-gpu bg-zinc-600" />
                    )}

                    <div className="w-48 h-48 md:w-60 md:h-60 flex-shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center relative z-10 border border-white/10">
                        {isLikedSongsView ? (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-500 to-zinc-800 flex items-center justify-center">
                                <Heart className="text-white w-20 h-20" fill="currentColor" />
                            </div>
                        ) : playlistInfo.images.length > 0 ? (
                            <img src={playlistInfo.images[0]} className="w-full h-full object-cover" alt="Playlist cover" />
                        ) : (
                            <Music className="w-16 h-16 text-zinc-600" />
                        )}
                    </div>
                </div>

                {/* Info Text */}
                <div className="flex flex-col gap-2 w-full min-w-0">
                    <p className="text-xs uppercase tracking-wider font-semibold text-white/80 hidden md:block">Playlist</p>
                    <MarqueeText className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-2 pb-2 leading-tight">
                        {playlistInfo.title}
                    </MarqueeText>
                    <MarqueeText className="flex flex-col md:flex-row md:items-center text-sm text-zinc-300 gap-1 md:gap-2">
                        <span className="font-bold text-white pr-2">{playlistInfo.creator}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mt-1 md:mt-0">
                            {playlistInfo.trackCount} TRACKS ({playlistInfo.duration})
                        </span>
                    </MarqueeText>
                </div>
            </div>

            <div className="px-4 md:px-8 pb-8 pt-4 relative z-10">
                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                        className="w-32 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/20 font-bold rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Play size={20} fill="currentColor" /> Play
                    </button>
                    <button
                        onClick={() => {
                            if (tracks.length > 0) {
                                if (!isShuffle) toggleShuffle();
                                const randomIndex = Math.floor(Math.random() * tracks.length);
                                playTrack(tracks[randomIndex], tracks);
                            }
                        }}
                        className={`w-32 py-3 backdrop-blur-lg border font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${isShuffle ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                        <Shuffle size={18} /> Shuffle
                    </button>

                    <div className="flex-1" />

                    {/* Right side tiny actions */}
                    <div className="hidden md:flex items-center gap-6 text-zinc-400">
                        {!isLikedSongsView && !isPublicCandidate && user && (
                            <button onClick={() => setIsEditModalOpen(true)} className="flex flex-col items-center gap-1 hover:text-white transition-colors group">
                                <Edit size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Edit</span>
                            </button>
                        )}
                        {isPublicCandidate && user && (
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={isSaved}
                                className={`flex flex-col items-center gap-1 transition-colors group ${isSaved ? 'text-cyan-400 cursor-default' : 'hover:text-white text-zinc-400'}`}
                            >
                                <BookmarkPlus size={20} className={isSaved ? '' : 'group-hover:scale-110 transition-transform'} fill={isSaved ? 'currentColor' : 'none'} />
                                <span className="text-[10px] uppercase font-bold tracking-wider">{isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                        )}
                        <button className="flex flex-col items-center gap-1 hover:text-white transition-colors group">
                            <Share size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Share</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 hover:text-white transition-colors group">
                            <MoreHorizontal size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">More</span>
                        </button>
                    </div>
                </div>

                {/* Search Filter */}
                <div className="relative mb-8 max-w-2xl px-4 md:px-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400/80" size={18} />
                    <input
                        type="text"
                        placeholder="Filter playlist on title, artist or album"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-md py-3 pl-11 pr-4 text-sm focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-500"
                    />
                </div>

                {/* Table Section */}
                <div className="bg-black/40 backdrop-blur-sm px-4 md:px-8 pt-4 rounded-t-3xl border-t border-white/5 min-h-[500px]">
                    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 mb-4 sticky top-0 bg-black/95 backdrop-blur-md z-30 -mt-4 pt-4">
                        <div className="md:flex hidden w-8 justify-center">#</div>
                        <div>Title</div>
                        <div className="hidden md:block">Artist</div>
                        <div className="hidden md:block w-32">Date Added</div>
                        <div className="w-12 md:w-24 text-right flex justify-end items-center md:gap-6">
                            <Clock size={16} className="hidden md:block" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        {filteredTracks.map((track, index) => {
                            const isCurrent = currentTrack?.id === track.id;
                            const isLiked = likedSync.includes(track.id);

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                                    key={track.id}
                                    onClick={() => {
                                        if (window.innerWidth < 768) playTrack(track, tracks);
                                    }}
                                    onDoubleClick={() => {
                                        if (window.innerWidth >= 768) playTrack(track, tracks);
                                    }}
                                    className={`group grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-3 md:gap-4 items-center px-2 md:px-4 py-2 rounded-md transition-colors hover:bg-zinc-800/40 cursor-pointer ${isCurrent ? 'bg-zinc-800/30' : ''}`}
                                >
                                    <div className="hidden md:flex w-8 items-center justify-center text-zinc-400 text-base">
                                        {isCurrent && isPlaying ? (
                                            <div className="flex items-end space-x-1 h-4">
                                                <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_0ms] h-full"></div>
                                                <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_200ms] h-2/3"></div>
                                                <div className="w-1 bg-cyan-400 animate-[bounce_1s_infinite_400ms] h-4/5"></div>
                                            </div>
                                        ) : (
                                            <span className={`group-hover:hidden ${isCurrent ? 'text-cyan-400' : ''}`}>{index + 1}</span>
                                        )}
                                        <button
                                            className={`hidden group-hover:flex items-center justify-center text-white ${isCurrent && isPlaying ? '!flex' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isCurrent) isPlaying ? pause() : resume();
                                                else playTrack(track, tracks);
                                            }}
                                        >
                                            {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden">
                                        <img src={track.thumbnail} alt={track.title} className="w-10 h-10 object-cover rounded shadow-sm flex-shrink-0" />
                                        <div className="truncate">
                                            <p className={`truncate font-medium text-base ${isCurrent ? 'text-cyan-400' : 'text-zinc-100'}`}>{track.title}</p>
                                            <p className="truncate text-sm text-zinc-400 md:hidden">{track.artist}</p>
                                        </div>
                                    </div>

                                    <div className="hidden md:block truncate text-sm text-zinc-400 hover:text-white transition-colors">
                                        {track.artist}
                                    </div>

                                    <div className="hidden md:block w-32 truncate text-sm text-zinc-400">
                                        Recently
                                    </div>

                                    <div className="w-12 md:w-24 text-sm text-zinc-400 flex items-center justify-end gap-2 md:gap-3">
                                        <button
                                            onClick={(e) => handleLike(e, track)}
                                            className="hidden md:block md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 hover:scale-110 active:scale-95"
                                        >
                                            <Heart size={16} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-cyan-400 opacity-100" : "text-zinc-400 hover:text-white"} />
                                        </button>
                                        <span className="hidden md:block tabular-nums font-mono text-xs md:text-sm">{formatTime(track.duration)}</span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <TrackContextMenu
                                                track={track}
                                                playlistId={playlistId}
                                                isLiked={isLiked}
                                                onToggleLike={(t) => handleLike({ stopPropagation: () => { } } as any, t)}
                                                onRemove={(id) => {
                                                    setTracks(prev => prev.filter(t => t.id !== id));
                                                    setPlaylistInfo(prev => prev ? { ...prev, trackCount: Math.max(0, prev.trackCount - 1) } : null);
                                                    if (isLikedSongsView) setLikedSync(prev => prev.filter(tid => tid !== id));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {playlistInfo && (
                <EditPlaylistModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    playlistId={playlistId}
                    initialName={playlistInfo.title}
                    initialDescription={playlistInfo.description}
                    initialImage={playlistInfo.images[0]}
                    onSave={(newName, newDesc) => {
                        setPlaylistInfo(prev => prev ? { ...prev, title: newName, description: newDesc || '' } : null);
                    }}
                />
            )}
        </div>
    );
}
