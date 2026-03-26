import React from 'react';
import { User, LogOut, ChevronRight, Settings, Heart, ListMusic, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileViewProps {
    onViewChange: (view: string, query?: string, title?: string) => void;
}

export default function ProfileView({ onViewChange }: ProfileViewProps) {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center pt-safe min-h-[70vh]">
                <div className="glass-morphism liquid-glass-border rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                        <User size={48} className="text-cyan-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">My Profile</h2>
                    <p className="text-zinc-400 mb-10 leading-relaxed text-lg">Sign in to sync your library across devices and save your favorite songs.</p>
                    <button
                        onClick={() => onViewChange('auth')}
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl text-lg"
                    >
                        Log In / Sign Up
                    </button>
                </div>
            </div>
        );
    }

    const menuItems = [
        { icon: <Heart size={20} />, label: 'Liked Songs', onClick: () => onViewChange('playlist', 'liked', 'Liked Songs') },
        { icon: <ListMusic size={20} />, label: 'Your Playlists', onClick: () => onViewChange('playlists') },
        { icon: <History size={20} />, label: 'Recently Played', onClick: () => onViewChange('home', 'top hits 2024', 'Top Hits') }, // Fallback for now
        { icon: <Settings size={20} />, label: 'Settings', onClick: () => { } },
    ];

    return (
        <div className="flex flex-col h-full bg-black pb-safe pt-4 md:pt-8 overflow-y-auto">
            <div className="px-4 flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/10">
                    <span className="text-3xl font-bold text-white uppercase">{user.email?.charAt(0) || 'U'}</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-1 truncate max-w-full">{user.email?.split('@')[0]}</h2>
                <p className="text-zinc-500 text-sm mb-6">{user.email}</p>

                <div className="w-full h-px bg-zinc-900 mb-6" />

                <div className="w-full space-y-2">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.onClick}
                            className="w-full flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-600" />
                        </button>
                    ))}
                </div>

                <div className="w-full mt-8">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-3 p-4 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors font-medium border border-red-500/10"
                    >
                        <LogOut size={20} />
                        <span>Log out</span>
                    </button>
                </div>
            </div>

            <div className="mt-auto px-4 py-8 text-center">
                <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase">LYNX v0.1.0</p>
                <p className="text-[10px] text-zinc-700 mt-1">Made with ❤️ for music lovers</p>
            </div>
        </div>
    );
}
