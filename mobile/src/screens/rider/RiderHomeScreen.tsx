import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useLocation } from '../../hooks/useLocation';
import {
  requestRideThunk, cancelRideThunk, fetchNearbyDriversThunk,
  updateCurrentRideStatus, updateDriverLocation,
} from '../../store/slices/rideSlice';
import { socketService } from '../../services/socket';
import { VehicleType, NearbyDriver } from '../../types';

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: string; }[] = [
  { type: 'economy', label: 'Economy', icon: 'car-outline' },
  { type: 'standard', label: 'Standard', icon: 'car' },
  { type: 'premium', label: 'Premium', icon: 'car-sports' },
  { type: 'xl', label: 'XL', icon: 'van-passenger' },
];

export default function RiderHomeScreen() {
  const dispatch = useAppDispatch();
  const { location } = useLocation(false);
  const { currentRide, nearbyDrivers, driverLocation, isSearching } = useAppSelector(s => s.ride);
  const mapRef = useRef<MapView>(null);

  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('standard');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  // Fetch nearby drivers every 30s
  useEffect(() => {
    if (!location) return;
    dispatch(fetchNearbyDriversThunk({ lat: location.latitude, lng: location.longitude }));
    const interval = setInterval(() => {
      dispatch(fetchNearbyDriversThunk({ lat: location.latitude, lng: location.longitude }));
    }, 30000);
    return () => clearInterval(interval);
  }, [location]);

  // WebSocket: listen for ride status updates & driver location
  useEffect(() => {
    if (!currentRide) return;

    socketService.joinRide(currentRide.id);
    socketService.onDriverLocation((data) => {
      dispatch(updateDriverLocation({ latitude: data.latitude, longitude: data.longitude }));
    });
    socketService.onRideStatusUpdate((data) => {
      if (data.rideId === currentRide.id) {
        dispatch(updateCurrentRideStatus({ rideId: data.rideId, status: data.status }));
      }
    });

    return () => {
      socketService.leaveRide(currentRide.id);
      socketService.off('driver:location');
      socketService.off('ride:status_update');
    };
  }, [currentRide?.id]);

  const handleRequestRide = async () => {
    if (!location) return Alert.alert('Location needed', 'Enable location services');
    if (!destCoords) return Alert.alert('Destination needed', 'Enter a destination');

    const result = await dispatch(requestRideThunk({
      pickupLatitude: location.latitude,
      pickupLongitude: location.longitude,
      pickupAddress: 'Current Location',
      destinationLatitude: destCoords.lat,
      destinationLongitude: destCoords.lng,
      destinationAddress: destination,
      vehicleType: selectedVehicle,
    }));

    if (requestRideThunk.rejected.match(result)) {
      Alert.alert('Error', result.payload as string);
    }
  };

  const handleCancelRide = () => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => currentRide && dispatch(cancelRideThunk({
          rideId: currentRide.id, reason: 'rider_changed_mind',
        })),
      },
    ]);
  };

  const getRideStatusText = () => {
    switch (currentRide?.status) {
      case 'searching': return 'Finding your driver...';
      case 'driver_assigned': return 'Driver assigned!';
      case 'driver_en_route': return 'Driver is on the way';
      case 'driver_arrived': return 'Driver has arrived!';
      case 'in_progress': return 'Trip in progress';
      case 'completed': return 'Trip completed!';
      case 'no_driver_found': return 'No drivers nearby. Try again.';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Nearby drivers */}
        {nearbyDrivers.map((d) => (
          <Marker
            key={d.driverId}
            coordinate={{ latitude: d.latitude, longitude: d.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Icon name="car" size={28} color="#6C63FF" />
          </Marker>
        ))}

        {/* Active driver location */}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Icon name="car" size={24} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        {!currentRide ? (
          <>
            <Text style={styles.sheetTitle}>Where to?</Text>

            <View style={styles.searchBox}>
              <Icon name="map-marker" size={20} color="#6C63FF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter destination..."
                value={destination}
                onChangeText={setDestination}
                onSubmitEditing={() => {
                  // In production, use Google Places Autocomplete
                  setDestCoords({ lat: 37.3382, lng: -121.8863 });
                }}
              />
            </View>

            {/* Vehicle Type Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {VEHICLE_TYPES.map((v) => (
                <TouchableOpacity
                  key={v.type}
                  style={[styles.vehicleCard, selectedVehicle === v.type && styles.vehicleCardActive]}
                  onPress={() => setSelectedVehicle(v.type)}
                >
                  <Icon name={v.icon} size={28} color={selectedVehicle === v.type ? '#fff' : '#6C63FF'} />
                  <Text style={[styles.vehicleLabel, selectedVehicle === v.type && styles.vehicleLabelActive]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.requestButton, !destCoords && styles.buttonDisabled]}
              onPress={handleRequestRide}
              disabled={isSearching || !destCoords}
            >
              {isSearching
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.requestButtonText}>Request Ride</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.rideStatus}>
            <Text style={styles.rideStatusText}>{getRideStatusText()}</Text>

            {currentRide.status === 'searching' && (
              <ActivityIndicator color="#6C63FF" style={{ marginVertical: 10 }} />
            )}

            {currentRide.driver && (
              <View style={styles.driverInfo}>
                <Icon name="account-circle" size={40} color="#6C63FF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.driverName}>
                    {currentRide.driver.user?.firstName} {currentRide.driver.user?.lastName}
                  </Text>
                  <Text style={styles.driverVehicle}>
                    {currentRide.driver.vehicleColor} {currentRide.driver.vehicleMake}{' '}
                    {currentRide.driver.vehicleModel} • {currentRide.driver.vehiclePlate}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{currentRide.driver.averageRating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
            )}

            {['searching', 'driver_assigned', 'driver_en_route', 'driver_arrived'].includes(
              currentRide.status,
            ) && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            )}

            <View style={styles.fareRow}>
              <Icon name="cash" size={16} color="#333" />
              <Text style={styles.fareText}>
                Est. fare: ${currentRide.estimatedFare?.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverMarker: {
    backgroundColor: '#6C63FF', borderRadius: 20,
    padding: 6, borderWidth: 2, borderColor: '#fff',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  vehicleScroll: { marginBottom: 16 },
  vehicleCard: {
    alignItems: 'center', borderWidth: 2, borderColor: '#6C63FF',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginRight: 10,
  },
  vehicleCardActive: { backgroundColor: '#6C63FF' },
  vehicleLabel: { color: '#6C63FF', fontWeight: '600', marginTop: 4, fontSize: 12 },
  vehicleLabelActive: { color: '#fff' },
  requestButton: {
    backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  requestButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rideStatus: { alignItems: 'center', paddingVertical: 8 },
  rideStatusText: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  driverInfo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 14, padding: 14, width: '100%', marginVertical: 10,
  },
  driverName: { fontWeight: '700', fontSize: 16, color: '#1a1a2e' },
  driverVehicle: { color: '#666', fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { color: '#666', fontSize: 13, marginLeft: 2 },
  cancelButton: {
    borderWidth: 2, borderColor: '#FF4444', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 30, marginVertical: 8,
  },
  cancelButtonText: { color: '#FF4444', fontWeight: '700', fontSize: 15 },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  fareText: { color: '#555', fontSize: 15 },
});
