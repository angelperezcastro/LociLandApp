import './global.css';

import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, typography, useAppFonts } from './src/theme';

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 items-center justify-center bg-bg px-md">
        <Text style={[typography.h1, { color: colors.text, marginBottom: 12 }]}>
          LociLand
        </Text>

        <Text
          style={[
            typography.bodyLg,
            {
              color: colors.text,
              textAlign: 'center',
              maxWidth: 320,
            },
          ]}
        >
          Theme system and folder structure ready.
        </Text>
      </View>
    </SafeAreaProvider>
  );
}