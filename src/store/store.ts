import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import coachingReducer from './slices/coachingSlice';
import locationReducer from './slices/locationSlice';
import onlineCoursesReducer from './slices/onlineCoursesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    coaching: coachingReducer,
    location: locationReducer,
    onlineCourses: onlineCoursesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
