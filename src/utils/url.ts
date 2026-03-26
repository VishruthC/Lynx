/**
 * Extracts a YouTube/Piped playlist ID from a URL or returns the input if it's already an ID.
 */
export function extractPlaylistId(input: string): string | null {
    if (!input) return null;

    // Clean the input
    const text = input.trim();

    try {
        const url = new URL(text);

        // YouTube / YouTube Music
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            return url.searchParams.get('list');
        }

        // Piped
        if (url.pathname.includes('/playlists/')) {
            return url.pathname.split('/playlists/')[1]?.split('?')[0];
        }
        if (url.pathname.includes('/playlist/')) {
            return url.pathname.split('/playlist/')[1]?.split('?')[0];
        }
    } catch (e) {
        // Not a URL, check if it's a playlist ID pattern
        // YouTube playlist IDs usually start with PL, RD, UU, LL, etc.
        const playlistPattern = /^(PL|RD|UU|LL|LM|OL|MC)[\w-]{10,}/;
        if (playlistPattern.test(text)) {
            return text;
        }
    }

    return null;
}
