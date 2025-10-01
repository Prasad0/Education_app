import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';

interface FilterState {
  search: string;
  feesRange: string;
  batchTiming: string;
  distance: string;
  amenities: string[];
  discounts: string[];
  standard: string[];
  coachingType: string;
  ratingMin: number;
  subjects: string[];
  targetExams: string[];
}

interface SearchFilterScreenProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  searchQuery?: string;
  initialFilters?: FilterState;
}

const filterOptions = {
  feesRange: ['Under ₹25k', '₹25k - ₹50k', '₹50k - ₹75k', 'Above ₹75k'],
  batchTiming: ['Morning (6-12)', 'Afternoon (12-6)', 'Evening (6-12)', 'Flexible'],
  distance: ['Under 1km', '1-3km', '3-5km', 'Above 5km'],
  amenities: ['WiFi', 'AC', 'Library', 'Parking', 'Cafeteria', 'Lab'],
  discounts: ['Early Bird', 'Group Discount', 'Scholarship', 'Merit Scholarship'],
  standard: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
  coachingType: ['Offline', 'Online', 'Hybrid'],
  ratingMin: [3.0, 3.5, 4.0, 4.5, 5.0],
  subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'],
  targetExams: ['JEE Main', 'JEE Advanced', 'NEET', 'Board Exam', 'CUET', 'CLAT'],
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  onRemove?: () => void;
}> = ({ label, active, onPress, onRemove }) => {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
      }}
      style={[
        styles.filterChip,
        active ? styles.filterChipActive : styles.filterChipInactive,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
      {active && onRemove && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={16} color="#059669" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};


const SearchFilterScreen: React.FC<SearchFilterScreenProps> = ({ 
  visible, 
  onClose, 
  onApply, 
  searchQuery = '', 
  initialFilters 
}) => {
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated } = useAppSelector(state => state.auth);
  const { coordinates } = useAppSelector(state => state.location);

  const [searchText, setSearchText] = useState(searchQuery);
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(true); // Always show filters in modal
  const [activeFilters, setActiveFilters] = useState<FilterState>(
    initialFilters || {
      search: '',
      feesRange: '',
      batchTiming: '',
      distance: '',
      amenities: [],
      discounts: [],
      standard: [],
      coachingType: '',
      ratingMin: 0,
      subjects: [],
      targetExams: [],
    }
  );

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Update active filters when initialFilters change (for pre-selecting applied filters)
  useEffect(() => {
    if (initialFilters) {
      setActiveFilters(initialFilters);
      if (initialFilters.search) {
        setSearchText(initialFilters.search);
      }
    }
  }, [initialFilters]);

  // Update searchText when it changes
  useEffect(() => {
    setActiveFilters(prev => ({ ...prev, search: searchText.trim() }));
  }, [searchText]);

  const handleFilterChange = (filterType: keyof FilterState, value: string | number) => {
    if (filterType === 'amenities' || filterType === 'discounts' || filterType === 'subjects' || filterType === 'targetExams' || filterType === 'standard') {
      const currentArray = activeFilters[filterType] as string[];
      const newArray = currentArray.includes(value as string)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value as string];
      setActiveFilters(prev => ({ ...prev, [filterType]: newArray }));
    } else {
      const newValue = activeFilters[filterType] === value ? (filterType === 'ratingMin' ? 0 : '') : value;
      setActiveFilters(prev => ({
        ...prev,
        [filterType]: newValue,
      }));
    }
  };

  const clearFilter = (filterType: keyof FilterState, value?: string) => {
    if (filterType === 'amenities' || filterType === 'discounts' || filterType === 'subjects' || filterType === 'targetExams' || filterType === 'standard') {
      const currentArray = activeFilters[filterType] as string[];
      const newArray = value ? currentArray.filter(item => item !== value) : [];
      setActiveFilters(prev => ({ ...prev, [filterType]: newArray }));
    } else {
      setActiveFilters(prev => ({ ...prev, [filterType]: filterType === 'ratingMin' ? 0 : '' }));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters({
      search: '',
      feesRange: '',
      batchTiming: '',
      distance: '',
      amenities: [],
      discounts: [],
      standard: [],
      coachingType: '',
      ratingMin: 0,
      subjects: [],
      targetExams: [],
    });
    setSearchText('');
  };


  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.search) count++;
    if (activeFilters.feesRange) count++;
    if (activeFilters.batchTiming) count++;
    if (activeFilters.distance) count++;
    count += activeFilters.standard.length;
    if (activeFilters.coachingType) count++;
    if (activeFilters.ratingMin > 0) count++;
    count += activeFilters.amenities.length;
    count += activeFilters.discounts.length;
    count += activeFilters.subjects.length;
    count += activeFilters.targetExams.length;
    return count;
  };


  const handleApplyFilters = () => {
    console.log('[SearchFilter] Apply pressed', activeFilters);
    // Call the onApply callback with the current filters and search term
    onApply({
      ...activeFilters,
      search: searchText.trim()
    });
    
    // Close the modal
    onClose();
  };

  const activeFilterCount = getActiveFilterCount();

  // No verbose logs in production
  useEffect(() => {}, [showFilters, activeFilterCount, activeFilters]);




  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Top bar with close button and title */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Filters</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Filter Info */}
            <View style={styles.filterInfoRow}>
              <Text style={styles.filterInfoText}>
                {activeFilterCount > 0 ? `${activeFilterCount} filters applied` : 'No filters applied'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Active Filters Row */}
            {activeFilterCount > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersContainer}>
                {activeFilters.search && (
                  <FilterChip
                    label={`Search: ${activeFilters.search}`}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('search')}
                  />
                )}
                {activeFilters.feesRange && (
                  <FilterChip
                    label={activeFilters.feesRange}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('feesRange')}
                  />
                )}

                {activeFilters.batchTiming && (
                  <FilterChip
                    label={activeFilters.batchTiming}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('batchTiming')}
                  />
                )}

                {activeFilters.distance && (
                  <FilterChip
                    label={activeFilters.distance}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('distance')}
                  />
                )}

                {activeFilters.standard.map((standard) => (
                  <FilterChip
                    key={standard}
                    label={standard}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('standard', standard)}
                  />
                ))}

                {activeFilters.amenities.map((amenity) => (
                  <FilterChip
                    key={amenity}
                    label={amenity}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('amenities', amenity)}
                  />
                ))}

                {activeFilters.discounts.map((discount) => (
                  <FilterChip
                    key={discount}
                    label={discount}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('discounts', discount)}
                  />
                ))}

                {activeFilters.subjects.map((subject) => (
                  <FilterChip
                    key={subject}
                    label={subject}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('subjects', subject)}
                  />
                ))}

                {activeFilters.targetExams.map((exam) => (
                  <FilterChip
                    key={exam}
                    label={exam}
                    active={true}
                    onPress={() => {}}
                    onRemove={() => clearFilter('targetExams', exam)}
                  />
                ))}

              </ScrollView>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search coaching centers..."
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchText('')}
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters Section */}
        <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.filtersContent}>
            {/* Fees Range */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Fees Range</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.feesRange.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.feesRange === option}
                    onPress={() => handleFilterChange('feesRange', option)}
                  />
                ))}
              </View>
            </View>

            {/* Batch Timing */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Batch Timing</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.batchTiming.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.batchTiming === option}
                    onPress={() => handleFilterChange('batchTiming', option)}
                  />
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Distance</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.distance.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.distance === option}
                    onPress={() => handleFilterChange('distance', option)}
                  />
                ))}
              </View>
            </View>

            {/* Standard */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Standard</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.standard.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.standard.includes(option)}
                    onPress={() => handleFilterChange('standard', option)}
                  />
                ))}
              </View>
            </View>

            {/* Coaching Type */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Coaching Type</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.coachingType.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.coachingType === option}
                    onPress={() => handleFilterChange('coachingType', option)}
                  />
                ))}
              </View>
            </View>

            {/* Rating Minimum */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Minimum Rating</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.ratingMin.map((option) => (
                  <FilterChip
                    key={option.toString()}
                    label={`${option}+ Stars`}
                    active={activeFilters.ratingMin === option}
                    onPress={() => handleFilterChange('ratingMin', option)}
                  />
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Amenities</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.amenities.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.amenities.includes(option)}
                    onPress={() => handleFilterChange('amenities', option)}
                  />
                ))}
              </View>
            </View>

            {/* Discounts */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Discounts</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.discounts.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.discounts.includes(option)}
                    onPress={() => handleFilterChange('discounts', option)}
                  />
                ))}
              </View>
            </View>

            {/* Subjects */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Subjects</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.subjects.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.subjects.includes(option)}
                    onPress={() => handleFilterChange('subjects', option)}
                  />
                ))}
              </View>
            </View>

            {/* Target Exams */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Target Exams</Text>
              <View style={styles.filterChipsContainer}>
                {filterOptions.targetExams.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    active={activeFilters.targetExams.includes(option)}
                    onPress={() => handleFilterChange('targetExams', option)}
                  />
                ))}
              </View>
            </View>


            {/* Apply Filters Button */}
            <View style={styles.applyFiltersContainer}>
              <TouchableOpacity onPress={handleApplyFilters} style={styles.applyFiltersButton}>
                <Ionicons name="checkmark" size={18} color="#ffffff" />
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
                <Ionicons name="refresh" size={16} color="#6b7280" />
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 50, // Account for status bar
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#6b7280',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as back button for centering
  },
  filterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterInfoText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#059669',
  },
  filterBadge: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  activeFiltersContainer: {
    marginBottom: 12,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    borderWidth: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 36,
  },
  filterChipInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#059669',
  },
  removeButton: {
    padding: 2,
  },
  filtersContainer: {
    flex: 1,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100, // Extra padding for apply button
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  applyFiltersContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40, // Account for safe area
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyFiltersButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearFiltersButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SearchFilterScreen;
