import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Caption } from '../ui';
import { colors, spacing } from '../../theme';

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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.emojiCircle, selected && styles.emojiCircleSelected]}>
        <Body style={styles.emoji}>{emoji}</Body>
      </View>

      <Body style={styles.title}>{title}</Body>

      {subtitle ? (
        <Caption style={styles.subtitle}>{subtitle}</Caption>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    transform: [{ scale: 1.02 }],
  },
  pressed: {
    opacity: 0.95,
  },
  emojiCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emojiCircleSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});