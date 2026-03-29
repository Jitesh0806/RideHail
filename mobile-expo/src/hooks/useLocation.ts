import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface Coords { latitude: number; longitude: number; }

export const useLocation = () => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        // Demo: use San Francisco as fallback
        setLocation({ latitude: 37.7749, longitude: -122.4194 });
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (loc) => setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  return { location, error };
};

export const getOneTimeLocation = async (): Promise<Coords> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { latitude: 37.7749, longitude: -122.4194 };
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return { latitude: 37.7749, longitude: -122.4194 };
  }
};
