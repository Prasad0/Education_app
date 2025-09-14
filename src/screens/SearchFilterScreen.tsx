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
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchCoachingCenters, filterCoachingCenters } from '../store/slices/coachingSlice';
import { CoachingCenter } from '../store/slices/coachingSlice';

interface FilterState {
  feesRange: string;
  batchTiming: string;
  distance: string;
  amenities: string[];
  discounts: string[];
  standard: string;
  coachingType: string;
  ratingMin: number;
}

interface SearchFilterScreenProps {
  onBack: () => void;
  searchQuery?: string;
}

const filterOptions = {
  feesRange: ['Under ₹25k', '₹25k - ₹50k', '₹50k - ₹75k', 'Above ₹75k'],
  batchTiming: ['Morning (6-12)', 'Afternoon (12-6)', 'Evening (6-12)', 'Flexible'],
  distance: ['Under 1km', '1-3km', '3-5km', 'Above 5km'],
  amenities: ['WiFi', 'AC', 'Library', 'Parking', 'Cafeteria', 'Lab'],
  discounts: ['Early Bird', 'Group Discount', 'Scholarship', 'Merit Scholarship'],
  standard: ['Class 10', 'Class 11', 'Class 12', 'Graduate', 'Professional'],
  coachingType: ['Offline', 'Online', 'Hybrid'],
  ratingMin: [3.0, 3.5, 4.0, 4.5, 5.0],
};

const SearchFilterScreen: React.FC<SearchFilterScreenProps> = ({ onBack, searchQuery = '' }) => {
  const dispatch = useAppDispatch();
  const { filteredCenters, isLoading, error } = useAppSelector(state => state.coaching);
  const { accessToken, isAuthenticated } = useAppSelector(state => state.auth);
  const { coordinates } = useAppSelector(state => state.location);

  const [searchText, setSearchText] = useState(searchQuery);
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    feesRange: '',
    batchTiming: '',
    distance: '',
    amenities: [],
    discounts: [],
    standard: '',
    coachingType: '',
    ratingMin: 0,
  });

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleFilterChange = (filterType: keyof FilterState, value: string | number) => {
    if (filterType === 'amenities' || filterType === 'discounts') {
      const currentArray = activeFilters[filterType] as string[];
      const newArray = currentArray.includes(value as string)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value as string];
      setActiveFilters(prev => ({ ...prev, [filterType]: newArray }));
    } else {
      setActiveFilters(prev => ({
        ...prev,
        [filterType]: prev[filterType] === value ? (filterType === 'ratingMin' ? 0 : '') : value,
      }));
    }
  };

  const clearFilter = (filterType: keyof FilterState, value?: string) => {
    if (filterType === 'amenities' || filterType === 'discounts') {
      const currentArray = activeFilters[filterType] as string[];
      const newArray = value ? currentArray.filter(item => item !== value) : [];
      setActiveFilters(prev => ({ ...prev, [filterType]: newArray }));
    } else {
      setActiveFilters(prev => ({ ...prev, [filterType]: filterType === 'ratingMin' ? 0 : '' }));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters({
      feesRange: '',
      batchTiming: '',
      distance: '',
      amenities: [],
      discounts: [],
      standard: '',
      coachingType: '',
      ratingMin: 0,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.feesRange) count++;
    if (activeFilters.batchTiming) count++;
    if (activeFilters.distance) count++;
    if (activeFilters.standard) count++;
    if (activeFilters.coachingType) count++;
    if (activeFilters.ratingMin > 0) count++;
    count += activeFilters.amenities.length;
    count += activeFilters.discounts.length;
    return count;
  };

  const handleSearch = () => {
    if (!accessToken || !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to search coaching centers.');
      return;
    }

    const searchParams = {
      search: searchText.trim(),
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      radius: 2000,
    };

    if (searchText.trim()) {
      dispatch(searchCoachingCenters(searchText.trim()));
    } else {
      dispatch(filterCoachingCenters(searchParams));
    }
  };

  const handleApplyFilters = () => {
    if (!accessToken || !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to filter coaching centers.');
      return;
    }

    // Map filter state to API parameters
    const filterParams: any = {
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      radius: 2000,
    };

    // Add search term if present
    if (searchText.trim()) {
      filterParams.search = searchText.trim();
    }

    // Map fees range to API parameters
    if (activeFilters.feesRange) {
      switch (activeFilters.feesRange) {
        case 'Under ₹25k':
          filterParams.fees_max = 25000;
          break;
        case '₹25k - ₹50k':
          filterParams.fees_min = 25000;
          filterParams.fees_max = 50000;
          break;
        case '₹50k - ₹75k':
          filterParams.fees_min = 50000;
          filterParams.fees_max = 75000;
          break;
        case 'Above ₹75k':
          filterParams.fees_min = 75000;
          break;
      }
    }

    // Map standard to API parameters
    if (activeFilters.standard) {
      switch (activeFilters.standard) {
        case 'Class 10':
          filterParams.standards = '10th';
          break;
        case 'Class 11':
          filterParams.standards = '11th';
          break;
        case 'Class 12':
          filterParams.standards = '12th';
          break;
      }
    }

    // Map coaching type
    if (activeFilters.coachingType) {
      filterParams.coaching_type = activeFilters.coachingType.toLowerCase();
    }

    // Map rating minimum
    if (activeFilters.ratingMin > 0) {
      filterParams.rating_min = activeFilters.ratingMin;
    }

    // Map subjects based on common combinations
    if (activeFilters.standard === 'Class 11' || activeFilters.standard === 'Class 12') {
      filterParams.subjects = 'Physics,Chemistry,Mathematics';
      filterParams.target_exams = 'JEE Main,NEET';
    }

    dispatch(filterCoachingCenters(filterParams));
    setShowFilters(false);
  };

  // Apply local filters to the Redux store data
  const applyLocalFilters = (centers: CoachingCenter[]) => {
    let filtered = centers.filter(center => {
      // Search filter
      if (searchText && !center.name?.toLowerCase().includes(searchText.toLowerCase()) &&
          !center.branch_name?.toLowerCase().includes(searchText.toLowerCase()) &&
          !center.className?.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }

      // Fees filter
      if (activeFilters.feesRange) {
        // Extract numeric value from fees string for comparison
        const feesText = center.fees || center.fees_display || '';
        const feesMatch = feesText.match(/\d+/g);
        if (feesMatch && feesMatch.length > 0) {
          const avgFees = parseInt(feesMatch[0]);
          switch (activeFilters.feesRange) {
            case 'Under ₹25k':
              if (avgFees >= 25000) return false
              break
            case '₹25k - ₹50k':
              if (avgFees < 25000 || avgFees > 50000) return false
              break
            case '₹50k - ₹75k':
              if (avgFees < 50000 || avgFees > 75000) return false
              break
            case 'Above ₹75k':
              if (avgFees <= 75000) return false
              break
          }
        }
      }

      // Rating filter
      if (activeFilters.ratingMin > 0) {
        const rating = center.rating || center.average_rating || 0;
        if (rating < activeFilters.ratingMin) return false;
      }

      // Coaching type filter
      if (activeFilters.coachingType) {
        const coachingType = center.coaching_type || 'offline';
        if (coachingType.toLowerCase() !== activeFilters.coachingType.toLowerCase()) return false;
      }

      // Amenities filter
      if (activeFilters.amenities.length > 0) {
        const centerAmenities = center.amenities || [];
        const hasAllAmenities = activeFilters.amenities.every(amenity => 
          centerAmenities.some(centerAmenity => 
            (typeof centerAmenity === 'string' ? centerAmenity : centerAmenity.name || centerAmenity)
              .toLowerCase().includes(amenity.toLowerCase())
          )
        )
        if (!hasAllAmenities) return false
      }

      return true
    })

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || b.average_rating || 0) - (a.rating || a.average_rating || 0))
        break
      case 'fees':
        // Sort by fees (extract numeric value)
        filtered.sort((a, b) => {
          const aFees = a.fees || a.fees_display || '';
          const bFees = b.fees || b.fees_display || '';
          const aMatch = aFees.match(/\d+/g);
          const bMatch = bFees.match(/\d+/g);
          const aNum = aMatch ? parseInt(aMatch[0]) : 0;
          const bNum = bMatch ? parseInt(bMatch[0]) : 0;
          return aNum - bNum;
        })
        break
      case 'nearest':
        // Sort by distance (extract numeric value)
        filtered.sort((a, b) => {
          const aDist = typeof a.distance === 'number' ? a.distance : parseFloat(a.distance?.toString() || '0');
          const bDist = typeof b.distance === 'number' ? b.distance : parseFloat(b.distance?.toString() || '0');
          return aDist - bDist;
        })
        break
      case 'popularity':
      default:
        // Sort by rating as popularity proxy
        filtered.sort((a, b) => (b.rating || b.average_rating || 0) - (a.rating || a.average_rating || 0))
        break
    }

    return filtered
  }

  const localFilteredCenters = applyLocalFilters(filteredCenters)
  const activeFilterCount = getActiveFilterCount();

  // Re-apply filters when search text or filters change
  useEffect(() => {
    // This will trigger a re-render when searchText or activeFilters change
  }, [searchText, activeFilters, sortBy]);

  const FilterChip: React.FC<{
    label: string;
    active: boolean;
    onPress: () => void;
    onRemove?: () => void;
  }> = ({ label, active, onPress, onRemove }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        active ? styles.filterChipActive : styles.filterChipInactive,
      ]}
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

  const CoachingCard: React.FC<{ center: CoachingCenter }> = ({ center }) => (
    <View style={styles.coachingCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardImageContainer}>
          {center.images && center.images.length > 0 ? (
            <View style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="school" size={24} color="#9ca3af" />
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {center.name || center.branch_name || 'Coaching Center'}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {center.className || (center.subjects_offered && Array.isArray(center.subjects_offered) ? center.subjects_offered.map(subject => typeof subject === 'string' ? subject : subject.name || subject).join(', ') : '') || 'Coaching Classes'}
              </Text>
            </View>
            <View style={[
              styles.seatsBadge,
              (center.seatsLeft || center.available_seats || 0) <= 5 ? styles.seatsBadgeLow : styles.seatsBadgeNormal
            ]}>
              <Text style={styles.seatsBadgeText}>
                {center.seatsLeft || center.available_seats || 0} left
              </Text>
            </View>
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {center.rating || center.average_rating || 0}
              </Text>
              <Text style={styles.reviewsText}>
                ({center.reviews || center.total_reviews || 0})
              </Text>
            </View>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={12} color="#6b7280" />
              <Text style={styles.distanceText}>
                {typeof center.distance === 'number' ? `${center.distance} km` : center.distance || 'Distance not available'}
              </Text>
            </View>
          </View>

          {center.amenities && center.amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
              {center.amenities.slice(0, 3).map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>
                    {typeof amenity === 'string' ? amenity : amenity.name || amenity}
                  </Text>
                </View>
              ))}
              {center.amenities.length > 3 && (
                <Text style={styles.moreAmenitiesText}>
                  +{center.amenities.length - 3} more
                </Text>
              )}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.feesText}>
              {center.fees || center.fees_display || 'Fees not available'}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Breadcrumb Navigation */}
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={onBack} style={styles.breadcrumbLink}>
              <Ionicons name="home" size={12} color="#6b7280" />
              <Text style={styles.breadcrumbText}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="#9ca3af" />
            <Text style={styles.breadcrumbCurrent}>Search & Filter</Text>
          </View>

          {/* Top bar with back button and search */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                placeholder="Search coaching centers..."
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                style={styles.searchInput}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Filter and Sort Row */}
          <View style={styles.filterSortRow}>
            <TouchableOpacity
              onPress={() => {
                console.log('Filter button pressed, current showFilters:', showFilters);
                setShowFilters(!showFilters);
              }}
              style={[
                styles.filterButton,
                activeFilterCount > 0 ? styles.filterButtonActive : styles.filterButtonInactive,
              ]}
            >
              <Ionicons 
                name={showFilters ? "chevron-up" : "filter"} 
                size={16} 
                color={activeFilterCount > 0 ? "#059669" : "#6b7280"} 
              />
              <Text style={[
                styles.filterButtonText,
                activeFilterCount > 0 && styles.filterButtonTextActive
              ]}>
                Filters
              </Text>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <TouchableOpacity
                onPress={() => {
                  const options = ['Popularity', 'Rating', 'Fees', 'Nearest'];
                  const currentIndex = options.findIndex(opt => 
                    opt.toLowerCase() === sortBy.toLowerCase()
                  );
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex].toLowerCase());
                }}
                style={styles.sortButton}
              >
                <Text style={styles.sortButtonText}>
                  {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Filters Row */}
          {activeFilterCount > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersContainer}>
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>

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

              {activeFilters.standard && (
                <FilterChip
                  label={activeFilters.standard}
                  active={true}
                  onPress={() => {}}
                  onRemove={() => clearFilter('standard')}
                />
              )}

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
            </ScrollView>
          )}
        </View>

        {/* Expandable Filters Section */}
        {showFilters && (
          <View style={styles.filtersSection}>
          <ScrollView 
            style={styles.filtersContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filtersContentContainer}
          >
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
                    active={activeFilters.standard === option}
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

            {/* Apply Filters Button */}
            <TouchableOpacity onPress={handleApplyFilters} style={styles.applyFiltersButton}>
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {localFilteredCenters.length} results found
            {searchText && <Text> for "{searchText}"</Text>}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading coaching centers...</Text>
          </View>
        ) : localFilteredCenters.length > 0 ? (
          <View style={styles.resultsList}>
            {localFilteredCenters.map((center) => (
              <CoachingCard key={center.id} center={center} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="search" size={24} color="#9ca3af" />
            </View>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateSubtitle}>Try adjusting your search or filters</Text>
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersButtonText}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    marginRight: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
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
  filtersSection: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 500,
  },
  filtersContent: {
    flex: 1,
  },
  filtersContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
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
  applyFiltersButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultsList: {
    paddingBottom: 20,
  },
  coachingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  cardImageContainer: {
    flexShrink: 0,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  seatsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  seatsBadgeNormal: {
    backgroundColor: '#f3f4f6',
  },
  seatsBadgeLow: {
    backgroundColor: '#fef2f2',
  },
  seatsBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  amenityTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 10,
    color: '#1d4ed8',
  },
  moreAmenitiesText: {
    fontSize: 10,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  bookButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default SearchFilterScreen;
