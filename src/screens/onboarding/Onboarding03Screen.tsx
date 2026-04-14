import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AuthScreenProps } from '../../navigation/types';

export function Onboarding03Screen({ navigation }: AuthScreenProps<'Onboarding03'>) {
  return (
    <PlaceholderScreen
      title="Onboarding03Screen"
      subtitle="Ready to start."
      actions={[
        { label: 'Back', onPress: () => navigation.goBack(), variant: 'ghost' },
        { label: 'Go to Register', onPress: () => navigation.navigate('Register') },
      ]}
    />
  );
}