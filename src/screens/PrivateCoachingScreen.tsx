import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchPrivateTutors, 
  fetchTutorAvailability, 
  createBooking,
  clearAvailability,
  clearBookingState,
  AvailabilitySlot,
  PrivateTutorApiItem 
} from '../store/slices/privateTutorsSlice';

interface PrivateCoachingScreenProps {
  onBack: () => void;
  onTabPress?: (tab: 'offline' | 'online' | 'private' | 'chat' | 'profile') => void;
  onViewDetails?: (tutorId: number) => void;
}

interface PrivateTutor {
  id: string;
  name: string;
  qualification: string;
  experience: string;
  subjects: string[];
  rating: number;
  reviews: number;
  hourlyRate: string;
  languages: string[];
  location: string;
  distance: string;
  availability: string[];
  verified: boolean;
  responseTime: string;
  completedSessions: number;
  teachingStyle: string[];
}

// Map API item to UI model used by the screen
const mapApiToUi = (item: any): PrivateTutor => ({
  id: String(item.id),
  name: item.teacher?.name || 'Unknown',
  qualification: item.teacher?.qualification || '',
  experience: item.teacher?.experience_display || '',
  subjects: [
    ...(item.teacher?.specialization ? [item.teacher.specialization] : []),
    ...((item.target_exams || []).map((e: any) => e.name))
  ],
  rating: parseFloat(item.average_rating || '0') || 0,
  reviews: item.total_reviews || 0,
  hourlyRate: item.hourly_rate_display || '',
  languages: (item.languages || []).map((l: any) => l.name),
  location: item.location || item.teacher?.city || '',
  distance: item.distance_from_user || '',
  availability: item.availability_summary || [],
  verified: !!item.is_verified,
  responseTime: item.response_time_hours ? `< ${item.response_time_hours} hours` : '',
  completedSessions: item.total_sessions_completed || 0,
  teachingStyle: (item.teaching_styles || []).map((s: any) => s.name),
});

const PrivateCoachingScreen: React.FC<PrivateCoachingScreenProps> = ({ onBack, onTabPress, onViewDetails }) => {
  const dispatch = useAppDispatch();
  const { items, loading, error, availability, availabilityLoading, availabilityError, bookingLoading, bookingSuccess, bookingError } = useAppSelector(state => state.privateTutors);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<PrivateTutorApiItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    dispatch(fetchPrivateTutors());
  }, [dispatch]);

  useEffect(() => {
    console.log('Booking state changed - Success:', bookingSuccess, 'Error:', bookingError);
    
    if (bookingSuccess) {
      console.log('Showing success alert');
      Alert.alert(
        'Success', 
        'Slot has been booked!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              dispatch(clearBookingState());
            }
          }
        ],
        { cancelable: false }
      );
    }
    
    if (bookingError) {
      console.log('Showing error alert:', bookingError);
      Alert.alert(
        'Booking Failed', 
        bookingError,
        [
          { 
            text: 'OK', 
            onPress: () => {
              dispatch(clearBookingState());
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, [bookingSuccess, bookingError, dispatch]);

  const uiTutors: PrivateTutor[] = useMemo(() => items.map(mapApiToUi), [items]);

  const subjects = useMemo(() => ['all', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'JEE', 'NEET'], []);

  const filteredTutors = useMemo(() => {
    return uiTutors.filter(tutor => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = tutor.name.toLowerCase().includes(q) ||
        tutor.subjects.some(s => s.toLowerCase().includes(q));
      const matchesSubject = selectedSubject === 'all' ||
        tutor.subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()));
      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, selectedSubject, uiTutors]);

  const handleBookSession = async (tutor: PrivateTutorApiItem) => {
    setSelectedTutor(tutor);
    setShowBookingDrawer(true);
    dispatch(clearAvailability());
    dispatch(fetchTutorAvailability(tutor.id));
  };

  const handleSlotSelect = async (slot: AvailabilitySlot) => {
    if (!slot.is_available || !selectedTutor || bookingLoading) return;
    
    setSelectedSlot(slot);
    
    // Show confirmation dialog
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
            if (!selectedTutor) return;
            
            // Store tutor ID before clearing state
            const tutorId = selectedTutor.id;
            
            // Calculate session date (next occurrence of the day)
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const slotDayIndex = days.indexOf(slot.day_of_week.toLowerCase());
            const today = new Date();
            const currentDay = today.getDay();
            let daysUntilSlot = (slotDayIndex - currentDay + 7) % 7;
            if (daysUntilSlot === 0) daysUntilSlot = 7; // Next week if today
            
            const sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() + daysUntilSlot);
            // Format date as DD-MM-YYYY
            const day = String(sessionDate.getDate()).padStart(2, '0');
            const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
            const year = sessionDate.getFullYear();
            const sessionDateStr = `${day}-${month}-${year}`;
            
            // Calculate duration
            const [startHour, startMin] = slot.start_time.split(':').map(Number);
            const [endHour, endMin] = slot.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationHours = (endMinutes - startMinutes) / 60;
            
            // Create booking data
            const bookingData = {
              tutor: tutorId,
              scheduled_date: sessionDateStr,
              scheduled_time: slot.start_time,
              end_time: slot.end_time,
              duration_hours: durationHours,
              notes: `Session with ${selectedTutor.teacher.name} - ${slot.day_display} ${slot.time_slot_display}`,
              is_online: true, // Default to online, can be made configurable
            };
            
            // Close drawer immediately
            setShowBookingDrawer(false);
            setSelectedTutor(null);
            setSelectedSlot(null);
            dispatch(clearAvailability());
            
            // Create booking (this is async)
            dispatch(createBooking(bookingData)).then((result) => {
              // This will be handled by the useEffect watching bookingSuccess
              console.log('Booking result:', result);
            }).catch((error) => {
              console.error('Booking error:', error);
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Group availability by day
  const groupedAvailability = useMemo(() => {
    const grouped: { [key: string]: AvailabilitySlot[] } = {};
    availability.forEach(slot => {
      if (!grouped[slot.day_display]) {
        grouped[slot.day_display] = [];
      }
      grouped[slot.day_display].push(slot);
    });
    
    // Sort days and time slots
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

  const TutorCard = ({ tutor }: { tutor: PrivateTutor }) => {
    const handleCardPress = () => {
      console.log('Card pressed, tutor.id:', tutor.id, 'tutor.id type:', typeof tutor.id);
      const apiTutor = items.find(t => String(t.id) === String(tutor.id));
      console.log('Found apiTutor:', apiTutor);
      if (apiTutor && onViewDetails) {
        console.log('Calling onViewDetails with id:', apiTutor.id);
        onViewDetails(apiTutor.id);
      } else {
        console.log('onViewDetails not available or apiTutor not found', { onViewDetails: !!onViewDetails, apiTutor: !!apiTutor });
      }
    };

    return (
    <View style={styles.card}>
      <TouchableOpacity 
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-outline" size={26} color="#10b981" />
          {tutor.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={styles.cardHeaderCenter}>
          <Text style={styles.tutorName}>{tutor.name}</Text>
          <Text style={styles.tutorQual}>{tutor.qualification}</Text>
          <View style={styles.headerMetaRow}>
            <Text style={styles.headerMetaText}>{tutor.experience} exp</Text>
            <Text style={styles.headerMetaDot}>•</Text>
            <Text style={styles.headerMetaText}>{tutor.completedSessions}+ sessions</Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.ratingText}>{tutor.rating}</Text>
            <Text style={styles.reviewsText}>({tutor.reviews})</Text>
          </View>
          <Text style={styles.rateText}>{tutor.hourlyRate}/hr</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {tutor.subjects.slice(0, 3).map((subject, i) => (
          <View key={`${tutor.id}-sub-${i}`} style={styles.subjectChip}>
            <Text style={styles.subjectChipText}>{subject}</Text>
          </View>
        ))}
        {tutor.subjects.length > 3 && (
          <View style={[styles.subjectChip, styles.subjectChipOutline]}>
            <Text style={[styles.subjectChipText, styles.subjectChipOutlineText]}>+{tutor.subjects.length - 3} more</Text>
          </View>
        )}
      </View>

      <View style={styles.stylesRow}>
        {tutor.teachingStyle.map((s, i) => (
          <View key={`${tutor.id}-style-${i}`} style={styles.stylePill}>
            <Text style={styles.stylePillText}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.metaText}>{tutor.location} • {tutor.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.metaText}>Responds in {tutor.responseTime}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Available:</Text>
        <View style={styles.availabilityRow}>
          {tutor.availability.map((t, i) => (
            <View key={`${tutor.id}-avail-${i}`} style={styles.availabilityChip}>
              <Text style={styles.availabilityChipText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Languages:</Text>
        <Text style={styles.metaTextStrong}>{tutor.languages.join(', ')}</Text>
      </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            const apiTutor = items.find(t => String(t.id) === String(tutor.id));
            if (apiTutor) {
              handleBookSession(apiTutor);
            }
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Book Session</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            // Message functionality
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#1d4ed8" />
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Private Coaching</Text>
          <Text style={styles.headerSubtitle}>Find experienced tutors</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(v => !v)}>
          <Ionicons name="options-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tutors or subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Subjects</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.subjectsRow}>
              {subjects.map(subject => {
                const isActive = selectedSubject === subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.subjectButton, isActive ? styles.subjectButtonActive : styles.subjectButtonInactive]}
                    onPress={() => setSelectedSubject(subject)}
                  >
                    <Text style={isActive ? styles.subjectButtonActiveText : styles.subjectButtonText}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{filteredTutors.length} tutors available</Text>
        </View>

        {loading && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading tutors...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.emptyTitle}>Failed to load tutors</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => dispatch(fetchPrivateTutors())}
            >
              <Text style={styles.clearFiltersText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <View>
            {filteredTutors.map(t => (
              <TutorCard key={t.id} tutor={t} />
            ))}
          </View>
        )}

        {!loading && !error && filteredTutors.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tutors found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => { setSearchQuery(''); setSelectedSubject('all'); }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="private"
        onTabPress={(tab) => {
          if (tab === 'private') return;
          if (onTabPress) {
            onTabPress(tab);
          } else {
            onBack();
          }
        }}
      />

      {/* Booking Drawer */}
      <Modal
        visible={showBookingDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBookingDrawer(false);
          setSelectedTutor(null);
          setSelectedSlot(null);
          dispatch(clearAvailability());
          dispatch(clearBookingState());
        }}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Book Session</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBookingDrawer(false);
                  setSelectedTutor(null);
                  setSelectedSlot(null);
                  dispatch(clearAvailability());
                  dispatch(clearBookingState());
                }}
                style={styles.drawerCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedTutor && (
              <View style={styles.drawerTutorInfo}>
                <Text style={styles.drawerTutorName}>{selectedTutor.teacher.name}</Text>
                <Text style={styles.drawerTutorQual}>{selectedTutor.teacher.qualification}</Text>
                <Text style={styles.drawerTutorRate}>{selectedTutor.hourly_rate_display}/hr</Text>
              </View>
            )}

            {/* Availability */}
            <ScrollView style={styles.drawerContent}>
              {availabilityLoading && (
                <View style={styles.drawerLoading}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.drawerLoadingText}>Loading availability...</Text>
                </View>
              )}

              {availabilityError && (
                <View style={styles.drawerError}>
                  <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
                  <Text style={styles.drawerErrorText}>{availabilityError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => selectedTutor && dispatch(fetchTutorAvailability(selectedTutor.id))}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!availabilityLoading && !availabilityError && groupedAvailability.length === 0 && (
                <View style={styles.drawerEmpty}>
                  <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                  <Text style={styles.drawerEmptyText}>No availability slots found</Text>
                </View>
              )}

              {!availabilityLoading && !availabilityError && groupedAvailability.map(({ day, slots }) => (
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  backButton: { padding: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  filterButton: { padding: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16, paddingVertical: 10
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  filtersContainer: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 },
  subjectsRow: { flexDirection: 'row', gap: 8 },
  subjectButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  subjectButtonInactive: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  subjectButtonActive: { backgroundColor: '#059669', borderColor: '#059669' },
  subjectButtonText: { color: '#374151', fontSize: 12, fontWeight: '500' },
  subjectButtonActiveText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 120 },
  statsRow: { paddingHorizontal: 16, paddingVertical: 12 },
  statsText: { fontSize: 12, color: '#6b7280' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, padding: 16
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  cardHeaderCenter: { flex: 1, minWidth: 0 },
  tutorName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  tutorQual: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerMetaText: { fontSize: 12, color: '#6b7280' },
  headerMetaDot: { fontSize: 12, color: '#9ca3af' },
  cardHeaderRight: { alignItems: 'flex-end' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  reviewsText: { fontSize: 12, color: '#6b7280' },
  rateText: { fontSize: 13, fontWeight: '600', color: '#059669', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subjectChip: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  subjectChipOutline: { backgroundColor: '#ffffff' },
  subjectChipText: { fontSize: 12, color: '#374151' },
  subjectChipOutlineText: { color: '#6b7280' },
  stylesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  stylePill: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  stylePillText: { fontSize: 12, color: '#3730a3' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#6b7280' },
  metaTextStrong: { fontSize: 12, color: '#111827', fontWeight: '500' },
  availabilityRow: { flexDirection: 'row', gap: 6 },
  availabilityChip: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  availabilityChipText: { fontSize: 12, color: '#374151' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  primaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', borderRadius: 12, paddingVertical: 10, gap: 6 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 12, paddingVertical: 10, gap: 6 },
  secondaryButtonText: { color: '#1d4ed8', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  clearFiltersButton: { marginTop: 12, backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  clearFiltersText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  drawerOverlay: {
    flex: 1,
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
  drawerTutorInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerTutorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  drawerTutorQual: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  drawerTutorRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
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
  drawerError: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  drawerErrorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
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
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrivateCoachingScreen;


