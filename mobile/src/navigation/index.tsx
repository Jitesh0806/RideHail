import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '../hooks/useAppDispatch';

// Auth Screens
import SplashScreen from '../screens/shared/SplashScreen';
import LoginScreen from '../screens/shared/LoginScreen';
import RegisterRiderScreen from '../screens/rider/RegisterRiderScreen';
import RegisterDriverScreen from '../screens/driver/RegisterDriverScreen';

// Rider Screens
import RiderTabNavigator from './RiderTabNavigator';

// Driver Screens
import DriverTabNavigator from './DriverTabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  RegisterRider: undefined;
  RegisterDriver: undefined;
  RiderApp: undefined;
  DriverApp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, accessToken } = useAppSelector((state) => state.auth);

  const getInitialRoute = () => {
    if (!accessToken || !user) return 'Splash';
    return user.role === 'driver' ? 'DriverApp' : 'RiderApp';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterRider" component={RegisterRiderScreen} />
        <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} />
        <Stack.Screen name="RiderApp" component={RiderTabNavigator} />
        <Stack.Screen name="DriverApp" component={DriverTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
