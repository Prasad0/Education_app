import { OnlineCoaching } from '.';

// Re-export types from the slice for convenience
export type {
  OnlineCourse as OnlineCoaching,
  CourseInstructor,
  CourseCategory,
  CourseLevel,
  CoursePlatform,
  CourseSubject,
  CourseTargetExam,
  OnlineCoursesResponse,
  OnlineCoursesState,
} from '../../store/slices/onlineCoursesSlice';

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'PDF' | 'Video' | 'Notes' | 'Questions';
  downloads: number;
  size: string;
  image: string;
  isFree: boolean;
  price?: string;
}

export interface PurchasedCourse {
  id: string;
  title: string;
  instructor: string;
  subject: string;
  progress: number;
  purchaseDate: string;
  expiryDate: string;
  image: string;
  platform: string;
}

export interface TabComponentProps {
  searchQuery: string;
  onCourseSelect?: (course: OnlineCoaching) => void;
}
