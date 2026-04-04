import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import SplashScreen from '../screens/shared/SplashScreen';
import LoginScreen from '../screens/shared/LoginScreen';
import RegisterRiderScreen from '../screens/shared/RegisterRiderScreen';
import RegisterDriverScreen from '../screens/shared/RegisterDriverScreen';
import RiderTabNavigator from './RiderTabNavigator';
import DriverTabNavigator from './DriverTabNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const user = useSelector((s: RootState) => s.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RegisterRider" component={RegisterRiderScreen} />
            <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} />
          </>
        ) : user.role === 'driver' ? (
          <Stack.Screen name="DriverApp" component={DriverTabNavigator} />
        ) : (
          <Stack.Screen name="RiderApp" component={RiderTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
