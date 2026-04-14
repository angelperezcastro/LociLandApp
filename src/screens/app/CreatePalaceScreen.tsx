import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';

export function CreatePalaceScreen({ navigation }: RootScreenProps<'CreatePalace'>) {
  return (
    <PlaceholderScreen
      title="CreatePalaceScreen"
      subtitle="Palace creation placeholder."
      actions={[
        { label: 'Go Back', onPress: () => navigation.goBack() },
      ]}
    />
  );
}