import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyDriversThunk, requestRideThunk, cancelRideThunk, clearCurrentRide } from '../../store/slices/rideSlice';
import { useLocation } from '../../hooks/useLocation';

const VEHICLE_TYPES = [
  { id: 'economy', label: 'Economy', icon: '🚗', desc: 'Affordable rides', multiplier: 1 },
  { id: 'standard', label: 'Standard', icon: '🚙', desc: 'Comfortable rides', multiplier: 1.3 },
  { id: 'premium', label: 'Premium', icon: '🏎️', desc: 'Luxury vehicles', multiplier: 1.8 },
  { id: 'xl', label: 'XL', icon: '🚐', desc: 'For groups', multiplier: 1.5 },
];

const STATUS_LABELS: Record<string, string> = {
  searching: 'Finding your driver...',
  driver_en_route: 'Driver is on the way',
  arrived: 'Driver has arrived',
  in_progress: 'Ride in progress',
  completed: 'Ride completed!',
  cancelled: 'Ride cancelled',
};

export default function RiderHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { location } = useLocation();
  const { currentRide, nearbyDrivers, searching } = useSelector((s: RootState) => s.ride);
  const mapRef = useRef<MapView>(null);

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedType, setSelectedType] = useState('standard');
  const [showBooking, setShowBooking] = useState(false);

  const region = location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 } : undefined;

  useEffect(() => {
    if (location) {
      dispatch(fetchNearbyDriversThunk(location));
      const interval = setInterval(() => dispatch(fetchNearbyDriversThunk(location!)), 10000);
      return () => clearInterval(interval);
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      mapRef.current?.animateToRegion({ ...location, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 800);
    }
  }, [location]);

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) return Alert.alert('Missing info', 'Please enter pickup and destination.');
    if (!location) return Alert.alert('Location needed', 'Please allow location access.');

    const payload = {
      pickupLocation: { latitude: location.latitude + 0.001, longitude: location.longitude + 0.001, address: pickup },
      dropoffLocation: { latitude: location.latitude + 0.02, longitude: location.longitude + 0.02, address: dropoff },
      vehicleType: selectedType,
    };
    setShowBooking(false);
    await dispatch(requestRideThunk(payload));
  };

  const handleCancel = () => {
    if (currentRide) dispatch(cancelRideThunk(currentRide.id));
    else dispatch(clearCurrentRide());
  };

  const estFare = VEHICLE_TYPES.find(v => v.id === selectedType)?.multiplier || 1;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region || { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbyDrivers.map((d) => (
          <Marker key={d.id} coordinate={{ latitude: d.latitude, longitude: d.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}><Text style={{ fontSize: 18 }}>🚗</Text></View>
          </Marker>
        ))}
        {currentRide?.driver && (
          <Marker coordinate={{ latitude: currentRide.driver.latitude, longitude: currentRide.driver.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.driverMarker, { backgroundColor: '#7C3AED' }]}><Text style={{ fontSize: 18 }}>🚗</Text></View>
          </Marker>
        )}
      </MapView>

      {/* Search box */}
      {!currentRide && !searching && (
        <View style={styles.searchBox}>
          <TouchableOpacity style={styles.whereToBtn} onPress={() => setShowBooking(true)}>
            <Ionicons name="search" size={18} color="#7C3AED" />
            <Text style={styles.whereToText}>Where to?</Text>
          </TouchableOpacity>
          <Text style={styles.driversNearby}>{nearbyDrivers.length} drivers nearby</Text>
        </View>
      )}

      {/* Searching state */}
      {searching && (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#7C3AED" size="large" />
          <Text style={styles.statusTitle}>Finding your driver</Text>
          <Text style={styles.statusSub}>Searching nearby drivers...</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active ride */}
      {currentRide && !searching && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>{STATUS_LABELS[currentRide.status] || currentRide.status}</Text>
          {currentRide.driver && (
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{currentRide.driver.name}</Text>
                <Text style={styles.driverVehicle}>{currentRide.driver.vehicle} · {currentRide.driver.plate}</Text>
                <Text style={styles.driverRating}>⭐ {currentRide.driver.rating}</Text>
              </View>
              <Text style={styles.fare}>${currentRide.fare?.toFixed(2)}</Text>
            </View>
          )}
          {['driver_en_route', 'arrived', 'searching'].includes(currentRide.status) && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Booking modal */}
      <Modal visible={showBooking} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book a Ride</Text>
            <TouchableOpacity onPress={() => setShowBooking(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationInputs}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <TextInput style={styles.locationInput} placeholder="Pickup location" value={pickup} onChangeText={setPickup} />
            </View>
            <View style={styles.locationSeparator} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
              <TextInput style={styles.locationInput} placeholder="Where to?" value={dropoff} onChangeText={setDropoff} />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Choose vehicle type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {VEHICLE_TYPES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.typeCard, selectedType === v.id && styles.typeCardActive]}
                onPress={() => setSelectedType(v.id)}
              >
                <Text style={styles.typeIcon}>{v.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === v.id && { color: '#7C3AED' }]}>{v.label}</Text>
                <Text style={styles.typeDesc}>{v.desc}</Text>
                <Text style={[styles.typePrice, selectedType === v.id && { color: '#7C3AED' }]}>
                  ~${(8 * v.multiplier).toFixed(0)}+
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.bookBtn} onPress={handleRequestRide}>
            <Text style={styles.bookBtnText}>Request {VEHICLE_TYPES.find(v => v.id === selectedType)?.label}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverMarker: { backgroundColor: '#fff', borderRadius: 20, padding: 4, elevation: 4, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  searchBox: { position: 'absolute', bottom: 30, left: 16, right: 16 },
  whereToBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 8, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  whereToText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  driversNearby: { textAlign: 'center', marginTop: 8, fontSize: 12, color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'center' },
  statusCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 16, shadowOpacity: 0.2, shadowRadius: 16 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 },
  statusSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, marginTop: 8, marginBottom: 16 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  driverRating: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  fare: { fontSize: 22, fontWeight: '800', color: '#7C3AED' },
  cancelBtn: { borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#fff', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  locationInputs: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locationInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 8 },
  locationSeparator: { height: 1, backgroundColor: '#E5E7EB', marginLeft: 22, marginVertical: 4 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  typeScroll: { marginBottom: 24 },
  typeCard: { width: 120, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginRight: 10, alignItems: 'center', backgroundColor: '#fff' },
  typeCardActive: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  typeIcon: { fontSize: 28, marginBottom: 6 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  typeDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  typePrice: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 6 },
  bookBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
