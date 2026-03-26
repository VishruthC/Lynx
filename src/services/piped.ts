import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Track, Artist } from '../types';

export interface PipedStream {
  url: string;
  format: string;
  quality: string;
  mimeType: string;
  codec?: string;
  bitrate?: number;
}

const INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.smnz.de',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfau.lt'
];

async function fetchWithFallback(endpoint: string) {
  let lastError;
  const isAndroid = Capacitor.getPlatform() === 'android';

  for (const instance of INSTANCES) {
    try {
      const url = `${instance}${endpoint}`;

      if (isAndroid) {
        // Use CapacitorHttp to bypass CORS
        const response = await CapacitorHttp.get({ url });
        if (response.status === 200) {
          return response.data;
        }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) return data;
        }
      }
    } catch (e) {
      lastError = e;
      console.warn(`Failed fetching from ${instance}`, e);
    }
  }
  throw lastError || new Error('All Piped instances failed');
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    if (!query.trim()) return [];
    const data = await fetchWithFallback(`/opensearch/suggestions?query=${encodeURIComponent(query)}`);
    // Piped /opensearch/suggestions returns [query, [suggestions...]]
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      return data[1].slice(0, 5);
    }
    return [];
  } catch (error) {
    console.error("Suggestions error:", error);
    return [];
  }
}

export async function searchMusic(query: string, filter: string = 'all'): Promise<Track[]> {
  try {
    console.log("Searching for:", query, "with filter:", filter);

    // Map our UI filters to Piped filters
    const filterMap: Record<string, string> = {
      'all': 'all',
      'song': 'music_songs',
      'artist': 'music_artists',
      'playlist': 'music_playlists'
    };

    const pipedFilter = filterMap[filter] || 'all';
    const data = await fetchWithFallback(`/search?q=${encodeURIComponent(query)}&filter=${pipedFilter}`);

    if (!data || !data.items) {
      console.log("No items found in response");
      return [];
    }

    return data.items.map((item: any) => {
      if (item.type === 'channel') {
        return {
          id: item.url.split('/channel/')[1] || item.url.split('/user/')[1],
          title: item.name,
          artist: 'Artist',
          thumbnail: item.thumbnail,
          duration: 0,
          itemType: 'artist' as const,
          uploaderUrl: item.url
        };
      } else if (item.type === 'playlist') {
        const id = item.url.split('?list=')[1] || item.url.split('/playlists/')[1] || item.url.split('/playlist/')[1];
        return {
          id: id,
          title: item.name,
          artist: item.uploaderName || 'Unknown',
          thumbnail: item.thumbnail,
          duration: 0,
          itemType: 'playlist' as const,
          trackCount: item.videos
        };
      } else {
        // Assume stream/song
        return {
          id: item.url.split('?v=')[1],
          title: item.title,
          artist: item.uploaderName || 'Unknown Artist',
          thumbnail: item.thumbnail,
          duration: item.duration || 0,
          itemType: 'song' as const
        };
      }
    }).filter((t: any) => t.id); // Filter out any that didn't parse an ID
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function getPlaylistTracks(playlistId: string): Promise<{ title: string; uploader: string; thumbnail: string; tracks: Track[] }> {
  try {
    const data = await fetchWithFallback(`/playlists/${playlistId}`);

    const mapTracks = (streams: any[]) => (streams || []).map((item: any) => ({
      id: item.url.split('?v=')[1],
      title: item.title,
      artist: item.uploaderName || 'Unknown Artist',
      thumbnail: item.thumbnail,
      duration: item.duration || 0,
      itemType: 'song' as const
    })).filter((t: any) => t.id);

    let allTracks = mapTracks(data.relatedStreams);

    // Handle pagination if playlist is very long
    let nextpage = data.nextpage;
    // Safety limit to avoid infinite loops, but high enough (e.g. 5000 songs)
    let pageCount = 0;
    while (nextpage && pageCount < 50) {
      try {
        const nextData = await fetchWithFallback(`/nextpage/playlists/${playlistId}?nextpage=${encodeURIComponent(nextpage)}`);
        if (nextData && nextData.relatedStreams) {
          allTracks = [...allTracks, ...mapTracks(nextData.relatedStreams)];
          nextpage = nextData.nextpage;
          pageCount++;
        } else {
          nextpage = null;
        }
      } catch (e) {
        console.warn("Failed to fetch next page of playlist", e);
        nextpage = null;
      }
    }

    return {
      title: data.name || 'Public Playlist',
      uploader: data.uploader || 'YouTube',
      thumbnail: data.thumbnailUrl || (allTracks.length > 0 ? allTracks[0].thumbnail : ''),
      tracks: allTracks
    };
  } catch (error) {
    console.error("Playlist tracks error:", error);
    return { title: 'Unknown Playlist', uploader: '', thumbnail: '', tracks: [] };
  }
}

const formatSubscribers = (count: any) => {
  if (!count || count === -1 || count === "-1") return undefined;
  return count.toString();
};

const cleanName = (name: string) => name?.replace(/ - Topic$/, '');

export async function getArtistDetails(channelId: string): Promise<Artist> {
  try {
    const data = await fetchWithFallback(`/artists/${channelId}`);

    const mapTrack = (item: any) => ({
      id: item.url.split('?v=')[1],
      title: item.title,
      artist: cleanName(item.uploaderName || data.name),
      thumbnail: item.thumbnail || data.avatarUrl,
      duration: item.duration || 0,
      itemType: (item.type === 'video' ? 'video' : 'song') as any
    });


    const mapAlbum = (item: any) => ({
      id: item.url.split('?list=')[1] || item.url.split('/playlists/')[1] || item.url.split('/playlist/')[1],
      title: item.name,
      artist: cleanName(data.name),
      thumbnail: item.thumbnail || data.avatarUrl,
      duration: 0,
      itemType: 'album' as any,
      trackCount: item.videos
    });

    const artistDetails: Artist = {
      id: channelId,
      name: cleanName(data.name),
      thumbnail: data.avatarUrl,
      banner: data.bannerUrl,
      description: data.description,
      subscriberCount: formatSubscribers(data.subscriberCount),
      topTracks: (data.topTracks || []).map(mapTrack),
      albums: (data.albums || []).map(mapAlbum),
      singles: (data.singleEPs || []).map(mapAlbum),
      videos: (data.videos || []).map(mapTrack),
      relatedArtists: (data.relatedArtists || []).map((a: any) => ({
        id: a.url.split('/channel/')[1] || a.url.split('/artists/')[1] || a.url.split('/artist/')[1],
        title: a.name,
        thumbnail: a.thumbnail,
        artist: 'Artist',
        duration: 0,
        itemType: 'artist' as any
      }))
    };

    // Fill in missing albums/singles with search if needed
    if (artistDetails.albums.length === 0) {
      try {
        const searchRes = await searchMusic(`${data.name} albums`, 'playlist');
        artistDetails.albums = searchRes.map(t => ({ ...t, itemType: 'album' as any }));
      } catch (e) {
        console.warn("Failed to fetch albums via search", e);
      }
    }
    if (artistDetails.singles.length === 0) {
      try {
        const searchRes = await searchMusic(`${data.name} singles`, 'playlist');
        artistDetails.singles = searchRes.map(t => ({ ...t, itemType: 'album' as any }));
      } catch (e) {
        console.warn("Failed to fetch singles via search", e);
      }
    }

    return artistDetails;
  } catch (error) {
    console.error("Artist details error:", error);
    // Fallback to channel if artist endpoint fails
    try {
      const data = await fetchWithFallback(`/channel/${channelId}`);
      const artistDetails: Artist = {
        id: channelId,
        name: cleanName(data.name),
        thumbnail: data.avatarUrl,
        banner: data.bannerUrl,
        description: data.description,
        subscriberCount: formatSubscribers(data.subscriberCount),
        topTracks: (data.relatedStreams || []).map((item: any) => ({
          id: item.url.split('?v=')[1],
          title: item.title,
          artist: cleanName(data.name),
          thumbnail: item.thumbnail || data.avatarUrl,
          duration: item.duration || 0,
          itemType: 'song' as any
        })),
        albums: [],
        singles: [],
        videos: [],
        relatedArtists: []
      };

      // Search for albums and singles as they won't be in the channel call
      try {
        const albumSearch = await searchMusic(`${data.name} albums`, 'playlist');
        artistDetails.albums = albumSearch.map(t => ({ ...t, itemType: 'album' as any }));

        const singleSearch = await searchMusic(`${data.name} singles`, 'playlist');
        artistDetails.singles = singleSearch.map(t => ({ ...t, itemType: 'album' as any }));
      } catch (e) {
        console.warn("Fallback search failed", e);
      }

      return artistDetails;
    } catch (e) {
      console.error("Total artist fetch failure", e);
      throw error;
    }
  }
}

export async function getStreamUrl(videoId: string): Promise<string> {
  try {
    const data = await fetchWithFallback(`/streams/${videoId}`);
    // Prefer M4A/Aac/Webm audio formats
    const audioStreams = data.audioStreams || [];
    const bestAudio = audioStreams.find((s: any) => s.mimeType.includes('audio/mp4') || s.mimeType.includes('audio/webm')) || audioStreams[0];

    if (bestAudio && bestAudio.url) {
      return bestAudio.url;
    }
    throw new Error('No audio streams found');
  } catch (error) {
    console.error("Stream fetch error:", error);
    throw error;
  }
}
