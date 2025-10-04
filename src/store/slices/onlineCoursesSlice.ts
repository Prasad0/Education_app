import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, getApiUrl, API_CONFIG } from '../../config/api';

// Types based on API response
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

export interface OnlineCourse {
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
  original_price: string | null;
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
  video: string | null;
  video_url_display: string | null;
  enrolled_students: number;
  rating: string;
  total_reviews: number;
  features: string[];
  status: string;
  start_date: string;
  end_date: string | null;
  enrollment_start: string;
  enrollment_end: string | null;
  next_class_datetime: string | null;
  next_class_topic: string;
  is_enrollment_open: boolean;
  created_at: string;
  published_at: string;
}

export interface OnlineCoursesResponse {
  next: string | null;
  previous: string | null;
  count: number;
  data: OnlineCourse[];
}

export interface OnlineCoursesState {
  courses: OnlineCourse[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  currentPage: number;
  totalCount: number;
  refreshing: boolean;
}

const initialState: OnlineCoursesState = {
  courses: [],
  loading: false,
  error: null,
  hasNextPage: false,
  currentPage: 0,
  totalCount: 0,
  refreshing: false,
};

// Async thunks
export const fetchOnlineCourses = createAsyncThunk(
  'onlineCourses/fetchCourses',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=${page}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const loadMoreCourses = createAsyncThunk(
  'onlineCourses/loadMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { onlineCourses: OnlineCoursesState };
      const { currentPage, hasNextPage } = state.onlineCourses;
      
      if (!hasNextPage) {
        throw new Error('No more pages to load');
      }

      const nextPage = currentPage + 1;
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=${nextPage}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load more courses');
    }
  }
);

export const refreshCourses = createAsyncThunk(
  'onlineCourses/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=1`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh courses');
    }
  }
);

const onlineCoursesSlice = createSlice({
  name: 'onlineCourses',
  initialState,
  reducers: {
    clearCourses: (state) => {
      state.courses = [];
      state.hasNextPage = false;
      state.currentPage = 0;
      state.totalCount = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchOnlineCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnlineCourses.fulfilled, (state, action: PayloadAction<OnlineCoursesResponse>) => {
        state.loading = false;
        state.courses = action.payload.data;
        state.hasNextPage = !!action.payload.next;
        state.currentPage = 1;
        state.totalCount = action.payload.count;
        state.error = null;
      })
      .addCase(fetchOnlineCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load more courses
      .addCase(loadMoreCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMoreCourses.fulfilled, (state, action: PayloadAction<OnlineCoursesResponse>) => {
        state.loading = false;
        state.courses = [...state.courses, ...action.payload.data];
        state.hasNextPage = !!action.payload.next;
        state.currentPage += 1;
        state.error = null;
      })
      .addCase(loadMoreCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Refresh courses
      .addCase(refreshCourses.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshCourses.fulfilled, (state, action: PayloadAction<OnlineCoursesResponse>) => {
        state.refreshing = false;
        state.courses = action.payload.data;
        state.hasNextPage = !!action.payload.next;
        state.currentPage = 1;
        state.totalCount = action.payload.count;
        state.error = null;
      })
      .addCase(refreshCourses.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCourses, clearError } = onlineCoursesSlice.actions;
export default onlineCoursesSlice.reducer;
