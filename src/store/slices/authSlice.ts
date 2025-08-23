import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import axios from 'axios';
import {getApiUrl, API_CONFIG} from '../../config/api';
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
};

// Async thunk for sending OTP
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phoneNumber: string, {rejectWithValue}) => {
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.SEND_OTP), {
        phone_number: phoneNumber
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
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
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.VERIFY_OTP), {
        phone_number: phoneNumber,
        otp_code: otp
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
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

      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE_STATUS), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
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

      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_PROFILE), profileData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
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

      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.ADD_CHILD), childrenData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
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
      
      // Clear stored tokens and user data
      clearStorage();
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
        state.profile = action.payload;
        state.profileStatus = {
          hasProfile: true,
          isCompleted: true,
          userType: action.payload.user_type,
          nextSteps: []
        };
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
      });
  },
});

export const {setPhoneNumber, setOtp, clearError, setTokens, setProfileStatus, restoreAuth, logout} = authSlice.actions;
export default authSlice.reducer;
