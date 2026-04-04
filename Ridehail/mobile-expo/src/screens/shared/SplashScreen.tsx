import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { restoreSessionThunk } from '../../store/slices/authSlice';

export default function SplashScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    dispatch(restoreSessionThunk())
      .unwrap()
      .catch(() => {
        setTimeout(() => navigation.replace('Login'), 1500);
      });
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'driver') navigation.replace('DriverApp');
      else navigation.replace('RiderApp');
    }
  }, [user]);

  return (
    <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.container}>
      <Text style={styles.icon}>🚗</Text>
      <Text style={styles.title}>RideHail</Text>
      <Text style={styles.subtitle}>Your ride, your way</Text>
      <ActivityIndicator color="#fff" size="large" style={styles.spinner} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  spinner: { marginTop: 48 },
});
