export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatMillis(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  return formatDuration(ms / 1000);
}

export function getArtistName(song: { primaryArtists?: string; artists?: { primary?: { name: string }[] } }): string {
  if (song.primaryArtists) return song.primaryArtists;
  if (song.artists?.primary && song.artists.primary.length > 0) {
    return song.artists.primary.map(a => a.name).join(', ');
  }
  return 'Unknown Artist';
}
