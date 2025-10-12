// Test function to verify course detail API is working
import { api, getCourseDetailUrl } from '../config/api';

export const testCourseDetailAPI = async (courseId: number = 1) => {
  try {
    console.log('Testing course detail API for course ID:', courseId);
    console.log('API URL:', getCourseDetailUrl(courseId));
    
    const response = await api.get(getCourseDetailUrl(courseId));
    console.log('Course detail API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Course detail API error:', error);
    throw error;
  }
};

// Test function to check if the API endpoint is accessible
export const testAPIConnectivity = async () => {
  try {
    console.log('Testing API connectivity...');
    const response = await api.get('/online-courses/courses/');
    console.log('API connectivity test response:', response.status);
    return true;
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return false;
  }
};

