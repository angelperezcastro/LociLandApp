// src/screens/app/HomeScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import type { Palace } from '../../types';
import { auth } from '../../services/firebase';
import { getPalaceTemplateById } from '../../assets/templates';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { GuideCharacter } from '../../components/guide';
import { PalaceCard } from '../../components/palace/PalaceCard';
import { DeletePalaceSheet } from '../../components/palace/DeletePalaceSheet';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from '../../components/feedback';
import { getUserFriendlyError } from '../../utils/errorMessages';

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

  const showInitialLoading = isLoading && palaces.length === 0 && !isRefreshing;

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadPalaces(userId).catch(() => {
      // The store owns the user-facing error value.
    });
  }, [loadPalaces, userId]);

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
      clearError();
      await loadPalaces(userId);
    } finally {
      setIsRefreshing(false);
    }
  }, [clearError, loadPalaces, userId]);

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
    if (!isDeleting) {
      setPalaceToDelete(null);
    }
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
      Alert.alert(
        'Delete failed',
        getUserFriendlyError(caughtError, 'Could not delete this palace.'),
      );
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
      return (
        <View style={styles.loadingState}>
          <LoadingState
            title="Loading your palaces..."
            message="Getting your memory worlds ready."
            showSkeleton
            skeletonCount={3}
          />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <ErrorState
            title="Could not load your palaces"
            message={error}
            onAction={handleRefresh}
          />
        </View>
      );
    }

    if (!userId) {
      return (
        <View style={styles.emptyState}>
          <ErrorState
            title="Account still loading"
            message="Wait a moment and pull down to refresh."
            onAction={handleRefresh}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIllustrationWrapper}>
          <GuideCharacter mood="idle" size="xl" withBubble />
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
            progressBackgroundColor={colors.primarySoft}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {palaces.length > 0 && error ? (
        <View style={styles.inlineErrorPill}>
          <Text style={styles.inlineErrorText}>Sync issue · pull to refresh</Text>
        </View>
      ) : null}

      {palaces.length > 0 && isLoading && !isRefreshing ? (
        <View style={styles.loadingPill}>
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
    ...typography.h1,
    color: colors.text,
    fontSize: fontSizes.xxl + spacing.xs - 1,
    lineHeight: 37,
  },
  subtitle: {
    ...typography.bodyStrong,
    marginTop: spacing.xs,
    color: colors.textSoft,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.text,
    ...shadows.card,
  },
  avatarEmoji: {
    ...typography.display,
    fontSize: fontSizes.display,
  },
  palaceItemShell: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: colors.text,
    ...shadows.card,
  },
  palaceCardInsideShell: {
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
  emptyCopy: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h1,
    maxWidth: 340,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyStrong,
    maxWidth: 340,
    color: colors.textSoft,
    textAlign: 'center',
  },
  emptyButtonWrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  emptyButton: {
    minHeight: 64,
    borderRadius: radius.xl,
    borderWidth: 3,
    backgroundColor: colors.primarySoft,
  },
  loadingState: {
    width: '100%',
    paddingTop: spacing.md,
  },
  loadingPill: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  loadingPillText: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  inlineErrorPill: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.emphasisSoft,
    borderWidth: 2,
    borderColor: colors.emphasis,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inlineErrorText: {
    ...typography.caption,
    color: colors.emphasis,
    fontFamily: fontFamilies.bodyBold,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
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
});
