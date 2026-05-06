// src/components/progress/XpEnergyCard.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';

type XpEnergyCardProps = {
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
  progressPercent: number;
  xpRemainingForNextLevel: number;
  xpForNextLevel: number | null;
};

export function XpEnergyCard({
  totalXP,
  currentLevel,
  levelTitle,
  progressPercent,
  xpRemainingForNextLevel,
  xpForNextLevel,
}: XpEnergyCardProps) {
  const safeProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>Memory energy</Text>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <Text style={styles.levelTitle}>{levelTitle}</Text>
        </View>

        <View style={styles.energyOrb}>
          <Text style={styles.energyEmoji}>⚡</Text>
        </View>
      </View>

      <View style={styles.energyTrack}>
        <View style={[styles.energyFill, { width: `${safeProgress}%` }]} />
        <View style={styles.energyGloss} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.metricText}>{totalXP} XP total</Text>
        <Text style={styles.metricText}>
          {xpForNextLevel === null
            ? 'Max level'
            : `${xpRemainingForNextLevel} XP left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 190,
    borderRadius: radius.xxl,
    backgroundColor: colors.accent,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.elevated,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: fontFamilies.bodyBold,
  },
  levelText: {
    ...typography.display,
    marginTop: spacing.xs,
    color: colors.surface,
    fontSize: fontSizes.display + spacing.xs,
  },
  levelTitle: {
    ...typography.bodyStrong,
    marginTop: spacing.xs,
    color: colors.surface,
  },
  energyOrb: {
    width: 78,
    height: 78,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  energyEmoji: {
    fontSize: fontSizes.display,
  },
  energyTrack: {
    height: 28,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  energyFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  energyGloss: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: spacing.xs,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    opacity: 0.44,
  },
  bottomRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricText: {
    ...typography.caption,
    color: colors.surface,
    fontFamily: fontFamilies.bodyBold,
  },
});