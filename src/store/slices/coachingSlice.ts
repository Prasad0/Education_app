import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_CONFIG } from '../../config/api';

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
  activeTab: 'offline' | 'online' | 'private' | 'chat';
  starredCenters: string[]; // Array of coaching center IDs
  detailedInfo: any | null; // Detailed coaching center info
  isDetailedLoading: boolean;
  detailedError: string | null;
  // Pagination state
  next: string | null;
  previous: string | null;
  hasNextPage: boolean;
  currentPage: number;
  totalCount: number;
  loadingMore: boolean;
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
  
  return [];
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
  // Pagination state
  next: null,
  previous: null,
  hasNextPage: false,
  currentPage: 0,
  totalCount: 0,
  loadingMore: false,
};

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    let token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      const tokensData = await AsyncStorage.getItem('auth_tokens');
      if (tokensData) {
        try {
          const tokens = JSON.parse(tokensData);
          token = tokens.accessToken;
        } catch (parseError) {
          console.warn('Failed to parse auth tokens:', parseError);
        }
      }
    }
    return token ? `Bearer ${token}` : null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Async thunk for adding coaching center to favorites
export const addToFavorite = createAsyncThunk(
  'coaching/addToFavorite',
  async ({ coachingId, studentId }: { coachingId: string; studentId: number }, { rejectWithValue, getState }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      // Get auth state to check if user has children
      const state = getState() as any;
      const profile = state.auth?.profile || state.auth?.user;
      const userType = profile?.user_type || profile?.userType;
      const hasChildren = userType === 'parent' && profile?.children && profile.children.length > 0;
      const selectedChildId = state.auth?.selectedChildId;

      // Prepare request body - only send student_id if user has children
      let requestBody: { student_id?: number } | null = null;
      
      if (hasChildren && selectedChildId) {
        // User has children, use the currently selected student_id from navbar
        const studentIdNum = typeof selectedChildId === 'string' ? parseInt(selectedChildId, 10) : selectedChildId;
        requestBody = { student_id: studentIdNum };
      } else if (!hasChildren) {
        // User doesn't have children, don't send body (null means no body)
        requestBody = null;
      } else {
        // Fallback: if hasChildren but no selectedChildId, use the passed studentId
        const studentIdNum = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
        requestBody = { student_id: studentIdNum };
      }
      
      // Log the request for debugging
      console.log('Adding to favoritesss:', {
        coachingId,
        hasChildren,
        selectedChildId,
        url: `/coachings/${coachingId}/add_favorite/`,
        body: requestBody
      });

      // Make POST request with or without body
      // Send { student_id: 123 } directly in body when user has children
      // Send no body (undefined) when user doesn't have children
      const response = requestBody !== null
        ? await api.post(`/coachings/${coachingId}/add_favorite/`, requestBody)
        : await api.post(`/coachings/${coachingId}/add_favorite/`);

      console.log('Add to favorite success:', response.data);
      return { coachingId, success: true, data: response.data };
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      console.error('Error response:', error.response?.data.error?.child);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to add to favorites';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for removing coaching center from favorites
export const removeFromFavorite = createAsyncThunk(
  'coaching/removeFromFavorite',
  async ({ coachingId, studentId }: { coachingId: string; studentId: number }, { rejectWithValue, getState }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      // Get auth state to check if user has children
      const state = getState() as any;
      const profile = state.auth?.profile || state.auth?.user;
      const userType = profile?.user_type || profile?.userType;
      const hasChildren = userType === 'parent' && profile?.children && profile.children.length > 0;
      const selectedChildId = state.auth?.selectedChildId;

      // Prepare request data - only send student_id if user has children
      let requestData: { student_id?: number } | undefined;
      
      if (hasChildren && selectedChildId) {
        // User has children, use the currently selected student_id from navbar
        const studentIdNum = typeof selectedChildId === 'string' ? parseInt(selectedChildId, 10) : selectedChildId;
        requestData = { student_id: studentIdNum };
      } else if (!hasChildren) {
        // User doesn't have children, don't send data
        requestData = undefined;
      } else {
        // Fallback: if hasChildren but no selectedChildId, use the passed studentId
        const studentIdNum = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
        requestData = { student_id: studentIdNum };
      }
      
      // Log the request for debugging
      console.log('Removing from favorites:', {
        coachingId,
        hasChildren,
        selectedChildId,
        url: `/coachings/${coachingId}/remove_favorite/`,
        data: requestData
      });

      // Make DELETE request with or without data
      const response = requestData 
        ? await api.delete(
            `/coachings/${coachingId}/remove_favorite/`,
            { data: requestData }
          )
        : await api.delete(`/coachings/${coachingId}/remove_favorite/`);

      console.log('Remove from favorite success:', response.data);
      return { coachingId, success: true, data: response.data };
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to remove from favorites';
      return rejectWithValue(errorMessage);
    }
  }
);

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
        return {
          data: getTestData(),
          next: null,
          previous: null,
          count: 0,
          page: 1
        };
      }
        
      // Map parameters to match the API format from the curl command
      const apiParams: any = {
        radius: params.radius || 2000,
        page_size: 20, // Reduced page size for proper pagination
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

      // Add child_id if provided or if parent has selected child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (params.child_id) {
        apiParams.child_id = params.child_id;
      } else if (userType === 'parent' && state.auth?.selectedChildId) {
        apiParams.child_id = String(state.auth.selectedChildId);
      }
       
      const response = await api.get('/coachings/', { params: apiParams });
      
      // Extract data and pagination info from response
      let allData: any[] = [];
      let nextUrl: string | null = null;
      let previousUrl: string | null = null;
      let totalCount = 0;
      
      if (response.data) {
        // Handle paginated response structure
        if (response.data.data && Array.isArray(response.data.data)) {
          allData = response.data.data;
          nextUrl = response.data.next || null;
          previousUrl = response.data.previous || null;
          totalCount = response.data.count || allData.length;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Alternative paginated structure
          allData = response.data.results;
          nextUrl = response.data.next || null;
          previousUrl = response.data.previous || null;
          totalCount = response.data.count || allData.length;
        } else if (Array.isArray(response.data)) {
          // Direct array response (no pagination)
          allData = response.data;
        } else if (response.data.coaching_centers && Array.isArray(response.data.coaching_centers)) {
          allData = response.data.coaching_centers;
        }
      }
            
      // Validate and transform the response data
      try {
        const transformedData = transformApiData(allData);
        
        // Return data with pagination info
        return {
          data: transformedData,
          next: nextUrl,
          previous: previousUrl,
          count: totalCount,
          page: 1
        };
      } catch (transformError) {
         // Return test data if transformation fails
        return {
          data: getTestData(),
          next: null,
          previous: null,
          count: 0,
          page: 1
        };
      }
    } catch (error: any) {
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        // Don't clear tokens here - let the auth slice handle logout
        // Just return test data to prevent the error from bubbling up
        return {
          data: getTestData(),
          next: null,
          previous: null,
          count: 0,
          page: 1
        };
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coaching centers');
    }
  }
);

// Async thunk for loading more coaching centers
export const loadMoreCoachingCenters = createAsyncThunk(
  'coaching/loadMoreCoachingCenters',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const coachingState = state.coaching as CoachingState;
      const isAuthenticated = state.auth?.isAuthenticated;
      const accessToken = state.auth?.accessToken;
      
      if (!isAuthenticated || !accessToken) {
        return rejectWithValue('User not authenticated');
      }
      
      if (!coachingState.next) {
        return rejectWithValue('No more pages to load');
      }
      
      // Handle both full URLs and relative paths
      let nextUrlPath = coachingState.next;
      
      // If it's a full URL, extract just the path
      if (nextUrlPath.startsWith('http://') || nextUrlPath.startsWith('https://')) {
        try {
          const urlObj = new URL(nextUrlPath);
          // Get pathname and search params
          nextUrlPath = urlObj.pathname + urlObj.search;
        } catch (e) {
          // If URL parsing fails, try to extract path manually
          const baseUrlMatch = nextUrlPath.match(/https?:\/\/[^\/]+(\/.*)/);
          if (baseUrlMatch) {
            nextUrlPath = baseUrlMatch[1];
          }
        }
      }
      
      // Remove /api prefix if present (since axios baseURL already includes /api)
      if (nextUrlPath.startsWith('/api/')) {
        nextUrlPath = nextUrlPath.substring(4); // Remove '/api'
      }
      
      // Ensure it starts with /
      if (!nextUrlPath.startsWith('/')) {
        nextUrlPath = '/' + nextUrlPath;
      }
      
      console.log('Loading more from URL:', nextUrlPath);
      
      // Use the next URL (now guaranteed to be relative to baseURL)
      const response = await api.get(nextUrlPath);
      
      // Extract data and pagination info from response
      let allData: any[] = [];
      let nextUrl: string | null = null;
      let previousUrl: string | null = null;
      let totalCount = 0;
      
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          allData = response.data.data;
          nextUrl = response.data.next || null;
          previousUrl = response.data.previous || null;
          totalCount = response.data.count || allData.length;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          allData = response.data.results;
          nextUrl = response.data.next || null;
          previousUrl = response.data.previous || null;
          totalCount = response.data.count || allData.length;
        } else if (Array.isArray(response.data)) {
          allData = response.data;
        }
      }
      
      const transformedData = transformApiData(allData);
      
      return {
        data: transformedData,
        next: nextUrl,
        previous: previousUrl,
        count: totalCount,
        page: coachingState.currentPage + 1
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication required');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to load more coaching centers');
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
      // Add child_id if provided or if parent has selected child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (filterParams.child_id) {
        apiParams.child_id = filterParams.child_id;
      } else if (userType === 'parent' && state.auth?.selectedChildId) {
        apiParams.child_id = String(state.auth.selectedChildId);
      }
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

      // Add child_id if parent user has selected a child (reuse state from line 517)
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (userType === 'parent' && state.auth?.selectedChildId) {
        apiParams.child_id = String(state.auth.selectedChildId);
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
    setActiveTab: (state, action: PayloadAction<'offline' | 'online' | 'private' | 'chat'>) => {
      state.activeTab = action.payload;
      // Filter centers based on active tab
      if (action.payload === 'private') {
        // Show starred centers
        state.filteredCenters = state.coachingCenters.filter(center => 
          state.starredCenters.includes(center.id)
        );
        return;
      }

      if (action.payload === 'online') {
        // Show only online coaching
        state.filteredCenters = state.coachingCenters.filter(center =>
          (center.coaching_type || '').toLowerCase() === 'online'
        );
        return;
      }

      if (action.payload === 'offline') {
        // Show only offline coaching
        state.filteredCenters = state.coachingCenters.filter(center =>
          (center.coaching_type || '').toLowerCase() === 'offline'
        );
        return;
      }

      // Default behavior for other tabs (e.g., chat)
      state.filteredCenters = state.coachingCenters;
    },
    setSearchParams: (state, action: PayloadAction<Partial<CoachingSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    clearSearchParams: (state) => {
      state.searchParams = {};
    },
    toggleStarred: (state, action: PayloadAction<string>) => {
      const centerId = String(action.payload);
      const isStarred = state.starredCenters.some(id => String(id) === centerId);
      
      if (isStarred) {
        state.starredCenters = state.starredCenters.filter(id => String(id) !== centerId);
      } else {
        state.starredCenters.push(centerId);
      }
      // Update filtered centers if on starred tab (now handled by private tab)
      if (state.activeTab === 'private') {
        state.filteredCenters = state.coachingCenters.filter(center => 
          state.starredCenters.some(id => String(id) === String(center.id))
        );
      }
      // Update is_favorited in the center object
      const center = state.coachingCenters.find(c => String(c.id) === centerId);
      if (center) {
        center.is_favorited = !isStarred;
      }
      const filteredCenter = state.filteredCenters.find(c => String(c.id) === centerId);
      if (filteredCenter) {
        filteredCenter.is_favorited = !isStarred;
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
        
        // Handle new pagination structure
        if (action.payload && typeof action.payload === 'object' && 'data' in action.payload) {
          const payload = action.payload as { data: CoachingCenter[]; next: string | null; previous: string | null; count: number; page: number };
          state.coachingCenters = payload.data;
          state.filteredCenters = payload.data;
          state.next = payload.next;
          state.previous = payload.previous;
          state.hasNextPage = !!payload.next;
          state.currentPage = payload.page;
          state.totalCount = payload.count;
        } else {
          // Fallback for old structure (array)
          const centers = Array.isArray(action.payload) ? action.payload : [];
          state.coachingCenters = centers;
          state.filteredCenters = centers;
          state.next = null;
          state.previous = null;
          state.hasNextPage = false;
          state.currentPage = 1;
          state.totalCount = centers.length;
        }
        state.error = null;
      })
      .addCase(fetchCoachingCenters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.next = null;
        state.previous = null;
        state.hasNextPage = false;
        state.currentPage = 0;
      })
      .addCase(loadMoreCoachingCenters.pending, (state) => {
        state.loadingMore = true;
        state.error = null;
      })
      .addCase(loadMoreCoachingCenters.fulfilled, (state, action) => {
        state.loadingMore = false;
        
        if (action.payload && typeof action.payload === 'object' && 'data' in action.payload) {
          const payload = action.payload as { data: CoachingCenter[]; next: string | null; previous: string | null; count: number; page: number };
          // Append new data to existing centers
          state.coachingCenters = [...state.coachingCenters, ...payload.data];
          state.filteredCenters = [...state.filteredCenters, ...payload.data];
          state.next = payload.next;
          state.previous = payload.previous;
          state.hasNextPage = !!payload.next;
          state.currentPage = payload.page;
          state.totalCount = payload.count;
        }
        state.error = null;
      })
      .addCase(loadMoreCoachingCenters.rejected, (state, action) => {
        state.loadingMore = false;
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
        // Update is_favorited based on starredCenters
        const coachingData = action.payload?.coaching || action.payload;
        if (coachingData?.id && state.starredCenters.includes(coachingData.id)) {
          coachingData.is_favorited = true;
        }
      })
      .addCase(fetchCoachingCenterDetails.rejected, (state, action) => {
        state.isDetailedLoading = false;
        state.detailedError = action.payload as string;
      })
      .addCase(addToFavorite.pending, (state) => {
        // Optionally show loading state
      })
      .addCase(addToFavorite.fulfilled, (state, action) => {
        const { coachingId } = action.payload;
        // Ensure coachingId is a string for consistent comparison
        const coachingIdStr = String(coachingId);
        
        // Update the favorite status (check and add as string)
        if (!state.starredCenters.some(id => String(id) === coachingIdStr)) {
          state.starredCenters.push(coachingIdStr);
        }
        // Update is_favorited in the center object
        const center = state.coachingCenters.find(c => String(c.id) === coachingIdStr);
        if (center) {
          center.is_favorited = true;
        }
        const filteredCenter = state.filteredCenters.find(c => String(c.id) === coachingIdStr);
        if (filteredCenter) {
          filteredCenter.is_favorited = true;
        }
        // Update detailedInfo if it's the same coaching center
        if (state.detailedInfo) {
          const detailedCoaching = state.detailedInfo?.coaching || state.detailedInfo;
          if (detailedCoaching?.id && String(detailedCoaching.id) === coachingIdStr) {
            detailedCoaching.is_favorited = true;
          }
        }
      })
      .addCase(addToFavorite.rejected, (state, action) => {
        // Handle error - could show a toast or alert
        console.error('Failed to add to favorites:', action.payload);
      })
      .addCase(removeFromFavorite.pending, (state) => {
        // Optionally show loading state
      })
      .addCase(removeFromFavorite.fulfilled, (state, action) => {
        const { coachingId } = action.payload;
        // Ensure coachingId is a string for consistent comparison
        const coachingIdStr = String(coachingId);
        
        // Remove from starred centers (ensure both are strings for comparison)
        state.starredCenters = state.starredCenters.filter(id => String(id) !== coachingIdStr);
        
        // Update is_favorited in the center object
        const center = state.coachingCenters.find(c => String(c.id) === coachingIdStr);
        if (center) {
          center.is_favorited = false;
        }
        const filteredCenter = state.filteredCenters.find(c => String(c.id) === coachingIdStr);
        if (filteredCenter) {
          filteredCenter.is_favorited = false;
        }
        // Update detailedInfo if it's the same coaching center
        if (state.detailedInfo) {
          const detailedCoaching = state.detailedInfo?.coaching || state.detailedInfo;
          if (detailedCoaching?.id && String(detailedCoaching.id) === coachingIdStr) {
            detailedCoaching.is_favorited = false;
          }
        }
      })
      .addCase(removeFromFavorite.rejected, (state, action) => {
        // Handle error - could show a toast or alert
        console.error('Failed to remove from favorites:', action.payload);
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
