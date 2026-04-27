import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';

import { colors, spacing } from '../../theme';

export interface StationCardProps {
  order: number;
  emoji: string;
  label: string;
  memoryText: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function StationCard({
  order,
  emoji,
  label,
  memoryText,
  onPress,
  style,
}: StationCardProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{order + 1}</Text>
      </View>

      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>

        <Text numberOfLines={1} style={styles.memoryText}>
          {memoryText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 86,
    borderRadius: 26,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.11,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: spacing.sm,
  },

  orderText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'FredokaOne_400Regular',
    includeFontPadding: false,
  },

  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginRight: spacing.md,
  },

  emoji: {
    fontSize: 30,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.xs,
  },

  memoryText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito_600SemiBold',
  },
});

export { StationCard };
export default StationCard;