import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '../../theme';
import { getPalaceTemplateById } from '../../assets/templates';
import type { Palace } from '../../types';
import { AnimatedNumber } from '../ui/AnimatedNumber';

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
      <View style={styles.topRow}>
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{template.emoji}</Text>
        </View>
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
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 30,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  emojiBox: {
    width: 108,
    height: 108,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 9,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  emoji: {
    fontSize: 58,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.74,
    marginBottom: spacing.lg,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },

  stationBadge: {
    flexShrink: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },

  stationBadgeText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },

  reviewButton: {
    minWidth: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
  },

  reviewButtonPressed: {
    opacity: 0.88,
  },

  reviewButtonText: {
    color: colors.accent,
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Nunito_800ExtraBold',
  },
});

export { PalaceCard };
export default PalaceCard;