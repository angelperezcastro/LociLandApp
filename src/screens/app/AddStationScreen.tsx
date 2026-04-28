import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors, spacing } from '../../theme';
import { usePalaceStore } from '../../store/usePalaceStore';
import { useUserStore } from '../../store/useUserStore';
import { uploadStationImage } from '../../services/storageService';
import type { Station } from '../../types';

interface StationFormRouteParams {
  palaceId: string;
  stationId?: string;
}

interface SelectedImage {
  uri: string;
  contentType?: string;
  isRemote?: boolean;
}

interface UserStoreSnapshot {
  user?: {
    uid: string;
  } | null;
  currentUser?: {
    uid: string;
  } | null;
  profile?: {
    id?: string;
    uid?: string;
  } | null;
  userProfile?: {
    id?: string;
    uid?: string;
  } | null;
}

interface EmojiCategory {
  title: string;
  emojis: string[];
}

const EMPTY_STATIONS: Station[] = [];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const SAVE_TIMEOUT_MS = 45_000;

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    title: 'Animals',
    emojis: ['🦊', '🐸', '🦁', '🐼', '🐵', '🐨', '🐯', '🐰'],
  },
  {
    title: 'Objects',
    emojis: ['📚', '✏️', '🎒', '🔑', '🧸', '🎲', '🕯️', '🧭'],
  },
  {
    title: 'Places',
    emojis: ['🏠', '🏰', '🌲', '🚀', '🏝️', '⛰️', '🌋', '🏫'],
  },
  {
    title: 'Food',
    emojis: ['🍎', '🍕', '🍓', '🍪', '🍉', '🥕', '🍌', '🧁'],
  },
  {
    title: 'Symbols',
    emojis: ['⭐', '🔥', '💎', '🎯', '🧠', '❤️', '⚡', '🌈'],
  },
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const getUserIdFromStore = (state: unknown): string | null => {
  const snapshot = state as UserStoreSnapshot;

  return (
    snapshot.user?.uid ??
    snapshot.currentUser?.uid ??
    snapshot.profile?.uid ??
    snapshot.profile?.id ??
    snapshot.userProfile?.uid ??
    snapshot.userProfile?.id ??
    null
  );
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const AddStationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as StationFormRouteParams | undefined;

  const palaceId = params?.palaceId ?? '';
  const stationId = params?.stationId;
  const isEditMode = Boolean(stationId);

  const userId = useUserStore(getUserIdFromStore);

  const createStation = usePalaceStore((state) => state.createStation);
  const updateStation = usePalaceStore((state) => state.updateStation);
  const loadStations = usePalaceStore((state) => state.loadStations);

  const existingStations = usePalaceStore((state) => {
    if (!palaceId) {
      return EMPTY_STATIONS;
    }

    return state.stations[palaceId] ?? EMPTY_STATIONS;
  });

  const stationToEdit = useMemo(() => {
    if (!stationId) {
      return undefined;
    }

    return existingStations.find((station) => station.id === stationId);
  }, [existingStations, stationId]);

  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [memoryText, setMemoryText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [hasHydratedEditForm, setHasHydratedEditForm] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    if (!isEditMode || !palaceId || !userId || stationToEdit) {
      return;
    }

    loadStations(palaceId, userId).catch(() => {
      // Store already keeps the error.
    });
  }, [isEditMode, loadStations, palaceId, stationToEdit, userId]);

  useEffect(() => {
    if (!stationToEdit || hasHydratedEditForm) {
      return;
    }

    setSelectedEmoji(stationToEdit.emoji);
    setLabel(stationToEdit.label);
    setMemoryText(stationToEdit.memoryText);

    if (stationToEdit.imageUri) {
      setSelectedImage({
        uri: stationToEdit.imageUri,
        isRemote: true,
      });
    }

    setHasHydratedEditForm(true);
  }, [hasHydratedEditForm, stationToEdit]);

  const isSaveDisabled = useMemo(
    () => !selectedEmoji || !label.trim() || isSaving,
    [isSaving, label, selectedEmoji],
  );

  const handleClose = () => {
    if (isSaving) {
      Alert.alert(
        'Saving in progress',
        'Please wait until the station finishes saving.',
      );
      return;
    }

    navigation.goBack();
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Photo permission needed',
        'LociLand needs access to your photos so you can add an image to this memory station.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.45,
      base64: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      Alert.alert(
        'Image not ready',
        'The selected image could not be prepared. Please choose another photo.',
      );
      return;
    }

    const contentType = asset.mimeType ?? 'image/jpeg';

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      Alert.alert(
        'Unsupported image',
        'Please choose a JPG, PNG, or WEBP image.',
      );
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
      Alert.alert('Image too large', 'Please choose a smaller image under 2 MB.');
      return;
    }

    setSelectedImage({
      uri: asset.uri,
      contentType,
      isRemote: false,
    });
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const refreshStationsAndGoBack = async () => {
    if (palaceId && userId) {
      setSaveStatus('Refreshing palace...');
      await loadStations(palaceId, userId);
    }

    navigation.goBack();
  };

  const uploadImageWithStatus = async ({
    uploadStationId,
    image,
  }: {
    uploadStationId: string;
    image: SelectedImage;
  }): Promise<string> => {
    setSaveStatus('Uploading photo...');

    return withTimeout(
      uploadStationImage({
        userId: userId as string,
        palaceId,
        stationId: uploadStationId,
        uri: image.uri,
        contentType: image.contentType,
      }),
      SAVE_TIMEOUT_MS,
      'The image upload took too long. Please check your connection and try again.',
    );
  };

  const handleSaveStation = async () => {
    if (!palaceId) {
      Alert.alert(
        'Missing palace',
        'This station needs to belong to a palace. Go back and try again.',
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        'Session problem',
        'Your user session could not be found. Please log out and log in again.',
      );
      return;
    }

    if (!selectedEmoji || !label.trim()) {
      Alert.alert(
        'Almost there',
        'Choose an emoji and give your station a short name.',
      );
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus(isEditMode ? 'Updating station...' : 'Creating station...');

      if (isEditMode && stationId) {
        let nextImageUri: string | null | undefined;

        if (selectedImage && !selectedImage.isRemote) {
          nextImageUri = await uploadImageWithStatus({
            uploadStationId: stationId,
            image: selectedImage,
          });
        } else if (!selectedImage && stationToEdit?.imageUri) {
          nextImageUri = null;
        }

        setSaveStatus('Saving changes...');

        await updateStation(stationId, palaceId, userId, {
          emoji: selectedEmoji,
          label: label.trim(),
          memoryText: memoryText.trim(),
          ...(nextImageUri !== undefined ? { imageUri: nextImageUri } : {}),
        });

        await refreshStationsAndGoBack();
        return;
      }

      const station = await createStation(palaceId, userId, {
        order: existingStations.length,
        emoji: selectedEmoji,
        label: label.trim(),
        memoryText: memoryText.trim(),
      });

      if (selectedImage) {
        const imageUri = await uploadImageWithStatus({
          uploadStationId: station.id,
          image: selectedImage,
        });

        setSaveStatus('Saving photo link...');

        await updateStation(station.id, palaceId, userId, {
          imageUri,
        });
      }

      await refreshStationsAndGoBack();
    } catch (error) {
      Alert.alert('Station not saved', getErrorMessage(error));
    } finally {
      setIsSaving(false);
      setSaveStatus('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({
          ios: 'padding',
          android: undefined,
        })}
        style={styles.keyboardView}
      >
        <View style={styles.modalHandleWrapper}>
          <View style={styles.modalHandle} />
        </View>

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              {isEditMode ? 'Update memory stop' : 'New memory stop'}
            </Text>
            <Text style={styles.title}>
              {isEditMode ? 'Edit Station' : 'Add Station'}
            </Text>
            <Text style={styles.subtitle}>
              Choose a place, add a memory, and make your palace easier to walk
              through.
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Choose an emoji</Text>
            <Text style={styles.sectionDescription}>
              Pick a visual anchor for this station.
            </Text>

            {EMOJI_CATEGORIES.map((category) => (
              <View key={category.title} style={styles.emojiCategory}>
                <Text style={styles.categoryTitle}>{category.title}</Text>

                <View style={styles.emojiGrid}>
                  {category.emojis.map((emoji) => {
                    const isSelected = selectedEmoji === emoji;

                    return (
                      <Pressable
                        key={`${category.title}-${emoji}`}
                        accessibilityRole="button"
                        disabled={isSaving}
                        onPress={() => setSelectedEmoji(emoji)}
                        style={[
                          styles.emojiButton,
                          isSelected && styles.emojiButtonSelected,
                        ]}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Name this station</Text>
            <Text style={styles.sectionDescription}>
              Keep it short: Front door, Kitchen table, My bed...
            </Text>

            <TextInput
              value={label}
              editable={!isSaving}
              onChangeText={setLabel}
              placeholder="Front door"
              placeholderTextColor={colors.muted}
              maxLength={40}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. What goes here?</Text>
            <Text style={styles.sectionDescription}>
              Write the thing you want to remember at this station.
            </Text>

            <TextInput
              value={memoryText}
              editable={!isSaving}
              onChangeText={setMemoryText}
              placeholder="Example: The first planet is Mercury."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              maxLength={500}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Add a photo</Text>
            <Text style={styles.sectionDescription}>
              Optional, but useful if the station is based on a real place.
            </Text>

            {selectedImage ? (
              <View style={styles.imagePreviewCard}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.imagePreview}
                />

                <View style={styles.imageActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSaving}
                    onPress={handlePickImage}
                    style={[
                      styles.secondaryImageButton,
                      isSaving && styles.imageButtonDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryImageText}>Replace photo</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSaving}
                    onPress={handleRemoveImage}
                    style={[
                      styles.removeImageButton,
                      isSaving && styles.imageButtonDisabled,
                    ]}
                  >
                    <Text style={styles.removeImageText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handlePickImage}
                style={[
                  styles.photoButton,
                  isSaving && styles.imageButtonDisabled,
                ]}
              >
                <Text style={styles.photoButtonEmoji}>📷</Text>
                <Text style={styles.photoButtonText}>Choose from gallery</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaveDisabled}
            onPress={handleSaveStation}
            style={[
              styles.saveButton,
              isSaveDisabled && styles.saveButtonDisabled,
            ]}
          >
            {isSaving ? (
              <View style={styles.savingContent}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.savingText}>
                  {saveStatus || 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Save Changes' : 'Save Station'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddStationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  modalHandle: {
    width: 52,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  section: {
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  sectionDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  emojiCategory: {
    marginTop: spacing.md,
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: '22.7%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.04 }],
  },
  emojiText: {
    fontSize: 30,
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 128,
    lineHeight: 22,
  },
  photoButton: {
    minHeight: 96,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  photoButtonEmoji: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  photoButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  imagePreviewCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.text,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  imagePreview: {
    width: '100%',
    height: 190,
  },
  imageActions: {
    flexDirection: 'row',
  },
  secondaryImageButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.softYellow,
  },
  secondaryImageText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  removeImageButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.emphasis,
  },
  removeImageText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  imageButtonDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    minHeight: 60,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  savingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
});