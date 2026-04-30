// src/components/palace/PalaceCard.tsx

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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

const CARD_PRESS_SCALE = 0.985;
const CARD_PRESS_DURATION_MS = 120;


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
  const [isPressed, setIsPressed] = useState(false);
  const pressScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = (_event: GestureResponderEvent) => {
    setIsPressed(true);
    pressScale.value = withTiming(CARD_PRESS_SCALE, {
      duration: CARD_PRESS_DURATION_MS,
    });
  };

  const handlePressOut = (_event: GestureResponderEvent) => {
    setIsPressed(false);
    pressScale.value = withTiming(1, {
      duration: CARD_PRESS_DURATION_MS,
    });
  };

  return (
    <Animated.View style={animatedCardStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${palace.name}`}
        onPress={() => onPress?.(palace.id)}
        onLongPress={() => onLongPress?.(palace.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={280}
        style={[
          styles.card,
          style,
          { backgroundColor: template.backgroundColour },
          isPressed && styles.cardPressed,
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
    </Animated.View>
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
    opacity: 0.98,
    ...shadows.elevated,
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
