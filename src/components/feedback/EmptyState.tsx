// src/components/feedback/EmptyState.tsx

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../ui/Button';
import { Body, H2, Typography } from '../ui/Typography';
import { colors, radius, shadows, spacing } from '../../theme';

type EmptyStateProps = {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = '🏰',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Typography variant="display">{icon}</Typography>
      </View>

      <View style={styles.copy}>
        <H2 align="center">{title}</H2>
        <Body color="textSoft" align="center">
          {message}
        </Body>
      </View>

      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
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
    width: 96,
    height: 96,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  copy: {
    gap: spacing.xs,
  },
});
