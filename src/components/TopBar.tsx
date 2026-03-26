import { Search, User, X, History, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { searchMusic, getSearchSuggestions } from '../services/piped';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import TrackContextMenu from './TrackContextMenu';

interface TopBarProps {
  onSearch: (q: string) => void;
  onTrackClick?: (track: Track, results: Track[]) => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export default function TopBar({ onSearch, onTrackClick, onBack, onForward, canGoBack, canGoForward }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { playTrack } = usePlayer();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setLiveResults([]);
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const [results, suggs] = await Promise.all([
          searchMusic(query),
          getSearchSuggestions(query)
        ]);
        setLiveResults(results.slice(0, 5));
        setSuggestions(suggs.filter(s => s.toLowerCase() !== query.toLowerCase()).slice(0, 3));
      } catch (error) {
        console.error('Live search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsDropdownOpen(false);
    }
  };

  const handleTrackClick = (track: Track) => {
    if (onTrackClick) {
      onTrackClick(track, liveResults);
    } else {
      playTrack(track, liveResults);
    }
    setIsDropdownOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-black sticky top-0 z-50 pt-safe">
      <div className="flex items-center space-x-2 hidden md:flex">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${canGoBack ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-black/20 text-zinc-600 cursor-not-allowed'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${canGoForward ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-black/20 text-zinc-600 cursor-not-allowed'}`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="hidden md:flex items-center space-x-4 w-full md:w-auto justify-end">
        <div className="relative w-full md:w-[400px]" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-full py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setLiveResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </form>

          {isDropdownOpen && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] rounded-xl shadow-2xl border border-zinc-800 overflow-hidden max-h-[80vh] overflow-y-auto flex flex-col py-2 z-50">
              {/* History Item */}
              <div
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 cursor-pointer group"
                onClick={() => handleSuggestionClick(query)}
              >
                <div className="flex items-center space-x-4 text-zinc-300">
                  <History size={20} className="text-zinc-400" />
                  <span className="text-[15px] font-medium text-blue-400">{query}</span>
                </div>
                <button
                  className="text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuery('');
                    setLiveResults([]);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Suggestions */}
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 px-4 py-3 hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search size={20} className="text-zinc-400" />
                  <span className="text-[15px] font-medium text-zinc-200">
                    {suggestion.toLowerCase().startsWith(query.toLowerCase()) ? (
                      <>
                        <span className="text-blue-400">{suggestion.substring(0, query.length)}</span>
                        {suggestion.substring(query.length)}
                      </>
                    ) : (
                      suggestion
                    )}
                  </span>
                </div>
              ))}

              <div className="h-px bg-zinc-800 my-2 mx-4" />

              {/* Live Results */}
              {isSearching ? (
                <div className="px-4 py-6 text-sm text-zinc-500 text-center">Searching...</div>
              ) : liveResults.length > 0 ? (
                liveResults.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => handleTrackClick(track)}
                    className="flex items-center px-4 py-2 hover:bg-zinc-800/80 cursor-pointer group"
                  >
                    <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded object-cover mr-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white text-[15px] font-medium truncate">{track.title}</p>
                        {index % 2 === 0 && (
                          <span className="bg-zinc-700 text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-300 flex-shrink-0">E</span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm truncate">
                        {track.itemType === 'artist' ? 'Artist' : track.itemType === 'playlist' ? 'Playlist' : `Track • ${track.artist}`}
                      </p>
                    </div>
                    <div className="px-2 relative" onClick={(e) => e.stopPropagation()}>
                      <TrackContextMenu track={track} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-zinc-500 text-center">No results found</div>
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => user ? setShowProfileMenu(!showProfileMenu) : setShowAuthModal(true)}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors flex-shrink-0"
          >
            {user ? (
              <span className="text-sm font-bold text-white uppercase">{user.email?.charAt(0) || 'U'}</span>
            ) : (
              <User size={16} className="text-zinc-300" />
            )}
          </button>

          {showProfileMenu && user && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-[#18181b] rounded-xl shadow-2xl border border-zinc-800 py-2 z-50">
              <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                <p className="text-sm text-white truncate font-medium">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    </header>
  );
}
