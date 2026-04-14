import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';

export function PalaceDetailScreen({
  navigation,
  route,
}: RootScreenProps<'PalaceDetail'>) {
  const palaceId = route.params?.palaceId ?? 'no-id';

  return (
    <PlaceholderScreen
      title="PalaceDetailScreen"
      subtitle={`palaceId: ${palaceId}`}
      actions={[
        {
          label: 'Start Review',
          onPress: () => navigation.navigate('Review', { palaceId }),
        },
        {
          label: 'Go Back',
          onPress: () => navigation.goBack(),
          variant: 'ghost',
        },
      ]}
    />
  );
}