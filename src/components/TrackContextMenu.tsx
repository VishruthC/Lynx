import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Play, Plus, Trash2, ChevronRight, Loader2, Heart } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { removeSongFromLibrary, getUserPlaylists, addSongToPlaylist, removeSongFromPlaylist, Playlist, createPlaylist } from '../services/db';
import EditPlaylistModal from './EditPlaylistModal';

interface Props {
    track: Track;
    className?: string;
    playlistId?: string;
    onRemove?: (trackId: string) => void;
    isLiked?: boolean;
    onToggleLike?: (track: Track) => void;
}

export default function TrackContextMenu({ track, className = '', playlistId, onRemove, isLiked, onToggleLike }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showSubMenu, setShowSubMenu] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
    const [subMenuStyles, setSubMenuStyles] = useState<React.CSSProperties>({});

    const menuRef = useRef<HTMLDivElement>(null);
    const addBtnRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout>();
    const { playNext } = usePlayer();
    const { user } = useAuth();

    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || (window as any).Capacitor?.isNative);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowSubMenu(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    const handlePlayNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        playNext(track);
        setIsOpen(false);
    };

    const handleAddToPlaylistMouseEnter = () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (user) {
            if (addBtnRef.current) {
                const rect = addBtnRef.current.getBoundingClientRect();
                setSubMenuStyles({
                    position: 'fixed',
                    top: rect.top - 8,
                    left: rect.left - 224 - 4,
                    zIndex: 999999
                });
            }
            setShowSubMenu(true);
            if (playlists.length === 0 && !isLoadingPlaylists) {
                setIsLoadingPlaylists(true);
                getUserPlaylists(user.uid).then(res => {
                    setPlaylists(res);
                    setIsLoadingPlaylists(false);
                }).catch(() => setIsLoadingPlaylists(false));
            }
        }
    };

    const handleAddToPlaylistMouseLeave = () => {
        hideTimeoutRef.current = setTimeout(() => setShowSubMenu(false), 200);
    };

    const handleRemoveFromLibrary = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (user) {
            try {
                await removeSongFromLibrary(user.uid, track.id);
                if (!playlistId || playlistId === 'liked') {
                    onRemove?.(track.id);
                }
            } catch (err) { console.error(err); }
        }
        setIsOpen(false);
    };

    const handleRemoveFromPlaylist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (user && playlistId && playlistId !== 'liked') {
            try {
                await removeSongFromPlaylist(playlistId, track.id);
                onRemove?.(track.id);
            } catch (err) { console.error(err); }
        }
        setIsOpen(false);
    };

    const subMenuContent = showSubMenu && (
        <div
            style={subMenuStyles}
            className="w-56 bg-[#282828] border border-zinc-700/80 rounded-md shadow-2xl py-2 flex flex-col max-h-96 overflow-y-auto scrollbar-thin"
            onMouseEnter={handleAddToPlaylistMouseEnter}
            onMouseLeave={handleAddToPlaylistMouseLeave}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                    setIsOpen(false);
                    setShowSubMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left flex-shrink-0"
            >
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-white" />
                </div>
                <span>Create new playlist</span>
            </button>

            <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2 border-t border-zinc-700/50 pt-3 flex-shrink-0">
                Recent
            </div>

            {isLoadingPlaylists ? (
                <div className="flex justify-center py-4 flex-shrink-0"><Loader2 className="animate-spin w-4 h-4 text-cyan-400" /></div>
            ) : (
                playlists.map(p => (
                    <button
                        key={p.id}
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await addSongToPlaylist(p.id, track);
                                setIsOpen(false);
                                setShowSubMenu(false);
                            } catch (err) { console.error(err) }
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left flex-shrink-0"
                    >
                        <span className="truncate">{p.name}</span>
                    </button>
                ))
            )}
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            <button
                className={`${isMobile ? 'p-1' : 'p-1.5 md:p-2'} rounded-full text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-all ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <MoreHorizontal size={isMobile ? 18 : 20} />
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 right-0 top-full mt-1 w-56 bg-[#282828] border border-zinc-700/80 rounded-md shadow-2xl py-1"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={handlePlayNext}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left"
                    >
                        <Play size={16} />
                        <span>Play next</span>
                    </button>

                    {isMobile && onToggleLike && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike(track);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left"
                        >
                            <Heart size={16} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-cyan-400" : ""} />
                            <span>{isLiked ? 'Unlike' : 'Like'}</span>
                        </button>
                    )}

                    <div
                        className="w-full relative"
                        ref={addBtnRef}
                        onMouseEnter={handleAddToPlaylistMouseEnter}
                        onMouseLeave={handleAddToPlaylistMouseLeave}
                    >
                        <button
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left group/sub"
                        >
                            <div className="flex items-center space-x-3">
                                <Plus size={16} />
                                <span>Add to playlist</span>
                            </div>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {playlistId && playlistId !== 'liked' && (
                        <button
                            onClick={handleRemoveFromPlaylist}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-zinc-700/50 transition-colors text-left"
                        >
                            <Trash2 size={16} />
                            <span>Remove from this playlist</span>
                        </button>
                    )}

                    {user && (
                        <button
                            onClick={handleRemoveFromLibrary}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-zinc-700/50 transition-colors text-left"
                        >
                            <Trash2 size={16} />
                            <span>Remove from library</span>
                        </button>
                    )}
                </div>
            )}

            {showSubMenu && createPortal(subMenuContent, document.body)}

            {isModalOpen && (
                <EditPlaylistModal
                    isOpen={true}
                    onClose={() => setIsModalOpen(false)}
                    mode="create"
                    onCreate={async (name, desc) => {
                        const id = await createPlaylist(user!.uid, name, desc);
                        await addSongToPlaylist(id, track);
                        return id;
                    }}
                />
            )}
        </div>
    );
}
