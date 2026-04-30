// src/components/ui/Typography.tsx

import React from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

import {
  colors,
  fontFamilies,
  typography,
  type ColorToken,
  type TypographyVariant,
} from '../../theme';

type FontWeightIntent = 'regular' | 'semiBold' | 'bold';

type TextColor = ColorToken | (string & {});

type AppTypographyProps = TextProps & {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  weight?: FontWeightIntent;
  style?: StyleProp<TextStyle>;
};

function resolveColor(color: TextColor): string {
  if (color in colors) {
    return colors[color as ColorToken];
  }

  return color;
}

function getWeightFontFamily(weight?: FontWeightIntent): string | undefined {
  if (!weight) {
    return undefined;
  }

  if (weight === 'bold') {
    return fontFamilies.bodyBold;
  }

  if (weight === 'semiBold') {
    return fontFamilies.bodySemiBold;
  }

  return fontFamilies.body;
}

export function Typography({
  children,
  variant = 'body',
  color = 'text',
  align,
  weight,
  style,
  ...rest
}: AppTypographyProps) {
  const weightFontFamily = getWeightFontFamily(weight);

  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        {
          color: resolveColor(color),
        },
        align ? { textAlign: align } : null,
        weightFontFamily ? { fontFamily: weightFontFamily } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Display(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="display" />;
}

export function H1(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="h1" />;
}

export function H2(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="h2" />;
}

export function H3(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="h3" />;
}

export function Body(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="body" />;
}

export function BodyStrong(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="bodyStrong" />;
}

export function Caption(props: Omit<AppTypographyProps, 'variant'>) {
  return <Typography {...props} variant="caption" />;
}