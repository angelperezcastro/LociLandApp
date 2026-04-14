import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { AppTabScreenProps } from '../../navigation/types';
import type { RootStackParamList } from '../../navigation/types';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';

export function ProfileScreen({ navigation }: AppTabScreenProps<'Profile'>) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clearUser = useUserStore((state) => state.clearUser);
  const clearPalaces = usePalaceStore((state) => state.clearPalaces);

  const handleLogout = () => {
    clearPalaces();
    clearUser();
  };

  return (
    <PlaceholderScreen
      title="ProfileScreen"
      subtitle="Profile tab placeholder."
      actions={[
        {
          label: 'Open Achievements',
          onPress: () => rootNavigation.navigate('Achievements'),
        },
        {
          label: 'Go to Home tab',
          onPress: () => navigation.navigate('Home'),
          variant: 'secondary',
        },
        {
          label: 'Logout',
          onPress: handleLogout,
          variant: 'ghost',
        },
      ]}
    />
  );
}