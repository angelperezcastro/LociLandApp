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
import { signUp } from '../../services/auth';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleFillTestEmail = () => {
    setEmail(`test${Date.now()}@lociland.dev`);
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      Alert.alert('Campos incompletos', 'Introduce un email y una contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Email no válido', 'Introduce un email con formato correcto.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña demasiado corta',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    try {
      setLoading(true);

      const result = await signUp(normalizedEmail, password);

      Alert.alert(
        'Registro correcto',
        `Usuario creado en Firebase: ${result.user.email}`
      );

      navigation.navigate('Login');
    } catch (error) {
      console.error('RegisterScreen signUp error:', error);
      Alert.alert(
        'Error al registrar',
        'No se pudo crear la cuenta. Revisa la consola y Firebase Authentication.'
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Pantalla temporal para probar Firebase Auth con registro real.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#7F8C8D"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleFillTestEmail}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Usar email de prueba automático</Text>
          </Pressable>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta en Firebase</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.ghostButton]}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>Ya tengo cuenta · Ir a Login</Text>
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
  secondaryButton: {
    backgroundColor: '#6BCB77',
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
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  ghostButtonText: {
    color: '#2D3436',
    fontSize: 15,
    fontWeight: '700',
  },
});