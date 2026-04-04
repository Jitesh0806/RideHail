import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerDriverThunk } from '../../store/slices/authSlice';

const VEHICLE_TYPES = ['economy', 'standard', 'premium', 'xl'] as const;

export default function RegisterDriverScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', vehicleMake: '', vehicleModel: '', vehiclePlate: '', vehicleColor: '', vehicleYear: '', vehicleType: 'standard' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password || !form.vehicleMake) {
      return Alert.alert('Missing fields', 'Please fill all required fields.');
    }
    setLoading(true);
    try {
      await dispatch(registerDriverThunk(form)).unwrap();
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
          <Text style={styles.title}>Register as Driver</Text>
          <Text style={styles.subtitle}>Start earning with RideHail</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          {([
            ['First Name *', 'firstName', 'John'],
            ['Last Name', 'lastName', 'Doe'],
            ['Email *', 'email', 'john@example.com', 'email-address'],
            ['Phone', 'phone', '+1 555-0000', 'phone-pad'],
            ['Password *', 'password', '••••••••', 'default', true],
          ] as const).map(([label, key, placeholder, kb, secure]) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={set(key as keyof typeof form)}
                placeholder={placeholder}
                keyboardType={kb as any || 'default'}
                secureTextEntry={!!secure}
                autoCapitalize="none"
              />
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Vehicle Info</Text>
          {([
            ['Make *', 'vehicleMake', 'Toyota'],
            ['Model *', 'vehicleModel', 'Camry'],
            ['Plate Number *', 'vehiclePlate', 'ABC 123'],
            ['Color', 'vehicleColor', 'White'],
            ['Year', 'vehicleYear', '2020', 'numeric'],
          ] as const).map(([label, key, placeholder, kb]) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={set(key as keyof typeof form)}
                placeholder={placeholder}
                keyboardType={kb as any || 'default'}
              />
            </View>
          ))}

          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.typeRow}>
            {VEHICLE_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setForm(f => ({ ...f, vehicleType: t }))}
                style={[styles.typeBtn, form.vehicleType === t && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, form.vehicleType === t && styles.typeBtnTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>After registration, an admin will review your documents before you can go online.</Text>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#F97316' }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Application →</Text>}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 5, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff', marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  typeBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff' },
  typeBtnActive: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  typeBtnText: { fontSize: 13, color: '#6B7280' },
  typeBtnTextActive: { color: '#F97316', fontWeight: '600' },
  noteBox: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  noteText: { fontSize: 13, color: '#92400E' },
  btn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 20, paddingBottom: 20 },
  linkText: { color: '#7C3AED', fontSize: 14 },
});
