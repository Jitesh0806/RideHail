import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../../services/api';
import dayjs from 'dayjs';

interface EarningsData {
  payments: any[];
  totalEarnings: number;
}

export default function DriverEarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      let startDate = dayjs();
      if (period === 'today') startDate = dayjs().startOf('day');
      else if (period === 'week') startDate = dayjs().subtract(7, 'day');
      else if (period === 'month') startDate = dayjs().subtract(30, 'day');

      const [earningsRes, summaryRes] = await Promise.all([
        api.getEarnings(startDate.toISOString()),
        api.getDriverEarnings(),
      ]);
      setEarnings(earningsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#FF6B35" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Earnings</Text>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#FF6B35' }]}>
          <Icon name="cash-multiple" size={28} color="#fff" />
          <Text style={styles.summaryAmount}>${Number(summary?.totalEarnings || 0).toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earned</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#6C63FF' }]}>
          <Icon name="clock-outline" size={28} color="#fff" />
          <Text style={styles.summaryAmount}>${Number(summary?.pendingEarnings || 0).toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#34C759' }]}>
          <Icon name="car-multiple" size={28} color="#fff" />
          <Text style={styles.summaryAmount}>{summary?.totalTrips || 0}</Text>
          <Text style={styles.summaryLabel}>Total Trips</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFD700' }]}>
          <Icon name="star" size={28} color="#fff" />
          <Text style={styles.summaryAmount}>{Number(summary?.averageRating || 0).toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Rating</Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Total for period */}
      <View style={styles.periodTotal}>
        <Text style={styles.periodTotalLabel}>
          {period === 'today' ? "Today's Earnings" : period === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
        </Text>
        <Text style={styles.periodTotalAmount}>${(earnings?.totalEarnings || 0).toFixed(2)}</Text>
      </View>

      {/* Transaction List */}
      <Text style={styles.sectionTitle}>Transactions</Text>
      {earnings?.payments.length === 0 ? (
        <Text style={styles.emptyText}>No transactions in this period</Text>
      ) : (
        earnings?.payments.map((payment) => (
          <View key={payment.id} style={styles.transaction}>
            <View style={styles.transactionLeft}>
              <Icon name="car" size={20} color="#6C63FF" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.transactionTitle}>Trip Completed</Text>
                <Text style={styles.transactionDate}>{dayjs(payment.createdAt).format('MMM D, h:mm A')}</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>+${Number(payment.driverAmount).toFixed(2)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, minWidth: '45%', borderRadius: 16, padding: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryAmount: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  periodSelector: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderRadius: 12, padding: 4, marginBottom: 16 },
  periodBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  periodBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  periodBtnText: { color: '#888', fontWeight: '600' },
  periodBtnTextActive: { color: '#1a1a2e' },
  periodTotal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  periodTotalLabel: { color: '#666', fontSize: 15 },
  periodTotalAmount: { fontSize: 24, fontWeight: 'bold', color: '#FF6B35' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  emptyText: { color: '#aaa', textAlign: 'center', padding: 20 },
  transaction: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionTitle: { fontWeight: '600', color: '#1a1a2e' },
  transactionDate: { color: '#888', fontSize: 12, marginTop: 2 },
  transactionAmount: { color: '#34C759', fontWeight: '700', fontSize: 16 },
});
