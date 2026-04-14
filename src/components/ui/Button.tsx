import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  style,
  textStyle,
  fullWidth = true,
  disabled = false,
  ...touchableProps
}: ButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.88}
      disabled={disabled}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      {...touchableProps}
    >
      <Text
        style={[
          styles.textBase,
          isGhost ? styles.ghostText : styles.filledText,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBorder,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryBorder,
  },
  ghost: {
    backgroundColor: colors.white,
    borderColor: colors.accent,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  disabled: {
    opacity: 0.55,
  },
  textBase: {
    ...typography.bodySemiBold,
    textAlign: 'center',
  },
  filledText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.accent,
  },
  disabledText: {
    color: colors.muted,
  },
});