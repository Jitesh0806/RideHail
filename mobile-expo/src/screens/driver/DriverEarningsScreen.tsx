import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

const MOCK_TRANSACTIONS = [
  { id: 't1', riderName: 'Alice Johnson', pickup: '123 Market St', dropoff: '456 Castro St', fare: 14.50, payout: 11.60, distance: 3.2, duration: 12, date: new Date(Date.now() - 3600000).toISOString(), status: 'paid' },
  { id: 't2', riderName: 'Bob Smith', pickup: 'Union Square', dropoff: 'Mission District', fare: 22.80, payout: 18.24, distance: 5.1, duration: 18, date: new Date(Date.now() - 7200000).toISOString(), status: 'paid' },
  { id: 't3', riderName: 'Carol Davis', pickup: 'Fishermans Wharf', dropoff: 'Haight-Ashbury', fare: 19.30, payout: 15.44, distance: 4.3, duration: 15, date: new Date(Date.now() - 86400000).toISOString(), status: 'paid' },
  { id: 't4', riderName: 'Dan Wilson', pickup: 'SFO Airport', dropoff: 'Downtown SF', fare: 45.00, payout: 36.00, distance: 14.2, duration: 28, date: new Date(Date.now() - 172800000).toISOString(), status: 'paid' },
  { id: 't5', riderName: 'Eve Martinez', pickup: 'Pier 39', dropoff: 'Golden Gate Park', fare: 16.80, payout: 13.44, distance: 3.8, duration: 13, date: new Date(Date.now() - 259200000).toISOString(), status: 'paid' },
];

type Period = 'today' | 'week' | 'month';

export default function DriverEarningsScreen() {
  const [period, setPeriod] = useState<Period>('week');

  const filteredTx = MOCK_TRANSACTIONS.filter((t) => {
    const cutoff = period === 'today' ? dayjs().startOf('day') : period === 'week' ? dayjs().subtract(7, 'day') : dayjs().subtract(30, 'day');
    return dayjs(t.date).isAfter(cutoff);
  });

  const totalPayout = filteredTx.reduce((s, t) => s + t.payout, 0);
  const totalFare = filteredTx.reduce((s, t) => s + t.fare, 0);
  const totalDistance = filteredTx.reduce((s, t) => s + t.distance, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F97316', '#EA580C']} style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.periodRow}>
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.periodBtn, period === p && styles.periodBtnActive]}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.totalEarnings}>${totalPayout.toFixed(2)}</Text>
        <Text style={styles.totalLabel}>Total Payout (80%)</Text>
        <Text style={styles.grossNote}>Gross fare: ${totalFare.toFixed(2)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{filteredTx.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{totalDistance.toFixed(0)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{filteredTx.length > 0 ? `$${(totalPayout / filteredTx.length).toFixed(2)}` : '—'}</Text>
            <Text style={styles.statLabel}>Avg/trip</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredTx}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.listHeader}>Trip Details</Text>}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txHeader}>
              <View style={styles.txAvatar}><Text style={{ fontSize: 18 }}>👤</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txRider}>{item.riderName}</Text>
                <Text style={styles.txDate}>{dayjs(item.date).format('MMM D, h:mm A')}</Text>
              </View>
              <Text style={styles.txPayout}>${item.payout.toFixed(2)}</Text>
            </View>
            <View style={styles.txRoute}>
              <View style={styles.txRouteRow}>
                <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.txRouteText} numberOfLines={1}>{item.pickup}</Text>
              </View>
              <View style={styles.txRouteRow}>
                <View style={[styles.dot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.txRouteText} numberOfLines={1}>{item.dropoff}</Text>
              </View>
            </View>
            <View style={styles.txMeta}>
              <Text style={styles.txMetaText}>{item.distance} km · {item.duration} min</Text>
              <Text style={styles.txFare}>Fare: ${item.fare.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptySub}>Complete rides to see your earnings here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 56, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  periodRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: 4, gap: 4, marginBottom: 24 },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  periodBtnActive: { backgroundColor: '#fff' },
  periodText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  periodTextActive: { color: '#F97316' },
  totalEarnings: { fontSize: 42, fontWeight: '900', color: '#fff' },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  grossNote: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  list: { padding: 16, gap: 12 },
  listHeader: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  txCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2, shadowOpacity: 0.04, shadowRadius: 4 },
  txHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  txAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  txRider: { fontSize: 14, fontWeight: '700', color: '#111827' },
  txDate: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  txPayout: { fontSize: 18, fontWeight: '800', color: '#059669' },
  txRoute: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, gap: 4, marginBottom: 8 },
  txRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  txRouteText: { fontSize: 12, color: '#374151', flex: 1 },
  txMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  txMetaText: { fontSize: 12, color: '#9CA3AF' },
  txFare: { fontSize: 12, color: '#6B7280' },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
});
