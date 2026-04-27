import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '../../theme';
import type { Palace } from '../../types';
import { getPalaceTemplateById } from '../../assets/templates';

interface PalaceCardProps {
  palace: Palace;
  onPress: (palaceId: string) => void;
  onReviewPress: (palaceId: string) => void;
  onLongPress?: (palaceId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function PalaceCard({
  palace,
  onPress,
  onReviewPress,
  onLongPress,
  style,
}: PalaceCardProps) {
  const template = getPalaceTemplateById(palace.templateId);

  const handleReviewPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onReviewPress(palace.id);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${palace.name}`}
      onPress={() => onPress(palace.id)}
      onLongPress={() => onLongPress?.(palace.id)}
      delayLongPress={450}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: template.backgroundColour },
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{template.emoji}</Text>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {palace.name}
        </Text>

        <Text numberOfLines={2} style={styles.description}>
          {template.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.stationBadge}>
            <Text style={styles.stationBadgeText}>
              🚩 {palace.stationCount} stations
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Review ${palace.name}`}
            onPress={handleReviewPress}
            style={({ pressed }) => [
              styles.reviewButton,
              pressed && styles.reviewButtonPressed,
            ]}
          >
            <Text style={styles.reviewButtonText}>Review</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 168,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.bg,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 7,
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  emojiContainer: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.text,
  },
  emoji: {
    fontSize: 48,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 25,
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 19,
    opacity: 0.78,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stationBadge: {
    flexShrink: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  stationBadgeText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  reviewButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  reviewButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  reviewButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
});