import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppTabScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';

export function ProgressScreen({}: AppTabScreenProps<'Progress'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Progress</Text>
      <Text style={styles.title}>Your memory journey</Text>
      <Text style={styles.subtitle}>
        This screen will show your weekly activity, XP growth and achievements soon.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardBody}>
          Week 6 will connect this screen to real stats, XP progress and achievements.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.smallCardValue}>0</Text>
          <Text style={styles.smallCardLabel}>Reviews</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallCardValue}>0</Text>
          <Text style={styles.smallCardLabel}>XP</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallCardValue}>0</Text>
          <Text style={styles.smallCardLabel}>Streak</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
    fontFamily: 'FredokaOne_400Regular',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.85,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
    fontFamily: 'FredokaOne_400Regular',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallCardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.xs,
    fontFamily: 'FredokaOne_400Regular',
  },
  smallCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    opacity: 0.8,
  },
});