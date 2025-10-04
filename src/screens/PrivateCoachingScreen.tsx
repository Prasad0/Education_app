import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';

interface PrivateCoachingScreenProps {
  onBack: () => void;
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

const mockPrivateTutors: PrivateTutor[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    qualification: 'Ph.D in Physics, IIT Delhi',
    experience: '8 years',
    subjects: ['Physics', 'Mathematics', 'JEE Advanced'],
    rating: 4.9,
    reviews: 124,
    hourlyRate: '₹800-1200',
    languages: ['English', 'Hindi'],
    location: 'Koramangala',
    distance: '0.5 km',
    availability: ['Morning', 'Evening'],
    verified: true,
    responseTime: '< 2 hours',
    completedSessions: 450,
    teachingStyle: ['Problem Solving', 'Concept Building']
  },
  {
    id: '2',
    name: 'Ms. Priya Sharma',
    qualification: 'M.Sc Chemistry, Delhi University',
    experience: '6 years',
    subjects: ['Chemistry', 'NEET Biology', 'Class 12'],
    rating: 4.8,
    reviews: 98,
    hourlyRate: '₹600-900',
    languages: ['English', 'Hindi', 'Punjabi'],
    location: 'BTM Layout',
    distance: '1.2 km',
    availability: ['Afternoon', 'Evening'],
    verified: true,
    responseTime: '< 1 hour',
    completedSessions: 320,
    teachingStyle: ['Interactive', 'Exam Focused']
  },
];

const PrivateCoachingScreen: React.FC<PrivateCoachingScreenProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const subjects = useMemo(() => ['all', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'JEE', 'NEET'], []);

  const filteredTutors = useMemo(() => {
    return mockPrivateTutors.filter(tutor => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = tutor.name.toLowerCase().includes(q) ||
        tutor.subjects.some(s => s.toLowerCase().includes(q));
      const matchesSubject = selectedSubject === 'all' ||
        tutor.subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()));
      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, selectedSubject]);

  const TutorCard = ({ tutor }: { tutor: PrivateTutor }) => (
    <View style={styles.card}>
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="calendar-outline" size={16} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Book Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#1d4ed8" />
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

        <View>
          {filteredTutors.map(t => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </View>

        {filteredTutors.length === 0 && (
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
          onBack();
        }}
      />
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
});

export default PrivateCoachingScreen;


