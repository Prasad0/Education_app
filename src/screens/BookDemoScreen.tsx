import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import api from '../config/api';

interface BookDemoScreenProps {
  coachingId: string;
  onBack: () => void;
}

interface DemoSlot {
  id: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  total_seats: number;
  seats_left: number;
  teacher: number;
  teacher_name: string;
  subject: number;
  subject_name: string;
}

interface BookingData {
  slot_id: number;
  student_name: string;
  parent_name: string;
  phone: string;
  email: string;
  notes: string;
  child?: number;
}

const BookDemoScreen: React.FC<BookDemoScreenProps> = ({ coachingId, onBack }) => {
  const { profile, user, selectedChildId } = useAppSelector(state => state.auth);
  const actualProfile = user || profile;

  const [step, setStep] = useState<'selection' | 'details' | 'confirmation'>('selection');
  const [slots, setSlots] = useState<DemoSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DemoSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<any>(null);

  const [formData, setFormData] = useState<BookingData>({
    slot_id: 0,
    student_name: '',
    parent_name: '',
    phone: actualProfile?.phone || '',
    email: actualProfile?.email || '',
    notes: '',
  });

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  // Pre-fill form data based on user type
  useEffect(() => {
    if (actualProfile) {
      if (actualProfile.user_type === 'student') {
        setFormData(prev => ({
          ...prev,
          student_name: actualProfile.name || '',
          phone: actualProfile.phone || '',
          email: actualProfile.email || '',
        }));
      } else if (actualProfile.user_type === 'parent') {
        const selectedChild = actualProfile.children?.find(
          (child: any) => child.id === selectedChildId
        );
        setFormData(prev => ({
          ...prev,
          parent_name: actualProfile.name || '',
          student_name: selectedChild?.name || '',
          phone: actualProfile.phone || '',
          email: actualProfile.email || '',
          child: selectedChildId || undefined,
        }));
      }
    }
  }, [actualProfile, selectedChildId]);

  // Fetch demo slots
  useEffect(() => {
    fetchDemoSlots();
  }, [coachingId]);

  const fetchDemoSlots = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/coachings/${coachingId}/demo-slots/`);
      
      if (response.data?.data?.success && response.data?.data?.results) {
        setSlots(response.data.data.results);
      } else {
        Alert.alert('Error', 'No demo slots available at the moment.');
      }
    } catch (error: any) {
      console.error('Error fetching demo slots:', error);
      Alert.alert('Error', 'Failed to load demo slots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: DemoSlot) => {
    if (slot.seats_left > 0) {
      setSelectedSlot(slot);
      setFormData(prev => ({ ...prev, slot_id: slot.id }));
      setStep('details');
    }
  };

  const handleBookDemo = async () => {
    // Validation
    if (!formData.student_name || !formData.phone) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (actualProfile?.user_type === 'parent' && !formData.parent_name) {
      Alert.alert('Validation Error', 'Please enter parent name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post(`/coachings/${coachingId}/book-demo/`, formData);
      
      if (response.data?.data?.success) {
        setBookingResponse(response.data.data.booking);
        setStep('confirmation');
      } else {
        Alert.alert('Error', 'Failed to book demo. Please try again.');
      }
    } catch (error: any) {
      console.error('Error booking demo:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book demo. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation Screen
  if (step === 'confirmation' && bookingResponse) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Booked</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>
            
            <Text style={styles.successTitle}>Demo Class Booked Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your demo class has been confirmed. We'll send you a confirmation message shortly.
            </Text>

            {/* Booking Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Booking Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subject:</Text>
                <Text style={styles.detailValue}>{bookingResponse.slot.subject_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Teacher:</Text>
                <Text style={styles.detailValue}>{bookingResponse.slot.teacher_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{bookingResponse.slot.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>{bookingResponse.slot.start_time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{bookingResponse.slot.duration_minutes} minutes</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Student:</Text>
                <Text style={styles.detailValue}>{bookingResponse.student_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{bookingResponse.status}</Text>
                </View>
              </View>
            </View>

            {/* Next Steps */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What's Next?</Text>
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>You'll receive a confirmation call within 2 hours</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>Demo class link will be shared via SMS/WhatsApp</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>Arrive 5 minutes early for the best experience</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="book-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>Bring a notebook and pen for the class</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Details Form Screen
  if (step === 'details' && selectedSlot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('selection')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Details</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Selected Slot Summary */}
          <View style={styles.slotSummaryCard}>
            <View style={styles.slotIconContainer}>
              <Ionicons name="book" size={24} color="#10b981" />
            </View>
            <View style={styles.slotInfo}>
              <Text style={styles.slotSubject}>{selectedSlot.subject_name} Demo Class</Text>
              <Text style={styles.slotTeacher}>with {selectedSlot.teacher_name}</Text>
              <Text style={styles.slotDateTime}>{selectedSlot.date}, {selectedSlot.start_time}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Student Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter student's full name"
                value={formData.student_name}
                onChangeText={(text) => setFormData({ ...formData, student_name: text })}
              />
            </View>

            {actualProfile?.user_type === 'parent' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Parent Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter parent's name"
                  value={formData.parent_name}
                  onChangeText={(text) => setFormData({ ...formData, parent_name: text })}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific requirements or questions..."
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsCard}>
            <Text style={styles.termsText}>
              By booking this demo class, you agree to our Terms & Conditions.
              Demo classes are free and you can book up to 2 demo classes per coaching center.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            onPress={handleBookDemo}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Book Demo Class</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Slot Selection Screen
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Book Demo Class</Text>
          <Text style={styles.headerSubtitle}>Choose your preferred slot</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading demo slots...</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Slots Available</Text>
            <Text style={styles.emptySubtitle}>
              There are no demo slots available at the moment. Please check back later.
            </Text>
          </View>
        ) : (
          <>
            {/* Available Slots */}
            <View style={styles.slotsCard}>
              <Text style={styles.slotsTitle}>Available Demo Slots</Text>
              {slots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    slot.seats_left === 0 && styles.slotCardDisabled,
                  ]}
                  onPress={() => handleSlotSelect(slot)}
                  disabled={slot.seats_left === 0}
                >
                  <View style={styles.slotContent}>
                    <View style={styles.slotHeader}>
                      <View style={styles.slotDateTimeContainer}>
                        <View style={styles.slotDateRow}>
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          <Text style={styles.slotDate}>{slot.date}</Text>
                        </View>
                        <View style={styles.slotTimeRow}>
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text style={styles.slotTime}>{slot.start_time}</Text>
                          <Text style={styles.slotDuration}>({slot.duration_minutes} min)</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.slotTeacherRow}>
                      <Ionicons name="person-outline" size={16} color="#6b7280" />
                      <Text style={styles.slotTeacherName}>{slot.teacher_name}</Text>
                    </View>

                    <View style={styles.slotFooter}>
                      <View style={styles.subjectBadge}>
                        <Text style={styles.subjectBadgeText}>{slot.subject_name}</Text>
                      </View>
                      {slot.seats_left > 0 ? (
                        <View style={styles.seatsBadge}>
                          <Text style={styles.seatsBadgeText}>{slot.seats_left} seats left</Text>
                        </View>
                      ) : (
                        <View style={styles.fullyBookedBadge}>
                          <Text style={styles.fullyBookedText}>Fully Booked</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Card */}
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>💡 Demo Class Benefits</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Free 60-minute session with expert faculty</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Experience teaching methodology firsthand</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Get study materials and doubt resolution</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• No commitment required - explore freely</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  slotsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  slotCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  slotCardDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  slotContent: {
    gap: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slotDateTimeContainer: {
    gap: 8,
  },
  slotDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  slotDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  slotTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTeacherName: {
    fontSize: 14,
    color: '#6b7280',
  },
  slotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  subjectBadgeText: {
    fontSize: 12,
    color: '#4b5563',
  },
  seatsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  seatsBadgeText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  fullyBookedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  fullyBookedText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '500',
  },
  benefitsCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  benefitItem: {
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#1e40af',
  },
  slotSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  slotIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInfo: {
    flex: 1,
  },
  slotSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  slotTeacher: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  slotDateTime: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 100,
    paddingTop: 12,
  },
  termsCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  successContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
});

export default BookDemoScreen;

