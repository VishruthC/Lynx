import React from 'react';
import { ListMusic, Disc, Music, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LibraryView({ onViewChange }: { onViewChange: (view: string) => void }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="px-4 md:px-8 flex items-center justify-center min-h-[60vh] pt-safe">
        <div className="glass-morphism liquid-glass-border rounded-[32px] p-10 text-center max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListMusic className="text-cyan-400 w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Sign in to see your library</h3>
          <p className="text-zinc-400 mb-8 leading-relaxed">Log in or create an account to save your favorite songs and custom playlists across all your devices.</p>
          <button
            onClick={() => onViewChange('auth')}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-24 pt-4 md:pt-8">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-8">Library</h2>

      <div className="flex flex-col max-w-3xl">
        <LibraryItem icon={<ListMusic size={28} strokeWidth={1.5} />} title="Playlists" onClick={() => onViewChange('playlists')} />
        <LibraryItem icon={<Disc size={28} strokeWidth={1.5} />} title="Albums" onClick={() => onViewChange('albums')} />
        <LibraryItem icon={<Music size={28} strokeWidth={1.5} />} title="Songs" onClick={() => onViewChange('songs')} />
      </div>
    </div>
  );
}

function LibraryItem({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between py-6 group hover:bg-zinc-900/50 transition-colors px-2 -mx-2 rounded-lg w-full text-left"
    >
      <div className="flex items-center space-x-6">
        <div className="text-white">
          {icon}
        </div>
        <span className="text-white font-bold text-xl">{title}</span>
      </div>
      <ChevronRight size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
    </button>
  );
}
