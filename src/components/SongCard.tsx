import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { getBestImage, getBestDownloadUrl } from '../services/api';
import { getArtistName, formatDuration } from '../utils/helpers';

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  isPlaying?: boolean;
  isActive?: boolean;
  showIndex?: boolean;
  index?: number;
}

export const SongCard = React.memo<SongCardProps>(({
  song,
  onPlay,
  isPlaying = false,
  isActive = false,
  showIndex = false,
  index,
}) => {
  const imageUrl = getBestImage(song.image);
  const artist = getArtistName(song);
  const duration = formatDuration(song.duration);

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => onPlay(song)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {showIndex && !isActive ? (
          <Text style={styles.index}>{(index ?? 0) + 1}</Text>
        ) : null}
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: imageUrl || 'https://via.placeholder.com/50' }} 
            style={styles.image} 
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
            {song.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artist} | {duration} mins
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[styles.playBtn, isActive && isPlaying && styles.playBtnActive]}
          onPress={() => onPlay(song)}
        >
          <Ionicons
            name={isActive && isPlaying ? 'pause' : 'play'}
            size={16}
            color={isActive ? '#fff' : '#FF6B35'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  activeContainer: {
    backgroundColor: '#FFF5F1',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  index: {
    width: 24,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginRight: 8,
  },
  imageWrapper: {
    marginRight: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activeName: {
    color: '#FF6B35',
  },
  artist: {
    fontSize: 12,
    color: '#888',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: '#FF6B35',
  },
  moreBtn: {
    padding: 4,
  },
});
