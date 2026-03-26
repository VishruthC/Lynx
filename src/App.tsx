import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Player, { MiniPlayerContent } from './components/Player';
import TrackList from './components/TrackList';
import BottomNav from './components/BottomNav';
import LibraryView from './components/LibraryView';
import PlaylistsView from './components/PlaylistsView';
import ExploreView from './components/ExploreView';
import PlaylistDetailView from './components/PlaylistDetailView';
import ArtistDetailView from './components/ArtistDetailView';
import SongsView from './components/SongsView';
import SearchView from './components/SearchView';
import ProfileView from './components/ProfileView';
import EditPlaylistModal from './components/EditPlaylistModal';
import AuthView from './components/AuthView';
import MarqueeText from './components/MarqueeText';
import { searchMusic } from './services/piped';
import { Track } from './types';
import { Loader2, Heart, Clock, ListMusic, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { getLikedSongs, subscribeToUserPlaylists, deletePlaylist, Playlist } from './services/db';

type HistoryEntry = { view: string, query?: string, title?: string };

import { extractPlaylistId } from './utils/url';

function MobileNavigationOverlay({ currentView, onViewChange }: { currentView: string, onViewChange: any }) {
  const { currentTrack } = usePlayer();

  return (
    <div className="md:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 pointer-events-none flex justify-center">
      <div className="glass-morphism liquid-glass-border rounded-[32px] flex flex-col pointer-events-auto shadow-2xl w-full">
        {currentTrack && (
          <>
            <MiniPlayerContent />
            <div className="h-[1px] bg-white/5 mx-4" />
          </>
        )}
        <BottomNav currentView={currentView} onViewChange={onViewChange} />
      </div>
    </div>
  );
}

function MainApp() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('all');

  const [history, setHistory] = useState<HistoryEntry[]>([{ view: 'home', query: 'top hits 2024', title: 'Top Hits' }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Initial history state if none exists
    if (!window.history.state || typeof window.history.state.index !== 'number') {
      window.history.replaceState({ index: 0 }, "", "");
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.index === 'number') {
        setCurrentIndex(event.state.index);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { user } = useAuth();
  const { currentTrack, playTrack, isNowPlayingOpen, setIsNowPlayingOpen } = usePlayer();

  useEffect(() => {
    // Handle Capacitor back button for Android
    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', () => {
          if (isNowPlayingOpen) {
            setIsNowPlayingOpen(false);
            return;
          }
          if (currentIndex > 0) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        return listener;
      } catch (e) {
        // Non-capacitor environment
      }
    };

    const listenerPromise = setupBackButton();
    return () => {
      listenerPromise.then(l => l?.remove());
    };
  }, [currentIndex, isNowPlayingOpen, setIsNowPlayingOpen]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const currentEntry = history[currentIndex];
  const currentView = currentEntry.view;
  const title = currentEntry.title || 'Home';

  useEffect(() => {
    if (user) {
      getLikedSongs(user.uid).then(songs => setLikedCount(songs.length));
      const unsubscribe = subscribeToUserPlaylists(user.uid, setPlaylists);
      return () => unsubscribe();
    } else {
      setLikedCount(0);
      setPlaylists([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchCurrentView = async () => {
      if (currentEntry.view === 'home' && currentEntry.query) {
        setIsLoading(true);
        try {
          const results = await searchMusic(currentEntry.query, searchFilter);
          setTracks(results);
        } catch (error) {
          console.error('Search failed:', error);
          setTracks([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchCurrentView();
  }, [currentEntry.view, currentEntry.query, searchFilter]);

  const pushView = (view: string, query?: string, title?: string) => {
    if (currentEntry.view === view && currentEntry.query === query) return;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push({ view, query, title });
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setCurrentIndex(newIndex);
    window.history.pushState({ index: newIndex }, "", "");
  };

  const handleSearch = (query: string) => {
    setSearchFilter('all');

    // Check if it's a playlist URL or ID
    const playlistId = extractPlaylistId(query);
    if (playlistId) {
      pushView('playlist', playlistId, 'YouTube Playlist');
      return;
    }

    const newTitle = query === 'top hits 2024' ? 'Top Hits' : `Search Results for "${query}"`;
    pushView('home', query, newTitle);
  };

  const goBack = () => {
    if (currentIndex > 0) window.history.back();
  };

  const goForward = () => {
    if (currentIndex < history.length - 1) window.history.forward();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEditClick = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlaylist(playlist);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Hidden on Mobile */}
        <Sidebar currentView={currentView} onViewChange={(v, q, t) => pushView(v, q, t)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {window.innerWidth >= 768 && (
            <TopBar
              onSearch={handleSearch}
              onBack={goBack}
              onForward={goForward}
              canGoBack={currentIndex > 0}
              canGoForward={currentIndex < history.length - 1}
              onTrackClick={(track, results) => {
                if (track.itemType === 'artist') {
                  pushView('artist', track.id, track.title);
                } else if (track.itemType === 'playlist') {
                  pushView('playlist', track.id, track.title);
                } else {
                  playTrack(track, results);
                }
              }}
            />
          )}

          <main className="flex-1 overflow-y-auto bg-black scroll-smooth">
            <div className={`px-0 md:px-0 ${currentTrack ? 'pb-[calc(14rem+env(safe-area-inset-bottom,0px))] md:pb-40' : 'pb-[calc(10rem+env(safe-area-inset-bottom,0px))] md:pb-8'}`}>
              {currentView === 'library' ? (
                <LibraryView onViewChange={pushView} />
              ) : currentView === 'playlists' ? (
                <PlaylistsView onPlaylistClick={(id, title) => pushView('playlist', id, title)} />
              ) : currentView === 'playlist' && currentEntry.query ? (
                <PlaylistDetailView
                  playlistId={currentEntry.query}
                  onViewChange={pushView}
                />
              ) : currentView === 'songs' ? (
                <SongsView />
              ) : currentView === 'albums' ? (
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 tracking-tight">Albums</h2>
                  <div className="text-center text-zinc-500 mt-20">
                    <p className="text-lg">Your albums will appear here.</p>
                  </div>
                </div>
              ) : currentView === 'explore' ? (
                <ExploreView
                  onPlaylistClick={(id, name) => pushView('playlist', id, name)}
                  onArtistClick={(id, name) => pushView('artist', id, name)}
                  onSearch={handleSearch}
                />
              ) : currentView === 'artist' ? (
                <ArtistDetailView
                  artistId={currentEntry.query || ''}
                  onArtistClick={(id, name) => pushView('artist', id, name)}
                  onAlbumClick={(id, name) => pushView('playlist', id, name)}
                />
              ) : currentView === 'search' ? (
                <SearchView
                  onSearch={handleSearch}
                  onClose={() => goBack()}
                  onTrackClick={(track, results) => {
                    if (track.itemType === 'artist') {
                      pushView('artist', track.id, track.title);
                    } else if (track.itemType === 'playlist') {
                      pushView('playlist', track.id, track.title);
                    } else {
                      playTrack(track, results);
                    }
                  }}
                />
              ) : currentView === 'profile' ? (
                <ProfileView onViewChange={pushView} />
              ) : currentView === 'auth' ? (
                <AuthView onSuccess={() => pushView('home', 'top hits 2024', 'Top Hits')} />
              ) : (
                <div className="px-4 md:px-8 pt-4 md:pt-8">
                  {/* Home Playlists */}
                  {title === 'Top Hits' && (
                    <div className="mb-8 md:mb-10">
                      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 tracking-tight">{greeting}</h2>
                      {!user ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto">
                          <h3 className="text-xl font-bold text-white mb-2">Sign in to see your library</h3>
                          <p className="text-zinc-400">Log in or create an account to save your favorite songs and custom playlists.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                          <HomePlaylistCard
                            title={`Liked Songs (${likedCount})`}
                            image={<div className="w-full h-full bg-gradient-to-br from-zinc-500 to-zinc-800 flex items-center justify-center"><Heart className="text-white w-5 h-5 md:w-6 md:h-6" fill="currentColor" /></div>}
                            onClick={() => pushView('playlist', 'liked', 'Liked Songs')}
                          />
                          {playlists.map(p => (
                            <HomePlaylistCard
                              key={p.id}
                              title={p.name}
                              image={
                                p.coverImage ? (
                                  <img src={p.coverImage} className="w-full h-full object-cover" alt={p.name} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center"><ListMusic className="text-white/80 w-5 h-5 md:w-6 md:h-6" /></div>
                                )
                              }
                              onClick={() => pushView('playlist', p.id, p.name)}
                              onEdit={(e) => handleEditClick(p, e)}
                              onDelete={(e) => handleDeletePlaylist(p.id, e)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 px-4 md:px-8">
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">{title}</h2>
                    {currentEntry.query && currentEntry.query !== 'top hits 2024' && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['all', 'song', 'playlist', 'artist'].map(f => (
                          <button
                            key={f}
                            onClick={() => setSearchFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${searchFilter === f ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}{f === 'all' ? '' : 's'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 size={40} className="animate-spin text-cyan-400" />
                    </div>
                  ) : tracks.length > 0 ? (
                    <TrackList
                      tracks={tracks}
                      onTrackClick={(track) => {
                        if (track.itemType === 'playlist') {
                          pushView('playlist', track.id, track.title);
                        } else if (track.itemType === 'artist') {
                          pushView('artist', track.id, track.title);
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center text-zinc-500 mt-20">
                      <p className="text-lg">No tracks found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Player />
      <MobileNavigationOverlay currentView={currentView} onViewChange={(v: string, q?: string, t?: string) => pushView(v, q, t)} />

      {editingPlaylist && (
        <EditPlaylistModal
          isOpen={true}
          onClose={() => setEditingPlaylist(null)}
          playlistId={editingPlaylist.id}
          initialName={editingPlaylist.name}
          initialDescription={editingPlaylist.description}
          onSave={(newName, newDesc) => {
            setPlaylists(prev => prev.map(p => p.id === editingPlaylist.id ? { ...p, name: newName, description: newDesc } : p));
          }}
        />
      )}
    </div>
  );
}

const HomePlaylistCard: React.FC<{
  title: string, image: React.ReactNode, onClick?: () => void,
  onEdit?: (e: React.MouseEvent) => void, onDelete?: (e: React.MouseEvent) => void
}> = ({ title, image, onClick, onEdit, onDelete }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div
      onClick={onClick}
      className="group flex items-center bg-zinc-800/40 hover:bg-zinc-800/80 transition-colors rounded-md cursor-pointer relative"
    >
      <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 shadow-lg relative overflow-hidden rounded-l-md">
        {image}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <MarqueeText className="font-bold text-sm md:text-base flex-1 px-3 md:px-4">
        {title}
      </MarqueeText>

      {/* Top Right Options Menu */}
      {(onEdit || onDelete) && (
        <div className="relative pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className={`p-1.5 md:p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <MoreHorizontal size={20} />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute z-50 right-0 top-8 w-40 bg-[#282828] border border-zinc-700/80 rounded-md shadow-2xl py-1 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  setIsDropdownOpen(false);
                  onEdit?.(e);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left"
              >
                <Edit2 size={16} />
                <span>Edit details</span>
              </button>
              <button
                onClick={(e) => {
                  setIsDropdownOpen(false);
                  onDelete?.(e);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-zinc-700/50 transition-colors text-left"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </AuthProvider>
  );
}
