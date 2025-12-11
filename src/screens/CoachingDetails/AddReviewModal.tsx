import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import api from '../../config/api';

interface AddReviewModalProps {
  visible: boolean;
  onClose: () => void;
  coachingId: string;
  onReviewAdded: () => void;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({
  visible,
  onClose,
  coachingId,
  onReviewAdded,
}) => {
  const { profile, user, selectedChildId } = useAppSelector(state => state.auth);
  const actualProfile = user || profile;

  const [overallRating, setOverallRating] = useState(0);
  const [teachingQuality, setTeachingQuality] = useState(0);
  const [infrastructure, setInfrastructure] = useState(0);
  const [studyMaterial, setStudyMaterial] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setOverallRating(0);
    setTeachingQuality(0);
    setInfrastructure(0);
    setStudyMaterial(0);
    setTitle('');
    setContent('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (overallRating === 0) {
      Alert.alert('Required', 'Please provide an overall rating');
      return;
    }
    if (teachingQuality === 0) {
      Alert.alert('Required', 'Please rate the teaching quality');
      return;
    }
    if (infrastructure === 0) {
      Alert.alert('Required', 'Please rate the infrastructure');
      return;
    }
    if (studyMaterial === 0) {
      Alert.alert('Required', 'Please rate the study material');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please provide a review title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Required', 'Please write your review');
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData: any = {
        overall_rating: overallRating,
        teaching_quality: teachingQuality,
        infrastructure: infrastructure,
        study_material: studyMaterial,
        title: title.trim(),
        content: content.trim(),
      };

      // Add child ID for parents
      if (actualProfile?.user_type === 'parent' && selectedChildId) {
        reviewData.child = selectedChildId;
      }

      const response = await api.post(`/coachings/${coachingId}/add_review/`, reviewData);

      if (response.data?.data?.success) {
        Alert.alert(
          'Success',
          'Your review has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onClose();
                onReviewAdded();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, onRate: (rating: number) => void, label: string) => (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#fbbf24' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Review</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            {renderStarRating(overallRating, setOverallRating, '')}
          </View>

          {/* Teaching Quality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Quality *</Text>
            {renderStarRating(teachingQuality, setTeachingQuality, '')}
          </View>

          {/* Infrastructure */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Infrastructure *</Text>
            {renderStarRating(infrastructure, setInfrastructure, '')}
          </View>

          {/* Study Material */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Material *</Text>
            {renderStarRating(studyMaterial, setStudyMaterial, '')}
          </View>

          {/* Review Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Excellent coaching center"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Review Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your experience with this coaching center..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Your review will help other parents and students make informed decisions. Please be honest and constructive.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  ratingRow: {
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AddReviewModal;

