// Example usage of the course detail API
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCourseDetail, clearCourseDetail } from '../store/slices/onlineCoursesSlice';

// Example React component hook for using course detail API
export const useCourseDetail = () => {
  const dispatch = useAppDispatch();
  const { selectedCourse, courseDetailLoading, courseDetailError } = useAppSelector(
    (state) => state.onlineCourses
  );

  const getCourseDetail = (courseId: number | string) => {
    dispatch(fetchCourseDetail(courseId));
  };

  const clearCourse = () => {
    dispatch(clearCourseDetail());
  };

  return {
    course: selectedCourse,
    loading: courseDetailLoading,
    error: courseDetailError,
    getCourseDetail,
    clearCourse,
  };
};

// Example usage in a component:
/*
import { useCourseDetail } from '../utils/courseApiExample';

const CourseDetailScreen = ({ courseId }: { courseId: number }) => {
  const { course, loading, error, getCourseDetail, clearCourse } = useCourseDetail();

  useEffect(() => {
    if (courseId) {
      getCourseDetail(courseId);
    }
    
    // Cleanup when component unmounts
    return () => {
      clearCourse();
    };
  }, [courseId]);

  if (loading) return <Text>Loading course details...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!course) return <Text>No course found</Text>;

  return (
    <View>
      <Text>{course.title}</Text>
      <Text>{course.short_description}</Text>
      <Text>Price: {course.price}</Text>
      <Text>Instructor: {course.instructor.name}</Text>
      // ... render other course details
    </View>
  );
};
*/

// Direct API call example (without Redux):
/*
import { api, getCourseDetailUrl } from '../config/api';

const fetchCourseDirectly = async (courseId: number) => {
  try {
    const response = await api.get(getCourseDetailUrl(courseId));
    console.log('Course details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};
*/

