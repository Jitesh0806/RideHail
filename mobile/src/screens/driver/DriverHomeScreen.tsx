import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Switch, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useLocation } from '../../hooks/useLocation';
import { socketService } from '../../services/socket';
import {
  acceptRideThunk, updateRideStatusThunk, cancelRideThunk,
  setCurrentRide,
} from '../../store/slices/rideSlice';
import { api } from '../../services/api';
import { Ride } from '../../types';

export default function DriverHomeScreen() {
  const dispatch = useAppDispatch();
  const { location } = useLocation(true);  // Watch position
  const { currentRide } = useAppSelector((s) => s.ride);
  const { user } = useAppSelector((s) => s.auth);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Load driver profile
  useEffect(() => {
    api.getDriverProfile().then(({ data }) => setDriverProfile(data.data));
  }, []);

  // Send location updates to server every 5s when online
  useEffect(() => {
    if (!isOnline || !location) return;
    const interval = setInterval(() => {
      socketService.sendLocationUpdate(
        location.latitude,
        location.longitude,
        location.heading,
        location.speed,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline, location]);

  // Listen for ride requests
  useEffect(() => {
    socketService.onRideRequest((data) => {
      api.getRide(data.rideId).then(({ data: res }) => {
        setIncomingRide(res.data);
      });
    });
    return () => socketService.off('ride:request');
  }, []);

  const toggleOnlineStatus = async (value: boolean) => {
    setTogglingStatus(true);
    try {
      if (value) {
        socketService.goOnline();
        await api.updateDriverStatus('online');
      } else {
        socketService.goOffline();
        await api.updateDriverStatus('offline');
      }
      setIsOnline(value);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!incomingRide) return;
    const result = await dispatch(acceptRideThunk(incomingRide.id));
    if (acceptRideThunk.fulfilled.match(result)) {
      setIncomingRide(null);
      Alert.alert('Ride Accepted!', `Head to: ${result.payload.pickupAddress}`);
    }
  };

  const handleRejectRide = () => {
    if (!incomingRide) return;
    api.rejectRide(incomingRide.id);
    setIncomingRide(null);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!currentRide) return;
    const result = await dispatch(updateRideStatusThunk({ rideId: currentRide.id, status: newStatus }));
    if (updateRideStatusThunk.fulfilled.match(result)) {
      if (newStatus === 'completed') {
        Alert.alert('Trip Completed!', `Fare: $${result.payload.finalFare?.toFixed(2) || result.payload.estimatedFare?.toFixed(2)}`);
      }
    }
  };

  const getNextAction = () => {
    if (!currentRide) return null;
    switch (currentRide.status) {
      case 'driver_assigned': return { label: 'Start Navigation', status: 'driver_en_route', icon: 'navigation' };
      case 'driver_en_route': return { label: 'I\'ve Arrived', status: 'driver_arrived', icon: 'map-marker-check' };
      case 'driver_arrived': return { label: 'Start Trip', status: 'in_progress', icon: 'play-circle' };
      case 'in_progress': return { label: 'Complete Trip', status: 'completed', icon: 'flag-checkered' };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      >
        {currentRide && (
          <Marker
            coordinate={{
              latitude: currentRide.pickupLatitude,
              longitude: currentRide.pickupLongitude,
            }}
            title="Pickup Location"
            pinColor="green"
          />
        )}
        {currentRide?.status === 'in_progress' && (
          <Marker
            coordinate={{
              latitude: currentRide.destinationLatitude,
              longitude: currentRide.destinationLongitude,
            }}
            title="Destination"
            pinColor="red"
          />
        )}
      </MapView>

      {/* Online toggle */}
      <View style={styles.topBar}>
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }]}>
          <Text style={styles.statusBadgeText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
        {togglingStatus
          ? <ActivityIndicator color="#6C63FF" />
          : <Switch value={isOnline} onValueChange={toggleOnlineStatus} trackColor={{ true: '#34C759' }} />
        }
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        {!currentRide && !incomingRide && (
          <View style={styles.waitingState}>
            <Icon name={isOnline ? 'antenna' : 'wifi-off'} size={36} color={isOnline ? '#34C759' : '#ccc'} />
            <Text style={styles.waitingTitle}>
              {isOnline ? 'Waiting for ride requests...' : 'You are offline'}
            </Text>
            <Text style={styles.waitingSubtext}>
              {isOnline ? 'Stay in a busy area for more requests' : 'Toggle the switch to go online'}
            </Text>
            {driverProfile && (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{driverProfile.totalTrips}</Text>
                  <Text style={styles.statLabel}>Trips</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>${Number(driverProfile.totalEarnings).toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{driverProfile.averageRating?.toFixed(1)} ★</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Incoming ride request */}
        {incomingRide && !currentRide && (
          <View style={styles.incomingRide}>
            <Text style={styles.incomingTitle}>New Ride Request!</Text>
            <View style={styles.routeRow}>
              <Icon name="map-marker" size={16} color="#6C63FF" />
              <Text style={styles.routeText}>{incomingRide.pickupAddress}</Text>
            </View>
            <View style={styles.routeRow}>
              <Icon name="flag-checkered" size={16} color="#FF4444" />
              <Text style={styles.routeText}>{incomingRide.destinationAddress}</Text>
            </View>
            <View style={styles.rideMetrics}>
              <Text style={styles.metric}>~{incomingRide.estimatedDistanceKm?.toFixed(1)} km</Text>
              <Text style={styles.metric}>${incomingRide.estimatedFare?.toFixed(2)}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectRide}>
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active ride controls */}
        {currentRide && nextAction && (
          <View style={styles.activeRide}>
            <Text style={styles.activeRideStatus}>
              {currentRide.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
            <View style={styles.routeRow}>
              <Icon name="account" size={16} color="#6C63FF" />
              <Text style={styles.routeText}>
                {currentRide.rider?.firstName} {currentRide.rider?.lastName}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Icon name="map-marker" size={16} color="#34C759" />
              <Text style={styles.routeText}>{currentRide.pickupAddress}</Text>
            </View>
            <TouchableOpacity
              style={styles.nextActionBtn}
              onPress={() => handleUpdateStatus(nextAction.status)}
            >
              <Icon name={nextAction.icon} size={20} color="#fff" />
              <Text style={styles.nextActionText}>{nextAction.label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute', top: 50, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, elevation: 10,
  },
  waitingState: { alignItems: 'center', paddingVertical: 8 },
  waitingTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 10 },
  waitingSubtext: { color: '#888', fontSize: 13, marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontWeight: '800', fontSize: 18, color: '#6C63FF' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  incomingRide: {},
  incomingTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  routeText: { color: '#333', fontSize: 14, flex: 1 },
  rideMetrics: { flexDirection: 'row', gap: 16, marginVertical: 10 },
  metric: { fontWeight: '700', fontSize: 15, color: '#6C63FF' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  rejectBtn: {
    flex: 1, borderWidth: 2, borderColor: '#FF4444',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  rejectBtnText: { color: '#FF4444', fontWeight: '700' },
  acceptBtn: {
    flex: 2, backgroundColor: '#34C759',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  activeRide: {},
  activeRideStatus: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  nextActionBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
  },
  nextActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
