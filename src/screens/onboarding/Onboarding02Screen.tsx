import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GuideCharacter } from '../../components/guide';
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
      illustration={<GuideCharacter mood="pointing" size="lg" withBubble />}
      primaryActionLabel="Next"
      onPrimaryAction={() => navigation.navigate('Onboarding03')}
      primaryActionDisabled={!selectedPlace}
      secondaryActionLabel="Back"
      onSecondaryAction={() => navigation.goBack()}
      onSkip={handleSkip}
    >
      <View style={styles.grid}>
        <View style={styles.row}>
          <ChoiceCard
            emoji="🏠"
            title="House"
            subtitle="Warm and cozy"
            selected={selectedPlace === 'house'}
            onPress={() => setSelectedPlace('house')}
          />

          <View style={styles.columnGap} />

          <ChoiceCard
            emoji="🏰"
            title="Castle"
            subtitle="Magical rooms"
            selected={selectedPlace === 'castle'}
            onPress={() => setSelectedPlace('castle')}
          />
        </View>

        <View style={styles.row}>
          <ChoiceCard
            emoji="🌲"
            title="Forest"
            subtitle="Nature adventure"
            selected={selectedPlace === 'forest'}
            onPress={() => setSelectedPlace('forest')}
          />

          <View style={styles.columnGap} />

          <ChoiceCard
            emoji="🚀"
            title="Space"
            subtitle="Galaxy journey"
            selected={selectedPlace === 'space'}
            onPress={() => setSelectedPlace('space')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  columnGap: {
    width: spacing.md,
  },
});
