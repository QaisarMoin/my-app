export type RootStackParamList = {
  Home: undefined;
  Player: undefined;
  Queue: undefined;
};

export interface SongImage {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  role: string;
  image?: SongImage[];
  url?: string;
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
