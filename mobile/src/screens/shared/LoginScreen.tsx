import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { loginThunk, clearError } from '../../store/slices/authSlice';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    const result = await dispatch(loginThunk({ email: email.trim(), password }));
    if (loginThunk.fulfilled.match(result)) {
      const user = result.payload.user;
      navigation.replace(user.role === 'driver' ? 'DriverApp' : 'RiderApp');
    } else {
      Alert.alert('Login Failed', result.payload as string);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <Text style={styles.dividerText}>Don't have an account?</Text>
          </View>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate('RegisterRider')}
          >
            <Text style={styles.outlineButtonText}>Sign up as Rider</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate('RegisterDriver')}
          >
            <Text style={styles.outlineButtonText}>Sign up as Driver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logo: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 12 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  form: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#6C63FF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { alignItems: 'center', marginVertical: 20 },
  dividerText: { color: '#888', fontSize: 14 },
  outlineButton: {
    borderWidth: 2, borderColor: '#6C63FF', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  outlineButtonText: { color: '#6C63FF', fontSize: 16, fontWeight: '600' },
});
