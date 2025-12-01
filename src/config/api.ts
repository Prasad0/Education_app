import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Extend AxiosRequestConfig to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
}

// Environment Configuration
// In development, use your local machine's IP address
// In production, use HTTPS URLs
const ENV_CONFIG = {
  development: {
    BASE_URL: 'https://learn.crusheducation.in', // Development server (port 3000)
    API_BASE_URL: 'https://learn.crusheducation.in/api',
    API_TIMEOUT: 10000,
    LOG_LEVEL: 'debug' as const,
  },
  production: {
    BASE_URL: 'https://learn.crusheducation.in',
    API_BASE_URL: 'https://learn.crusheducation.in/api',
    API_TIMEOUT: 15000,
    LOG_LEVEL: 'error' as const,
  },
};

// Determine current environment
const isDevelopment = __DEV__;
const currentEnv = isDevelopment ? 'development' : 'production';
const config = ENV_CONFIG[currentEnv];


export const API_CONFIG = {
  BASE_URL: config.BASE_URL,
  API_BASE_URL: config.API_BASE_URL,
  API_TIMEOUT: config.API_TIMEOUT,
  LOG_LEVEL: config.LOG_LEVEL,
  ENDPOINTS: {
    SEND_OTP: '/user_auth/users/send_otp/',
    VERIFY_OTP: '/user_auth/users/verify_otp/',
    PROFILE_STATUS: '/user_auth/users/profile_status/',
    CREATE_PROFILE: '/user_auth/users/create_profile/',
    UPDATE_PROFILE: '/user_auth/users/update_profile/',
    ADD_CHILD: '/user_auth/users/add_child/',
    GET_PROFILE: '/user_auth/users/get_profile/',
    COACHING_CENTERS: '/coachings/',
    ONLINE_COURSES: '/online-courses/courses/',
    COURSE_DETAIL: '/online-courses/courses/', // Will be appended with courseId
    COURSE_ENROLL: '/online-courses/courses/', // Will be appended with courseId/enroll/
    ENROLLMENTS: '/online-courses/enrollments/',
    STUDY_MATERIALS: '/online-courses/study-materials/',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

// Utility function to get course detail URL
export const getCourseDetailUrl = (courseId: number | string) => {
  return `${getApiUrl(API_CONFIG.ENDPOINTS.COURSE_DETAIL)}${courseId}/`;
};

// Utility function to get course enrollment URL
export const getCourseEnrollUrl = (courseId: number | string) => {
  return `${getApiUrl(API_CONFIG.ENDPOINTS.COURSE_ENROLL)}${courseId}/enroll/`;
};

// Enhanced error logging function
const logError = (error: AxiosError, context: string) => {
  const errorDetails = {
    context,
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    data: error.response?.data,
    headers: error.response?.headers,
    requestData: error.config?.data,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    environment: currentEnv,
  };

  if (config.LOG_LEVEL === 'debug') {
    console.group(`🚨 API Error: ${context}`);
    console.error('Full error details:', errorDetails);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    console.error('Error response headers:', error.response?.headers);
    console.error('Request URL:', error.config?.url);
    console.error('Request method:', error.config?.method);
    console.error('Request data:', error.config?.data);
    console.groupEnd();
  } else {
    console.error(`🚨 API Error: ${context}`, {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
  }

  // In production, you might want to send this to a logging service
  // analytics.logError(errorDetails);
};

// Create axios instance with enhanced configuration
export const api = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: API_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `CoachingFinderApp/${Platform.OS}/1.0.0`,
  },
  // Enable request/response logging in development
  ...(isDevelopment && {
    validateStatus: (status) => {
      return status >= 200 && status < 300;
    },
  }),
});

// Enhanced request interceptor with better error handling
api.interceptors.request.use(
  async (config: ExtendedAxiosRequestConfig) => {
    try {
      // Log request in development
      if (isDevelopment) {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          headers: config.headers,
        });
      }

      // Get authentication token
      let token = await AsyncStorage.getItem('accessToken');
      
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
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (isDevelopment) {
          
        }
      }

      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };
      
    } catch (error) {
      logError(error as AxiosError, 'Request Interceptor');
      // Don't fail the request, just log the error
    }
    
    return config;
  },
  (error: AxiosError) => {
    logError(error, 'Request Interceptor Error');
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (isDevelopment) {
      const extendedConfig = response.config as ExtendedAxiosRequestConfig;
      const duration = extendedConfig.metadata?.startTime 
        ? new Date().getTime() - extendedConfig.metadata.startTime.getTime()
        : 'unknown';
      
      console.log(`📥 API Response: ${response.status} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    // Enhanced error handling with different error types
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear tokens and redirect to login
          console.warn('🔒 Unauthorized access, clearing auth tokens');
          await AsyncStorage.multiRemove(['accessToken', 'auth_tokens']);
          // You might want to trigger a navigation to login screen here
          break;
          
        case 403:
          console.warn('🚫 Forbidden access');
          break;
          
        case 404:
          console.warn('🔍 Resource not found');
          break;
          
        case 429:
          console.warn('⏰ Rate limited, consider implementing retry logic');
          break;
          
        case 500:
          console.error('💥 Internal server error');
          break;
          
        default:
          console.warn(`⚠️ HTTP Error ${status}`);
      }
      
      logError(error, `Response Error ${status}`);
      
    } else if (error.request) {
      // Request was made but no response received (network error)
      logError(error, 'Network Error - No Response');
      
      // Provide user-friendly error message
      error.message = 'Network error: Unable to connect to server. Please check your internet connection.';
      
    } else {
      // Something else happened while setting up the request
      logError(error, 'Request Setup Error');
    }

    // Return a rejected promise with enhanced error information
    return Promise.reject({
      ...error,
      userMessage: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      environment: currentEnv,
    });
  }
);

// Utility function to check if error is a network error
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

// Utility function to get user-friendly error message
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Network error: Please check your internet connection and try again.';
  }
  
  if (error.response?.status === 401) {
    return 'Session expired. Please log in again.';
  }
  
  if (error.response?.status === 403) {
    return 'Access denied. You don\'t have permission to perform this action.';
  }
  
  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.response?.status === 409) {
    return 'Conflict: This action cannot be completed due to a conflict with the current state.';
  }
  
  if (error.response?.status >= 500) {
    return 'Server error: Please try again later.';
  }
  
  return error.userMessage || 'An unexpected error occurred. Please try again.';
};

// Utility function to get enrollment-specific error message
export const getEnrollmentErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Network error: Please check your internet connection and try again.';
  }
  
  if (error.response?.status === 400) {
    const errorData = error.response.data;
    if (errorData?.detail || errorData?.message) {
      return errorData.detail || errorData.message;
    } else if (errorData?.non_field_errors) {
      return errorData.non_field_errors[0] || 'Invalid enrollment request';
    } else {
      return 'You may already be enrolled in this course or the enrollment request is invalid.';
    }
  }
  
  if (error.response?.status === 401) {
    return 'Session expired. Please log in again.';
  }
  
  if (error.response?.status === 403) {
    return 'Access denied. You don\'t have permission to enroll in this course.';
  }
  
  if (error.response?.status === 404) {
    return 'Course not found.';
  }
  
  if (error.response?.status === 409) {
    return 'You are already enrolled in this course!';
  }
  
  if (error.response?.status === 500) {
    const errorData = error.response.data;
    if (errorData?.detail && (
      errorData.detail.toLowerCase().includes('already enrolled') ||
      errorData.detail.toLowerCase().includes('duplicate') ||
      errorData.detail.toLowerCase().includes('exists')
    )) {
      return 'You are already enrolled in this course!';
    } else {
      return 'Server error occurred during enrollment. Please try again later.';
    }
  }
  
  return 'An unexpected error occurred during enrollment. Please try again.';
};

// Export environment info for debugging
export const getEnvironmentInfo = () => ({
  environment: currentEnv,
  baseUrl: config.BASE_URL,
  apiBaseUrl: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  isDevelopment,
  platform: Platform.OS,
});

export default api;
