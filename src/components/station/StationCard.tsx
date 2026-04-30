// src/components/station/StationCard.tsx

import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import type { Station } from '../../types';

interface StationCardProps {
  station: Station;
  isActive?: boolean;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
  onDrag?: () => void;
}

const STATION_COLOURS = [
  colors.primarySoft,
  colors.secondarySoft,
  colors.accentSoft,
  colors.emphasisSoft,
  colors.surfaceMuted,
];

export function StationCard({
  station,
  isActive = false,
  onEdit,
  onDelete,
  onDrag,
}: StationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const swipeableRef = useRef<Swipeable | null>(null);

  const stationColour = useMemo(
    () => STATION_COLOURS[Math.abs(station.order) % STATION_COLOURS.length],
    [station.order],
  );

  const memoryText =
    station.memoryText.trim().length > 0
      ? station.memoryText.trim()
      : 'No memory text yet.';

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(station);
  };

  const renderRightActions = () => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Delete ${station.label}`}
      activeOpacity={0.86}
      onPress={handleDelete}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={!isActive}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded((current) => !current)}
        onLongPress={onDrag}
        delayLongPress={220}
        disabled={isActive}
        style={[styles.card, isActive && styles.cardActive]}
      >
        <View style={[styles.emojiShell, { backgroundColor: stationColour }]}>
          <Text style={styles.emoji}>{station.emoji}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.label}>
              {station.label}
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Edit ${station.label}`}
              activeOpacity={0.8}
              onPress={() => onEdit(station)}
              style={styles.editButton}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          <Text
            numberOfLines={isExpanded ? undefined : 1}
            style={[styles.memoryText, isExpanded && styles.memoryTextExpanded]}
          >
            {memoryText}
          </Text>

          <Text style={styles.expandHint}>
            {isExpanded ? 'Tap again to collapse' : 'Tap to expand · Hold to reorder'}
          </Text>
        </View>

        <View style={styles.rightArea}>
          {station.imageUri ? (
            <Image source={{ uri: station.imageUri }} style={styles.thumbnail} />
          ) : null}

          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>⋮⋮</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.bg,
    padding: spacing.md,
    ...shadows.card,
  },
  cardActive: {
    opacity: 0.94,
    transform: [{ scale: 1.03 }],
    ...shadows.elevated,
  },
  emojiShell: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  emoji: {
    ...typography.h1,
    fontSize: fontSizes.xxl + spacing.xs,
    lineHeight: 40,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.h2,
    flex: 1,
    color: colors.text,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },
  editIcon: {
    ...typography.caption,
  },
  memoryText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSoft,
  },
  memoryTextExpanded: {
    color: colors.text,
  },
  expandHint: {
    ...typography.small,
    marginTop: spacing.xs,
    color: colors.muted,
  },
  rightArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.white,
  },
  dragHandle: {
    width: 38,
    minHeight: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dragHandleText: {
    ...typography.caption,
    color: colors.muted,
  },
  deleteAction: {
    width: 96,
    marginLeft: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emphasis,
    borderWidth: 2,
    borderColor: colors.text,
  },
  deleteActionText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    color: colors.white,
  },
});

export default StationCard;
