import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useAppDispatch} from '../store/hooks';
import {restoreAuth, checkProfileStatus} from '../store/slices/authSlice';
import {getTokens, getUser} from '../utils/tokenStorage';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({children}) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

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
