import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors, spacing } from '../../theme';
import { auth } from '../../services/firebase';
import { getPalaceTemplateById } from '../../assets/templates';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../../components/ui/Button';
import { StationCard } from '../../components/station/StationCard';
import type { Station } from '../../types';

type PalaceDetailRoute = {
  params?: {
    palaceId?: string;
  };
};

type LooseUserProfile = {
  id?: string;
  uid?: string;
};

type LooseAuthUser = {
  uid?: string;
};

type LooseUserStore = {
  profile?: LooseUserProfile | null;
  userProfile?: LooseUserProfile | null;
  user?: LooseAuthUser | null;
  currentUser?: LooseAuthUser | null;
};

function PalaceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute() as PalaceDetailRoute;

  const palaceId = route.params?.palaceId ?? null;

  const userStore = useUserStore(
    (state) => state as unknown as LooseUserStore,
  );

  const profile = userStore.profile ?? userStore.userProfile ?? null;
  const storeUser = userStore.user ?? userStore.currentUser ?? null;
  const firebaseUser = auth.currentUser;

  const userId =
    profile?.id ??
    profile?.uid ??
    storeUser?.uid ??
    firebaseUser?.uid ??
    null;

  const palaces = usePalaceStore((state) => state.palaces);
  const isLoading = usePalaceStore((state) => state.isLoading);
  const error = usePalaceStore((state) => state.error);
  const loadPalaces = usePalaceStore((state) => state.loadPalaces);

  const palace = useMemo(() => {
    if (!palaceId) {
      return undefined;
    }

    return palaces.find((item) => item.id === palaceId);
  }, [palaceId, palaces]);

  useEffect(() => {
    if (!palaceId || !userId || palace) {
      return;
    }

    loadPalaces(userId).catch(() => {
      // The store already keeps the error.
    });
  }, [loadPalaces, palace, palaceId, userId]);

  useEffect(() => {
    if (!error) {
      return;
    }

    Alert.alert('Something went wrong', error);
  }, [error]);

  const stations: Station[] = [];

  const template = palace ? getPalaceTemplateById(palace.templateId) : null;
  const hasStations = stations.length > 0;
  const canStartReview = Boolean(palace && palace.stationCount > 0);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddStation = () => {
    if (!palaceId) {
      return;
    }

    navigation.navigate('AddStation', { palaceId });
  };

  const handleStartReview = () => {
    if (!palaceId || !canStartReview) {
      return;
    }

    navigation.navigate('Review', { palaceId });
  };

  if (!palaceId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>🏛️</Text>
          <Text style={styles.centerTitle}>Palace not found</Text>
          <Text style={styles.centerText}>
            This palace could not be opened because its route is missing.
          </Text>

          <Button
            title="Go Back"
            variant="primary"
            onPress={handleGoBack}
            style={styles.centerButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!palace && isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={styles.loadingText}>Loading palace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!palace || !template) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>🔎</Text>
          <Text style={styles.centerTitle}>Palace not found</Text>
          <Text style={styles.centerText}>
            This palace is not available locally yet. Go back and try again.
          </Text>

          <Button
            title="Go Back"
            variant="primary"
            onPress={handleGoBack}
            style={styles.centerButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.patternLayer}>
        <View
          style={[
            styles.patternCircleLarge,
            { backgroundColor: template.backgroundColour },
          ]}
        />
        <View
          style={[
            styles.patternCircleSmall,
            { backgroundColor: template.backgroundColour },
          ]}
        />
        <View
          style={[
            styles.patternBlob,
            { backgroundColor: template.backgroundColour },
          ]}
        />
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back to Home"
          activeOpacity={0.86}
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <Button
          title="Start Review"
          variant="primary"
          disabled={!canStartReview}
          onPress={handleStartReview}
          fullWidth={false}
          style={[
            styles.reviewButton,
            canStartReview && styles.reviewButtonEnabled,
          ]}
          textStyle={styles.reviewButtonText}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View
            style={[
              styles.palaceEmojiShell,
              { backgroundColor: template.backgroundColour },
            ]}
          >
            <Text style={styles.palaceEmoji}>{template.emoji}</Text>
          </View>

          <View style={styles.heroTextBlock}>
            <Text numberOfLines={2} style={styles.palaceName}>
              {palace.name}
            </Text>

            <Text style={styles.palaceDescription}>
              {template.description}
            </Text>

            <View style={styles.stationCountBadge}>
              <Text style={styles.stationCountText}>
                🚩 {palace.stationCount}{' '}
                {palace.stationCount === 1 ? 'station' : 'stations'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Memory stations</Text>
          <Text style={styles.sectionHint}>Week 4 will fill this list</Text>
        </View>

        {hasStations ? (
          <View style={styles.stationList}>
            {stations.map((station) => (
              <StationCard
                key={station.id}
                order={station.order}
                emoji={station.emoji}
                label={station.label}
                memoryText={station.memoryText}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIllustration}>
              <LottieView
                source={require('../../assets/animations/wizard-beckoning.json')}
                autoPlay
                loop
                style={styles.emptyAnimation}
              />
              <Text style={styles.emptyEmoji}>📍</Text>
            </View>

            <Text style={styles.emptyTitle}>
              Add your first memory station!
            </Text>

            <Text style={styles.emptyText}>
              Stations are the stops in your palace. Soon you will place ideas,
              words, dates, or images inside each one.
            </Text>

            <Button
              title="＋ Add station"
              variant="primary"
              onPress={handleAddStation}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add a new memory station"
        activeOpacity={0.86}
        onPress={handleAddStation}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },

  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  patternCircleLarge: {
    position: 'absolute',
    top: 88,
    right: -80,
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.22,
  },

  patternCircleSmall: {
    position: 'absolute',
    top: 310,
    left: -52,
    width: 132,
    height: 132,
    borderRadius: 66,
    opacity: 0.18,
  },

  patternBlob: {
    position: 'absolute',
    bottom: 110,
    right: 28,
    width: 92,
    height: 92,
    borderRadius: 34,
    opacity: 0.16,
    transform: [{ rotate: '18deg' }],
  },

  topBar: {
    minHeight: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 9,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  backButtonText: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 42,
    fontFamily: 'FredokaOne_400Regular',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: Platform.OS === 'android' ? -3 : -1,
  },

  reviewButton: {
    minHeight: 46,
    alignSelf: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.white,
  },

  reviewButtonEnabled: {
    backgroundColor: colors.softYellow,
  },

  reviewButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 128,
  },

  heroCard: {
    borderRadius: 34,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  palaceEmojiShell: {
    width: 118,
    height: 118,
    borderRadius: 38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text,
    marginBottom: spacing.lg,
  },

  palaceEmoji: {
    fontSize: 68,
  },

  heroTextBlock: {
    alignItems: 'center',
  },

  palaceName: {
    maxWidth: 330,
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  palaceDescription: {
    maxWidth: 320,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
    marginBottom: spacing.md,
  },

  stationCountBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },

  stationCountText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'FredokaOne_400Regular',
  },

  sectionHint: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },

  stationList: {
    marginTop: spacing.xs,
  },

  emptyStateCard: {
    borderRadius: 34,
    paddingHorizontal: spacing.lg,
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

  emptyIllustration: {
    width: 158,
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyAnimation: {
    position: 'absolute',
    width: 158,
    height: 158,
  },

  emptyEmoji: {
    fontSize: 70,
  },

  emptyTitle: {
    maxWidth: 310,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  emptyText: {
    maxWidth: 320,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
    marginBottom: spacing.lg,
  },

  emptyButton: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: colors.softYellow,
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 68,
    height: 68,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softYellow,
    borderWidth: 3,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  fabText: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 42,
    fontFamily: 'FredokaOne_400Regular',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  centerState: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerEmoji: {
    fontSize: 74,
    marginBottom: spacing.md,
  },

  centerTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  centerText: {
    maxWidth: 310,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
    marginBottom: spacing.xl,
  },

  centerButton: {
    maxWidth: 260,
  },

  loadingText: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
});

export { PalaceDetailScreen };
export default PalaceDetailScreen;