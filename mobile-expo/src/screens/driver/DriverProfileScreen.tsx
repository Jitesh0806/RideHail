import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

export default function DriverProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const menuItems = [
    { icon: 'car-outline', label: 'My Vehicle', onPress: () => {} },
    { icon: 'document-text-outline', label: 'Documents', onPress: () => {} },
    { icon: 'cash-outline', label: 'Payout Settings', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Driver Support', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F97316', '#EA580C']} style={styles.header}>
        <View style={styles.avatar}><Text style={{ fontSize: 36 }}>🚗</Text></View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{user?.totalRides || 312}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{user?.averageRating ? `⭐ ${Number(user.averageRating).toFixed(1)}` : '⭐ 4.9'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>✅ Approved</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon as any} size={20} color="#374151" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 32, paddingTop: 64, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 14, gap: 20 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowOpacity: 0.05, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 24, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
