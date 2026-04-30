// src/components/feedback/ErrorState.tsx

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../ui/Button';
import { Body, H2, Typography } from '../ui/Typography';
import { colors, radius, shadows, spacing } from '../../theme';

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
};

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  actionLabel = 'Try again',
  onAction,
  fullScreen = false,
}: ErrorStateProps) {
  return (
    <View style={[styles.wrapper, fullScreen && styles.fullScreen]}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Typography variant="h1">✨</Typography>
        </View>

        <View style={styles.copy}>
          <H2 align="center">{title}</H2>
          <Body color="textSoft" align="center">
            {message}
          </Body>
        </View>

        {onAction ? (
          <Button title={actionLabel} variant="outline" onPress={onAction} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emphasisSoft,
  },
  copy: {
    gap: spacing.xs,
  },
});
