import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppStackParamList, AppTabParamList } from './types';

import HomeScreen from '../screens/app/HomeScreen';
import { ProgressScreen } from '../screens/app/ProgressScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { CreatePalaceScreen } from '../screens/app/CreatePalaceScreen';
import { PalaceDetailScreen } from '../screens/app/PalaceDetailScreen';
import { AddStationScreen } from '../screens/app/AddStationScreen';
import { EditStationScreen } from '../screens/app/EditStationScreen';
import { ReviewScreen } from '../screens/app/ReviewScreen';
import { AchievementsScreen } from '../screens/app/AchievementsScreen';

import { colors } from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          shadowColor: colors.text,
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📊</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />

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
          headerShown: false,
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
    </Stack.Navigator>
  );
}

export default AppNavigator;