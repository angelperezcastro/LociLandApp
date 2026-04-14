import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import type { AuthScreenProps } from '../../navigation/types';
import { setOnboardingSeen } from '../../services/onboardingStorage';
import { spacing } from '../../theme';

type PlaceOption = 'house' | 'castle' | 'forest' | 'space';

export function Onboarding02Screen({
  navigation,
}: AuthScreenProps<'Onboarding02'>) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);

  const handleSkip = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  return (
    <OnboardingLayout
      title="Pick your favourite place"
      description="Choose a world you would love to walk through in your imagination."
      primaryActionLabel="Next"
      onPrimaryAction={() => navigation.navigate('Onboarding03')}
      primaryActionDisabled={!selectedPlace}
      secondaryActionLabel="Back"
      onSecondaryAction={() => navigation.goBack()}
      onSkip={handleSkip}
    >
      <View style={styles.grid}>
        <ChoiceCard
          emoji="🏠"
          title="House"
          subtitle="Warm and cozy"
          selected={selectedPlace === 'house'}
          onPress={() => setSelectedPlace('house')}
        />

        <ChoiceCard
          emoji="🏰"
          title="Castle"
          subtitle="Magical rooms"
          selected={selectedPlace === 'castle'}
          onPress={() => setSelectedPlace('castle')}
        />

        <ChoiceCard
          emoji="🌲"
          title="Forest"
          subtitle="Nature adventure"
          selected={selectedPlace === 'forest'}
          onPress={() => setSelectedPlace('forest')}
        />

        <ChoiceCard
          emoji="🚀"
          title="Space"
          subtitle="Galaxy journey"
          selected={selectedPlace === 'space'}
          onPress={() => setSelectedPlace('space')}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
});