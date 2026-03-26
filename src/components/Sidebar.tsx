import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, Library, ListMusic, Heart, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserPlaylists, deletePlaylist, Playlist } from '../services/db';
import EditPlaylistModal from './EditPlaylistModal';
import MarqueeText from './MarqueeText';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string, query?: string, title?: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // For Edit Modal
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserPlaylists(user.uid, setPlaylists);
      return () => unsubscribe();
    } else {
      setPlaylists([]);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    }
  };

  const handleEditClick = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    setEditingPlaylist(playlist);
  };

  return (
    <div className="hidden md:flex w-64 bg-black flex-col h-full border-r border-zinc-900">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tighter text-white">LYNX<span className="text-cyan-400">.</span></h1>
      </div>

      <nav className="flex-1 px-4 space-y-8">
        <div>
          <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Menu</p>
          <div className="space-y-1">
            <NavItem icon={<Home size={20} />} label="Home" active={currentView === 'home'} onClick={() => onViewChange('home', 'top hits 2024', 'Top Hits')} />
            <NavItem icon={<Compass size={20} />} label="Explore" active={currentView === 'explore'} onClick={() => onViewChange('explore')} />

            <div className="relative group">
              <NavItem
                icon={<Library size={20} />}
                label="Library"
                active={['library', 'songs', 'albums', 'playlists'].includes(currentView)}
              />

              {/* Hover Dropdown */}
              <div className="absolute left-full top-0 pl-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 group-hover:delay-0 delay-150">
                <div className="bg-zinc-900 border border-zinc-800 rounded-md shadow-xl w-40 overflow-hidden py-1">
                  <button onClick={() => onViewChange('songs')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Songs</button>
                  <button onClick={() => onViewChange('albums')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Albums</button>
                  <button onClick={() => onViewChange('playlists')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Playlists</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Playlists</p>
          <div className="space-y-1">
            <NavItem icon={<Heart size={20} />} label="Liked Songs" onClick={() => onViewChange('playlist', 'liked', 'Liked Songs')} />
            {playlists.map(p => (
              <div key={p.id} className="relative group/nav flex items-center">
                <div className="flex-1 min-w-0">
                  <NavItem
                    icon={<ListMusic size={20} />}
                    label={p.name}
                    onClick={() => onViewChange('playlist', p.id, p.name)}
                  />
                </div>

                {/* 3-Dot Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                  }}
                  className={`absolute right-2 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ${openDropdownId === p.id ? 'opacity-100 flex' : 'opacity-0 hidden group-hover/nav:flex'}`}
                >
                  <MoreHorizontal size={16} />
                </button>

                {/* Dropdown Menu */}
                {openDropdownId === p.id && (
                  <div
                    className="absolute z-50 right-2 top-10 w-40 bg-[#282828] border border-zinc-700 rounded-md shadow-2xl py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleEditClick(e, p)}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-left"
                    >
                      <Edit2 size={16} />
                      <span>Edit details</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-700/50 transition-colors text-left"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!user && (
              <div className="px-5 py-2 text-xs text-zinc-500 italic">Sign in to see playlists</div>
            )}
          </div>
        </div>
      </nav>

      {editingPlaylist && (
        <EditPlaylistModal
          isOpen={true}
          onClose={() => setEditingPlaylist(null)}
          playlistId={editingPlaylist.id}
          initialName={editingPlaylist.name}
          initialDescription={editingPlaylist.description}
          onSave={(newName, newDesc) => {
            setPlaylists(prev => prev.map(p => p.id === editingPlaylist.id ? { ...p, name: newName, description: newDesc } : p));
            // Also notify the parent App router to update title if needed
            if (currentView === 'playlist') {
              // we can't easily pushView the exact query without App.tsx props, but App context handles it
            }
          }}
        />
      )}
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-2 py-2 rounded-md transition-colors text-left ${active ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'}`}
    >
      {icon}
      <MarqueeText className="font-medium text-sm flex-1 text-left">
        {label}
      </MarqueeText>
    </button>
  );
};
