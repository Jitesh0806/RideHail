import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { loginThunk } from '../../store/slices/authSlice';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('alice@ridehail.com');
  const [password, setPassword] = useState('Rider@123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
    } catch (e: any) {
      Alert.alert('Login Failed', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.header}>
          <Text style={styles.icon}>🚗</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </LinearGradient>

        <View style={styles.form}>
          {/* Demo notice */}
          <View style={styles.demoNotice}>
            <Text style={styles.demoText}>
              <Text style={{ fontWeight: 'bold' }}>Demo mode:</Text> Pre-filled with rider account.{'\n'}
              Use david@ridehail.com / Driver@123 for driver view.
            </Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="your@email.com"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In →</Text>}
          </TouchableOpacity>

          <View style={styles.divider}><View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} /></View>

          <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('RegisterRider')}>
            <Text style={styles.outlineBtnText}>Create Rider Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.outlineBtn, { borderColor: '#F97316' }]} onPress={() => navigation.navigate('RegisterDriver')}>
            <Text style={[styles.outlineBtnText, { color: '#F97316' }]}>Register as Driver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 48, paddingTop: 72, alignItems: 'center' },
  icon: { fontSize: 52 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  demoNotice: { backgroundColor: '#EDE9FE', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#C4B5FD' },
  demoText: { fontSize: 13, color: '#6D28D9' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff', marginBottom: 16 },
  btn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 13 },
  outlineBtn: { borderWidth: 1.5, borderColor: '#7C3AED', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 12 },
  outlineBtnText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
});
