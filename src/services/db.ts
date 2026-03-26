import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Track } from '../types';

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: any;
    tracks: Track[];
    coverImage?: string;
    originalId?: string;
}

// -----------------------------------------------------
// LIKED SONGS
// -----------------------------------------------------

/** Adds a track to the user's Liked Songs document */
export async function toggleLikedSong(userId: string, track: Track) {
    const likedSongsRef = doc(db, 'users', userId, 'library', 'likedSongs');
    const snap = await getDoc(likedSongsRef);

    if (!snap.exists()) {
        // Create the likedSongs doc if it doesn't exist
        await setDoc(likedSongsRef, {
            tracks: [track],
            updatedAt: serverTimestamp()
        });
        return true; // Added
    }

    const data = snap.data();
    const tracks: Track[] = data.tracks || [];
    const existsIndex = tracks.findIndex(t => t.id === track.id);

    if (existsIndex > -1) {
        // Remove track
        tracks.splice(existsIndex, 1);
        await updateDoc(likedSongsRef, { tracks, updatedAt: serverTimestamp() });
        return false; // Removed
    } else {
        // Add track
        tracks.push(track);
        await updateDoc(likedSongsRef, { tracks, updatedAt: serverTimestamp() });
        return true; // Added
    }
}

/** Explicitly removes a track from the user's Liked Songs document */
export async function removeSongFromLibrary(userId: string, trackId: string) {
    const likedSongsRef = doc(db, 'users', userId, 'library', 'likedSongs');
    const snap = await getDoc(likedSongsRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const tracks: Track[] = data.tracks || [];
    const existsIndex = tracks.findIndex(t => t.id === trackId);

    if (existsIndex > -1) {
        tracks.splice(existsIndex, 1);
        await updateDoc(likedSongsRef, { tracks, updatedAt: serverTimestamp() });
    }
}

/** Fetches all Liked Songs for a user */
export async function getLikedSongs(userId: string): Promise<Track[]> {
    const likedSongsRef = doc(db, 'users', userId, 'library', 'likedSongs');
    const snap = await getDoc(likedSongsRef);
    if (!snap.exists()) return [];
    return snap.data().tracks || [];
}

/** Checks if a specific track is liked */
export async function isSongLiked(userId: string, trackId: string): Promise<boolean> {
    const likedSongsRef = doc(db, 'users', userId, 'library', 'likedSongs');
    const snap = await getDoc(likedSongsRef);
    if (!snap.exists()) return false;
    const tracks: Track[] = snap.data().tracks || [];
    return tracks.some(t => t.id === trackId);
}

// -----------------------------------------------------
// PLAYLISTS
// -----------------------------------------------------

/** Creates a new playlist for the user */
export async function createPlaylist(userId: string, name: string, description?: string): Promise<string> {
    const newPlaylistRef = doc(collection(db, 'playlists'));
    await setDoc(newPlaylistRef, {
        id: newPlaylistRef.id,
        name,
        description: description || '',
        userId,
        createdAt: serverTimestamp(),
        tracks: []
    });
    return newPlaylistRef.id;
}

/** Fetches a single playlist by ID */
export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
    const snap = await getDoc(doc(db, 'playlists', playlistId));
    if (!snap.exists()) return null;
    return snap.data() as Playlist;
}

/** Updates a playlist's details (name, description) */
export async function updatePlaylistDetails(playlistId: string, updates: { name: string; description?: string }) {
    const playlistRef = doc(db, 'playlists', playlistId);
    await updateDoc(playlistRef, updates);
}

/** Fetches all playlists owned by a user once */
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
    const q = query(collection(db, 'playlists'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const playlists: Playlist[] = [];
    snap.forEach(doc => playlists.push(doc.data() as Playlist));
    return playlists;
}

/** Subscribes to all playlists owned by a user (real-time) */
export function subscribeToUserPlaylists(userId: string, callback: (playlists: Playlist[]) => void) {
    const q = query(collection(db, 'playlists'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
        const playlists: Playlist[] = [];
        snap.forEach(doc => playlists.push(doc.data() as Playlist));
        callback(playlists);
    });
}

/** Adds a track to a specific playlist, preventing duplicates by ID */
export async function addSongToPlaylist(playlistId: string, track: Track) {
    const playlistRef = doc(db, 'playlists', playlistId);
    const snap = await getDoc(playlistRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const tracks: Track[] = data.tracks || [];

    // Check if song already exists
    if (tracks.some(t => t.id === track.id)) return;

    await updateDoc(playlistRef, {
        tracks: arrayUnion(track),
        coverImage: track.thumbnail
    });
}

/** Removes a track from a specific playlist */
export async function removeSongFromPlaylist(playlistId: string, trackId: string) {
    const playlistRef = doc(db, 'playlists', playlistId);
    const snap = await getDoc(playlistRef);
    if (!snap.exists()) return;
    const data = snap.data();
    let tracks: Track[] = data.tracks || [];
    tracks = tracks.filter(t => t.id !== trackId);
    await updateDoc(playlistRef, { tracks });
}

/** Deletes a playlist */
export async function deletePlaylist(playlistId: string) {
    await deleteDoc(doc(db, 'playlists', playlistId));
}

/** Saves an external playlist to the user's account, preventing redundant saves */
export async function saveExternalPlaylist(userId: string, title: string, tracks: Track[], originalId: string, thumbnail?: string) {
    // Check if already saved
    const q = query(collection(db, 'playlists'), where('userId', '==', userId), where('originalId', '==', originalId));
    const snap = await getDocs(q);
    if (!snap.empty) {
        return snap.docs[0].id; // Return existing
    }

    const newPlaylistRef = doc(collection(db, 'playlists'));
    await setDoc(newPlaylistRef, {
        id: newPlaylistRef.id,
        name: title,
        description: 'Saved YouTube Playlist',
        userId,
        createdAt: serverTimestamp(),
        tracks: tracks,
        originalId,
        coverImage: thumbnail || (tracks.length > 0 ? tracks[0].thumbnail : undefined)
    });
    return newPlaylistRef.id;
}
