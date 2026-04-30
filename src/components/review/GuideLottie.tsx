import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  GuideCharacter,
  type GuideCharacterMood,
} from '../guide';

type GuideVariant =
  | 'forward'
  | 'encourage'
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'pointing';

type GuideLottieProps = {
  size?: number;
  variant?: GuideVariant;
};

const GUIDE_MOOD_BY_VARIANT: Record<GuideVariant, GuideCharacterMood> = {
  forward: 'pointing',
  encourage: 'idle',
  idle: 'idle',
  happy: 'happy',
  thinking: 'thinking',
  pointing: 'pointing',
};

export function GuideLottie({
  size = 220,
  variant = 'forward',
}: GuideLottieProps) {
  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <GuideCharacter
        mood={GUIDE_MOOD_BY_VARIANT[variant]}
        size={size}
        withBubble={false}
      />
    </View>
  );
}

export default GuideLottie;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
});
