import React, { useState, useEffect } from 'react';
import { Plus, Search, Heart, Clock, Loader2, Music, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserPlaylists, getLikedSongs, createPlaylist, deletePlaylist, Playlist } from '../services/db';
import EditPlaylistModal from './EditPlaylistModal';

export default function PlaylistsView({ onPlaylistClick }: { onPlaylistClick?: (id: string, name: string) => void }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // Fetch liked songs once (or could be live too, but focusing on playlists for now)
      getLikedSongs(user.uid).then(likedData => {
        setLikedCount(likedData.length);
      });

      // Subscribe to playlists in real-time
      const unsubscribe = subscribeToUserPlaylists(user.uid, (playlistsData) => {
        setPlaylists(playlistsData);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setPlaylists([]);
      setLikedCount(0);
      setIsLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center max-w-md w-full">
          <Heart className="mx-auto text-zinc-500 mb-4 w-12 h-12" />
          <h3 className="text-xl font-bold text-white mb-2">Sign in to see your playlists</h3>
          <p className="text-zinc-400">Log in or create an account to save your favorite songs and custom playlists.</p>
        </div>
      </div>
    );
  }

  const handleCreatePlaylist = () => {
    if (!user) return;
    setIsCreateModalOpen(true);
  };

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
    <div className="px-4 md:px-8 pb-24 pt-4 md:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Playlists</h2>
        {user && (
          <button
            onClick={handleCreatePlaylist}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/30 hover:bg-zinc-800 px-4 py-2 md:py-2.5 rounded-full font-bold text-sm"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Create new playlist</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative mb-8 max-w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          placeholder="Filter playlists"
          className="w-full bg-zinc-900/30 border border-zinc-800/80 text-white rounded-md py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-cyan-400 w-8 h-8" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Liked Songs Card */}
          <div
            onClick={() => onPlaylistClick?.('liked', 'Liked Songs')}
            className="group relative aspect-square rounded-md bg-gradient-to-br from-zinc-500 to-zinc-800 p-4 md:p-6 flex flex-col justify-end cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-zinc-900/40 transition-all"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            <Heart className="text-white mb-3 md:mb-4 w-8 h-8 md:w-12 md:h-12 drop-shadow-md" fill="currentColor" />
            <h3 className="text-white font-bold text-lg md:text-2xl relative z-10">Liked Songs</h3>
            <p className="text-zinc-300 text-xs md:text-sm mt-1 relative z-10">{likedCount} tracks</p>
          </div>

          {/* User Playlists */}
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              onClick={() => onPlaylistClick?.(playlist.id, playlist.name)}
              onEdit={(e) => handleEditClick(playlist, e)}
              onDelete={(e) => handleDeletePlaylist(playlist.id, e)}
              title={playlist.name}
              creator={user.email?.split('@')[0] || 'User'}
              trackCount={`${playlist.tracks.length} TRACKS`}
              images={playlist.coverImage ? [playlist.coverImage] : []}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <EditPlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        initialName={`My Playlist #${playlists.length + 1}`}
        onCreate={async (name, desc) => {
          if (!user) return "";
          return await createPlaylist(user.uid, name, desc);
        }}
        onSave={(name, desc, newId) => {
          if (newId) {
            onPlaylistClick?.(newId, name);
          }
        }}
      />

      {/* Edit existing playlist modal */}
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

const PlaylistCard: React.FC<{
  title: string, creator: string, trackCount: string, images: string[],
  onClick?: () => void, onEdit?: (e: React.MouseEvent) => void, onDelete?: (e: React.MouseEvent) => void
}> = ({ title, creator, trackCount, images, onClick, onEdit, onDelete }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col gap-3 relative">
      <div className="relative">
        <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md shadow-lg bg-zinc-800 relative">
          {images.length > 0 ? (
            <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Music className="w-12 h-12 text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4 pointer-events-none">
            {/* We skip the large play button here to keep it simple, routing to detail page handles play anyway */}
          </div>
        </div>

        {/* Top Right Options Menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className={`p-2 rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black transition-all shadow-md backdrop-blur-md ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <MoreHorizontal size={20} />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute z-50 right-0 top-10 w-40 bg-[#282828] border border-zinc-700/80 rounded-md shadow-2xl py-1 overflow-hidden"
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
      </div>
      <div>
        <h3 className="text-white font-bold text-base truncate pr-2">{title}</h3>
        <p className="text-zinc-400 text-sm truncate">{creator}</p>
        <p className="text-zinc-500 text-[10px] font-bold mt-1 tracking-wider uppercase">{trackCount}</p>
      </div>
    </div>
  );
};
