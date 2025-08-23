import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, setActiveTab, toggleStarred } from '../store/slices/coachingSlice';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PromotionalBanner from '../components/PromotionalBanner';
import CoachingCard from '../components/CoachingCard';
import CoachingListingScreen from './CoachingListingScreen';
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
  
  const { accessToken } = useAppSelector(state => state.auth);
  
  const [location, setLocation] = useState('Koramangala, Bangalore');
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
    
    // Fetch coaching centers when component mounts with city parameter
    const params = { 
      location: 'Koramangala',
      city: 'Bangalore'
    };
    
    console.log('🏠 [HomeScreen] Dispatching fetchCoachingCenters with params:', JSON.stringify(params, null, 2));
    dispatch(fetchCoachingCenters(params));
  }, [dispatch]);

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
      <View style={styles.container}>
        <Text>Location Selector - Coming Soon</Text>
        {/* TODO: Implement LocationSelector */}
      </View>
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
        location={location}
        onLocationPress={handleLocationPress}
        onSearchPress={handleSearchPress}
        userProfile={mockUserProfile}
        selectedStudentId={selectedStudentId || ''}
        onStudentSelect={setSelectedStudentId}
      />

      {/* Content - With top padding for fixed header */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Promotional banners */}
        <PromotionalBanner banners={promotionalBanners} />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Centers</Text>
          {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
          
          {/* Debug button to set token */}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={async () => {
              try {
                // Set a test token for debugging
                const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNTA3MDM2LCJpYXQiOjE3NTU5NTUwMzYsImp0aSI6ImFkMGM5M2FjYTkyMjQ1YmVhYzQxYmM2YWZlOTVmNmZhIiwidXNlcl9pZCI6IjEifQ.JsGb7VyBsv1xoFgvke8yf3nrxjq_eTUS5fIDTnORjjM';
                await AsyncStorage.setItem('accessToken', testToken);
                console.log('✅ [HomeScreen] Test token set successfully');
                Alert.alert('Success', 'Test token set successfully!');
              } catch (error) {
                console.error('❌ [HomeScreen] Error setting test token:', error);
                Alert.alert('Error', 'Failed to set test token');
              }
            }}
          >
            <Text style={styles.debugButtonText}>Set Test Token</Text>
          </TouchableOpacity>
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
  debugButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;
