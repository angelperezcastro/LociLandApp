import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AuthScreenProps } from '../../navigation/types';
import { useUserStore } from '../../store/useUserStore';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);

  return (
    <PlaceholderScreen
      title="RegisterScreen"
      subtitle="Temporary register placeholder."
      actions={[
        { label: 'Simulate Register', onPress: () => setAuthenticated(true) },
        {
          label: 'Back to Login',
          onPress: () => navigation.navigate('Login'),
          variant: 'secondary',
        },
      ]}
    />
  );
}