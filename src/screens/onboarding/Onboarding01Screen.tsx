import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AuthScreenProps } from '../../navigation/types';

export function Onboarding01Screen({ navigation }: AuthScreenProps<'Onboarding01'>) {
  return (
    <PlaceholderScreen
      title="Onboarding01Screen"
      subtitle="Introduction to the memory palace idea."
      actions={[
        { label: 'Next', onPress: () => navigation.navigate('Onboarding02') },
        {
          label: 'Skip to Login',
          onPress: () => navigation.navigate('Login'),
          variant: 'secondary',
        },
      ]}
    />
  );
}