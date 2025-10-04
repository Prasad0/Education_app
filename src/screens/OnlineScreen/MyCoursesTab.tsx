import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasedCourse, TabComponentProps } from './types';

// Mock data for purchased courses
const purchasedCourses: PurchasedCourse[] = [
  {
    id: '1',
    title: 'JEE Main Physics Complete Course',
    instructor: 'Dr. Rajesh Sharma',
    subject: 'Physics',
    progress: 68,
    purchaseDate: '15 Nov 2024',
    expiryDate: '15 May 2025',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
    platform: 'CourseHub'
  },
  {
    id: '2',
    title: 'NEET Biology Masterclass',
    instructor: 'Prof. Priya Gupta',
    subject: 'Biology',
    progress: 45,
    purchaseDate: '28 Oct 2024',
    expiryDate: '28 Feb 2025',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
    platform: 'CourseHub'
  }
];

const MyCoursesTab: React.FC<TabComponentProps> = ({ searchQuery }) => {
  const filteredCourses = purchasedCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PurchasedCourseCard = ({ course }: { course: PurchasedCourse }) => (
    <TouchableOpacity style={styles.purchasedCard} activeOpacity={0.9}>
      <View style={styles.purchasedImageContainer}>
        <View style={styles.purchasedImagePlaceholder}>
          <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
        </View>
        
        <View style={styles.purchasedPlatformBadge}>
          <Text style={styles.purchasedPlatformBadgeText}>{course.platform}</Text>
        </View>
      </View>

      <View style={styles.purchasedContent}>
        <Text style={styles.purchasedTitle} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.purchasedInstructor}>by {course.instructor}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{course.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          </View>
        </View>

        <View style={styles.purchasedDates}>
          <Text style={styles.purchasedDate}>Purchased: {course.purchaseDate}</Text>
          <Text style={styles.purchasedDate}>Expires: {course.expiryDate}</Text>
        </View>

        <TouchableOpacity style={styles.continueButton}>
          <Ionicons name="play-outline" size={16} color="#ffffff" />
          <Text style={styles.continueButtonText}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCourse = ({ item }: { item: PurchasedCourse }) => (
    <PurchasedCourseCard course={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No purchased courses</Text>
    </View>
  );

  return (
    <FlatList
      data={filteredCourses}
      renderItem={renderCourse}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.purchasedList}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  purchasedList: {
    padding: 16,
    paddingBottom: 120, // Account for bottom navigation
    gap: 16,
  },
  purchasedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  purchasedImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  purchasedImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasedPlatformBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  purchasedPlatformBadgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '500',
  },
  purchasedContent: {
    padding: 16,
    gap: 12,
  },
  purchasedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  purchasedInstructor: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  purchasedDates: {
    gap: 4,
  },
  purchasedDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
});

export default MyCoursesTab;
