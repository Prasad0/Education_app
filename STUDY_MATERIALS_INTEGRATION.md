# Study Materials API Integration

## Overview
This document describes the integration of the study materials API into the MaterialsTab component in the OnlineScreen folder.

## API Endpoint
- **URL**: `https://learn.crusheducation.in/api/online-courses/study-materials/`
- **Method**: GET
- **Authentication**: Bearer token required

## Implementation Details

### 1. Redux Store Integration
- Created `studyMaterialsSlice.ts` in `/src/store/slices/`
- Added study materials reducer to the main store configuration
- Implemented async thunks for fetching, refreshing, and downloading study materials

### 2. API Configuration
- Added `STUDY_MATERIALS` endpoint to `API_CONFIG.ENDPOINTS` in `/src/config/api.ts`
- Endpoint: `/online-courses/study-materials/`

### 3. MaterialsTab Component Updates
- Replaced mock data with real API integration
- Added loading, error, and empty states
- Implemented pull-to-refresh functionality
- Added file download functionality with progress tracking
- Implemented proper error handling and retry mechanism

### 4. Data Structure
The API returns study materials with the following structure:
```typescript
interface StudyMaterial {
  id: number;
  title: string;
  description: string;
  material_type: string;
  subjects: StudyMaterialSubject[];
  target_exams: StudyMaterialTargetExam[];
  file: string | null;
  file_size_mb: string;
  download_url: string;
  is_free: boolean;
  price: string;
  download_count: number;
  rating: string;
  thumbnail: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
```

### 5. Features Implemented
- **Real-time Data**: Fetches actual study materials from the API
- **Search Functionality**: Filters materials by title, subject, or material type
- **File Download**: Downloads files using expo-file-system and shares them
- **Progress Tracking**: Shows download progress and status
- **Error Handling**: Shows user-friendly error messages with retry option
- **Loading States**: Displays loading indicators during API calls and downloads
- **Pull-to-Refresh**: Allows users to refresh the data
- **Empty State**: Shows appropriate message when no materials exist
- **File Type Icons**: Different icons for different material types (PDF, Video, Notes, Formula)

### 6. Download Functionality
- Uses `expo-file-system` for downloading files
- Uses `expo-sharing` for sharing downloaded files
- Shows download progress with loading indicators
- Handles download errors gracefully
- Supports different file types (PDF, Excel, etc.)

### 7. Material Types Supported
- **PDF**: Document files with PDF icon
- **Video**: Video files with video camera icon
- **Notes**: Text-based notes with book icon
- **Formula**: Formula sheets with calculator icon

### 8. Error Handling
- Network errors are handled gracefully
- API errors are displayed with user-friendly messages
- Download errors are shown per material
- Automatic error clearing after 5 seconds
- Retry functionality for failed requests

### 9. Safety Checks
- Added null/undefined checks for all data fields
- Fallback values for missing data
- Safe file size formatting
- Proper subject display handling

## Usage
The MaterialsTab component now automatically fetches and displays study materials when the component mounts. Users can:
- View available study materials with details
- Search through materials by title, subject, or type
- Download free materials directly
- See download progress and status
- Pull down to refresh the data
- See loading and error states
- Retry failed requests

## Dependencies
- Redux Toolkit for state management
- React Native components for UI
- Axios for API calls
- AsyncStorage for token management
- expo-file-system for file downloads
- expo-sharing for file sharing

## File Download Process
1. User taps download button
2. System checks if file URL is available
3. Creates a local filename from the material title
4. Downloads file to device storage
5. Shares the file using the device's sharing capabilities
6. Shows success/error feedback to user
