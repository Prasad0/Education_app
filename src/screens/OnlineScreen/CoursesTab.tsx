import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOnlineCourses, loadMoreCourses, refreshCourses } from '../../store/slices/onlineCoursesSlice';
import { OnlineCoaching, TabComponentProps } from './types';

const CoursesTab: React.FC<TabComponentProps> = ({ searchQuery, onCourseSelect }) => {
  const dispatch = useAppDispatch();
  const { courses, loading, error, hasNextPage, refreshing } = useAppSelector(state => state.onlineCourses);

  // Load courses on component mount
  useEffect(() => {
    dispatch(fetchOnlineCourses(1));
  }, [dispatch]);

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.subjects.some(subject => 
      subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load more courses when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      dispatch(loadMoreCourses());
    }
  }, [dispatch, hasNextPage, loading]);

  // Refresh courses
  const handleRefresh = useCallback(() => {
    dispatch(refreshCourses());
  }, [dispatch]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'Intermediate':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'Advanced':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const CourseCard = ({ course }: { course: OnlineCoaching }) => {
    const isFree = course.is_free;
    const isThirdParty = course.platform.is_third_party;
    const levelColors = getLevelColor(course.level.name);
    const primarySubject = course.subjects[0]?.name || 'General';
    const priceText = isFree ? 'FREE' : `₹${parseFloat(course.price).toLocaleString()}`;
    const originalPriceText = course.original_price ? `₹${parseFloat(course.original_price).toLocaleString()}` : null;
    const discountText = course.discount_percentage > 0 ? `${course.discount_percentage}% OFF` : null;

    return (
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => onCourseSelect?.(course)}
        activeOpacity={0.9}
      >
        <View style={styles.courseImageContainer}>
          <View style={styles.courseImagePlaceholder}>
            <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
          </View>
          
          {course.is_live && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
            </View>
          )}
          
          {isFree && (
            <View style={styles.freeBadge}>
              <Ionicons name="gift-outline" size={12} color="#ffffff" />
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          )}
          
          {isThirdParty && (
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>{course.platform.name}</Text>
            </View>
          )}
          
          {discountText && !isFree && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountText}</Text>
            </View>
          )}
        </View>

        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={styles.courseBadges}>
              <View style={[styles.levelBadge, { backgroundColor: levelColors.backgroundColor }]}>
                <Text style={[styles.levelBadgeText, { color: levelColors.color }]}>{course.level.name}</Text>
              </View>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{primarySubject}</Text>
              </View>
            </View>
            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            <Text style={styles.courseInstructor}>by {course.instructor.name}</Text>
          </View>

          <View style={styles.courseStats}>
            <View style={styles.courseStat}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.courseStatText}>{course.rating}</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="people-outline" size={12} color="#6b7280" />
              <Text style={styles.courseStatText}>{course.enrolled_students.toLocaleString()}</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="time-outline" size={12} color="#6b7280" />
              <Text style={styles.courseStatText}>{course.duration_months} months</Text>
            </View>
          </View>

          <View style={styles.coursePrice}>
            <Text style={[styles.coursePriceText, isFree && styles.coursePriceFree]}>
              {priceText}
            </Text>
            {originalPriceText && (
              <Text style={styles.courseOriginalPrice}>{originalPriceText}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </View>
          
          {course.next_class_datetime && (
            <Text style={styles.nextClassText}>Next class: {course.next_class_topic}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCourse = ({ item }: { item: OnlineCoaching }) => (
    <CourseCard course={item} />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#059669" />
        <Text style={styles.loadingText}>Loading more courses...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="videocam-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading courses...' : 'No courses found'}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.emptyTitle}>Error loading courses</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredCourses}
      renderItem={renderCourse}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.coursesList}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#059669']}
          tintColor="#059669"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  coursesList: {
    padding: 16,
    paddingBottom: 120, // Account for bottom navigation
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  courseImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  courseImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  platformBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformBadgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseContent: {
    padding: 16,
    gap: 12,
  },
  courseHeader: {
    gap: 8,
  },
  courseBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6b7280',
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  coursePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coursePriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  coursePriceFree: {
    color: '#059669',
  },
  courseOriginalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  nextClassText: {
    fontSize: 12,
    color: '#3b82f6',
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
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default CoursesTab;
