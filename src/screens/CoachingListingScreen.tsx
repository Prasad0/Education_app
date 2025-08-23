import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenters, filterCenters, setSearchParams } from '../store/slices/coachingSlice';
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
  
  const [location, setLocation] = useState('Koramangala, Bangalore');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock user profile for now
  const mockUserProfile = {
    user_type: 'parent',
    students: [
      { id: '1', name: 'Rahul Kumar', current_standard: '12th', target_exam: 'JEE Main' },
      { id: '2', name: 'Priya Sharma', current_standard: '10th', target_exam: 'Board Exam' },
    ]
  };

  useEffect(() => {
    // Fetch coaching centers when component mounts with city parameter
    const params = { 
      location: 'Koramangala',
      city: 'Bangalore'
    };
    
    console.log('📋 [CoachingListingScreen] Dispatching fetchCoachingCenters with params:', JSON.stringify(params, null, 2));
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
      console.log('Navigate to profile');
      return;
    }
    
    // This will be handled by the parent component
    console.log('Tab pressed:', tab);
  };

  const handleLocationPress = () => {
    // Handle location change
    console.log('Location pressed');
  };

  const handleSearchPress = () => {
    // Handle search
    console.log('Search pressed');
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
            const phoneNumber = center.phone.replace(/\s+/g, '');
            Linking.openURL(`tel:${phoneNumber}`);
          }
        }
      ]
    );
  };

  const handleToggleStar = (centerId: string) => {
    // This will be handled by the parent component
    console.log('Toggle star:', centerId);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    const newParams = { ...searchParams, [filterType]: value };
    console.log('🔍 [CoachingListingScreen] Filter changed:', filterType, '=', value);
    console.log('📋 [CoachingListingScreen] New filter params:', JSON.stringify(newParams, null, 2));
    dispatch(setSearchParams(newParams));
    dispatch(filterCenters(newParams));
  };

  const clearFilters = () => {
    dispatch(setSearchParams({}));
    dispatch(filterCenters({}));
  };

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
                  onPress={() => handleFilterChange('subject', searchParams.subject === subject ? undefined : subject)}
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
                  onPress={() => handleFilterChange('rating_min', searchParams.rating_min === rating ? undefined : rating)}
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
                  onPress={() => handleFilterChange('distance_max', searchParams.distance_max === distance ? undefined : distance)}
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
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
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
    paddingTop: 100, // Further reduced to match HomeScreen spacing
  },
  contentContainer: {
    paddingBottom: 120, // Increased from 100 to 120 for more bottom spacing
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
});

export default CoachingListingScreen;
