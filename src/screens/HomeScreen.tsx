import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchSongs } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';
import { Song } from '../types';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchSongs = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) return;
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const { songs: results, total } = await searchSongs(q, p);
      setSongs(prev => append ? [...prev, ...results] : results);
      setHasMore(results.length === 20 && (p * 20) < total);
    } catch (e: any) {
      setError(e.message || 'Failed to load songs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load default songs on mount
  useEffect(() => {
    fetchSongs('arijit singh', 1);
    setSearchText('arijit singh');
    setQuery('arijit singh');
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    setPage(1);
    setHasMore(true);
    fetchSongs(query, 1);
    setSearchText(query);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSongs(searchText, nextPage, true);
  };

  const handlePlay = async (song: Song) => {
    await playSong(song, songs);
    navigation.navigate('Player');
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={64} color="#FF6B35" />
        <Text style={styles.emptyTitle}>Not Found</Text>
        <Text style={styles.emptyText}>
          Sorry, the keyword you entered cannot be found, please check again or search with another keyword.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF6B35" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="musical-notes" size={28} color="#FF6B35" />
            <Text style={styles.logoText}>Mume</Text>
          </View>
          <TouchableOpacity style={styles.queueBtn} onPress={() => navigation.navigate('Queue')}>
            <Ionicons name="list" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, artists..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSongs([]); }}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        {songs.length > 0 && !loading && (
          <View style={styles.resultsRow}>
            <Text style={styles.resultsCount}>{songs.length} songs</Text>
            <Text style={styles.resultsQuery}>"{searchText}"</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSongs(searchText, 1)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading songs...</Text>
          </View>
        )}

        {/* Song List */}
        {!loading && !error && (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SongCard
                song={item}
                onPlay={handlePlay}
                isActive={currentSong?.id === item.id}
                isPlaying={currentSong?.id === item.id && isPlaying}
              />
            )}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={songs.length === 0 ? styles.emptyList : undefined}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  queueBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  resultsQuery: {
    fontSize: 13,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 78,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: {
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
