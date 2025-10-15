import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import BottomNavigation from '../components/BottomNavigation';
import { CoachingCenter, toggleStarred } from '../store/slices/coachingSlice';
import { fetchCourseDetail, clearCourseDetail } from '../store/slices/onlineCoursesSlice';
import { CoursesTab, MyCoursesTab, MaterialsTab, CourseDetailScreen, OnlineCoaching } from './OnlineScreen/';


interface OnlineScreenProps {
  onBack: () => void;
  onViewDetails: (center: CoachingCenter) => void;
}

const OnlineScreen: React.FC<OnlineScreenProps> = ({ onBack, onViewDetails }) => {
  const dispatch = useAppDispatch();
  const { coachingCenters, starredCenters } = useAppSelector(state => state.coaching);
  const { selectedCourse: courseDetail, courseDetailLoading, courseDetailError } = useAppSelector(state => state.onlineCourses);
  
  const [activeCategory, setActiveCategory] = useState<'coaching' | 'materials' | 'purchased'>('coaching');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<OnlineCoaching | null>(null);

  // Filter online-only centers
  const onlineCenters = useMemo(() => {
    return (coachingCenters || []).filter(center =>
      (center.coaching_type || '').toLowerCase() === 'online'
    );
  }, [coachingCenters]);

  // Fetch course details when a course is selected
  useEffect(() => {
    console.log('OnlineScreen - selectedCourse changed:', selectedCourse);
    if (selectedCourse) {
      console.log('OnlineScreen - Fetching course details for ID:', selectedCourse.id);
      dispatch(fetchCourseDetail(selectedCourse.id));
    }
    
    return () => {
      dispatch(clearCourseDetail());
    };
  }, [selectedCourse, dispatch]);

  const categories = [
    { id: 'coaching', label: 'Courses', icon: 'videocam-outline' },
    { id: 'purchased', label: 'My Courses', icon: 'checkmark-circle-outline' },
    { id: 'materials', label: 'Materials', icon: 'document-text-outline' }
  ];

  const handleBookDemo = (center: CoachingCenter) => {
    Alert.alert('Book Demo', `Would you like to book a demo class at ${center.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Book Now', onPress: () => Alert.alert('Success', 'Demo class booked successfully!') },
    ]);
  };

  const handleCallNow = (center: CoachingCenter) => {
    Alert.alert('Call Now', `Would you like to call ${center.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => {} },
    ]);
  };

  const handleToggleStar = (centerId: string) => {
    dispatch(toggleStarred(centerId));
  };

  if (selectedCourse) {
    console.log('OnlineScreen - Rendering course detail screen');
    console.log('OnlineScreen - courseDetail:', courseDetail);
    console.log('OnlineScreen - courseDetailLoading:', courseDetailLoading);
    console.log('OnlineScreen - courseDetailError:', courseDetailError);
    
    // Use the detailed course data if available, otherwise use the basic course data
    const courseToDisplay = courseDetail || selectedCourse;
    
    return (
      <CourseDetailScreen
        course={courseToDisplay}
        onBack={() => setSelectedCourse(null)}
        activeTab="online"
        onTabSelect={(tab) => {
          if (tab === 'online') return;
          onBack();
        }}
        onJoinLiveClass={(courseId) => {
          Alert.alert('Join Live Class', `Joining live class for course ID: ${courseId}`);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Learning</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, materials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <View style={styles.categoryTabs}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                activeCategory === category.id && styles.categoryTabActive
              ]}
              onPress={() => setActiveCategory(category.id as any)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={activeCategory === category.id ? '#059669' : '#6b7280'} 
              />
              <Text style={[
                styles.categoryTabText,
                activeCategory === category.id && styles.categoryTabTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeCategory === 'coaching' && (
          <CoursesTab 
            searchQuery={searchQuery} 
            onCourseSelect={(course) => {
              console.log('OnlineScreen - Course selected from CoursesTab:', course.title, 'ID:', course.id);
              setSelectedCourse(course);
            }}
          />
        )}

        {activeCategory === 'materials' && (
          <MaterialsTab searchQuery={searchQuery} />
        )}

        {activeCategory === 'purchased' && (
          <MyCoursesTab searchQuery={searchQuery} />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="online"
        onTabPress={(tab) => {
          if (tab === 'online') return;
          onBack();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
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
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTabTextActive: {
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  detailPlaceholder: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default OnlineScreen;


