import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Linking, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, searchCoachingCenters, filterCoachingCenters, setActiveTab, toggleStarred, clearData } from '../store/slices/coachingSlice';
import { getCurrentLocation as getLocationFromSlice, deselectLocation } from '../store/slices/locationSlice';
import { fetchUserProfile, setSelectedChildId, logout } from '../store/slices/authSlice';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PromotionalBanner from '../components/PromotionalBanner';
import CoachingCard from '../components/CoachingCard';
import CoachingListingScreen from './CoachingListingScreen';
import CoachingDetailScreen from './CoachingDetails/CoachingDetailScreen';
import LocationSelector from '../components/LocationSelector';
import SearchFilterScreen from './SearchFilterScreen';
import { CoachingCenter } from '../store/slices/coachingSlice';
import OnlineScreen from './OnlineScreen';
import PrivateCoachingScreen from './PrivateCoachingScreen';

// Filter interface for the modal
interface FilterState {
  search: string;
  feesRange: string;
  batchTiming: string;
  distance: string;
  amenities: string[];
  discounts: string[];
  standard: string[];
  coachingType: string;
  ratingMin: number;
  subjects: string[];
  targetExams: string[];
}

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
  
  const { accessToken, profile, user } = useAppSelector(state => state.auth);
  const { currentLocation, isLocationLoading, coordinates, selectedLocation, selectedLocationData } = useAppSelector(state => state.location);
  const authState = useAppSelector(state => state.auth);
  
  // Provide default values to prevent undefined errors
  const safeIsLocationLoading = isLocationLoading || false;
  const safeCurrentLocation = currentLocation || '';
  const safeSelectedLocation = selectedLocation || '';
  const safeCoordinates = coordinates || null;
  const safeSelectedLocationData = selectedLocationData || null;
  
  const [currentScreen, setCurrentScreen] = useState<'home' | 'search' | 'listing' | 'location' | 'profile' | 'detail' | 'searchFilter' | 'online' | 'private'>('home');
  const [selectedCoachingId, setSelectedCoachingId] = useState<string>('');
  const { selectedChildId } = useAppSelector(state => state.auth);
  const [spinValue] = useState(new Animated.Value(0));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);
  const forceUpdateRef = useRef(0);

  // Determine which profile data to use (user or profile field)
  const actualProfile = user || profile;
  
  // Mock user profile for now - this should come from your auth state
  const mockUserProfile = actualProfile ? {
    user_type: actualProfile.user_type,
    students: actualProfile.children && actualProfile.children.length > 0 ? actualProfile.children : [],
    children: actualProfile.children || [] // Also include children directly for compatibility
  } : {
    user_type: 'parent',
    students: [
      { id: '1', name: 'Rahul Kumar', current_standard: '12th', target_exam: 'JEE Main' },
      { id: '2', name: 'Priya Sharma', current_standard: '10th', target_exam: 'Board Exam' },
    ],
    children: [
      { id: '1', name: 'Rahul Kumar', current_standard: '12th', target_exam: 'JEE Main' },
      { id: '2', name: 'Priya Sharma', current_standard: '10th', target_exam: 'Board Exam' },
    ]
  };

  useEffect(() => {
    // Check for stored tokens first
    const checkStoredTokens = async () => {
      try {
        // Check direct accessToken
        const directToken = await AsyncStorage.getItem('accessToken');
        
        // Check nested auth_tokens
        const tokensData = await AsyncStorage.getItem('auth_tokens');
        if (tokensData) {
          const tokens = JSON.parse(tokensData);
        }
        
        // Check auth_user
        const userData = await AsyncStorage.getItem('auth_user');
        
      } catch (error) {
        // Silent error handling
      }
    };
    
    checkStoredTokens();
    
    // Fetch user profile if we have an access token
    if (accessToken) {
      dispatch(fetchUserProfile());
    }
    
    // Only fetch coaching centers if user is authenticated
    if (accessToken && authState.isAuthenticated) {
      dispatch(fetchCoachingCenters({ radius: 2000 }));
    }
  }, [dispatch, accessToken, authState.isAuthenticated]);
  
  // Watch for selected location changes and fetch coaching centers
  useEffect(() => {
    // Only fetch coaching centers if user is authenticated
    if (!accessToken || !authState.isAuthenticated) {
      return;
    }
    
    if (safeSelectedLocation && safeSelectedLocation !== 'Getting location...' && safeSelectedLocation !== 'Location unavailable' && safeSelectedLocation !== 'Location permission denied') {
      // Extract city name from selected location (e.g., "Mumbai, Maharashtra, India" -> "Mumbai")
      const cityName = safeSelectedLocation.split(',')[0].trim();
      
      const params = { 
        search: cityName,
        latitude: safeCoordinates?.latitude,
        longitude: safeCoordinates?.longitude,
        radius: 2000
      };
      dispatch(fetchCoachingCenters(params));
    }
  }, [safeSelectedLocation, safeCoordinates, dispatch, accessToken, authState.isAuthenticated]);

  // Handle authentication errors
  useEffect(() => {
    if (error === 'UNAUTHORIZED') {
      // Clear coaching data first
      dispatch(clearData());
      // Clear auth state and redirect to login
      dispatch(logout());
      // You can also navigate to login screen here if needed
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [{ text: 'OK' }]
      );
    }
  }, [error, dispatch]);
  
  // Watch for profile changes and update location if needed
  useEffect(() => {
    if (actualProfile?.latitude && actualProfile?.longitude && !safeCoordinates) {
      getCurrentLocation();
    }
  }, [actualProfile, safeCoordinates]);
  
  // Watch for accessToken changes and fetch profile when available
  useEffect(() => {
    if (accessToken && !actualProfile) {
      dispatch(fetchUserProfile());
    }
  }, [accessToken, actualProfile, dispatch]);
  
  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      // First try to get location from user profile if available
      if (profile?.latitude && profile?.longitude) {
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
    // Set initial child if available and not already set in Redux
    if (actualProfile?.user_type === 'parent' && actualProfile?.children && actualProfile.children.length > 0) {
      if (!selectedChildId) {
        // Set first child as default
        dispatch(setSelectedChildId(actualProfile.children[0].id));
      }
    }
  }, [actualProfile, selectedChildId, dispatch]);


  // Start spinning animation when loading
  useEffect(() => {
    if (isLoading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [isLoading, spinValue]);

  // Force re-render when currentScreen changes
  useEffect(() => {
    console.log('currentScreen changed to:', currentScreen);
  }, [currentScreen]);
  
  // Force re-render when activeTab changes
  useEffect(() => {
    console.log('activeTab changed to:', activeTab);
  }, [activeTab]);

  const handleTabPress = (tab: 'offline' | 'online' | 'private' | 'chat' | 'profile') => {
    console.log('Tab pressed:', tab, 'Current screen:', currentScreen);
    
    // Prevent unnecessary updates if already on the target tab
    const targetScreen = tab === 'offline' || tab === 'chat' ? 'home' : tab;
    if (currentScreen === targetScreen && activeTab === tab) {
      console.log('Already on target screen, skipping navigation');
      return;
    }
    
    // Force immediate update
    forceUpdateRef.current += 1;
    
    // Update local state first for immediate navigation
    switch (tab) {
      case 'profile':
        setCurrentScreen('profile');
        break;
      case 'online':
        console.log('Setting currentScreen to online');
        setCurrentScreen('online');
        break;
      case 'private':
        console.log('Setting currentScreen to private');
        setCurrentScreen('private');
        break;
      case 'offline':
      case 'chat':
        console.log('Setting currentScreen to home');
        setCurrentScreen('home');
        break;
      default:
        setCurrentScreen('home');
    }
    
    // Update Redux state for UI feedback (including profile)
    dispatch(setActiveTab(tab));
    
    console.log('After tab press - currentScreen will be:', tab === 'offline' || tab === 'chat' ? 'home' : tab);
  };

  // Compute activeTab based on currentScreen to ensure it's always in sync
  const computedActiveTab = (() => {
    if (currentScreen === 'profile') return 'profile';
    if (currentScreen === 'online') return 'online';
    if (currentScreen === 'private') return 'private';
    if (currentScreen === 'home' || currentScreen === 'listing' || currentScreen === 'search' || currentScreen === 'location' || currentScreen === 'detail' || currentScreen === 'searchFilter') {
      return activeTab === 'offline' || activeTab === 'chat' ? activeTab : 'offline';
    }
    return activeTab;
  })();

  const handleLocationPress = () => {
    // Go to location selection screen
    setCurrentScreen('location');
  };

  const handleSearchPress = (searchTerm: string) => {
    // Navigate to search filter screen with the search term
    setCurrentScreen('searchFilter');
  };

  // Function to handle advanced filtering
  const handleFilter = (filterParams: any) => {
    if (accessToken && authState.isAuthenticated) {
      // Add coordinates from current location if available
      const paramsWithLocation = {
        ...filterParams,
        latitude: safeCoordinates?.latitude,
        longitude: safeCoordinates?.longitude,
        radius: filterParams.radius || 2000,
      };
      
      dispatch(filterCoachingCenters(paramsWithLocation));
    }
  };

  // Function to handle filter modal
  const handleOpenFilterModal = () => {
    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setShowFilterModal(false);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    
    // Convert filters to API parameters
    const filterParams: any = {
      radius: 2000,
    };

    // Add coordinates if available
    if (safeCoordinates) {
      filterParams.latitude = safeCoordinates.latitude;
      filterParams.longitude = safeCoordinates.longitude;
    }

    // Add child_id from selected student
    if (selectedChildId) {
      filterParams.child_id = String(selectedChildId);
    }

    // Add search parameter
    if (filters.search) {
      filterParams.search = filters.search;
    }

    // Map fees range to API parameters
    if (filters.feesRange) {
      switch (filters.feesRange) {
        case 'Under ₹25k':
          filterParams.fees_min = 0;
          filterParams.fees_max = 25000;
          break;
        case '₹25k - ₹50k':
          filterParams.fees_min = 25000;
          filterParams.fees_max = 50000;
          break;
        case '₹50k - ₹75k':
          filterParams.fees_min = 50000;
          filterParams.fees_max = 75000;
          break;
        case 'Above ₹75k':
          filterParams.fees_min = 75000;
          break;
      }
    }

    // Map standard to API parameters (convert to comma-separated format)
    if (filters.standard && filters.standard.length > 0) {
      const standardMap: { [key: string]: string } = {
        'Class 5': '5th',
        'Class 6': '6th',
        'Class 7': '7th',
        'Class 8': '8th',
        'Class 9': '9th',
        'Class 10': '10th',
        'Class 11': '11th',
        'Class 12': '12th',
      };
      const mappedStandards = filters.standard.map(std => standardMap[std] || std).filter(Boolean);
      if (mappedStandards.length > 0) {
        filterParams.standards = mappedStandards.join(',');
      }
    }

    // Map coaching type
    if (filters.coachingType) {
      filterParams.coaching_type = filters.coachingType.toLowerCase();
    }

    // Map rating minimum
    if (filters.ratingMin > 0) {
      filterParams.rating_min = filters.ratingMin;
    }

    // Map distance to radius
    if (filters.distance) {
      switch (filters.distance) {
        case 'Under 1km':
          filterParams.radius = 1000;
          break;
        case '1-3km':
          filterParams.radius = 3000;
          break;
        case '3-5km':
          filterParams.radius = 5000;
          break;
        case 'Above 5km':
          filterParams.radius = 10000;
          break;
      }
    }

    // Map subjects from filter selection
    if (filters.subjects && filters.subjects.length > 0) {
      filterParams.subjects = filters.subjects.join(',');
    }

    // Map target exams from filter selection
    if (filters.targetExams && filters.targetExams.length > 0) {
      filterParams.target_exams = filters.targetExams.join(',');
    }


    // Add city and state if available from location
    if (safeSelectedLocation) {
      const locationParts = safeSelectedLocation.split(',');
      if (locationParts.length >= 2) {
        filterParams.city = locationParts[0].trim();
        filterParams.state = locationParts[1].trim();
      }
    }

    

    // Apply the filters by calling the API
    if (accessToken && authState.isAuthenticated) {
      dispatch(filterCoachingCenters(filterParams));
    }
    
    // Close the modal
    setShowFilterModal(false);
  };



  const handleClearLocation = () => {
    dispatch(deselectLocation());
    // Clear coaching centers when location is deselected - only pass radius
    // Only fetch if user is authenticated
    if (accessToken && authState.isAuthenticated) {
      dispatch(fetchCoachingCenters({ radius: 2000 }));
    }
  };

  const handleClearFilters = () => {
    setAppliedFilters(null);
    // Clear filters and fetch with only radius - only if authenticated
    if (accessToken && authState.isAuthenticated) {
      dispatch(fetchCoachingCenters({ radius: 2000 }));
    }
  };

  // Helper function to check if there are any active filters
  const hasActiveFilters = (filters: FilterState | null): boolean => {
    if (!filters) return false;
    
    return !!(
      filters.search ||
      filters.feesRange ||
      filters.batchTiming ||
      filters.distance ||
      filters.coachingType ||
      filters.ratingMin > 0 ||
      (filters.amenities && filters.amenities.length > 0) ||
      (filters.discounts && filters.discounts.length > 0) ||
      (filters.standard && filters.standard.length > 0) ||
      (filters.subjects && filters.subjects.length > 0) ||
      (filters.targetExams && filters.targetExams.length > 0)
    );
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
            const phoneNumber = center.phone?.replace(/\s+/g, '') || '';
            if (phoneNumber) {
              Linking.openURL(`tel:${phoneNumber}`);
            }
          }
        }
      ]
    );
  };

  const handleToggleStar = (centerId: string) => {
    dispatch(toggleStarred(centerId));
  };

  const handleViewDetails = (center: CoachingCenter) => {
    
    setSelectedCoachingId(center.id);
    setCurrentScreen('detail');
  };

  // Handle different screens
  // Search screen disabled - functionality removed
  // if (currentScreen === 'search') {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <Text>Search Screen - Coming Soon</Text>
  //       <BottomNavigation
  //         activeTab="offline"
  //         onTabPress={handleTabPress}
  //       />
  //     </SafeAreaView>
  //   );
  // }

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

  // Check for online screen first
  if (currentScreen === 'online') {
    console.log('Rendering OnlineScreen, currentScreen:', currentScreen, 'activeTab:', activeTab);
    return (
      <OnlineScreen
        onBack={() => {
          console.log('OnlineScreen onBack called');
          setCurrentScreen('home');
        }}
        onViewDetails={(center: CoachingCenter) => {
          setSelectedCoachingId(center.id);
          setCurrentScreen('detail');
        }}
        onTabPress={handleTabPress}
      />
    );
  }

  if (currentScreen === 'detail') {
    return (
      <CoachingDetailScreen
        coachingId={selectedCoachingId}
        onBack={() => setCurrentScreen('home')}
        onViewBatches={() => {
          // Handle view batches
          Alert.alert('View Batches', 'Batches functionality coming soon!');
        }}
        onViewFaculty={() => {
          // Handle view faculty
          Alert.alert('View Faculty', 'Faculty functionality coming soon!');
        }}
        onViewReviews={() => {
          // Handle view reviews
          Alert.alert('View Reviews', 'Reviews functionality coming soon!');
        }}
        onViewTeacherProfile={(teacherId: string) => {
          // Handle view teacher profile
          Alert.alert('Teacher Profile', `Teacher profile for ${teacherId} coming soon!`);
        }}
      />
    );
  }

  if (currentScreen === 'private') {
    console.log('Rendering PrivateCoachingScreen, currentScreen:', currentScreen, 'activeTab:', activeTab);
    return (
      <PrivateCoachingScreen
        onBack={() => setCurrentScreen('home')}
        onTabPress={handleTabPress}
      />
    );
  }

  if (currentScreen === 'searchFilter') {
    return (
      <SearchFilterScreen
        visible={true}
        onClose={() => setCurrentScreen('home')}
        onApply={(filters) => {
          handleApplyFilters(filters);
          setCurrentScreen('home');
        }}
        searchQuery=""
        initialFilters={appliedFilters || undefined}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentScreen('home')}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.profileHeaderTitle}>Profile</Text>
          <View style={styles.profileHeaderSpacer} />
        </View>

        {/* Profile Content */}
        <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
          {/* Loading State */}
          {isLoading && (
            <View style={styles.profileLoadingContainer}>
              <Animated.View 
                style={[
                  styles.profileLoadingSpinner,
                  {
                    transform: [{
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="refresh" size={24} color="#3b82f6" />
              </Animated.View>
              <Text style={styles.profileLoadingText}>Loading profile...</Text>
            </View>
          )}
          
          {/* User Info Section */}
          <View style={styles.profileSection}>
            <View style={styles.userInfoContainer}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={80} color="#10b981" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {actualProfile?.full_name || 'User Name'}
                </Text>
                <Text style={styles.userPhone}>
                  {actualProfile?.phone_number || 'Phone Number'}
                </Text>
                <Text style={styles.userType}>
                  {actualProfile?.user_type === 'parent' ? 'Parent' : 'Student'}
                </Text>
                {actualProfile?.current_standard && (
                  <Text style={styles.userStandard}>
                    {actualProfile.current_standard} {actualProfile.stream ? `(${actualProfile.stream.toUpperCase()})` : ''}
                  </Text>
                )}
                {actualProfile?.current_school && (
                  <Text style={styles.userSchool}>
                    {actualProfile.current_school}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Profile Details Section */}
          {actualProfile && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Profile Details</Text>
              
              {actualProfile.education_level && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="school-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Education:</Text>
                  <Text style={styles.detailValue}>{actualProfile.education_level}</Text>
                </View>
              )}
              
              {actualProfile.date_of_birth && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Date of Birth:</Text>
                  <Text style={styles.detailValue}>{actualProfile.date_of_birth}</Text>
                </View>
              )}
              
              {actualProfile.gender && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{actualProfile.gender}</Text>
                </View>
              )}
              
              {actualProfile.board && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="school-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Board:</Text>
                  <Text style={styles.detailValue}>{actualProfile.board.toUpperCase()}</Text>
                </View>
              )}
              
              {actualProfile.target_exams && actualProfile.target_exams.length > 0 && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="trophy-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Target Exams:</Text>
                  <Text style={styles.detailValue}>{actualProfile.target_exams.join(', ').toUpperCase()}</Text>
                </View>
              )}
              
              {actualProfile.current_school && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="business-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Current School:</Text>
                  <Text style={styles.detailValue}>{actualProfile.current_school}</Text>
                </View>
              )}
              
              {actualProfile.city && actualProfile.state && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="location-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{actualProfile.city}, {actualProfile.state}</Text>
                </View>
              )}
              
              {actualProfile.pincode && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Pincode:</Text>
                  <Text style={styles.detailValue}>{actualProfile.pincode}</Text>
                </View>
              )}
              
              {actualProfile.address && actualProfile.address.trim() !== '' && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="home-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{actualProfile.address}</Text>
                </View>
              )}
              
              {actualProfile.preferred_search_radius_km && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="search-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Search Radius:</Text>
                  <Text style={styles.detailValue}>{actualProfile.preferred_search_radius_km} km</Text>
                </View>
              )}
              
              {actualProfile.is_profile_completed && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.detailLabel}>Profile Status:</Text>
                  <Text style={[styles.detailValue, { color: '#10b981' }]}>Completed</Text>
                </View>
              )}
              
              {actualProfile.profile_completed_at && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Completed On:</Text>
                  <Text style={styles.detailValue}>{actualProfile.profile_completed_at}</Text>
                </View>
              )}
              
              {actualProfile.user_type === 'parent' && actualProfile.relationship_with_child && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="heart-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Relationship:</Text>
                  <Text style={styles.detailValue}>{actualProfile.relationship_with_child}</Text>
                </View>
              )}
              
              {actualProfile.occupation && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Occupation:</Text>
                  <Text style={styles.detailValue}>{actualProfile.occupation}</Text>
                </View>
              )}
              
              {(actualProfile.budget_min || actualProfile.budget_max) && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="wallet-outline" size={20} color="#6b7280" />
                  <Text style={styles.detailLabel}>Budget Range:</Text>
                  <Text style={styles.detailValue}>
                    {actualProfile.budget_min ? `₹${actualProfile.budget_min}` : '₹0'} - {actualProfile.budget_max ? `₹${actualProfile.budget_max}` : '₹∞'}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* No Profile Data */}
          {!isLoading && !actualProfile && (
            <View style={styles.noProfileContainer}>
              <Ionicons name="person-circle-outline" size={80} color="#9ca3af" />
              <Text style={styles.noProfileTitle}>No Profile Data</Text>
              <Text style={styles.noProfileSubtitle}>Profile information will appear here once loaded</Text>
            </View>
          )}

          {/* Selected Child Section - Only show if user is parent and has children */}
          {actualProfile?.user_type === 'parent' && actualProfile?.children && actualProfile.children.length > 0 && selectedChildId && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Active Child</Text>
              {(() => {
                const selectedChild = actualProfile.children.find((c: any) => c.id === selectedChildId);
                if (!selectedChild) return null;
                const targetExamsDisplay = selectedChild.target_exams && selectedChild.target_exams.length > 0
                  ? selectedChild.target_exams.join(', ')
                  : selectedChild.target_exam || 'Not specified';
                const subjectsDisplay = selectedChild.subjects_interested && selectedChild.subjects_interested.length > 0
                  ? selectedChild.subjects_interested.join(', ')
                  : 'Not specified';
                
                return (
                  <View style={styles.childCard}>
                    <View style={styles.childHeader}>
                      <Ionicons name="person-circle-outline" size={24} color="#3b82f6" />
                      <Text style={styles.childName}>{selectedChild.name}</Text>
                    </View>
                    {selectedChild.current_standard && (
                      <Text style={styles.childDetail}>Standard: {selectedChild.current_standard}</Text>
                    )}
                    {selectedChild.board && (
                      <Text style={styles.childDetail}>Board: {selectedChild.board}</Text>
                    )}
                    {selectedChild.stream && (
                      <Text style={styles.childDetail}>Stream: {selectedChild.stream}</Text>
                    )}
                    <Text style={styles.childDetail}>Target Exams: {targetExamsDisplay}</Text>
                    <Text style={styles.childDetail}>Subjects: {subjectsDisplay}</Text>
                    {selectedChild.budget_min && selectedChild.budget_max && (
                      <Text style={styles.childDetail}>Budget: ₹{selectedChild.budget_min} - ₹{selectedChild.budget_max}/month</Text>
                    )}
                  </View>
                );
              })()}
              {actualProfile.children.length > 1 && (
                <Text style={styles.switchChildHint}>
                  Tap the child switcher in the header to switch between children
                </Text>
              )}
            </View>
          )}

          {/* Profile Options Section */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.profileOption}>
              <View style={styles.optionLeft}>
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <Text style={styles.optionText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileOption}
              onPress={() => {
                if (accessToken) {
                  dispatch(fetchUserProfile());
                } else {
                  Alert.alert('No Token', 'Access token not available');
                }
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
                <Text style={styles.optionText}>Refresh Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileOption}>
              <View style={styles.optionLeft}>
                <Ionicons name="notifications-outline" size={20} color="#6b7280" />
                <Text style={styles.optionText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileOption}>
              <View style={styles.optionLeft}>
                <Ionicons name="shield-outline" size={20} color="#6b7280" />
                <Text style={styles.optionText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Logout Button in Account Section */}
            <TouchableOpacity 
              style={styles.logoutOption}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { 
                      text: 'Cancel', 
                      style: 'cancel' 
                    },
                    { 
                      text: 'Logout', 
                      style: 'destructive',
                      onPress: () => {
                        dispatch(logout());
                        // User will be redirected to login screen automatically via AuthNavigator
                      }
                    }
                  ],
                  { cancelable: true }
                );
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text style={styles.logoutOptionText}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* App Info Section */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>App</Text>
            
            <TouchableOpacity style={styles.profileOption}>
              <View style={styles.optionLeft}>
                <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
                <Text style={styles.optionText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileOption}>
              <View style={styles.optionLeft}>
                <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                <Text style={styles.optionText}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>


          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>

        {/* Bottom Navigation - Fixed */}
        <BottomNavigation
          activeTab={computedActiveTab}
          onTabPress={handleTabPress}
          key={`bottom-nav-${computedActiveTab}-${forceUpdateRef.current}`}
        />
      </SafeAreaView>
    );
  }

  console.log('HomeScreen render - currentScreen:', currentScreen, 'activeTab:', activeTab);
  
  // Debug: Check if there's a mismatch between activeTab and currentScreen
  console.log('Debug - activeTab:', activeTab, 'currentScreen:', currentScreen);
  
  // Debug: Check if we're rendering home screen when we should be rendering online/private
  if (currentScreen === 'home' && (activeTab === 'online' || activeTab === 'private')) {
    console.warn('WARNING: Rendering home screen but activeTab is', activeTab);
  }
  
  return (
    <SafeAreaView key={`${currentScreen}-${forceUpdateRef.current}`} style={styles.container}>
      {/* Header - Fixed */}
      <Header
        location={safeSelectedLocation}
        onLocationPress={handleLocationPress}
        onSearchPress={handleSearchPress}
        userProfile={mockUserProfile}
        selectedStudentId={selectedChildId ? String(selectedChildId) : ''}
        onStudentSelect={(id) => dispatch(setSelectedChildId(Number(id)))}
        isLocationLoading={safeIsLocationLoading}
        coordinates={safeCoordinates}
        selectedLocationData={safeSelectedLocationData}
      />

      {/* Content - With top padding for fixed header */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={safeIsLocationLoading}
            onRefresh={getCurrentLocation}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        // Web-specific scroll properties
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
      >
        {/* Promotional banners */}
        <PromotionalBanner banners={promotionalBanners} />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coaching Centers</Text>
          <View style={styles.sectionHeaderRight}>
            {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={handleOpenFilterModal}
            >
              <Ionicons name="filter" size={16} color="#3b82f6" />
              {appliedFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={getCurrentLocation}
              disabled={safeIsLocationLoading}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={safeIsLocationLoading ? "#9ca3af" : "#3b82f6"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Applied Filters Display */}
        {hasActiveFilters(appliedFilters) && appliedFilters && (
          <View style={styles.appliedFiltersContainer}>
            <View style={styles.appliedFiltersHeader}>
              <Text style={styles.appliedFiltersTitle}>Applied Filters:</Text>
              <TouchableOpacity onPress={handleClearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.appliedFiltersScroll}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {appliedFilters.search && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>Search: {appliedFilters.search}</Text>
                </View>
              )}
              {appliedFilters.feesRange && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.feesRange}</Text>
                </View>
              )}
              {appliedFilters.standard.map((standard) => (
                <View key={standard} style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{standard}</Text>
                </View>
              ))}
              {appliedFilters.coachingType && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.coachingType}</Text>
                </View>
              )}
              {appliedFilters.ratingMin > 0 && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.ratingMin}+ Stars</Text>
                </View>
              )}
              {appliedFilters.distance && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.distance}</Text>
                </View>
              )}
              {appliedFilters.subjects && appliedFilters.subjects.length > 0 && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.subjects.join(', ')}</Text>
                </View>
              )}
              {appliedFilters.targetExams && appliedFilters.targetExams.length > 0 && (
                <View style={styles.appliedFilterChip}>
                  <Text style={styles.appliedFilterText}>{appliedFilters.targetExams.join(', ')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Location Controls */}
        {safeSelectedLocation && (
          <View style={styles.locationControls}>
            <View style={styles.selectedLocationContainer}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color="#3b82f6" />
                <Text style={styles.selectedLocationText}>{safeSelectedLocation}</Text>
              </View>
              <TouchableOpacity 
                style={styles.clearLocationButton}
                onPress={handleClearLocation}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Animated.View 
              style={[
                styles.loadingSpinner,
                {
                  transform: [{
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            >
              <Ionicons name="refresh" size={24} color="#3b82f6" />
            </Animated.View>
            <Text style={styles.loadingTitle}>Loading coaching centers...</Text>
            <Text style={styles.loadingSubtitle}>Please wait while we fetch the latest data</Text>
          </View>
        )}

        {/* Coaching centers list */}
        {!isLoading && filteredCenters.length > 0 && (
          filteredCenters
            .filter(center => {
              // Additional validation to prevent crashes
              if (!center || !center.id) {
                return false;
              }
              
              
              return true;
            })
            .map((center) => (
            <CoachingCard
              key={center.id}
              center={center}
              onBookDemo={handleBookDemo}
              onCallNow={handleCallNow}
              onToggleStar={handleToggleStar}
              onViewDetails={handleViewDetails}
              isStarred={starredCenters.includes(center.id)}
            />
          ))
        )}

        {/* Empty state */}
        {!isLoading && filteredCenters.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coaching centers found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation - Fixed */}
      <BottomNavigation
        activeTab={computedActiveTab}
        onTabPress={handleTabPress}
      />

      {/* Filter Modal */}
      <SearchFilterScreen
        visible={showFilterModal}
        onClose={handleCloseFilterModal}
        onApply={handleApplyFilters}
        searchQuery=""
        initialFilters={appliedFilters || undefined}
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
  filterButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  appliedFiltersContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  appliedFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appliedFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  appliedFiltersScroll: {
    flexDirection: 'row',
  },
  appliedFilterChip: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  appliedFilterText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },

  // New styles for Profile Screen
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50, // Increased padding top for better spacing
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  profileHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  profileHeaderSpacer: {
    width: 40, // Adjust as needed for spacing
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16, // Add padding top to content
  },
  profileSection: {
    marginBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#4b5563',
  },
  userStandard: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  userSchool: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 2,
  },
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  logoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#fef2f2',
  },
  logoutOptionText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Location Controls styles
  locationControls: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  clearLocationButton: {
    padding: 4,
  },

  // New styles for Profile Details Section
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 100,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  // New styles for Children Section
  childCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  childDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  switchChildHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },

  // New styles for Profile Loading State
  profileLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  profileLoadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  // New styles for No Profile Data
  noProfileContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  noProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  noProfileSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },

});

export default HomeScreen;
