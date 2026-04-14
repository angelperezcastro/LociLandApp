import React from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

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
      illustration={
        <LottieView
          source={require('../../assets/animations/castle.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      }
      primaryActionLabel="Next"
      onPrimaryAction={() => navigation.navigate('Onboarding02')}
      onSkip={handleSkip}
    />
  );
}

const styles = StyleSheet.create({
  lottie: {
    width: 280,
    height: 280,
  },
});