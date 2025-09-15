import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviews: any[];
  averageRating: number;
  coachingData: any;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  reviews,
  averageRating,
  coachingData,
}) => {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
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
                {averageRating?.toFixed(1) || '0.0'}
              </Text>
              <View style={styles.overallStars}>
                {renderStars(averageRating || 0)}
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
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  reviewsSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  overallStars: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  overallRatingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  fullReviewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
    marginBottom: 8,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  fullReviewContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingBreakdown: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    height: 24,
  },
  ratingLabel: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 20,
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

export default ReviewModal;
