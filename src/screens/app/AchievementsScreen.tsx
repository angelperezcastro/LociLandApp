import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';

export function AchievementsScreen({ navigation }: RootScreenProps<'Achievements'>) {
  return (
    <PlaceholderScreen
      title="AchievementsScreen"
      subtitle="Achievements placeholder."
      actions={[
        { label: 'Go Back', onPress: () => navigation.goBack() },
      ]}
    />
  );
}