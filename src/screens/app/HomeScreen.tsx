import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing } from '../../theme';
import type { Palace } from '../../types';
import { auth } from '../../services/firebase';
import { getPalaceTemplateById } from '../../assets/templates';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { PalaceCard } from '../../components/palace/PalaceCard';
import { DeletePalaceSheet } from '../../components/palace/DeletePalaceSheet';
import { Button } from '../../components/ui/Button';

type LooseUserProfile = {
  id?: string;
  uid?: string;
  displayName?: string;
  email?: string;
  avatarEmoji?: string;
};

type LooseAuthUser = {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
};

type LooseUserStore = {
  profile?: LooseUserProfile | null;
  userProfile?: LooseUserProfile | null;
  user?: LooseAuthUser | null;
  currentUser?: LooseAuthUser | null;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [palaceToDelete, setPalaceToDelete] = useState<Palace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const displayName = useMemo(() => {
    const rawName =
      profile?.displayName ??
      storeUser?.displayName ??
      firebaseUser?.displayName ??
      firebaseUser?.email?.split('@')[0] ??
      'Explorer';

    return rawName.trim() || 'Explorer';
  }, [firebaseUser?.displayName, firebaseUser?.email, profile, storeUser]);

  const avatarEmoji = profile?.avatarEmoji ?? '🧙‍♂️';

  const palaces = usePalaceStore((state) => state.palaces);
  const isLoading = usePalaceStore((state) => state.isLoading);
  const error = usePalaceStore((state) => state.error);
  const loadPalaces = usePalaceStore((state) => state.loadPalaces);
  const deletePalace = usePalaceStore((state) => state.deletePalace);
  const clearError = usePalaceStore((state) => state.clearError);

  const showInitialLoading =
    isLoading && palaces.length === 0 && !isRefreshing;

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadPalaces(userId).catch(() => {
      // Store handles the error. Alert is handled below.
    });
  }, [loadPalaces, userId]);

  useEffect(() => {
    if (!error) {
      return;
    }

    Alert.alert('Something went wrong', error, [
      {
        text: 'OK',
        onPress: clearError,
      },
    ]);
  }, [clearError, error]);

  const handleCreatePalace = () => {
    navigation.navigate('CreatePalace');
  };

  const handleOpenPalace = (palaceId: string) => {
    navigation.navigate('PalaceDetail', { palaceId });
  };

  const handleReviewPalace = (palaceId: string) => {
    navigation.navigate('Review', { palaceId });
  };

  const handleRefresh = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsRefreshing(true);

    try {
      await loadPalaces(userId);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not refresh your palaces.';

      Alert.alert('Refresh failed', message);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPalaces, userId]);

  const handleRequestDelete = useCallback(
    (palaceId: string) => {
      const palace = palaces.find((item) => item.id === palaceId);

      if (!palace) {
        Alert.alert(
          'Palace unavailable',
          'This palace could not be found locally. Pull to refresh and try again.',
        );
        return;
      }

      setPalaceToDelete(palace);
    },
    [palaces],
  );

  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }

    setPalaceToDelete(null);
  };

  const handleConfirmDelete = async (palace: Palace) => {
    if (!userId) {
      Alert.alert('Account still loading', 'Please wait and try again.');
      return;
    }

    setIsDeleting(true);

    try {
      await deletePalace(palace.id, userId);
      setPalaceToDelete(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not delete this palace.';

      Alert.alert('Delete failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderPalace = ({ item }: { item: Palace }) => {
    const template = getPalaceTemplateById(item.templateId);

    return (
      <View
        style={[
          styles.palaceItemShell,
          { backgroundColor: template.backgroundColour },
        ]}
      >
        <PalaceCard
          palace={item}
          onPress={handleOpenPalace}
          onReviewPress={handleReviewPalace}
          onLongPress={handleRequestDelete}
          style={styles.palaceCardInsideShell}
        />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (showInitialLoading) {
      return <HomeLoadingState />;
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIllustrationWrapper}>
          <LottieView
            source={require('../../assets/animations/wizard-beckoning.json')}
            autoPlay
            loop
            style={styles.emptyAnimation}
          />

          <Text style={styles.emptyWizardEmoji}>🧙‍♂️</Text>
        </View>

        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Create your first palace!</Text>

          <Text style={styles.emptyText}>
            Pick a magical place, add memory stations, and start building your
            own memory journey.
          </Text>
        </View>

        <View style={styles.emptyButtonWrapper}>
          <Button
            title="✨ Start building ✨"
            variant="primary"
            onPress={handleCreatePalace}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={palaces}
        keyExtractor={(item) => item.id}
        renderItem={renderPalace}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Hello, {displayName}! 👋</Text>
              <Text style={styles.subtitle}>
                Ready to visit your memory palaces?
              </Text>
            </View>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarHeight + 128,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor={colors.softYellow}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {palaces.length > 0 && isLoading && !isRefreshing ? (
        <View style={styles.loadingPill}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.loadingPillText}>Syncing palaces...</Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create a new palace"
        activeOpacity={0.85}
        onPress={handleCreatePalace}
        style={[
          styles.fab,
          {
            bottom: tabBarHeight + spacing.md,
          },
        ]}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <DeletePalaceSheet
        visible={palaceToDelete !== null}
        palace={palaceToDelete}
        isDeleting={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

function HomeLoadingState() {
  return (
    <View style={styles.loadingState}>
      <Text style={styles.loadingTitle}>Loading your palaces...</Text>

      <SkeletonPalaceCard />
      <SkeletonPalaceCard />
      <SkeletonPalaceCard />
    </View>
  );
}

function SkeletonPalaceCard() {
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.76,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonEmoji} />

      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLineSmall} />

        <View style={styles.skeletonFooter}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonButton} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  header: {
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  greetingBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },

  greeting: {
    color: colors.text,
    fontSize: 31,
    lineHeight: 37,
    fontFamily: 'FredokaOne_400Regular',
  },

  subtitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
  },

  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softYellow,
    borderWidth: 3,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.18,
        shadowRadius: 11,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  avatarEmoji: {
    fontSize: 39,
  },

  palaceItemShell: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.text,
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

  palaceCardInsideShell: {
    marginBottom: 0,
    backgroundColor: colors.bg,
    borderColor: colors.white,
    elevation: 0,
    shadowOpacity: 0,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },

  emptyIllustrationWrapper: {
    width: 178,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyAnimation: {
    position: 'absolute',
    width: 178,
    height: 178,
  },

  emptyWizardEmoji: {
    fontSize: 82,
  },

  emptyCopy: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    maxWidth: 340,
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  emptyText: {
    maxWidth: 340,
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
  },

  emptyButtonWrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },

  emptyButton: {
    minHeight: 64,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: colors.softYellow,
  },

  loadingState: {
    width: '100%',
    paddingTop: spacing.md,
  },

  loadingTitle: {
    marginBottom: spacing.lg,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
  },

  skeletonCard: {
    minHeight: 168,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  skeletonEmoji: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
  },

  skeletonContent: {
    flex: 1,
  },

  skeletonLineLarge: {
    width: '82%',
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    marginBottom: spacing.sm,
  },

  skeletonLineSmall: {
    width: '100%',
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },

  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  skeletonBadge: {
    width: 104,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.softYellow,
  },

  skeletonButton: {
    width: 76,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.border,
  },

  loadingPill: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.text,
  },

  loadingPillText: {
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
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
        shadowColor: colors.text,
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
});