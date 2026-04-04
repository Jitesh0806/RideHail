import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import RideTrackingScreen from '../screens/rider/RideTrackingScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';

const Tab = createBottomTabNavigator();

export default function RiderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1, height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'car' : 'car-outline',
            Track: focused ? 'navigate' : 'navigate-outline',
            History: focused ? 'time' : 'time-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={RiderHomeScreen} />
      <Tab.Screen name="Track" component={RideTrackingScreen} />
      <Tab.Screen name="History" component={RideHistoryScreen} />
      <Tab.Screen name="Profile" component={RiderProfileScreen} />
    </Tab.Navigator>
  );
}
