import React from 'react';
import { Home, Compass, Library, Search, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string, query?: string, title?: string) => void;
}

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <div className="h-16 flex items-center justify-around px-2">
      <NavItem icon={<Home size={22} />} label="Home" active={currentView === 'home'} onClick={() => onViewChange('home', 'top hits 2024', 'Top Hits')} />
      <NavItem icon={<Compass size={22} />} label="Explore" active={currentView === 'explore'} onClick={() => onViewChange('explore')} />
      <NavItem icon={<Search size={22} />} label="Search" active={currentView === 'search'} onClick={() => onViewChange('search')} />
      <NavItem icon={<Library size={22} />} label="Library" active={['library', 'songs', 'albums', 'playlists'].includes(currentView)} onClick={() => onViewChange('library')} />
      <NavItem icon={<User size={22} />} label="Profile" active={currentView === 'profile'} onClick={() => onViewChange('profile')} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-full relative transition-all ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {active && <div className="absolute inset-0 active-nav-bg rounded-full -z-10" />}
      {icon}
    </button>
  );
}
