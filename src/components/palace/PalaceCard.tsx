// src/components/palace/PalaceCard.tsx

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { getPalaceTemplateById } from '../../assets/templates';
import type { Palace } from '../../types';
import { AnimatedNumber } from '../gamification/AnimatedNumber';

export interface PalaceCardProps {
  palace: Palace;
  onPress?: (palaceId: string) => void;
  onReviewPress?: (palaceId: string) => void;
  onLongPress?: (palaceId: string) => void;
  style?: StyleProp<ViewStyle>;
}

function PalaceCard({
  palace,
  onPress,
  onReviewPress,
  onLongPress,
  style,
}: PalaceCardProps) {
  const template = getPalaceTemplateById(palace.templateId);
  const stationLabel = palace.stationCount === 1 ? 'station' : 'stations';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${palace.name}`}
      onPress={() => onPress?.(palace.id)}
      onLongPress={() => onLongPress?.(palace.id)}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{template.emoji}</Text>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {palace.name}
      </Text>

      <Text numberOfLines={2} style={styles.description}>
        {template.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.stationBadge}>
          <Text style={styles.stationBadgeText}>
            🚩{' '}
            <AnimatedNumber
              value={palace.stationCount}
              style={styles.stationBadgeText}
            />{' '}
            {stationLabel}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Review ${palace.name}`}
          onPress={(event) => {
            event.stopPropagation();
            onReviewPress?.(palace.id);
          }}
          style={({ pressed }) => [
            styles.reviewButton,
            pressed && styles.reviewButtonPressed,
          ]}
        >
          <Text style={styles.reviewButtonText}>Review</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  emojiBox: {
    width: 108,
    height: 108,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.text,
    ...shadows.soft,
  },
  emoji: {
    ...typography.display,
    fontSize: fontSizes.display + fontSizes.xl,
    lineHeight: 64,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  description: {
    ...typography.bodyStrong,
    color: colors.textSoft,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  stationBadge: {
    flexShrink: 1,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stationBadgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    color: colors.text,
  },
  reviewButton: {
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewButtonPressed: {
    opacity: 0.88,
  },
  reviewButtonText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    color: colors.accent,
  },
});

export { PalaceCard };
export default PalaceCard;
