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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCoachingCenterDetails, clearDetailedInfo } from '../store/slices/coachingSlice';

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
    } else {
      console.warn('No coaching ID provided to detail screen');
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
          onPress={() => setIsStarred(!isStarred)}
          style={styles.starButton}
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
        {/* Gallery */}
        {coachingData?.images && coachingData.images.length > 0 && (
          <View style={styles.gallerySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {coachingData.images.map((imageObj: any, index: number) => (
                <TouchableOpacity
                  key={imageObj.id || index}
                  style={[
                    styles.galleryItem,
                    index === 0 ? styles.galleryItemLarge : styles.galleryItemSmall
                  ]}
                  onPress={() => setActiveGalleryIndex(index)}
                >
                  <Image source={{ uri: imageObj.image }} style={styles.galleryImage} />
                  {index === 0 && (
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={32} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.basicInfoSection}>
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {renderStars(coachingData?.average_rating || 0)}
            </View>
            <Text style={styles.ratingText}>{coachingData?.average_rating || 0}</Text>
            <Text style={styles.reviewsText}>({coachingData?.total_reviews || 0})</Text>
            <View style={styles.establishedBadge}>
              <Text style={styles.establishedText}>Est. 2015</Text>
            </View>
          </View>
          
          {coachingData?.distance && (
            <Text style={styles.distanceText}>{coachingData.distance}</Text>
          )}
        </View>

        {/* Description */}
        {coachingData?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{coachingData.description}</Text>
          </View>
        )}

        {/* Amenities */}
        {coachingData?.amenities && coachingData.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {coachingData.amenities.map((amenity: any, index: number) => (
                <View key={index} style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    {renderAmenityIcon(amenity.name || amenity)}
                  </View>
                  <Text style={styles.amenityText}>{amenity.name || amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Offers</Text>
            <View style={styles.offersList}>
              {offers.map((offer: any, index: number) => (
                <View key={offer.id || index} style={styles.offerItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.offerText}>{offer.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Batch Details */}
        {batches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Batches</Text>
              <TouchableOpacity onPress={onViewBatches}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.batchesList}>
              {batches.slice(0, 2).map((batch: any) => (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <View style={[
                      styles.seatsBadge,
                      batch.seats_left <= 5 ? styles.seatsBadgeWarning : styles.seatsBadgeNormal
                    ]}>
                      <Text style={[
                        styles.seatsText,
                        batch.seats_left <= 5 ? styles.seatsTextWarning : styles.seatsTextNormal
                      ]}>
                        {batch.seats_left} seats left
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.batchInfo}>
                    <View style={styles.batchInfoItem}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.batchInfoText}>{batch.batch_timing}</Text>
                    </View>
                    <View style={styles.batchInfoItem}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.batchInfoText}>{batch.duration_months} months</Text>
                    </View>
                  </View>

                  <View style={styles.batchFooter}>
                    <View style={styles.batchPrice}>
                      <Text style={styles.rupeeSymbol}>₹</Text>
                      <Text style={styles.priceText}>{batch.fees?.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.enrollButton}>
                      <Text style={styles.enrollButtonText}>
                        {batch.is_admission_open ? "Enroll Now" : "Call Now"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Syllabus Progress */}
        {syllabusProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Syllabus Progress</Text>
            <View style={styles.progressList}>
              {syllabusProgress.map((subject: any) => (
                <View key={`${subject.subject_name}-${subject.standard_name}`} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressSubject}>{subject.subject_name} ({subject.standard_name})</Text>
                    <Text style={styles.progressPercentage}>{Math.round(subject.progress_percentage)}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${subject.progress_percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Past Results */}
        {pastResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Past Results</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.resultsScroll}
            >
              {pastResults.map((result: any) => (
                <View key={result.id} style={styles.resultCard}>
                  <View style={styles.resultImageContainer}>
                    <View style={styles.resultPlaceholder}>
                      <Ionicons name="trophy" size={32} color="#fbbf24" />
                    </View>
                    <View style={styles.resultOverlay}>
                      <Ionicons name="trophy" size={16} color="#fbbf24" />
                    </View>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    <Text style={styles.resultSubtitle}>
                      {result.student_name} - {result.exam_name}
                    </Text>
                    {result.rank_achieved && (
                      <Text style={styles.resultRank}>{result.rank_achieved}</Text>
                    )}
                    {result.percentage_scored && (
                      <Text style={styles.resultPercentage}>{result.percentage_scored}%</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Teacher Profiles */}
        {teachers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Faculty</Text>
              <TouchableOpacity onPress={onViewFaculty}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.teachersList}>
              {teachers.slice(0, 2).map((teacher: any) => (
                <TouchableOpacity 
                  key={teacher.id} 
                  style={styles.teacherCard}
                  onPress={() => onViewTeacherProfile?.(teacher.id)}
                >
                  <View style={styles.teacherImageContainer}>
                    {teacher.image ? (
                      <Image source={{ uri: teacher.image }} style={styles.teacherImage} />
                    ) : (
                      <View style={styles.teacherPlaceholder}>
                        <Ionicons name="person" size={24} color="#6b7280" />
                      </View>
                    )}
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherSubject}>{teacher.subject} • {teacher.experience}</Text>
                    <View style={styles.teacherRating}>
                      <View style={styles.teacherStars}>
                        {renderStars(teacher.rating || 0)}
                      </View>
                      <Text style={styles.teacherRatingText}>{teacher.rating || 0}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            <TouchableOpacity onPress={() => setShowAllReviews(true)}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.reviewsList}>
              {reviews.slice(0, 2).map((review: any) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <Text style={styles.reviewAuthorName}>{review.user_name}</Text>
                      <View style={styles.reviewStars}>
                        {renderStars(review.overall_rating)}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                  <Text style={styles.reviewComment}>{review.content}</Text>
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
        
        <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
          <Ionicons name="call" size={20} color="#3b82f6" />
          <Text style={styles.callText}>Call Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* All Reviews Modal */}
      <Modal
        visible={showAllReviews}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllReviews(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowAllReviews(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reviews</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.reviewsSummary}>
              <View style={styles.overallRating}>
                <Text style={styles.overallRatingNumber}>
                  {coachingData?.average_rating?.toFixed(1) || '0.0'}
                </Text>
                <View style={styles.overallStars}>
                  {renderStars(coachingData?.average_rating || 0)}
                </View>
                <Text style={styles.overallRatingText}>
                  Based on {reviews.length} reviews
                </Text>
              </View>
            </View>
            
            {reviews.map((review: any, index: number) => (
              <View key={review.id} style={styles.fullReviewCard}>
                <View style={styles.fullReviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.fullReviewAuthorName}>{review.user_name}</Text>
                      <View style={styles.fullReviewStars}>
                        {renderStars(review.overall_rating)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.fullReviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                <Text style={styles.fullReviewTitle}>{review.title}</Text>
                <Text style={styles.fullReviewContent}>{review.content}</Text>
                
                {/* Rating Breakdown */}
                <View style={styles.ratingBreakdown}>
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Teaching</Text>
                    <View style={styles.ratingBar}>
                      <View style={[styles.ratingFill, { width: `${(review.teaching_quality / 5) * 100}%` }]} />
                    </View>
                    <Text style={styles.ratingValue}>{review.teaching_quality}/5</Text>
                  </View>
                  
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Infrastructure</Text>
                    <View style={styles.ratingBar}>
                      <View style={[styles.ratingFill, { width: `${(review.infrastructure / 5) * 100}%` }]} />
                    </View>
                    <Text style={styles.ratingValue}>{review.infrastructure}/5</Text>
                  </View>
                  
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Study Material</Text>
                    <View style={styles.ratingBar}>
                      <View style={[styles.ratingFill, { width: `${(review.study_material / 5) * 100}%` }]} />
                    </View>
                    <Text style={styles.ratingValue}>{review.study_material}/5</Text>
                  </View>
                </View>
                
                {review.is_verified_student && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    <Text style={styles.verifiedText}>Verified Student</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  },
  headerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
    paddingTop: 16,
    paddingBottom: 24,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
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
    fontWeight: '500',
  },
  gallerySection: {
    marginBottom: 16,
  },
  galleryScroll: {
    paddingHorizontal: 16,
  },
  galleryItem: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryItemLarge: {
    width: screenWidth * 0.7,
    height: 200,
  },
  galleryItemSmall: {
    width: 120,
    height: 200,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicInfoSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  establishedBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  establishedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '45%',
  },
  amenityIcon: {
    marginRight: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
  },
  offersList: {
    gap: 8,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e40af',
  },
  examTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  examText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  feesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bottomSpacing: {
    height: 120,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookDemoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  callText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButton: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  // New styles for updated design
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  batchesList: {
    gap: 12,
  },
  batchCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  seatsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seatsBadgeNormal: {
    backgroundColor: '#f3f4f6',
  },
  seatsBadgeWarning: {
    backgroundColor: '#fef2f2',
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  seatsTextNormal: {
    color: '#6b7280',
  },
  seatsTextWarning: {
    color: '#dc2626',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  discussText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  enrollButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enrollButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressList: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  resultsScroll: {
    paddingRight: 16,
  },
  resultCard: {
    width: 128,
    marginRight: 12,
  },
  resultImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  resultImage: {
    width: '100%',
    height: 96,
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
  resultInfo: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  teachersList: {
    gap: 12,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  teacherImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  teacherImage: {
    width: '100%',
    height: '100%',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  teacherSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  teacherRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherStars: {
    flexDirection: 'row',
  },
  teacherRatingText: {
    fontSize: 14,
    color: '#111827',
  },
  reviewsList: {
    gap: 8,
  },
  reviewCard: {
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 8,
    marginBottom: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewAuthorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  reviewComment: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  reviewTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 1,
  },
  resultPlaceholder: {
    width: '100%',
    height: 96,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultRank: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fbbf24',
    textAlign: 'center',
    marginTop: 2,
  },
  resultPercentage: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 2,
  },
  teacherPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  reviewsSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallRating: {
    alignItems: 'center',
  },
  overallRatingNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  overallStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  overallRatingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  fullReviewCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fullReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  reviewerDetails: {
    flex: 1,
  },
  fullReviewAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  fullReviewStars: {
    flexDirection: 'row',
  },
  fullReviewDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  fullReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22,
  },
  fullReviewContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  ratingBreakdown: {
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 70,
  },
  ratingBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 4,
    marginRight: 4,
  },
  ratingFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 18,
    textAlign: 'right',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CoachingDetailScreen;
