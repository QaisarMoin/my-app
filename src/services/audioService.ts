import { Audio, AVPlaybackStatus } from 'expo-av';
import { getBestDownloadUrl } from './api';
import { Song } from '../types';

type StatusCallback = (status: { isPlaying: boolean; position: number; duration: number; didFinish: boolean }) => void;

class AudioService {
  private sound: Audio.Sound | null = null;
  private statusCallback: StatusCallback | null = null;
  private isLoading = false;

  async init() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  setStatusCallback(cb: StatusCallback) {
    this.statusCallback = cb;
  }

  private handleStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (this.statusCallback) {
      this.statusCallback({
        isPlaying: status.isPlaying,
        position: status.positionMillis || 0,
        duration: status.durationMillis || 0,
        didFinish: status.didJustFinish || false,
      });
    }
  };

  async loadAndPlay(song: Song): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const url = getBestDownloadUrl(song.downloadUrl);
      if (!url) throw new Error('No download URL available');

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        this.handleStatus
      );
      this.sound = sound;
    } finally {
      this.isLoading = false;
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async resume(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async getStatus(): Promise<AVPlaybackStatus | null> {
    if (!this.sound) return null;
    return await this.sound.getStatusAsync();
  }
}

export const audioService = new AudioService();
