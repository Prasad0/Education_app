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
  selectedLocationData: { area: string; state: string } | null;
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
    distance?: number;
  }>;
  isSearching: boolean;
  searchError: string | null;
  recentSearches: string[];
}

const initialState: LocationState = {
  currentLocation: 'Getting location...',
  selectedLocation: '',
  coordinates: null,
  selectedLocationData: null,
  isLocationLoading: false,
  suggestedLocations: [],
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

// Helper function to calculate distance between two coordinates in kilometers
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

// Simple function to get nearby locations - just pass lat/lng coordinates
// Usage: dispatch(getNearbyLocations({ latitude: 19.0760, longitude: 72.8777 }))
// This will find all nearby areas within 10km of Mumbai coordinates
export const getNearbyLocations = createAsyncThunk(
  'location/getNearbyLocations',
  async (coordinates: { latitude: number; longitude: number }, { rejectWithValue }: any) => {
    try {
      console.log('Getting nearby locations for:', coordinates);
      
      // Simple OpenStreetMap search within 10km radius
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=&lat=${coordinates.latitude}&lon=${coordinates.longitude}&radius=10000&limit=20`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CoachingFinderApp/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OpenStreetMap response:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No nearby areas found');
        return [];
      }
      
      // Simple processing - just extract the essential info
      const nearbyAreas = data
        .filter((place: any) => place.address && place.lat && place.lon)
        .map((place: any, index: number) => {
          const address = place.address;
          const area = address.city || address.town || address.village || address.suburb || 'Unknown';
          const state = address.state || 'Unknown';
          
          return {
            id: `nearby_${index}_${Date.now()}`,
            name: `${area}, ${state}`,
            fullAddress: `${area}, ${state}, India`,
            coordinates: {
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon)
            },
            area: area,
            state: state,
            distance: calculateDistance(
              coordinates.latitude, 
              coordinates.longitude, 
              parseFloat(place.lat), 
              parseFloat(place.lon)
            )
          };
        })
        .filter(place => place.distance <= 10) // Only within 10km
        .sort((a, b) => a.distance - b.distance) // Sort by distance
        .slice(0, 10); // Limit to 10 results
      
      console.log('Found nearby areas:', nearbyAreas.length);
      return nearbyAreas;
      
    } catch (error: any) {
      console.error('Error getting nearby locations:', error);
      return rejectWithValue(error.message || 'Failed to get nearby locations');
    }
  }
);

// Helper function to get major cities for a specific state
function getStateCities(state: string): string[] {
  const stateCityMap: { [key: string]: string[] } = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
    'Delhi': ['New Delhi', 'Delhi Cantonment', 'Dwarka', 'Rohini', 'Pitampura'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Vellore'],
    'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Adilabad'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool']
  };
  
  return stateCityMap[state] || [];
}

// Helper function to get default Maharashtra cities
function getDefaultMaharashtraCities() {
  return [
    {
      id: 'mumbai_maharashtra',
      name: 'Mumbai, Maharashtra',
      fullAddress: 'Mumbai, Maharashtra, India',
      coordinates: { latitude: 19.0760, longitude: 72.8777 },
      area: 'Mumbai',
      state: 'Maharashtra'
    },
    {
      id: 'pune_maharashtra',
      name: 'Pune, Maharashtra',
      fullAddress: 'Pune, Maharashtra, India',
      coordinates: { latitude: 18.5204, longitude: 73.8567 },
      area: 'Pune',
      state: 'Maharashtra'
    },
    {
      id: 'nagpur_maharashtra',
      name: 'Nagpur, Maharashtra',
      fullAddress: 'Nagpur, Maharashtra, India',
      coordinates: { latitude: 21.1458, longitude: 79.0882 },
      area: 'Nagpur',
      state: 'Maharashtra'
    },
    {
      id: 'thane_maharashtra',
      name: 'Thane, Maharashtra',
      fullAddress: 'Thane, Maharashtra, India',
      coordinates: { latitude: 19.2183, longitude: 72.9781 },
      area: 'Thane',
      state: 'Maharashtra'
    },
    {
      id: 'nashik_maharashtra',
      name: 'Nashik, Maharashtra',
      fullAddress: 'Nashik, Maharashtra, India',
      coordinates: { latitude: 19.9975, longitude: 73.7898 },
      area: 'Nashik',
      state: 'Maharashtra'
    }
  ];
}

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
      // Only clear search results when clearing the query, not when setting a new one
      if (!action.payload.trim()) {
        state.filteredLocations = [];
        state.searchResults = [];
      } else {
        // Filter locations based on search query
        state.filteredLocations = state.suggestedLocations.filter(location =>
          location.toLowerCase().includes(action.payload.toLowerCase())
        );
        // Don't clear searchResults here - let the search API handle it
      }
    },
    clearSearchQuery: (state) => {
      state.searchQuery = '';
      state.filteredLocations = [];
      state.searchResults = []; // Clear search results to allow nearby locations to show
      // Restore nearby locations when search is cleared
      if (state.coordinates) {
        // This will be handled by the component to fetch nearby locations
      }
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
      fullAddress?: string;
      area?: string;
      state?: string;
    }>) => {
      const { name, coordinates, fullAddress, area, state: stateName } = action.payload;
      state.selectedLocation = fullAddress || name;
      // Store the coordinates for API calls
      if (coordinates) {
        state.coordinates = coordinates;
      }
      // Store the area and state for display
      if (area && stateName) {
        state.selectedLocationData = { area, state: stateName };
      }
      // Add to recent searches
      if (!state.recentSearches.includes(name)) {
        state.recentSearches.unshift(name);
        if (state.recentSearches.length > 10) {
          state.recentSearches.pop();
        }
      }
    },
    resetLocation: (state) => {
      state.selectedLocation = '';
      state.coordinates = null;
      state.isLocationLoading = false;
    },
    deselectLocation: (state) => {
      state.selectedLocation = '';
      state.selectedLocationData = null;
      // Keep coordinates for current location but clear selected location
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
        // After getting current location, fetch nearby locations
        if (action.payload.coordinates) {
          // This will be handled by the component
        }
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLocationLoading = false;
        state.currentLocation = action.payload as string || 'Location unavailable';
      })
      // Get Nearby Locations
      .addCase(getNearbyLocations.pending, (state) => {
        // Don't set loading state for nearby locations as it's background operation
      })
      .addCase(getNearbyLocations.fulfilled, (state, action) => {
        // Update suggested locations with nearby areas
        if (action.payload && action.payload.length > 0) {
          // Store the full location objects for better display
          state.suggestedLocations = action.payload.map((location: any) => location.name);
          // Only update searchResults if there are no active search results or search query
          if (state.searchResults.length === 0 && !state.searchQuery.trim()) {
            state.searchResults = action.payload;
          }
        }
      })
      .addCase(getNearbyLocations.rejected, (state) => {
        // Keep existing suggested locations if nearby locations fail
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
  deselectLocation,
  clearRecentSearches
} = locationSlice.actions;

export default locationSlice.reducer;
