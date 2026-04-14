import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

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
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.lg,
        justifyContent: 'center',
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 28,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={[
            typography.h1,
            {
              color: colors.text,
              textAlign: 'center',
              marginBottom: spacing.md,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              typography.body,
              {
                color: colors.text,
                textAlign: 'center',
                marginBottom: spacing.xl,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}

        <View style={{ gap: spacing.md }}>
          {actions.map((action) => {
            const variant = action.variant ?? 'primary';

            return (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={{
                  backgroundColor: getButtonBackground(variant),
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: 18,
                  borderWidth: variant === 'ghost' ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={[
                    typography.bodySemiBold,
                    {
                      color: getButtonTextColor(variant),
                      textAlign: 'center',
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