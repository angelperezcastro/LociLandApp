import React from 'react';

import { GuideCharacter } from '../../components/guide';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import type { AuthScreenProps } from '../../navigation/types';
import { setOnboardingSeen } from '../../services/onboardingStorage';

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
      illustration={<GuideCharacter mood="pointing" size="xl" withBubble />}
      primaryActionLabel="Create account"
      onPrimaryAction={handleCreateAccount}
      secondaryActionLabel="Log in"
      onSecondaryAction={handleLogin}
      onSkip={handleLogin}
    />
  );
}
