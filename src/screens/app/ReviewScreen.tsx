import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';

export function ReviewScreen({ navigation, route }: RootScreenProps<'Review'>) {
  const palaceId = route.params?.palaceId ?? 'no-id';

  return (
    <PlaceholderScreen
      title="ReviewScreen"
      subtitle={`Review placeholder for palaceId: ${palaceId}`}
      actions={[
        { label: 'Finish Review', onPress: () => navigation.goBack() },
      ]}
    />
  );
}