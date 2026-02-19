import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage } from '../services/api';
import { getArtistName, formatMillis } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

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
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const handleSlidingStart = () => {
    setIsSeeking(true);
    setSeekValue(position);
  };

  const handleValueChange = (val: number) => {
    setSeekValue(val);
  };

  const handleSlidingComplete = async (val: number) => {
    setIsSeeking(false);
    await seekTo(val);
  };

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No song playing</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getBestImage(currentSong.image);
  const artist = getArtistName(currentSong);
  const displayPosition = isSeeking ? seekValue : position;
  
  // Repeat Icon Logic
  let repeatIconName: keyof typeof MaterialIcons.glyphMap = 'repeat';
  let repeatColor = '#888';
  if (repeatMode === 'one') {
    repeatIconName = 'repeat-one';
    repeatColor = '#FF6B35';
  } else if (repeatMode === 'all') {
    repeatIconName = 'repeat';
    repeatColor = '#FF6B35';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            
            {/* Context/Lyrics Options */}
            <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A1A" />
            </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkWrapper}>
            <View style={styles.artworkContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.artwork} />
                ) : (
                    <View style={[styles.artwork, styles.artworkPlaceholder]}>
                        <Ionicons name="musical-note" size={100} color="#FF6B35" />
                    </View>
                )}
            </View>
        </View>

        {/* Song Info */}
        <View style={styles.infoContainer}>
            <View style={{flex: 1}}>
                <Text style={styles.title} numberOfLines={1}>{currentSong.name}</Text>
                <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
            </View>
            <TouchableOpacity style={styles.likeBtn}>
                <Ionicons name="heart-outline" size={28} color="#1A1A1A" />
            </TouchableOpacity>
        </View>

        {/* Seek Bar */}
        <View style={styles.seekContainer}>
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration || 1}
                value={displayPosition}
                minimumTrackTintColor="#FF6B35"
                maximumTrackTintColor="#EEE"
                thumbTintColor="#FF6B35"
                onSlidingStart={handleSlidingStart}
                onValueChange={handleValueChange}
                onSlidingComplete={handleSlidingComplete}
            />
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatMillis(displayPosition)}</Text>
                <Text style={styles.timeText}>{formatMillis(duration)}</Text>
            </View>
        </View>

        {/* Primary Controls */}
        <View style={styles.controlsRow}>
            <TouchableOpacity onPress={toggleShuffle}>
                <Ionicons name="shuffle" size={24} color={isShuffle ? "#FF6B35" : "#888"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={playPrevious}>
                <Ionicons name="play-skip-back" size={32} color="#1A1A1A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={playNext}>
                <Ionicons name="play-skip-forward" size={32} color="#1A1A1A" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat}>
                <MaterialIcons name={repeatIconName} size={24} color={repeatColor} />
            </TouchableOpacity>
        </View>

        {/* Secondary Controls / Bottom Row */}
        <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn}>
                <Ionicons name="timer-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
             <TouchableOpacity style={styles.secondaryBtn}>
                <Feather name="cast" size={24} color="#1A1A1A" />
            </TouchableOpacity>
             <TouchableOpacity style={styles.secondaryBtn}>
                <Ionicons name="share-social-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
        </View>

        {/* Lyrics Hint */}
        <View style={styles.lyricsHint}>
            <Ionicons name="chevron-up" size={24} color="#1A1A1A" />
            <Text style={styles.lyricsText}>Lyrics</Text>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerBtn: {
    padding: 8,
  },
  artworkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  artworkContainer: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artworkPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  likeBtn: {
      padding: 8,
  },
  seekContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginLeft: -15, 
    marginRight: -15,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  secondaryBtn: {
      padding: 8,
  },
  lyricsHint: {
      alignItems: 'center',
      marginBottom: 8,
  },
  lyricsText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginTop: -4,
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
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
