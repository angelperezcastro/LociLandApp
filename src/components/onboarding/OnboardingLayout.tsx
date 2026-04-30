import React, { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Screen } from '../layout';
import { Button, Body, Caption, H1 } from '../ui';
import { colors, radius, spacing } from '../../theme';

type OnboardingLayoutProps = {
  title: string;
  description: string;
  illustration?: ReactNode;
  children?: ReactNode;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
};

export function OnboardingLayout({
  title,
  description,
  illustration,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  secondaryActionLabel,
  onSecondaryAction,
  onSkip,
  showSkip = true,
}: OnboardingLayoutProps) {
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(18);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);

  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(24);

  useEffect(() => {
    heroOpacity.value = withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
    heroTranslateY.value = withTiming(0, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });

    contentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    contentTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    footerOpacity.value = withTiming(1, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
    footerTranslateY.value = withTiming(0, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
  }, [contentOpacity, contentTranslateY, footerOpacity, footerTranslateY, heroOpacity, heroTranslateY]);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  return (
    <Screen
      scroll
      backgroundColor="bg"
      contentContainerStyle={styles.scrollContent}
      style={styles.inner}
    >
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View />
          {showSkip && onSkip ? (
            <Pressable onPress={onSkip} hitSlop={10} style={styles.skipButton}>
              <Caption style={styles.skipText}>Skip</Caption>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        {illustration ? (
          <Animated.View style={[styles.illustrationContainer, heroAnimatedStyle]}>
            {illustration}
          </Animated.View>
        ) : null}

        <Animated.View style={contentAnimatedStyle}>
          <H1 style={styles.title}>{title}</H1>
          <Body style={styles.description}>{description}</Body>

          {children ? <View style={styles.childrenContainer}>{children}</View> : null}
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <Button
          title={primaryActionLabel}
          onPress={onPrimaryAction}
          disabled={primaryActionDisabled}
        />

        {secondaryActionLabel && onSecondaryAction ? (
          <View style={styles.secondaryButtonWrapper}>
            <Button
              title={secondaryActionLabel}
              variant="ghost"
              onPress={onSecondaryAction}
            />
          </View>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    gap: spacing.lg,
  },
  headerRow: {
    minHeight: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: {
    color: colors.accent,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    textAlign: 'center',
  },
  childrenContainer: {
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  secondaryButtonWrapper: {
    marginTop: spacing.md,
  },
});