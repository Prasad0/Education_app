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
  clearRecentSearches
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
    suggestedLocations, 
    searchQuery, 
    filteredLocations,
    searchResults,
    isSearching,
    searchError,
    recentSearches
  } = useAppSelector(state => state.location);

  const [searchText, setSearchText] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleLocationSelect = (location: string) => {
    dispatch(setSelectedLocation(location));
    onBack();
  };

  const handleCurrentLocation = () => {
    dispatch(getCurrentLocation());
  };

  const handleCustomLocation = () => {
    if (searchText.trim()) {
      const customLocation = searchText.trim();
      dispatch(addCustomLocation(customLocation));
      handleLocationSelect(customLocation);
    }
  };

  const handleSearchResultSelect = (result: any) => {
    dispatch(selectSearchResult({
      name: result.name,
      coordinates: result.coordinates
    }));
    onBack();
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    dispatch(setSearchQuery(text));
    
    // Debounce search API calls
    if (text.trim().length >= 2) {
      console.log('Starting search for:', text.trim());
      
      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      // Set new timeout for search
      searchTimeout.current = setTimeout(() => {
        console.log('Executing search for:', text.trim());
        dispatch(searchLocations(text.trim()));
      }, 500);
    } else {
      // Clear search results if query is too short
      dispatch(setSearchQuery(''));
    }
  };

  const handleBack = () => {
    dispatch(clearSearchQuery());
    onBack();
  };

  const displayLocations = searchText.trim() ? filteredLocations : suggestedLocations;
  const showSearchResults = searchText.trim().length >= 2 && searchResults.length > 0;

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
              <Text style={styles.headerSubtitle}>Choose your preferred location</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                     dispatch(setSelectedLocation(search));
                     onBack();
                   }}
                   style={styles.recentSearchItem}
                 >
                   <Ionicons name="time" size={16} color="#9ca3af" />
                   <Text style={styles.recentSearchText}>{search}</Text>
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
                 placeholder="Search for areas like Andheri, Borivali..."
                 value={searchText}
                 onChangeText={handleSearchChange}
                 placeholderTextColor="#9ca3af"
               />
               {searchText.length > 0 && (
                 <TouchableOpacity
                   onPress={() => {
                     setSearchText('');
                     dispatch(clearSearchQuery());
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
                 <Text style={styles.searchErrorText}>{searchError}</Text>
               </View>
             )}
             
             {/* Custom Location Button */}
             {searchText.trim() && !suggestedLocations.some(loc => 
               loc.toLowerCase() === searchText.toLowerCase()
             ) && searchResults.length === 0 && !isSearching && (
               <TouchableOpacity
                 onPress={handleCustomLocation}
                 style={styles.customLocationButton}
               >
                 <Text style={styles.customLocationButtonText}>
                   Use "{searchText.trim()}"
                 </Text>
               </TouchableOpacity>
             )}
           </View>
         </View>

         {/* Search Results */}
         {showSearchResults && (
           <View style={styles.card}>
             <Text style={styles.sectionTitle}>Search Results</Text>
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
                       {result.name}
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
           <View style={styles.card}>
             <Text style={styles.sectionTitle}>Suggested Locations</Text>
             <View style={styles.locationsList}>
               {displayLocations.map((location) => (
                 <TouchableOpacity
                   key={location}
                   onPress={() => handleLocationSelect(location)}
                   style={[
                     styles.locationItem,
                     selectedLocation === location && styles.locationItemSelected
                   ]}
                 >
                   <Ionicons 
                     name="location" 
                     size={16} 
                     color={selectedLocation === location ? "#10b981" : "#9ca3af"} 
                   />
                   <View style={styles.locationTextContainer}>
                     <Text style={[
                       styles.locationText,
                       selectedLocation === location && styles.locationTextSelected
                     ]}>
                       {location}
                     </Text>
                   </View>
                   {selectedLocation === location && (
                     <View style={styles.selectedIndicator} />
                   )}
                 </TouchableOpacity>
               ))}
             </View>
           </View>
         )}

                 {/* Empty States */}
         {showSearchResults && searchResults.length === 0 && !isSearching && searchText.trim().length >= 2 && (
           <View style={styles.emptyState}>
             <Ionicons name="search-outline" size={48} color="#d1d5db" />
             <Text style={styles.emptyStateTitle}>No search results found</Text>
             <Text style={styles.emptyStateSubtitle}>Try a different city name or location</Text>
           </View>
         )}
         
         {!showSearchResults && displayLocations.length === 0 && (
           <View style={styles.emptyState}>
             <Ionicons name="location-outline" size={48} color="#d1d5db" />
             <Text style={styles.emptyStateTitle}>No suggested locations</Text>
             <Text style={styles.emptyStateSubtitle}>Try searching for a specific city</Text>
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
});

export default LocationSelector;
