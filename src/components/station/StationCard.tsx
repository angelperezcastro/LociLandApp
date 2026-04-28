import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { colors, spacing } from '../../theme';
import type { Station } from '../../types';

interface StationCardProps {
  station: Station;
  isActive?: boolean;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
  onDrag?: () => void;
}

const STATION_COLOURS = [
  colors.softYellow,
  colors.secondary,
  colors.accent,
  colors.emphasis,
  colors.bg,
];

export function StationCard({
  station,
  isActive = false,
  onEdit,
  onDelete,
  onDrag,
}: StationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stationColour = useMemo(
    () => STATION_COLOURS[station.order % STATION_COLOURS.length],
    [station.order],
  );

  const memoryText =
    station.memoryText.trim().length > 0
      ? station.memoryText.trim()
      : 'No memory text yet.';

  const renderRightActions = () => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Delete ${station.label}`}
      activeOpacity={0.86}
      onPress={() => onDelete(station)}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded((current) => !current)}
        onLongPress={onDrag}
        delayLongPress={180}
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

          {isExpanded ? (
            <Text style={styles.expandHint}>Tap again to collapse</Text>
          ) : (
            <Text style={styles.expandHint}>Tap to expand · Hold to reorder</Text>
          )}
        </View>

        {station.imageUri ? (
          <Image source={{ uri: station.imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>⋮⋮</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.softYellow,
    gap: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  cardActive: {
    opacity: 0.86,
    transform: [{ scale: 1.02 }],
  },

  emojiShell: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },

  emoji: {
    fontSize: 34,
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
    flex: 1,
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontFamily: 'FredokaOne_400Regular',
  },

  editButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },

  editIcon: {
    fontSize: 16,
  },

  memoryText: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito_600SemiBold',
    opacity: 0.74,
  },

  memoryTextExpanded: {
    opacity: 0.86,
  },

  expandHint: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },

  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.white,
  },

  dragHandle: {
    width: 38,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },

  dragHandleText: {
    color: colors.muted,
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },

  deleteAction: {
    width: 96,
    marginLeft: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emphasis,
    borderWidth: 2,
    borderColor: colors.text,
  },

  deleteActionText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
  },
});

export default StationCard;