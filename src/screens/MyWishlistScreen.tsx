import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchWishlist, removeFromWishlist } from '../store/slices/courseWishlistSlice';

interface MyWishlistScreenProps {
  onBack: () => void;
  onCourseSelect?: (course: any) => void;
}

const MyWishlistScreen: React.FC<MyWishlistScreenProps> = ({ onBack, onCourseSelect }) => {
  const dispatch = useAppDispatch();
  const { wishlistItems, isLoading, error } = useAppSelector(state => state.courseWishlist);
  const [refreshing, setRefreshing] = React.useState(false);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchWishlist());
    setRefreshing(false);
  };

  const handleRemoveFromWishlist = async (courseId: number, e: any) => {
    e.stopPropagation();
    try {
      await dispatch(removeFromWishlist(courseId)).unwrap();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleCoursePress = (course: any) => {
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };

  const renderWishlistItem = ({ item }: { item: any }) => {
    const course = item.course;
    
    // Get thumbnail URL
    let thumbnailUrl = course.thumbnail_url_display || course.thumbnail || course.thumbnail_url;
    if (thumbnailUrl && thumbnailUrl.startsWith('/')) {
      thumbnailUrl = `http://13.200.17.30${thumbnailUrl}`;
    }

    const priceText = course.is_free ? 'FREE' : `₹${parseFloat(course.price || '0').toLocaleString()}`;
    const originalPriceText = course.original_price ? `₹${parseFloat(course.original_price).toLocaleString()}` : null;

    return (
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => handleCoursePress(course)}
        activeOpacity={0.9}
      >
        <View style={styles.courseImageContainer}>
          {thumbnailUrl ? (
            <Image 
              source={{ uri: thumbnailUrl }} 
              style={styles.courseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.courseImagePlaceholder}>
              <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
            </View>
          )}
          
          {course.is_live && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={(e) => handleRemoveFromWishlist(course.id, e)}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.courseContent}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {course.title}
          </Text>
          
          <Text style={styles.courseInstructor}>
            by {course.instructor?.name || 'Unknown Instructor'}
          </Text>

          <View style={styles.courseStats}>
            <View style={styles.courseStat}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.courseStatText}>{course.rating || '0'}</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="people-outline" size={12} color="#6b7280" />
              <Text style={styles.courseStatText}>
                {(course.enrolled_students || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.coursePriceRow}>
            <Text style={styles.coursePrice}>{priceText}</Text>
            {originalPriceText && (
              <Text style={styles.courseOriginalPrice}>{originalPriceText}</Text>
            )}
            {course.discount_percentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{course.discount_percentage}% OFF</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Courses in Wishlist</Text>
      <Text style={styles.emptySubtitle}>
        Courses you add to your wishlist will appear here
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to Load Wishlist</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Online Wishlist Courses</Text>
          <Text style={styles.headerSubtitle}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'course' : 'courses'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : error && wishlistItems.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => `wishlist-${item.id}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#10b981']}
            />
          }
        />
      )}
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
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
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
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseContent: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  courseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  courseStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  coursePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginRight: 8,
  },
  courseOriginalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MyWishlistScreen;

