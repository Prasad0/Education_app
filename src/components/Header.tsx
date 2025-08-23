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
}

const Header: React.FC<HeaderProps> = ({
  location,
  onLocationPress,
  onSearchPress,
  userProfile,
  selectedStudentId,
  onStudentSelect,
}) => {
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
            <Ionicons name="location" size={20} color="#6b7280" style={styles.locationIcon} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
            <TouchableOpacity 
              onPress={onLocationPress}
              style={styles.changeLocationButton}
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
  locationIcon: {
    flexShrink: 0,
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
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 44,
  },
  changeLocationText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
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
