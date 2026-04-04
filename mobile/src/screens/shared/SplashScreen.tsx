import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { restoreSessionThunk } from '../../store/slices/authSlice';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const init = async () => {
      await dispatch(restoreSessionThunk());
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      navigation.replace(user.role === 'driver' ? 'DriverApp' : 'RiderApp');
    } else {
      const timer = setTimeout(() => navigation.replace('Login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚗</Text>
      <Text style={styles.title}>RideHail</Text>
      <ActivityIndicator color="#6C63FF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF' },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
  loader: { marginTop: 20 },
});
