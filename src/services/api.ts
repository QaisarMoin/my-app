import { Song, SearchResponse, SongDetailResponse, Artist, SearchArtistResponse } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

export function getBestImage(images: any): string {
  if (!images) return '';
  if (typeof images === 'string') return images;
  if (Array.isArray(images)) {
      if (images.length === 0) return '';
      // Try to get highest quality (500x500 or last item)
      const high = images.find((img: any) => img.quality === '500x500');
      return high ? high.url : images[images.length - 1]?.url || '';
  }
  return '';
}

export function getBestDownloadUrl(urls: { quality: string; url: string }[]): string {
  if (!urls || urls.length === 0) return '';
  // Prefer 320kbps
  const hq = urls.find(u => u.quality === '320kbps');
  return hq ? hq.url : urls[urls.length - 1]?.url || '';
}

// Helper to normalize song data from API
function normalizeSong(item: any): Song {
  return {
    id: item.id,
    name: item.name,
    duration: typeof item.duration === 'string' ? parseInt(item.duration) : item.duration || 0,
    primaryArtists: item.primaryArtists || (item.artists?.primary ? item.artists.primary.map((a: any) => a.name).join(', ') : ''),
    image: (typeof item.image === 'string') ? [{ quality: '500x500', url: item.image }] : item.image || [],
    downloadUrl: item.downloadUrl || [],
    artists: item.artists
  };
}

export async function searchSongs(query: string, page: number = 1, limit: number = 20): Promise<{ songs: Song[]; total: number }> {
  const response = await fetch(
    `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  const json: SearchResponse = await response.json();
  if (!json.success) {
    throw new Error('Search API returned failure');
  }
  return {
    songs: (json.data.results || []).map(normalizeSong),
    total: json.data.total || 0,
  };
}

function normalizeArtist(item: any): Artist {
  return {
      id: item.id,
      name: item.name,
      role: item.role,
      image: (typeof item.image === 'string') ? [{ quality: '500x500', url: item.image }] : item.image || [],
      type: item.type,
      url: item.url
  };
}

export async function searchArtists(query: string, page: number = 1, limit: number = 20): Promise<{ artists: Artist[]; total: number }> {
  const response = await fetch(
    `${BASE_URL}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Search artists failed: ${response.status}`);
  }
  const json: SearchArtistResponse = await response.json();
  if (!json.success) {
    throw new Error('Search artists API returned failure');
  }
  const rawArtists = json.data.results || [];
  // Filter for valid artists and clean names (No "Collab" entries like "Pritam & Arijit")
  const artists = rawArtists
      .map(normalizeArtist)
      .filter(a => 
         a.type === 'artist' && 
         getBestImage(a.image) !== '' && 
         !/[&,|;]/.test(a.name) && // Exclude names with &, comma, pipe, or semicolon
         !/\s(ft\.|feat\.|x)\s/i.test(a.name) // Exclude "feat." and " x "
      );
  return {
    artists,
    total: json.data.total || 0,
  };
}

export async function getSongById(id: string): Promise<Song | null> {
  const response = await fetch(`${BASE_URL}/api/songs/${id}`);
  if (!response.ok) {
    throw new Error(`Get song failed: ${response.status}`);
  }
  const json: SongDetailResponse = await response.json();
  if (!json.success || !json.data || json.data.length === 0) {
    return null;
  }
  return json.data[0];
}

export async function getArtistDetails(id: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/artists/${id}`);
  if (!response.ok) {
    throw new Error(`Get artist details failed: ${response.status}`);
  }
  const json = await response.json();
  if (!json.success || !json.data) {
     return null;
  }
  return json.data;
}

export async function getArtistSongs(id: string, page: number = 1): Promise<{ songs: Song[]; total: number }> {
    const response = await fetch(`${BASE_URL}/api/artists/${id}/songs?page=${page}`);
    if (!response.ok) {
        throw new Error(`Get artist songs failed: ${response.status}`);
    }
    const json = await response.json();
    if (!json.success || !json.data) {
        return { songs: [], total: 0 };
    }
    return {
        songs: (json.data.songs || []).map(normalizeSong),
        total: json.data.total || 0
    };
}
