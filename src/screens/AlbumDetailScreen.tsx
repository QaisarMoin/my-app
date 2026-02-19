import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Album, Song } from '../types';
import { getAlbumDetails, getBestImage } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';

type AlbumDetailRouteProp = RouteProp<RootStackParamList, 'AlbumDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AlbumDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlbumDetailRouteProp>();
  const { albumId } = route.params;
  const { playSong } = usePlayerStore();

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Optimization: Stable Ref for songs
  const songsRef = useRef<Song[]>([]); 
  useEffect(() => { songsRef.current = songs; }, [songs]);

  // Optimization: Stable Play Handler
  const handlePlaySong = useCallback((song: Song) => {
      playSong(song, songsRef.current);
  }, [playSong]);

  useEffect(() => {
    loadData();
  }, [albumId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const details = await getAlbumDetails(albumId);
      if (details) {
          setAlbum(details);
          if (details.songs && details.songs.length > 0) {
              setSongs(details.songs);
          }
      }
    } catch (e) {
      console.error('Failed to load album data', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
      if (songs.length > 0) {
          playSong(songs[0], songs);
      }
  };

  const handleShuffle = () => {
      if (songs.length > 0) {
          const shuffled = [...songs].sort(() => Math.random() - 0.5);
          playSong(shuffled[0], shuffled);
      }
  };

  const renderHeader = () => {
      if (!album) return null;
      const imageUrl = getBestImage(album.image);
      const songCount = songs.length || parseInt(album.songCount || '0') || 0;
      
      const totalDurationSec = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
      const hours = Math.floor(totalDurationSec / 3600);
      const minutes = Math.floor((totalDurationSec % 3600) / 60);
      const durationText = hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
      
      // Artist Name: could be string or array
      const artistName = Array.isArray(album.primaryArtists) 
         ? album.primaryArtists.map((a: any) => a.name).join(', ') 
         : album.primaryArtists || 'Unknown Artist';

      return (
          <View style={styles.header}>
              <View style={styles.navBar}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                      <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
              </View>
              
              <View style={styles.profileSection}>
                  <Image source={{ uri: imageUrl || 'https://via.placeholder.com/150' }} style={styles.largeImage} />
                  <Text style={styles.name}>{album.name}</Text>
                  <Text style={styles.artistName}>{artistName}</Text>
                  <Text style={styles.stats}>
                      {songCount} Songs {totalDurationSec > 0 ? `| ${durationText}` : ''}
                      {album.year ? ` | ${album.year}` : ''}
                  </Text>
              </View>

              <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle}>
                      <Ionicons name="shuffle" size={20} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.shuffleText}>Shuffle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.playBtn} onPress={handlePlayAll}>
                      <Ionicons name="play" size={20} color="#FF6B35" style={{marginRight: 8}} />
                      <Text style={styles.playText}>Play</Text>
                  </TouchableOpacity>
              </View>
          </View>
      );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {loading && !album ? (
          <View style={styles.center}>
              <ActivityIndicator color="#FF6B35" size="large" />
          </View>
      ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item, index }) => (
                <SongCard 
                    song={item} 
                    onPlay={handlePlaySong} 
                    showIndex={true}
                    index={index + 1}
                />
            )}
            // Performance Props
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5} 
            removeClippedSubviews={true} 
            getItemLayout={(data, index) => (
                {length: 70, offset: 70 * index, index} 
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
  },
  center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
      alignItems: 'center',
      paddingBottom: 24,
      paddingHorizontal: 20,
  },
  navBar: {
      width: '100%',
      alignItems: 'flex-start',
      marginBottom: 10,
  },
  backBtn: {
      padding: 8,
      marginLeft: -8,
  },
  profileSection: {
      alignItems: 'center',
      marginBottom: 24,
  },
  largeImage: {
      width: 180,
      height: 180,
      borderRadius: 16, // Album art is usually square or slightly rounded, not circle
      marginBottom: 16,
      backgroundColor: '#f0f0f0',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
  },
  name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginBottom: 4,
      textAlign: 'center',
  },
  artistName: {
      fontSize: 16,
      color: '#FF6B35',
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '500',
  },
  stats: {
      fontSize: 14,
      color: '#888',
  },
  buttonsRow: {
      flexDirection: 'row',
      gap: 16,
      width: '100%',
      justifyContent: 'center',
  },
  shuffleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF6B35',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 24,
      minWidth: 140,
      justifyContent: 'center',
  },
  shuffleText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
  },
  playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF0E8',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 24,
      minWidth: 140,
      justifyContent: 'center',
  },
  playText: {
      color: '#FF6B35',
      fontWeight: '600',
      fontSize: 16,
  },
});
