import React, { type PropsWithChildren } from 'react';
import {
  View,
  StyleSheet,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';

export interface CardProps extends PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({
  children,
  style,
  padded = true,
  ...viewProps
}: CardProps) {
  return (
    <View
      style={[styles.base, padded && styles.padded, style]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  padded: {
    padding: spacing.lg,
  },
});