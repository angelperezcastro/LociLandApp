// src/components/ui/Avatar.tsx

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | number;

export interface AvatarProps {
  imageUri?: string;
  emojiFallback?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const sizeMap: Record<'sm' | 'md' | 'lg', number> = {
  sm: 40,
  md: 64,
  lg: 96,
};

function resolveSize(size: AvatarSize): number {
  return typeof size === 'number' ? size : sizeMap[size];
}

export function Avatar({
  imageUri,
  emojiFallback = '🦊',
  size = 'md',
  style,
  imageStyle,
  textStyle,
}: AvatarProps) {
  const resolvedSize = resolveSize(size);

  return (
    <View
      style={[
        styles.base,
        {
          width: resolvedSize,
          height: resolvedSize,
          borderRadius: resolvedSize / 2,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          resizeMode="cover"
          style={[
            {
              width: resolvedSize,
              height: resolvedSize,
              borderRadius: resolvedSize / 2,
            },
            imageStyle,
          ]}
        />
      ) : (
        <Text
          style={[
            styles.emoji,
            {
              fontSize: resolvedSize * 0.42,
            },
            textStyle,
          ]}
        >
          {emojiFallback}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  emoji: {
    textAlign: 'center',
  },
});