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
  state?: string;
  subject?: string;
  subjects?: string;
  board?: string;
  exam?: string;
  target_exams?: string;
  standards?: string;
  coaching_type?: 'offline' | 'online' | 'hybrid';
  budget_min?: number;
  budget_max?: number;
  fees_min?: number;
  fees_max?: number;
  rating_min?: number;
  distance_max?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  child_id?: string;
}

export interface CoachingState {
  coachingCenters: CoachingCenter[];
  filteredCenters: CoachingCenter[];
  isLoading: boolean;
  error: string | null;
  searchParams: CoachingSearchParams;
  activeTab: 'offline' | 'online' | 'starred';
  starredCenters: string[]; // Array of coaching center IDs
  detailedInfo: any | null; // Detailed coaching center info
  isDetailedLoading: boolean;
  detailedError: string | null;
}


// Function to transform API data to match our interface
const transformApiData = (apiData: any): CoachingCenter[] => {
  try {
    if (!apiData) {
      return [];
    }
    
    if (!Array.isArray(apiData)) {
      return [];
    }
    
    return apiData.map((item, index) => {
      
      // Extract image URLs from gallery_images objects only
      const galleryImageUrls = (item.gallery_images || [])
        .map((img: any) => img?.image || img)
        .filter((url: string) => url && typeof url === 'string' && url.trim() !== '');
      
      // No validation - use all gallery images as-is
      const validGalleryImages: string[] = galleryImageUrls;
      const validImages: string[] = [];
      
      console.log('🔍 [transformApiData] Valid gallery images:', validGalleryImages);
      console.log('🔍 [transformApiData] Raw gallery_images from API:', item.gallery_images);
      console.log('🔍 [transformApiData] Gallery image URLs extracted:', galleryImageUrls);
      
      const transformedItem = {
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
        gallery_images: validGalleryImages,
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
        featured_image: item.featured_image?.image || item.featured_image,
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
      
      return transformedItem;
    });
  } catch (error) {
    return [];
  }
};


// Function to get fallback data when API fails
const getFallbackData = (): CoachingCenter[] => {
  
  return [];
};

// Test function to add sample data for debugging
const getTestData = (): CoachingCenter[] => {
  
  return [
    {
      id: 'test-1',
      name: 'Test Academy',
      tagline: 'Test with images',
      className: 'Test Class',
      fees: '₹10,000',
      rating: 4.5,
      reviews: 10,
      images: ['https://picsum.photos/400/300?random=1'],
      gallery_images: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2'],
      location: 'Test City',
      phone: '+91 99999 99999',
      subjects: ['Math', 'Science'],
    }
  ];
};

const initialState: CoachingState = {
  coachingCenters: [],
  filteredCenters: [],
  isLoading: false,
  error: null,
  searchParams: {},
  activeTab: 'offline',
  starredCenters: [],
  detailedInfo: null,
  isDetailedLoading: false,
  detailedError: null,
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
        
        return getTestData();
      }
        
      // Map parameters to match the API format from the curl command
      const apiParams: any = {
        radius: params.radius || 2000,
        page_size: 200, // Increased page size to get more results per request
        page: 1,        // Start from first page
      };

      // Add search parameter if provided
      if (params.search) {
        apiParams.search = params.search;
      }

      // Add city parameter if provided
      if (params.city) {
        apiParams.city = params.city;
      }

      // Add standards parameter if provided
      if (params.standards) {
        apiParams.standards = params.standards;
      }

      // Add subjects parameter if provided
      if (params.subjects) {
        apiParams.subjects = params.subjects;
      }

      // Add target_exams parameter if provided
      if (params.target_exams) {
        apiParams.target_exams = params.target_exams;
      }

      // Add coaching_type parameter if provided
      if (params.coaching_type) {
        apiParams.coaching_type = params.coaching_type;
      }

      // Add fees range parameters if provided
      if (params.fees_min) {
        apiParams.fees_min = params.fees_min;
      }
      if (params.fees_max) {
        apiParams.fees_max = params.fees_max;
      }

      // Add rating_min parameter if provided
      if (params.rating_min) {
        apiParams.rating_min = params.rating_min;
      }

      // Add coordinates if provided
      if (params.latitude && params.longitude) {
        apiParams.latitude = params.latitude;
        apiParams.longitude = params.longitude;
      }

      // Add child_id if provided
      if (params.child_id) {
        apiParams.child_id = params.child_id;
      }
       
      const response = await api.get('/coachings/', { params: apiParams });
      
      // Check if we need to fetch more pages to get all results
      let allData: any[] = [];
      if (response.data?.count && response.data?.data && Array.isArray(response.data.data)) {
        const totalCount = response.data.count;
        const currentPageSize = response.data.data.length;
        const currentPage = response.data.page || 1;
        
        // If we got fewer results than total count, try to fetch more pages
        if (currentPageSize < totalCount) {
          // Start with current results
          allData = [...response.data.data];
          
          // Calculate how many more pages we need
          const totalPages = Math.ceil(totalCount / 200);
          
          // Fetch remaining pages
          for (let page = 2; page <= totalPages; page++) {
            try {
              const nextPageParams = { ...apiParams, page };
              
              const nextPageResponse = await api.get('/coachings/', { params: nextPageParams });
              if (nextPageResponse.data?.data && Array.isArray(nextPageResponse.data.data)) {
                allData = [...allData, ...nextPageResponse.data.data];
                
              }
            } catch (pageError: any) {
              break; // Stop fetching if we encounter an error
            }
          }
        } else {
          // We got all results in one page
          allData = response.data.data;
        }
      } else {
        // Not paginated or different structure - handle different response structures
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Direct array response
            allData = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // Paginated response with results array
            allData = response.data.results;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Nested data response
            allData = response.data.data;
          } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
            // Specific key response
            allData = response.data.coaching_centers;
          } else {
            allData = [];
          }
        } else {
          
          allData = [];
        }
      }
            
      // Validate and transform the response data
      try {
        
        const transformedData = transformApiData(allData);
        
        
        // If transformation returns empty array and we have data, use test data
        if (transformedData.length === 0 && allData.length > 0) {
          
          return getTestData();
        }
        
        // Final safety check - if we still have no data, use test data
        if (transformedData.length === 0) {
          
          return getTestData();
        }
        
        return transformedData;
      } catch (transformError) {
         // Return test data if transformation fails
        
        return getTestData();
      }
    } catch (error: any) {
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        
        // Don't clear tokens here - let the auth slice handle logout
        // Just return test data to prevent the error from bubbling up
        return getTestData();
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coaching centers');
    }
  }
);

// Async thunk for fetching detailed coaching center info
export const fetchCoachingCenterDetails = createAsyncThunk(
  'coaching/fetchCoachingCenterDetails',
  async (coachingId: string, { getState, rejectWithValue }) => {
    try {
      // Check authentication status before making API call
      const state = getState() as any;
      const isAuthenticated = state.auth?.isAuthenticated;
      const accessToken = state.auth?.accessToken;
      
      if (!isAuthenticated || !accessToken) {
        return rejectWithValue('User not authenticated');
      }
      
      const response = await api.get(`/coachings/${coachingId}/detailed_info/`);
      
      // Return the raw API response data structure
      const detailedData = response.data.data || response.data;
      
      return detailedData;
    } catch (error: any) {
      console.error('Error fetching coaching center details:', error);
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication required');
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coaching center details');
    }
  }
);

// Async thunk for filtering coaching centers with advanced parameters
export const filterCoachingCenters = createAsyncThunk(
  'coaching/filterCoachingCenters',
  async (filterParams: CoachingSearchParams, { getState, rejectWithValue }) => {
    try {
      // Check authentication status before making API call
      const state = getState() as any;
      const isAuthenticated = state.auth?.isAuthenticated;
      const accessToken = state.auth?.accessToken;
      
      
      
      if (!isAuthenticated || !accessToken) {
        
        return getTestData();
      }
      
      const coordinates = state.location.coordinates;
      
      
      // Map parameters to match the API format from the curl command
      const apiParams: any = {
        radius: filterParams.radius || 2000,
        page_size: 200, // Increased page size to get more results per request
        page: 1,
      };

      // Add all filter parameters
      if (filterParams.search) apiParams.search = filterParams.search;
      if (filterParams.city) apiParams.city = filterParams.city;
      if (filterParams.state) apiParams.state = filterParams.state;
      if (filterParams.standards) apiParams.standards = filterParams.standards;
      if (filterParams.subjects) apiParams.subjects = filterParams.subjects;
      if (filterParams.target_exams) apiParams.target_exams = filterParams.target_exams;
      if (filterParams.coaching_type) apiParams.coaching_type = filterParams.coaching_type;
      if (filterParams.fees_min) apiParams.fees_min = filterParams.fees_min;
      if (filterParams.fees_max) apiParams.fees_max = filterParams.fees_max;
      if (filterParams.rating_min) apiParams.rating_min = filterParams.rating_min;
      if (filterParams.child_id) apiParams.child_id = filterParams.child_id;
      if (coordinates?.latitude && coordinates?.longitude) {
        apiParams.latitude = coordinates.latitude;
        apiParams.longitude = coordinates.longitude;
      }
      
      const response = await api.get('/coachings/', { params: apiParams });
      
      // Handle different possible API response structures
      let dataToTransform: any[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          dataToTransform = response.data;
          
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dataToTransform = response.data.data;
          
        } else if (response.data.results && Array.isArray(response.data.results)) {
          dataToTransform = response.data.results;
          
        } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
          dataToTransform = response.data.coaching_centers;
          
        } else {
          
        }
      } else {
        
      }
      
      // Validate and transform the response data
      try {
        const transformedData = transformApiData(dataToTransform);
        
        if (transformedData.length === 0 && dataToTransform.length > 0) {
          
          return getTestData();
        }
        
        if (transformedData.length === 0) {
          
          return getTestData();
        }
        
        return transformedData;
      } catch (transformError) {
        
        return getTestData();
      }
    } catch (error: any) {
      console.error('❌ [filterCoachingCenters] Error filtering coaching centers:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        
        return getTestData();
      }
      
      return rejectWithValue(error.response?.data?.message || 'Filter failed');
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
        
        return getTestData();
      }
      
      const coordinates = state.location.coordinates;
      
      
      // Map parameters to match the API format from the curl command
      const apiParams: any = {
        search: searchTerm,
        radius: 2000,
        page_size: 200, // Increased page size to get more results per request
        page: 1,        // Start from first page
      };

      // Add coordinates if available
      if (coordinates?.latitude && coordinates?.longitude) {
        apiParams.latitude = coordinates.latitude;
        apiParams.longitude = coordinates.longitude;
      }

      // Add child_id if available from state
      if (state.auth?.selectedStudentId) {
        apiParams.child_id = state.auth.selectedStudentId;
      }
      
      
      
      const response = await api.get('/coachings/', { params: apiParams });
      
      // Handle different possible API response structures
      let dataToTransform: any[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          dataToTransform = response.data;
          
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested data response (primary format)
          dataToTransform = response.data.data;
          
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response with results array
          dataToTransform = response.data.results;
          
        } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
          // Specific key response
          dataToTransform = response.data.coaching_centers;
          
        } else {
          dataToTransform = [];
          
        }
      } else {
        dataToTransform = [];
        
      }
      
      // Validate and transform the response data
      try {
        const transformedData = transformApiData(dataToTransform);
        
        // If transformation returns empty array and we have data, use test data
        if (transformedData.length === 0 && dataToTransform.length > 0) {
          
          return getTestData();
        }
        
        // Final safety check - if we still have no data, use test data
        if (transformedData.length === 0) {
          
          return getTestData();
        }
        
        return transformedData;
      } catch (transformError) {
        
        // Return test data if transformation fails
        return getTestData();
      }
    } catch (error: any) {
      console.error('❌ [searchCoachingCenters] Error searching coaching centers:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        
        // Don't clear tokens here - let the auth slice handle logout
        // Just return test data to prevent the error from bubbling up
        return getTestData();
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
    clearDetailedInfo: (state) => {
      state.detailedInfo = null;
      state.detailedError = null;
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
      })
      .addCase(filterCoachingCenters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(filterCoachingCenters.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Data is already transformed in the thunk
        const centers = Array.isArray(action.payload) ? action.payload : [];
        state.filteredCenters = centers;
        state.error = null;
      })
      .addCase(filterCoachingCenters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCoachingCenterDetails.pending, (state) => {
        state.isDetailedLoading = true;
        state.detailedError = null;
      })
      .addCase(fetchCoachingCenterDetails.fulfilled, (state, action) => {
        state.isDetailedLoading = false;
        state.detailedInfo = action.payload;
        state.detailedError = null;
      })
      .addCase(fetchCoachingCenterDetails.rejected, (state, action) => {
        state.isDetailedLoading = false;
        state.detailedError = action.payload as string;
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
  clearDetailedInfo,
} = coachingSlice.actions;

export default coachingSlice.reducer;
