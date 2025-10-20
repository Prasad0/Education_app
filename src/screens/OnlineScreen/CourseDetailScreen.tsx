import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { OnlineCoaching } from './types';
import BottomNavigation from '../../components/BottomNavigation';
import { api, getCourseEnrollUrl, getEnrollmentErrorMessage } from '../../config/api';

interface CourseDetailScreenProps {
  course: OnlineCoaching;
  onBack: () => void;
  activeTab?: string;
  onTabSelect?: (tab: string) => void;
  onJoinLiveClass?: (courseId: number) => void;
}

const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({ 
  course, 
  onBack, 
  activeTab = 'online', 
  onTabSelect, 
  onJoinLiveClass 
}) => {
  const [showCouponCode, setShowCouponCode] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const videoRef = useRef<Video>(null);
  
  // Safety check for course object
  if (!course) {
    console.log('CourseDetailScreen - Course object is null or undefined');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              console.log('CourseDetailScreen - Error case back button pressed');
              onBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Course Not Found</Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>Course information is not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  
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
  
  const isPhysicsWallah = course.platform?.name === 'Physics Wallah';
  const couponCode = 'PW25EXTRA';
  const extraDiscount = '25% Extra Off';
  const primarySubject = course.subjects?.[0]?.name || 'General';
  const priceText = course.is_free ? 'FREE' : `₹${parseFloat(course.price || '0').toLocaleString()}`;
  const originalPriceText = course.original_price ? `₹${parseFloat(course.original_price).toLocaleString()}` : null;
  const discountText = course.discount_percentage > 0 ? `${course.discount_percentage}% OFF` : null;
  const levelColors = getLevelColor(course.level?.name || 'Beginner');
  
  // Get course image URL - prioritize thumbnail_url_display, fallback to thumbnail
  const courseImageUrl = course.thumbnail_url_display || course.thumbnail;
  
  // Get course video URL - prioritize video (full URL), fallback to video_url_display (relative path)
  let courseVideoUrl = course.video || course.video_url_display;
  
  // If we have a relative URL, construct the full URL
  if (courseVideoUrl && courseVideoUrl.startsWith('/')) {
    courseVideoUrl = `http://13.200.17.30${courseVideoUrl}`;
  }
  
  
  // Get course description - use description if available, fallback to short_description
  const courseDescription = course.description || course.short_description || '';
  
  // Debug logging for enrollment status
  console.log('CourseDetailScreen - Enrollment Status Debug:', {
    courseId: course.id,
    courseTitle: course.title,
    is_enrollment_open: course.is_enrollment_open,
    enrollment_status: course.enrollment_status,
    enrollment_details: course.enrollment_details,
    is_free: course.is_free
  });

  const handleCopyCoupon = () => {
    // In React Native, we'll use Alert instead of clipboard
    Alert.alert('Coupon Code', `${couponCode}\n\nCopied to clipboard!`, [
      { text: 'OK' }
    ]);
    setShowCouponCode(true);
    setTimeout(() => setShowCouponCode(false), 2000);
  };

  const handleCourseAction = async () => {
    if (course.is_live && onJoinLiveClass) {
      onJoinLiveClass(course.id);
    } else if (course.platform?.is_third_party && course.platform.name !== 'CourseHub') {
      // For third-party platforms, open external link
      const url = course.platform.website_url || 'https://physicswallah.pw';
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Could not open the link');
      });
    } else {
      // Handle enrollment for CourseHub courses
      await handleEnrollment();
    }
  };

  const handleEnrollment = async () => {
    if (isEnrolling) return; // Prevent multiple enrollment attempts
    
    setIsEnrolling(true);
    
    try {
      console.log('=== ENROLLMENT ATTEMPT DEBUG ===');
      console.log('Course ID:', course.id);
      console.log('Course title:', course.title);
      console.log('Course enrollment_status:', course.enrollment_status);
      console.log('Course is_enrollment_open:', course.is_enrollment_open);
      
      const enrollUrl = getCourseEnrollUrl(course.id);
      console.log('Enrollment URL:', enrollUrl);
      
      console.log('Making POST request to:', enrollUrl);
      const response = await api.post(enrollUrl);
      
      console.log('Enrollment successful:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Show success message
      Alert.alert(
        'Enrollment Successful! 🎉',
        `You have successfully enrolled in "${course.title}". You can now start learning!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally refresh course data or navigate back
              // You might want to update the course status here
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('=== ENROLLMENT ERROR DEBUG ===');
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      console.error('Course ID:', course.id);
      console.error('Course title:', course.title);
      console.error('Enrollment URL:', getCourseEnrollUrl(course.id));
      console.error('=== END ENROLLMENT ERROR DEBUG ===');
      
      // Use the specialized enrollment error handler
      const errorMessage = getEnrollmentErrorMessage(error);
      
      Alert.alert(
        'Enrollment Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleAddToFavorites = () => {
    Alert.alert('Added to Favorites', 'Course has been added to your favorites!');
  };

  const handleShare = () => {
    Alert.alert('Share Course', 'Share functionality will be implemented soon!');
  };

  const handleMoreOptions = () => {
    Alert.alert('More Options', 'More options menu will be implemented soon!');
  };


  const handleVideoPlay = async () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        await videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully:', courseVideoUrl);
    setIsVideoLoading(false);
  };

  const handleVideoError = (error: any) => {
    console.log('Video error:', error);
    Alert.alert('Video Error', 'Failed to load video. Please try again later.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('CourseDetailScreen - Back button pressed');
            onBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {course.title || 'Untitled Course'}
          </Text>
        </View>
        
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Course Video */}
          <View style={styles.courseImageContainer}>
            {courseVideoUrl ? (
              <Video
                ref={videoRef}
                source={{ uri: courseVideoUrl }}
                style={styles.courseVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoad={handleVideoLoad}
                onError={handleVideoError}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                }}
              />
            ) : courseImageUrl ? (
              <Image 
                source={{ uri: courseImageUrl }} 
                style={styles.courseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.courseImagePlaceholder}>
                <Ionicons name="videocam-outline" size={48} color="#9ca3af" />
              </View>
            )}
            {isVideoLoading && (
              <View style={styles.loadingOverlay}>
                <Ionicons name="hourglass-outline" size={32} color="#ffffff" />
                <Text style={styles.loadingText}>Loading video...</Text>
              </View>
            )}
            
            {courseVideoUrl && (
              <TouchableOpacity 
                style={styles.playButton}
                onPress={handleVideoPlay}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isVideoPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#111827" 
                />
              </TouchableOpacity>
            )}
            
            {course.is_live && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
              </View>
            )}
            
            {discountText && !course.is_free && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discountText}</Text>
              </View>
            )}
          </View>

          {/* Course Info */}
          <View style={styles.courseInfo}>
            <View style={styles.courseHeader}>
              <View style={styles.courseBadges}>
                <View style={[styles.levelBadge, { backgroundColor: levelColors.backgroundColor }]}>
                  <Text style={[styles.levelBadgeText, { color: levelColors.color }]}>
                    {course.level.name}
                  </Text>
                </View>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{primarySubject}</Text>
                </View>
                {course.platform && (
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformBadgeText}>{course.platform.name}</Text>
                  </View>
                )}
                {course.is_free && (
                  <View style={styles.freeBadge}>
                    <Ionicons name="gift-outline" size={12} color="#ffffff" />
                    <Text style={styles.freeBadgeText}>Free Course</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.courseTitle}>{course.title || 'Untitled Course'}</Text>
              <Text style={styles.courseInstructor}>
                by {course.instructor?.name || 'Unknown Instructor'}
                {course.platform && course.platform.name !== 'CourseHub' && (
                  <Text style={styles.platformText}> • {course.platform.name}</Text>
                )}
              </Text>
            </View>

            <View style={styles.courseStats}>
              <View style={styles.courseStat}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.courseStatText}>{course.rating || '0'}</Text>
              </View>
              <View style={styles.courseStat}>
                <Ionicons name="people-outline" size={16} color="#6b7280" />
                <Text style={styles.courseStatText}>{(course.enrolled_students || 0).toLocaleString()} students</Text>
              </View>
              <View style={styles.courseStat}>
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.courseStatText}>{course.duration_months || 0} months</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, course.is_free && styles.priceFree]}>
                {priceText}
              </Text>
              {originalPriceText && (
                <Text style={styles.originalPrice}>{originalPriceText}</Text>
              )}
              {discountText && (
                <View style={styles.discountBadgeInline}>
                  <Text style={styles.discountBadgeTextInline}>{discountText}</Text>
                </View>
              )}
            </View>
            
            {course.next_class_datetime && course.next_class_topic && (
              <Text style={styles.nextClassText}>Next class: {course.next_class_topic}</Text>
            )}

            {/* Physics Wallah Coupon Section */}
            {isPhysicsWallah && (
              <View style={styles.couponSection}>
                <View style={styles.couponHeader}>
                  <View style={styles.couponIcon}>
                    <Ionicons name="gift" size={16} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.couponTitle}>Exclusive Offer!</Text>
                    <Text style={styles.couponSubtitle}>Get {extraDiscount} with coupon code</Text>
                  </View>
                </View>
                
                <View style={styles.couponCodeContainer}>
                  <View style={styles.couponCodeInfo}>
                    <Text style={styles.couponCodeLabel}>Coupon Code</Text>
                    <Text style={styles.couponCodeText}>{couponCode}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyCoupon}
                    style={styles.copyButton}
                  >
                    <Text style={styles.copyButtonText}>
                      {showCouponCode ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.couponTerms}>
                  <Text style={styles.couponTerm}>• Valid for limited time only</Text>
                  <Text style={styles.couponTerm}>• Use this code at Physics Wallah checkout</Text>
                  <Text style={styles.couponTerm}>• Cannot be combined with other offers</Text>
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>           
              {(course.is_enrollment_open === true) ? (
                <TouchableOpacity 
                  onPress={handleCourseAction}
                  style={[
                    styles.primaryButton,
                    course.is_free && styles.primaryButtonFree,
                    isPhysicsWallah && styles.primaryButtonPhysicsWallah,
                    course.enrollment_status && styles.primaryButtonEnrolled,
                    isEnrolling && styles.primaryButtonDisabled
                  ]}
                  activeOpacity={0.8}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons 
                      name={
                        course.enrollment_status 
                          ? "checkmark-circle" 
                          : course.is_live 
                            ? "videocam" 
                            : "play"
                      } 
                      size={20} 
                      color="#ffffff" 
                    />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {isEnrolling 
                      ? 'Enrolling...'
                      : course.enrollment_status 
                        ? 'Continue Learning'
                        : course.is_live 
                          ? 'Join Live Class' 
                          : course.is_free 
                            ? 'Start Free Course'
                            : course.platform?.is_third_party && course.platform.name !== 'CourseHub'
                              ? `Visit ${course.platform.name}`
                              : 'Enroll Now'
                    }
                  </Text>
                </TouchableOpacity>
              ) : (
                <View 
                  style={[
                    styles.primaryButton,
                    styles.primaryButtonDisabled,
                    course.is_free && styles.primaryButtonFree,
                    isPhysicsWallah && styles.primaryButtonPhysicsWallah,
                    course.enrollment_status && styles.primaryButtonEnrolled
                  ]}
                >
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                  <Text style={[styles.primaryButtonText, styles.primaryButtonTextDisabled]}>
                    Enrollment Closed
                  </Text>
                </View>
              )}
              
              {isPhysicsWallah && (
                <TouchableOpacity 
                  onPress={handleCopyCoupon}
                  style={styles.secondaryButton}
                >
                  <Ionicons name="gift" size={20} color="#ea580c" />
                  <Text style={styles.secondaryButtonText}>
                    {showCouponCode ? 'Coupon Copied!' : 'Copy Coupon & Visit'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={handleAddToFavorites} style={styles.favoriteButton}>
                <Ionicons 
                  name={course.is_bookmarked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={course.is_bookmarked ? "#ef4444" : "#6b7280"} 
                />
                <Text style={[
                  styles.favoriteButtonText,
                  course.is_bookmarked && styles.favoriteButtonTextActive
                ]}>
                  {course.is_bookmarked ? 'Remove from Favorites' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Course Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this course</Text>
              <Text style={styles.descriptionText}>
                {courseDescription || (
                  isPhysicsWallah ? (
                    `Comprehensive ${primarySubject} course by renowned educator ${course.instructor?.name || 'expert instructor'} from Physics Wallah. This course is specifically designed for ${(course.level?.name || 'beginner').toLowerCase()} level students preparing for competitive exams. Physics Wallah is known for its high-quality content and affordable education for all students.`
                  ) : course.is_free ? (
                    `Free ${primarySubject} course from ${course.platform?.name || 'leading educators'}. Perfect for ${(course.level?.name || 'beginner').toLowerCase()} level students to build strong fundamentals. Access high-quality educational content at no cost.`
                  ) : (
                    `Comprehensive ${primarySubject} course designed for ${(course.level?.name || 'beginner').toLowerCase()} level students. This course covers all important topics with detailed explanations, practice problems, and regular assessments.`
                  )
                )}
              </Text>
              
              {isPhysicsWallah && (
                <View style={styles.physicsWallahInfo}>
                  <Text style={styles.physicsWallahTitle}>Why Physics Wallah?</Text>
                  <View style={styles.physicsWallahList}>
                    <Text style={styles.physicsWallahItem}>• India's most affordable and accessible education platform</Text>
                    <Text style={styles.physicsWallahItem}>• Over 10 million students trust Physics Wallah</Text>
                    <Text style={styles.physicsWallahItem}>• Expert faculty with proven track record</Text>
                    <Text style={styles.physicsWallahItem}>• Comprehensive study materials included</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Course Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>What you'll get</Text>
              <View style={styles.featuresList}>
                {(course.features && course.features.length > 0 ? course.features : (
                  isPhysicsWallah ? [
                    'HD quality video lectures',
                    'DPPs (Daily Practice Problems)',
                    'Previous year questions',
                    'Comprehensive notes & assignments',
                    'Doubt resolution support',
                    'Mobile app access',
                    'Test series included',
                    'Lifetime access to content'
                  ] : course.is_free ? [
                    'Free video lectures',
                    'Basic study materials',
                    'Self-paced learning',
                    'Community support',
                    'Certificate of completion'
                  ] : [
                    'Live interactive classes',
                    'Recorded video lectures',
                    'Study materials & notes',
                    'Regular tests & assessments',
                    'Doubt clearing sessions',
                    'Mobile app access'
                  ]
                )).map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[
                      styles.featureDot,
                      { backgroundColor: isPhysicsWallah ? '#ea580c' : '#059669' }
                    ]} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Course Reviews */}
            {course.reviews && course.reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>Student Reviews</Text>
                <View style={styles.reviewsList}>
                  {course.reviews.slice(0, 3).map((review, index) => (
                    <View key={index} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons 
                              key={i} 
                              name={i < review.rating ? "star" : "star-outline"} 
                              size={16} 
                              color="#fbbf24" 
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewTitle}>{review.title}</Text>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                      <Text style={styles.reviewAuthor}>
                        {review.user || 'Anonymous Student'}
                        {review.is_verified_purchase && (
                          <Text style={styles.verifiedBadge}> • Verified Purchase</Text>
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {onTabSelect && (
        <BottomNavigation 
          activeTab={activeTab as 'offline' | 'online' | 'private' | 'chat' | 'profile'} 
          onTabPress={onTabSelect} 
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 80,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  courseImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseVideo: {
    width: '100%',
    height: '100%',
  },
  courseImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseInfo: {
    padding: 16,
  },
  courseHeader: {
    marginBottom: 16,
  },
  courseBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  platformBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#059669',
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  courseInstructor: {
    fontSize: 16,
    color: '#6b7280',
  },
  platformText: {
    color: '#3b82f6',
  },
  courseStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  priceFree: {
    color: '#059669',
  },
  originalPrice: {
    fontSize: 20,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  discountBadgeInline: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeTextInline: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  nextClassText: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 16,
  },
  couponSection: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  couponIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#ea580c',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9a3412',
  },
  couponSubtitle: {
    fontSize: 14,
    color: '#c2410c',
  },
  couponCodeContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponCodeInfo: {
    flex: 1,
  },
  couponCodeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  couponCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
    fontFamily: 'monospace',
  },
  copyButton: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '500',
  },
  couponTerms: {
    gap: 4,
  },
  couponTerm: {
    fontSize: 12,
    color: '#ea580c',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonFree: {
    backgroundColor: '#059669',
  },
  primaryButtonPhysicsWallah: {
    backgroundColor: '#ea580c',
  },
  primaryButtonEnrolled: {
    backgroundColor: '#059669',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: '#ffffff',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  favoriteButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  favoriteButtonTextActive: {
    color: '#ef4444',
  },
  descriptionSection: {
    marginBottom: 24,
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
  physicsWallahInfo: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  physicsWallahTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9a3412',
    marginBottom: 8,
  },
  physicsWallahList: {
    gap: 4,
  },
  physicsWallahItem: {
    fontSize: 14,
    color: '#c2410c',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewComment: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  verifiedBadge: {
    color: '#059669',
    fontWeight: '500',
  },
});

export default CourseDetailScreen;

