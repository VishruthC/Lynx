import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import AuthForm from './AuthForm';

interface AuthModalProps {
    onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with heavy blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal Container with Liquid Glass Styling */}
            <div className="glass-morphism liquid-glass-border rounded-[32px] w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <AuthForm onSuccess={onClose} isPopup={true} />
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
