import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../config/api';

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
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  duration_hours: number;
  notes?: string;
  is_online?: boolean;
}

export interface TutorWallImage {
  id: number;
  image: string;
  caption: string;
  order: number;
  is_featured: boolean;
}

export interface TutorReview {
  id: number;
  tutor: number;
  tutor_name: string;
  student: number;
  student_name: string;
  booking: number;
  booking_subject: string;
  rating: number;
  comment: string;
  teaching_quality: number;
  communication: number;
  punctuality: number;
  subject_knowledge: number;
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
}

export interface PrivateTutorDetail {
  id: number;
  teacher: TutorTeacher;
  profile_image: string | null;
  hourly_rate_min: string;
  hourly_rate_max: string;
  hourly_rate_display: string;
  response_time_hours: number;
  whatsapp_number: string;
  is_verified: boolean;
  is_available: boolean;
  total_sessions_completed: number;
  average_rating: string;
  total_reviews: number;
  achievements: string;
  teaching_experience_details: string;
  teaching_styles: TutorTeachingStyle[];
  languages: TutorLanguage[];
  target_exams: { id: number; name: string; description: string }[];
  availability_slots: AvailabilitySlot[];
  wall_images: TutorWallImage[];
  location: string;
  distance_from_user: string;
  recent_reviews: TutorReview[];
  created_at: string;
  updated_at: string;
  last_active: string;
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
  tutorDetail: PrivateTutorDetail | null;
  tutorDetailLoading: boolean;
  tutorDetailError: string | null;
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
  tutorDetail: null,
  tutorDetailLoading: false,
  tutorDetailError: null,
};

export const fetchPrivateTutors = createAsyncThunk<PrivateTutorsResponse, { pageUrl?: string } | void>(
  'privateTutors/fetch',
  async (arg, { rejectWithValue }) => {
    try {
      const url = arg && arg.pageUrl ? arg.pageUrl : '/private-tutors/tutors/';
      const { data } = await api.get<PrivateTutorsResponse>(url);
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
      const { data } = await api.get<AvailabilitySlot[]>(
        `/private-tutors/tutors/${tutorId}/availability/`
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

export const fetchTutorDetail = createAsyncThunk<PrivateTutorDetail, number>(
  'privateTutors/fetchDetail',
  async (tutorId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<PrivateTutorDetail>(
        `/private-tutors/tutors/${tutorId}/`
      );
      return data;
    } catch (error: any) {
      console.error('Error fetching tutor detail:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch tutor details';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createBooking = createAsyncThunk<any, BookingRequest>(
  'privateTutors/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      console.log('Creating booking with data:', bookingData);
      const { data } = await api.post(
        '/private-tutors/bookings/',
        bookingData
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

// Async thunk for adding tutor to favorites
export const addTutorToFavorite = createAsyncThunk(
  'privateTutors/addToFavorite',
  async (teacherId: number, { rejectWithValue, getState }) => {
    try {
      // Get auth state to check if user has children
      const state = getState() as any;
      const profile = state.auth?.profile || state.auth?.user;
      const userType = profile?.user_type || profile?.userType;
      const hasChildren = userType === 'parent' && profile?.children && profile.children.length > 0;
      const selectedChildId = state.auth?.selectedChildId;

      // Prepare request body - only send tutor (teacher ID) if user has children
      let requestBody: { tutor?: number } | null = null;
      
      if (hasChildren && selectedChildId) {
        // User has children, send the teacher ID
        // The API expects { "tutor": teacherId } when user has children
        requestBody = { tutor: teacherId };
      } else if (!hasChildren) {
        // User doesn't have children, don't send body
        requestBody = null;
      } else {
        // Fallback: if hasChildren but no selectedChildId, still send teacher ID
        requestBody = { tutor: teacherId };
      }
      
      // Log the request for debugging
      console.log('Adding tutor to favorites:', {
        teacherId,
        hasChildren,
        selectedChildId,
        url: '/private-tutors/favorites/',
        body: requestBody
      });

      // Make POST request with or without body
      // Send { tutor: teacherId } directly in body when user has children
      // Send no body when user doesn't have children
      const response = requestBody !== null
        ? await api.post('/private-tutors/favorites/', requestBody)
        : await api.post('/private-tutors/favorites/');

      console.log('Add tutor to favorite success:', response.data);
      return { teacherId, success: true, data: response.data };
    } catch (error: any) {
      console.error('Error adding tutor to favorites:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to add tutor to favorites';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for removing tutor from favorites
export const removeTutorFromFavorite = createAsyncThunk(
  'privateTutors/removeFromFavorite',
  async (teacherId: number, { rejectWithValue, getState }) => {
    try {
      // Get auth state to check if user has children
      const state = getState() as any;
      const profile = state.auth?.profile || state.auth?.user;
      const userType = profile?.user_type || profile?.userType;
      const hasChildren = userType === 'parent' && profile?.children && profile.children.length > 0;
      const selectedChildId = state.auth?.selectedChildId;

      // Prepare request data - only send tutor (teacher ID) if user has children
      let requestData: { tutor?: number } | null = null;
      
      if (hasChildren && selectedChildId) {
        // User has children, send the teacher ID
        requestData = { tutor: teacherId };
      } else if (!hasChildren) {
        // User doesn't have children, don't send data
        requestData = null;
      } else {
        // Fallback: if hasChildren but no selectedChildId, still send teacher ID
        requestData = { tutor: teacherId };
      }
      
      // Log the request for debugging
      console.log('Removing tutor from favorites:', {
        teacherId,
        hasChildren,
        selectedChildId,
        url: '/private-tutors/favorites/',
        data: requestData
      });

      // Make DELETE request with or without data
      const response = requestData !== null
        ? await api.delete('/private-tutors/favorites/', {
            data: requestData
          })
        : await api.delete('/private-tutors/favorites/');

      console.log('Remove tutor from favorite success:', response.data);
      return { teacherId, success: true, data: response.data };
    } catch (error: any) {
      console.error('Error removing tutor from favorites:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to remove tutor from favorites';
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
    clearTutorDetail(state) {
      state.tutorDetail = null;
      state.tutorDetailError = null;
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
      })
      .addCase(fetchTutorDetail.pending, (state) => {
        state.tutorDetailLoading = true;
        state.tutorDetailError = null;
      })
      .addCase(fetchTutorDetail.fulfilled, (state, action: PayloadAction<PrivateTutorDetail>) => {
        state.tutorDetailLoading = false;
        state.tutorDetail = action.payload;
      })
      .addCase(fetchTutorDetail.rejected, (state, action) => {
        state.tutorDetailLoading = false;
        state.tutorDetailError = action.error.message || 'Failed to load tutor details';
      });
  },
});

export const { clearError, clearAvailability, clearBookingState, clearTutorDetail, reset } = privateTutorsSlice.actions;
export default privateTutorsSlice.reducer;


