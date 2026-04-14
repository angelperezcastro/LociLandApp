import React, { type PropsWithChildren } from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { colors, typography } from '../../theme';

type BaseTypographyProps = PropsWithChildren<
  TextProps & {
    style?: StyleProp<TextStyle>;
    color?: string;
  }
>;

function BaseText({
  children,
  style,
  color,
  ...textProps
}: BaseTypographyProps) {
  return (
    <Text {...textProps} style={[{ color }, style]}>
      {children}
    </Text>
  );
}

export function H1({
  children,
  style,
  color = colors.text,
  ...props
}: BaseTypographyProps) {
  return (
    <BaseText {...props} color={color} style={[typography.h1, style]}>
      {children}
    </BaseText>
  );
}

export function H2({
  children,
  style,
  color = colors.text,
  ...props
}: BaseTypographyProps) {
  return (
    <BaseText {...props} color={color} style={[typography.h2, style]}>
      {children}
    </BaseText>
  );
}

export function Body({
  children,
  style,
  color = colors.text,
  ...props
}: BaseTypographyProps) {
  return (
    <BaseText {...props} color={color} style={[typography.body, style]}>
      {children}
    </BaseText>
  );
}

export function Caption({
  children,
  style,
  color = colors.muted,
  ...props
}: BaseTypographyProps) {
  return (
    <BaseText {...props} color={color} style={[typography.caption, style]}>
      {children}
    </BaseText>
  );
}