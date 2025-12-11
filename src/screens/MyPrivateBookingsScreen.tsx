import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getPrivateTutorBookingsUrl } from '../config/api';

interface MyPrivateBookingsScreenProps {
  onBack: () => void;
}

interface PrivateBooking {
  id: number;
  uuid: string;
  tutor: number;
  tutor_name: string;
  student: number;
  student_name: string;
  child: number | null;
  subject: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_hours: string;
  session_type: 'online' | 'offline';
  session_location: string;
  online_meeting_link: string;
  student_message: string;
  tutor_response: string;
  hourly_rate: string;
  total_amount: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_status_display: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_status_display: string;
  session_notes: string;
  homework_assigned: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
}

const MyPrivateBookingsScreen: React.FC<MyPrivateBookingsScreenProps> = ({ onBack }) => {
  const [bookings, setBookings] = useState<PrivateBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      const response = await api.get(getPrivateTutorBookingsUrl());
      
      if (response.data) {
        setBookings(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch private tutor bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchBookings(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      case 'pending':
      default:
        return '#f59e0b';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#10b981';
      case 'refunded':
        return '#6b7280';
      case 'pending':
      default:
        return '#f59e0b';
    }
  };

  const renderBookingCard = (booking: PrivateBooking) => {
    return (
      <View key={booking.id} style={styles.bookingCard}>
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.tutorInfo}>
            <View style={styles.tutorAvatar}>
              <Ionicons name="person" size={24} color="#6b7280" />
            </View>
            <View style={styles.tutorDetails}>
              <Text style={styles.tutorName}>{booking.tutor_name}</Text>
              <Text style={styles.studentName}>Student: {booking.student_name}</Text>
            </View>
          </View>
          <View style={styles.statusBadges}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.booking_status) }]}>
              <Text style={styles.statusText}>{booking.booking_status_display}</Text>
            </View>
          </View>
        </View>

        {/* Session Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#6b7280" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{booking.scheduled_date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#6b7280" />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{booking.scheduled_time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="hourglass-outline" size={18} color="#6b7280" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{booking.duration_hours} hours</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons 
              name={booking.session_type === 'online' ? 'videocam-outline' : 'location-outline'} 
              size={18} 
              color="#6b7280" 
            />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {booking.session_type === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>

          {booking.session_location && (
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={18} color="#6b7280" />
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{booking.session_location}</Text>
            </View>
          )}

          {booking.online_meeting_link && (
            <TouchableOpacity 
              style={styles.meetingLinkButton}
              onPress={() => Alert.alert('Meeting Link', booking.online_meeting_link)}
            >
              <Ionicons name="link-outline" size={18} color="#3b82f6" />
              <Text style={styles.meetingLinkText}>View Meeting Link</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <View>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{parseFloat(booking.total_amount).toLocaleString()}</Text>
              <Text style={styles.rateInfo}>@ ₹{parseFloat(booking.hourly_rate).toLocaleString()}/hour</Text>
            </View>
            <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(booking.payment_status) }]}>
              <Text style={styles.paymentStatusText}>{booking.payment_status_display}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.student_message && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Your Message:</Text>
            <Text style={styles.notesText}>{booking.student_message}</Text>
          </View>
        )}

        {booking.tutor_response && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Tutor Response:</Text>
            <Text style={styles.notesText}>{booking.tutor_response}</Text>
          </View>
        )}

        {booking.session_notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Session Notes:</Text>
            <Text style={styles.notesText}>{booking.session_notes}</Text>
          </View>
        )}

        {booking.homework_assigned && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Homework Assigned:</Text>
            <Text style={styles.notesText}>{booking.homework_assigned}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.bookingFooter}>
          <Text style={styles.bookingId}>Booking ID: {booking.uuid.slice(0, 8)}</Text>
          <Text style={styles.createdDate}>Booked: {booking.created_at}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your private coaching bookings will appear here
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to Load Bookings</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Private Coaching Demo Bookings</Text>
          <Text style={styles.headerSubtitle}>
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error && bookings.length === 0 ? (
        renderError()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#10b981']}
            />
          }
        >
          {bookings.length === 0 ? renderEmpty() : bookings.map(renderBookingCard)}
        </ScrollView>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tutorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  tutorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadges: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginTop: 4,
  },
  meetingLinkText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 2,
  },
  rateInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  notesSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bookingId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MyPrivateBookingsScreen;


