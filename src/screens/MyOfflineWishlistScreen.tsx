import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getOfflineFavoritesUrl } from '../config/api';
import { CoachingCenter } from '../store/slices/coachingSlice';

interface OfflineFavoriteItem {
  id: number;
  coaching: CoachingCenter;
  child_name: string | null;
  created_at: string;
}

interface OfflineFavoritesResponse {
  next: string | null;
  previous: string | null;
  count: number;
  data: OfflineFavoriteItem[];
}

interface MyOfflineWishlistScreenProps {
  onBack: () => void;
  onCoachingSelect?: (coaching: CoachingCenter) => void;
}

const MyOfflineWishlistScreen: React.FC<MyOfflineWishlistScreenProps> = ({ onBack, onCoachingSelect }) => {
  const [favorites, setFavorites] = useState<OfflineFavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  const fetchFavorites = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get<OfflineFavoritesResponse>(getOfflineFavoritesUrl(pageNum));
      
      if (response.data?.data) {
        if (pageNum === 1) {
          setFavorites(response.data.data);
        } else {
          setFavorites(prev => [...prev, ...response.data.data]);
        }
        setHasMore(!!response.data.next);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch offline favorites:', err);
      setError(err.response?.data?.message || 'Failed to load favorites');
      if (pageNum === 1) {
        setFavorites([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFavorites(1);
  }, []);

  const handleRefresh = async () => {
    setPage(1);
    await fetchFavorites(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFavorites(nextPage);
    }
  };

  const handleRemoveFromFavorites = async (coachingId: number, e: any) => {
    e.stopPropagation();
    
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this coaching center from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically remove from UI
              setFavorites(prev => prev.filter(item => item.coaching.id !== coachingId));
              
              // Call API to remove from favorites
              // Note: You might need to add the remove API endpoint
              // await api.delete(`/coachings/${coachingId}/remove_favorite/`);
              
            } catch (error) {
              console.error('Failed to remove from favorites:', error);
              // Refresh the list to restore the item
              await fetchFavorites(1);
              Alert.alert('Error', 'Failed to remove from favorites. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCoachingPress = (coaching: CoachingCenter) => {
    if (onCoachingSelect) {
      onCoachingSelect(coaching);
    }
  };

  const renderFavoriteItem = ({ item }: { item: OfflineFavoriteItem }) => {
    const coaching = item.coaching;
    
    // Get image URL
    let imageUrl = coaching.featured_image?.image || coaching.gallery_images?.[0]?.image || coaching.icon;
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `https://learn.crusheducation.in${imageUrl}`;
    }

    return (
      <TouchableOpacity 
        style={styles.coachingCard}
        onPress={() => handleCoachingPress(coaching)}
        activeOpacity={0.9}
      >
        <View style={styles.coachingImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.coachingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coachingImagePlaceholder}>
              <Ionicons name="school-outline" size={32} color="#9ca3af" />
            </View>
          )}
          
          {coaching.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ FEATURED</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={(e) => handleRemoveFromFavorites(coaching.id, e)}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.coachingContent}>
          <Text style={styles.coachingName} numberOfLines={2}>
            {coaching.branch_name}
          </Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.locationText}>
              {coaching.city}, {coaching.state}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.infoText}>{coaching.average_rating?.toFixed(1) || '0.0'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="chatbox-outline" size={14} color="#6b7280" />
              <Text style={styles.infoText}>{coaching.total_reviews || 0} reviews</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {coaching.coaching_type && (
              <View style={[styles.tag, styles.typeTag]}>
                <Text style={styles.tagText}>{coaching.coaching_type.toUpperCase()}</Text>
              </View>
            )}
            {coaching.is_verified && (
              <View style={[styles.tag, styles.verifiedTag]}>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text style={[styles.tagText, { color: '#10b981' }]}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.feesRow}>
            <Text style={styles.feesLabel}>Fees:</Text>
            <Text style={styles.feesText}>{coaching.fees_display || 'Contact for fees'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Coaching centers you favorite will appear here
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to Load Favorites</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Offline Wishlist Courses</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length} {favorites.length === 1 ? 'center' : 'centers'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : error && favorites.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => `offline-favorite-${item.id}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
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
  coachingCard: {
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
  coachingImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  coachingImage: {
    width: '100%',
    height: '100%',
  },
  coachingImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
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
  coachingContent: {
    padding: 12,
  },
  coachingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  typeTag: {
    backgroundColor: '#dbeafe',
  },
  verifiedTag: {
    backgroundColor: '#d1fae5',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  feesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feesLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  feesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default MyOfflineWishlistScreen;

