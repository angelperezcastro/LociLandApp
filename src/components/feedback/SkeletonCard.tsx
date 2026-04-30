// src/components/feedback/SkeletonCard.tsx

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';

type SkeletonCardProps = {
  count?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonCard({ count = 1, style }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.76,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.wrapper}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={`skeleton-card-${index}`}
          style={[styles.card, { opacity }, style]}
        >
          <View style={styles.emojiBlock} />

          <View style={styles.content}>
            <View style={styles.lineLarge} />
            <View style={styles.lineSmall} />
            <View style={styles.footerRow}>
              <View style={styles.badge} />
              <View style={styles.button} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  card: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  emojiBlock: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  lineLarge: {
    width: '82%',
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  lineSmall: {
    width: '100%',
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  badge: {
    width: 104,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  button: {
    width: 76,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
});
