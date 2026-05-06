// src/components/memory/MemoryPathMap.tsx

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { PalaceTemplateId, Station } from '../../types';
import {
  colors,
  fontFamilies,
  fontSizes,
  getWorldVisuals,
  lineHeights,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';

type MemoryPathPoint = {
  x: number;
  y: number;
};

type NodeSizePreset = 'large' | 'medium' | 'small';

type MemoryPathMapProps = {
  templateId: PalaceTemplateId;
  stations: Station[];
  activeStationId?: string | null;
  completedStationIds?: string[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  style?: ViewStyle;
  onStationPress?: (station: Station) => void;
};

const MAX_VISIBLE_STATIONS = 8;

/**
 * Coordinates are intentionally kept inside a safe 17-83% horizontal area and
 * 22-76% vertical area. This prevents photo nodes from being clipped by the
 * rounded map container on real devices.
 */
const POINT_SETS: Record<number, MemoryPathPoint[]> = {
  1: [{ x: 50, y: 52 }],

  2: [
    { x: 25, y: 70 },
    { x: 75, y: 30 },
  ],

  3: [
    { x: 20, y: 70 },
    { x: 50, y: 30 },
    { x: 80, y: 66 },
  ],

  4: [
    { x: 19, y: 70 },
    { x: 35, y: 40 },
    { x: 62, y: 27 },
    { x: 80, y: 64 },
  ],

  5: [
    { x: 18, y: 70 },
    { x: 31, y: 43 },
    { x: 50, y: 25 },
    { x: 69, y: 43 },
    { x: 82, y: 68 },
  ],

  6: [
    { x: 18, y: 70 },
    { x: 30, y: 44 },
    { x: 47, y: 25 },
    { x: 65, y: 38 },
    { x: 79, y: 58 },
    { x: 58, y: 74 },
  ],

  7: [
    { x: 18, y: 70 },
    { x: 29, y: 47 },
    { x: 44, y: 28 },
    { x: 60, y: 30 },
    { x: 76, y: 48 },
    { x: 82, y: 68 },
    { x: 55, y: 74 },
  ],

  8: [
    { x: 18, y: 69 },
    { x: 29, y: 48 },
    { x: 44, y: 29 },
    { x: 59, y: 27 },
    { x: 74, y: 41 },
    { x: 81, y: 60 },
    { x: 67, y: 74 },
    { x: 45, y: 68 },
  ],
};

const NODE_SIZE_BY_PRESET: Record<NodeSizePreset, number> = {
  large: 66,
  medium: 54,
  small: 46,
};

const NODE_EMOJI_SIZE_BY_PRESET: Record<NodeSizePreset, number> = {
  large: fontSizes.xxl + spacing.xs,
  medium: fontSizes.xxl,
  small: fontSizes.xl,
};

const ORDER_BADGE_SIZE_BY_PRESET: Record<NodeSizePreset, number> = {
  large: 27,
  medium: 25,
  small: 23,
};

const getPointsForCount = (count: number): MemoryPathPoint[] => {
  const safeCount = Math.min(Math.max(count, 1), MAX_VISIBLE_STATIONS);

  return POINT_SETS[safeCount];
};

const getNodeSizePreset = (visibleStationCount: number): NodeSizePreset => {
  if (visibleStationCount <= 3) {
    return 'large';
  }

  if (visibleStationCount <= 6) {
    return 'medium';
  }

  return 'small';
};

const getMapHeight = (visibleStationCount: number, compact: boolean): number => {
  if (compact) {
    return 250;
  }

  if (visibleStationCount <= 3) {
    return 292;
  }

  if (visibleStationCount <= 6) {
    return 322;
  }

  return 342;
};

const createPathDefinition = (points: MemoryPathPoint[]): string => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

const getStationImageUri = (station: Station): string | null => {
  const imageUri = station.imageUri?.trim();

  return imageUri ? imageUri : null;
};

const getStationLabel = (station: Station, index: number): string => {
  const label = station.label.trim();

  if (label.length > 0) {
    return label;
  }

  return `Station ${index + 1}`;
};

export function MemoryPathMap({
  templateId,
  stations,
  activeStationId = null,
  completedStationIds = [],
  title = 'Visual memory route',
  subtitle = 'Follow the path and visit each station in order.',
  compact = false,
  style,
  onStationPress,
}: MemoryPathMapProps) {
  const world = getWorldVisuals(templateId);

  const orderedStations = useMemo(() => {
    return [...stations].sort((first, second) => first.order - second.order);
  }, [stations]);

  const visibleStations = useMemo(
    () => orderedStations.slice(0, MAX_VISIBLE_STATIONS),
    [orderedStations],
  );

  const visiblePoints = useMemo(
    () => getPointsForCount(visibleStations.length),
    [visibleStations.length],
  );

  const pathDefinition = useMemo(
    () => createPathDefinition(visiblePoints),
    [visiblePoints],
  );

  const completedSet = useMemo(
    () => new Set(completedStationIds),
    [completedStationIds],
  );

  const hiddenStationCount = Math.max(
    0,
    orderedStations.length - visibleStations.length,
  );

  const nodeSizePreset = getNodeSizePreset(visibleStations.length);
  const nodeSize = NODE_SIZE_BY_PRESET[nodeSizePreset];
  const nodeEmojiSize = NODE_EMOJI_SIZE_BY_PRESET[nodeSizePreset];
  const orderBadgeSize = ORDER_BADGE_SIZE_BY_PRESET[nodeSizePreset];
  const mapHeight = getMapHeight(visibleStations.length, compact);

  if (orderedStations.length === 0) {
    return (
      <View
        style={[
          styles.card,
          compact ? styles.cardCompact : null,
          { backgroundColor: world.surface, borderColor: world.pathSoft },
          style,
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={[styles.landmarkBubble, { backgroundColor: world.nodeSoft }]}>
            <Text style={styles.landmarkEmoji}>{world.landmarkEmoji}</Text>
          </View>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Spatial memory</Text>
            <Text numberOfLines={2} style={styles.title}>
              {title}
            </Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.subtitle}>
          Add stations to draw your route.
        </Text>

        <View
          style={[
            styles.emptyMap,
            { backgroundColor: world.background, height: mapHeight },
          ]}
        >
          <Text style={styles.emptyMapEmoji}>{world.atmosphereEmoji}</Text>
          <Text style={styles.emptyMapText}>No stations yet</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(motion.duration.normal)}
      style={[
        styles.card,
        compact ? styles.cardCompact : null,
        { backgroundColor: world.surface, borderColor: world.pathSoft },
        style,
      ]}
    >
      <View style={styles.headerTopRow}>
        <View style={[styles.landmarkBubble, { backgroundColor: world.nodeSoft }]}>
          <Text style={styles.landmarkEmoji}>{world.landmarkEmoji}</Text>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Spatial memory</Text>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        </View>

        <View style={[styles.stationBadge, { backgroundColor: world.accent }]}>
          <Text style={[styles.stationBadgeText, { color: world.textOnAccent }]}>
            {orderedStations.length}
          </Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.subtitle}>
        {subtitle}
      </Text>

      <View
        style={[
          styles.mapStage,
          {
            height: mapHeight,
            backgroundColor: world.background,
          },
        ]}
      >
        <View style={styles.atmosphereLayer} pointerEvents="none">
          <Text style={[styles.atmosphereEmoji, styles.atmosphereTopLeft]}>
            {world.atmosphereEmoji}
          </Text>
          <Text style={[styles.atmosphereEmoji, styles.atmosphereTopRight]}>
            {world.atmosphereEmoji}
          </Text>
          <Text style={[styles.atmosphereEmoji, styles.atmosphereBottomRight]}>
            {world.landmarkEmoji}
          </Text>
        </View>

        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={StyleSheet.absoluteFill}
        >
          {pathDefinition ? (
            <>
              <Path
                d={pathDefinition}
                fill="none"
                stroke={colors.white}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.78}
              />

              <Path
                d={pathDefinition}
                fill="none"
                stroke={world.path}
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 7"
              />
            </>
          ) : null}

          {visiblePoints.map((point, index) => (
            <Circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={3.3}
              fill={world.path}
              opacity={0.22}
            />
          ))}
        </Svg>

        {visibleStations.map((station, index) => {
          const point = visiblePoints[index];
          const imageUri = getStationImageUri(station);
          const isActive = station.id === activeStationId;
          const isCompleted = completedSet.has(station.id);
          const stationLabel = getStationLabel(station, index);

          return (
            <Animated.View
              key={station.id}
              entering={ZoomIn.delay(index * motion.delay.staggerSm).duration(
                motion.duration.normal,
              )}
              style={[
                styles.nodeWrapper,
                {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  transform: [
                    { translateX: -nodeSize / 2 },
                    { translateY: -nodeSize / 2 },
                  ],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Station ${index + 1}: ${stationLabel}`}
                disabled={!onStationPress}
                onPress={() => onStationPress?.(station)}
                style={({ pressed }) => [
                  styles.nodePressable,
                  pressed ? styles.nodePressed : null,
                ]}
              >
                <View
                  style={[
                    styles.node,
                    {
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: nodeSize / 2.7,
                      backgroundColor: isActive ? world.accent : world.node,
                      borderColor: isActive ? colors.white : colors.text,
                    },
                    isCompleted ? styles.nodeCompleted : null,
                  ]}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.nodeImage}
                      contentFit="contain"
                    />
                  ) : (
                    <Text style={[styles.nodeEmoji, { fontSize: nodeEmojiSize }]}>
                      {station.emoji || '📍'}
                    </Text>
                  )}

                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓</Text>
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.orderBadge,
                    {
                      width: orderBadgeSize,
                      height: orderBadgeSize,
                      borderRadius: orderBadgeSize / 2,
                    },
                  ]}
                >
                  <Text style={styles.orderBadgeText}>{index + 1}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.footerPill, { backgroundColor: world.nodeSoft }]}>
          <Text style={styles.footerText}>
            {hiddenStationCount > 0
              ? `Showing first ${MAX_VISIBLE_STATIONS} of ${orderedStations.length} · numbers show route order`
              : 'Numbers show route order · tap a node to edit'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  cardCompact: {
    padding: spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  landmarkBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  landmarkEmoji: {
    fontSize: fontSizes.lg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.small,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: fontFamilies.bodyBold,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodySemiBold,
  },
  stationBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: spacing.sm,
  },
  stationBadgeText: {
    ...typography.h3,
    fontFamily: fontFamilies.bodyBold,
  },
  mapStage: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  atmosphereLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  atmosphereEmoji: {
    position: 'absolute',
    opacity: 0.2,
    fontSize: fontSizes.xl,
  },
  atmosphereTopLeft: {
    top: spacing.lg,
    left: spacing.xl,
  },
  atmosphereTopRight: {
    top: spacing.xl,
    right: spacing.xl,
  },
  atmosphereBottomRight: {
    right: spacing.xl,
    bottom: spacing.lg,
  },
  nodeWrapper: {
    position: 'absolute',
  },
  nodePressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePressed: {
    transform: [{ scale: motion.scale.press }],
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'hidden',
    ...shadows.soft,
  },
  nodeCompleted: {
    borderColor: colors.success,
  },
  nodeEmoji: {
    textAlign: 'center',
  },
  nodeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
  },
  completedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  completedBadgeText: {
    ...typography.small,
    color: colors.white,
    fontFamily: fontFamilies.bodyBold,
  },
  orderBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.text,
  },
  orderBadgeText: {
    ...typography.small,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
    lineHeight: fontSizes.sm,
  },
  footerRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  footerText: {
    ...typography.small,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodySemiBold,
  },
  emptyMap: {
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  emptyMapEmoji: {
    fontSize: fontSizes.display,
    marginBottom: spacing.sm,
  },
  emptyMapText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});

export default MemoryPathMap;
