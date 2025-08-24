import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StudentSwitcher from './StudentSwitcher';

interface HeaderProps {
  location: string;
  onLocationPress: () => void;
  onSearchPress: () => void;
  userProfile?: any;
  selectedStudentId: string;
  onStudentSelect: (studentId: string) => void;
  isLocationLoading?: boolean;
  coordinates?: { latitude: number; longitude: number } | null;
}

const Header: React.FC<HeaderProps> = ({
  location,
  onLocationPress,
  onSearchPress,
  userProfile,
  selectedStudentId,
  onStudentSelect,
  isLocationLoading = false,
  coordinates = null,
}) => {
  
  // Function to extract city and state from full address
  const getCityAndState = (fullAddress: string): string => {
    if (!fullAddress || fullAddress === 'Getting location...' || fullAddress === 'Location unavailable' || fullAddress === 'Location permission denied') {
      return fullAddress;
    }
    
    const parts = fullAddress.split(',').map(part => part.trim());
    
    // Try to find city and state
    if (parts.length >= 2) {
      // Get the last two parts (usually city and state)
      const city = parts[parts.length - 2];
      const state = parts[parts.length - 1];
      
      if (city && state) {
        return `${city}, ${state}`;
      }
    }
    
    // Fallback: return the last part if it exists
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
    
    return fullAddress;
  };
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Top Row - Student Switcher + Location */}
        <View style={styles.topRow}>
          {/* Student Switcher (for parents with multiple students) */}
          {userProfile?.user_type === 'parent' && userProfile.students && userProfile.students.length > 0 && (
            <View style={styles.studentSwitcherContainer}>
              <StudentSwitcher 
                students={userProfile.students}
                currentStudentId={selectedStudentId}
                onStudentSelect={onStudentSelect}
              />
            </View>
          )}
          
          {/* Location selector */}
          <View style={[
            styles.locationContainer,
            userProfile?.user_type === 'parent' && userProfile.students && userProfile.students.length > 1 
              ? styles.locationContainerWithSwitcher 
              : styles.locationContainerFull
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
                {isLocationLoading ? 'Getting current location...' : getCityAndState(location)}
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
        
        {/* Search bar */}
        <TouchableOpacity
          onPress={onSearchPress}
          style={styles.searchBar}
        >
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search coaching centers...</Text>
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
    gap: 8,
  },
  studentSwitcherContainer: {
    flex: 1,
    minWidth: 0,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationContainerWithSwitcher: {
    flexShrink: 0,
  },
  locationContainerFull: {
    flex: 1,
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
  },
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
    color: '#9ca3af',
    fontSize: 16,
    flex: 1,
  },
});

export default Header;
