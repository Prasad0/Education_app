# Enrollments API Integration

## Overview
This document describes the integration of the enrollments API into the MyCoursesTab component in the OnlineScreen folder.

## API Endpoint
- **URL**: `https://learn.crusheducation.in/api/online-courses/enrollments/`
- **Method**: GET
- **Authentication**: Bearer token required

## Implementation Details

### 1. Redux Store Integration
- Created `enrollmentsSlice.ts` in `/src/store/slices/`
- Added enrollments reducer to the main store configuration
- Implemented async thunks for fetching and refreshing enrollments

### 2. API Configuration
- Added `ENROLLMENTS` endpoint to `API_CONFIG.ENDPOINTS` in `/src/config/api.ts`
- Endpoint: `/online-courses/enrollments/`

### 3. MyCoursesTab Component Updates
- Replaced mock data with real API integration
- Added loading, error, and empty states
- Implemented pull-to-refresh functionality
- Added proper error handling and retry mechanism

### 4. Data Structure
The API returns enrollments with the following structure:
```typescript
interface Enrollment {
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
```

### 5. Features Implemented
- **Real-time Data**: Fetches actual enrollment data from the API
- **Search Functionality**: Filters courses by title, subject, or instructor
- **Progress Tracking**: Displays enrollment progress percentage
- **Error Handling**: Shows user-friendly error messages with retry option
- **Loading States**: Displays loading indicators during API calls
- **Pull-to-Refresh**: Allows users to refresh the data
- **Empty State**: Shows appropriate message when no enrollments exist

### 6. Error Handling
- Network errors are handled gracefully
- API errors are displayed with user-friendly messages
- Automatic error clearing after 5 seconds
- Retry functionality for failed requests

### 7. Safety Checks
- Added null/undefined checks for all data fields
- Fallback values for missing data
- Safe date formatting with error handling

## Usage
The MyCoursesTab component now automatically fetches and displays the user's enrolled courses when the component mounts. Users can:
- View their enrolled courses with progress
- Search through their courses
- Pull down to refresh the data
- See loading and error states
- Retry failed requests

## Dependencies
- Redux Toolkit for state management
- React Native components for UI
- Axios for API calls
- AsyncStorage for token management
