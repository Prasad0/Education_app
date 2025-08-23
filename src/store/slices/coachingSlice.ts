import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../config/api';

export interface CoachingCenter {
  id: string;
  name: string;
  tagline: string;
  className: string;
  fees: string;
  startDate: string;
  seatsLeft: number;
  rating: number;
  reviews: number;
  images: string[];
  distance: string;
  location: string;
  phone: string;
  description?: string;
  subjects?: string[];
  facilities?: string[];
  timings?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
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
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
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
    images: ['image1.jpg', 'image2.jpg'],
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
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
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
    images: ['image1.jpg', 'image2.jpg'],
    distance: '1.5 km',
    location: 'Indiranagar',
    phone: '+91 98765 43213',
    subjects: ['Mathematics', 'English'],
  }
];

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
  async (params: CoachingSearchParams = {}, { rejectWithValue }) => {
    try {
      console.log('🔍 [fetchCoachingCenters] API Call Details:');
      console.log('📍 Endpoint:', '/coachings/');
      console.log('📋 Parameters:', JSON.stringify(params, null, 2));
      console.log('🌐 Full URL:', `${api.defaults.baseURL}/coachings/`);
      console.log('🔑 Auth Token:', api.defaults.headers?.Authorization ? 'Present' : 'Missing');
      
      const response = await api.get('/coachings/', { params });
      
      console.log('✅ [fetchCoachingCenters] Success Response:');
      console.log('📊 Response Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.log('❌ [fetchCoachingCenters] Error Details:');
      console.log('🚨 Error:', error.message);
      console.log('📡 Response Status:', error.response?.status);
      console.log('📄 Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('🔗 Response Headers:', JSON.stringify(error.response?.headers, null, 2));
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coaching centers');
    }
  }
);

// Async thunk for searching coaching centers
export const searchCoachingCenters = createAsyncThunk(
  'coaching/searchCoachingCenters',
  async (searchTerm: string, { rejectWithValue }) => {
    try {
      console.log('🔍 [searchCoachingCenters] API Call Details:');
      console.log('📍 Endpoint:', `/coachings/?search=${encodeURIComponent(searchTerm)}`);
      console.log('🔎 Search Term:', searchTerm);
      console.log('🌐 Full URL:', `${api.defaults.baseURL}/coachings/?search=${encodeURIComponent(searchTerm)}`);
      console.log('🔑 Auth Token:', api.defaults.headers?.Authorization ? 'Present' : 'Missing');
      
      const response = await api.get(`/coachings/?search=${encodeURIComponent(searchTerm)}`);
      
      console.log('✅ [searchCoachingCenters] Success Response:');
      console.log('📊 Response Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.log('❌ [searchCoachingCenters] Error Details:');
      console.log('🚨 Error:', error.message);
      console.log('📡 Response Status:', error.response?.status);
      console.log('📄 Response Data:', JSON.stringify(error.response?.data, null, 2));
      
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
    filterCenters: (state, action: PayloadAction<CoachingSearchParams>) => {
      const params = action.payload;
      let filtered = [...state.coachingCenters];

      // Apply filters
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filtered = filtered.filter(center =>
          center.name.toLowerCase().includes(searchLower) ||
          center.tagline.toLowerCase().includes(searchLower) ||
          center.className.toLowerCase().includes(searchLower) ||
          center.location.toLowerCase().includes(searchLower)
        );
      }

      if (params.location) {
        filtered = filtered.filter(center =>
          center.location.toLowerCase().includes(params.location!.toLowerCase()) ||
          center.city?.toLowerCase().includes(params.location!.toLowerCase()) ||
          center.state?.toLowerCase().includes(params.location!.toLowerCase())
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
        filtered = filtered.filter(center => center.rating >= params.rating_min!);
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
        state.coachingCenters = action.payload.results || action.payload;
        state.filteredCenters = action.payload.results || action.payload;
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
        state.filteredCenters = action.payload.results || action.payload;
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
  filterCenters,
  clearError,
} = coachingSlice.actions;

export default coachingSlice.reducer;
