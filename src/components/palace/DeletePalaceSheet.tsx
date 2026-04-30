// src/components/palace/DeletePalaceSheet.tsx

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  colors,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
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
    if (!isDeleting) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (!isDeleting) {
      void onConfirm(palace);
    }
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
            <Text style={styles.warningText}>This action cannot be undone.</Text>
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
              variant="danger"
              loading={isDeleting}
              disabled={isDeleting}
              onPress={handleConfirm}
              style={styles.deleteButton}
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
    alignItems: 'center',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    ...shadows.floating,
  },
  handle: {
    width: 54,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  emojiShell: {
    width: 92,
    height: 92,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text,
    marginBottom: spacing.md,
  },
  emoji: {
    ...typography.display,
    fontSize: fontSizes.display + fontSizes.md,
    lineHeight: 58,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyStrong,
    maxWidth: 330,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  warningBox: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
  deleteButton: {
    borderColor: colors.text,
  },
});

export { DeletePalaceSheet };
export default DeletePalaceSheet;
