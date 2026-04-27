import React, { useMemo, useState } from 'react';
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

interface AddStationRouteParams {
  palaceId: string;
}

interface SelectedImage {
  uri: string;
  base64: string;
  contentType?: string;
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

export const AddStationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as AddStationRouteParams | undefined;

  const palaceId = params?.palaceId ?? '';

  const userId = useUserStore(getUserIdFromStore);

  const createStation = usePalaceStore((state) => state.createStation);
  const updateStation = usePalaceStore((state) => state.updateStation);
  const existingStations = usePalaceStore((state) =>
    palaceId ? state.getStationsByPalaceId(palaceId) : [],
  );

  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [memoryText, setMemoryText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const isSaveDisabled = useMemo(
    () => !selectedEmoji || !label.trim() || isSaving,
    [isSaving, label, selectedEmoji],
  );

  const handleClose = () => {
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
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri || !asset.base64) {
      Alert.alert(
        'Image not ready',
        'The selected image could not be prepared. Please choose another photo.',
      );
      return;
    }

    setSelectedImage({
      uri: asset.uri,
      base64: asset.base64,
      contentType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
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

      const station = await createStation(palaceId, userId, {
        order: existingStations.length,
        emoji: selectedEmoji,
        label: label.trim(),
        memoryText: memoryText.trim(),
      });

      if (selectedImage) {
        const imageUri = await uploadStationImage({
          userId,
          palaceId,
          stationId: station.id,
          base64: selectedImage.base64,
          contentType: selectedImage.contentType,
        });

        await updateStation(station.id, palaceId, userId, {
          imageUri,
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Station not saved', getErrorMessage(error));
    } finally {
      setIsSaving(false);
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
            <Text style={styles.eyebrow}>New memory stop</Text>
            <Text style={styles.title}>Add Station</Text>
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
              onChangeText={setLabel}
              placeholder="Front door"
              placeholderTextColor={colors.text}
              maxLength={32}
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
              onChangeText={setMemoryText}
              placeholder="Example: The first planet is Mercury."
              placeholderTextColor={colors.text}
              multiline
              textAlignVertical="top"
              maxLength={280}
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

                <Pressable
                  accessibilityRole="button"
                  onPress={handleRemoveImage}
                  style={styles.removeImageButton}
                >
                  <Text style={styles.removeImageText}>Remove photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={handlePickImage}
                style={styles.photoButton}
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
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.saveButtonText}>Save Station</Text>
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
  removeImageButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.emphasis,
  },
  removeImageText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
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
});