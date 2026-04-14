import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
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
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.emphasis
    : isFocused
    ? colors.accent
    : colors.border;

  const backgroundColor = isFocused ? colors.accentSoft : colors.white;

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
        <Caption style={styles.feedbackText} color={colors.emphasis}>
          {error}
        </Caption>
      ) : helperText ? (
        <Caption style={styles.feedbackText}>{helperText}</Caption>
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
    borderRadius: 20,
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