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
import { fetchTutorDetail, clearTutorDetail, fetchTutorAvailability, createBooking, clearBookingState, AvailabilitySlot } from '../store/slices/privateTutorsSlice';

interface PrivateTutorDetailScreenProps {
  tutorId: number;
  onBack: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const PrivateTutorDetailScreen: React.FC<PrivateTutorDetailScreenProps> = ({
  tutorId,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const { tutorDetail, tutorDetailLoading, tutorDetailError, availability, availabilityLoading, bookingLoading, bookingSuccess, bookingError } = useAppSelector(state => state.privateTutors);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    if (tutorId) {
      dispatch(fetchTutorDetail(tutorId));
    }
    
    return () => {
      dispatch(clearTutorDetail());
    };
  }, [tutorId, dispatch]);

  useEffect(() => {
    if (bookingSuccess) {
      Alert.alert(
        'Success',
        'Session has been booked successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(clearBookingState());
              setShowBookingDrawer(false);
              setSelectedSlot(null);
            },
          },
        ],
        { cancelable: false }
      );
    }
    
    if (bookingError) {
      Alert.alert(
        'Booking Failed',
        bookingError,
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(clearBookingState());
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [bookingSuccess, bookingError, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (tutorId) {
      await dispatch(fetchTutorDetail(tutorId));
    }
    setRefreshing(false);
  };

  const handleCall = () => {
    const phoneNumber = tutorDetail?.teacher?.phone_number?.replace(/\s+/g, '') || '';
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Contact Not Available', 'Phone number not available for this tutor.');
    }
  };

  const handleWhatsApp = () => {
    const whatsappNumber = tutorDetail?.whatsapp_number?.replace(/\s+/g, '') || '';
    if (whatsappNumber) {
      Linking.openURL(`https://wa.me/${whatsappNumber}`);
    } else {
      Alert.alert('Contact Not Available', 'WhatsApp number not available for this tutor.');
    }
  };

  const handleBookSession = () => {
    setShowBookingDrawer(true);
    dispatch(fetchTutorAvailability(tutorId));
  };

  const handleSlotSelect = async (slot: AvailabilitySlot) => {
    if (!slot.is_available || bookingLoading) return;
    
    setSelectedSlot(slot);
    
    Alert.alert(
      'Confirm Booking',
      `Do you want to book this session?\n\n${slot.day_display}\n${slot.time_slot_display}`,
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            setSelectedSlot(null);
          },
        },
        {
          text: 'Yes',
          onPress: () => {
            if (!tutorDetail) return;
            
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const slotDayIndex = days.indexOf(slot.day_of_week.toLowerCase());
            const today = new Date();
            const currentDay = today.getDay();
            let daysUntilSlot = (slotDayIndex - currentDay + 7) % 7;
            if (daysUntilSlot === 0) daysUntilSlot = 7;
            
            const sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() + daysUntilSlot);
            const day = String(sessionDate.getDate()).padStart(2, '0');
            const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
            const year = sessionDate.getFullYear();
            const sessionDateStr = `${day}-${month}-${year}`;
            
            const [startHour, startMin] = slot.start_time.split(':').map(Number);
            const [endHour, endMin] = slot.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationHours = (endMinutes - startMinutes) / 60;
            
            const bookingData = {
              tutor: tutorId,
              scheduled_date: sessionDateStr,
              scheduled_time: slot.start_time,
              end_time: slot.end_time,
              duration_hours: durationHours,
              notes: `Session with ${tutorDetail.teacher.name} - ${slot.day_display} ${slot.time_slot_display}`,
              is_online: true,
            };
            
            dispatch(createBooking(bookingData));
          },
        },
      ],
      { cancelable: true }
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

  // Group availability by day
  const groupedAvailability = React.useMemo(() => {
    const grouped: { [key: string]: AvailabilitySlot[] } = {};
    availability.forEach(slot => {
      if (!grouped[slot.day_display]) {
        grouped[slot.day_display] = [];
      }
      grouped[slot.day_display].push(slot);
    });
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeOrder = ['morning', 'afternoon', 'evening'];
    
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        return timeOrder.indexOf(a.time_slot) - timeOrder.indexOf(b.time_slot);
      });
    });
    
    return dayOrder
      .filter(day => grouped[day])
      .map(day => ({ day, slots: grouped[day] }));
  }, [availability]);

  if (tutorDetailLoading && !tutorDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading tutor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tutorDetailError && !tutorDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to load tutor details</Text>
          <Text style={styles.errorText}>{tutorDetailError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchTutorDetail(tutorId))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!tutorDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#6b7280" />
          <Text style={styles.errorTitle}>Tutor Not Found</Text>
          <Text style={styles.errorText}>The requested tutor could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayReviews = showAllReviews ? tutorDetail.recent_reviews : tutorDetail.recent_reviews.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tutorDetail.teacher.name}
          </Text>
          <View style={styles.headerLocation}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={styles.headerLocationText} numberOfLines={1}>
              {tutorDetail.location || tutorDetail.teacher.city}
            </Text>
          </View>
        </View>

        {tutorDetail.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        )}
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
            colors={['#059669']}
            tintColor="#059669"
          />
        }
      >
        {/* Profile Image and Basic Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {tutorDetail.profile_image ? (
              <Image
                source={{ uri: tutorDetail.profile_image }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#10b981" />
              </View>
            )}
            {tutorDetail.is_verified && (
              <View style={styles.verifiedBadgeOverlay}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.tutorName}>{tutorDetail.teacher.name}</Text>
            <Text style={styles.tutorQualification}>{tutorDetail.teacher.qualification}</Text>
            <Text style={styles.tutorSpecialization}>{tutorDetail.teacher.specialization}</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(parseFloat(tutorDetail.average_rating || '0'))}
              </View>
              <Text style={styles.ratingText}>
                {parseFloat(tutorDetail.average_rating || '0').toFixed(1)} ({tutorDetail.total_reviews} reviews)
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.metaText}>{tutorDetail.teacher.experience_display} experience</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#6b7280" />
                <Text style={styles.metaText}>{tutorDetail.total_sessions_completed}+ sessions</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Hourly Rate</Text>
              <Text style={styles.priceText}>{tutorDetail.hourly_rate_display}/hr</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBookSession}>
            <Ionicons name="calendar-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Book Session</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.secondaryActionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color="#3b82f6" />
            <Text style={styles.secondaryButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, styles.whatsappButton]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={[styles.secondaryButtonText, styles.whatsappButtonText]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Wall Images Gallery */}
        {tutorDetail.wall_images && tutorDetail.wall_images.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
              contentContainerStyle={styles.galleryContent}
              pagingEnabled
            >
              {tutorDetail.wall_images.map((image, index) => (
                <View key={image.id} style={styles.galleryItem}>
                  <Image
                    source={{ uri: image.image }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  {image.caption && (
                    <View style={styles.imageCaption}>
                      <Text style={styles.captionText}>{image.caption}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* About Section */}
        {(tutorDetail.teacher.bio || tutorDetail.teaching_experience_details || tutorDetail.achievements) && (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            {tutorDetail.teacher.bio && (
              <Text style={styles.aboutText}>{tutorDetail.teacher.bio}</Text>
            )}
            {tutorDetail.teaching_experience_details && (
              <View style={styles.experienceBox}>
                <Text style={styles.experienceTitle}>Teaching Experience</Text>
                <Text style={styles.experienceText}>{tutorDetail.teaching_experience_details}</Text>
              </View>
            )}
            {tutorDetail.achievements && (
              <View style={styles.achievementsBox}>
                <Text style={styles.achievementsTitle}>Achievements</Text>
                <Text style={styles.achievementsText}>{tutorDetail.achievements}</Text>
              </View>
            )}
          </View>
        )}

        {/* Teaching Styles */}
        {tutorDetail.teaching_styles && tutorDetail.teaching_styles.length > 0 && (
          <View style={styles.stylesSection}>
            <Text style={styles.sectionTitle}>Teaching Styles</Text>
            <View style={styles.chipsContainer}>
              {tutorDetail.teaching_styles.map((style) => (
                <View key={style.id} style={styles.styleChip}>
                  <Text style={styles.styleChipText}>{style.name}</Text>
                  {style.description && (
                    <Text style={styles.styleChipDescription}>{style.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {tutorDetail.languages && tutorDetail.languages.length > 0 && (
          <View style={styles.languagesSection}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipsContainer}>
              {tutorDetail.languages.map((lang) => (
                <View key={lang.id} style={styles.languageChip}>
                  <Text style={styles.languageChipText}>{lang.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Target Exams */}
        {tutorDetail.target_exams && tutorDetail.target_exams.length > 0 && (
          <View style={styles.examsSection}>
            <Text style={styles.sectionTitle}>Target Exams</Text>
            <View style={styles.chipsContainer}>
              {tutorDetail.target_exams.map((exam) => (
                <View key={exam.id} style={styles.examChip}>
                  <Text style={styles.examChipText}>{exam.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#059669" />
              <Text style={styles.contactText}>{tutorDetail.teacher.phone_number}</Text>
            </View>
            {tutorDetail.whatsapp_number && (
              <View style={styles.contactItem}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.contactText}>{tutorDetail.whatsapp_number}</Text>
              </View>
            )}
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#059669" />
              <Text style={styles.contactText}>{tutorDetail.teacher.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#059669" />
              <Text style={styles.contactText}>
                {tutorDetail.teacher.address}, {tutorDetail.teacher.city}, {tutorDetail.teacher.state}
              </Text>
            </View>
            {tutorDetail.distance_from_user && (
              <View style={styles.contactItem}>
                <Ionicons name="navigate-outline" size={20} color="#059669" />
                <Text style={styles.contactText}>{tutorDetail.distance_from_user} away</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reviews Section */}
        {tutorDetail.recent_reviews && tutorDetail.recent_reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({tutorDetail.total_reviews})</Text>
              {tutorDetail.recent_reviews.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                  <Text style={styles.showMoreText}>
                    {showAllReviews ? 'Show Less' : `Show All (${tutorDetail.recent_reviews.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {review.student_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewStudentName}>{review.student_name}</Text>
                      <Text style={styles.reviewSubject}>{review.booking_subject}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <View style={styles.reviewMetrics}>
                  <View style={styles.reviewMetric}>
                    <Text style={styles.reviewMetricLabel}>Teaching</Text>
                    <Text style={styles.reviewMetricValue}>{review.teaching_quality}/5</Text>
                  </View>
                  <View style={styles.reviewMetric}>
                    <Text style={styles.reviewMetricLabel}>Communication</Text>
                    <Text style={styles.reviewMetricValue}>{review.communication}/5</Text>
                  </View>
                  <View style={styles.reviewMetric}>
                    <Text style={styles.reviewMetricLabel}>Punctuality</Text>
                    <Text style={styles.reviewMetricValue}>{review.punctuality}/5</Text>
                  </View>
                  <View style={styles.reviewMetric}>
                    <Text style={styles.reviewMetricLabel}>Knowledge</Text>
                    <Text style={styles.reviewMetricValue}>{review.subject_knowledge}/5</Text>
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.created_at}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Booking Drawer */}
      <Modal
        visible={showBookingDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBookingDrawer(false);
          setSelectedSlot(null);
        }}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Book Session</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBookingDrawer(false);
                  setSelectedSlot(null);
                }}
                style={styles.drawerCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerContent}>
              {availabilityLoading && (
                <View style={styles.drawerLoading}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.drawerLoadingText}>Loading availability...</Text>
                </View>
              )}

              {!availabilityLoading && groupedAvailability.length === 0 && (
                <View style={styles.drawerEmpty}>
                  <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                  <Text style={styles.drawerEmptyText}>No availability slots found</Text>
                </View>
              )}

              {!availabilityLoading && groupedAvailability.map(({ day, slots }) => (
                <View key={day} style={styles.dayGroup}>
                  <Text style={styles.dayGroupTitle}>{day}</Text>
                  <View style={styles.slotsContainer}>
                    {slots.map((slot) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotButton,
                          !slot.is_available && styles.slotButtonDisabled,
                          selectedSlot?.id === slot.id && styles.slotButtonSelected,
                        ]}
                        onPress={() => handleSlotSelect(slot)}
                        disabled={!slot.is_available || bookingLoading}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            !slot.is_available && styles.slotTextDisabled,
                            selectedSlot?.id === slot.id && styles.slotTextSelected,
                          ]}
                        >
                          {slot.time_slot_display}
                        </Text>
                        {!slot.is_available && (
                          <Text style={styles.slotUnavailableText}>Unavailable</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            {bookingLoading && (
              <View style={styles.bookingLoading}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.bookingLoadingText}>Creating booking...</Text>
              </View>
            )}
          </View>
        </View>
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
    paddingTop: 50,
    paddingBottom: 12,
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
    marginTop: 4,
  },
  headerLocationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  verifiedBadge: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  tutorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tutorQualification: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  tutorSpecialization: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappButton: {
    borderColor: '#25D366',
  },
  whatsappButtonText: {
    color: '#25D366',
  },
  gallerySection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  galleryScroll: {
    marginTop: 8,
  },
  galleryContent: {
    paddingHorizontal: 16,
  },
  galleryItem: {
    width: screenWidth - 32,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: 200,
  },
  imageCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 12,
  },
  aboutSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  experienceBox: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  experienceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  experienceText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  achievementsBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  achievementsText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  stylesSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  languagesSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  examsSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  styleChip: {
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
    flex: 1,
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3730a3',
    marginBottom: 4,
  },
  styleChipDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  languageChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  examChip: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  examChipText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  contactSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reviewsSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  showMoreText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  reviewStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewSubject: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  reviewMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewMetricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  drawerCloseButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  drawerLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  drawerLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  drawerEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  drawerEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  dayGroup: {
    marginBottom: 24,
  },
  dayGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: '45%',
  },
  slotButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  slotButtonSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  slotTextDisabled: {
    color: '#9ca3af',
  },
  slotTextSelected: {
    color: '#ffffff',
  },
  slotUnavailableText: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 4,
  },
  bookingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  bookingLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default PrivateTutorDetailScreen;

