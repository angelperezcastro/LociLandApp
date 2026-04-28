import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

type GuideVariant = 'forward' | 'encourage';

type GuideLottieProps = {
  size?: number;
  variant?: GuideVariant;
};

export function GuideLottie({
  size = 220,
  variant = 'forward',
}: GuideLottieProps) {
  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <LottieView
        source={require('../../assets/animations/review-guide.json')}
        autoPlay
        loop
        speed={variant === 'forward' ? 1 : 0.9}
        resizeMode="contain"
        style={styles.animation}
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

  animation: {
    width: '100%',
    height: '100%',
  },
});