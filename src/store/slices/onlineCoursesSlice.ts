import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, getApiUrl, API_CONFIG, getCourseDetailUrl } from '../../config/api';

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

export interface CourseReview {
  id: number;
  user: string;
  course: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: number;
  title: string;
  description: string;
  order: number;
  is_active: boolean;
}

export interface CourseOffer {
  id: number;
  title: string;
  description: string;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface OnlineCourse {
  id: number;
  title: string;
  slug: string;
  description?: string;
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
  promo_video_url?: string;
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
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  modules: CourseModule[];
  created_at: string;
  updated_at: string;
  published_at: string;
  reviews: CourseReview[];
  is_bookmarked: boolean;
  enrollment_status: boolean;
  enrollment_details: any;
  active_offers: CourseOffer[];
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
  // Course detail state
  selectedCourse: OnlineCourse | null;
  courseDetailLoading: boolean;
  courseDetailError: string | null;
}

const initialState: OnlineCoursesState = {
  courses: [],
  loading: false,
  error: null,
  hasNextPage: false,
  currentPage: 0,
  totalCount: 0,
  refreshing: false,
  // Course detail state
  selectedCourse: null,
  courseDetailLoading: false,
  courseDetailError: null,
};

// Async thunks
export const fetchOnlineCourses = createAsyncThunk(
  'onlineCourses/fetchCourses',
  async (page: number = 1, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=${page}`;
      
      // Add child_id if parent user has selected a child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (userType === 'parent' && state.auth?.selectedChildId) {
        url += `&child_id=${state.auth.selectedChildId}`;
      }
      
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
      const state = getState() as any;
      const { currentPage, hasNextPage } = state.onlineCourses;
      
      if (!hasNextPage) {
        throw new Error('No more pages to load');
      }

      const nextPage = currentPage + 1;
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=${nextPage}`;
      
      // Add child_id if parent user has selected a child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (userType === 'parent' && state.auth?.selectedChildId) {
        url += `&child_id=${state.auth.selectedChildId}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load more courses');
    }
  }
);

export const refreshCourses = createAsyncThunk(
  'onlineCourses/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.ONLINE_COURSES)}?page=1`;
      
      // Add child_id if parent user has selected a child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (userType === 'parent' && state.auth?.selectedChildId) {
        url += `&child_id=${state.auth.selectedChildId}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh courses');
    }
  }
);

export const fetchCourseDetail = createAsyncThunk(
  'onlineCourses/fetchCourseDetail',
  async (courseId: number | string, { rejectWithValue }) => {
    try {
      const url = getCourseDetailUrl(courseId);
      const response = await api.get(url);
      // Handle the new API response structure with data wrapper
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course details');
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
    clearCourseDetail: (state) => {
      state.selectedCourse = null;
      state.courseDetailError = null;
    },
    clearCourseDetailError: (state) => {
      state.courseDetailError = null;
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
      })
      
      // Fetch course detail
      .addCase(fetchCourseDetail.pending, (state) => {
        state.courseDetailLoading = true;
        state.courseDetailError = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action: PayloadAction<OnlineCourse>) => {
        state.courseDetailLoading = false;
        state.selectedCourse = action.payload;
        state.courseDetailError = null;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.courseDetailLoading = false;
        state.courseDetailError = action.payload as string;
      });
  },
});

export const { clearCourses, clearError, clearCourseDetail, clearCourseDetailError } = onlineCoursesSlice.actions;
export default onlineCoursesSlice.reducer;
