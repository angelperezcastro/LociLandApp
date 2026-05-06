import React from 'react';

import { CastleLottieIllustration } from '../../components/onboarding/CastleLottieIllustration';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import type { AuthScreenProps } from '../../navigation/types';
import { setOnboardingSeen } from '../../services/onboardingStorage';

export function Onboarding01Screen({
  navigation,
}: AuthScreenProps<'Onboarding01'>) {
  const handleSkip = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  return (
    <OnboardingLayout
      title="What is a Memory Palace?"
      description="It is a fun way to remember things by placing them inside a place you know in your mind."
      illustration={<CastleLottieIllustration />}
      primaryActionLabel="Next"
      onPrimaryAction={() => navigation.navigate('Onboarding02')}
      onSkip={handleSkip}
    />
  );
}