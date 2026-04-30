// src/navigation/AppNavigator.tsx

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
} from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TAB_ICON_BOUNCE_SCALE = 1.18;
const TAB_ICON_TIMING_MS = 120;

type AnimatedTabIconProps = {
  emoji: string;
  color: string;
  focused: boolean;
};

function AnimatedTabIcon({ emoji, color, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!focused) {
      scale.value = withTiming(1, { duration: TAB_ICON_TIMING_MS });
      return;
    }

    scale.value = withSequence(
      withTiming(TAB_ICON_BOUNCE_SCALE, { duration: TAB_ICON_TIMING_MS }),
      withSpring(1, { damping: 8, stiffness: 180 }),
    );
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.tabIcon, { color }, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

const renderTabIcon = (emoji: string) => {
  return ({
    color,
    focused,
  }: {
    color: string;
    focused: boolean;
  }) => <AnimatedTabIcon emoji={emoji} color={color} focused={focused} />;
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: renderTabIcon('🏠'),
        }}
      />

      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: renderTabIcon('📊'),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: renderTabIcon('👤'),
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
          animation: 'slide_from_bottom',
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
    </Stack.Navigator>
  );
}

export default AppNavigator;

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: fontSizes.xl,
  },
  tabBarLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  tabBar: {
    height: 82,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + spacing.xxs,
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    position: 'absolute',
    ...shadows.elevated,
  },
});
