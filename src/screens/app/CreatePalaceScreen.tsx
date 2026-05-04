import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';

import { colors, radius, spacing } from '../../theme';
import { palaceTemplates } from '../../assets/templates';
import type { Palace, PalaceTemplate, PalaceTemplateId } from '../../types';
import { auth } from '../../services/firebase';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { PalaceCard } from '../../components/palace/PalaceCard';
import { Button } from '../../components/ui/Button';
import { useAsyncAction } from '../../hooks/useAsyncAction';

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


const CREATE_PALACE_RADII = {
  close: 16,
  step: 13,
  input: 24,
  template: 26,
  checkmark: 12,
  previewEmpty: 28,
  submit: 24,
  success: 32,
} as const;

const CREATE_PALACE_TEXT_SIZES = {
  close: 34,
  topBarTitle: 18,
  heroEmoji: 58,
  title: 31,
  subtitle: 16,
  step: 17,
  sectionTitle: 19,
  inputEmoji: 27,
  input: 20,
  characterCount: 13,
  checkmark: 18,
  templateEmoji: 44,
  templateName: 15,
  previewEmptyEmoji: 38,
  previewEmptyTitle: 17,
  previewEmptyText: 14,
  submitLoading: 14,
  successEmoji: 70,
  successTitle: 28,
  successText: 15,
} as const;

function CreatePalaceScreen() {
  const navigation = useNavigation<any>();

  const [palaceName, setPalaceName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<PalaceTemplateId | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const successScale = useRef(new Animated.Value(0.4)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

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

  const createPalace = usePalaceStore((state) => state.createPalace);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) {
      return null;
    }

    return (
      palaceTemplates.find((template) => template.id === selectedTemplateId) ??
      null
    );
  }, [selectedTemplateId]);

  const trimmedName = palaceName.trim();
  const canCreate = trimmedName.length > 0 && selectedTemplateId !== null;

  const previewPalace = useMemo<Palace | null>(() => {
    if (!selectedTemplateId) {
      return null;
    }

    return {
      id: 'preview-palace',
      userId: userId ?? 'preview-user',
      name: trimmedName || 'My Magic Castle',
      templateId: selectedTemplateId,
      createdAt: Timestamp.now(),
      stationCount: 0,
    };
  }, [selectedTemplateId, trimmedName, userId]);

  const handleDismiss = () => {
    if (isSubmitting) {
      return;
    }

    navigation.goBack();
  };

  const playSuccessAnimation = () => {
    setSuccessVisible(true);

    successScale.setValue(0.4);
    successOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateToPalaceDetail = useCallback(
    (palaceId: string) => {
      if (typeof navigation.replace === 'function') {
        navigation.replace('PalaceDetail', { palaceId });
        return;
      }

      navigation.navigate('PalaceDetail', { palaceId });
    },
    [navigation],
  );

  const createPalaceAction = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        'Account still loading',
        'Please wait a moment before creating your palace.',
      );
      return;
    }

    if (!canCreate || !selectedTemplateId) {
      return;
    }

    try {
      const createdPalace = await createPalace(
        userId,
        trimmedName,
        selectedTemplateId,
      );

      playSuccessAnimation();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 650);
      });

      navigateToPalaceDetail(createdPalace.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not create your palace.';

      Alert.alert('Creation failed', message);
      setSuccessVisible(false);
    }
  }, [
    canCreate,
    createPalace,
    navigateToPalaceDetail,
    selectedTemplateId,
    trimmedName,
    userId,
  ]);

  const { isRunning: isSubmitting, run: runCreatePalace } =
    useAsyncAction(createPalaceAction);

  const handleCreatePalace = () => {
    void runCreatePalace();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close create palace screen"
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <Text style={styles.topBarTitle}>New Palace</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.modalCard}>
            <View style={styles.heroBlock}>
              <Text style={styles.heroEmoji}>🏛️</Text>
              <Text style={styles.title}>Build a memory palace</Text>
              <Text style={styles.subtitle}>
                Choose a place, give it a name, and start your memory journey.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.stepBadge}>1</Text>
                <Text style={styles.sectionTitle}>Type your palace name</Text>
              </View>

              <View style={styles.inputShell}>
                <Text style={styles.inputEmoji}>✏️</Text>

                <TextInput
                  value={palaceName}
                  onChangeText={setPalaceName}
                  placeholder="My Magic Castle"
                  placeholderTextColor={colors.muted}
                  maxLength={40}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              <Text style={styles.characterCount}>
                {trimmedName.length}/40 characters
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.stepBadge}>2</Text>
                <Text style={styles.sectionTitle}>Choose a template</Text>
              </View>

              <View style={styles.templateGrid}>
                {palaceTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onPress={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.stepBadge}>3</Text>
                <Text style={styles.sectionTitle}>Preview your palace</Text>
              </View>

              {previewPalace && selectedTemplate ? (
                <View style={styles.previewWrapper}>
                  <PalaceCard
                    palace={previewPalace}
                    onPress={() => undefined}
                    onReviewPress={() => undefined}
                    onLongPress={() => undefined}
                    style={styles.previewCard}
                  />
                </View>
              ) : (
                <View style={styles.previewEmpty}>
                  <Text style={styles.previewEmptyEmoji}>✨</Text>

                  <Text style={styles.previewEmptyTitle}>
                    Your palace preview will appear here
                  </Text>

                  <Text style={styles.previewEmptyText}>
                    Pick a template to see how it will look on Home.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.submitArea}>
              <Button
                title={isSubmitting ? 'Creating palace...' : 'Create Palace!'}
                variant="secondary"
                disabled={!canCreate || isSubmitting}
                onPress={handleCreatePalace}
                style={[
                  styles.submitButton,
                  canCreate && !isSubmitting && styles.submitButtonReady,
                ]}
                textStyle={styles.submitButtonText}
              />

              {isSubmitting ? (
                <View style={styles.submitLoading}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.submitLoadingText}>
                    Saving your palace...
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>

        {successVisible ? (
          <View pointerEvents="none" style={styles.successOverlay}>
            <Animated.View
              style={[
                styles.successCard,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Palace created!</Text>
              <Text style={styles.successText}>
                Opening your new memory palace...
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface TemplateCardProps {
  template: PalaceTemplate;
  selected: boolean;
  onPress: () => void;
}

function TemplateCard({ template, selected, onPress }: TemplateCardProps) {
  const scale = useRef(new Animated.Value(selected ? 1.04 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      friction: 6,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  return (
    <Animated.View
      style={[
        styles.templateAnimatedWrapper,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${template.name} template`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.templateCard,
          {
            backgroundColor: template.backgroundColour,
          },
          selected && styles.templateCardSelected,
          pressed && styles.templateCardPressed,
        ]}
      >
        {selected ? (
          <View style={styles.checkmarkBadge}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        ) : null}

        <Text style={styles.templateEmoji}>{template.emoji}</Text>

        <Text numberOfLines={2} style={styles.templateName}>
          {template.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },

  keyboardView: {
    flex: 1,
  },

  topBar: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: CREATE_PALACE_RADII.close,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  closeButtonPressed: {
    transform: [{ scale: 0.94 }],
  },

  closeText: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.close,
    lineHeight: 36,
    fontFamily: 'FredokaOne_400Regular',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  topBarTitle: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.topBarTitle,
    fontFamily: 'Nunito_800ExtraBold',
  },

  topBarSpacer: {
    width: 44,
    height: 44,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  modalCard: {
    flexGrow: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  heroEmoji: {
    fontSize: CREATE_PALACE_TEXT_SIZES.heroEmoji,
    marginBottom: spacing.sm,
  },

  title: {
    maxWidth: 330,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.title,
    lineHeight: 37,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  subtitle: {
    maxWidth: 330,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.subtitle,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: CREATE_PALACE_RADII.step,
    overflow: 'hidden',
    marginRight: spacing.sm,
    color: colors.text,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: CREATE_PALACE_TEXT_SIZES.step,
    lineHeight: 30,
    fontFamily: 'FredokaOne_400Regular',
    includeFontPadding: false,
  },

  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.sectionTitle,
    lineHeight: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },

  inputShell: {
    minHeight: 68,
    borderRadius: CREATE_PALACE_RADII.input,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.text,
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

  inputEmoji: {
    fontSize: CREATE_PALACE_TEXT_SIZES.inputEmoji,
    marginRight: spacing.sm,
  },

  input: {
    flex: 1,
    minHeight: 62,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.input,
    fontFamily: 'Nunito_700Bold',
    paddingVertical: spacing.none,
  },

  characterCount: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: CREATE_PALACE_TEXT_SIZES.characterCount,
    textAlign: 'right',
    fontFamily: 'Nunito_600SemiBold',
  },

  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  templateAnimatedWrapper: {
    width: '48%',
    marginBottom: spacing.md,
  },

  templateCard: {
    minHeight: 128,
    borderRadius: CREATE_PALACE_RADII.template,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
    overflow: 'hidden',
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

  templateCardSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },

  templateCardPressed: {
    opacity: 0.9,
  },

  checkmarkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: CREATE_PALACE_RADII.checkmark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },

  checkmarkText: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.checkmark,
    lineHeight: 22,
    fontFamily: 'FredokaOne_400Regular',
  },

  templateEmoji: {
    fontSize: CREATE_PALACE_TEXT_SIZES.templateEmoji,
    marginBottom: spacing.sm,
  },

  templateName: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.templateName,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
  },

  previewWrapper: {
    marginTop: spacing.xs,
  },

  previewCard: {
    marginBottom: spacing.none,
  },

  previewEmpty: {
    minHeight: 150,
    borderRadius: CREATE_PALACE_RADII.previewEmpty,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.softYellow,
  },

  previewEmptyEmoji: {
    fontSize: CREATE_PALACE_TEXT_SIZES.previewEmptyEmoji,
    marginBottom: spacing.sm,
  },

  previewEmptyTitle: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.previewEmptyTitle,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: spacing.xs,
  },

  previewEmptyText: {
    maxWidth: 260,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.previewEmptyText,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.64,
  },

  submitArea: {
    marginTop: spacing.sm,
  },

  submitButton: {
    minHeight: 62,
    borderRadius: CREATE_PALACE_RADII.submit,
    borderWidth: 3,
  },

  submitButtonReady: {
    backgroundColor: colors.softYellow,
    borderColor: colors.primary,
  },

  submitButtonText: {
    color: colors.text,
  },

  submitLoading: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitLoadingText: {
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.submitLoading,
    fontFamily: 'Nunito_700Bold',
    opacity: 0.72,
  },

  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.overlay,
  },

  successCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: CREATE_PALACE_RADII.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 3,
    borderColor: colors.text,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  successEmoji: {
    fontSize: CREATE_PALACE_TEXT_SIZES.successEmoji,
    marginBottom: spacing.sm,
  },

  successTitle: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.successTitle,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  successText: {
    color: colors.text,
    fontSize: CREATE_PALACE_TEXT_SIZES.successText,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.72,
  },
});

export { CreatePalaceScreen };
export default CreatePalaceScreen;