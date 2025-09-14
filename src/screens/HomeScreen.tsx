import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Linking, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, searchCoachingCenters, filterCoachingCenters, setActiveTab, toggleStarred, clearData } from '../store/slices/coachingSlice';
import { getCurrentLocation as getLocationFromSlice, deselectLocation } from '../store/slices/locationSlice';
import { fetchUserProfile } from '../store/slices/authSlice';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import PromotionalBanner from '../components/PromotionalBanner';
import CoachingCard from '../components/CoachingCard';
import CoachingListingScreen from './CoachingListingScreen';
import CoachingDetailScreen from './CoachingDetailScreen';
import LocationSelector from '../components/LocationSelector';
import SearchFilterScreen from './SearchFilterScreen';
import { CoachingCenter } from '../store/slices/coachingSlice';
import { logout } from '../store/slices/authSlice';

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
  
  const [currentScreen, setCurrentScreen] = useState<'home' | 'search' | 'listing' | 'location' | 'profile' | 'detail' | 'searchFilter'>('home');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCoachingId, setSelectedCoachingId] = useState<string>('');
  const [spinValue] = useState(new Animated.Value(0));

  // Determine which profile data to use (user or profile field)
  const actualProfile = user || profile;
  
  // Mock user profile for now - this should come from your auth state
  const mockUserProfile = actualProfile ? {
    user_type: actualProfile.user_type,
    students: actualProfile.children && actualProfile.children.length > 0 ? actualProfile.children : []
  } : {
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
    // Set initial student if available
    if (actualProfile?.children && actualProfile.children.length > 0) {
      // Use real profile data
      setSelectedStudentId(actualProfile.children[0].id || '1');
    } else if (mockUserProfile.students && mockUserProfile.students.length > 0) {
      // Fallback to mock data
      setSelectedStudentId(mockUserProfile.students[0].id);
    }
  }, [actualProfile, mockUserProfile.students]);

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

  const handleTabPress = (tab: 'offline' | 'online' | 'starred' | 'profile') => {
         if (tab === 'profile') {
       // Navigate to profile screen
       setCurrentScreen('profile');
       return;
     }
    
    if (tab === 'offline' || tab === 'online' || tab === 'starred') {
      // For coaching-related tabs, go back to home screen and set active tab
      setCurrentScreen('home');
      dispatch(setActiveTab(tab));
      return;
    }
  };

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



  const handleClearLocation = () => {
    dispatch(deselectLocation());
    // Clear coaching centers when location is deselected - only pass radius
    // Only fetch if user is authenticated
    if (accessToken && authState.isAuthenticated) {
      dispatch(fetchCoachingCenters({ radius: 2000 }));
    }
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
    console.log('Viewing details for center:', center.name, 'ID:', center.id);
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

  if (currentScreen === 'searchFilter') {
    return (
      <SearchFilterScreen
        onBack={() => setCurrentScreen('home')}
        searchQuery=""
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

          {/* Children Section - Only show if user is parent and has children */}
          {actualProfile?.user_type === 'parent' && actualProfile?.children && actualProfile.children.length > 0 && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Children ({actualProfile.children.length})</Text>
              {actualProfile.children.map((child: any, index: number) => (
                <View key={child.id || index} style={styles.childCard}>
                  <View style={styles.childHeader}>
                    <Ionicons name="person-circle-outline" size={24} color="#3b82f6" />
                    <Text style={styles.childName}>{child.name || `Child ${index + 1}`}</Text>
                  </View>
                  {child.current_standard && (
                    <Text style={styles.childDetail}>Standard: {child.current_standard}</Text>
                  )}
                  {child.target_exam && (
                    <Text style={styles.childDetail}>Target: {child.target_exam}</Text>
                  )}
                </View>
              ))}
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

          {/* Logout Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Logout', 
                      style: 'destructive',
                      onPress: () => {
                        dispatch(logout());
                                                 // Navigate to auth screen or reset the app
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>

        {/* Bottom Navigation - Fixed */}
        <BottomNavigation
          activeTab="profile"
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed */}
      <Header
        location={safeSelectedLocation}
        onLocationPress={handleLocationPress}
        onSearchPress={handleSearchPress}
        userProfile={mockUserProfile}
        selectedStudentId={selectedStudentId || ''}
        onStudentSelect={setSelectedStudentId}
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
              onPress={() => {
                // Example filter - you can customize this based on your needs
                const exampleFilter = {
                  standards: '11th,12th',
                  subjects: 'Physics,Chemistry,Mathematics',
                  target_exams: 'JEE Main,NEET',
                  coaching_type: 'offline',
                  fees_min: 10000,
                  fees_max: 500000,
                  rating_min: 4.0,
                };
                handleFilter(exampleFilter);
              }}
            >
              <Ionicons name="filter" size={16} color="#3b82f6" />
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
  filterButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    marginTop: 16,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
