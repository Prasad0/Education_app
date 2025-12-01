import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {api, getApiUrl, API_CONFIG} from '../../config/api';
import {storeTokens, storeUser, clearStorage} from '../../utils/tokenStorage';

interface AuthState {
  phoneNumber: string;
  otp: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  profileStatus: {
    hasProfile: boolean;
    isCompleted: boolean;
    userType: string | null;
    nextSteps: string[];
  } | null;
  profile: any | null;
  selectedChildId: number | null; // ID of the currently selected child (for parents)
}

const initialState: AuthState = {
  phoneNumber: '',
  otp: '',
  isLoading: false,
  isAuthenticated: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  user: null,
  profileStatus: null,
  profile: null,
  selectedChildId: null,
};

// Async thunk for sending OTP
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phoneNumber: string, {rejectWithValue}) => {
    try {
      //http://13.200.17.30/api/user_auth/users/send_otp/
      const response = await api.post(API_CONFIG.ENDPOINTS.SEND_OTP, {
        phone_number: phoneNumber
      });
      
      if (response.data.data.success) {
        return {
          success: true, 
          message: response.data.data.message,
          phoneNumber: response.data.data.phone_number,
          otpCode: response.data.data.otp_code
        };
      } else {
        return rejectWithValue('Failed to send OTP');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to send OTP');
    }
  }
);

// Async thunk for verifying OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({phoneNumber, otp}: {phoneNumber: string; otp: string}, {rejectWithValue}) => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.VERIFY_OTP, {
        phone_number: phoneNumber,
        otp_code: otp
      });
      
      if (response.data.data.success) {
        return {
          success: true,
          message: response.data.data.message,
          user: response.data.data.user,
          accessToken: response.data.data.tokens.access,
          refreshToken: response.data.data.tokens.refresh
        };
      } else {
        return rejectWithValue('Failed to verify OTP');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to verify OTP');
    }
  }
);

// Async thunk for checking profile status
export const checkProfileStatus = createAsyncThunk(
  'auth/checkProfileStatus',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const accessToken = state.auth.accessToken;
      
      if (!accessToken) {
        return rejectWithValue('No access token available');
      }

      const response = await api.get(API_CONFIG.ENDPOINTS.PROFILE_STATUS);
      
      if (response.data.data.success) {
        return {
          hasProfile: response.data.data.has_profile,
          isCompleted: response.data.data.is_completed,
          userType: response.data.data.user_type,
          nextSteps: response.data.data.next_steps
        };
      } else {
        return rejectWithValue('Failed to get profile status');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to get profile status');
    }
  }
);

// Async thunk for creating profile
export const createProfile = createAsyncThunk(
  'auth/createProfile',
  async (profileData: any, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const accessToken = state.auth.accessToken;
      
      if (!accessToken) {
        return rejectWithValue('No access token available');
      }

      const response = await api.post(API_CONFIG.ENDPOINTS.CREATE_PROFILE, profileData);
      
      if (response.data.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to create profile');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to create profile');
    }
  }
);

// Async thunk for adding child (for parents)
export const addChild = createAsyncThunk(
  'auth/addChild',
  async (childrenData: any[], {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const accessToken = state.auth.accessToken;
      
      if (!accessToken) {
        return rejectWithValue('No access token available');
      }

      const response = await api.post(API_CONFIG.ENDPOINTS.ADD_CHILD, childrenData);
      
      if (response.data.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to add children');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to add children');
    }
  }
);

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const accessToken = state.auth.accessToken;
      
      if (!accessToken) {
        return rejectWithValue('No access token available');
      }

      const response = await api.get(API_CONFIG.ENDPOINTS.GET_PROFILE);
      
      if (response.data?.data?.success && response.data?.data?.profile) {
        const profileData = response.data.data.profile;
        return profileData;
      } else {
        return rejectWithValue('Invalid response format or profile not found');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to get user profile');
    }
  }
);

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const accessToken = state.auth.accessToken;
      
      if (!accessToken) {
        return rejectWithValue('No access token available');
      }

      const response = await api.put(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, profileData);
      
      if (response.data?.data?.success && response.data?.data?.profile) {
        return response.data.data.profile;
      } else if (response.data?.data) {
        // Sometimes the profile is directly in data
        return response.data.data;
      } else {
        return rejectWithValue('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      if (error.response?.data?.detail) {
        return rejectWithValue(error.response.data.detail);
      }
      return rejectWithValue('Failed to update user profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setOtp: (state, action: PayloadAction<string>) => {
      state.otp = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{accessToken: string; refreshToken: string}>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    setProfileStatus: (state, action: PayloadAction<{
      hasProfile: boolean;
      isCompleted: boolean;
      userType: string | null;
      nextSteps: string[];
    }>) => {
      state.profileStatus = action.payload;
    },
    restoreAuth: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.phoneNumber = '';
      state.otp = '';
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.profileStatus = null;
      state.profile = null;
      state.selectedChildId = null;
      
      // Clear stored tokens and user data
      clearStorage();
    },
    setSelectedChildId: (state, action: PayloadAction<number | null>) => {
      state.selectedChildId = action.payload;
    },
    clearCoachingData: (state) => {
      // This action will be used to clear coaching data when logging out
      // The actual clearing will be done by dispatching clearData from coaching slice
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.phoneNumber = action.payload.phoneNumber || state.phoneNumber;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        
        // Store tokens and user data in AsyncStorage
        storeTokens(action.payload.accessToken, action.payload.refreshToken);
        storeUser(action.payload.user);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Check Profile Status
      .addCase(checkProfileStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkProfileStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profileStatus = action.payload;
      })
      .addCase(checkProfileStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Profile
      .addCase(createProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const profileData = action.payload.profile || action.payload;
        state.profile = profileData;
        state.profileStatus = {
          hasProfile: true,
          isCompleted: true,
          userType: profileData.user_type,
          nextSteps: []
        };
        
        // Set first child as default if parent has children
        if (profileData.user_type === 'parent' && profileData.children && profileData.children.length > 0) {
          state.selectedChildId = profileData.children[0].id;
        }
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Child
      .addCase(addChild.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addChild.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(addChild.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.profile = action.payload;
        
        // Set first child as default if parent has children and no child is selected
        if (action.payload.user_type === 'parent' && action.payload.children && action.payload.children.length > 0) {
          if (!state.selectedChildId) {
            state.selectedChildId = action.payload.children[0].id;
          }
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('Failed to fetch user profile:', action.payload);
      })
      // Update User Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.profile = action.payload;
        
        // Set first child as default if parent has children and no child is selected
        if (action.payload.user_type === 'parent' && action.payload.children && action.payload.children.length > 0) {
          if (!state.selectedChildId) {
            state.selectedChildId = action.payload.children[0].id;
          }
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('Failed to update user profile:', action.payload);
      });
  },
});

export const {
  setPhoneNumber,
  setSelectedChildId, 
  setOtp, 
  clearError, 
  setTokens, 
  setProfileStatus, 
  restoreAuth, 
  logout, 
  clearCoachingData
} = authSlice.actions;

export default authSlice.reducer;
