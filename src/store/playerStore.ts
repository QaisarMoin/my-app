import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';
import { audioService } from '../services/audioService';

const QUEUE_KEY = '@music_player_queue';
const LAST_SONG_KEY = '@music_player_last_song';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  position: number;
  duration: number;
  isLoading: boolean;

  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  // Modified Actions
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  
  // Restored Actions
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  addToQueue: (song: Song) => void;
  enqueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // ... existing ...
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  loadPersistedData: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  position: 0,
  duration: 0,
  isLoading: false,

  playSong: async (song: Song, queue?: Song[]) => {
    const state = get();
    let newQueue = queue || state.queue;
    let index = newQueue.findIndex(s => s.id === song.id);

    if (index === -1) {
      newQueue = [...newQueue, song];
      index = newQueue.length - 1;
    }

    set({ currentSong: song, currentIndex: index, queue: newQueue, isLoading: true, position: 0 });

    // Persist
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    await AsyncStorage.setItem(LAST_SONG_KEY, JSON.stringify(song));

    // Setup status callback
    audioService.setStatusCallback(({ isPlaying, position, duration, didFinish }) => {
      set({ isPlaying, position, duration });
      if (didFinish) {
        get().playNext();
      }
    });

    await audioService.loadAndPlay(song);
    set({ isLoading: false, isPlaying: true });
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await audioService.pause();
      set({ isPlaying: false });
    } else {
      await audioService.resume();
      set({ isPlaying: true });
    }
  },

  isShuffle: false,
  repeatMode: 'off',

  toggleShuffle: () => set(state => ({ isShuffle: !state.isShuffle })),
  
  toggleRepeat: () => set(state => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),

  playNext: async () => {
    const { queue, currentIndex, isShuffle, repeatMode, playSong } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      // Replay current
      await audioService.seekTo(0);
      await audioService.resume();
      set({ isPlaying: true });
      return;
    }

    let nextIndex = currentIndex + 1;

    if (isShuffle) {
      // Pick random index
      nextIndex = Math.floor(Math.random() * queue.length);
      // Avoid same song if queue > 1
      if (queue.length > 1 && nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
    } else {
      // Normal flow
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0; // Wrap
        } else {
          return; // Stop at end
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await playSong(nextSong, queue);
    }
  },

  playPrevious: async () => {
    const { queue, currentIndex, position, playSong } = get();
    // If more than 3 seconds in, restart current song
    if (position > 3000) {
      await audioService.seekTo(0);
      return;
    }
    
    if (queue.length === 0) return;
    
    // Simple previous logic - logic for shuffle playPrevious is complex (history stack), 
    // sticking to index based for simplicity or random if shuffle?
    // Let's stick to index decrement for previous unless strictly shuffle history (which we don't have).
    // Or just random -> random? No, previous usually means "back". 
    // Let's just go back in index wrapping around.
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevSong = queue[prevIndex];
    if (prevSong) {
      await playSong(prevSong, queue);
    }
  },

  seekTo: async (positionMs: number) => {
    await audioService.seekTo(positionMs);
    set({ position: positionMs });
  },

  addToQueue: (song: Song) => {
    const { queue } = get();
    const exists = queue.find(s => s.id === song.id);
    if (!exists) {
      const newQueue = [...queue, song];
      set({ queue: newQueue });
      AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    }
  },

  enqueueNext: (song: Song) => {
    const { queue, currentIndex } = get();
    const exists = queue.find(s => s.id === song.id);
    if (exists) return; // Or prevent duplicates

    const newQueue = [...queue];
    // Insert after current index
    const insertIndex = currentIndex + 1;
    newQueue.splice(insertIndex, 0, song);
    
    set({ queue: newQueue });
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  },

  removeFromQueue: (index: number) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = currentIndex;
    if (index < currentIndex) newIndex = currentIndex - 1;
    else if (index === currentIndex) newIndex = Math.min(currentIndex, newQueue.length - 1);
    set({ queue: newQueue, currentIndex: newIndex });
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    let newIndex = currentIndex;
    if (currentIndex === fromIndex) newIndex = toIndex;
    else if (fromIndex < currentIndex && toIndex >= currentIndex) newIndex = currentIndex - 1;
    else if (fromIndex > currentIndex && toIndex <= currentIndex) newIndex = currentIndex + 1;

    set({ queue: newQueue, currentIndex: newIndex });
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  },

  setPosition: (position: number) => set({ position }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  loadPersistedData: async () => {
    try {
      const [queueJson, lastSongJson] = await Promise.all([
        AsyncStorage.getItem(QUEUE_KEY),
        AsyncStorage.getItem(LAST_SONG_KEY),
      ]);

      const queue = queueJson ? JSON.parse(queueJson) : [];
      const lastSong = lastSongJson ? JSON.parse(lastSongJson) : null;

      if (lastSong && queue.length > 0) {
        const index = queue.findIndex((s: Song) => s.id === lastSong.id);
        set({ queue, currentSong: lastSong, currentIndex: index >= 0 ? index : 0 });
      } else if (queue.length > 0) {
        set({ queue });
      }
    } catch (e) {
      console.error('Failed to load persisted data:', e);
    }
  },
}));
