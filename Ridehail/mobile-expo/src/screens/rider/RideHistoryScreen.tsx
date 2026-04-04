import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchRideHistoryThunk } from '../../store/slices/rideSlice';
import { api } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: '#D1FAE5', text: '#065F46', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'In Progress' },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Text style={{ fontSize: 28 }}>{s <= value ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RideHistoryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { rideHistory } = useSelector((s: RootState) => s.ride);
  const [refreshing, setRefreshing] = useState(false);
  const [rateRide, setRateRide] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setRefreshing(true);
    await dispatch(fetchRideHistoryThunk());
    setRefreshing(false);
  };

  useEffect(() => { dispatch(fetchRideHistoryThunk()); }, []);

  const submitRating = async () => {
    setSubmitting(true);
    try {
      await api.post(`/rides/${rateRide.id}/rate`, { rating, ratedUserId: rateRide.driver?.id });
    } catch {}
    setSubmitting(false);
    setRateRide(null);
    setRating(5);
  };

  const renderItem = ({ item }: { item: any }) => {
    const s = STATUS_STYLES[item.status] || { bg: '#F3F4F6', text: '#374151', label: item.status };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.status === 'completed' && !item.rated && (setRateRide(item), setRating(5))}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
          </View>
          <Text style={styles.dateText}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{item.pickupLocation?.address || 'Pickup'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{item.dropoffLocation?.address || 'Destination'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.driver && <Text style={styles.driverText}>👤 {item.driver.name}</Text>}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {item.distance > 0 && <Text style={styles.meta}>{item.distance.toFixed(1)} km</Text>}
            {item.duration > 0 && <Text style={styles.meta}>{item.duration} min</Text>}
            {item.fare > 0 && <Text style={styles.fareText}>${item.fare.toFixed(2)}</Text>}
          </View>
        </View>

        {item.status === 'completed' && !item.rated && (
          <View style={styles.rateHint}>
            <Ionicons name="star-outline" size={14} color="#7C3AED" />
            <Text style={styles.rateHintText}>Tap to rate this ride</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>{rideHistory.length} trips</Text>
      </View>

      <FlatList
        data={rideHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#7C3AED" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySub}>Your ride history will appear here</Text>
          </View>
        }
      />

      {/* Rating modal */}
      <Modal visible={!!rateRide} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>Rate your ride</Text>
            {rateRide?.driver && <Text style={styles.ratingDriver}>with {rateRide.driver.name}</Text>}
            <StarRating value={rating} onChange={setRating} />
            <View style={styles.ratingBtns}>
              <TouchableOpacity onPress={() => setRateRide(null)} style={styles.ratingCancelBtn}>
                <Text style={styles.ratingCancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitRating} style={styles.ratingSubmitBtn} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.ratingSubmitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  route: { marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  routeText: { fontSize: 14, color: '#374151', flex: 1 },
  routeLine: { width: 1, height: 12, backgroundColor: '#E5E7EB', marginLeft: 3.5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverText: { fontSize: 13, color: '#6B7280' },
  meta: { fontSize: 12, color: '#9CA3AF' },
  fareText: { fontSize: 16, fontWeight: '800', color: '#7C3AED' },
  rateHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rateHintText: { fontSize: 12, color: '#7C3AED' },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  ratingModal: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', gap: 16 },
  ratingTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  ratingDriver: { fontSize: 14, color: '#6B7280', marginTop: -8 },
  ratingBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  ratingCancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ratingCancelText: { color: '#6B7280', fontWeight: '600' },
  ratingSubmitBtn: { flex: 1, backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ratingSubmitText: { color: '#fff', fontWeight: '700' },
});
