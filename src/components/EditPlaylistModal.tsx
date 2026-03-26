import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, Edit2 } from 'lucide-react';
import { updatePlaylistDetails } from '../services/db';

interface EditPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlistId?: string;
    initialName?: string;
    initialDescription?: string;
    initialImage?: string;
    mode?: 'create' | 'edit';
    onCreate?: (name: string, desc: string) => Promise<string>;
    onSave?: (newName: string, newDesc?: string, newId?: string) => void;
}

export default function EditPlaylistModal({
    isOpen, onClose, playlistId, initialName = '', initialDescription = '', initialImage, mode = 'edit', onCreate, onSave
}: EditPlaylistModalProps) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setDescription(initialDescription || '');
        }
    }, [isOpen, initialName, initialDescription]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            if (mode === 'create' && onCreate) {
                const newId = await onCreate(name, description);
                onSave?.(name, description, newId);
            } else if (playlistId) {
                await updatePlaylistDetails(playlistId, { name, description });
                onSave?.(name, description, playlistId);
            }
            onClose();
        } catch (e) {
            console.error(e);
            alert(mode === 'create' ? "Failed to create playlist" : "Failed to update playlist details");
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
            <div
                className="bg-[#282828] w-full max-w-[524px] rounded-lg shadow-2xl flex flex-col font-sans relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-2xl font-bold text-white">{mode === 'create' ? 'Create playlist' : 'Edit details'}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-700/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col sm:flex-row gap-4 px-6 pb-6">
                    {/* Image Upload Area */}
                    <div className="w-48 h-48 bg-[#282828] shadow-[0_4px_60px_rgba(0,0,0,0.5)] flex-shrink-0 group relative cursor-pointer rounded-md overflow-hidden flex items-center justify-center">
                        {initialImage ? (
                            <img src={initialImage} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                            <Music className="w-16 h-16 text-zinc-500" />
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Edit2 className="text-white w-10 h-10" />
                            <span className="text-white text-sm font-medium">Choose photo</span>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="flex flex-col flex-1 gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Name"
                                className="w-full bg-[#3E3E3E] text-white rounded-[4px] px-3 pt-5 pb-2 text-sm focus:outline-none focus:bg-[#4E4E4E] border-none peer placeholder-transparent"
                            />
                            <label className="absolute left-3 top-1.5 text-[10px] font-bold text-white/70 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-white/50 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-white/70 cursor-text">
                                Name
                            </label>
                        </div>

                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add an optional description"
                            className="w-full bg-[#3E3E3E] text-white rounded-[4px] p-3 text-sm focus:outline-none focus:bg-[#4E4E4E] border-none resize-none h-[100px]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 pb-6 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || isSaving}
                        className="bg-white text-black font-bold py-2 px-8 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <p className="text-[11px] font-bold text-white/80">
                        By proceeding, you agree to give Lynx access to the image you choose to upload. Please make sure you have the right to upload the image.
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
