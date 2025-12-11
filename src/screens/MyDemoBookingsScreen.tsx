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
import { useAppSelector } from '../store/hooks';
import api from '../config/api';

interface MyDemoBookingsScreenProps {
  onBack: () => void;
}

interface DemoBooking {
  id: number;
  slot: {
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
  };
  coaching: number;
  coaching_name?: string;
  student_name: string;
  parent_name: string;
  phone: string;
  email: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  child?: number;
}

interface BookingsResponse {
  data: {
    success: boolean;
    results: DemoBooking[];
    count?: number;
    next?: string | null;
    previous?: string | null;
  };
}

const MyDemoBookingsScreen: React.FC<MyDemoBookingsScreenProps> = ({ onBack }) => {
  const { profile, user, selectedChildId } = useAppSelector(state => state.auth);
  const actualProfile = user || profile;

  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
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
    fetchBookings(1);
  }, [selectedChildId]);

  const fetchBookings = async (page: number, isRefresh = false) => {
    try {
      if (page === 1) {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      // Build URL with pagination and optional student_id for parents
      let url = `/coachings/my-demo-bookings/?page=${page}`;
      if (actualProfile?.user_type === 'parent' && selectedChildId) {
        url += `&student_id=${selectedChildId}`;
      }

      const response = await api.get<BookingsResponse>(url);
      
      if (response.data?.data?.success) {
        const newBookings = response.data.data.results || [];
        
        if (page === 1) {
          setBookings(newBookings);
        } else {
          setBookings(prev => [...prev, ...newBookings]);
        }
        
        setCurrentPage(page);
        setHasNextPage(!!response.data.data.next);
      } else {
        setError('Failed to load demo bookings');
      }
    } catch (error: any) {
      console.error('Error fetching demo bookings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load demo bookings. Please try again.';
      setError(errorMessage);
      
      if (page === 1) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    fetchBookings(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      fetchBookings(currentPage + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'information-circle';
    }
  };

  const renderBookingCard = (booking: DemoBooking) => (
    <View key={booking.id} style={styles.bookingCard}>
      {/* Header with Status */}
      <View style={styles.bookingHeader}>
        <View style={styles.bookingHeaderLeft}>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectText}>{booking.slot.subject_name}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
          <Ionicons 
            name={getStatusIcon(booking.status) as any} 
            size={14} 
            color={getStatusColor(booking.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Slot Details */}
      <View style={styles.slotDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{booking.slot.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {booking.slot.start_time} ({booking.slot.duration_minutes} min)
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{booking.slot.teacher_name}</Text>
        </View>
      </View>

      {/* Student Details */}
      <View style={styles.studentDetails}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student:</Text>
          <Text style={styles.infoValue}>{booking.student_name}</Text>
        </View>
        {booking.parent_name && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Parent:</Text>
            <Text style={styles.infoValue}>{booking.parent_name}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{booking.phone}</Text>
        </View>
        {booking.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{booking.email}</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {booking.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{booking.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.bookingFooter}>
        <Text style={styles.bookedDate}>Booked on {booking.created_at}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Demo Bookings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Book a demo class to get started with your learning journey!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to Load Bookings</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings(1)}>
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
          <Text style={styles.headerTitle}>My Demo Bookings</Text>
          <Text style={styles.headerSubtitle}>
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : error && bookings.length === 0 ? (
        renderError()
      ) : bookings.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#10b981']} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasNextPage && !isLoadingMore) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={styles.bookingsList}>
            {bookings.map(booking => renderBookingCard(booking))}
            
            {/* Load More Indicator */}
            {isLoadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            )}
            
            {/* End of List */}
            {!hasNextPage && bookings.length > 0 && (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>You've reached the end</Text>
              </View>
            )}
          </View>
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
  content: {
    flex: 1,
  },
  bookingsList: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingHeaderLeft: {
    flex: 1,
  },
  subjectBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slotDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  studentDetails: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bookingFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bookedDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
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
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  endOfListContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default MyDemoBookingsScreen;

