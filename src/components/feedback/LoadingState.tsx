// src/components/feedback/LoadingState.tsx

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Body, H2 } from '../ui/Typography';
import { SkeletonCard } from './SkeletonCard';
import { colors, radius, shadows, spacing } from '../../theme';

type LoadingStateVariant = 'screen' | 'card' | 'inline';

type LoadingStateProps = {
  title?: string;
  message?: string;
  variant?: LoadingStateVariant;
  showSkeleton?: boolean;
  skeletonCount?: number;
};

export function LoadingState({
  title = 'Loading...',
  message,
  variant = 'screen',
  showSkeleton = false,
  skeletonCount = 3,
}: LoadingStateProps) {
  if (showSkeleton) {
    return <SkeletonCard count={skeletonCount} />;
  }

  return (
    <View
      style={[
        styles.base,
        variant === 'screen' && styles.screen,
        variant === 'card' && styles.card,
        variant === 'inline' && styles.inline,
      ]}
    >
      <ActivityIndicator size="large" color={colors.accent} />

      <View style={styles.copy}>
        <H2 align="center">{title}</H2>
        {message ? (
          <Body color="textSoft" align="center">
            {message}
          </Body>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  screen: {
    flex: 1,
    padding: spacing.xl,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card,
  },
  inline: {
    padding: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
});
