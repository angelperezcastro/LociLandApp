import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import type { RootStackParamList } from './types';
import { onAuthStateChanged } from '../services/auth';
import { colors } from '../theme';
import { useUserStore } from '../store/useUserStore';

import { CreatePalaceScreen } from '../screens/app/CreatePalaceScreen';
import { PalaceDetailScreen } from '../screens/app/PalaceDetailScreen';
import { AddStationScreen } from '../screens/app/AddStationScreen';
import { EditStationScreen } from '../screens/app/EditStationScreen';
import { ReviewScreen } from '../screens/app/ReviewScreen';
import { AchievementsScreen } from '../screens/app/AchievementsScreen';
import { ComponentShowcaseScreen } from '../screens/dev/ComponentShowcaseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isAuthResolved = useUserStore((state) => state.isAuthResolved);
  const hydrateFromAuthUser = useUserStore((state) => state.hydrateFromAuthUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setAuthResolved = useUserStore((state) => state.setAuthResolved);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          clearUser();
          return;
        }

        await hydrateFromAuthUser(user);
      } catch (error) {
        console.error('RootNavigator auth observer error:', error);
        clearUser();
      } finally {
        setAuthResolved(true);
      }
    });

    return unsubscribe;
  }, [clearUser, hydrateFromAuthUser, setAuthResolved]);

  if (!isAuthResolved) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="App" component={AppNavigator} />

          <Stack.Screen
            name="CreatePalace"
            component={CreatePalaceScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />

          <Stack.Screen
            name="PalaceDetail"
            component={PalaceDetailScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="AddStation"
            component={AddStationScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />

          <Stack.Screen
            name="EditStation"
            component={EditStationScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />

          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="ComponentShowcase"
            component={ComponentShowcaseScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});