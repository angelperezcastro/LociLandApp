import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { signOut } from '../../services/auth';
import { useUserStore } from '../../store/useUserStore';
import { colors, spacing } from '../../theme';

export function ProfileScreen() {
  const profile = useUserStore((state) => state.profile);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Do you want to log out now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
          } catch {
            Alert.alert('Error', 'Could not log out. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.avatar}>{profile?.avatarEmoji ?? '🦊'}</Text>
        <Text style={styles.name}>{profile?.displayName ?? 'Explorer'}</Text>
        <Text style={styles.email}>{profile?.email ?? 'No email found'}</Text>

        <Pressable
          onPress={handleLogout}
          disabled={loading}
          style={[styles.logoutButton, loading ? styles.buttonDisabled : null]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutButtonText}>Log out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  avatar: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    minHeight: 56,
    minWidth: 180,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emphasis,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});