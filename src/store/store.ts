import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import coachingReducer from './slices/coachingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    coaching: coachingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
