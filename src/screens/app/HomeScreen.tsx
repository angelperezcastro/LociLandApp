import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { PalaceCard } from '../../components/palace/PalaceCard';
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

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadPalaces(userId).catch(() => {
      // The store already keeps the user-facing error.
    });
  }, [loadPalaces, userId]);

  useEffect(() => {
    if (!error) {
      return;
    }

    Alert.alert('Something went wrong', error);
  }, [error]);

  const handleCreatePalace = () => {
    navigation.navigate('CreatePalace');
  };

  const handleOpenPalace = (palaceId: string) => {
    navigation.navigate('PalaceDetail', { palaceId });
  };

  const handleReviewPalace = (palaceId: string) => {
    navigation.navigate('Review', { palaceId });
  };

  const handleDeletePalace = useCallback(
    (palaceId: string) => {
      if (!userId) {
        Alert.alert('Not ready yet', 'Your account is still loading.');
        return;
      }

      const palace = palaces.find((item) => item.id === palaceId);

      Alert.alert(
        'Delete palace?',
        palace
          ? `Do you want to delete "${palace.name}"?`
          : 'Do you want to delete this palace?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deletePalace(palaceId, userId).catch((caughtError) => {
                const message =
                  caughtError instanceof Error
                    ? caughtError.message
                    : 'Could not delete this palace.';

                Alert.alert('Delete failed', message);
              });
            },
          },
        ],
      );
    },
    [deletePalace, palaces, userId],
  );

  const renderPalace = ({ item }: { item: Palace }) => (
    <PalaceCard
      palace={item}
      onPress={handleOpenPalace}
      onReviewPress={handleReviewPalace}
      onLongPress={handleDeletePalace}
    />
  );

  const renderEmptyState = () => {
    if (isLoading) {
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
            paddingBottom: tabBarHeight + 112,
          },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {palaces.length > 0 && isLoading ? (
        <View style={styles.loadingPill}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.loadingPillText}>Loading palaces...</Text>
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
    </SafeAreaView>
  );
}

function HomeLoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={colors.text} />
      <Text style={styles.loadingTitle}>Loading your palaces...</Text>

      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
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
    flex: 1,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },

  loadingTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.text,
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },

  skeletonCard: {
    width: '100%',
    height: 150,
    borderRadius: 28,
    backgroundColor: colors.softYellow,
    opacity: 0.5,
    marginBottom: spacing.md,
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