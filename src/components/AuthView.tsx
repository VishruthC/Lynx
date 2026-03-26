import React from 'react';
import AuthForm from './AuthForm';

interface AuthViewProps {
    onSuccess: () => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 md:py-24 animate-in fade-in duration-500">
            <div className="w-full max-w-md">
                <div className="glass-morphism liquid-glass-border rounded-[32px] overflow-hidden shadow-2xl relative">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-cyan-500/10 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/10 blur-[100px] pointer-events-none" />

                    <AuthForm onSuccess={onSuccess} />
                </div>
            </div>
        </div>
    );
}
