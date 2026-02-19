import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artist } from '../types';
import { getBestImage } from '../services/api';

interface ArtistCardProps {
  artist: Artist;
  onPress: () => void;
  onMorePress: () => void;
}

export const ArtistCard = React.memo<ArtistCardProps>(({
  artist,
  onPress,
  onMorePress,
}) => {
  const imageUrl = getBestImage(artist.image);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Image 
          source={{ uri: imageUrl || 'https://via.placeholder.com/60' }} 
          style={styles.image} 
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {artist.name}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            Artist
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.moreBtn} onPress={onMorePress}>
        <Ionicons name="ellipsis-vertical" size={20} color="#888" />
      </TouchableOpacity>
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circular
    backgroundColor: '#f0f0f0',
    marginRight: 16,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  role: {
    fontSize: 13,
    color: '#888',
  },
  moreBtn: {
    padding: 8,
  },
});
