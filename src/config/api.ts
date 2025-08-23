export const API_CONFIG = {
  BASE_URL: 'http://65.0.135.170',
  API_BASE_URL: 'http://65.0.135.170/api',
  ENDPOINTS: {
    SEND_OTP: '/user_auth/users/send_otp/',
    VERIFY_OTP: '/user_auth/users/verify_otp/',
    PROFILE_STATUS: '/user_auth/users/profile_status/',
    CREATE_PROFILE: '/user_auth/users/create_profile/',
    ADD_CHILD: '/user_auth/users/add_child/',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};
