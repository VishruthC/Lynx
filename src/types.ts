export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  itemType?: 'song' | 'artist' | 'playlist' | 'album' | 'video';
  uploaderUrl?: string;
  trackCount?: number;
  albumId?: string;
  albumTitle?: string;
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
  banner?: string;
  description?: string;
  subscriberCount?: string;
  topTracks: Track[];
  albums: Track[]; // We can use Track type for albums too if they have id/title/thumbnail
  singles: Track[];
  videos: Track[];
  relatedArtists?: Track[];
}
