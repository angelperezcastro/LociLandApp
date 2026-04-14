import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import { Onboarding01Screen } from '../screens/onboarding/Onboarding01Screen';
import { Onboarding02Screen } from '../screens/onboarding/Onboarding02Screen';
import { Onboarding03Screen } from '../screens/onboarding/Onboarding03Screen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding01"
      screenOptions={{
        headerShown: false,
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