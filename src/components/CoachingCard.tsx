import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
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

const CoachingCard: React.FC<CoachingCardProps> = ({
  center,
  onBookDemo,
  onCallNow,
  onToggleStar,
  isStarred,
}) => {
  return (
    <View style={styles.card}>
      {/* Image Section - Scrollable */}
      <View style={styles.imageSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {center.images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📚</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Seats Left Badge */}
        <View style={styles.seatsBadge}>
          <Text style={[
            styles.seatsText,
            center.seatsLeft <= 5 ? styles.seatsTextWarning : styles.seatsTextNormal
          ]}>
            {center.seatsLeft} seats left
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

        {/* Image indicators */}
        {center.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {center.images.map((_, index) => (
              <View
                key={index}
                style={styles.imageIndicator}
              />
            ))}
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
            <Text style={styles.ratingText}>{center.rating}</Text>
            <Text style={styles.reviewsText}>({center.reviews})</Text>
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
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
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
});

export default CoachingCard;
