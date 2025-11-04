import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  id: number | string;
  name: string;
  current_standard?: string;
  target_exams?: string[];
  target_exam?: string; // Legacy support
}

interface StudentSwitcherProps {
  students: Student[];
  currentStudentId: string;
  onStudentSelect: (studentId: string) => void;
}

const StudentSwitcher: React.FC<StudentSwitcherProps> = ({
  students,
  currentStudentId,
  onStudentSelect,
}) => {
  // If no students or empty array, don't render
  if (!students || students.length === 0) {
    return null;
  }

  // If no currentStudentId but we have students, use the first one
  const effectiveStudentId = currentStudentId || (students.length > 0 ? String(students[0].id) : '');
  const currentStudent = students.find(s => String(s.id) === String(effectiveStudentId)) || students[0];
  
  if (!currentStudent) return null;

  // Get target exam display (support both array and single value)
  const targetExamDisplay = currentStudent.target_exams && currentStudent.target_exams.length > 0
    ? currentStudent.target_exams[0] // Show first target exam
    : currentStudent.target_exam || '';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.switcher}
        onPress={() => {
          if (students.length <= 1) return; // Don't switch if only one child
          // Cycle through students
          const currentIndex = students.findIndex(s => String(s.id) === String(effectiveStudentId));
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % students.length : 0;
          onStudentSelect(String(students[nextIndex].id));
        }}
        disabled={students.length <= 1}
        activeOpacity={0.7}
      >
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1} ellipsizeMode="tail">
            {currentStudent.name}
          </Text>
          {currentStudent.current_standard && students.length === 1 && (
            <Text style={styles.studentDetails} numberOfLines={1} ellipsizeMode="tail">
              {currentStudent.current_standard}
            </Text>
          )}
        </View>
        {students.length > 1 && (
          <View style={styles.switchIndicator}>
            <Ionicons name="chevron-down" size={12} color="#6b7280" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 0,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    minHeight: 36,
    width: '100%',
    maxWidth: '100%',
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: 4,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  studentDetails: {
    fontSize: 10,
    color: '#6b7280',
  },
  switchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingLeft: 2,
  },
  switchText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default StudentSwitcher;
