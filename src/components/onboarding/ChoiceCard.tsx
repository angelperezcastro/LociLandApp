// src/components/onboarding/ChoiceCard.tsx

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Body, Caption } from '../ui';
import {
  colors,
  fontSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
} from '../../theme';

type ChoiceCardProps = {
  emoji: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChoiceCard({
  emoji,
  title,
  subtitle,
  selected = false,
  onPress,
}: ChoiceCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.emojiCircle, selected && styles.emojiCircleSelected]}>
        <Body style={styles.emoji}>{emoji}</Body>
      </View>

      <Body style={styles.title}>{title}</Body>

      {subtitle ? <Caption style={styles.subtitle}>{subtitle}</Caption> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 180,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...shadows.card,
  },
  cardSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    transform: [{ scale: 1.02 }],
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emojiCircleSelected: {
    backgroundColor: colors.white,
    borderColor: colors.accent,
  },
  emoji: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: lineHeights.sm,
  },
});
