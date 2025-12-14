import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';

interface WishlistCourse {
  id: number;
  user: string;
  child: number | null;
  course: any; // Full course object
  added_at: string;
}

interface WishlistState {
  wishlistItems: WishlistCourse[];
  wishlistCourseIds: number[]; // For quick lookup
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  wishlistItems: [],
  wishlistCourseIds: [],
  isLoading: false,
  error: null,
};

// Fetch wishlist
export const fetchWishlist = createAsyncThunk(
  'courseWishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      let url = '/online-courses/wishlist/';
      
      // Add child_id if parent user has selected a child
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      if (userType === 'parent' && state.auth?.selectedChildId) {
        url += `?child_id=${state.auth.selectedChildId}`;
      }
      
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  'courseWishlist/addToWishlist',
  async (courseId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      const selectedChildId = state.auth?.selectedChildId;
      
      // Prepare request body - only send child_id if parent is logged in
      let requestBody: { child_id?: number; student_id?: number } | undefined = undefined;
      
      if (userType === 'parent' && selectedChildId) {
        const childIdNum = typeof selectedChildId === 'string' ? parseInt(selectedChildId, 10) : selectedChildId;
        requestBody = { child_id: childIdNum, student_id: childIdNum };
      }
      
      const response = await api.post(
        `/online-courses/courses/${courseId}/add_to_wishlist/`,
        requestBody
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  'courseWishlist/removeFromWishlist',
  async (courseId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const userType = state.auth?.user?.user_type || state.auth?.profile?.user_type || state.auth?.profileStatus?.userType;
      const selectedChildId = state.auth?.selectedChildId;
      
      // Prepare request body - only send child_id if parent is logged in
      let requestData: { child_id?: number; student_id?: number } | undefined = undefined;
      
      if (userType === 'parent' && selectedChildId) {
        const childIdNum = typeof selectedChildId === 'string' ? parseInt(selectedChildId, 10) : selectedChildId;
        requestData = { child_id: childIdNum, student_id: childIdNum };
      }
      
      await api.delete(
        `/online-courses/courses/${courseId}/remove_from_wishlist/`,
        { data: requestData }
      );
      return courseId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

const courseWishlistSlice = createSlice({
  name: 'courseWishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    // Optimistic update for better UX
    toggleWishlistOptimistic: (state, action: PayloadAction<number>) => {
      const courseId = action.payload;
      const index = state.wishlistCourseIds.indexOf(courseId);
      
      if (index > -1) {
        // Remove from wishlist
        state.wishlistCourseIds.splice(index, 1);
        state.wishlistItems = state.wishlistItems.filter(item => item.course.id !== courseId);
      } else {
        // Add to wishlist (temporarily)
        state.wishlistCourseIds.push(courseId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlistItems = action.payload;
        state.wishlistCourseIds = action.payload.map((item: WishlistCourse) => item.course.id);
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const wishlistItem = action.payload;
        state.wishlistItems.push(wishlistItem);
        if (!state.wishlistCourseIds.includes(wishlistItem.course.id)) {
          state.wishlistCourseIds.push(wishlistItem.course.id);
        }
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const courseId = action.payload;
        state.wishlistItems = state.wishlistItems.filter(item => item.course.id !== courseId);
        state.wishlistCourseIds = state.wishlistCourseIds.filter(id => id !== courseId);
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearWishlistError, toggleWishlistOptimistic } = courseWishlistSlice.actions;
export default courseWishlistSlice.reducer;

