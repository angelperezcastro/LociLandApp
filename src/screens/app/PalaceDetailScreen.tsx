// src/screens/app/PalaceDetailScreen.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { auth } from '../../services/firebase';
import { getPalaceTemplateById } from '../../assets/templates';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback';
import { StationCard } from '../../components/station/StationCard';
import type { Station } from '../../types';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { normalizeAgeGroup } from '../../utils/ageGroup';

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
  ageGroup?: string | null;
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
  icon?: string;
  imageUrl?: string | null;
  photoUrl?: string | null;
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
    imageUrl: looseStation.imageUri ?? looseStation.imageUrl ?? looseStation.photoUrl ?? null,
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

  const userStore = useUserStore((state) => state as unknown as LooseUserStore);
  const profile = userStore.profile ?? userStore.userProfile ?? null;
  const storeUser = userStore.user ?? userStore.currentUser ?? null;
  const firebaseUser = auth.currentUser;

  const userId =
    profile?.id ??
    profile?.uid ??
    storeUser?.uid ??
    firebaseUser?.uid ??
    null;

  const reviewAgeGroup = normalizeAgeGroup(profile?.ageGroup);

  const palaces = usePalaceStore((state) => state.palaces);
  const stations = usePalaceStore((state) => {
    if (!palaceId) {
      return EMPTY_STATIONS;
    }

    return state.stations[palaceId] ?? EMPTY_STATIONS;
  });

  const isLoading = usePalaceStore((state) => state.isLoading);
  const isLoadingStations = usePalaceStore((state) => state.isLoadingStations);
  const error = usePalaceStore((state) => state.error);
  const loadPalaces = usePalaceStore((state) => state.loadPalaces);
  const loadStations = usePalaceStore((state) => state.loadStations);
  const deleteStation = usePalaceStore((state) => state.deleteStation);
  const reorderStations = usePalaceStore((state) => state.reorderStations);

  const deletingStationIdsRef = useRef<Set<string>>(new Set());
  const isStartingReviewRef = useRef(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isStartingReview, setIsStartingReview] = useState(false);

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
    if (palaceId) {
      navigation.navigate('AddStation', { palaceId });
    }
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

      if (deletingStationIdsRef.current.has(station.id)) {
        return;
      }

      Alert.alert(
        'Delete station?',
        `This will remove "${station.label}" from your palace.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              if (deletingStationIdsRef.current.has(station.id)) {
                return;
              }

              deletingStationIdsRef.current.add(station.id);

              try {
                await deleteStation(station.id, palaceId, userId);
                await loadStations(palaceId, userId);
              } catch (deleteError) {
                Alert.alert(
                  'Station not deleted',
                  getUserFriendlyError(
                    deleteError,
                    'Something went wrong while deleting this station.',
                  ),
                );
              } finally {
                deletingStationIdsRef.current.delete(station.id);
              }
            },
          },
        ],
      );
    },
    [deleteStation, loadStations, palaceId, userId],
  );

  const handleDragEnd = useCallback(
    async ({ data }: { data: Station[] }) => {
      if (!palaceId || !userId || isReordering) {
        return;
      }

      const orderedIds = data.map((station) => station.id);

      try {
        setIsReordering(true);
        await reorderStations(palaceId, userId, orderedIds);
      } catch (reorderError) {
        Alert.alert(
          'Stations not reordered',
          getUserFriendlyError(
            reorderError,
            'Something went wrong while reordering your stations.',
          ),
        );
      } finally {
        setIsReordering(false);
      }
    },
    [isReordering, palaceId, reorderStations, userId],
  );

  const handleStartReview = () => {
    if (isStartingReviewRef.current) {
      return;
    }

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

    isStartingReviewRef.current = true;
    setIsStartingReview(true);

    navigation.navigate('Review', {
      palaceId,
      ageGroup: reviewAgeGroup,
      initialPalace: {
        id: palace.id,
        name: palace.name,
        emoji: template.emoji,
        backgroundColor: template.backgroundColour,
        stationCount: initialStations.length,
      },
      initialStations,
    });

    setTimeout(() => {
      isStartingReviewRef.current = false;
      setIsStartingReview(false);
    }, 900);
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
            <Text style={styles.palaceName}>{palace.name}</Text>
            <Text style={styles.palaceDescription}>{template.description}</Text>

            <View style={styles.stationCountBadge}>
              <Text style={styles.stationCountText}>
                🚩 {visibleStationCount} stations
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Memory route</Text>
          <Text style={styles.sectionHint}>{sectionHint}</Text>
        </View>

        {shouldShowLargePalaceWarning ? (
          <View style={styles.largePalaceNotice}>
            <Text style={styles.largePalaceEmoji}>🧭</Text>
            <View style={styles.largePalaceCopy}>
              <Text style={styles.largePalaceTitle}>That is a big palace!</Text>
              <Text style={styles.largePalaceText}>
                Smaller palaces are easier to memorise.
              </Text>
            </View>
          </View>
        ) : null}
      </>
    );
  };

  const renderEmptyList = () => {
    if (isLoadingStations || visibleStationCount > 0) {
      return (
        <LoadingState
          title="Loading stations..."
          message="Preparing this memory route."
          variant="card"
        />
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
          <Text style={styles.emptyEmoji}>🚩</Text>
        </View>

        <Text style={styles.emptyTitle}>Add your first memory station!</Text>
        <Text style={styles.emptyText}>
          Choose a place in your palace and place something you want to
          remember there.
        </Text>

        <Button
          title="Add station"
          variant="primary"
          onPress={handleAddStation}
          style={styles.emptyButton}
        />
      </View>
    );
  };

  if (!palaceId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ErrorState
            fullScreen
            title="Palace route missing"
            message="Go back and open this palace again."
            onAction={handleGoBack}
            actionLabel="Back"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!palace && isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <LoadingState
            title="Opening palace..."
            message="Getting this memory palace ready."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!palace || !template) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ErrorState
            fullScreen
            title="Palace not found"
            message={error ?? 'This palace could not be loaded.'}
            onAction={handleGoBack}
            actionLabel="Back home"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.patternLayer} pointerEvents="none">
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
          accessibilityLabel="Go back"
          activeOpacity={0.86}
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <Button
          title={
            isStartingReview
              ? 'Starting...'
              : canStartReview
                ? 'Start Review'
                : 'Need 2 stations'
          }
          variant={canStartReview ? 'secondary' : 'outline'}
          disabled={!canStartReview || isStartingReview}
          onPress={handleStartReview}
          style={styles.reviewButton}
          textStyle={styles.reviewButtonText}
        />
      </View>

      <DraggableFlatList
        key={stationListRenderKey}
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={renderStationItem}
        onDragEnd={handleDragEnd}
        ItemSeparatorComponent={() => <View style={styles.stationSeparator} />}
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
    borderRadius: radius.pill,
    opacity: 0.22,
  },
  patternCircleSmall: {
    position: 'absolute',
    top: 310,
    left: -52,
    width: 132,
    height: 132,
    borderRadius: radius.pill,
    opacity: 0.18,
  },
  patternBlob: {
    position: 'absolute',
    bottom: 110,
    right: 28,
    width: 92,
    height: 92,
    borderRadius: radius.xl,
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
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
    ...shadows.soft,
  },
  backButtonText: {
    ...typography.display,
    color: colors.text,
    lineHeight: 42,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  reviewButton: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
  },
  reviewButtonText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
  },
  listContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  stationItemWrapper: {
    minHeight: 96,
  },
  stationSeparator: {
    height: spacing.md,
  },
  dragPlaceholder: {
    minHeight: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primarySoft,
    opacity: 0.75,
  },
  heroCard: {
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  palaceEmojiShell: {
    width: 118,
    height: 118,
    borderRadius: radius.xxl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text,
    marginBottom: spacing.lg,
  },
  palaceEmoji: {
    ...typography.display,
    fontSize: fontSizes.display + fontSizes.xxl + spacing.xs,
    lineHeight: 74,
  },
  heroTextBlock: {
    alignItems: 'center',
  },
  palaceName: {
    ...typography.h1,
    maxWidth: 330,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  palaceDescription: {
    ...typography.bodyStrong,
    maxWidth: 320,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stationCountBadge: {
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stationCountText: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sectionHint: {
    ...typography.small,
    marginTop: spacing.xs,
    color: colors.muted,
    fontFamily: fontFamilies.bodyBold,
  },
  largePalaceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.bg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  largePalaceEmoji: {
    ...typography.h1,
    fontSize: fontSizes.xxl,
  },
  largePalaceCopy: {
    flex: 1,
  },
  largePalaceTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  largePalaceText: {
    ...typography.caption,
    marginTop: spacing.xxs,
    color: colors.textSoft,
  },
  emptyStateCard: {
    alignItems: 'center',
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...shadows.card,
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
    ...typography.display,
    fontSize: fontSizes.display + fontSizes.xxl + spacing.xs + spacing.xxs,
    lineHeight: 76,
  },
  emptyTitle: {
    ...typography.h1,
    maxWidth: 310,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyStrong,
    maxWidth: 320,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minHeight: 58,
    borderRadius: radius.xl,
    borderWidth: 3,
    backgroundColor: colors.primarySoft,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.text,
    ...shadows.floating,
  },
  fabText: {
    ...typography.display,
    color: colors.text,
    fontSize: fontSizes.display + spacing.xs,
    lineHeight: 42,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  centerState: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { PalaceDetailScreen };
export default PalaceDetailScreen;
