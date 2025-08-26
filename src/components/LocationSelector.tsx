import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  setSelectedLocation, 
  setSearchQuery, 
  clearSearchQuery, 
  getCurrentLocation,
  addCustomLocation,
  searchLocations,
  selectSearchResult,
  clearRecentSearches,
  getNearbyLocations
} from '../store/slices/locationSlice';

interface LocationSelectorProps {
  onBack: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { 
    currentLocation, 
    selectedLocation, 
    isLocationLoading, 
    searchQuery, 
    searchResults,
    isSearching,
    searchError,
    recentSearches,
    coordinates
  } = useAppSelector(state => state.location);

  const [searchText, setSearchText] = useState('');
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  // Fetch nearby locations when coordinates are available
  useEffect(() => {
    if (coordinates) {
      setIsFetchingNearby(true);
      dispatch(getNearbyLocations(coordinates)).finally(() => {
        setIsFetchingNearby(false);
      });
    }
  }, [coordinates, dispatch]);

  // Also fetch nearby locations when current location is obtained
  useEffect(() => {
    if (currentLocation && currentLocation !== 'Getting location...' && coordinates) {
      setIsFetchingNearby(true);
      dispatch(getNearbyLocations(coordinates)).finally(() => {
        setIsFetchingNearby(false);
      });
    }
  }, [currentLocation, coordinates, dispatch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleLocationSelect = (location: string) => {
    const fullAddress = formatLocationName(location);
    dispatch(setSelectedLocation(fullAddress));
    onBack();
  };

  const handleCurrentLocation = async () => {
    const result = await dispatch(getCurrentLocation());
    // After getting current location, fetch nearby locations if coordinates are available
    if (result.payload && result.payload.coordinates) {
      setIsFetchingNearby(true);
      dispatch(getNearbyLocations(result.payload.coordinates)).finally(() => {
        setIsFetchingNearby(false);
      });
    }
  };

  const handleCustomLocation = () => {
    if (searchText.trim()) {
      const customLocation = formatLocationName(searchText.trim());
      dispatch(addCustomLocation(customLocation));
      handleLocationSelect(customLocation);
    }
  };

  const handleSearchResultSelect = (result: any) => {
    dispatch(selectSearchResult({
      name: result.name,
      coordinates: result.coordinates,
      fullAddress: result.fullAddress,
      area: result.area,
      state: result.state
    }));
    
    // Log the selected location details for debugging
    console.log('📍 Selected Location:', {
      name: result.name,
      area: result.area,
      state: result.state,
      coordinates: result.coordinates,
      fullAddress: result.fullAddress
    });
    
    onBack();
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    dispatch(setSearchQuery(text));
    
    // Debounce search API calls
    if (text.trim().length >= 2) {
      console.log('Starting location search for:', text.trim());
      
      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      // Set new timeout for search
      searchTimeout.current = setTimeout(() => {
        console.log('Executing location search for:', text.trim());
        dispatch(searchLocations(text.trim()));
      }, 500);
    } else {
      // Clear search results if query is too short
      dispatch(setSearchQuery(''));
      // Restore nearby locations if coordinates are available
      if (coordinates) {
        setIsFetchingNearby(true);
        dispatch(getNearbyLocations(coordinates)).finally(() => {
          setIsFetchingNearby(false);
        });
      }
    }
  };

  const handleBack = () => {
    dispatch(clearSearchQuery());
    // Restore nearby locations if coordinates are available
    if (coordinates) {
      setIsFetchingNearby(true);
      dispatch(getNearbyLocations(coordinates)).finally(() => {
        setIsFetchingNearby(false);
      });
    }
    onBack();
  };

  const showSearchResults = searchText.trim().length >= 2 && searchResults.length > 0;
  
  // Show nearby areas from searchResults if available and not searching
  const showNearbyAreas = !showSearchResults && searchResults.length > 0 && !isFetchingNearby;
  const nearbyAreas = showNearbyAreas ? searchResults : [];

  // Debug logging
  useEffect(() => {
    console.log('Search debug:', {
      searchText: searchText.trim(),
      searchTextLength: searchText.trim().length,
      searchResults: searchResults,
      searchResultsLength: searchResults.length,
      showSearchResults,
      isSearching,
      searchError,
      showNearbyAreas,
      nearbyAreas: nearbyAreas.length
    });
  }, [searchText, searchResults, showSearchResults, isSearching, searchError, showNearbyAreas, nearbyAreas]);

  // Format location names to show full addresses
  const formatLocationName = (location: string) => {
    // If it's already in "City, State" format, add "India" to make it full address
    if (location.includes(',')) {
      return `${location}, India`;
    }
    // If it's just a city name, add "India" to make it full address
    return `${location}, India`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Select Location</Text>
              <Text style={styles.headerSubtitle}>Search for addresses or discover nearby areas</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
                 {/* Current Location Button */}
         <View style={styles.card}>
           <TouchableOpacity
             onPress={handleCurrentLocation}
             disabled={isLocationLoading}
             style={[
               styles.currentLocationButton,
               isLocationLoading && styles.currentLocationButtonDisabled
             ]}
           >
             <Ionicons 
               name={isLocationLoading ? "hourglass" : "locate"} 
               size={20} 
               color="#ffffff" 
             />
             <Text style={styles.currentLocationButtonText}>
               {isLocationLoading ? 'Getting location...' : 'Use Current Location'}
             </Text>
           </TouchableOpacity>
           {!coordinates && (
             <Text style={styles.locationPermissionText}>
               Enable location services to find nearby areas automatically
             </Text>
           )}
         </View>

         {/* Recent Searches */}
         {recentSearches.length > 0 && (
           <View style={styles.card}>
             <View style={styles.recentSearchesHeader}>
               <Text style={styles.sectionTitle}>Recent Searches</Text>
               <TouchableOpacity
                 onPress={() => dispatch(clearRecentSearches())}
                 style={styles.clearRecentButton}
               >
                 <Text style={styles.clearRecentText}>Clear</Text>
               </TouchableOpacity>
             </View>
             <View style={styles.recentSearchesList}>
               {recentSearches.map((search, index) => (
                 <TouchableOpacity
                   key={index}
                   onPress={() => {
                     const fullAddress = formatLocationName(search);
                     dispatch(setSelectedLocation(fullAddress));
                     onBack();
                   }}
                   style={styles.recentSearchItem}
                 >
                   <Ionicons name="time" size={16} color="#9ca3af" />
                   <Text style={styles.recentSearchText}>{formatLocationName(search)}</Text>
                   <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                 </TouchableOpacity>
               ))}
             </View>
           </View>
         )}

                 {/* Search Box */}
         <View style={styles.card}>
           <View style={styles.searchContainer}>
             <View style={styles.searchInputContainer}>
               <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
               <TextInput
                 style={styles.searchInput}
                 placeholder="Search for addresses, cities, or areas..."
                 value={searchText}
                 onChangeText={handleSearchChange}
                 placeholderTextColor="#9ca3af"
               />
               {searchText.length > 0 && (
                 <TouchableOpacity
                   onPress={() => {
                     setSearchText('');
                     dispatch(clearSearchQuery());
                     // Restore nearby locations if coordinates are available
                     if (coordinates) {
                       setIsFetchingNearby(true);
                       dispatch(getNearbyLocations(coordinates)).finally(() => {
                         setIsFetchingNearby(false);
                       });
                     }
                   }}
                   style={styles.clearButton}
                 >
                   <Ionicons name="close-circle" size={20} color="#9ca3af" />
                 </TouchableOpacity>
               )}
             </View>
             
               {/* Search Loading Indicator */}
               {isSearching && (
                 <View style={styles.searchLoadingContainer}>
                   <Ionicons name="hourglass" size={16} color="#6b7280" />
                   <Text style={styles.searchLoadingText}>Searching for locations...</Text>
                 </View>
               )}
             
             {/* Search Error */}
             {searchError && (
               <View style={styles.searchErrorContainer}>
                 <Ionicons name="alert-circle" size={16} color="#ef4444" />
                 <Text style={styles.searchErrorText}>Location search failed. Please try again.</Text>
               </View>
             )}
             
             {/* Custom Location Button */}
             {searchText.trim() && searchResults.length === 0 && !isSearching && (
               <TouchableOpacity
                 onPress={handleCustomLocation}
                 style={styles.customLocationButton}
               >
                 <Text style={styles.customLocationButtonText}>
                   Use "{formatLocationName(searchText.trim())}" as Location
                 </Text>
               </TouchableOpacity>
             )}
           </View>
         </View>

         {/* Search Results */}
         {showSearchResults && (
           <View style={styles.card}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Search Results</Text>
             </View>
             <View style={styles.locationsList}>
               {searchResults.map((result) => (
                 <TouchableOpacity
                   key={result.id}
                   onPress={() => handleSearchResultSelect(result)}
                   style={styles.locationItem}
                 >
                   <Ionicons name="location" size={16} color="#3b82f6" />
                   <View style={styles.locationTextContainer}>
                     <Text style={styles.locationText}>
                       {result.fullAddress || result.name}
                     </Text>
                     <Text style={styles.locationSubtext}>
                       {result.area}, {result.state}
                     </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                 </TouchableOpacity>
               ))}
             </View>
           </View>
         )}

                 {/* Suggested Locations - Only show when not searching */}
         {!showSearchResults && (
           <View style={[styles.card, styles.suggestedAreasCard]}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Nearby Areas</Text>
             </View>
             
             {/* Loading indicator for nearby locations */}
             {isFetchingNearby && (
               <View style={styles.searchLoadingContainer}>
                 <Ionicons name="hourglass" size={16} color="#6b7280" />
                 <Text style={styles.searchLoadingText}>Finding nearby areas...</Text>
               </View>
             )}
             
             <View style={styles.locationsList}>
               {showNearbyAreas && !isFetchingNearby ? (
                 // Show nearby areas from searchResults with full addresses
                 nearbyAreas.map((location) => (
                   <TouchableOpacity
                     key={location.id}
                     onPress={() => handleSearchResultSelect(location)}
                     style={[
                       styles.locationItem,
                       selectedLocation === (location.fullAddress || location.name) && styles.locationItemSelected
                     ]}
                   >
                     <Ionicons 
                       name="location" 
                       size={16} 
                       color={selectedLocation === (location.fullAddress || location.name) ? "#10b981" : "#9ca3af"} 
                     />
                     <View style={styles.locationTextContainer}>
                       <Text style={[
                         styles.locationText,
                         selectedLocation === (location.fullAddress || location.name) && styles.locationTextSelected
                       ]}>
                         {location.fullAddress || location.name}
                       </Text>
                       <Text style={styles.locationSubtext}>
                         {location.area}, {location.state}
                       </Text>
                       <Text style={styles.coordinateText}>
                         Lat: {location.coordinates?.latitude?.toFixed(6)}, Lng: {location.coordinates?.longitude?.toFixed(6)}
                       </Text>
                       {location.distance && (
                         <Text style={styles.distanceText}>
                           Distance: {location.distance.toFixed(2)}km
                         </Text>
                       )}
                     </View>
                     {selectedLocation === (location.fullAddress || location.name) && (
                       <View style={styles.selectedIndicator} />
                     )}
                   </TouchableOpacity>
                 ))
               ) : !isFetchingNearby ? (
                 // Show message when no nearby areas available
                 <View style={styles.noNearbyAreasContainer}>
                   <Ionicons name="location-outline" size={24} color="#9ca3af" />
                   <Text style={styles.noNearbyAreasText}>No nearby areas found</Text>
                   <Text style={styles.noNearbyAreasSubtext}>Enable location services to discover nearby areas</Text>
                 </View>
               ) : null}
             </View>
           </View>
         )}

          {/* Empty States */}
          {showSearchResults && searchResults.length === 0 && !isSearching && searchText.trim().length >= 2 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No locations found</Text>
              <Text style={styles.emptyStateSubtitle}>Try searching for a different location or area</Text>
            </View>
          )}
        </ScrollView>
      
      {/* Floating Scroll to Top Button */}
      {/* This block is removed as showScrollToTop is removed */}
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
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currentLocationButton: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  currentLocationButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  currentLocationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 44,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  customLocationButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  customLocationButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchLoadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  searchErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchErrorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearRecentButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearRecentText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  recentSearchesList: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  locationsList: {
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  locationItemSelected: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  locationTextSelected: {
    color: '#065f46',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  locationPermissionText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  suggestedAreasCard: {
    marginBottom: 16,
  },
  noNearbyAreasContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noNearbyAreasText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noNearbyAreasSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  coordinateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default LocationSelector;
