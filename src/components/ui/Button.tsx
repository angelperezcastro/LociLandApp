// src/components/ui/Button.tsx

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, shadows, spacing, typography } from '../../theme';

const BUTTON_PRESS_SCALE = 0.96;
const BUTTON_PRESS_DURATION_MS = 100;


type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const content = children ?? title;
  const textStyleKey = buttonTextStyleByVariant[variant];
  const pressScale = useSharedValue(1);

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!isDisabled) {
      pressScale.value = withTiming(BUTTON_PRESS_SCALE, {
        duration: BUTTON_PRESS_DURATION_MS,
      });
    }

    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressScale.value = withTiming(1, {
      duration: BUTTON_PRESS_DURATION_MS,
    });

    onPressOut?.(event);
  };

  return (
    <Animated.View style={[animatedPressStyle, fullWidth && styles.fullWidth]}>
      <Pressable
        {...rest}
        accessibilityRole="button"
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.base,
          styles[size],
          styles[variant],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.text}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

          {typeof content === 'string' ? (
            <Text style={[styles.text, styles[textStyleKey], textStyle]}>
              {content}
            </Text>
          ) : (
            content
          )}

          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    ...shadows.soft,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    shadowOpacity: 0,
    elevation: 0,
  },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.96,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: spacing.xs,
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.accent,
  },
  outlineText: {
    color: colors.accent,
  },
  dangerText: {
    color: colors.white,
  },
});

const buttonTextStyleByVariant: Record<
  ButtonVariant,
  'primaryText' | 'secondaryText' | 'ghostText' | 'outlineText' | 'dangerText'
> = {
  primary: 'primaryText',
  secondary: 'secondaryText',
  ghost: 'ghostText',
  outline: 'outlineText',
  danger: 'dangerText',
};