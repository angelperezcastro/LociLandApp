import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

type ActionVariant = 'primary' | 'secondary' | 'ghost';

type PlaceholderAction = {
  label: string;
  onPress: () => void;
  variant?: ActionVariant;
};

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
  actions?: PlaceholderAction[];
};

const getButtonBackground = (variant: ActionVariant) => {
  switch (variant) {
    case 'secondary':
      return colors.secondary;
    case 'ghost':
      return colors.white;
    case 'primary':
    default:
      return colors.accent;
  }
};

const getButtonTextColor = (variant: ActionVariant) => {
  return variant === 'ghost' ? colors.text : colors.white;
};

export function PlaceholderScreen({
  title,
  subtitle,
  actions = [],
}: PlaceholderScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>

        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.actions}>
          {actions.map((action) => {
            const variant = action.variant ?? 'primary';

            return (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: getButtonBackground(variant),
                    borderWidth: variant === 'ghost' ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySemiBold,
                    styles.actionText,
                    {
                      color: getButtonTextColor(variant),
                    },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderColor: colors.border,
  },
  actionText: {
    textAlign: 'center',
  },
});
