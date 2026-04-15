import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AppTabScreenProps, RootStackParamList } from '../../navigation/types';

export function HomeScreen({ navigation }: AppTabScreenProps<'Home'>) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <PlaceholderScreen
      title="HomeScreen"
      subtitle="Main tab placeholder."
      actions={[
        {
          label: 'Open CreatePalace',
          onPress: () => rootNavigation.navigate('CreatePalace'),
        },
        {
          label: 'Open PalaceDetail',
          onPress: () =>
            rootNavigation.navigate('PalaceDetail', { palaceId: 'demo-palace' }),
          variant: 'secondary',
        },
        {
          label: 'Open Review',
          onPress: () =>
            rootNavigation.navigate('Review', { palaceId: 'demo-palace' }),
          variant: 'secondary',
        },
        {
          label: 'Go to Profile tab',
          onPress: () => navigation.navigate('Profile'),
          variant: 'ghost',
        },
        {
          label: 'Open Component Showcase',
          onPress: () => rootNavigation.navigate('ComponentShowcase'),
          variant: 'ghost',
        },
      ]}
    />
  );
}