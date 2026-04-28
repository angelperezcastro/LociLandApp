import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import { colors, spacing } from '../../theme';
import { auth } from '../../services/firebase';
import { getPalaceTemplateById } from '../../assets/templates';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../../components/ui/Button';
import { StationCard } from '../../components/station/StationCard';
import type { Station } from '../../types';

const EMPTY_STATIONS: Station[] = [];
const MIN_REVIEW_STATIONS = 2;
const LARGE_PALACE_WARNING_THRESHOLD = 20;

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

type LooseStation = Station & {
  name?: string;
  emoji?: string;
  icon?: string;
  imageUrl?: string | null;
  imageUri?: string | null;
  photoUrl?: string | null;
  memoryText?: string;
  answerText?: string;
  answer?: string;
  position?: number;
  index?: number;
};

const getStationName = (station: LooseStation, fallbackIndex: number) => {
  return station.label ?? station.name ?? `Station ${fallbackIndex + 1}`;
};

const getStationOrder = (station: LooseStation, fallbackIndex: number) => {
  if (typeof station.order === 'number') {
    return station.order;
  }

  if (typeof station.position === 'number') {
    return station.position;
  }

  if (typeof station.index === 'number') {
    return station.index;
  }

  return fallbackIndex;
};

const mapStationForReview = (station: Station, index: number) => {
  const looseStation = station as LooseStation;
  const stationName = getStationName(looseStation, index);

  return {
    id: station.id,
    name: stationName,
    emoji: looseStation.emoji ?? looseStation.icon ?? '📍',
    imageUrl:
      looseStation.imageUri ??
      looseStation.imageUrl ??
      looseStation.photoUrl ??
      null,
    order: getStationOrder(looseStation, index),
    answerText:
      looseStation.memoryText ??
      looseStation.answerText ??
      looseStation.answer ??
      stationName,
  };
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

  const stations = usePalaceStore((state) => {
    if (!palaceId) {
      return EMPTY_STATIONS;
    }

    return state.stations[palaceId] ?? EMPTY_STATIONS;
  });

  const isLoading = usePalaceStore((state) => state.isLoading);
  const isLoadingStations = usePalaceStore(
    (state) => state.isLoadingStations,
  );
  const error = usePalaceStore((state) => state.error);
  const loadPalaces = usePalaceStore((state) => state.loadPalaces);
  const loadStations = usePalaceStore((state) => state.loadStations);
  const deleteStation = usePalaceStore((state) => state.deleteStation);
  const reorderStations = usePalaceStore((state) => state.reorderStations);

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

  useFocusEffect(
    useCallback(() => {
      if (!palaceId || !userId) {
        return undefined;
      }

      loadStations(palaceId, userId).catch(() => {
        // The store already keeps the error.
      });

      return undefined;
    }, [loadStations, palaceId, userId]),
  );

  useEffect(() => {
    if (!error) {
      return;
    }

    Alert.alert('Something went wrong', error);
  }, [error]);

  const template = palace ? getPalaceTemplateById(palace.templateId) : null;
  const hasStations = stations.length > 0;

  const visibleStationCount = Math.max(
    palace?.stationCount ?? 0,
    stations.length,
  );

  const canStartReview = Boolean(
    palace && visibleStationCount >= MIN_REVIEW_STATIONS,
  );

  const shouldShowLargePalaceWarning =
    visibleStationCount >= LARGE_PALACE_WARNING_THRESHOLD;

  const stationListRenderKey = useMemo(
    () =>
      `${palaceId ?? 'no-palace'}-${stations.length}-${stations
        .map((station) => `${station.id}:${station.order}:${station.label}`)
        .join('|')}`,
    [palaceId, stations],
  );

  const sectionHint = useMemo(() => {
    if (hasStations && visibleStationCount < MIN_REVIEW_STATIONS) {
      return 'Add one more station to start review mode';
    }

    if (hasStations) {
      return 'Hold a card and drag it to reorder your route';
    }

    if (visibleStationCount > 0) {
      return 'Loading your stations...';
    }

    return 'Add stations to build your memory route';
  }, [hasStations, visibleStationCount]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddStation = () => {
    if (!palaceId) {
      return;
    }

    navigation.navigate('AddStation', { palaceId });
  };

  const handleEditStation = useCallback(
    (station: Station) => {
      if (!palaceId) {
        return;
      }

      navigation.navigate('EditStation', {
        palaceId,
        stationId: station.id,
      });
    },
    [navigation, palaceId],
  );

  const handleDeleteStation = useCallback(
    (station: Station) => {
      if (!palaceId || !userId) {
        return;
      }

      Alert.alert(
        'Delete station?',
        `This will remove "${station.label}" from your palace.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteStation(station.id, palaceId, userId)
                .then(() => loadStations(palaceId, userId))
                .catch((deleteError) => {
                  Alert.alert(
                    'Station not deleted',
                    deleteError instanceof Error
                      ? deleteError.message
                      : 'Something went wrong while deleting this station.',
                  );
                });
            },
          },
        ],
      );
    },
    [deleteStation, loadStations, palaceId, userId],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: Station[] }) => {
      if (!palaceId || !userId) {
        return;
      }

      const orderedIds = data.map((station) => station.id);

      reorderStations(palaceId, userId, orderedIds).catch((reorderError) => {
        Alert.alert(
          'Stations not reordered',
          reorderError instanceof Error
            ? reorderError.message
            : 'Something went wrong while reordering your stations.',
        );
      });
    },
    [palaceId, reorderStations, userId],
  );

  const handleStartReview = () => {
    if (!palaceId) {
      Alert.alert(
        'Review unavailable',
        'This palace could not be opened because its route is missing.',
      );
      return;
    }

    if (!canStartReview) {
      Alert.alert(
        'Add more stations',
        'You need at least 2 stations before starting review mode.',
      );
      return;
    }

    if (!palace || !template) {
      Alert.alert(
        'Review unavailable',
        'This palace is not ready yet. Go back and try again.',
      );
      return;
    }

    if (stations.length < MIN_REVIEW_STATIONS) {
      Alert.alert(
        'Stations still loading',
        'Wait a second until your memory stations are fully loaded.',
      );
      return;
    }

    const initialStations = [...stations]
      .sort((a, b) => {
        const firstOrder = typeof a.order === 'number' ? a.order : 0;
        const secondOrder = typeof b.order === 'number' ? b.order : 0;

        return firstOrder - secondOrder;
      })
      .map(mapStationForReview);

    navigation.navigate('Review', {
      palaceId,
      initialPalace: {
        id: palace.id,
        name: palace.name,
        emoji: template.emoji,
        backgroundColor: template.backgroundColour,
        stationCount: initialStations.length,
      },
      initialStations,
    });
  };

  const renderStationItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Station>) => (
      <ScaleDecorator>
        <View style={styles.stationItemWrapper}>
          <StationCard
            station={item}
            isActive={isActive}
            onEdit={handleEditStation}
            onDelete={handleDeleteStation}
            onDrag={drag}
          />
        </View>
      </ScaleDecorator>
    ),
    [handleDeleteStation, handleEditStation],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.stationSeparator} />,
    [],
  );

  const renderLargePalaceWarning = () => {
    if (!shouldShowLargePalaceWarning) {
      return null;
    }

    return (
      <View style={styles.largePalaceNotice}>
        <Text style={styles.largePalaceEmoji}>🏰</Text>

        <View style={styles.largePalaceCopy}>
          <Text style={styles.largePalaceTitle}>That’s a big palace!</Text>
          <Text style={styles.largePalaceText}>
            Smaller palaces are easier to memorise.
          </Text>
        </View>
      </View>
    );
  };

  const renderListHeader = () => {
    if (!palace || !template) {
      return null;
    }

    return (
      <>
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
                🚩 {visibleStationCount}{' '}
                {visibleStationCount === 1 ? 'station' : 'stations'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Memory stations</Text>
          <Text style={styles.sectionHint}>{sectionHint}</Text>
        </View>

        {renderLargePalaceWarning()}
      </>
    );
  };

  const renderEmptyList = () => {
    if (isLoadingStations || visibleStationCount > 0) {
      return (
        <View style={styles.loadingStationsCard}>
          <ActivityIndicator size="small" color={colors.text} />
          <Text style={styles.loadingStationsText}>Loading stations...</Text>
        </View>
      );
    }

    return (
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

        <Text style={styles.emptyTitle}>Add your first memory station!</Text>

        <Text style={styles.emptyText}>
          Stations are the stops in your palace. Place ideas, words, dates, or
          images inside each one.
        </Text>

        <Button
          title="＋ Add station"
          variant="primary"
          onPress={handleAddStation}
          style={styles.emptyButton}
        />
      </View>
    );
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

      <DraggableFlatList
        data={stations}
        extraData={stationListRenderKey}
        keyExtractor={(item) => item.id}
        renderItem={renderStationItem}
        ItemSeparatorComponent={renderSeparator}
        onDragEnd={handleDragEnd}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.scrollContent}
        containerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        activationDistance={20}
        autoscrollThreshold={90}
        autoscrollSpeed={80}
        dragItemOverflow
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        renderPlaceholder={() => <View style={styles.dragPlaceholder} />}
      />

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

  listContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 128,
  },

  stationItemWrapper: {
    minHeight: 96,
  },

  stationSeparator: {
    height: spacing.md,
  },

  dragPlaceholder: {
    minHeight: 96,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.softYellow,
    opacity: 0.75,
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

  largePalaceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.softYellow,
    backgroundColor: colors.bg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  largePalaceEmoji: {
    fontSize: 34,
  },

  largePalaceCopy: {
    flex: 1,
  },

  largePalaceTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Nunito_800ExtraBold',
  },

  largePalaceText: {
    marginTop: 2,
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.74,
  },

  loadingStationsCard: {
    borderRadius: 26,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  loadingStationsText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
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