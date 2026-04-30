// src/components/gamification/AchievementUnlockedToast.tsx

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, lineHeights, radius, spacing, typography } from '../../theme';
import { useAchievementToastStore } from '../../store/useAchievementToastStore';

const AUTO_DISMISS_MS = 3000;

export const AchievementUnlockedToast = () => {
  const toast = useAchievementToastStore((state) => state.currentToast);
  const dismissToast = useAchievementToastStore(
    (state) => state.dismissAchievementToast,
  );
  const insets = useSafeAreaInsets();

  const shimmerX = useSharedValue(-120);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!toast) {
      return;
    }

    shimmerX.value = withRepeat(
      withSequence(
        withTiming(220, { duration: 1100 }),
        withTiming(-120, { duration: 0 }),
      ),
      -1,
      false,
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 420 }),
        withTiming(1, { duration: 420 }),
      ),
      -1,
      true,
    );

    const timeoutId = setTimeout(() => {
      dismissToast();
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [dismissToast, scale, shimmerX, toast]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '-12deg' }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          top: insets.top + spacing.xxxl + spacing.lg,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss achievement notification"
        onPress={dismissToast}
        style={({ pressed }) => [
          styles.card,
          pressed ? styles.cardPressed : null,
        ]}
      >
        <Animated.View style={[styles.shimmer, shimmerStyle]} />

        <Animated.Text style={[styles.emoji, emojiStyle]}>
          {toast.emoji}
        </Animated.Text>

        <View style={styles.textColumn}>
          <Text style={styles.eyebrow}>Achievement Unlocked!</Text>
          <Text numberOfLines={1} style={styles.title}>
            {toast.title}
          </Text>
        </View>

        <View style={styles.xpPill}>
          <Text style={styles.xpText}>+{toast.xpReward} XP</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 70,
    elevation: 70,
  },

  card: {
    minHeight: 78,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 9,
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
  },

  shimmer: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 82,
    backgroundColor: colors.white,
    opacity: 0.52,
  },

  emoji: {
    fontSize: fontSizes.display,
  },

  textColumn: {
    flex: 1,
  },

  eyebrow: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.accent,
  },

  title: {
    marginTop: spacing.xxs,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
    fontWeight: '900',
    color: colors.text,
  },

  xpPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
  },

  xpText: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '900',
    color: colors.text,
  },
});
