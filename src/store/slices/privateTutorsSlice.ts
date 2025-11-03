import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types based on API response
export interface TutorLanguage {
  id: number;
  name: string;
  code: string;
}

export interface TutorTeachingStyle {
  id: number;
  name: string;
  description: string;
}

export interface TutorTeacher {
  id: number;
  name: string;
  qualification: string;
  experience_years: number;
  experience_display: string;
  specialization: string;
  photo: string | null;
  bio: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PrivateTutorApiItem {
  id: number;
  teacher: TutorTeacher;
  profile_image: string | null;
  hourly_rate_min: string;
  hourly_rate_max: string;
  hourly_rate_display: string;
  response_time_hours: number;
  is_verified: boolean;
  is_available: boolean;
  total_sessions_completed: number;
  average_rating: string;
  total_reviews: number;
  teaching_styles: TutorTeachingStyle[];
  languages: TutorLanguage[];
  target_exams: { id: number; name: string; description: string }[];
  location: string;
  distance_from_user: string;
  availability_summary: string[];
  created_at: string;
}

export interface PrivateTutorsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PrivateTutorApiItem[];
}

export interface AvailabilitySlot {
  id: number;
  day_of_week: string;
  day_display: string;
  time_slot: string;
  time_slot_display: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_sessions_per_day: number;
}

export interface BookingRequest {
  tutor: number;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  notes?: string;
  is_online?: boolean;
}

export interface PrivateTutorsState {
  items: PrivateTutorApiItem[];
  loading: boolean;
  error: string | null;
  count: number;
  next: string | null;
  previous: string | null;
  availability: AvailabilitySlot[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  bookingLoading: boolean;
  bookingError: string | null;
  bookingSuccess: boolean;
}

const initialState: PrivateTutorsState = {
  items: [],
  loading: false,
  error: null,
  count: 0,
  next: null,
  previous: null,
  availability: [],
  availabilityLoading: false,
  availabilityError: null,
  bookingLoading: false,
  bookingError: null,
  bookingSuccess: false,
};

// Helper function to get auth token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get token directly
    let token = await AsyncStorage.getItem('accessToken');
    
    // If not found, try to get from auth_tokens
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

export const fetchPrivateTutors = createAsyncThunk<PrivateTutorsResponse, { pageUrl?: string } | void>(
  'privateTutors/fetch',
  async (arg, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const url = arg && arg.pageUrl ? arg.pageUrl : 'https://learn.crusheducation.in/api/private-tutors/tutors/';
      const { data } = await axios.get<PrivateTutorsResponse>(url, {
        headers: {
          Authorization: token,
        },
      });
      return data;
    } catch (error: any) {
      console.error('Error fetching private tutors:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch private tutors';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTutorAvailability = createAsyncThunk<AvailabilitySlot[], number>(
  'privateTutors/fetchAvailability',
  async (tutorId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const { data } = await axios.get<AvailabilitySlot[]>(
        `https://learn.crusheducation.in/api/private-tutors/tutors/${tutorId}/availability/`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      return data;
    } catch (error: any) {
      console.error('Error fetching tutor availability:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch tutor availability';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createBooking = createAsyncThunk<any, BookingRequest>(
  'privateTutors/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      console.log('Creating booking with data:', bookingData);
      const { data } = await axios.post(
        'https://learn.crusheducation.in/api/private-tutors/bookings/',
        bookingData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Booking response:', data);
      return data;
    } catch (error: any) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to create booking';
      return rejectWithValue(errorMessage);
    }
  }
);

const privateTutorsSlice = createSlice({
  name: 'privateTutors',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearAvailability(state) {
      state.availability = [];
      state.availabilityError = null;
    },
    clearBookingState(state) {
      state.bookingError = null;
      state.bookingSuccess = false;
    },
    reset(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrivateTutors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivateTutors.fulfilled, (state, action: PayloadAction<PrivateTutorsResponse>) => {
        state.loading = false;
        state.items = action.payload.results || [];
        state.count = action.payload.count;
        state.next = action.payload.next;
        state.previous = action.payload.previous;
      })
      .addCase(fetchPrivateTutors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load private tutors';
      })
      .addCase(fetchTutorAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.availabilityError = null;
      })
      .addCase(fetchTutorAvailability.fulfilled, (state, action: PayloadAction<AvailabilitySlot[]>) => {
        state.availabilityLoading = false;
        state.availability = action.payload;
      })
      .addCase(fetchTutorAvailability.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.availabilityError = action.error.message || 'Failed to load availability';
      })
      .addCase(createBooking.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
        state.bookingSuccess = false;
      })
      .addCase(createBooking.fulfilled, (state) => {
        state.bookingLoading = false;
        state.bookingSuccess = true;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingError = action.error.message || 'Failed to create booking';
      });
  },
});

export const { clearError, clearAvailability, clearBookingState, reset } = privateTutorsSlice.actions;
export default privateTutorsSlice.reducer;


