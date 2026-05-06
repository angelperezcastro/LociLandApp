import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { colors, radius, shadows, spacing } from '../../theme';

const ILLUSTRATION_WIDTH = 270;
const ILLUSTRATION_HEIGHT = 238;
const GLOW_SIZE = 210;
const ANIMATION_WIDTH = 256;
const ANIMATION_HEIGHT = 222;

export function CastleLottieIllustration() {
  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <LottieView
        source={require('../../assets/animations/castle.json')}
        autoPlay
        loop
        resizeMode="contain"
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xxl,
    backgroundColor: colors.accentSoft,
    overflow: 'visible',
    ...shadows.card,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    opacity: 0.62,
  },
  animation: {
    width: ANIMATION_WIDTH,
    height: ANIMATION_HEIGHT,
    marginTop: spacing.xs,
  },
});