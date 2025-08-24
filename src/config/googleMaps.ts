// Location Search API Configuration
// PRIMARY: OpenStreetMap Nominatim (free, always works, good accuracy)
// OPTIONAL: Google Maps Places API (better accuracy, requires API key)

// OpenStreetMap Configuration (Free, always works, PRIMARY PROVIDER)
export const OPENSTREETMAP_CONFIG = {
  BASE_URL: 'https://nominatim.openstreetmap.org/search',
  PARAMS: {
    countrycodes: 'in',
    format: 'json',
    limit: 8,
    addressdetails: 1,
  },
  // Add headers to prevent rate limiting and improve reliability
  HEADERS: {
    'User-Agent': 'CoachingFinderApp/1.0',
    'Accept': 'application/json',
  },
  // Rate limiting configuration
  RATE_LIMIT: {
    REQUESTS_PER_SECOND: 1,
    DELAY_BETWEEN_REQUESTS: 1000, // 1 second
  },
};

// Google Maps API Configuration (Optional, requires API key)
// Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual Google Maps API key
export const GOOGLE_MAPS_API_KEY = 'AIzaSyASk5qR1wBebzsffrp-MakX3od6UT-dN9U';

// Google Maps API endpoints
export const GOOGLE_MAPS_ENDPOINTS = {
  // Updated to use the modern Places API (New) instead of legacy
  PLACES_AUTOCOMPLETE: 'https://places.googleapis.com/v1/places:autocomplete',
  PLACE_DETAILS: 'https://places.googleapis.com/v1/places',
  // Keep legacy endpoints as fallback if needed
  LEGACY_PLACES_AUTOCOMPLETE: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
  LEGACY_PLACE_DETAILS: 'https://maps.googleapis.com/maps/api/place/details/json',
};

// Google Maps API parameters
export const GOOGLE_MAPS_PARAMS = {
  TYPES: ['locality', 'administrative_area_level_1'], // Updated for new API format
  COMPONENTS: 'country:in', // Keep for reference but will be formatted in the request
  FIELDS: 'name,formatted_address,geometry',
  LIMIT: 5,
};

// Search Configuration
export const SEARCH_CONFIG = {
  // Set to 'openstreetmap' to use OpenStreetMap (free, always works)
  // Set to 'google' to use Google Maps API (requires valid API key) - TEMPORARILY SWITCHED TO OPENSTREETMAP
  PRIMARY_PROVIDER: 'openstreetmap',
  
  // Fallback provider if primary fails
  FALLBACK_PROVIDER: 'google',
  
  // Search delay in milliseconds (debouncing)
  SEARCH_DELAY: 500,
  
  // Minimum characters to start search
  MIN_SEARCH_LENGTH: 2,
  
  // Retry configuration for failed searches
  RETRY_CONFIG: {
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
  },
};
