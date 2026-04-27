import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { colors, spacing } from '../../theme';
import type { Palace } from '../../types';
import { getPalaceTemplateById } from '../../assets/templates';
import { Button } from '../ui/Button';

interface DeletePalaceSheetProps {
  visible: boolean;
  palace: Palace | null;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: (palace: Palace) => void | Promise<void>;
}

function DeletePalaceSheet({
  visible,
  palace,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeletePalaceSheetProps) {
  const translateY = useRef(new Animated.Value(360)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    translateY.setValue(360);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  if (!palace) {
    return null;
  }

  const template = getPalaceTemplateById(palace.templateId);

  const handleCancel = () => {
    if (isDeleting) {
      return;
    }

    onCancel();
  };

  const handleConfirm = () => {
    if (isDeleting) {
      return;
    }

    void onConfirm(palace);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View
            style={[
              styles.emojiShell,
              { backgroundColor: template.backgroundColour },
            ]}
          >
            <Text style={styles.emoji}>{template.emoji}</Text>
          </View>

          <Text style={styles.title}>Delete this palace?</Text>

          <Text style={styles.description}>
            “{palace.name}” will be removed from your palace list.
          </Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              This action cannot be undone.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="ghost"
              disabled={isDeleting}
              onPress={handleCancel}
              style={styles.cancelButton}
            />

            <Button
              title={isDeleting ? 'Deleting...' : 'Delete palace'}
              variant="primary"
              disabled={isDeleting}
              onPress={handleConfirm}
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 14,
      },
    }),
  },

  handle: {
    width: 54,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },

  emojiShell: {
    width: 92,
    height: 92,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text,
    marginBottom: spacing.md,
  },

  emoji: {
    fontSize: 52,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.sm,
  },

  description: {
    maxWidth: 330,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.74,
    marginBottom: spacing.md,
  },

  warningBox: {
    width: '100%',
    borderRadius: 22,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },

  warningText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
  },

  actions: {
    width: '100%',
  },

  cancelButton: {
    marginBottom: spacing.md,
    borderRadius: 22,
  },

  deleteButton: {
    borderRadius: 22,
    backgroundColor: colors.emphasis,
    borderColor: colors.text,
  },

  deleteButtonText: {
    color: colors.bg,
    fontFamily: 'Nunito_800ExtraBold',
  },
});

export { DeletePalaceSheet };
export default DeletePalaceSheet;