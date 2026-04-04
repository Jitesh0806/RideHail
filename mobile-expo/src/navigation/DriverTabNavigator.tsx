import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverHistoryScreen from '../screens/driver/DriverHistoryScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

const Tab = createBottomTabNavigator();

export default function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1, height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Drive: focused ? 'car' : 'car-outline',
            Earnings: focused ? 'cash' : 'cash-outline',
            History: focused ? 'time' : 'time-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Drive" component={DriverHomeScreen} />
      <Tab.Screen name="Earnings" component={DriverEarningsScreen} />
      <Tab.Screen name="History" component={DriverHistoryScreen} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
}
