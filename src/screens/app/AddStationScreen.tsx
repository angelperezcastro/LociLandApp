import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors, spacing } from '../../theme';
import { Button } from '../../components/ui/Button';

type AddStationRoute = {
  params?: {
    palaceId?: string;
  };
};

function AddStationScreen() {
  const navigation = useNavigation();
  const route = useRoute() as AddStationRoute;

  const palaceId = route.params?.palaceId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>📍</Text>

          <Text style={styles.title}>Add Station</Text>

          <Text style={styles.description}>
            The station builder starts in Week 4. This button is already
            connected to palace{' '}
            <Text style={styles.inlineStrong}>{palaceId ?? 'unknown'}</Text>.
          </Text>

          <Button
            title="Go Back"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 34,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  emoji: {
    fontSize: 74,
    marginBottom: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
    marginBottom: spacing.xl,
  },

  inlineStrong: {
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.text,
  },

  button: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: colors.softYellow,
  },
});

export { AddStationScreen };
export default AddStationScreen;