import React, {useEffect, useRef, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Platform} from 'react-native';
import {useAppDispatch} from '../store/hooks';
import {restoreAuth, checkProfileStatus} from '../store/slices/authSlice';
import {getTokens, getUser} from '../utils/tokenStorage';
import * as Notifications from 'expo-notifications';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({children}) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      const expoToken = (token as any)?.data ?? null;
      if (expoToken) {
        console.log('Expo push token:', expoToken);
      }
      return expoToken;
    } catch (e) {
      console.log('Failed to register for push notifications', e);
      return null;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for stored tokens
        const tokens = await getTokens();
        const user = await getUser();

        if (tokens && user) {
          // Restore authentication state
          dispatch(restoreAuth({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: user,
          }));

          // Check profile status
          await dispatch(checkProfileStatus());
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [dispatch]);

  useEffect(() => {
    // Register for push notifications and attach listeners
    let isMounted = true;
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (!isMounted) return;
        console.log('Notification received (foreground):', notification);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!isMounted) return;
        console.log('User interacted with notification:', response);
      },
    );

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});

export default AppInitializer;
