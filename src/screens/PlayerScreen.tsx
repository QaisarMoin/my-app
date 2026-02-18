import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage } from '../services/api';
import { getArtistName, formatMillis } from '../utils/helpers';

const { width } = Dimensions.get('window');

export const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    queue,
    currentIndex,
  } = usePlayerStore();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-note-outline" size={80} color="#FF6B35" />
          <Text style={styles.emptyText}>No song playing</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getBestImage(currentSong.image);
  const artist = getArtistName(currentSong);
  const displayPosition = isSeeking ? seekValue : position;
  const progress = duration > 0 ? displayPosition / duration : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>Now Playing</Text>
            <Text style={styles.topSub}>
              {currentIndex + 1} / {queue.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.queueBtn}
            onPress={() => navigation.navigate('Queue' as never)}
          >
            <Ionicons name="list" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.artworkPlaceholder]}>
              <Ionicons name="musical-note" size={80} color="#FF6B35" />
            </View>
          )}
        </View>

        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songName} numberOfLines={2}>
            {currentSong.name}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        {/* Seek Bar */}
        <View style={styles.seekContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={displayPosition}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FF6B35"
            onSlidingStart={() => {
              setIsSeeking(true);
              setSeekValue(position);
            }}
            onValueChange={(val) => setSeekValue(val)}
            onSlidingComplete={async (val) => {
              setIsSeeking(false);
              await seekTo(val);
            }}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatMillis(displayPosition)}</Text>
            <Text style={styles.timeText}>{formatMillis(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={playPrevious}>
            <Ionicons name="play-skip-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={playNext}>
            <Ionicons name="play-skip-forward" size={28} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  topCenter: {
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  topSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  queueBtn: {
    padding: 4,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  artworkPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  songName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  seekContainer: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: {
    padding: 8,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  backLink: {
    fontSize: 15,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
