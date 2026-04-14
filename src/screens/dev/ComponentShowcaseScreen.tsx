import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../components/layout';
import { resetOnboardingSeen } from '../../services/onboardingStorage';
import {
  Avatar,
  Button,
  Card,
  Input,
  H1,
  H2,
  Body,
  Caption,
} from '../../components/ui';
import { colors, spacing } from '../../theme';

export function ComponentShowcaseScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Screen scroll>
      <H1 style={styles.pageTitle}>Component Showcase</H1>
      <Body style={styles.pageSubtitle}>
        This screen exists only to validate the reusable UI components.
      </Body>

      <Card style={styles.section}>
        <H2 style={styles.sectionTitle}>Typography</H2>
        <H1 style={styles.blockSpacing}>Heading 1 — LociLand</H1>
        <H2 style={styles.blockSpacing}>Heading 2 — Friendly and playful</H2>
        <Body style={styles.blockSpacing}>
          This is the default body text. It should look clean, readable, and child-friendly.
        </Body>
        <Caption color={colors.muted}>
          This is a caption for helper text, metadata, or small hints.
        </Caption>
      </Card>

      <Card style={styles.section}>
        <H2 style={styles.sectionTitle}>Buttons</H2>

        <View style={styles.blockSpacing}>
  <Button title="Primary Button" onPress={() => {}} />
</View>

<View style={styles.blockSpacing}>
  <Button title="Secondary Button" variant="secondary" onPress={() => {}} />
</View>

<View style={styles.blockSpacing}>
  <Button title="Ghost Button" variant="ghost" onPress={() => {}} />
</View>

<Button
  title="Reset onboarding"
  variant="ghost"
  onPress={async () => {
    await resetOnboardingSeen();
  }}
/>
      </Card>

      <Card style={styles.section}>
        <H2 style={styles.sectionTitle}>Input</H2>

        <View style={styles.blockSpacing}>
          <Input
            label="Display name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Input
          label="Email"
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={!email ? 'Email is required' : undefined}
        />
      </Card>

      <Card style={styles.section}>
        <H2 style={styles.sectionTitle}>Avatar</H2>

        <View style={styles.avatarRow}>
          <Avatar emojiFallback="🦊" size={64} />
          <Avatar emojiFallback="🦄" size={80} />
          <Avatar emojiFallback="🐉" size={96} />
        </View>
      </Card>

      <Card style={styles.section}>
        <H2 style={styles.sectionTitle}>Card</H2>
        <Body>
          This is the default Card component. All screens should build from this visual language
          instead of inventing their own container styles.
        </Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  blockSpacing: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});