import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Loader2, Play, ChevronLeft } from 'lucide-react';
import { searchMusic } from '../services/piped';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import MarqueeText from './MarqueeText';

export default function ExploreView({ onPlaylistClick, onArtistClick, onSearch }: {
  onPlaylistClick: (id: string, title: string) => void,
  onArtistClick: (id: string, title: string) => void,
  onSearch: (query: string) => void
}) {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<{ title: string, items: string[] } | null>(null);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const results = await searchMusic('trending hits 2024');
        setFeaturedTracks(results.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch featured tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const genres = [
    "Blues", "Classical", "Country", "Dance & Electronic", "Folk / Americana", "Global",
    "Gospel / Christian", "Hip-Hop", "Jazz", "Kids", "K-Pop", "Latin",
    "Legacy", "Metal", "Pop", "Rising", "R&B / Soul", "Reggae / Dancehall",
    "Rock / Indie", "Soundtracks"
  ];

  const moods = [
    "Spring", "Women's History Month", "For DJs", "Record Labels", "TIDAL Magazine", "Sleep",
    "Self-Care", "Credits", "Mixtapes", "Social Justice", "Celebration", "Party",
    "Workout", "Focus", "Happy", "Romance", "Relax", "Pride"
  ];

  const decades = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s"];

  if (expandedCategory) {
    return (
      <div className="p-4 md:p-8 pb-24">
        <div className="flex items-center space-x-4 mb-12">
          <button
            onClick={() => setExpandedCategory(null)}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{expandedCategory.title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
          {expandedCategory.items.map(item => (
            <button
              key={item}
              onClick={() => onSearch(item)}
              className="text-left text-white font-bold text-lg hover:text-cyan-400 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-24 pt-4 md:pt-8">
      {/* Featured Section */}
      <div className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-tight">Featured</h2>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (track.itemType === 'playlist') {
                      onPlaylistClick(track.id, track.title);
                    } else if (track.itemType === 'artist') {
                      onArtistClick(track.id, track.title);
                    } else {
                      playTrack(track, featuredTracks);
                    }
                  }}
                  className="group relative bg-zinc-900/40 hover:bg-zinc-800/80 transition-colors rounded-lg p-3 cursor-pointer flex flex-col gap-3"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden shadow-lg">
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'opacity-100' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end space-x-0.5 h-4">
                            <div className="w-1 bg-black animate-[bounce_1s_infinite_0ms] h-full"></div>
                            <div className="w-1 bg-black animate-[bounce_1s_infinite_200ms] h-2/3"></div>
                            <div className="w-1 bg-black animate-[bounce_1s_infinite_400ms] h-4/5"></div>
                          </div>
                        ) : (
                          <Play size={20} className="ml-1" fill="currentColor" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <MarqueeText className="text-white font-semibold text-sm">
                      {track.title}
                    </MarqueeText>
                    <MarqueeText className="text-zinc-400 text-xs mt-1">
                      {track.itemType === 'playlist' ? 'Playlist' : track.itemType === 'artist' ? 'Artist' : track.artist}
                    </MarqueeText>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories */}
      <CategoryScroll title="Genres" items={genres} onSearch={onSearch} onViewAll={() => setExpandedCategory({ title: "Genres", items: genres })} />
      <CategoryScroll title="Moods & Activities" items={moods} onSearch={onSearch} onViewAll={() => setExpandedCategory({ title: "Moods & Activities", items: moods })} />
      <CategoryScroll title="Decades" items={decades} onSearch={onSearch} onViewAll={() => setExpandedCategory({ title: "Decades", items: decades })} />
    </div>
  );
}

function CategoryScroll({ title, items, onSearch, onViewAll }: { title: string, items: string[], onSearch: (query: string) => void, onViewAll: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          View all
        </button>
      </div>
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto pb-4 -mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
        >
          {items.map(item => (
            <button
              key={item}
              onClick={() => onSearch(item)}
              className="whitespace-nowrap bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors text-white font-bold text-sm px-6 py-3.5 rounded-md flex-shrink-0"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right gradient and arrow */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={scrollRight}
            className="w-8 h-8 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center backdrop-blur-sm pointer-events-auto cursor-pointer hover:bg-zinc-800 hover:scale-105 transition-all shadow-xl"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
