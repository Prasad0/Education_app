import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../config/api';

export interface CoachingCenter {
  id: string;
  name?: string;
  branch_name?: string;
  tagline?: string;
  className?: string;
  fees?: string;
  fees_display?: string;
  startDate?: string;
  seatsLeft?: number;
  available_seats?: number;
  rating?: number;
  average_rating?: number;
  reviews?: number;
  total_reviews?: number;
  images?: string[];
  gallery_images?: string[];
  featured_image?: any;
  distance?: string | number;
  location?: string;
  phone?: string;
  contact_number?: string;
  description?: string;
  subjects?: string[];
  subjects_offered?: string[];
  facilities?: string[];
  amenities?: string[];
  timings?: string;
  batch_timings?: any[];
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  coaching_type?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  is_favorited?: boolean;
  icon?: string;
  slug?: string;
  uuid?: string;
}

export interface CoachingSearchParams {
  search?: string;
  location?: string;
  city?: string;
  subject?: string;
  board?: string;
  exam?: string;
  coaching_type?: 'offline' | 'online' | 'hybrid';
  budget_min?: number;
  budget_max?: number;
  rating_min?: number;
  distance_max?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface CoachingState {
  coachingCenters: CoachingCenter[];
  filteredCenters: CoachingCenter[];
  isLoading: boolean;
  error: string | null;
  searchParams: CoachingSearchParams;
  activeTab: 'offline' | 'online' | 'starred';
  starredCenters: string[]; // Array of coaching center IDs
}

// Helper function to validate image URLs
const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If it's not a valid URL, it might be a local asset
    return url.startsWith('data:') || url.startsWith('file:') || url.startsWith('/');
  }
};

// Function to transform API data to match our interface
const transformApiData = (apiData: any): CoachingCenter[] => {
  try {
    // Validate input
    if (!apiData) {
      console.warn('transformApiData: apiData is null/undefined');
      return [];
    }
    
    if (!Array.isArray(apiData)) {
      console.warn('transformApiData: apiData is not an array:', typeof apiData, apiData);
      return [];
    }
    
    return apiData.map(item => {
      // Filter out invalid image URLs
      const validGalleryImages = (item.gallery_images || []).filter(isValidImageUrl);
      const validImages = (item.images || []).filter(isValidImageUrl);
      
      return {
        id: item.id?.toString() || item.uuid || '',
        name: item.branch_name || item.name || '',
        tagline: item.tagline || '',
        className: item.target_exams?.join(', ') || '',
        fees: item.fees_display || item.fees || '',
        startDate: '', // Not provided in API
        seatsLeft: item.available_seats || 0,
        rating: item.average_rating || item.rating || 0,
        reviews: item.total_reviews || item.reviews || 0,
        images: validImages,
        distance: typeof item.distance === 'number' ? `${item.distance} km` : item.distance || '',
        location: item.city || item.location || '',
        phone: item.contact_number || item.phone || '',
        description: item.description || '',
        subjects: item.subjects_offered || item.subjects || [],
        facilities: item.amenities || item.facilities || [],
        timings: '', // Not provided in API
        address: '', // Not provided in API
        pincode: '', // Not provided in API
        city: item.city || '',
        state: item.state || '',
        // Keep original API fields
        branch_name: item.branch_name,
        fees_display: item.fees_display,
        available_seats: item.available_seats,
        average_rating: item.average_rating,
        total_reviews: item.total_reviews,
        gallery_images: validGalleryImages,
        featured_image: item.featured_image,
        contact_number: item.contact_number,
        subjects_offered: item.subjects_offered,
        amenities: item.amenities,
        batch_timings: item.batch_timings,
        coaching_type: item.coaching_type,
        is_featured: item.is_featured,
        is_verified: item.is_verified,
        is_favorited: item.is_favorited,
        icon: item.icon,
        slug: item.slug,
        uuid: item.uuid,
      };
    });
  } catch (error) {
    console.error('Error in transformApiData:', error);
    return [];
  }
};

// Mock data for development
const mockCoachingCenters: CoachingCenter[] = [
  {
    id: '1',
    name: 'Excellence Academy',
    tagline: 'Building Future Engineers',
    className: 'JEE Main & Advanced',
    fees: '₹45,000 - ₹65,000',
    startDate: 'Feb 15, 2025',
    seatsLeft: 5,
    rating: 4.8,
    reviews: 324,
    images: [], // Removed invalid image URLs to prevent crashes
    distance: '0.8 km',
    location: 'Koramangala',
    phone: '+91 98765 43210',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
  },
  {
    id: '2',
    name: 'Smart Learning Hub',
    tagline: 'Your Medical Dreams Start Here',
    className: 'NEET Preparation',
    fees: '₹38,000 - ₹55,000',
    startDate: 'Mar 1, 2025',
    seatsLeft: 12,
    rating: 4.6,
    reviews: 187,
    images: [], // Removed invalid image URLs to prevent crashes
    distance: '1.2 km',
    location: 'BTM Layout',
    phone: '+91 98765 43211',
    subjects: ['Physics', 'Chemistry', 'Biology'],
  },
  {
    id: '3',
    name: 'Future Minds Institute',
    tagline: 'Excellence in Education',
    className: 'Class 12 Physics & Chemistry',
    fees: '₹25,000 - ₹35,000',
    startDate: 'Feb 20, 2025',
    seatsLeft: 3,
    rating: 4.9,
    reviews: 456,
    images: [], // Removed invalid image URLs to prevent crashes
    distance: '2.1 km',
    location: 'Jayanagar',
    phone: '+91 98765 43212',
    subjects: ['Physics', 'Chemistry'],
  },
  {
    id: '4',
    name: 'Bright Career Academy',
    tagline: 'Shaping Tomorrow\'s CAs',
    className: 'CA Foundation',
    fees: '₹20,000 - ₹30,000',
    startDate: 'Mar 10, 2025',
    seatsLeft: 8,
    rating: 4.4,
    reviews: 92,
    images: [], // Removed invalid image URLs to prevent crashes
    distance: '1.5 km',
    location: 'Indiranagar',
    phone: '+91 98765 43213',
    subjects: ['Mathematics', 'English'],
  }
];

// Function to get fallback data when API fails
const getFallbackData = (): CoachingCenter[] => {
  console.log('Using fallback mock data');
  return [...mockCoachingCenters];
};

const initialState: CoachingState = {
  coachingCenters: mockCoachingCenters,
  filteredCenters: mockCoachingCenters,
  isLoading: false,
  error: null,
  searchParams: {},
  activeTab: 'offline',
  starredCenters: [],
};

// Async thunk for fetching coaching centers
export const fetchCoachingCenters = createAsyncThunk(
  'coaching/fetchCoachingCenters',
  async (params: CoachingSearchParams = {}, { getState, rejectWithValue }) => {
    try {
      // Check authentication status before making API call
      const state = getState() as any;
      const isAuthenticated = state.auth?.isAuthenticated;
      const accessToken = state.auth?.accessToken;
      
      if (!isAuthenticated || !accessToken) {
        console.log('fetchCoachingCenters: User not authenticated, using fallback data');
        return getFallbackData();
      }
      
      console.log('fetchCoachingCenters: Starting with params:', params);
      
      // Add pagination parameters to get all results
      const apiParams = {
        ...params,
        page_size: 100, // Set a large page size to get all results
        page: 1,        // Start from first page
        limit: 100,     // Alternative parameter name
        per_page: 100,  // Another common alternative
        size: 100,      // Yet another alternative
      };
      
      const response = await api.get('/coachings/', { params: apiParams });
      console.log('fetchCoachingCenters: API response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        totalCount: response.data?.count || response.data?.total || 'unknown',
        pageSize: response.data?.page_size || 'unknown',
        currentPage: response.data?.page || 'unknown'
      });
      
      // Check if we need to fetch more pages to get all results
      let allData: any[] = [];
      if (response.data?.count && response.data?.results && Array.isArray(response.data.results)) {
        const totalCount = response.data.count;
        const currentPageSize = response.data.results.length;
        const currentPage = response.data.page || 1;
        
        console.log(`fetchCoachingCenters: Pagination info - Total: ${totalCount}, Current Page: ${currentPage}, Current Page Size: ${currentPageSize}`);
        
        // If we got fewer results than total count, try to fetch more pages
        if (currentPageSize < totalCount && totalCount > 100) {
          console.log('fetchCoachingCenters: Need to fetch more pages to get all results');
          
          // Start with current results
          allData = [...response.data.results];
          
          // Calculate how many more pages we need
          const totalPages = Math.ceil(totalCount / 100);
          console.log(`fetchCoachingCenters: Total pages needed: ${totalPages}`);
          
          // Fetch remaining pages
          for (let page = 2; page <= totalPages; page++) {
            try {
              const nextPageParams = { ...apiParams, page };
              console.log(`fetchCoachingCenters: Fetching page ${page}...`);
              
              const nextPageResponse = await api.get('/coachings/', { params: nextPageParams });
              if (nextPageResponse.data?.results && Array.isArray(nextPageResponse.data.results)) {
                allData = [...allData, ...nextPageResponse.data.results];
                console.log(`fetchCoachingCenters: Page ${page} fetched, total results so far: ${allData.length}`);
              }
            } catch (pageError) {
              console.warn(`fetchCoachingCenters: Error fetching page ${page}:`, pageError);
              break; // Stop fetching if we encounter an error
            }
          }
          
          console.log(`fetchCoachingCenters: Final total results after fetching all pages: ${allData.length}`);
        } else {
          // We got all results in one page
          allData = response.data.results;
        }
      } else {
        // Not paginated or different structure - handle different response structures
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Direct array response
            allData = response.data;
            console.log('fetchCoachingCenters: Using direct array response, length:', allData.length);
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // Paginated response with results array
            allData = response.data.results;
            console.log('fetchCoachingCenters: Using paginated results, length:', allData.length);
            console.log('fetchCoachingCenters: Total count from API:', response.data.count);
            console.log('fetchCoachingCenters: Page size from API:', response.data.page_size);
            console.log('fetchCoachingCenters: Current page from API:', response.data.page);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Nested data response
            allData = response.data.data;
            console.log('fetchCoachingCenters: Using nested data, length:', allData.length);
          } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
            // Specific key response
            allData = response.data.coaching_centers;
            console.log('fetchCoachingCenters: Using coaching_centers key, length:', allData.length);
          } else {
            console.warn('fetchCoachingCenters: Unknown response structure:', response.data);
            console.log('fetchCoachingCenters: Available keys:', Object.keys(response.data));
            allData = [];
          }
        } else {
          console.warn('fetchCoachingCenters: No response data');
          allData = [];
        }
      }
      
      // Validate and transform the response data
      try {
        console.log('fetchCoachingCenters: About to transform data, length:', allData.length);
        const transformedData = transformApiData(allData);
        console.log('fetchCoachingCenters: Transformation successful, transformed length:', transformedData.length);
        
        // If transformation returns empty array and we have data, use fallback
        if (transformedData.length === 0 && allData.length > 0) {
          console.warn('fetchCoachingCenters: Transformation returned empty array, using fallback data');
          return getFallbackData();
        }
        
        // Final safety check - if we still have no data, use fallback
        if (transformedData.length === 0) {
          console.warn('fetchCoachingCenters: No data after transformation, using fallback data');
          return getFallbackData();
        }
        
        return transformedData;
      } catch (transformError) {
        console.error('Error transforming API data:', transformError);
        console.error('Data that failed to transform:', allData);
        // Return fallback data if transformation fails
        console.log('fetchCoachingCenters: Using fallback data due to transformation error');
        return getFallbackData();
      }
    } catch (error: any) {
      console.error('fetchCoachingCenters: API call failed:', error);
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        console.log('fetchCoachingCenters: 401 Unauthorized, using fallback data instead of clearing tokens');
        // Don't clear tokens here - let the auth slice handle logout
        // Just return fallback data to prevent the error from bubbling up
        return getFallbackData();
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coaching centers');
    }
  }
);

// Async thunk for searching coaching centers
export const searchCoachingCenters = createAsyncThunk(
  'coaching/searchCoachingCenters',
  async (searchTerm: string, { getState, rejectWithValue }) => {
    try {
      // Check authentication status before making API call
      const state = getState() as any;
      const isAuthenticated = state.auth?.isAuthenticated;
      const accessToken = state.auth?.accessToken;
      
      if (!isAuthenticated || !accessToken) {
        console.log('searchCoachingCenters: User not authenticated, using fallback data');
        return getFallbackData();
      }
      
      console.log('searchCoachingCenters: Starting with search term:', searchTerm);
      
      const coordinates = state.location.coordinates;
      
      // Build query parameters with coordinates from state
      const params = {
        search: searchTerm,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude
      };
      
      console.log('searchCoachingCenters: API call params:', params);
      
      // Add pagination parameters to get all search results
      const apiParams = {
        ...params,
        page_size: 100, // Set a large page size to get all results
        page: 1,        // Start from first page
        limit: 100,     // Alternative parameter name
        per_page: 100,  // Another common alternative
        size: 100,      // Yet another alternative
      };
      
      const response = await api.get('/coachings/', { params: apiParams });
      console.log('searchCoachingCenters: API response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        totalCount: response.data?.count || response.data?.total || 'unknown',
        pageSize: response.data?.page_size || 'unknown',
        currentPage: response.data?.page || 'unknown'
      });
      
      // Handle different possible API response structures
      let dataToTransform: any[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          dataToTransform = response.data;
          console.log('searchCoachingCenters: Using direct array response, length:', dataToTransform.length);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response with results array
          dataToTransform = response.data.results;
          console.log('searchCoachingCenters: Using paginated results, length:', dataToTransform.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested data response
          dataToTransform = response.data.data;
          console.log('searchCoachingCenters: Using nested data, length:', dataToTransform.length);
        } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
          // Specific key response
          dataToTransform = response.data.coaching_centers;
          console.log('searchCoachingCenters: Using coaching_centers key, length:', dataToTransform.length);
        } else {
          console.warn('searchCoachingCenters: Unknown response structure:', response.data);
          dataToTransform = [];
        }
      } else {
        console.warn('searchCoachingCenters: No response data');
        dataToTransform = [];
      }
      
      // Validate and transform the response data
      try {
        console.log('searchCoachingCenters: About to transform data, length:', dataToTransform.length);
        const transformedData = transformApiData(dataToTransform);
        console.log('searchCoachingCenters: Transformation successful, transformed length:', transformedData.length);
        
        // If transformation returns empty array and we have data, use fallback
        if (transformedData.length === 0 && dataToTransform.length > 0) {
          console.warn('searchCoachingCenters: Transformation returned empty array, using fallback data');
          return getFallbackData();
        }
        
        // Final safety check - if we still have no data, use fallback
        if (transformedData.length === 0) {
          console.warn('searchCoachingCenters: No data after transformation, using fallback data');
          return getFallbackData();
        }
        
        return transformedData;
      } catch (transformError) {
        console.error('Error transforming search API data:', transformError);
        console.error('Data that failed to transform:', dataToTransform);
        // Return fallback data if transformation fails
        console.log('searchCoachingCenters: Using fallback data due to transformation error');
        return getFallbackData();
      }
    } catch (error: any) {
      console.error('searchCoachingCenters: API call failed:', error);
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        console.log('searchCoachingCenters: 401 Unauthorized, using fallback data instead of clearing tokens');
        // Don't clear tokens here - let the auth slice handle logout
        // Just return fallback data to prevent the error from bubbling up
        return getFallbackData();
      }
      
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

const coachingSlice = createSlice({
  name: 'coaching',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'offline' | 'online' | 'starred'>) => {
      state.activeTab = action.payload;
      // Filter centers based on active tab
      if (action.payload === 'starred') {
        state.filteredCenters = state.coachingCenters.filter(center => 
          state.starredCenters.includes(center.id)
        );
      } else {
        state.filteredCenters = state.coachingCenters;
      }
    },
    setSearchParams: (state, action: PayloadAction<Partial<CoachingSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    clearSearchParams: (state) => {
      state.searchParams = {};
    },
    toggleStarred: (state, action: PayloadAction<string>) => {
      const centerId = action.payload;
      if (state.starredCenters.includes(centerId)) {
        state.starredCenters = state.starredCenters.filter(id => id !== centerId);
      } else {
        state.starredCenters.push(centerId);
      }
      // Update filtered centers if on starred tab
      if (state.activeTab === 'starred') {
        state.filteredCenters = state.coachingCenters.filter(center => 
          state.starredCenters.includes(center.id)
        );
      }
    },
    clearData: (state) => {
      // Clear coaching data (useful for logout)
      state.coachingCenters = [];
      state.filteredCenters = [];
      state.isLoading = false;
      state.error = null;
      state.searchParams = {};
      state.starredCenters = [];
    },
    filterCenters: (state, action: PayloadAction<CoachingSearchParams>) => {
      const params = action.payload;
      let filtered = [...state.coachingCenters];

      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filtered = filtered.filter(center =>
          (center.name?.toLowerCase() || '').includes(searchLower) ||
          (center.tagline?.toLowerCase() || '').includes(searchLower) ||
          (center.className?.toLowerCase() || '').includes(searchLower) ||
          (center.location?.toLowerCase() || '').includes(searchLower)
        );
      }

      if (params.location) {
        filtered = filtered.filter(center =>
          (center.location?.toLowerCase() || '').includes(params.location!.toLowerCase()) ||
          (center.city?.toLowerCase() || '').includes(params.location!.toLowerCase()) ||
          (center.state?.toLowerCase() || '').includes(params.location!.toLowerCase())
        );
      }

      if (params.city) {
        filtered = filtered.filter(center =>
          center.city?.toLowerCase().includes(params.city!.toLowerCase()) ||
          center.state?.toLowerCase().includes(params.city!.toLowerCase())
        );
      }

      if (params.subject) {
        filtered = filtered.filter(center =>
          center.subjects?.some(subject => 
            subject.toLowerCase().includes(params.subject!.toLowerCase())
          )
        );
      }

      if (params.coaching_type) {
        // This would need to be implemented based on your API response structure
        // For now, we'll filter based on a hypothetical field
        filtered = filtered.filter(center => {
          // Implement based on your actual data structure
          return true;
        });
      }

      if (params.rating_min) {
        filtered = filtered.filter(center => (center.rating || 0) >= params.rating_min!);
      }

      if (params.distance_max) {
        // This would need to be implemented based on actual distance calculation
        // For now, we'll keep all centers
        filtered = filtered;
      }

      state.filteredCenters = filtered;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoachingCenters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
                   .addCase(fetchCoachingCenters.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Data is already transformed in the thunk
        const centers = Array.isArray(action.payload) ? action.payload : [];
        state.coachingCenters = centers;
        state.filteredCenters = centers;
        state.error = null;
      })
      .addCase(fetchCoachingCenters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchCoachingCenters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
                   .addCase(searchCoachingCenters.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Data is already transformed in the thunk
        const centers = Array.isArray(action.payload) ? action.payload : [];
        state.filteredCenters = centers;
        state.error = null;
      })
      .addCase(searchCoachingCenters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveTab,
  setSearchParams,
  clearSearchParams,
  toggleStarred,
  clearData,
  filterCenters,
  clearError,
} = coachingSlice.actions;

export default coachingSlice.reducer;
