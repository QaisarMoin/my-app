import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';

import { MainTabs } from './src/navigation/MainTabs';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { ArtistDetailScreen } from './src/screens/ArtistDetailScreen';
import { AlbumDetailScreen } from './src/screens/AlbumDetailScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { usePlayerStore } from './src/store/playerStore';
import { audioService } from './src/services/audioService';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { loadPersistedData, currentSong } = usePlayerStore();
  const navigationRef = useNavigationContainerRef();
  const [routeName, setRouteName] = useState<string | undefined>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Initialize audio service
    audioService.init();
    // Load persisted queue and last song
    loadPersistedData();
  }, []);

  const handleStateChange = () => {
    const currentRoute = navigationRef.getCurrentRoute();
    setRouteName(currentRoute?.name);
  };

  // Hide MiniPlayer on PlayerScreen
  const showMiniPlayer = currentSong && routeName !== 'Player';
  
  // Adjust bottom position: 
  // On MainTabs, bottom = TabBarHeight (approx 49) + insets.bottom
  // On Queue, bottom = 0
  
  const isMainTabs = !routeName || ['Home', 'Favorites', 'Playlists', 'Settings'].includes(routeName);
  
  // Tab Bar standard height is usually 49. Expo/ReactNav adds padding for safe area.
  // We want MiniPlayer to sit right above the tab bar content.
  // The tab bar usually extends to the bottom edge.
  // So we need to lift MiniPlayer by (49 + insets.bottom + some spacing).
  // Actually, standard TabBar height is ~50-60px logic inclusive of labels.
  // Let's use 60 + insets.bottom to be safe and clear.
  
  const bottomPosition = isMainTabs ? (60 + insets.bottom) : 0;

  return (
    <View style={styles.root}>
      <NavigationContainer
        ref={navigationRef}
        onReady={handleStateChange}
        onStateChange={handleStateChange}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="Queue" component={QueueScreen} />
          <Stack.Screen 
            name="ArtistDetails" 
            component={ArtistDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="AlbumDetails" 
            component={AlbumDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>

        {/* MiniPlayer - persistent overlay */}
        {showMiniPlayer && (
          <View style={[styles.miniPlayerWrapper, { bottom: bottomPosition }]}>
            <MiniPlayer />
          </View>
        )}
      </NavigationContainer>
    </View>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Register the root component
registerRootComponent(App);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Bottom padding to ensure it doesn't stick to edge on QueueScreen
    paddingBottom: 0, 
  },
});
