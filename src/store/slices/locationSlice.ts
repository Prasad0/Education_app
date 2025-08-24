import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { 
  GOOGLE_MAPS_API_KEY, 
  GOOGLE_MAPS_ENDPOINTS, 
  GOOGLE_MAPS_PARAMS,
  OPENSTREETMAP_CONFIG,
  SEARCH_CONFIG
} from '../../config/googleMaps';

interface LocationState {
  currentLocation: string;
  selectedLocation: string;
  coordinates: { latitude: number; longitude: number } | null;
  isLocationLoading: boolean;
  suggestedLocations: string[];
  searchQuery: string;
  filteredLocations: string[];
  searchResults: Array<{
    id: string;
    name: string;
    coordinates: { latitude: number; longitude: number };
    fullAddress: string;
    area: string;
    state: string;
  }>;
  isSearching: boolean;
  searchError: string | null;
  recentSearches: string[];
}

const initialState: LocationState = {
  currentLocation: 'Getting location...',
  selectedLocation: '',
  coordinates: null,
  isLocationLoading: false,
  suggestedLocations: [
    'Mumbai, Maharashtra',
    'Pune, Maharashtra',
    'Nagpur, Maharashtra',
    'Thane, Maharashtra',
    'Nashik, Maharashtra',
    'Aurangabad, Maharashtra',
    'Solapur, Maharashtra',
    'Kolhapur, Maharashtra'
  ],
  searchQuery: '',
  filteredLocations: [],
  searchResults: [],
  isSearching: false,
  searchError: null,
  recentSearches: []
};

// Async thunk for getting current location
export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async (profileCoordinates: { latitude: number; longitude: number } | undefined, { rejectWithValue }: any) => {
    try {
      let latitude: number;
      let longitude: number;
      
      if (profileCoordinates) {
        // Use profile coordinates if provided
        latitude = profileCoordinates.latitude;
        longitude = profileCoordinates.longitude;
      } else {
        // Check location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return rejectWithValue('Location permission denied');
        }
        
        // Get current position
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 10,
        });
        
        latitude = currentLocation.coords.latitude;
        longitude = currentLocation.coords.longitude;
      }
      
      // Reverse geocode to get address
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (result.length > 0) {
        const place = result[0];
        const parts = [];
        
        if (place.city) parts.push(place.city);
        if (place.region) parts.push(place.region);
        
        const address = parts.join(', ') || 'Unknown location';
        return {
          address,
          coordinates: { latitude, longitude }
        };
      }
      
      return rejectWithValue('Could not get address');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get location');
    }
  }
);

// Async thunk for searching locations with smart provider selection
export const searchLocations = createAsyncThunk(
  'location/searchLocations',
  async (query: string, { rejectWithValue }: any) => {
    try {
      if (!query.trim() || query.trim().length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
        return [];
      }

      console.log('Searching for:', query);
      
      // Try Google Maps first (better accuracy)
      if (SEARCH_CONFIG.PRIMARY_PROVIDER === 'google') {
        try {
          console.log('Trying Google Maps API first...');
          const googleResults = await searchWithGoogleMaps(query);
          if (googleResults && googleResults.length > 0) {
            console.log('Google Maps results:', googleResults);
            return googleResults;
          }
        } catch (googleError) {
          console.error('Google Maps API failed, falling back to OpenStreetMap:', googleError);
        }
      }

      // Fallback to OpenStreetMap (always works, free)
      console.log('Using OpenStreetMap fallback...');
      return await searchWithOpenStreetMap(query);
    } catch (error: any) {
      console.error('Location search error:', error);
      return rejectWithValue('Search failed. Please try again.');
    }
  }
);

// Helper function for Google Maps search
async function searchWithGoogleMaps(query: string) {
  try {
    // Use the modern Places API (New) format
    const searchQuery = encodeURIComponent(`${query}, India`);
    const url = `${GOOGLE_MAPS_ENDPOINTS.PLACES_AUTOCOMPLETE}`;
    
    console.log('Google Maps Autocomplete URL:', url);
    
    const requestBody = {
      input: `${query}, India`,
      types: GOOGLE_MAPS_PARAMS.TYPES,
      components: [{ country: 'in' }],
      maxResultCount: GOOGLE_MAPS_PARAMS.LIMIT,
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.id,places.types,places.formattedAddress,places.location',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Google Maps response status:', response.status);
    console.log('Google Maps response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Maps response error text:', errorText);
      throw new Error(`Google Places API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google Maps response data:', data);
    
    if (!data.places || data.places.length === 0) {
      console.log('No places found in Google Maps response');
      return [];
    }

    // Format the results from the new API structure
    const formattedResults = data.places
      .slice(0, GOOGLE_MAPS_PARAMS.LIMIT)
      .map((place: any) => {
        try {
          // Parse the formatted address to extract area and state
          const addressParts = place.formattedAddress?.split(', ') || [];
          let area = '';
          let state = '';
          
          // Look for area (usually first part) and state (usually last part)
          if (addressParts.length >= 2) {
            area = addressParts[0].trim();
            state = addressParts[addressParts.length - 1].trim();
            
            // Clean up state name (remove "India" if present)
            if (state.toLowerCase() === 'india') {
              state = addressParts[addressParts.length - 2] || '';
            }
          }
          
          return {
            id: place.id,
            name: `${area}, ${state}`.trim(),
            coordinates: {
              latitude: place.location?.latitude || 0,
              longitude: place.location?.longitude || 0,
            },
            fullAddress: place.formattedAddress || '',
            area: area,
            state: state
          };
        } catch (error) {
          console.error('Error formatting place:', error);
          return null;
        }
      })
      .filter((result: any) => result !== null && result.name && result.name !== ', ')
      .slice(0, 8);

    console.log('Formatted Google Maps results:', formattedResults);
    return formattedResults;
    
  } catch (error) {
    console.error('Google Maps fetch error:', error);
    throw error;
  }
}

// Helper function for OpenStreetMap search
async function searchWithOpenStreetMap(query: string) {
  try {
    const searchQuery = encodeURIComponent(`${query}, India`);
    const url = `${OPENSTREETMAP_CONFIG.BASE_URL}?q=${searchQuery}&countrycodes=${OPENSTREETMAP_CONFIG.PARAMS.countrycodes}&format=${OPENSTREETMAP_CONFIG.PARAMS.format}&limit=${OPENSTREETMAP_CONFIG.PARAMS.limit}&addressdetails=${OPENSTREETMAP_CONFIG.PARAMS.addressdetails}`;
    
    console.log('Searching with OpenStreetMap:', url);
    
    const response = await fetch(url, {
      headers: OPENSTREETMAP_CONFIG.HEADERS,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenStreetMap response error:', response.status, errorText);
      throw new Error(`OpenStreetMap search request failed: ${response.status} - ${errorText}`);
    }
    
    const results = await response.json();
    console.log('OpenStreetMap results:', results);
    
    if (!Array.isArray(results)) {
      throw new Error('OpenStreetMap returned invalid data format');
    }
    
    const formattedResults = results
      .filter((result: any) => {
        const address = result.address;
        return address && (address.city || address.town || address.district);
      })
      .map((result: any) => {
        const address = result.address;
        let area = address.city || address.town || address.district || '';
        let state = address.state || '';
        
        if (area.includes('District')) {
          area = area.replace('District', '').trim();
        }
        
        return {
          id: result.place_id,
          name: `${area}, ${state}`.trim(),
          coordinates: {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          },
          fullAddress: result.display_name,
          area: area,
          state: state
        };
      })
      .filter((result: any) => result.name && result.name !== ', ')
      .slice(0, 8);

    console.log('Formatted results:', formattedResults);
    return formattedResults;
  } catch (error: any) {
    console.error('OpenStreetMap search error:', error);
    throw new Error(`OpenStreetMap search failed: ${error.message}`);
  }
}

// Async thunk for reverse geocoding coordinates
export const reverseGeocode = createAsyncThunk(
  'location/reverseGeocode',
  async (coordinates: { latitude: number; longitude: number }, { rejectWithValue }: any) => {
    try {
      const result = await Location.reverseGeocodeAsync(coordinates);
      
      if (result.length > 0) {
        const place = result[0];
        const parts = [];
        
        if (place.city) parts.push(place.city);
        if (place.region) parts.push(place.region);
        
        return parts.join(', ') || 'Unknown location';
      }
      
      return rejectWithValue('Could not get address');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reverse geocode');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<string>) => {
      state.selectedLocation = action.payload;
      state.currentLocation = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      // Filter locations based on search query
      if (action.payload.trim()) {
        state.filteredLocations = state.suggestedLocations.filter(location =>
          location.toLowerCase().includes(action.payload.toLowerCase())
        );
      } else {
        state.filteredLocations = [];
      }
    },
    clearSearchQuery: (state) => {
      state.searchQuery = '';
      state.filteredLocations = [];
    },
    setLocationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLocationLoading = action.payload;
    },
    addCustomLocation: (state, action: PayloadAction<string>) => {
      const customLocation = action.payload;
      if (!state.suggestedLocations.includes(customLocation)) {
        state.suggestedLocations.unshift(customLocation);
      }
    },
    selectSearchResult: (state, action: PayloadAction<{
      name: string;
      coordinates: { latitude: number; longitude: number };
    }>) => {
      state.selectedLocation = action.payload.name;
      state.currentLocation = action.payload.name;
      state.coordinates = action.payload.coordinates;
      state.searchResults = [];
      state.searchQuery = '';
      
      // Add to recent searches
      const searchTerm = action.payload.name;
      if (!state.recentSearches.includes(searchTerm)) {
        state.recentSearches.unshift(searchTerm);
        // Keep only last 5 searches
        if (state.recentSearches.length > 5) {
          state.recentSearches = state.recentSearches.slice(0, 5);
        }
      }
    },
    resetLocation: (state) => {
      state.selectedLocation = '';
      state.coordinates = null;
      state.isLocationLoading = false;
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Current Location
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLocationLoading = true;
        state.currentLocation = 'Getting location...';
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLocationLoading = false;
        state.currentLocation = action.payload.address;
        state.coordinates = action.payload.coordinates;
        if (!state.selectedLocation) {
          state.selectedLocation = action.payload.address;
        }
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLocationLoading = false;
        state.currentLocation = action.payload as string || 'Location unavailable';
      })
      // Reverse Geocode
      .addCase(reverseGeocode.pending, (state) => {
        state.isLocationLoading = true;
      })
      .addCase(reverseGeocode.fulfilled, (state, action) => {
        state.isLocationLoading = false;
        state.currentLocation = action.payload;
        if (!state.selectedLocation) {
          state.selectedLocation = action.payload;
        }
      })
      .addCase(reverseGeocode.rejected, (state, action) => {
        state.isLocationLoading = false;
        state.currentLocation = action.payload as string || 'Location unavailable';
      })
      // Search Locations
      .addCase(searchLocations.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
        state.searchResults = [];
      })
      .addCase(searchLocations.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
        state.searchError = null;
      })
      .addCase(searchLocations.rejected, (state, action) => {
        state.isSearching = false;
        state.searchResults = [];
        state.searchError = action.payload as string || 'Search failed';
      });
  },
});

export const { 
  setSelectedLocation, 
  setSearchQuery, 
  clearSearchQuery, 
  setLocationLoading, 
  addCustomLocation, 
  selectSearchResult,
  resetLocation,
  clearRecentSearches
} = locationSlice.actions;

export default locationSlice.reducer;
