import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StarRating from 'react-native-star-rating-widget';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchRideHistoryThunk } from '../../store/slices/rideSlice';
import { api } from '../../services/api';
import { Ride } from '../../types';
import dayjs from 'dayjs';

const statusColors: Record<string, string> = {
  completed: '#34C759',
  cancelled_by_rider: '#FF3B30',
  cancelled_by_driver: '#FF9500',
  no_driver_found: '#8E8E93',
};

const statusLabels: Record<string, string> = {
  completed: 'Completed',
  cancelled_by_rider: 'Cancelled',
  cancelled_by_driver: 'Driver Cancelled',
  no_driver_found: 'No Driver Found',
};

export default function RideHistoryScreen() {
  const dispatch = useAppDispatch();
  const { rideHistory } = useAppSelector((s) => s.ride);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const loadHistory = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    await dispatch(fetchRideHistoryThunk());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const submitRating = async () => {
    if (!selectedRide) return;
    try {
      await api.rateDriver({ rideId: selectedRide.id, score: ratingScore, comment: ratingComment });
      setSelectedRide(null);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => item.status === 'completed' && !item.rating && setSelectedRide(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{dayjs(item.createdAt).format('MMM D, YYYY HH:mm')}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#ccc' }]}>
          <Text style={styles.badgeText}>{statusLabels[item.status] || item.status}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Icon name="map-marker" size={14} color="#6C63FF" />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickupAddress}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <Icon name="flag-checkered" size={14} color="#FF4444" />
          <Text style={styles.routeText} numberOfLines={1}>{item.destinationAddress}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.distance}>{item.estimatedDistanceKm?.toFixed(1)} km</Text>
        <Text style={styles.fare}>${(item.finalFare || item.estimatedFare)?.toFixed(2)}</Text>
      </View>

      {item.status === 'completed' && !item.rating && (
        <Text style={styles.ratePrompt}>Tap to rate this ride ★</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6C63FF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Ride History</Text>
      <FlatList
        data={rideHistory}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="car-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No rides yet</Text>
          </View>
        }
      />

      {/* Rating Modal */}
      <Modal visible={!!selectedRide} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Driver</Text>
            <Text style={styles.modalSubtitle}>
              {selectedRide?.driver?.user?.firstName} {selectedRide?.driver?.user?.lastName}
            </Text>
            <StarRating rating={ratingScore} onChange={setRatingScore} starSize={40} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedRide(null)}>
                <Text>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={submitRating}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  screenTitle: { fontSize: 24, fontWeight: 'bold', padding: 20, paddingBottom: 8, color: '#1a1a2e' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDate: { color: '#888', fontSize: 13 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  route: { marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { color: '#333', fontSize: 13, flex: 1 },
  routeLine: { width: 1, height: 12, backgroundColor: '#ddd', marginLeft: 7, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  distance: { color: '#888', fontSize: 13 },
  fare: { fontWeight: '700', fontSize: 15, color: '#1a1a2e' },
  ratePrompt: { color: '#6C63FF', fontSize: 12, marginTop: 8, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#aaa', marginTop: 10, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  modalSubtitle: { color: '#888', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSubmit: { flex: 2, backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center' },
});
