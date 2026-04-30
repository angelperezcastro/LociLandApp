// src/components/ui/Card.tsx

import React, { type PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';

type CardVariant = 'default' | 'soft' | 'accent' | 'success' | 'warning';

export interface CardProps extends PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  variant?: CardVariant;
}

export function Card({
  children,
  style,
  padded = true,
  variant = 'default',
  ...viewProps
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        padded && styles.padded,
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  default: {
    backgroundColor: colors.surface,
  },
  soft: {
    backgroundColor: colors.surfaceSoft,
  },
  accent: {
    backgroundColor: colors.accentSoft,
  },
  success: {
    backgroundColor: colors.secondarySoft,
  },
  warning: {
    backgroundColor: colors.warningSoft,
  },
  padded: {
    padding: spacing.lg,
  },
});