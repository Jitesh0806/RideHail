import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { registerRiderThunk } from '../../store/slices/authSlice';

export default function RegisterRiderScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  const update = (key: string) => (val: string) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    const result = await dispatch(registerRiderThunk(form));
    if (registerRiderThunk.fulfilled.match(result)) {
      navigation.replace('RiderApp');
    } else {
      Alert.alert('Registration Failed', result.payload as string);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Rider Account</Text>
        <Text style={styles.subtitle}>Start your journey today</Text>

        {[
          { key: 'firstName', label: 'First Name', placeholder: 'John' },
          { key: 'lastName', label: 'Last Name', placeholder: 'Doe' },
          { key: 'email', label: 'Email', placeholder: 'john@example.com', keyboardType: 'email-address' as any },
          { key: 'phone', label: 'Phone', placeholder: '+1234567890', keyboardType: 'phone-pad' as any },
          { key: 'password', label: 'Password', placeholder: 'Min 8 characters', secure: true },
          { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat password', secure: true },
        ].map((field) => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              keyboardType={field.keyboardType}
              secureTextEntry={field.secure}
              autoCapitalize="none"
              value={(form as any)[field.key]}
              onChangeText={update(field.key)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
  back: { marginBottom: 16 },
  backText: { color: '#6C63FF', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 24, fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
