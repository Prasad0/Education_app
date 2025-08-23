import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  id: string;
  name: string;
  current_standard?: string;
  target_exam?: string;
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
  const currentStudent = students.find(s => s.id === currentStudentId);
  
  if (!currentStudent) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.switcher}
        onPress={() => {
          // For now, just cycle through students
          const currentIndex = students.findIndex(s => s.id === currentStudentId);
          const nextIndex = (currentIndex + 1) % students.length;
          onStudentSelect(students[nextIndex].id);
        }}
      >
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {currentStudent.name}
          </Text>
          {currentStudent.current_standard && (
            <Text style={styles.studentDetails} numberOfLines={1}>
              {currentStudent.current_standard}
              {currentStudent.target_exam && ` • ${currentStudent.target_exam}`}
            </Text>
          )}
        </View>
        <View style={styles.switchIndicator}>
          <Text style={styles.switchText}>
            {students.length > 1 ? `${currentStudentId ? students.findIndex(s => s.id === currentStudentId) + 1 : 1}/${students.length}` : ''}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minHeight: 44,
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  switchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  switchText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default StudentSwitcher;
