import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import { Onboarding01Screen } from '../screens/onboarding/Onboarding01Screen';
import { Onboarding02Screen } from '../screens/onboarding/Onboarding02Screen';
import { Onboarding03Screen } from '../screens/onboarding/Onboarding03Screen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { H1 } from '../components/ui';
import { colors, spacing } from '../theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <H1 style={styles.loadingTitle}>LociLand</H1>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

export function AuthNavigator() {
  const { isLoading, hasSeenOnboarding } = useOnboardingStatus();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={hasSeenOnboarding ? 'Login' : 'Onboarding01'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Onboarding01" component={Onboarding01Screen} />
      <Stack.Screen name="Onboarding02" component={Onboarding02Screen} />
      <Stack.Screen name="Onboarding03" component={Onboarding03Screen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingTitle: {
    marginBottom: spacing.lg,
  },
});