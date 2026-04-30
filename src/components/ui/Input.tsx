// src/components/ui/Input.tsx

import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { Body, Caption } from './Typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    style,
    inputStyle,
    labelStyle,
    onFocus,
    onBlur,
    ...textInputProps
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.emphasis
    : isFocused
      ? colors.accent
      : colors.border;

  const backgroundColor = isFocused ? colors.accentSoft : colors.surface;

  return (
    <View style={style}>
      {label ? (
        <Body style={[styles.label, labelStyle]}>{label}</Body>
      ) : null}

      <View style={[styles.inputWrapper, { borderColor, backgroundColor }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          style={[styles.input, inputStyle]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...textInputProps}
        />
      </View>

      {error ? (
        <Caption style={styles.feedbackText} color="emphasis">
          {error}
        </Caption>
      ) : helperText ? (
        <Caption style={styles.feedbackText} color="textSoft">
          {helperText}
        </Caption>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    marginTop: spacing.xs,
  },
});