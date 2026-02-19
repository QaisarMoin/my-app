export type RootStackParamList = {
  MainTabs: undefined;
  Player: undefined;
  Queue: undefined;
  ArtistDetails: { artistId: string; initialArtist?: Artist };
};

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Playlists: undefined;
  Settings: undefined;
};

export interface SongImage {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}



export interface Song {
  id: string;
  name: string;
  duration: number;
  primaryArtists: string;
  image: SongImage[];
  downloadUrl: DownloadUrl[];
  artists?: {
    primary?: Artist[];
    featured?: Artist[];
    all?: Artist[];
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    total: number;
    start: number;
    results: Song[];
  };
}

export interface SongDetailResponse {
  success: boolean;
  data: Song[];
}

export interface Artist {
  id: string;
  name: string;
  role: string;
  image: { quality: string; url: string }[];
  type: string;
  url: string;
}

export interface SearchArtistResponse {
  success: boolean;
  data: {
    total: number;
    start: number;
    results: Artist[];
  };
}
