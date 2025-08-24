import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Linking, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, setActiveTab, toggleStarred } from '../store/slices/coachingSlice';
import { getCurrentLocation as getLocationFromSlice } from '../store/slices/locationSlice';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PromotionalBanner from '../components/PromotionalBanner';
import CoachingCard from '../components/CoachingCard';
import CoachingListingScreen from './CoachingListingScreen';
import LocationSelector from '../components/LocationSelector';
import { CoachingCenter } from '../store/slices/coachingSlice';

const promotionalBanners = [
  {
    id: '1',
    title: 'Early Bird Discount',
    subtitle: 'Get 20% off on all courses',
    gradientColors: ['#10b981', '#059669'] as const,
  },
  {
    id: '2',
    title: 'Free Demo Classes',
    subtitle: 'Try before you enroll',
    gradientColors: ['#3b82f6', '#2563eb'] as const,
  },
  {
    id: '3',
    title: 'Scholarship Program',
    subtitle: 'Up to 50% fee waiver',
    gradientColors: ['#8b5cf6', '#7c3aed'] as const,
  },
];

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    filteredCenters, 
    isLoading, 
    error, 
    activeTab, 
    starredCenters 
  } = useAppSelector(state => state.coaching);
  
  const { accessToken, profile } = useAppSelector(state => state.auth);
  const { currentLocation, isLocationLoading, coordinates } = useAppSelector(state => state.location);
  
  const [currentScreen, setCurrentScreen] = useState<'home' | 'search' | 'listing' | 'location' | 'profile'>('home');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Mock user profile for now - this should come from your auth state
  const mockUserProfile = {
    user_type: 'parent',
    students: [
      { id: '1', name: 'Rahul Kumar', current_standard: '12th', target_exam: 'JEE Main' },
      { id: '2', name: 'Priya Sharma', current_standard: '10th', target_exam: 'Board Exam' },
    ]
  };

  useEffect(() => {
    // Check for stored tokens first
    const checkStoredTokens = async () => {
      try {
        console.log('🔍 [HomeScreen] Checking for stored tokens...');
        
        // Check direct accessToken
        const directToken = await AsyncStorage.getItem('accessToken');
        console.log('🔑 [HomeScreen] Direct accessToken:', directToken ? 'Present' : 'Missing');
        
        // Check nested auth_tokens
        const tokensData = await AsyncStorage.getItem('auth_tokens');
        if (tokensData) {
          const tokens = JSON.parse(tokensData);
          console.log('🔑 [HomeScreen] Nested auth_tokens:', {
            accessToken: tokens.accessToken ? 'Present' : 'Missing',
            refreshToken: tokens.refreshToken ? 'Present' : 'Missing'
          });
        } else {
          console.log('🔑 [HomeScreen] No auth_tokens found');
        }
        
        // Check auth_user
        const userData = await AsyncStorage.getItem('auth_user');
        console.log('👤 [HomeScreen] User data:', userData ? 'Present' : 'Missing');
        
      } catch (error) {
        console.error('❌ [HomeScreen] Error checking stored tokens:', error);
      }
    };
    
    checkStoredTokens();
    
    // Get current location
    getCurrentLocation();
  }, [dispatch]);
  
  // Watch for location changes and update coaching centers
  useEffect(() => {
    if (currentLocation && currentLocation !== 'Getting location...' && currentLocation !== 'Location unavailable' && currentLocation !== 'Location permission denied') {
      // Extract city and state from location
      const parts = currentLocation.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        const city = parts[0];
        const state = parts[1];
        
        const params = { 
          location: city,
          city: state
        };
        dispatch(fetchCoachingCenters(params));
      }
    }
  }, [currentLocation, dispatch]);
  
  // Watch for profile changes and update location if needed
  useEffect(() => {
    if (profile?.latitude && profile?.longitude && !coordinates) {
      console.log('Profile location updated, refreshing location display');
      getCurrentLocation();
    }
  }, [profile, coordinates]);
  
  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      // First try to get location from user profile if available
      if (profile?.latitude && profile?.longitude) {
        console.log('Using location from profile:', profile.latitude, profile.longitude);
        
        Toast.show({
          type: 'info',
          text1: 'Using Profile Location',
          text2: 'Loading location from your profile...',
          position: 'top',
          visibilityTime: 1500,
        });
        
        // Use the location slice action with profile coordinates
        dispatch(getLocationFromSlice({ 
          latitude: profile.latitude, 
          longitude: profile.longitude 
        }));
        
        return;
      }
      
      // Fallback to device location if profile location not available
      Toast.show({
        type: 'info',
        text1: 'Getting Device Location',
        text2: 'Requesting location permission...',
        position: 'top',
        visibilityTime: 1500,
      });
      
      // Use the location slice action for device location
      dispatch(getLocationFromSlice());
      
    } catch (error) {
      console.error('Error getting location:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not get your current location',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };
  


  useEffect(() => {
    // Set initial student if available
    if (mockUserProfile.students && mockUserProfile.students.length > 0) {
      setSelectedStudentId(mockUserProfile.students[0].id);
    }
  }, []);

  const handleTabPress = (tab: 'offline' | 'online' | 'starred' | 'profile') => {
    if (tab === 'profile') {
      // Navigate to profile screen
      console.log('Navigate to profile');
      return;
    }
    
    dispatch(setActiveTab(tab));
  };

  const handleLocationPress = () => {
    // Go to location selection screen
    setCurrentScreen('location');
  };

  const handleSearchPress = () => {
    setCurrentScreen('listing');
  };

  const handleBookDemo = (center: CoachingCenter) => {
    Alert.alert(
      'Book Demo',
      `Would you like to book a demo class at ${center.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            // Handle demo booking logic
            console.log('Booking demo for:', center.name);
            Alert.alert('Success', 'Demo class booked successfully!');
          }
        }
      ]
    );
  };

  const handleCallNow = (center: CoachingCenter) => {
    Alert.alert(
      'Call Now',
      `Would you like to call ${center.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // Handle call functionality
            const phoneNumber = center.phone.replace(/\s+/g, '');
            Linking.openURL(`tel:${phoneNumber}`);
          }
        }
      ]
    );
  };

  const handleToggleStar = (centerId: string) => {
    dispatch(toggleStarred(centerId));
  };

  // Handle different screens
  if (currentScreen === 'search') {
    return (
      <View style={styles.container}>
        <Text>Search Screen - Coming Soon</Text>
        {/* TODO: Implement SearchFilterScreen */}
      </View>
    );
  }

  if (currentScreen === 'listing') {
    return (
      <CoachingListingScreen onBack={() => setCurrentScreen('home')} />
    );
  }

  if (currentScreen === 'location') {
    return (
      <LocationSelector onBack={() => setCurrentScreen('home')} />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <View style={styles.container}>
        <Text>Profile Screen - Coming Soon</Text>
        {/* TODO: Implement ProfileScreen */}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed */}
      <Header
        location={currentLocation}
        onLocationPress={handleLocationPress}
        onSearchPress={handleSearchPress}
        userProfile={mockUserProfile}
        selectedStudentId={selectedStudentId || ''}
        onStudentSelect={setSelectedStudentId}
        isLocationLoading={isLocationLoading}
        coordinates={coordinates}
      />

      {/* Content - With top padding for fixed header */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLocationLoading}
            onRefresh={getCurrentLocation}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Promotional banners */}
        <PromotionalBanner banners={promotionalBanners} />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Centers</Text>
          <View style={styles.sectionHeaderRight}>
            {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={getCurrentLocation}
              disabled={isLocationLoading}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={isLocationLoading ? "#9ca3af" : "#3b82f6"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Coaching centers list */}
        {filteredCenters.length > 0 ? (
          filteredCenters.map((center) => (
            <CoachingCard
              key={center.id}
              center={center}
              onBookDemo={handleBookDemo}
              onCallNow={handleCallNow}
              onToggleStar={handleToggleStar}
              isStarred={starredCenters.includes(center.id)}
            />
          ))
        ) : !isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coaching centers found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Navigation - Fixed */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingTop: 0, // Removed padding - header is fixed, banner should start immediately
  },
  contentContainer: {
    paddingTop: 0, // Remove top padding from content container
    paddingBottom: 120, // Increased from 100 to 120 for more bottom spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },

});

export default HomeScreen;
