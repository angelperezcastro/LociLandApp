import 'react-native-gesture-handler';
import './global.css';

import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useUserStore } from './src/store/useUserStore';
import { colors, useAppFonts } from './src/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen is best-effort. The app must still work if Expo
  // has already hidden it in development.
});

export default function App() {
  const [fontsLoaded] = useAppFonts();
  const isAuthResolved = useUserStore((state) => state.isAuthResolved);

  const isAppReady = fontsLoaded && isAuthResolved;

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => {
      // Do not block the app if the splash was already hidden.
    });
  }, [isAppReady]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>

        {!isAppReady ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});