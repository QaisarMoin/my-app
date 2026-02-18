import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';

import { HomeScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { usePlayerStore } from './src/store/playerStore';
import { audioService } from './src/services/audioService';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { loadPersistedData, currentSong } = usePlayerStore();

  useEffect(() => {
    // Initialize audio service
    audioService.init();
    // Load persisted queue and last song
    loadPersistedData();
  }, []);

  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="Queue" component={QueueScreen} />
        </Stack.Navigator>

        {/* MiniPlayer - persistent overlay */}
        {currentSong && (
          <View style={styles.miniPlayerWrapper}>
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
    bottom: 0,
    left: 0,
    right: 0,
  },
});
