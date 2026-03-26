import React, { useState, useEffect } from 'react';
import { X, Loader2, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists, addSongToPlaylist, Playlist } from '../services/db';
import { Track } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    track: Track;
}

export default function AddToPlaylistModal({ isOpen, onClose, track }: Props) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            getUserPlaylists(user.uid).then(res => {
                setPlaylists(res);
                setIsLoading(false);
            });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div
                className="bg-[#282828] w-full max-w-md rounded-xl p-6 shadow-2xl border border-zinc-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add to playlist</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-cyan-400 w-8 h-8" />
                    </div>
                ) : playlists.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                        <p>You don't have any custom playlists yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                        {playlists.map(p => (
                            <button
                                key={p.id}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await addSongToPlaylist(p.id, track);
                                        onClose();
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }}
                                className="w-full flex items-center p-3 rounded-md hover:bg-zinc-700/50 transition-colors text-left group"
                            >
                                <div className="w-12 h-12 bg-zinc-800 rounded mr-4 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {p.coverImage ? (
                                        <img src={p.coverImage} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Music className="w-5 h-5 text-zinc-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{p.name}</p>
                                    <p className="text-zinc-400 text-sm">{p.tracks.length} tracks</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
