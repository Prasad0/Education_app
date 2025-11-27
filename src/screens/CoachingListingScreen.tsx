import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, filterCenters, setSearchParams, searchCoachingCenters, clearData, toggleStarred, addToFavorite, removeFromFavorite } from '../store/slices/coachingSlice';
import { deselectLocation } from '../store/slices/locationSlice';
import { logout } from '../store/slices/authSlice';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import CoachingCard from '../components/CoachingCard';
import { CoachingCenter } from '../store/slices/coachingSlice';

interface CoachingListingScreenProps {
  onBack: () => void;
}

const CoachingListingScreen: React.FC<CoachingListingScreenProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { 
    filteredCenters, 
    isLoading, 
    error, 
    activeTab, 
    starredCenters,
    searchParams 
  } = useAppSelector(state => state.coaching);
  
  const { accessToken, profile, user, selectedChildId } = useAppSelector(state => state.auth);
  const { selectedLocation, selectedLocationData, coordinates } = useAppSelector(state => state.location);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState<string>('');

  // Mock user profile for now
  const mockUserProfile = {
    user_type: 'parent',
    students: [
      { id: '1', name: 'Rahul Kumar', current_standard: '12th', target_exam: 'JEE Main' },
      { id: '2', name: 'Priya Sharma', current_standard: '10th', target_exam: 'Board Exam' },
    ]
  };

  // Fetch coaching centers when component mounts or location changes
  useEffect(() => {
    console.log('📍 [CoachingListingScreen] LOCATION CHANGED - useEffect triggered');
    console.log('📍 [CoachingListingScreen] New selectedLocation:', selectedLocation);
    console.log('📍 [CoachingListingScreen] New coordinates:', coordinates);
    
    // Fetch coaching centers using selected location
    if (selectedLocation) {
      // Extract area name from selected location (e.g., "Borivali, Maharashtra, India" -> "Borivali")
      const areaName = selectedLocation.split(',')[0].trim();
      
      console.log('📍 [CoachingListingScreen] Using selected location:', selectedLocation);
      console.log('🔍 [CoachingListingScreen] Area name for search:', areaName);
      console.log('📍 [CoachingListingScreen] Coordinates:', coordinates);
      
      // Use the area name for search and include coordinates directly
      const params = { 
        search: areaName,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude
      };
      
      console.log('📋 [CoachingListingScreen] Dispatching fetchCoachingCenters with params:', JSON.stringify(params, null, 2));
      dispatch(fetchCoachingCenters(params));
    } else {
      // Fallback to default location if no location selected
      const params = { 
        location: 'Koramangala',
        city: 'Bangalore'
      };
      
      console.log('📋 [CoachingListingScreen] No location selected, using default params:', JSON.stringify(params, null, 2));
      dispatch(fetchCoachingCenters(params));
    }
  }, [dispatch, selectedLocation, coordinates]);

  useEffect(() => {
    // Set initial student if available
    if (mockUserProfile.students && mockUserProfile.students.length > 0) {
      setSelectedStudentId(mockUserProfile.students[0].id);
    }
  }, []);

  // Handle authentication errors
  useEffect(() => {
    if (error === 'UNAUTHORIZED') {
      // Clear coaching data first
      dispatch(clearData());
      // Clear auth state and redirect to login
      dispatch(logout());
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [{ text: 'OK' }]
      );
    }
  }, [error, dispatch]);

  const handleTabPress = (tab: 'offline' | 'online' | 'private' | 'chat' | 'profile') => {
    if (tab === 'profile') {
      return;
    }
    
    // This will be handled by the parent component
  };

  const handleLocationPress = () => {
    // Handle location change
  };

  const handleSearchPress = () => {
    // Handle search
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      dispatch(searchCoachingCenters(searchText.trim()));
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      // If search is cleared, fetch coaching centers for current location
      // Only fetch if user is authenticated
      if (selectedLocation && accessToken) {
        const areaName = selectedLocation.split(',')[0].trim();
        const params = { 
          search: areaName,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude
        };
        dispatch(fetchCoachingCenters(params));
      }
    }
  };

  const handleBookDemo = (center: CoachingCenter) => {
    // Check if it's an offline coaching center
    const isOffline = (center.coaching_type || '').toLowerCase() === 'offline';
    
    if (isOffline) {
      // For offline coaching, redirect to call
      const phoneNumber = center.phone?.replace(/\s+/g, '') || center.contact_number?.replace(/\s+/g, '') || '';
      if (phoneNumber) {
        Alert.alert(
          'Call Now',
          `Would you like to call ${center.name} to book a demo?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call', 
              onPress: () => {
                Linking.openURL(`tel:${phoneNumber}`);
              }
            }
          ]
        );
      } else {
        Alert.alert('Contact Not Available', 'Phone number not available for this coaching center.');
      }
    } else {
      // For online/hybrid coaching, proceed with normal booking
      Alert.alert(
        'Book Demo',
        `Would you like to book a demo class at ${center.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Book Now', 
            onPress: () => {
              Alert.alert('Success', 'Demo class booked successfully!');
            }
          }
        ]
      );
    }
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
            const phoneNumber = center.phone?.replace(/\s+/g, '') || '';
            if (phoneNumber) {
              Linking.openURL(`tel:${phoneNumber}`);
            }
          }
        }
      ]
    );
  };

  const handleToggleStar = async (centerId: string) => {
    try {
      const isCurrentlyFavorited = starredCenters.includes(centerId);
      
      // Update UI immediately for better UX
      dispatch(toggleStarred(centerId));
      
      const currentProfile = profile || user;
      const userType = currentProfile?.user_type || currentProfile?.userType;
      
      let studentId: number;
      
      if (userType === 'parent' && selectedChildId) {
        studentId = selectedChildId;
      } else {
        studentId = currentProfile?.id || currentProfile?.user_id || parseInt(currentProfile?.user?.id || '0', 10);
      }
      
      if (!studentId || studentId === 0) {
        console.warn('No valid student ID found');
        return;
      }
      
      let result;
      if (isCurrentlyFavorited) {
        result = await dispatch(removeFromFavorite({ coachingId: centerId, studentId }));
        if (removeFromFavorite.rejected.match(result)) {
          dispatch(toggleStarred(centerId));
          console.error('Failed to remove from favorites:', result.payload);
        }
      } else {
        result = await dispatch(addToFavorite({ coachingId: centerId, studentId }));
        if (addToFavorite.rejected.match(result)) {
          dispatch(toggleStarred(centerId));
          console.error('Failed to add to favorites:', result.payload);
        }
      }
    } catch (error) {
      console.error('Error in handleToggleStar:', error);
      dispatch(toggleStarred(centerId));
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    const newParams = { ...searchParams, [filterType]: value };
    dispatch(setSearchParams(newParams));
    dispatch(filterCenters(newParams));
  };

  const clearFilters = () => {
    dispatch(setSearchParams({}));
    dispatch(filterCenters({}));
    // Clear filters and fetch with only radius - only if authenticated
    if (accessToken) {
      dispatch(fetchCoachingCenters({ radius: 2000 }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed */}
      <Header
        location={selectedLocation || 'Koramangala, Bangalore'}
        onLocationPress={handleLocationPress}
        onSearchPress={handleSearchPress}
        userProfile={mockUserProfile}
        selectedStudentId={selectedStudentId || ''}
        onStudentSelect={setSelectedStudentId}
        selectedLocationData={selectedLocationData}
      />

             {/* Search Bar */}
       <View style={styles.searchBar}>
         <View style={styles.searchInputContainer}>
           <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
           <TextInput
             style={styles.searchInput}
             placeholder="Search coaching centers..."
             value={searchText}
             onChangeText={handleSearchChange}
             onSubmitEditing={handleSearchSubmit}
             returnKeyType="search"
           />
           {searchText.length > 0 && (
             <TouchableOpacity
               style={styles.clearSearchButton}
               onPress={() => handleSearchChange('')}
             >
               <Ionicons name="close-circle" size={20} color="#9ca3af" />
             </TouchableOpacity>
           )}
         </View>
         <TouchableOpacity
           style={styles.searchButton}
           onPress={handleSearchSubmit}
           disabled={!searchText.trim()}
         >
           <Text style={[styles.searchButtonText, !searchText.trim() && styles.searchButtonTextDisabled]}>
             Search
           </Text>
         </TouchableOpacity>
       </View>

       {/* Filter Bar */}
       <View style={styles.filterBar}>
         <TouchableOpacity
           style={styles.filterButton}
           onPress={() => setShowFilters(!showFilters)}
         >
           <Ionicons name="filter" size={20} color="#6b7280" />
           <Text style={styles.filterButtonText}>Filters</Text>
           <Ionicons 
             name={showFilters ? "chevron-up" : "chevron-down"} 
             size={16} 
             color="#6b7280" 
           />
         </TouchableOpacity>
         
         <TouchableOpacity
           style={styles.clearFiltersButton}
           onPress={clearFilters}
         >
           <Text style={styles.clearFiltersText}>Clear</Text>
         </TouchableOpacity>
       </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Subject</Text>
            <View style={styles.filterOptions}>
              {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.filterOption,
                    searchParams.subject === subject && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    handleFilterChange('subject', searchParams.subject === subject ? undefined : subject);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterOptionText,
                    searchParams.subject === subject && styles.filterOptionTextSelected
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Rating</Text>
            <View style={styles.filterOptions}>
              {[4, 4.5, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.filterOption,
                    searchParams.rating_min === rating && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    handleFilterChange('rating_min', searchParams.rating_min === rating ? undefined : rating);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterOptionText,
                    searchParams.rating_min === rating && styles.filterOptionTextSelected
                  ]}>
                    {rating}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Distance</Text>
            <View style={styles.filterOptions}>
              {[5, 10, 15, 20].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.filterOption,
                    searchParams.distance_max === distance && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    handleFilterChange('distance_max', searchParams.distance_max === distance ? undefined : distance);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterOptionText,
                    searchParams.distance_max === distance && styles.filterOptionTextSelected
                  ]}>
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Content - With top padding for fixed header */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Results Summary */}
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsText}>
            {filteredCenters.length} coaching center{filteredCenters.length !== 1 ? 's' : ''} found
          </Text>
          {Object.keys(searchParams).length > 0 && (
            <Text style={styles.activeFiltersText}>
              with active filters
            </Text>
          )}
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Ionicons name="refresh" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.loadingTitle}>Loading coaching centers...</Text>
            <Text style={styles.loadingSubtitle}>Please wait while we fetch the latest data</Text>
          </View>
        )}

        {/* Coaching centers list */}
        {!isLoading && filteredCenters.length > 0 && (
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
        )}

        {/* Empty state */}
        {!isLoading && filteredCenters.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coaching centers found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
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
    paddingTop: 100, // Further reduced to match HomeScreen spacing
  },
  contentContainer: {
    paddingBottom: 120, // Increased from 100 to 120 for more bottom spacing
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearSearchButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#9ca3af',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  filtersPanel: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  filterOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
  },
  resultsSummary: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
});

export default CoachingListingScreen;
