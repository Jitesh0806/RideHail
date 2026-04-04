import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocation } from '../../hooks/useLocation';
import { connectSocket, disconnectSocket, sendLocationUpdate, goOnline, goOffline, onRideRequest, offRideRequest } from '../../services/socket';
import { api } from '../../services/api';

type DriverStatus = 'offline' | 'online' | 'on_ride';

const DEMO_RIDE_REQUEST = {
  id: 'demo-req-1',
  rider: { firstName: 'Alice', lastName: 'Johnson', rating: 4.8 },
  pickupLocation: { address: '123 Market St, San Francisco' },
  dropoffLocation: { address: '456 Castro St, San Francisco' },
  estimatedFare: 14.50,
  distance: 3.2,
  duration: 12,
};

export default function DriverHomeScreen() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [status, setStatus] = useState<DriverStatus>('offline');
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [earnings, setEarnings] = useState({ today: 0, trips: 0 });

  useEffect(() => {
    connectSocket();
    onRideRequest((ride) => setIncomingRide(ride));
    return () => {
      offRideRequest();
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (location && status === 'online') {
      sendLocationUpdate(location.latitude, location.longitude);
    }
    if (location) {
      mapRef.current?.animateToRegion({ ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
    }
  }, [location, status]);

  const toggleOnline = () => {
    if (status === 'offline') {
      setStatus('online');
      goOnline();
      // Demo: show a ride request after 3s
      setTimeout(() => setIncomingRide(DEMO_RIDE_REQUEST), 3000);
    } else if (status === 'online') {
      setStatus('offline');
      goOffline();
      setIncomingRide(null);
    }
  };

  const acceptRide = async () => {
    try {
      await api.post(`/rides/${incomingRide.id}/accept`);
    } catch {}
    setActiveRide({ ...incomingRide, tripStatus: 'en_route' });
    setIncomingRide(null);
    setStatus('on_ride');
  };

  const rejectRide = () => setIncomingRide(null);

  const advanceTrip = async () => {
    const transitions: Record<string, string> = { en_route: 'arrived', arrived: 'in_progress', in_progress: 'completed' };
    const next = transitions[activeRide.tripStatus];
    if (!next) return;
    try {
      const statusMap: Record<string, string> = { arrived: 'arrived', in_progress: 'in_progress', completed: 'completed' };
      if (statusMap[next]) await api.patch(`/rides/${activeRide.id}/status`, { status: statusMap[next] });
    } catch {}
    if (next === 'completed') {
      const fare = activeRide.estimatedFare || 14.50;
      setEarnings(e => ({ today: e.today + fare * 0.8, trips: e.trips + 1 }));
      setActiveRide(null);
      setStatus('online');
      Alert.alert('Trip completed!', `You earned $${(fare * 0.8).toFixed(2)}`);
    } else {
      setActiveRide({ ...activeRide, tripStatus: next });
    }
  };

  const TRIP_BTN: Record<string, { label: string; color: string }> = {
    en_route: { label: 'Mark as Arrived', color: '#3B82F6' },
    arrived: { label: 'Start Trip', color: '#10B981' },
    in_progress: { label: 'Complete Trip', color: '#7C3AED' },
  };

  const region = location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 } : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region || { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        showsUserLocation
      />

      {/* Status overlay */}
      <View style={styles.topBar}>
        <View style={[styles.statusPill, { backgroundColor: status === 'offline' ? '#374151' : status === 'online' ? '#059669' : '#7C3AED' }]}>
          <View style={[styles.statusDot, { backgroundColor: status === 'offline' ? '#9CA3AF' : '#86EFAC' }]} />
          <Text style={styles.statusText}>{status.toUpperCase().replace('_', ' ')}</Text>
        </View>
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsText}>${earnings.today.toFixed(2)} today · {earnings.trips} trips</Text>
        </View>
      </View>

      {/* Bottom card */}
      <View style={styles.bottomCard}>
        {status === 'offline' ? (
          <>
            <Text style={styles.cardTitle}>You are offline</Text>
            <Text style={styles.cardSub}>Go online to start receiving ride requests</Text>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: '#059669' }]} onPress={toggleOnline}>
              <Ionicons name="power" size={22} color="#fff" />
              <Text style={styles.toggleBtnText}>Go Online</Text>
            </TouchableOpacity>
          </>
        ) : status === 'online' ? (
          <>
            <Text style={styles.cardTitle}>You are online</Text>
            <Text style={styles.cardSub}>Waiting for ride requests nearby...</Text>
            <View style={styles.pingAnimation}><Text style={{ fontSize: 32 }}>📡</Text></View>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: '#374151' }]} onPress={toggleOnline}>
              <Ionicons name="power" size={22} color="#fff" />
              <Text style={styles.toggleBtnText}>Go Offline</Text>
            </TouchableOpacity>
          </>
        ) : activeRide ? (
          <>
            <Text style={styles.cardTitle}>Active Ride</Text>
            <View style={styles.rideInfo}>
              <View style={styles.rideInfoRow}>
                <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.rideInfoText}>{activeRide.pickupLocation?.address}</Text>
              </View>
              <View style={styles.rideInfoRow}>
                <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.rideInfoText}>{activeRide.dropoffLocation?.address}</Text>
              </View>
            </View>
            <View style={styles.fareBadge}>
              <Text style={styles.fareText}>Fare: ${activeRide.estimatedFare?.toFixed(2)}</Text>
              <Text style={styles.payoutText}>Your payout: ${(activeRide.estimatedFare * 0.8).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: TRIP_BTN[activeRide.tripStatus]?.color || '#7C3AED' }]}
              onPress={advanceTrip}
            >
              <Text style={styles.toggleBtnText}>{TRIP_BTN[activeRide.tripStatus]?.label}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Incoming ride modal */}
      <Modal visible={!!incomingRide} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.rideModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Ride Request! 🔔</Text>
            {incomingRide && (
              <>
                <View style={styles.riderRow}>
                  <View style={styles.riderAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                  <View>
                    <Text style={styles.riderName}>{incomingRide.rider?.firstName} {incomingRide.rider?.lastName}</Text>
                    <Text style={styles.riderRating}>⭐ {incomingRide.rider?.rating} · Rider</Text>
                  </View>
                  <Text style={styles.modalFare}>${incomingRide.estimatedFare?.toFixed(2)}</Text>
                </View>
                <View style={styles.routeBox}>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.routeText}>{incomingRide.pickupLocation?.address}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
                    <Text style={styles.routeText}>{incomingRide.dropoffLocation?.address}</Text>
                  </View>
                </View>
                <View style={styles.tripStats}>
                  <View style={styles.tripStat}><Text style={styles.tripStatVal}>{incomingRide.distance} km</Text><Text style={styles.tripStatLabel}>Distance</Text></View>
                  <View style={styles.tripStat}><Text style={styles.tripStatVal}>{incomingRide.duration} min</Text><Text style={styles.tripStatLabel}>Duration</Text></View>
                  <View style={styles.tripStat}><Text style={[styles.tripStatVal, { color: '#059669' }]}>${(incomingRide.estimatedFare * 0.8).toFixed(2)}</Text><Text style={styles.tripStatLabel}>Earnings</Text></View>
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={rejectRide}>
                    <Text style={styles.rejectBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={acceptRide}>
                    <Text style={styles.acceptBtnText}>Accept Ride</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: { position: 'absolute', top: 56, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  earningsBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  earningsText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
  pingAnimation: { alignSelf: 'center', marginBottom: 16 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  toggleBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rideInfo: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 12, gap: 6 },
  rideInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rideInfoText: { fontSize: 13, color: '#374151', flex: 1 },
  fareBadge: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12 },
  fareText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  payoutText: { fontSize: 14, color: '#059669', fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  rideModal: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  riderName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  riderRating: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  modalFare: { marginLeft: 'auto', fontSize: 22, fontWeight: '800', color: '#F97316' },
  routeBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16, gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { fontSize: 14, color: '#374151', flex: 1 },
  routeLine: { width: 1, height: 10, backgroundColor: '#E5E7EB', marginLeft: 3.5, marginVertical: 2 },
  tripStats: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tripStat: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, alignItems: 'center' },
  tripStatVal: { fontSize: 15, fontWeight: '800', color: '#111827' },
  tripStatLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  acceptBtn: { flex: 2, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
