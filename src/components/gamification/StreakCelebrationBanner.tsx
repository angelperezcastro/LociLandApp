// src/components/gamification/StreakCelebrationBanner.tsx

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  colors,
  fontFamilies,
  fontSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { useStreakStore } from '../../store/useStreakStore';

const AUTO_DISMISS_MS = 3600;

export const StreakCelebrationBanner = () => {
  const celebration = useStreakStore((state) => state.currentCelebration);
  const dismiss = useStreakStore((state) => state.dismissStreakCelebration);

  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (!celebration) {
      return;
    }

    fireScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 380 }),
        withTiming(0.96, { duration: 380 }),
      ),
      -1,
      true,
    );

    const timeoutId = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [celebration, dismiss, fireScale]);

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  if (!celebration) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="box-none"
      style={styles.wrapper}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss streak celebration"
        onPress={dismiss}
        style={({ pressed }) => [
          styles.card,
          pressed ? styles.cardPressed : null,
        ]}
      >
        <Animated.Text style={[styles.fireEmoji, fireAnimatedStyle]}>
          🔥
        </Animated.Text>

        <View style={styles.copy}>
          <Text style={styles.title}>{celebration.currentStreak} day streak!</Text>

          <Text style={styles.subtitle}>
            {celebration.awardedSevenDayXP
              ? '+100 XP for reaching 7 days'
              : celebration.isNewRecord
                ? 'New best streak'
                : 'Keep your memory habit alive'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    zIndex: 50,
    elevation: 50,
  },
  card: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.secondary,
    ...shadows.elevated,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  fireEmoji: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    marginTop: spacing.xxs,
    color: colors.text,
    opacity: 0.72,
  },
});
