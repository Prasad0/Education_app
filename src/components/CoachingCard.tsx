import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CoachingCenter } from '../store/slices/coachingSlice';

interface CoachingCardProps {
  center: CoachingCenter;
  onBookDemo: (center: CoachingCenter) => void;
  onCallNow: (center: CoachingCenter) => void;
  onToggleStar: (centerId: string) => void;
  onViewDetails?: (center: CoachingCenter) => void;
  isStarred: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const CoachingCard: React.FC<CoachingCardProps> = ({
  center,
  onBookDemo,
  onCallNow,
  onToggleStar,
  onViewDetails,
  isStarred,
}) => {
  // State to track failed images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<string, boolean>>(new Map());
  
  // Filter out invalid images and failed images
  const validImages = React.useMemo(() => {
    try {
      // Debug: Log the center data for debugging
      console.log(`🖼️ [CoachingCard] Processing images for center:`, {
        id: center.id,
        name: center.name,
        gallery_images: center.gallery_images,
        gallery_images_length: center.gallery_images?.length,
        first_gallery_image: center.gallery_images?.[0],
        center_keys: Object.keys(center)
      });
      
      // Use only gallery_images, no validation
      const images = center.gallery_images || [];
      console.log(`🔍 [CoachingCard] Raw gallery_images:`, images);
      
      if (!Array.isArray(images)) {
        console.log(`❌ [CoachingCard] Gallery images is not an array:`, images);
        return [];
      }
      
      // Simple filter - only check for null/undefined and failed images
      const safeImages = images.filter((img, index) => {
        const isValid = img !== null && img !== undefined && !failedImages.has(img);
        if (index < 3) { // Log first 3 images for debugging
          console.log(`🔍 [CoachingCard] Processing image ${index}:`, {
            img,
            isValid
          });
        }
        return isValid;
      });
      
      console.log(`✅ [CoachingCard] Final valid images count:`, safeImages.length);
      console.log(`✅ [CoachingCard] Final valid images:`, safeImages);
      return safeImages;
    } catch (error) {
      console.log(`❌ [CoachingCard] Error in validImages useMemo:`, error);
      return [];
    }
  }, [center.gallery_images, failedImages, center.id, center.name]);
  
  const handleImageError = (imageUrl: string) => {
    try {
      setFailedImages(prev => new Set(prev).add(imageUrl));
      setImageLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(imageUrl, false);
        return newMap;
      });
    } catch (error) {
      // Silent error handling
    }
  };

  const handleImageLoadStart = (imageUrl: string) => {
    try {
      setImageLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(imageUrl, true);
        return newMap;
      });
    } catch (error) {
      // Silent error handling
    }
  };

  const handleImageLoadEnd = (imageUrl: string) => {
    try {
      setImageLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(imageUrl, false);
        return newMap;
      });
    } catch (error) {
      // Silent error handling
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onViewDetails?.(center)}
      activeOpacity={0.9}
    >
      {/* Image Section - Scrollable */}
      <View style={styles.imageSection}>
        {(() => {
          try {
            return (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {validImages && validImages.length > 0 ? (
                  validImages.map((image, index) => {
                    try {
                      if (!image || typeof image !== 'string') {
                        return (
                          <View key={`placeholder-${index}`} style={styles.imageContainer}>
                            <View style={styles.imagePlaceholder}>
                              <Text style={styles.imagePlaceholderText}>❌</Text>
                              <Text style={styles.imagePlaceholderSubtext}>Invalid image data</Text>
                            </View>
                          </View>
                        );
                      }
                      
                      return (
                        <View key={`image-${index}-${image}`} style={styles.imageContainer}>
                          <Image 
                            source={{ uri: image }} 
                            style={styles.image}
                            resizeMode="cover"
                            onError={() => handleImageError(image)}
                            onLoadStart={() => handleImageLoadStart(image)}
                            onLoadEnd={() => handleImageLoadEnd(image)}
                          />
                          {imageLoadingStates.get(image) && (
                            <View style={styles.imageLoadingOverlay}>
                              <Text style={styles.imageLoadingText}>Loading...</Text>
                            </View>
                          )}
                        </View>
                      );
                    } catch (error) {
                      // Return placeholder for failed images
                      return (
                        <View key={`error-${index}`} style={styles.imageContainer}>
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>⚠️</Text>
                            <Text style={styles.imagePlaceholderSubtext}>Image failed to load</Text>
                          </View>
                        </View>
                      );
                    }
                  })
                ) : (
                  <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>📚</Text>
                      <Text style={styles.imagePlaceholderSubtext}>No image available</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            );
          } catch (error) {
            // Fallback to simple placeholder if entire image section fails
            return (
              <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>🚫</Text>
                  <Text style={styles.imagePlaceholderSubtext}>Images unavailable</Text>
                </View>
              </View>
            );
          }
        })()}
        
        {/* Seats Left Badge */}
        <View style={styles.seatsBadge}>
          <Text style={[
            styles.seatsText,
            (center.seatsLeft || 0) <= 5 ? styles.seatsTextWarning : styles.seatsTextNormal
          ]}>
            {center.seatsLeft || 0} seats left
          </Text>
        </View>

        {/* Star Button */}
        <TouchableOpacity
          style={styles.starButton}
          onPress={() => onToggleStar(center.id)}
        >
          <Ionicons 
            name={isStarred ? "star" : "star-outline"} 
            size={20} 
            color={isStarred ? "#fbbf24" : "#6b7280"} 
          />
        </TouchableOpacity>

        {/* Image indicators - only show if there are valid images */}
        {validImages && validImages.length > 1 && (
          <View style={styles.imageIndicators}>
            {validImages.map((_, index) => {
              try {
                return (
                  <View
                    key={`indicator-${index}`}
                    style={styles.imageIndicator}
                  />
                );
              } catch (error) {
                return null;
              }
            })}
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{center.name}</Text>
          <Text style={styles.tagline}>{center.tagline}</Text>
          <Text style={styles.className}>{center.className}</Text>
        </View>

        {/* Rating and Location */}
        <View style={styles.ratingLocation}>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>{center.rating || 0}</Text>
            <Text style={styles.reviewsText}>({center.reviews || 0})</Text>
          </View>
          <View style={styles.location}>
            <Ionicons name="location" size={16} color="#9ca3af" />
            <Text style={styles.locationText}>{center.location}</Text>
            <Text style={styles.distanceText}>• {center.distance}</Text>
          </View>
        </View>

        {/* Fees and Start Date */}
        <View style={styles.feesDate}>
          <Text style={styles.fees}>{center.fees}</Text>
          <View style={styles.startDate}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={styles.startDateText}>Starts: {center.startDate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.bookDemoButton}
            onPress={() => onBookDemo(center)}
          >
            <Ionicons name="book" size={16} color="#ffffff" />
            <Text style={styles.bookDemoText}>Book Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callNowButton}
            onPress={() => onCallNow(center)}
          >
            <Ionicons name="call" size={16} color="#3b82f6" />
            <Text style={styles.callNowText}>Call Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24, // Increased from 16 to 24 for more spacing between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  imageSection: {
    position: 'relative',
    height: 160,
  },
  imageScroll: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth - 32,
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  imagePlaceholderText: {
    fontSize: 48,
    opacity: 0.6,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  seatsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatsTextWarning: {
    color: '#dc2626',
  },
  seatsTextNormal: {
    color: '#6b7280',
  },
  starButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -20 }],
    flexDirection: 'row',
    gap: 4,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    opacity: 0.6,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
  },
  className: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  ratingLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  feesDate: {
    gap: 4,
  },
  fees: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  startDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startDateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  bookDemoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookDemoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  callNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingVertical: 12,
    borderRadius: 12,
  },
  callNowText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  imageLoadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CoachingCard;
