import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import coachingReducer from './slices/coachingSlice';
import locationReducer from './slices/locationSlice';
import onlineCoursesReducer from './slices/onlineCoursesSlice';
import enrollmentsReducer from './slices/enrollmentsSlice';
import studyMaterialsReducer from './slices/studyMaterialsSlice';
import privateTutorsReducer from './slices/privateTutorsSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    coaching: coachingReducer,
    location: locationReducer,
    onlineCourses: onlineCoursesReducer,
    enrollments: enrollmentsReducer,
    studyMaterials: studyMaterialsReducer,
    privateTutors: privateTutorsReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
