import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocation } from '../../hooks/useLocation';

const STATUS_COLORS: Record<string, string> = {
  searching: '#F59E0B',
  driver_en_route: '#3B82F6',
  arrived: '#10B981',
  in_progress: '#7C3AED',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

export default function RideTrackingScreen() {
  const { currentRide } = useSelector((s: RootState) => s.ride);
  const { location } = useLocation();

  if (!currentRide) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyTitle}>No active ride</Text>
        <Text style={styles.emptySub}>Book a ride from the Home tab to see live tracking here.</Text>
      </View>
    );
  }

  const center = {
    latitude: currentRide.driver?.latitude || location?.latitude || 37.7749,
    longitude: currentRide.driver?.longitude || location?.longitude || -122.4194,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const statusColor = STATUS_COLORS[currentRide.status] || '#7C3AED';

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={center} showsUserLocation>
        {currentRide.driver && (
          <Marker coordinate={{ latitude: currentRide.driver.latitude, longitude: currentRide.driver.longitude }}>
            <View style={[styles.driverMarker, { borderColor: statusColor }]}>
              <Text style={{ fontSize: 20 }}>🚗</Text>
            </View>
          </Marker>
        )}
        {currentRide.pickupLocation && (
          <Marker coordinate={currentRide.pickupLocation} pinColor="#22C55E" title="Pickup" />
        )}
        {currentRide.dropoffLocation && (
          <Marker coordinate={currentRide.dropoffLocation} pinColor="#7C3AED" title="Destination" />
        )}
      </MapView>

      <View style={styles.infoCard}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {currentRide.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </View>

        {currentRide.driver && (
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{currentRide.driver.name}</Text>
              <Text style={styles.driverDetails}>{currentRide.driver.vehicle} · {currentRide.driver.plate} · ⭐{currentRide.driver.rating}</Text>
            </View>
          </View>
        )}

        <View style={styles.tripDetails}>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>Fare</Text>
            <Text style={styles.tripValue}>${currentRide.fare?.toFixed(2) || '—'}</Text>
          </View>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>Distance</Text>
            <Text style={styles.tripValue}>{currentRide.distance ? `${currentRide.distance.toFixed(1)} km` : '—'}</Text>
          </View>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>ETA</Text>
            <Text style={styles.tripValue}>{currentRide.duration ? `${currentRide.duration} min` : '—'}</Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <View style={styles.addressItem}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.addressText} numberOfLines={1}>{currentRide.pickupLocation?.address || 'Pickup'}</Text>
          </View>
          <View style={styles.addressItem}>
            <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.addressText} numberOfLines={1}>{currentRide.dropoffLocation?.address || 'Destination'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverMarker: { backgroundColor: '#fff', borderRadius: 22, padding: 6, borderWidth: 2, elevation: 4 },
  infoCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  driverDetails: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tripDetails: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tripItem: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, alignItems: 'center' },
  tripLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  tripValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  addressRow: { gap: 8 },
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  addressText: { fontSize: 13, color: '#374151', flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
