import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, getApiUrl, API_CONFIG } from '../../config/api';

// Types based on the API response structure
export interface CourseInstructor {
  id: number;
  name: string;
  qualification: string;
  experience_years: number;
  specialization: string;
  photo: string | null;
  bio: string;
  phone_number: string;
  email: string;
  teaching_mode: string;
  teaches_online: boolean;
  teaches_offline: boolean;
  online_experience_years: number;
  online_platforms: string;
  online_rating: string;
  online_students_count: number;
  is_verified: boolean;
  subjects_display: string;
  average_rating: number;
}

export interface CourseCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface CourseLevel {
  id: number;
  name: string;
  code: string;
  description: string;
  order: number;
  is_active: boolean;
}

export interface CoursePlatform {
  id: number;
  name: string;
  code: string;
  description: string;
  website_url: string;
  logo: string | null;
  is_third_party: boolean;
  is_active: boolean;
}

export interface CourseSubject {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  is_science: boolean;
  is_mathematics: boolean;
}

export interface CourseTargetExam {
  id: number;
  name: string;
  code: string;
  full_name: string;
  description: string;
  exam_type: string;
}

export interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  course_type: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: CourseInstructor;
  platform: CoursePlatform;
  subjects: CourseSubject[];
  target_exams: CourseTargetExam[];
  price: string;
  original_price: string;
  discount_percentage: number;
  is_free: boolean;
  discounted_price: number;
  is_promotional: boolean;
  is_crash_course: boolean;
  is_free_course: boolean;
  duration_months: number;
  duration_weeks: number;
  total_hours: number;
  total_lectures: number;
  is_live: boolean;
  is_self_paced: boolean;
  is_external_course: boolean;
  external_course_url: string;
  thumbnail: string;
  thumbnail_url: string;
  thumbnail_url_display: string;
  video: string;
  video_url_display: string;
  enrolled_students: number;
  rating: string;
  total_reviews: number;
  features: string[];
  status: string;
  start_date: string;
  end_date: string;
  enrollment_start: string;
  enrollment_end: string;
  next_class_datetime: string | null;
  next_class_topic: string;
  is_enrollment_open: boolean;
  created_at: string;
  published_at: string;
}

export interface Enrollment {
  id: number;
  user: string;
  course: EnrolledCourse;
  enrollment_date: string;
  status: string;
  progress_percentage: number;
  last_accessed: string;
  completion_date: string | null;
  certificate_issued: boolean;
}

export interface EnrollmentsResponse {
  data: Enrollment[];
}

export interface EnrollmentsState {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

const initialState: EnrollmentsState = {
  enrollments: [],
  loading: false,
  error: null,
  refreshing: false,
};

// Async thunks
export const fetchEnrollments = createAsyncThunk(
  'enrollments/fetchEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.ENROLLMENTS);
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch enrollments');
    }
  }
);

export const refreshEnrollments = createAsyncThunk(
  'enrollments/refreshEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.ENROLLMENTS);
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh enrollments');
    }
  }
);

const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    clearEnrollments: (state) => {
      state.enrollments = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateEnrollmentProgress: (state, action: PayloadAction<{ enrollmentId: number; progress: number }>) => {
      const enrollment = state.enrollments.find(e => e.id === action.payload.enrollmentId);
      if (enrollment) {
        enrollment.progress_percentage = action.payload.progress;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch enrollments
      .addCase(fetchEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action: PayloadAction<EnrollmentsResponse>) => {
        state.loading = false;
        state.enrollments = action.payload.data;
        state.error = null;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Refresh enrollments
      .addCase(refreshEnrollments.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshEnrollments.fulfilled, (state, action: PayloadAction<EnrollmentsResponse>) => {
        state.refreshing = false;
        state.enrollments = action.payload.data;
        state.error = null;
      })
      .addCase(refreshEnrollments.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEnrollments, clearError, updateEnrollmentProgress } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer;
