import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
    onSuccess?: () => void;
    isPopup?: boolean;
}

export default function AuthForm({ onSuccess, isPopup = false }: AuthFormProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup, error, setError } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            onSuccess?.();
        } catch (err) {
            // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setEmail('');
        setPassword('');
    };

    return (
        <div className={`p-6 md:p-8 ${!isPopup ? 'w-full max-w-md mx-auto' : ''}`}>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Join Lynx'}
                </h2>
                <p className="text-zinc-400 mt-2">
                    {isLogin ? 'Sign in to access your library and favorites.' : 'Create an account to save your favorite music.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-zinc-400 mb-1.5 block">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 transition-all outline-none"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-zinc-400 mb-1.5 block">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 transition-all outline-none"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold rounded-xl py-3.5 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:hover:scale-100"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        isLogin ? 'Sign In' : 'Create Account'
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-zinc-500 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={toggleMode}
                        className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors focus:outline-none"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
