import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../../hooks/useAppDispatch';

export default function RideTrackingScreen() {
  const { currentRide, driverLocation } = useAppSelector((s) => s.ride);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [driverLocation]);

  if (!currentRide) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="map-marker-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No active ride to track</Text>
        <Text style={styles.emptySubtext}>Request a ride from the Home tab</Text>
      </View>
    );
  }

  const getStatusColor = () => {
    switch (currentRide.status) {
      case 'driver_en_route': return '#FF9500';
      case 'driver_arrived': return '#34C759';
      case 'in_progress': return '#6C63FF';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
      >
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            title="Your Driver"
          >
            <View style={[styles.driverMarker, { backgroundColor: getStatusColor() }]}>
              <Icon name="car" size={20} color="#fff" />
            </View>
          </Marker>
        )}
        <Marker
          coordinate={{
            latitude: currentRide.pickupLatitude,
            longitude: currentRide.pickupLongitude,
          }}
          title="Pickup"
          pinColor="green"
        />
        <Marker
          coordinate={{
            latitude: currentRide.destinationLatitude,
            longitude: currentRide.destinationLongitude,
          }}
          title="Destination"
          pinColor="red"
        />
      </MapView>

      {/* Status overlay */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <View>
          <Text style={styles.statusText}>
            {currentRide.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {currentRide.driver && (
            <Text style={styles.driverName}>
              {currentRide.driver.user?.firstName} •{' '}
              {currentRide.driver.vehiclePlate}
            </Text>
          )}
        </View>
      </View>

      {/* Trip info footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Icon name="map-marker" size={16} color="#6C63FF" />
          <Text style={styles.footerText} numberOfLines={1}>{currentRide.pickupAddress}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerRow}>
          <Icon name="flag-checkered" size={16} color="#FF4444" />
          <Text style={styles.footerText} numberOfLines={1}>{currentRide.destinationAddress}</Text>
        </View>
        <View style={styles.fareRow}>
          <Icon name="cash" size={16} color="#333" />
          <Text style={styles.fareText}>
            Est. ${currentRide.estimatedFare?.toFixed(2)} •{' '}
            ~{currentRide.estimatedDistanceKm?.toFixed(1)} km
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtext: { color: '#888', marginTop: 6 },
  driverMarker: { borderRadius: 20, padding: 6, borderWidth: 2, borderColor: '#fff' },
  statusBar: {
    position: 'absolute', top: 50, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusText: { fontWeight: '700', fontSize: 13, color: '#1a1a2e' },
  driverName: { color: '#666', fontSize: 12, marginTop: 2 },
  footer: {
    backgroundColor: '#fff', padding: 20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, elevation: 8,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  footerText: { color: '#333', fontSize: 14, flex: 1 },
  footerDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 6, marginLeft: 24 },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  fareText: { color: '#555', fontWeight: '600' },
});
