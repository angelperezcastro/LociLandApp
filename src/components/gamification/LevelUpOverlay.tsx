// src/components/gamification/LevelUpOverlay.tsx

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  BounceIn,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';

import { Button } from '../ui/Button';
import {
  colors,
  fontFamilies,
  fontSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { useLevelUpStore } from '../../store/useLevelUpStore';

const levelUpBurstAnimation = require('../../assets/animations/level-up-burst.json');

export const LevelUpOverlay = () => {
  const { width } = useWindowDimensions();
  const currentLevelUp = useLevelUpStore((state) => state.currentLevelUp);
  const dismissLevelUp = useLevelUpStore((state) => state.dismissLevelUp);

  if (!currentLevelUp) {
    return null;
  }

  const badgeSize = Math.min(width * 0.44, 180);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissLevelUp}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={styles.backdrop}
      >
        <View style={styles.animationLayer} pointerEvents="none">
          <LottieView
            source={levelUpBurstAnimation}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <Animated.View entering={ZoomIn.duration(320)} style={styles.card}>
          <Text style={styles.eyebrow}>New rank unlocked</Text>

          <Animated.Text
            entering={BounceIn.delay(120).duration(850)}
            style={styles.title}
          >
            LEVEL UP!
          </Animated.Text>

          <View style={[styles.badge, { width: badgeSize, height: badgeSize }]}>
            <View style={styles.badgeGlow} />
            <Text style={styles.badgeEmoji}>🏆</Text>
            <Text style={styles.badgeLevel}>Level {currentLevelUp.newLevel}</Text>
          </View>

          <Text style={styles.subtitle}>You are now a</Text>

          <Text style={styles.levelTitle}>{currentLevelUp.levelTitle}</Text>

          <Text style={styles.xpText}>Total XP: {currentLevelUp.newXP}</Text>

          <Button
            fullWidth
            title="Awesome!"
            accessibilityLabel="Dismiss level up celebration"
            onPress={dismissLevelUp}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.overlay,
  },
  animationLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '120%',
    height: '120%',
  },
  card: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 4,
    borderColor: colors.primary,
    ...shadows.floating,
  },
  eyebrow: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    textAlign: 'center',
    color: colors.emphasis,
    marginBottom: spacing.lg,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 5,
    borderColor: colors.secondary,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  badgeGlow: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    opacity: 0.45,
  },
  badgeEmoji: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    marginBottom: spacing.xs,
  },
  badgeLevel: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyStrong,
    color: colors.text,
    opacity: 0.76,
  },
  levelTitle: {
    ...typography.h1,
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.text,
  },
  xpText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    marginTop: spacing.sm,
    color: colors.accent,
  },
  button: {
    marginTop: spacing.xl,
  },
  buttonText: {
    color: colors.white,
  },
});
