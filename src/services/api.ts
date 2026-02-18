import { Song, SearchResponse, SongDetailResponse } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

export function getBestImage(images: { quality: string; url: string }[]): string {
  if (!images || images.length === 0) return '';
  // Try to get highest quality (500x500 or last item)
  const high = images.find(img => img.quality === '500x500');
  return high ? high.url : images[images.length - 1]?.url || '';
}

export function getBestDownloadUrl(urls: { quality: string; url: string }[]): string {
  if (!urls || urls.length === 0) return '';
  // Prefer 320kbps
  const hq = urls.find(u => u.quality === '320kbps');
  return hq ? hq.url : urls[urls.length - 1]?.url || '';
}

export async function searchSongs(query: string, page: number = 1): Promise<{ songs: Song[]; total: number }> {
  const response = await fetch(
    `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=20`
  );
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  const json: SearchResponse = await response.json();
  if (!json.success) {
    throw new Error('Search API returned failure');
  }
  return {
    songs: json.data.results || [],
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
