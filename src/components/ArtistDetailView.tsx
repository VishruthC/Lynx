import React, { useState, useEffect } from 'react';
import { Play, Shuffle, UserPlus, Share, MoreHorizontal, Loader2, Music, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { getArtistDetails } from '../services/piped';
import { Track, Artist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import TrackList from './TrackList';
import MarqueeText from './MarqueeText';

interface ArtistDetailViewProps {
    artistId: string;
    onArtistClick: (id: string, name: string) => void;
    onAlbumClick: (id: string, name: string) => void;
}

export default function ArtistDetailView({ artistId, onArtistClick, onAlbumClick }: ArtistDetailViewProps) {
    const { playTrack, toggleShuffle, isShuffle } = usePlayer();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getArtistDetails(artistId);
                setArtist(data);
            } catch (err) {
                console.error("Error fetching artist:", err);
                setError("Failed to load artist details.");
            } finally {
                setIsLoading(false);
            }
        };

        if (artistId) {
            fetchArtist();
        }
    }, [artistId]);

    const handlePlayAll = () => {
        if (artist && artist.topTracks.length > 0) {
            playTrack(artist.topTracks[0], artist.topTracks);
        }
    };

    const handleShufflePlay = () => {
        if (artist && artist.topTracks.length > 0) {
            if (!isShuffle) toggleShuffle();
            const randomIndex = Math.floor(Math.random() * artist.topTracks.length);
            playTrack(artist.topTracks[randomIndex], artist.topTracks);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 size={48} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8">
                <Music size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium">{error || "Artist not found"}</p>
            </div>
        );
    }

    return (
        <div className="relative h-full overflow-y-auto no-scrollbar pb-32 pt-safe">
            {/* Header / Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] min-h-[300px] w-full overflow-hidden">
                {/* Background Banner */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={artist.banner || artist.thumbnail}
                        className="w-full h-full object-cover brightness-[0.4] blur-sm scale-105"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Artist Info Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-12">
                    <div className="flex flex-col gap-2 md:gap-4 max-w-5xl">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-cyan-400 rounded-full" />
                            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">Verified Artist</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-2">
                            {artist.name}
                        </h1>
                        <div className="flex items-center gap-4 text-sm md:text-base text-zinc-300 font-medium">
                            {artist.subscriberCount && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-white font-bold">{artist.subscriberCount}</span> Fans
                                </span>
                            )}
                        </div>

                        {artist.description && (
                            <div className="mt-4 max-w-2xl">
                                <p className="text-zinc-400 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed">
                                    {artist.description}
                                </p>
                                <button className="text-white text-sm font-bold mt-2 hover:underline">Read more</button>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-6 md:mt-8">
                            <button
                                onClick={handlePlayAll}
                                className="px-8 py-3 bg-white text-black font-black rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-white/10"
                            >
                                <Play size={20} fill="currentColor" /> Play
                            </button>
                            <button
                                onClick={handleShufflePlay}
                                className={`px-8 py-3 backdrop-blur-md border rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${isShuffle ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                            >
                                <Shuffle size={20} /> Shuffle
                            </button>

                            <div className="flex items-center gap-2 ml-auto md:ml-0">
                                <button className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white" title="Follow">
                                    <UserPlus size={20} />
                                </button>
                                <button className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white" title="Share">
                                    <Share size={20} />
                                </button>
                                <button className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="relative z-20 px-4 md:px-12 mt-8 flex flex-col gap-12">
                {/* Top Tracks */}
                {artist.topTracks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Top Tracks</h2>
                            <button className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">View all</button>
                        </div>
                        <div className="bg-zinc-900/20 rounded-2xl border border-zinc-800/30 overflow-hidden">
                            <TrackList tracks={artist.topTracks.slice(0, 5)} />
                        </div>
                    </section>
                )}

                {/* Albums */}
                {artist.albums.length > 0 && (
                    <ArtistSection title="Albums" items={artist.albums} onItemClick={onAlbumClick} />
                )}

                {/* Singles & EPs */}
                {artist.singles.length > 0 && (
                    <ArtistSection title="EP & Singles" items={artist.singles} onItemClick={onAlbumClick} />
                )}

                {/* Videos */}
                {artist.videos.length > 0 && (
                    <ArtistSection title="Videos" items={artist.videos} subTitleField="artist" />
                )}

                {/* Related Artists */}
                {artist.relatedArtists && artist.relatedArtists.length > 0 && (
                    <ArtistSection
                        title="Fans also like"
                        items={artist.relatedArtists}
                        rounded
                        onItemClick={onArtistClick}
                    />
                )}
            </div>
        </div>
    );
}

function ArtistSection({ title, items, onItemClick, subTitleField = "trackCount", rounded = false }: { title: string, items: any[], onItemClick?: (id: string, name: string) => void, subTitleField?: string, rounded?: boolean }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;

            scrollRef.current.scrollTo({
                left: scrollTo,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="group/section">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => scroll('left')}
                            className="p-1 px-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-1 px-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors ml-2">View all</button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 scroll-smooth"
            >
                {items.map((item, i) => (
                    <div
                        key={`${title}-${item.id}-${i}`}
                        onClick={() => onItemClick?.(item.id, item.title)}
                        className="flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer"
                    >
                        <div className={`aspect-square mb-3 overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-[1.02] ${rounded ? 'rounded-full' : 'rounded-lg md:rounded-xl'}`}>
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <MarqueeText className="text-white font-bold text-sm md:text-base mb-0.5">
                            {item.title}
                        </MarqueeText>
                        <p className="text-zinc-500 text-xs md:text-sm font-medium">
                            {subTitleField === 'trackCount' ? `${Math.max(0, item.trackCount || 0)} tracks` : item[subTitleField]}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
