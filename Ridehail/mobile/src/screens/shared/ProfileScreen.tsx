import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logoutThunk } from '../../store/slices/authSlice';
import { api } from '../../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.getProfile().then(({ data }) => setProfile(data.data));
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutThunk());
          navigation.replace('Login');
        },
      },
    ]);
  };

  const current = profile || user;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {current?.profilePictureUrl ? (
            <Image source={{ uri: current.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {current?.firstName?.[0]}{current?.lastName?.[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{current?.firstName} {current?.lastName}</Text>
        <Text style={styles.email}>{current?.email}</Text>
        <View style={styles.ratingBadge}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{Number(current?.averageRating || 0).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({current?.totalRides || 0} rides)</Text>
        </View>
      </View>

      {/* Menu Items */}
      {[
        { icon: 'account-edit', label: 'Edit Profile', onPress: () => {} },
        { icon: 'credit-card', label: 'Payment Methods', onPress: () => {} },
        { icon: 'history', label: 'Ride History', onPress: () => navigation.navigate('History') },
        { icon: 'bell', label: 'Notifications', onPress: () => {} },
        { icon: 'shield-check', label: 'Privacy & Safety', onPress: () => {} },
        { icon: 'help-circle', label: 'Help & Support', onPress: () => {} },
        { icon: 'information', label: 'About RideHail', onPress: () => {} },
      ].map((item) => (
        <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
          <Icon name={item.icon} size={22} color="#6C63FF" />
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#FF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>RideHail v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#6C63FF',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  email: { color: '#888', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { fontWeight: '700', color: '#1a1a2e' },
  ratingCount: { color: '#888', fontSize: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 8, gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, marginTop: 8, borderWidth: 2,
    borderColor: '#FF4444', borderRadius: 14,
  },
  logoutText: { color: '#FF4444', fontWeight: '700', fontSize: 16 },
  version: { color: '#bbb', textAlign: 'center', marginTop: 20, marginBottom: 10 },
});
