import React from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { Body } from '../../components/ui';
import type { AuthScreenProps } from '../../navigation/types';
import { setOnboardingSeen } from '../../services/onboardingStorage';
import { colors, spacing } from '../../theme';

export function Onboarding03Screen({
  navigation,
}: AuthScreenProps<'Onboarding03'>) {
  const handleCreateAccount = async () => {
    await setOnboardingSeen();
    navigation.replace('Register');
  };

  const handleLogin = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  return (
    <OnboardingLayout
      title="Ready to start!"
      description="You are all set to build your first memory palace and begin your journey."
      illustration={
        <View style={styles.heroCircle}>
          <Body style={styles.heroEmoji}>✨</Body>
        </View>
      }
      primaryActionLabel="Create account"
      onPrimaryAction={handleCreateAccount}
      secondaryActionLabel="Log in"
      onSecondaryAction={handleLogin}
      onSkip={handleLogin}
    />
  );
}

const styles = StyleSheet.create({
  heroCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
});