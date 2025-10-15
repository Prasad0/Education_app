import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, getApiUrl, API_CONFIG } from '../../config/api';

// Types based on the API response structure
export interface StudyMaterialSubject {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  is_science: boolean;
  is_mathematics: boolean;
}

export interface StudyMaterialTargetExam {
  id: number;
  name: string;
  code: string;
  full_name: string;
  description: string;
  exam_type: string;
}

export interface StudyMaterial {
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

export interface StudyMaterialsResponse {
  next: string | null;
  previous: string | null;
  count: number;
  data: StudyMaterial[];
}

export interface StudyMaterialsState {
  materials: StudyMaterial[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  hasNextPage: boolean;
  currentPage: number;
  totalCount: number;
  downloading: { [key: number]: boolean };
  downloadError: { [key: number]: string | null };
}

const initialState: StudyMaterialsState = {
  materials: [],
  loading: false,
  error: null,
  refreshing: false,
  hasNextPage: false,
  currentPage: 0,
  totalCount: 0,
  downloading: {},
  downloadError: {},
};

// Async thunks
export const fetchStudyMaterials = createAsyncThunk(
  'studyMaterials/fetchStudyMaterials',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.STUDY_MATERIALS)}?page=${page}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch study materials');
    }
  }
);

export const loadMoreStudyMaterials = createAsyncThunk(
  'studyMaterials/loadMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { studyMaterials: StudyMaterialsState };
      const { currentPage, hasNextPage } = state.studyMaterials;
      
      if (!hasNextPage) {
        throw new Error('No more pages to load');
      }

      const nextPage = currentPage + 1;
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.STUDY_MATERIALS)}?page=${nextPage}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load more study materials');
    }
  }
);

export const refreshStudyMaterials = createAsyncThunk(
  'studyMaterials/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${getApiUrl(API_CONFIG.ENDPOINTS.STUDY_MATERIALS)}?page=1`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh study materials');
    }
  }
);

export const downloadStudyMaterial = createAsyncThunk(
  'studyMaterials/download',
  async (materialId: number, { rejectWithValue }) => {
    try {
      // This would typically trigger a download or return a download URL
      // For now, we'll simulate the download process
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.STUDY_MATERIALS)}${materialId}/download/`;
      const response = await api.post(url);
      return { materialId, downloadUrl: response.data.download_url || response.data.file };
    } catch (error: any) {
      return rejectWithValue({ materialId, error: error.response?.data?.message || 'Failed to download material' });
    }
  }
);

const studyMaterialsSlice = createSlice({
  name: 'studyMaterials',
  initialState,
  reducers: {
    clearStudyMaterials: (state) => {
      state.materials = [];
      state.hasNextPage = false;
      state.currentPage = 0;
      state.totalCount = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDownloadError: (state, action: PayloadAction<number>) => {
      state.downloadError[action.payload] = null;
    },
    setDownloading: (state, action: PayloadAction<{ materialId: number; downloading: boolean }>) => {
      state.downloading[action.payload.materialId] = action.payload.downloading;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch study materials
      .addCase(fetchStudyMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyMaterials.fulfilled, (state, action: PayloadAction<StudyMaterialsResponse>) => {
        state.loading = false;
        state.materials = action.payload.data;
        state.hasNextPage = !!action.payload.next;
        state.currentPage = 1;
        state.totalCount = action.payload.count;
        state.error = null;
      })
      .addCase(fetchStudyMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load more study materials
      .addCase(loadMoreStudyMaterials.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMoreStudyMaterials.fulfilled, (state, action: PayloadAction<StudyMaterialsResponse>) => {
        state.loading = false;
        state.materials = [...state.materials, ...action.payload.data];
        state.hasNextPage = !!action.payload.next;
        state.currentPage += 1;
        state.error = null;
      })
      .addCase(loadMoreStudyMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Refresh study materials
      .addCase(refreshStudyMaterials.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshStudyMaterials.fulfilled, (state, action: PayloadAction<StudyMaterialsResponse>) => {
        state.refreshing = false;
        state.materials = action.payload.data;
        state.hasNextPage = !!action.payload.next;
        state.currentPage = 1;
        state.totalCount = action.payload.count;
        state.error = null;
      })
      .addCase(refreshStudyMaterials.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      })
      
      // Download study material
      .addCase(downloadStudyMaterial.pending, (state, action) => {
        state.downloading[action.meta.arg] = true;
        state.downloadError[action.meta.arg] = null;
      })
      .addCase(downloadStudyMaterial.fulfilled, (state, action) => {
        state.downloading[action.payload.materialId] = false;
        state.downloadError[action.payload.materialId] = null;
      })
      .addCase(downloadStudyMaterial.rejected, (state, action) => {
        const { materialId, error } = action.payload as { materialId: number; error: string };
        state.downloading[materialId] = false;
        state.downloadError[materialId] = error;
      });
  },
});

export const { clearStudyMaterials, clearError, clearDownloadError, setDownloading } = studyMaterialsSlice.actions;
export default studyMaterialsSlice.reducer;
