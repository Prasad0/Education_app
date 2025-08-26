import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CoachingCenter } from '../store/slices/coachingSlice';

interface CoachingCardProps {
  center: CoachingCenter;
  onBookDemo: (center: CoachingCenter) => void;
  onCallNow: (center: CoachingCenter) => void;
  onToggleStar: (centerId: string) => void;
  isStarred: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

// Helper function to validate image URL
const isValidImageUrl = (url: string): boolean => {
  try {
    if (!url || typeof url !== 'string') return false;
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    // Check if it's a valid URL format
    try {
      const urlObj = new URL(trimmedUrl);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // If it's not a valid URL, it might be a local asset
      return trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('file:') || trimmedUrl.startsWith('/');
    }
  } catch (error) {
    console.warn('Error validating image URL:', url, error);
    return false;
  }
};

const CoachingCard: React.FC<CoachingCardProps> = ({
  center,
  onBookDemo,
  onCallNow,
  onToggleStar,
  isStarred,
}) => {
  // State to track failed images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<string, boolean>>(new Map());
  
  // Filter out invalid images and failed images
  const validImages = React.useMemo(() => {
    try {
      const images = (center.gallery_images || center.images || []);
      if (!Array.isArray(images)) {
        console.warn('Images is not an array:', images);
        return [];
      }
      
      // Additional safety check for array elements
      const safeImages = images.filter(img => {
        try {
          return img !== null && img !== undefined && isValidImageUrl(img) && !failedImages.has(img);
        } catch (error) {
          console.warn('Error filtering image:', img, error);
          return false;
        }
      });
      
      return safeImages;
    } catch (error) {
      console.error('Error processing images:', error);
      return [];
    }
  }, [center.gallery_images, center.images, failedImages]);
  
  const handleImageError = (imageUrl: string) => {
    try {
      console.warn('Image failed to load:', imageUrl);
      setFailedImages(prev => new Set(prev).add(imageUrl));
      setImageLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(imageUrl, false);
        return newMap;
      });
      
      // Show a toast or notification that the image failed to load
      // This provides better user feedback
    } catch (error) {
      console.error('Error handling image error:', error);
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
      console.error('Error handling image load start:', error);
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
      console.error('Error handling image load end:', error);
    }
  };
  
  return (
    <View style={styles.card}>
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
                        console.warn('Invalid image data at index:', index, image);
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
                      console.error('Error rendering image at index:', index, error);
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
                      <Text style={styles.imagePlaceholderSubtext}>No images available</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            );
          } catch (error) {
            console.error('Error rendering image section:', error);
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
                console.error('Error rendering image indicator:', error);
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
    </View>
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
