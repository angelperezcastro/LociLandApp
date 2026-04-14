import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { CreatePalaceScreen } from '../screens/app/CreatePalaceScreen';
import { PalaceDetailScreen } from '../screens/app/PalaceDetailScreen';
import { ReviewScreen } from '../screens/app/ReviewScreen';
import { AchievementsScreen } from '../screens/app/AchievementsScreen';
import { useUserStore } from '../store/useUserStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen
            name="CreatePalace"
            component={CreatePalaceScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="PalaceDetail" component={PalaceDetailScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}