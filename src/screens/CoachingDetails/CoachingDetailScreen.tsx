import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCoachingCenterDetails, clearDetailedInfo } from '../../store/slices/coachingSlice';
import ReviewModal from './ReviewModal';

interface CoachingDetailScreenProps {
  coachingId: string;
  onBack: () => void;
  onViewBatches?: () => void;
  onViewFaculty?: () => void;
  onViewReviews?: () => void;
  onViewTeacherProfile?: (teacherId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const CoachingDetailScreen: React.FC<CoachingDetailScreenProps> = ({
  coachingId,
  onBack,
  onViewBatches,
  onViewFaculty,
  onViewReviews,
  onViewTeacherProfile,
}) => {
  const dispatch = useAppDispatch();
  const { detailedInfo, isDetailedLoading, detailedError } = useAppSelector(state => state.coaching);
  const [isStarred, setIsStarred] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (coachingId) {
      console.log('Fetching details for coaching ID:', coachingId);
      dispatch(fetchCoachingCenterDetails(coachingId));
    }
    
    return () => {
      dispatch(clearDetailedInfo());
    };
  }, [coachingId, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (coachingId) {
      await dispatch(fetchCoachingCenterDetails(coachingId));
    }
    setRefreshing(false);
  };

  const handleCallNow = () => {
    if (coachingData?.contact_number) {
      const phoneNumber = coachingData.contact_number.replace(/\s+/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Contact Not Available', 'Phone number not available for this coaching center.');
    }
  };

  const handleBookDemo = () => {
    Alert.alert(
      'Book Demo',
      `Would you like to book a demo class at ${coachingData?.branch_name || coachingData?.name || 'this coaching center'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            // Handle demo booking logic
            Alert.alert('Success', 'Demo class booking request sent!');
          }
        }
      ]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : 'star-outline'}
        size={16}
        color={i < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  // Use real data from API - handle nested structure
  const coachingData = detailedInfo?.coaching || detailedInfo;
  const batches = coachingData?.batches || [];
  const teachers = coachingData?.teachers || [];
  const reviews = coachingData?.reviews || [];
  const syllabusProgress = coachingData?.syllabus_progress || [];
  const pastResults = coachingData?.past_results || [];
  const offers = coachingData?.offers || [];

  const renderAmenityIcon = (amenityName: string) => {
    const iconMap: { [key: string]: string } = {
      'wifi': 'wifi',
      'parking': 'car',
      'cafeteria': 'restaurant',
      'library': 'library',
      'computer': 'laptop',
      'air conditioning': 'snow',
      'transport': 'bus',
      'hostel': 'bed',
      'medical': 'medical',
      'laboratory': 'flask',
    };
    
    const iconName = iconMap[amenityName.toLowerCase()] || 'checkmark-circle';
    return <Ionicons name={iconName as any} size={20} color="#3b82f6" />;
  };

  if (isDetailedLoading && !detailedInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading coaching center details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (detailedError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to Load Details</Text>
          <Text style={styles.errorText}>{detailedError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!detailedInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="search" size={48} color="#6b7280" />
          <Text style={styles.errorTitle}>Coaching Center Not Found</Text>
          <Text style={styles.errorText}>The requested coaching center could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {coachingData?.branch_name || coachingData?.name}
          </Text>
          <View style={styles.headerLocation}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={styles.headerLocationText} numberOfLines={1}>
              {coachingData?.city || coachingData?.location}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.starButton}
          onPress={() => setIsStarred(!isStarred)}
        >
          <Ionicons 
            name={isStarred ? 'star' : 'star-outline'} 
            size={24} 
            color={isStarred ? '#fbbf24' : '#6b7280'} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Image Gallery */}
        {coachingData?.images && coachingData.images.length > 0 ? (
          <View style={styles.gallerySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
              contentContainerStyle={styles.galleryContent}
            >
              {coachingData.images.map((imageObj: any, index: number) => (
                <TouchableOpacity
                  key={imageObj.id || index}
                  style={styles.galleryItem}
                  onPress={() => setActiveGalleryIndex(index)}
                >
                  <Image
                    source={{ 
                      uri: imageObj.image,
                      headers: {
                        'Accept': 'image/*',
                      }
                    }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image load error:', error.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                    }}
                    defaultSource={require('../../../assets/icon.png')}
                  />
                  {imageObj.image_type === 'infra' && index === 0 && (
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={24} color="#ffffff" />
                    </View>
                  )}
                  {imageObj.caption && (
                    <View style={styles.imageCaption}>
                      <Text style={styles.captionText}>{imageObj.caption}</Text>
                    </View>
                  )}
                  <View style={styles.imageCounter}>
                    <Text style={styles.counterText}>{index + 1}/{coachingData.images.length}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.gallerySection}>
            <View style={styles.noImagesContainer}>
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text style={styles.noImagesText}>No images available</Text>
            </View>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.basicInfoSection}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(coachingData?.average_rating || 0)}
              </View>
              <Text style={styles.ratingText}>
                {coachingData?.average_rating?.toFixed(1) || '0.0'} ({coachingData?.total_reviews || 0})
              </Text>
            </View>
            <View style={styles.establishedBadge}>
              <Text style={styles.establishedText}>Est. 2015</Text>
            </View>
          </View>
          <Text style={styles.distanceText}>2.3 km away</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>
            {coachingData?.description || 'No description available.'}
          </Text>
        </View>


        {/* Fees Section */}
        {coachingData?.fees_display && (
          <View style={styles.feesSection}>
            <Text style={styles.sectionTitle}>Fees</Text>
            <View style={styles.feesCard}>
              <View style={styles.feesHeader}>
                <Ionicons name="cash" size={24} color="#10b981" />
                <Text style={styles.feesLabel}>Course Fee</Text>
              </View>
              <Text style={styles.feesText}>{coachingData.fees_display}</Text>
              <View style={styles.feesDetails}>
                <View style={styles.feesDetailItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.feesDetailText}>All study materials included</Text>
                </View>
                <View style={styles.feesDetailItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.feesDetailText}>Mock tests & assessments</Text>
                </View>
                <View style={styles.feesDetailItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.feesDetailText}>Doubt clearing sessions</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.feesButton}>
                <Text style={styles.feesButtonText}>View Fee Structure</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Amenities Section */}
        {coachingData?.amenities && coachingData.amenities.length > 0 && (
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {coachingData.amenities.map((amenity: any, index: number) => {
                const amenityName = typeof amenity === 'string' ? amenity : amenity?.name || amenity;
                return (
                  <View key={index} style={styles.amenityItem}>
                    <View style={styles.amenityIconContainer}>
                      {renderAmenityIcon(amenityName)}
                    </View>
                    <Text style={styles.amenityText}>{amenityName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Offers Section */}
        {coachingData?.offers && coachingData.offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>Current Offers</Text>
            <View style={styles.offersList}>
              {coachingData.offers.map((offer: any, index: number) => (
                <View key={index} style={styles.offerItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.offerText}>{offer.title || offer.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Batches Section */}
        {batches.length > 0 && (
          <View style={styles.batchesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Batches</Text>
              <TouchableOpacity onPress={onViewBatches}>
                <Text style={styles.viewAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.batchesList}>
              {batches.slice(0, 2).map((batch: any, index: number) => (
                <View key={index} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <Text style={styles.batchName}>{batch.name || `Batch ${index + 1}`}</Text>
                    <View style={[styles.seatsBadge, batch.available_seats <= 5 ? styles.seatsBadgeLow : styles.seatsBadgeNormal]}>
                      <Text style={styles.seatsText}>{batch.available_seats || 0} seats left</Text>
                    </View>
                  </View>
                  
                  <View style={styles.batchInfo}>
                    <View style={styles.batchInfoItem}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.batchInfoText}>
                        {batch.start_time ? `${batch.start_time} - ${batch.end_time}` : 'Timing not specified'}
                      </Text>
                    </View>
                    <View style={styles.batchInfoItem}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.batchInfoText}>
                        {batch.duration_months ? `${batch.duration_months} months` : 'Duration not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.batchFooter}>
                    <View style={styles.batchPrice}>
                      <Ionicons name="cash" size={16} color="#3b82f6" />
                      <Text style={styles.priceText}>
                        {batch.fees ? `₹${batch.fees.toLocaleString()}` : 'Discuss over call'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.enrollButton}>
                      <Text style={styles.enrollButtonText}>
                        {batch.fees ? 'Enroll Now' : 'Call Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teachers Section */}
        {teachers.length > 0 && (
          <View style={styles.teachersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Faculty</Text>
              <TouchableOpacity onPress={onViewFaculty}>
                <Text style={styles.viewAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.teachersList}>
              {teachers.slice(0, 2).map((teacher: any, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.teacherCard}
                  onPress={() => onViewTeacherProfile?.(teacher.id)}
                >
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherInitial}>
                      {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                    </Text>
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.name || 'Teacher'}</Text>
                    <Text style={styles.teacherSubject}>{teacher.subject || 'Subject not specified'} • {teacher.experience || 'Experience not specified'}</Text>
                    <View style={styles.teacherRating}>
                      <View style={styles.teacherStars}>
                        {renderStars(teacher.rating || 4.5)}
                      </View>
                      <Text style={styles.teacherRatingText}>{teacher.rating || 4.5}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Past Results Section */}
        {pastResults.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Past Results</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.resultsScroll}
            >
              {pastResults.map((result: any, index: number) => (
                <View key={index} style={styles.resultCard}>
                  <Text style={styles.resultYear}>{result.year || 'N/A'}</Text>
                  <Text style={styles.resultCount}>{result.count || 0}</Text>
                  <Text style={styles.resultLabel}>Students</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Offers Section */}
        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
            </View>
            {offers.map((offer: any, index: number) => (
              <View key={index} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title || 'Special Offer'}</Text>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>Limited Time</Text>
                  </View>
                </View>
                <Text style={styles.offerDescription}>
                  {offer.description || 'No description available'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.addReviewButton}>
                  <Text style={styles.addReviewText}>Add Review</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAllReviews(true)}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.reviewsList}>
              {reviews.slice(0, 2).map((review: any, index: number) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.user_name}</Text>
                      <View style={styles.reviewStars}>
                        {renderStars(review.overall_rating)}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookDemoButton} onPress={handleBookDemo}>
          <Text style={styles.bookDemoText}>Book Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callNowButton} onPress={handleCallNow}>
          <Ionicons name="call" size={20} color="#ffffff" />
          <Text style={styles.callNowText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Reviews Modal */}
      <ReviewModal
        visible={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        reviews={reviews}
        averageRating={coachingData?.average_rating || 0}
        coachingData={coachingData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLocationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  starButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  gallerySection: {
    marginBottom: 20,
  },
  galleryScroll: {
    paddingHorizontal: 16,
  },
  galleryContent: {
    paddingRight: 16,
  },
  galleryItem: {
    marginRight: 12,
    position: 'relative',
  },
  galleryImage: {
    width: screenWidth - 32,
    height: 200,
    borderRadius: 12,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  noImagesContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  noImagesText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  basicInfoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  establishedBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  establishedText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  descriptionSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  reviewsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 140,
  },
  // New section styles
  feesSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  feesCard: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  feesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginLeft: 8,
  },
  feesText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 16,
  },
  feesDetails: {
    marginBottom: 20,
  },
  feesDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feesDetailText: {
    fontSize: 14,
    color: '#065f46',
    marginLeft: 8,
    fontWeight: '500',
  },
  feesButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  feesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  amenitiesSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 0,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  amenityIconContainer: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  batchesSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  batchCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  batchTiming: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  batchDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  teachersSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  teacherSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  teacherExperience: {
    fontSize: 12,
    color: '#9ca3af',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsScroll: {
    paddingRight: 16,
  },
  resultCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  resultYear: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  resultLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  offersSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    flex: 1,
  },
  offerBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerBadgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  offerDescription: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
  },
  // New styles for updated design
  offersList: {
    gap: 8,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  offerText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  batchesList: {
    gap: 12,
  },
  seatsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seatsBadgeLow: {
    backgroundColor: '#fef2f2',
  },
  seatsBadgeNormal: {
    backgroundColor: '#f3f4f6',
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  batchInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  batchInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batchInfoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  enrollButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enrollButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  teachersList: {
    gap: 12,
  },
  teacherRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teacherStars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  teacherRatingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addReviewButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addReviewText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 16,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewContent: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  bookDemoButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookDemoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  callNowButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  callNowText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});

export default CoachingDetailScreen;
