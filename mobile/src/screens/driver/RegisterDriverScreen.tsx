import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { registerDriverThunk } from '../../store/slices/authSlice';

const VEHICLE_TYPES = [
  { value: 'economy', label: 'Economy' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'xl', label: 'XL' },
];

export default function RegisterDriverScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    vehicleMake: '', vehicleModel: '', vehicleYear: '', vehicleColor: '',
    vehiclePlate: '', vehicleType: 'standard',
    licenseNumber: '', licenseExpiry: '',
  });

  const update = (key: string) => (val: string) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    const result = await dispatch(registerDriverThunk({
      ...form,
      vehicleYear: parseInt(form.vehicleYear),
    }));
    if (registerDriverThunk.fulfilled.match(result)) {
      Alert.alert(
        'Registration Successful',
        'Your account is pending verification. We will review your documents and notify you.',
        [{ text: 'OK', onPress: () => navigation.replace('DriverApp') }],
      );
    } else {
      Alert.alert('Failed', result.payload as string);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Become a Driver</Text>
        <Text style={styles.subtitle}>Complete your profile to get started</Text>

        <Text style={styles.sectionHeader}>Personal Information</Text>
        {[
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email', keyboard: 'email-address' as any },
          { key: 'phone', label: 'Phone', keyboard: 'phone-pad' as any },
          { key: 'password', label: 'Password', secure: true },
          { key: 'confirmPassword', label: 'Confirm Password', secure: true },
        ].map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType={f.keyboard}
              secureTextEntry={f.secure}
              autoCapitalize="none"
              value={(form as any)[f.key]}
              onChangeText={update(f.key)}
            />
          </View>
        ))}

        <Text style={styles.sectionHeader}>Vehicle Details</Text>
        {[
          { key: 'vehicleMake', label: 'Make (e.g. Toyota)' },
          { key: 'vehicleModel', label: 'Model (e.g. Camry)' },
          { key: 'vehicleYear', label: 'Year', keyboard: 'numeric' as any },
          { key: 'vehicleColor', label: 'Color' },
          { key: 'vehiclePlate', label: 'License Plate', autoUpper: true },
        ].map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType={f.keyboard}
              autoCapitalize={f.autoUpper ? 'characters' : 'none'}
              value={(form as any)[f.key]}
              onChangeText={update(f.key)}
            />
          </View>
        ))}

        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.vehicleTypeRow}>
          {VEHICLE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.vehicleTypeBtn, form.vehicleType === t.value && styles.vehicleTypeBtnActive]}
              onPress={() => setForm({ ...form, vehicleType: t.value })}
            >
              <Text style={[styles.vehicleTypeBtnText, form.vehicleType === t.value && styles.vehicleTypeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeader}>License Information</Text>
        <Text style={styles.label}>License Number</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="characters"
          value={form.licenseNumber}
          onChangeText={update('licenseNumber')}
        />
        <Text style={styles.label}>License Expiry (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-12-31"
          value={form.licenseExpiry}
          onChangeText={update('licenseExpiry')}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Application</Text>}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          After registration, upload your license and insurance documents in your profile for faster approval.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff', paddingBottom: 40 },
  back: { marginBottom: 16 },
  backText: { color: '#FF6B35', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 8, fontSize: 15 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#6C63FF', marginTop: 24, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  vehicleTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  vehicleTypeBtn: {
    borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  vehicleTypeBtnActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B35' },
  vehicleTypeBtnText: { color: '#666', fontWeight: '600' },
  vehicleTypeBtnTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#FF6B35', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
