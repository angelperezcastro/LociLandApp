import React from 'react';
import {
  Image,
  Text,
  View,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

export interface AvatarProps {
  imageUri?: string;
  emojiFallback?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Avatar({
  imageUri,
  emojiFallback = '🦊',
  size = 64,
  style,
  imageStyle,
  textStyle,
}: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.emoji,
            { fontSize: size * 0.45 },
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
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emoji: {
    textAlign: 'center',
  },
});