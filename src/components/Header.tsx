import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StudentSwitcher from './StudentSwitcher';

interface HeaderProps {
  location: string;
  onLocationPress: () => void;
  onSearchPress?: (searchTerm: string) => void; // Updated to pass search term
  userProfile?: any;
  selectedStudentId: string;
  onStudentSelect: (studentId: string) => void;
  isLocationLoading?: boolean;
  coordinates?: { latitude: number; longitude: number } | null;
  selectedLocationData?: {
    area: string;
    state: string;
  } | null;
}

const Header: React.FC<HeaderProps> = ({
  location,
  onLocationPress,
  onSearchPress, // Updated to handle search functionality
  userProfile,
  selectedStudentId,
  onStudentSelect,
  isLocationLoading = false,
  coordinates = null,
  selectedLocationData = null,
}) => {
  
  // Function to get the display text for location
  const getLocationDisplayText = (): string => {
    if (isLocationLoading) {
      return 'Getting current location...';
    }
    
    if (selectedLocationData?.area && selectedLocationData?.state) {
      return `${selectedLocationData.area}, ${selectedLocationData.state}`;
    }
    
    if (location && location !== 'Getting location...') {
      return location;
    }
    
    return 'Select location';
  };

  const hasChildren = userProfile?.user_type === 'parent' && (() => {
    const childrenList = userProfile.children || userProfile.students || [];
    return childrenList.length > 0;
  })();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Top Row - Student Switcher + Location */}
        <View style={styles.topRow}>
          {/* Student Switcher (for parents with multiple students) */}
          {hasChildren && (
            <View style={styles.studentSwitcherContainer}>
              <StudentSwitcher 
                students={userProfile.children || userProfile.students || []}
                currentStudentId={selectedStudentId || ''}
                onStudentSelect={onStudentSelect}
              />
            </View>
          )}
          
          {/* Location selector */}
          <View style={[
            styles.locationContainer,
            hasChildren ? styles.locationContainerWithSwitcher : styles.locationContainerFull
          ]}>
            <View style={[
              styles.locationIconContainer,
              isLocationLoading && styles.locationIconLoading,
              coordinates && !isLocationLoading && styles.locationIconActive
            ]}>
              <Ionicons 
                name={isLocationLoading ? "location-outline" : "location"} 
                size={20} 
                color={isLocationLoading ? "#9ca3af" : coordinates ? "#10b981" : "#3b82f6"} 
              />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {getLocationDisplayText()}
              </Text>
              {isLocationLoading && (
                <View style={styles.locationLoadingIndicator}>
                  <Ionicons name="ellipsis-horizontal" size={12} color="#9ca3af" />
                  <Text style={styles.loadingText}>Refreshing...</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              onPress={onLocationPress}
              style={styles.changeLocationButton}
              disabled={isLocationLoading}
            >
              <Text style={styles.changeLocationText}>Change</Text>
              <Ionicons name="chevron-down" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search bar - FUNCTIONAL */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => {
            // Navigate to search screen when search bar is pressed
            if (onSearchPress) {
              onSearchPress('');
            }
          }}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color="#9ca3af" 
            style={styles.searchIcon} 
          />
          <Text style={styles.searchPlaceholder}>
            Search coaching centers...
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 40, // Increased padding top for better spacing
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  studentSwitcherContainer: {
    flexShrink: 0,
    width: 110, // Fixed width for student switcher
    maxWidth: 110,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  locationContainerWithSwitcher: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  locationContainerFull: {
    flex: 1,
    minWidth: 0,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationIconLoading: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  locationIconActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationTextContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1, // Allow it to shrink if needed
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  locationLoadingIndicator: {
    marginTop: 2,
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  changeLocationText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 44,
    flexShrink: 0, // Prevent button from shrinking
  },
  // Search styles - FUNCTIONAL
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
    paddingVertical: 0,
  },
});

export default Header;
