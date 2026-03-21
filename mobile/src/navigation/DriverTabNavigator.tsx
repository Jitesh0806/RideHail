import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name: string) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );

export default function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ tabBarIcon: tabIcon('car'), tabBarLabel: 'Drive' }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{ tabBarIcon: tabIcon('cash'), tabBarLabel: 'Earnings' }}
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
