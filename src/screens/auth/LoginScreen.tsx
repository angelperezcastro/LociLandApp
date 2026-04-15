import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { AuthScreenProps } from '../../navigation/types';
import { signIn } from '../../services/auth';
import { useUserStore } from '../../store/useUserStore';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      Alert.alert('Campos incompletos', 'Introduce un email y una contraseña.');
      return;
    }

    try {
      setLoading(true);

      const result = await signIn(normalizedEmail, password);

      Alert.alert('Login correcto', `Sesión iniciada como: ${result.user.email}`);

      // Temporalmente mantenemos esto para no romper tu flujo actual
      // basado en Zustand. Cuando implementes onAuthStateChanged en el
      // AuthNavigator, esta línea debe desaparecer.
      setAuthenticated(true);
    } catch (error) {
      console.error('LoginScreen signIn error:', error);
      Alert.alert(
        'Error al iniciar sesión',
        'No se pudo iniciar sesión. Revisa email, contraseña y la consola.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>
            Pantalla temporal para probar login real con Firebase.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="El email que registraste antes"
              placeholderTextColor="#7F8C8D"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor="#7F8C8D"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.ghostButton]}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>No tengo cuenta · Ir a Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFBF0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D6E4F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D3436',
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#4D96FF',
  },
  ghostButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D6E4F0',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  ghostButtonText: {
    color: '#2D3436',
    fontSize: 15,
    fontWeight: '700',
  },
});