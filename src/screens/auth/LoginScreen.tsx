import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AuthScreenProps } from '../../navigation/types';
import { useUserStore } from '../../store/useUserStore';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);

  return (
    <PlaceholderScreen
      title="LoginScreen"
      subtitle="Temporary auth placeholder."
      actions={[
        { label: 'Simulate Login', onPress: () => setAuthenticated(true) },
        {
          label: 'Go to Register',
          onPress: () => navigation.navigate('Register'),
          variant: 'secondary',
        },
      ]}
    />
  );
}