// src/components/layout/Screen.tsx

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout, spacing, type ColorToken } from '../../theme';

type ScreenBackgroundColor = ColorToken | (string & {});

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  centered?: boolean;
  backgroundColor?: ScreenBackgroundColor;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

function resolveBackgroundColor(backgroundColor: ScreenBackgroundColor): string {
  if (backgroundColor in colors) {
    return colors[backgroundColor as ColorToken];
  }

  return backgroundColor;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  centered = false,
  backgroundColor = 'bg',
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const baseContentStyle = [
    styles.content,
    padded && styles.padded,
    centered && styles.centered,
    contentContainerStyle,
  ];

  return (
    <SafeAreaView
      testID={testID}
      style={[
        styles.safeArea,
        {
          backgroundColor: resolveBackgroundColor(backgroundColor),
        },
        style,
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={baseContentStyle}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={baseContentStyle}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});