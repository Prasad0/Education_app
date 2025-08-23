import React, {useEffect} from 'react';
import {useAppSelector, useAppDispatch} from '../store/hooks';
import {checkProfileStatus} from '../store/slices/authSlice';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import UserTypeSelectionScreen from '../screens/auth/UserTypeSelectionScreen';
import StudentOnboardingScreen from '../screens/auth/StudentOnboardingScreen';
import ParentOnboardingScreen from '../screens/auth/ParentOnboardingScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const dispatch = useAppDispatch();
  const {isAuthenticated, accessToken, profileStatus} = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && accessToken && !profileStatus) {
      dispatch(checkProfileStatus());
    }
  }, [isAuthenticated, accessToken, profileStatus, dispatch]);

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
      </Stack.Navigator>
    );
  }

  if (isAuthenticated && profileStatus && !profileStatus.isCompleted) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
        <Stack.Screen name="StudentOnboarding" component={StudentOnboardingScreen} />
        <Stack.Screen name="ParentOnboarding" component={ParentOnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    );
  }

  if (isAuthenticated && profileStatus && profileStatus.isCompleted) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;


