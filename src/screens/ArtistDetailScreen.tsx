import React, { useEffect, useState, useCallback } from 'react';
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
import { RootStackParamList, Artist, Song } from '../types';
import { getArtistDetails, getArtistSongs, getBestImage, searchSongs } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';

type ArtistDetailRouteProp = RouteProp<RootStackParamList, 'ArtistDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ArtistDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ArtistDetailRouteProp>();
  const { artistId, initialArtist } = route.params;
  const { playSong, playNext } = usePlayerStore();

  const [artist, setArtist] = useState<Artist | null>(initialArtist || null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [details, setDetails] = useState<any>(null); // For extra stats like followerCount
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const [hasMore, setHasMore] = useState(true); // New state
  const [isFallback, setIsFallback] = useState(false); // New state

  useEffect(() => {
    loadData();
  }, [artistId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let detailsRes = null;
      try {
         detailsRes = await getArtistDetails(artistId);
      } catch (e) {
         console.warn('Failed to load details', e);
      }

      // Update details if successful
      if (detailsRes) {
          setDetails(detailsRes);
          // Update artist info if missing (e.g. from deep link)
          if (!artist) {
             setArtist({
                 id: detailsRes.id,
                 name: detailsRes.name,
                 role: 'Artist',
                 image: detailsRes.image,
                 type: 'artist',
                 url: detailsRes.url
             });
          }
      }

      // Always fetch songs, even if details failed
      try {
          const songsRes = await getArtistSongs(artistId, 1);
          if (songsRes?.songs && songsRes.songs.length > 0) {
            setSongs(songsRes.songs);
            setTotalSongs(songsRes.total);
            setHasMore(songsRes.songs.length === 20 && songsRes.total > 20);
          } else {
             throw new Error('No songs found by ID');
          }
      } catch (e) {
          console.warn('Failed to load songs by ID, trying fallback search...', e);
          // Fallback: Search by Artist Name (for Foreign Artists where ID might fail)
          if (artist?.name) {
              setIsFallback(true);
              try {
                  const fallbackRes = await searchSongs(artist.name, 1, 20);
                  if (fallbackRes?.songs && fallbackRes.songs.length > 0) {
                      setSongs(fallbackRes.songs);
                      setTotalSongs(fallbackRes.total);
                      setHasMore(fallbackRes.songs.length === 20);
                  }
              } catch (err) {
                  console.error('Fallback search failed', err);
              }
          }
      }
    } catch (e) {
      console.error('Failed to load artist data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSongs = async () => {
      if (loadingMore || !hasMore) return;

      setLoadingMore(true);
      try {
          const nextPage = page + 1;
          let newSongs: Song[] = [];
          
          if (isFallback) {
              // Fallback pagination
              if (artist?.name) {
                  const res = await searchSongs(artist.name, nextPage, 20);
                  newSongs = res.songs;
              }
          } else {
              // Normal pagination
              const res = await getArtistSongs(artistId, nextPage);
              newSongs = res.songs;
          }

          if (newSongs.length > 0) {
              setSongs(prev => [...prev, ...newSongs]);
              setPage(nextPage);
              // Simple check for end of list
              setHasMore(newSongs.length === 20);
          } else {
              setHasMore(false);
          }
      } catch(e) {
          console.error("Failed to load more songs", e);
          setHasMore(false);
      } finally {
          setLoadingMore(false);
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
      if (!artist) return null;
      const imageUrl = getBestImage(artist.image || details?.image);
      const songCount = totalSongs || details?.songs?.length || 0;
      const albumCount = details?.albumCount || 0; // API might not give this
      
      const totalDurationSec = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
      const hours = Math.floor(totalDurationSec / 3600);
      const minutes = Math.floor((totalDurationSec % 3600) / 60);
      const durationText = hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
      
      return (
          <View style={styles.header}>
              <View style={styles.navBar}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                      <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
              </View>
              
              <View style={styles.profileSection}>
                  <Image source={{ uri: imageUrl || 'https://via.placeholder.com/150' }} style={styles.largeImage} />
                  <Text style={styles.name}>{artist.name}</Text>
                  <Text style={styles.stats}>
                      {songCount > 0 ? (
                          <>
                           {albumCount > 0 ? `${albumCount} Albums | ` : ''}
                           {songCount} Songs {totalDurationSec > 0 ? `| ${durationText}` : ''}
                          </>
                      ) : (
                          'Artist'
                      )}
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
      {loading && !artist ? (
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
                    onPlay={() => playSong(item, songs)}
                    // isActive...
                />
            )}
            onEndReached={loadMoreSongs}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#FF6B35" style={{margin: 20}} /> : null}
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
      borderRadius: 90,
      marginBottom: 16,
      backgroundColor: '#f0f0f0',
  },
  name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1A1A1A',
      marginBottom: 8,
      textAlign: 'center',
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
