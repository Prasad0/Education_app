import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchEnrollments, refreshEnrollments, clearError } from '../../store/slices/enrollmentsSlice';
import { Enrollment } from '../../store/slices/enrollmentsSlice';
import { TabComponentProps } from './types';

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

interface MyCoursesTabProps extends TabComponentProps {
  onVideoPress?: (videoData: {
    videoUrl: string;
    courseTitle: string;
    instructorName: string;
    courseDescription: string;
  }) => void;
}

const MyCoursesTab: React.FC<MyCoursesTabProps> = ({ searchQuery, onVideoPress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading, error, refreshing } = useSelector((state: RootState) => state.enrollments);

  useEffect(() => {
    dispatch(fetchEnrollments());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Enrollments error:', error);
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    dispatch(refreshEnrollments());
  };

  const handleCoursePress = (enrollment: Enrollment) => {
    if (enrollment.course?.video && onVideoPress) {
      // Construct full video URL if it's relative
      let videoUrl = enrollment.course.video;
      if (videoUrl && videoUrl.startsWith('/')) {
        videoUrl = `http://13.200.17.30${videoUrl}`;
      }
      
      console.log('MyCoursesTab - Opening video:', {
        courseTitle: enrollment.course.title,
        originalVideoUrl: enrollment.course.video,
        finalVideoUrl: videoUrl,
        hasVideo: !!enrollment.course.video
      });
      
      onVideoPress({
        videoUrl: videoUrl,
        courseTitle: enrollment.course.title || 'Untitled Course',
        instructorName: enrollment.course.instructor?.name || 'Unknown Instructor',
        courseDescription: enrollment.course.short_description || 'Course video content',
      });
    } else {
      console.log('MyCoursesTab - No video available for course:', enrollment.course?.title);
      // You could show an alert here or navigate to course details instead
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!enrollment.course) return false;
    
    const titleMatch = enrollment.course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const subjectMatch = enrollment.course.subjects?.some(subject => 
      subject.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || false;
    const instructorMatch = enrollment.course.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    return titleMatch || subjectMatch || instructorMatch;
  });

  const EnrollmentCard = ({ enrollment }: { enrollment: Enrollment }) => {
    if (!enrollment.course) {
      return null;
    }

    return (
      <TouchableOpacity 
        style={styles.purchasedCard} 
        activeOpacity={0.9}
        onPress={() => handleCoursePress(enrollment)}
      >
        <View style={styles.purchasedImageContainer}>
          {enrollment.course.thumbnail ? (
            <View style={styles.purchasedImagePlaceholder}>
              <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
            </View>
          ) : (
            <View style={styles.purchasedImagePlaceholder}>
              <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
            </View>
          )}
          
          <View style={styles.purchasedPlatformBadge}>
            <Text style={styles.purchasedPlatformBadgeText}>
              {enrollment.course.platform?.name || 'Unknown Platform'}
            </Text>
          </View>

          {enrollment.course.video && (
            <View style={styles.playButtonOverlay}>
              <Ionicons name="play" size={24} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={styles.purchasedContent}>
          <Text style={styles.purchasedTitle} numberOfLines={2}>
            {enrollment.course.title || 'Untitled Course'}
          </Text>
          <Text style={styles.purchasedInstructor}>
            by {enrollment.course.instructor?.name || 'Unknown Instructor'}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{enrollment.progress_percentage || 0}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${enrollment.progress_percentage || 0}%` }]} />
            </View>
          </View>

          <View style={styles.purchasedDates}>
            <Text style={styles.purchasedDate}>
              Enrolled: {formatDate(enrollment.enrollment_date)}
            </Text>
            <Text style={styles.purchasedDate}>
              Expires: {formatDate(enrollment.course.end_date)}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => handleCoursePress(enrollment)}
          >
            <Ionicons name="play-outline" size={16} color="#ffffff" />
            <Text style={styles.continueButtonText}>
              {enrollment.course.video ? 'Watch Video' : 'Continue Learning'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEnrollment = ({ item }: { item: Enrollment }) => (
    <EnrollmentCard enrollment={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No enrolled courses</Text>
      <Text style={styles.emptySubtitle}>Start exploring courses to see them here</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={styles.loadingText}>Loading your courses...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to load courses</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchEnrollments())}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && enrollments.length === 0) {
    return renderLoading();
  }

  if (error && enrollments.length === 0) {
    return renderError();
  }

  return (
    <FlatList
      data={filteredEnrollments}
      renderItem={renderEnrollment}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.purchasedList}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#059669']}
          tintColor="#059669"
        />
      }
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
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyCoursesTab;
