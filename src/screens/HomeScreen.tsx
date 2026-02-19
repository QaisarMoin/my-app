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
  ScrollView,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchSongs, searchArtists, searchAlbums, getBestImage } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';
import { ArtistCard } from '../components/ArtistCard';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistBottomSheet } from '../components/ArtistBottomSheet';
import { Song, Artist, Album, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TABS = ['Suggested', 'Songs', 'Artists', 'Albums'];

// Mock data helpers or derived from API
const SectionHeader = ({ title, onPress }: { title: string; onPress?: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.seeAllText}>See All</Text>
    </TouchableOpacity>
  </View>
);

const HorizontalCard = ({ item, onPress }: { item: Song; onPress: () => void }) => (
  <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
    <Image 
      source={{ uri: item.image && item.image.length > 0 ? item.image[item.image.length - 1]?.url : 'https://via.placeholder.com/140' }} 
      style={styles.cardImage} 
    />
    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.primaryArtists || 'Unknown Artist'}</Text>
  </TouchableOpacity>
);

const ArtistCircle = ({ name, image, onPress }: { name: string; image: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.artistContainer} onPress={onPress}>
    <Image source={{ uri: image }} style={styles.artistImage} />
    <Text style={styles.artistName} numberOfLines={1}>{name}</Text>
  </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState('Suggested');
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [suggestedSongs, setSuggestedSongs] = useState<Song[]>([]);
  const [recentData, setRecentData] = useState<Song[]>([]);
  const [artistData, setArtistData] = useState<Song[]>([]);
  const [mostPlayedData, setMostPlayedData] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Artists State
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showArtistSheet, setShowArtistSheet] = useState(false);
  const [artistPage, setArtistPage] = useState(1);
  const [hasMoreArtists, setHasMoreArtists] = useState(true);

  // Albums State
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumPage, setAlbumPage] = useState(1);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);
  const [albumLoading, setAlbumLoading] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  // Initial fetch for Suggested Content
  useEffect(() => {
    loadSuggestedContent();
  }, []);

  // Effect to handle tab changes
  useEffect(() => {
    if (activeTab === 'Songs' && songs.length === 0 && !searchText) {
       fetchSongs('latest', 1);
    } else if (activeTab === 'Artists' && artists.length === 0 && !searchText) {
       fetchDefaultArtists(1);
    } else if (activeTab === 'Albums' && albums.length === 0 && !searchText) {
       fetchAlbums('arijit', 1); // User requested default query 'arijit'
    }
  }, [activeTab]);

  const loadSuggestedContent = async () => {
    try {
      // Fetch diverse data to populate the distinct sections
      // Recently Played (Simulated with 'Latest' or 'Trending')
      const [recentRes, artistRes, mostPlayedRes] = await Promise.all([
        searchSongs('latest english', 1, 10),
        searchSongs('best artists', 1, 10), 
        searchSongs('global top 20', 1, 10)
      ]);

      setRecentData(recentRes.songs);
      // For artists, ideally we'd have an artists endpoint, but we extract from songs
      setArtistData(artistRes.songs);
      setMostPlayedData(mostPlayedRes.songs);
    } catch (e) {
      console.log('Failed to load suggested', e);
    }
  };

  const fetchSongs = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) return;
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const { songs: results, total } = await searchSongs(q, p);
      setSongs(prev => {
        if (append) {
          const newSongs = results.filter(r => !prev.some(p => p.id === r.id));
          return [...prev, ...newSongs];
        }
        return results;
      });
      setHasMore(results.length === 20 && (p * 20) < total);
    } catch (e: any) {
      setError(e.message || 'Failed to load songs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 🌟 CURATED LIST OF GLOBAL SUPERSTARS (for Infinite Scroll)
  const FAMOUS_ARTISTS = [
    // India (Bollywood/Pop/Indie)
    'Arijit Singh', 'Atif Aslam', 'Sonu Nigam', 'Shreya Ghoshal', 'Badshah', 
    'Diljit Dosanjh', 'Neha Kakkar', 'Sidhu Moose Wala', 'A.R. Rahman', 'Pritam',
    'KK', 'Mohit Chauhan', 'Jubin Nautiyal', 'Armaan Malik', 'Darshan Raval',
    'Anuv Jain', 'Prateek Kuhad', 'King', 'MC Stan', 'Divine', 'Emiway Bantai',
    'Yo Yo Honey Singh', 'Guru Randhawa', 'Harrdy Sandhu', 'Sunidhi Chauhan',
    'Udit Narayan', 'Alka Yagnik', 'Kumar Sanu', 'Shaan', 'Amit Trivedi',
    // Global Pop/Hip-Hop
    'Justin Bieber', 'Taylor Swift', 'The Weeknd', 'Drake', 'Eminem',
    'Ed Sheeran', 'Ariana Grande', 'Post Malone', 'Bruno Mars', 'Coldplay',
    'Imagine Dragons', 'Maroon 5', 'Shawn Mendes', 'Dua Lipa', 'Billie Eilish',
    'Rihanna', 'Beyonce', 'Selena Gomez', 'Harry Styles', 'Adele',
    'Kanye West', 'Kendrick Lamar', 'Travis Scott', 'J. Cole', 'Future',
    'XXXTENTACION', 'Juice WRLD', 'Lil Uzi Vert', 'Cardi B', 'Nicki Minaj',
    // K-Pop / Latin / Others
    'BTS', 'BLACKPINK', 'Bad Bunny', 'J Balvin', 'Shakira', 'Daddy Yankee',
    'Alan Walker', 'Marshmello', 'DJ Snake', 'David Guetta', 'Calvin Harris'
  ];

  // Fetch diverse artists with Pagination (Batch of 5)
  const fetchDefaultArtists = useCallback(async (pageNum: number = 1) => {
      if (loading) return;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
          // Pagination Logic: Slice the big list
          const BATCH_SIZE = 5; 
          const start = (pageNum - 1) * BATCH_SIZE;
          const end = start + BATCH_SIZE;
          const batch = FAMOUS_ARTISTS.slice(start, end);

          if (batch.length === 0) {
              setHasMoreArtists(false);
              setLoading(false);
              setLoadingMore(false);
              return;
          }

          // Fetch top 1 result for each name (Precision > Quantity for curated list)
          const promises = batch.map(q => searchArtists(q, 1, 1)); 
          const results = await Promise.all(promises);
          
          let newArtists: Artist[] = [];
          results.forEach(res => {
              newArtists = [...newArtists, ...res.artists];
          });

          // Deduplicate
          newArtists = newArtists.filter(a => !!a && !!a.id); // Ensure valid
          
          setArtists(prev => {
              if (pageNum === 1) return newArtists;
              // Filter duplicates against previous state
              const filtered = newArtists.filter(n => !prev.some(p => p.id === n.id));
              return [...prev, ...filtered];
          });
          
          setHasMoreArtists(end < FAMOUS_ARTISTS.length);
      } catch (e) {
          console.error('Failed to load default artists', e);
      } finally {
          setLoading(false);
          setLoadingMore(false);
      }
  }, []);

  const fetchArtists = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) return;
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const { artists: results, total } = await searchArtists(q, p);
      setArtists(prev => {
        if (append) {
          const newArtists = results.filter(r => !prev.some(p => p.id === r.id));
          return [...prev, ...newArtists];
        }
        return results;
      });
      setHasMoreArtists(results.length === 20 && (p * 20) < total);
    } catch (e: any) {
      console.log('Error fetching artists', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch Albums
  const fetchAlbums = useCallback(async (q: string, p: number, append = false) => {
      if (albumLoading) return;
      setAlbumLoading(true);
      try {
          const res = await searchAlbums(q, p, 20);
          setAlbums(prev => {
              if (append) {
                 return [...prev, ...res.albums];
              }
              return res.albums;
          });
          setHasMoreAlbums(res.albums.length === 20);
      } catch (e) {
          console.error("Failed to fetch albums", e);
      } finally {
          setAlbumLoading(false);
      }
  }, [albumLoading]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setPage(1);
    setHasMore(true);
    fetchSongs(query, 1);
    setSearchText(query);
    setActiveTab('Songs'); // Switch to songs view on search
  };

  const handleLoadMore = () => {
    if (loadingMore || loading) return;
    
    if (activeTab === 'Songs' && hasMore) {
        setPage(prev => prev + 1);
        fetchSongs(searchText || 'latest', page + 1, true);
    } else if (activeTab === 'Artists' && hasMoreArtists) {
        const nextPage = artistPage + 1;
        setArtistPage(nextPage);
        
        if (searchText) {
            fetchArtists(searchText, nextPage, true);
        } else {
            // Infinite scroll for default list
            fetchDefaultArtists(nextPage);
        }
    } else if (activeTab === 'Albums' && hasMoreAlbums) {
        const nextPage = albumPage + 1;
        setAlbumPage(nextPage);
        fetchAlbums(searchText || 'arijit', nextPage, true);
    }
  };

  const handlePlay = useCallback(async (song: Song, list: Song[] = []) => {
    await playSong(song, list.length ? list : [song]);
    navigation.navigate('Player');
  }, [playSong, navigation]);

  const renderSuggestedView = () => {
    return (
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: currentSong ? 160 : 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recently Played Section */}
        <SectionHeader title="Recently Played" onPress={() => setActiveTab('Songs')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {recentData.map(song => (
            <HorizontalCard 
              key={song.id} 
              item={song} 
              onPress={() => handlePlay(song, recentData)} 
            />
          ))}
        </ScrollView>

        {/* Artists Section */}
        <SectionHeader title="Artists" onPress={() => setActiveTab('Artists')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {artistData.map(song => (
            <ArtistCircle 
              key={`artist-${song.id}`}
              name={(song.primaryArtists || song.name).split(',')[0]} 
              image={song.image && song.image.length > 0 ? song.image[song.image.length - 1]?.url : 'https://via.placeholder.com/100'} 
              onPress={() => navigation.navigate('ArtistDetails', { artistId: song.artists?.primary?.[0]?.id || song.id, initialArtist: { id: song.id, name: song.primaryArtists, url: '', image: song.image, type: 'artist', role: 'music' } })} 
            />
          ))}
        </ScrollView>

        {/* Most Played Section */}
        <SectionHeader title="Most Played" onPress={() => setActiveTab('Songs')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {mostPlayedData.map(song => (
            <HorizontalCard 
              key={song.id} 
              item={song} 
              onPress={() => handlePlay(song, mostPlayedData)} 
            />
          ))}
        </ScrollView>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="musical-notes" size={28} color="#FF6B35" />
            <Text style={styles.logoText}>Mume</Text>
          </View>
          <TouchableOpacity style={styles.searchIconBtn}>
            <Ionicons name="search" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar - Toggle visibility */}
        {isSearching && (
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
              autoFocus
            />
          </View>
        )}

        {/* Content Switcher */}
        {!isSearching && activeTab === 'Suggested' ? (
          renderSuggestedView()
        ) : !isSearching && activeTab === 'Artists' ? (
           /* Artists List */
           <FlashList
             data={artists}
             keyExtractor={(item) => item.id}
             estimatedItemSize={84}
             ListHeaderComponent={() => (
                 <View style={styles.songsHeader}>
                   <Text style={styles.songsCount}>{artists.length || '0'} artists</Text>
                   <TouchableOpacity style={styles.sortBtn}>
                     <Text style={styles.sortText}>Date Added</Text>
                     <Ionicons name="swap-vertical" size={16} color="#FF6B35" />
                   </TouchableOpacity>
                 </View>
             )}
             renderItem={({ item }) => (
               <ArtistCard
                 artist={item}
                 onPress={() => {
                     navigation.navigate('ArtistDetails', {
                         artistId: item.id,
                         initialArtist: item
                     });
                 }}
                 onMorePress={() => {
                     setSelectedArtist(item);
                     setShowArtistSheet(true);
                 }}
               />
             )}
             onEndReached={handleLoadMore}
             onEndReachedThreshold={0.5}
             showsVerticalScrollIndicator={false}
             contentContainerStyle={{
               paddingBottom: currentSong ? 160 : 100,
             }}
             ListEmptyComponent={artists.length === 0 ? <View style={styles.emptyList} /> : null}
             ListFooterComponent={loadingMore ? <ActivityIndicator color="#FF6B35" /> : null}
             ItemSeparatorComponent={() => <View style={styles.separator} />}
           />
        ) : !isSearching && activeTab === 'Albums' ? (
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <AlbumCard 
                album={item} 
                onPress={(album) => navigation.navigate('AlbumDetails', { albumId: album.id })} 
              />
            )}
            style={{flex: 1}}
            contentContainerStyle={{ paddingBottom: currentSong ? 160 : 100, paddingTop: 16 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            // Optimization Props
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListFooterComponent={albumLoading && albumPage > 1 ? <ActivityIndicator color="#FF6B35" style={{margin: 20}} /> : null}
            ListEmptyComponent={!albumLoading ? <View style={{padding: 20}}><Text style={{textAlign: 'center', color: '#888'}}>No albums found</Text></View> : null}
          />
        ) : (
          /* Search/Songs Results List */
          <FlashList
            data={songs}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            ListHeaderComponent={() => (
              !isSearching && activeTab === 'Songs' ? (
                <View style={styles.songsHeader}>
                  <Text style={styles.songsCount}>{songs.length || '0'} songs</Text>
                  <TouchableOpacity style={styles.sortBtn}>
                    <Text style={styles.sortText}>Ascending</Text>
                    <Ionicons name="swap-vertical" size={16} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              ) : null
            )}
            renderItem={({ item, index }) => (
              <SongCard
                song={item}
                onPlay={handlePlay}
                isActive={currentSong?.id === item.id}
                isPlaying={currentSong?.id === item.id && isPlaying}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: currentSong ? 160 : 100,
            }}
            ListEmptyComponent={songs.length === 0 ? <View style={styles.emptyList} /> : null}
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#FF6B35" /> : null}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        
        <ArtistBottomSheet 
            visible={showArtistSheet}
            onClose={() => setShowArtistSheet(false)}
            artist={selectedArtist}
        />
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
  searchIconBtn: {
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
  tabsContainer: {
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tabItem: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTabItem: {
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  activeIndicator: {
    height: 3,
    backgroundColor: '#FF6B35',
    width: '60%',
    marginTop: 4,
    borderRadius: 1.5,
  },
  scrollContent: {
   // Padding bottom handled dynamically
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  horizontalCard: {
    width: 140,
    marginRight: 0,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  artistContainer: {
    alignItems: 'center',
    width: 100,
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  artistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 16, // Adjusted separator margin
  },
  songsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  songsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
