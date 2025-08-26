import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
  BASE_URL: 'http://65.0.135.170',
  API_BASE_URL: 'http://65.0.135.170/api',
  ENDPOINTS: {
    SEND_OTP: '/user_auth/users/send_otp/',
    VERIFY_OTP: '/user_auth/users/verify_otp/',
    PROFILE_STATUS: '/user_auth/users/profile_status/',
    CREATE_PROFILE: '/user_auth/users/create_profile/',
    ADD_CHILD: '/user_auth/users/add_child/',
    GET_PROFILE: '/user_auth/users/get_profile/',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

// Create axios instance
export const api = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // First try to get token from the correct storage key
      let token = await AsyncStorage.getItem('accessToken');
      
      // If not found, try to get from the nested structure
      if (!token) {
        const tokensData = await AsyncStorage.getItem('auth_tokens');
        if (tokensData) {
          const tokens = JSON.parse(tokensData);
          token = tokens.accessToken;
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token in API interceptor:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);
