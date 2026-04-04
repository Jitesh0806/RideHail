import { useState, useEffect, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export const useLocation = (watchPosition = false) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'RideHail Location Permission',
        message: 'RideHail needs access to your location to find nearby drivers.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const getCurrentLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }, []);

  useEffect(() => {
    let watchId: number | null = null;

    const init = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      if (watchPosition) {
        watchId = Geolocation.watchPosition(
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? undefined,
              speed: pos.coords.speed ?? undefined,
              accuracy: pos.coords.accuracy,
            });
            setLoading(false);
          },
          (err) => setError(err.message),
          {
            enableHighAccuracy: true,
            distanceFilter: 10, // Update every 10 meters
            interval: 5000,     // Or every 5 seconds
            fastestInterval: 2000,
          },
        );
      } else {
        getCurrentLocation();
      }
    };

    init();

    return () => {
      if (watchId !== null) Geolocation.clearWatch(watchId);
    };
  }, [watchPosition, getCurrentLocation]);

  return { location, error, loading, refresh: getCurrentLocation };
};
