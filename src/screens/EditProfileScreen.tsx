import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile, fetchUserProfile } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

// Relationship choices
const relationships = [
  { label: 'Father', value: 'father' },
  { label: 'Mother', value: 'mother' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Brother', value: 'brother' },
  { label: 'Sister', value: 'sister' },
  { label: 'Uncle', value: 'uncle' },
  { label: 'Aunt', value: 'aunt' },
  { label: 'Grandfather', value: 'grandfather' },
  { label: 'Grandmother', value: 'grandmother' },
  { label: 'Other', value: 'other' }
];

// Board choices
const boards = [
  { label: 'CBSE', value: 'cbse' },
  { label: 'ICSE', value: 'icse' },
  { label: 'State Board', value: 'state_board' },
  { label: 'International Board', value: 'international' }
];

// Standard/Class options
const standards = [
  { label: '5th', value: '5th' },
  { label: '6th', value: '6th' },
  { label: '7th', value: '7th' },
  { label: '8th', value: '8th' },
  { label: '9th', value: '9th' },
  { label: '10th', value: '10th' },
  { label: '11th', value: '11th' },
  { label: '12th', value: '12th' },
];

// Target exam choices
const targetExams = [
  { label: 'JEE Main', value: 'jee_main' },
  { label: 'JEE Advanced', value: 'jee_advanced' },
  { label: 'NEET', value: 'neet' },
  { label: 'BITSAT', value: 'bitsat' },
  { label: 'COMEDK', value: 'comedk' },
  { label: 'MHT CET', value: 'mht_cet' },
  { label: 'WBJEE', value: 'wbjee' },
  { label: 'KCET', value: 'kcet' },
  { label: 'EAMCET', value: 'eamcet' },
  { label: 'KEAM', value: 'keam' },
  { label: 'GUJCET', value: 'gujcet' },
  { label: 'CA Foundation', value: 'ca_foundation' },
  { label: 'CS Foundation', value: 'cs_foundation' },
  { label: 'CLAT', value: 'clat' },
  { label: 'NDA', value: 'nda' },
  { label: 'KVPY', value: 'kvpy' },
  { label: 'Olympiads', value: 'olympiads' },
  { label: 'Board Exam Preparation', value: 'boards_preparation' },
  { label: 'Other', value: 'other' }
];

const subjects = [
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Social Studies', 'Science'
];

interface EditProfileScreenProps {
  onBack: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { profile, user, isLoading } = useAppSelector(state => state.auth);
  const actualProfile = user || profile;

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    relationship_with_child: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    occupation: '',
    preferred_search_radius_km: '',
    budget_min: '',
    budget_max: '',
  });

  const [children, setChildren] = useState<any[]>([]);
  const [showDatePickerDOB, setShowDatePickerDOB] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true; // Prevent default behavior (app exit)
    });

    return () => {
      backHandler.remove();
    };
  }, [onBack]);

  useEffect(() => {
    if (actualProfile) {
      // Populate form with existing profile data
      setFormData({
        full_name: actualProfile.full_name || '',
        date_of_birth: actualProfile.date_of_birth || '',
        gender: actualProfile.gender || '',
        relationship_with_child: actualProfile.relationship_with_child || '',
        city: actualProfile.city || '',
        state: actualProfile.state || '',
        pincode: actualProfile.pincode || '',
        address: actualProfile.address || '',
        occupation: actualProfile.occupation || '',
        preferred_search_radius_km: actualProfile.preferred_search_radius_km?.toString() || '',
        budget_min: actualProfile.budget_min?.toString() || '',
        budget_max: actualProfile.budget_max?.toString() || '',
      });

      // Populate children if parent
      if (actualProfile.user_type === 'parent' && actualProfile.children) {
        const childrenData = Array.isArray(actualProfile.children) 
          ? actualProfile.children 
          : [];
        setChildren(childrenData.map((child: any) => {
          if (!child) {
            return {
              name: '',
              date_of_birth: '',
              gender: '',
              current_standard: '',
              board: '',
              subjects_interested: [],
              target_exams: [],
              budget_min: '',
              budget_max: '',
            };
          }
          return {
            id: child.id,
            name: child.name || '',
            date_of_birth: child.date_of_birth || '',
            gender: child.gender || '',
            current_standard: child.current_standard || '',
            board: child.board || '',
            subjects_interested: Array.isArray(child.subjects_interested) ? child.subjects_interested : [],
            target_exams: Array.isArray(child.target_exams) ? child.target_exams : [],
            budget_min: child.budget_min?.toString() || '',
            budget_max: child.budget_max?.toString() || '',
          };
        }));
      } else if (actualProfile.user_type === 'parent') {
        // Initialize empty children array if parent but no children
        setChildren([]);
      }
    }
  }, [actualProfile]);

  const formatDateForAPI = (dateString: string) => {
    // Return empty string if dateString is empty or invalid
    if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
      return '';
    }
    // Convert DD-MM-YYYY to DD-MM-YYYY format (API expects this format)
    if (dateString.includes('-')) {
      return dateString;
    }
    // If it's in another format, try to convert
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateString;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerDOB(false);
    }
    if (date) {
      setSelectedDate(date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setFormData({ ...formData, date_of_birth: `${day}-${month}-${year}` });
    }
  };

  const handleChildDateChange = (index: number, event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // Handle Android date picker
    }
    if (date) {
      const updatedChildren = [...children];
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      updatedChildren[index].date_of_birth = `${day}-${month}-${year}`;
      setChildren(updatedChildren);
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    setSaving(true);

    try {
      const profilePayload: any = {
        user_type: actualProfile?.user_type || 'student',
        full_name: formData.full_name,
        date_of_birth: formatDateForAPI(formData.date_of_birth),
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        address: formData.address,
        occupation: formData.occupation || null,
        preferred_search_radius_km: formData.preferred_search_radius_km ? parseInt(formData.preferred_search_radius_km) : null,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
      };

      // Add parent-specific fields
      if (actualProfile?.user_type === 'parent') {
        profilePayload.relationship_with_child = formData.relationship_with_child;
        
        // Add children array if parent
        if (children.length > 0) {
          profilePayload.children = children
            .filter(child => child && child.name) // Filter out invalid children
            .map(child => {
              // Safely parse budget values
              let budgetMin = null;
              let budgetMax = null;
              
              if (child.budget_min && child.budget_min.toString().trim() !== '') {
                const parsed = parseInt(child.budget_min.toString().trim(), 10);
                budgetMin = isNaN(parsed) ? null : parsed;
              }
              
              if (child.budget_max && child.budget_max.toString().trim() !== '') {
                const parsed = parseInt(child.budget_max.toString().trim(), 10);
                budgetMax = isNaN(parsed) ? null : parsed;
              }

              return {
                name: child.name || '',
                date_of_birth: formatDateForAPI(child.date_of_birth || ''),
                gender: child.gender || '',
                current_standard: child.current_standard || '',
                board: child.board || '',
                subjects_interested: Array.isArray(child.subjects_interested) ? child.subjects_interested : [],
                target_exams: Array.isArray(child.target_exams) ? child.target_exams : [],
                budget_min: budgetMin,
                budget_max: budgetMax,
              };
            });
        }
      }

      const result = await dispatch(updateProfile(profilePayload));

      if (updateProfile.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your profile has been updated successfully',
        });
        // Refresh profile data
        await dispatch(fetchUserProfile());
        onBack();
      } else {
        const errorMessage = result.payload as string || 'Failed to update profile';
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addChild = () => {
    setChildren([...children, {
      name: '',
      date_of_birth: '',
      gender: '',
      current_standard: '',
      board: '',
      subjects_interested: [],
      target_exams: [],
      budget_min: '',
      budget_max: '',
    }]);
  };

  const removeChild = (index: number) => {
    const updatedChildren = children.filter((_, i) => i !== index);
    setChildren(updatedChildren);
  };

  const updateChild = (index: number, field: string, value: any) => {
    if (index < 0 || index >= children.length) {
      console.warn('Invalid child index:', index);
      return;
    }
    const updatedChildren = [...children];
    if (!updatedChildren[index]) {
      console.warn('Child at index does not exist:', index);
      return;
    }
    updatedChildren[index] = {
      ...updatedChildren[index],
      [field]: value,
    };
    setChildren(updatedChildren);
  };

  const toggleChildSubject = (childIndex: number, subject: string) => {
    if (childIndex < 0 || childIndex >= children.length || !children[childIndex]) {
      console.warn('Invalid child index for subject toggle:', childIndex);
      return;
    }
    const updatedChildren = [...children];
    const currentSubjects = Array.isArray(updatedChildren[childIndex].subjects_interested) 
      ? updatedChildren[childIndex].subjects_interested 
      : [];
    if (currentSubjects.includes(subject)) {
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        subjects_interested: currentSubjects.filter((s: string) => s !== subject),
      };
    } else {
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        subjects_interested: [...currentSubjects, subject],
      };
    }
    setChildren(updatedChildren);
  };

  const toggleChildExam = (childIndex: number, exam: string) => {
    if (childIndex < 0 || childIndex >= children.length || !children[childIndex]) {
      console.warn('Invalid child index for exam toggle:', childIndex);
      return;
    }
    const updatedChildren = [...children];
    const currentExams = Array.isArray(updatedChildren[childIndex].target_exams) 
      ? updatedChildren[childIndex].target_exams 
      : [];
    if (currentExams.includes(exam)) {
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        target_exams: currentExams.filter((e: string) => e !== exam),
      };
    } else {
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        target_exams: [...currentExams, exam],
      };
    }
    setChildren(updatedChildren);
  };

  if (isLoading && !actualProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePickerDOB(true)}
              >
                <Text style={[styles.inputText, !formData.date_of_birth && styles.placeholderText]}>
                  {formData.date_of_birth || 'Select date of birth'}
                </Text>
              </TouchableOpacity>
              {showDatePickerDOB && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>

            {actualProfile?.user_type === 'parent' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship with Child</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.relationship_with_child}
                    onValueChange={(value) => setFormData({ ...formData, relationship_with_child: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select relationship" value="" />
                    {relationships.map((rel) => (
                      <Picker.Item key={rel.value} label={rel.label} value={rel.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
          </View>

          {/* Location Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Enter city"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="Enter state"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                placeholder="Enter pincode"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={formData.occupation}
                onChangeText={(text) => setFormData({ ...formData, occupation: text })}
                placeholder="Enter occupation"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Search Radius (km)</Text>
              <TextInput
                style={styles.input}
                value={formData.preferred_search_radius_km}
                onChangeText={(text) => setFormData({ ...formData, preferred_search_radius_km: text })}
                placeholder="Enter search radius"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget Min (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.budget_min}
                onChangeText={(text) => setFormData({ ...formData, budget_min: text })}
                placeholder="Enter minimum budget"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget Max (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.budget_max}
                onChangeText={(text) => setFormData({ ...formData, budget_max: text })}
                placeholder="Enter maximum budget"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Children Section (for parents) */}
          {actualProfile?.user_type === 'parent' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Children</Text>
                <TouchableOpacity onPress={addChild} style={styles.addButton}>
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                  <Text style={styles.addButtonText}>Add Child</Text>
                </TouchableOpacity>
              </View>

              {children.map((child, index) => {
                if (!child) {
                  return null;
                }
                return (
                <View key={index} style={styles.childCard}>
                  <View style={styles.childHeader}>
                    <Text style={styles.childTitle}>Child {index + 1}</Text>
                    {children.length > 1 && (
                      <TouchableOpacity onPress={() => removeChild(index)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={child.name || ''}
                      onChangeText={(text) => updateChild(index, 'name', text)}
                      placeholder="Enter child name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <TextInput
                      style={styles.input}
                      value={child.date_of_birth || ''}
                      onChangeText={(text) => updateChild(index, 'date_of_birth', text)}
                      placeholder="DD-MM-YYYY"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.gender || ''}
                        onValueChange={(value) => updateChild(index, 'gender', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select gender" value="" />
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Current Standard</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.current_standard || ''}
                        onValueChange={(value) => updateChild(index, 'current_standard', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select standard" value="" />
                        {standards.map((std) => (
                          <Picker.Item key={std.value} label={std.label} value={std.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Board</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={child.board || ''}
                        onValueChange={(value) => updateChild(index, 'board', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select board" value="" />
                        {boards.map((board) => (
                          <Picker.Item key={board.value} label={board.label} value={board.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Subjects Interested</Text>
                    <View style={styles.chipContainer}>
                      {subjects.map((subject) => (
                        <TouchableOpacity
                          key={subject}
                          style={[
                            styles.chip,
                            child.subjects_interested?.includes(subject) && styles.chipActive
                          ]}
                          onPress={() => toggleChildSubject(index, subject)}
                        >
                          <Text style={[
                            styles.chipText,
                            child.subjects_interested?.includes(subject) && styles.chipTextActive
                          ]}>
                            {subject}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Target Exams</Text>
                    <View style={styles.chipContainer}>
                      {targetExams.map((exam) => (
                        <TouchableOpacity
                          key={exam.value}
                          style={[
                            styles.chip,
                            child.target_exams?.includes(exam.value) && styles.chipActive
                          ]}
                          onPress={() => toggleChildExam(index, exam.value)}
                        >
                          <Text style={[
                            styles.chipText,
                            child.target_exams?.includes(exam.value) && styles.chipTextActive
                          ]}>
                            {exam.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Budget Min (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={child.budget_min?.toString() || ''}
                      onChangeText={(text) => updateChild(index, 'budget_min', text)}
                      placeholder="Enter minimum budget"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Budget Max (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={child.budget_max?.toString() || ''}
                      onChangeText={(text) => updateChild(index, 'budget_max', text)}
                      placeholder="Enter maximum budget"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                );
              })}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 56,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 10,
    position: 'absolute',
    left: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 40, // Space for back button on left
  },
  placeholder: {
    width: 40,
    minWidth: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  childCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EditProfileScreen;

