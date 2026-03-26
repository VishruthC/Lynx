import React, { useState, useEffect } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLikedSongs, subscribeToUserPlaylists, Playlist } from '../services/db';
import { Track } from '../types';
import TrackList from './TrackList';

export default function SongsView() {
    const { user } = useAuth();
    const [allSongs, setAllSongs] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchAllSongs = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Liked Songs
                const likedSongs = await getLikedSongs(user.uid);

                // 2. We'll also need the playlists to get their songs
                // Since we want to stay updated, we could use the subscription but for a simple "view" 
                // a one-time fetch or passing them as props might be easier.
                // However, let's just stick to the current playlists state logic if possible.
                // For now, let's just subscribe here to be safe and reactive.
                const unsubscribe = subscribeToUserPlaylists(user.uid, (playlists) => {
                    const playlistSongs = playlists.flatMap(p => p.tracks || []);
                    const combined = [...likedSongs, ...playlistSongs];

                    // Deduplicate by ID
                    const seen = new Set();
                    const uniqueSongs = combined.filter(song => {
                        if (seen.has(song.id)) return false;
                        seen.add(song.id);
                        return true;
                    });

                    setAllSongs(uniqueSongs);
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching all songs:", error);
                setIsLoading(false);
            }
        };

        fetchAllSongs();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-cyan-400" size={48} />
            </div>
        );
    }

    if (allSongs.length === 0) {
        return (
            <div className="p-4 md:p-8 text-center mt-20">
                <Music size={64} className="mx-auto text-zinc-800 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No songs yet</h2>
                <p className="text-zinc-500">Songs from your playlists and liked songs will appear here.</p>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 pb-32 pt-4 md:pt-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">Songs</h1>
                    <p className="text-zinc-500 font-medium">{allSongs.length} tracks from your collection</p>
                </div>
            </div>

            <div className="bg-zinc-900/10 rounded-2xl border border-zinc-800/30 overflow-hidden">
                <TrackList tracks={allSongs} />
            </div>
        </div>
    );
}
