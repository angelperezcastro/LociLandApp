// src/components/progress/MemoryConstellationCard.tsx

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
} from 'react-native-svg';

import type { WeeklyActivityDay } from '../../services/progressService';
import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';

type ChartPoint = {
  x: number;
  y: number;
};

type MemoryConstellationCardProps = {
  days: WeeklyActivityDay[];
  younger?: boolean;
};

const YOUNGER_POINTS: ChartPoint[] = [
  { x: 13, y: 58 },
  { x: 27, y: 40 },
  { x: 41, y: 54 },
  { x: 55, y: 34 },
  { x: 69, y: 48 },
  { x: 82, y: 32 },
  { x: 92, y: 52 },
];

const OLDER_POINTS: ChartPoint[] = [
  { x: 12, y: 64 },
  { x: 25, y: 38 },
  { x: 38, y: 52 },
  { x: 52, y: 28 },
  { x: 66, y: 45 },
  { x: 80, y: 25 },
  { x: 92, y: 50 },
];

const getPointKey = (point: ChartPoint, index: number): string => {
  return `${point.x}-${point.y}-${index}`;
};

const createSmoothPath = (points: ChartPoint[]): string => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

export function MemoryConstellationCard({
  days,
  younger = false,
}: MemoryConstellationCardProps) {
  const reviewedCount = useMemo(
    () => days.filter((day) => day.reviewed).length,
    [days],
  );

  const points = younger ? YOUNGER_POINTS : OLDER_POINTS;
  const visiblePoints = points.slice(0, days.length);

  return (
    <View style={[styles.card, younger ? styles.youngerCard : null]}>
      <View style={styles.headerRow}>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>
            {younger ? 'Memory Stars ⭐' : 'Memory constellation'}
          </Text>

          <Text style={styles.subtitle}>
            {younger
              ? 'Bright stars show the days you practised.'
              : 'Your review activity becomes a weekly memory pattern.'}
          </Text>
        </View>

        <View style={[styles.countPill, younger ? styles.youngerCountPill : null]}>
          <Text style={styles.countText}>{reviewedCount}/7</Text>
        </View>
      </View>

      {younger ? (
        <YoungerStarChart days={days} points={visiblePoints} />
      ) : (
        <OlderConstellationChart days={days} points={visiblePoints} />
      )}
    </View>
  );
}

const YoungerStarChart = ({
  days,
  points,
}: {
  days: WeeklyActivityDay[];
  points: ChartPoint[];
}) => {
  return (
    <View style={styles.youngerStage}>
      <View style={styles.youngerBackdrop} pointerEvents="none">
        <Text style={[styles.floatingDecoration, styles.floatingDecorationLeft]}>
          ✨
        </Text>
        <Text style={[styles.floatingDecoration, styles.floatingDecorationRight]}>
          🌙
        </Text>
      </View>

      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
      >
        {points.slice(0, Math.max(days.length - 1, 0)).map((point, index) => {
          const nextPoint = points[index + 1];
          const isActiveConnection = days[index]?.reviewed && days[index + 1]?.reviewed;

          return (
            <Line
              key={getPointKey(point, index)}
              x1={point.x}
              y1={point.y}
              x2={nextPoint.x}
              y2={nextPoint.y}
              stroke={isActiveConnection ? colors.primary : colors.accentSoft}
              strokeWidth={isActiveConnection ? 5 : 4}
              strokeLinecap="round"
              opacity={isActiveConnection ? 0.9 : 0.58}
            />
          );
        })}
      </Svg>

      {days.map((day, index) => {
        const point = points[index];
        const isReviewed = day.reviewed;

        return (
          <View
            key={day.dateString}
            style={[
              styles.youngerNode,
              {
                left: `${point.x}%`,
                top: `${point.y}%`,
              },
              isReviewed ? styles.youngerNodeReviewed : styles.youngerNodeEmpty,
              day.isToday ? styles.youngerNodeToday : null,
            ]}
          >
            <Text
              style={[
                styles.youngerNodeSymbol,
                isReviewed
                  ? styles.youngerNodeSymbolReviewed
                  : styles.youngerNodeSymbolEmpty,
              ]}
            >
              {isReviewed ? '★' : '☆'}
            </Text>
          </View>
        );
      })}

      <View style={styles.youngerDayLabelsRow}>
        {days.map((day) => (
          <View key={day.dateString} style={styles.dayLabelItem}>
            <Text
              style={[
                styles.dayLabel,
                styles.youngerDayLabel,
                day.reviewed ? styles.dayLabelReviewed : null,
                day.isToday ? styles.dayLabelToday : null,
              ]}
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const OlderConstellationChart = ({
  days,
  points,
}: {
  days: WeeklyActivityDay[];
  points: ChartPoint[];
}) => {
  const activePath = createSmoothPath(points);
  const activeDays = days.filter((day) => day.reviewed).length;

  return (
    <View style={styles.olderStage}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
      >
        {[24, 42, 60].map((gridY) => (
          <Line
            key={`grid-${gridY}`}
            x1={8}
            y1={gridY}
            x2={94}
            y2={gridY}
            stroke={colors.border}
            strokeWidth={1.1}
            opacity={0.48}
          />
        ))}

        {[20, 40, 60, 80].map((gridX) => (
          <Line
            key={`grid-x-${gridX}`}
            x1={gridX}
            y1={20}
            x2={gridX}
            y2={70}
            stroke={colors.border}
            strokeWidth={1}
            opacity={0.22}
          />
        ))}

        {activePath ? (
          <Path
            d={activePath}
            fill="none"
            stroke={colors.primarySoft}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.46}
          />
        ) : null}

        {points.slice(0, Math.max(days.length - 1, 0)).map((point, index) => {
          const nextPoint = points[index + 1];
          const isActiveConnection = days[index]?.reviewed || days[index + 1]?.reviewed;

          return (
            <Line
              key={getPointKey(point, index)}
              x1={point.x}
              y1={point.y}
              x2={nextPoint.x}
              y2={nextPoint.y}
              stroke={isActiveConnection ? colors.accent : colors.border}
              strokeWidth={isActiveConnection ? 3.2 : 2}
              strokeLinecap="round"
              opacity={isActiveConnection ? 0.84 : 0.5}
            />
          );
        })}

        {days.map((day, index) => {
          const point = points[index];
          const isReviewed = day.reviewed;

          return (
            <React.Fragment key={day.dateString}>
              {day.isToday ? (
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={7.3}
                  fill={colors.primarySoft}
                  stroke={colors.primary}
                  strokeWidth={2}
                  opacity={0.92}
                />
              ) : null}

              <Circle
                cx={point.x}
                cy={point.y}
                r={isReviewed ? 4.8 : 4.3}
                fill={isReviewed ? colors.primary : colors.surface}
                stroke={isReviewed ? colors.accent : colors.accentSoft}
                strokeWidth={2.2}
              />

              {isReviewed ? (
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={2}
                  fill={colors.accent}
                  opacity={0.86}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.signalRow}>
        <Text style={styles.signalLabel}>weekly rhythm</Text>
        <Text style={styles.signalValue}>{activeDays} active days</Text>
      </View>

      <View style={styles.olderDayLabelsRow}>
        {days.map((day) => (
          <View key={day.dateString} style={styles.dayLabelItem}>
            <Text
              style={[
                styles.dayLabel,
                day.reviewed ? styles.dayLabelReviewed : null,
                day.isToday ? styles.dayLabelToday : null,
              ]}
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: colors.accentSoft,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  youngerCard: {
    borderColor: colors.primarySoft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodySemiBold,
  },
  countPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  youngerCountPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  countText: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  youngerStage: {
    height: 230,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  olderStage: {
    height: 250,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  youngerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingDecoration: {
    position: 'absolute',
    opacity: 0.3,
    fontSize: fontSizes.xl,
  },
  floatingDecorationLeft: {
    top: spacing.lg,
    left: spacing.xl,
  },
  floatingDecorationRight: {
    top: spacing.md,
    right: spacing.xl,
  },
  youngerNode: {
    position: 'absolute',
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -21,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...shadows.soft,
  },
  youngerNodeReviewed: {
    backgroundColor: colors.white,
    borderColor: colors.accent,
  },
  youngerNodeEmpty: {
    backgroundColor: colors.white,
    borderColor: colors.accentSoft,
  },
  youngerNodeToday: {
    borderColor: colors.emphasis,
  },
  youngerNodeSymbol: {
    fontSize: fontSizes.xl,
    lineHeight: 30,
    fontFamily: fontFamilies.bodyBold,
  },
  youngerNodeSymbolReviewed: {
    color: colors.primary,
  },
  youngerNodeSymbolEmpty: {
    color: colors.textSoft,
  },
  youngerDayLabelsRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  olderDayLabelsRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabelItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    ...typography.small,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodyBold,
  },
  youngerDayLabel: {
    color: colors.text,
  },
  dayLabelReviewed: {
    color: colors.text,
  },
  dayLabelToday: {
    color: colors.emphasis,
  },
  signalRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  signalLabel: {
    ...typography.small,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  signalValue: {
    ...typography.small,
    color: colors.accent,
    fontFamily: fontFamilies.bodyBold,
  },
});
