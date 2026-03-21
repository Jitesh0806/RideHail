import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import RideTrackingScreen from '../screens/rider/RideTrackingScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name: string) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );

export default function RiderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={RiderHomeScreen}
        options={{ tabBarIcon: tabIcon('home'), tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Track"
        component={RideTrackingScreen}
        options={{ tabBarIcon: tabIcon('map-marker-path'), tabBarLabel: 'Track' }}
      />
      <Tab.Screen
        name="History"
        component={RideHistoryScreen}
        options={{ tabBarIcon: tabIcon('history'), tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon('account'), tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
