import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AuthScreenProps } from '../../navigation/types';

export function Onboarding02Screen({ navigation }: AuthScreenProps<'Onboarding02'>) {
  return (
    <PlaceholderScreen
      title="Onboarding02Screen"
      subtitle="Choose your favourite place."
      actions={[
        { label: 'Back', onPress: () => navigation.goBack(), variant: 'ghost' },
        { label: 'Next', onPress: () => navigation.navigate('Onboarding03') },
      ]}
    />
  );
}