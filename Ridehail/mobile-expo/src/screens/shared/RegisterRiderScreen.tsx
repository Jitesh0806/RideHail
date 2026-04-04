import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerRiderThunk } from '../../store/slices/authSlice';

export default function RegisterRiderScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password) return Alert.alert('Missing fields', 'Please fill all required fields.');
    setLoading(true);
    try {
      await dispatch(registerRiderThunk(form)).unwrap();
    } catch (e: any) {
      Alert.alert('Registration failed', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Rider Account</Text>
          <Text style={styles.subtitle}>Join RideHail as a rider</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'First Name *', key: 'firstName', placeholder: 'John' },
            { label: 'Last Name', key: 'lastName', placeholder: 'Doe' },
            { label: 'Email *', key: 'email', placeholder: 'john@example.com', keyboardType: 'email-address' },
            { label: 'Phone', key: 'phone', placeholder: '+1 555-0000', keyboardType: 'phone-pad' },
            { label: 'Password *', key: 'password', placeholder: '••••••••', secure: true },
          ].map((f) => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={form[f.key as keyof typeof form]}
                onChangeText={set(f.key as keyof typeof form)}
                placeholder={f.placeholder}
                keyboardType={(f as any).keyboardType || 'default'}
                secureTextEntry={(f as any).secure}
                autoCapitalize="none"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account →</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  back: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  form: { padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff', marginBottom: 4 },
  btn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#7C3AED', fontSize: 14 },
});
