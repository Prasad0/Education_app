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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createProfile, addChild } from '../../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';

interface ParentOnboardingFormProps {
  navigation: any;
}

// Relationship choices matching API
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

// Board choices (simplified - using common values)
const boards = [
  { label: 'CBSE', value: 'cbse' },
  { label: 'ICSE', value: 'icse' },
  { label: 'State Board', value: 'state_board' },
  { label: 'International Board', value: 'international' }
];

// Stream choices matching API
const streams = [
  { label: 'Science (PCM+B)', value: 'science_pcmb' },
  { label: 'Science (PCB)', value: 'science_pcb' },
  { label: 'Science (PCM)', value: 'science_pcm' },
  { label: 'Commerce (with Maths)', value: 'commerce_maths' },
  { label: 'Commerce (without Maths)', value: 'commerce_no_maths' },
  { label: 'Arts/Humanities', value: 'arts_humanities' },
  { label: 'Vocational', value: 'vocational' },
  { label: 'Other', value: 'other' }
];

// Target exam choices matching API exactly
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

const ParentOnboardingScreen = ({ navigation }: ParentOnboardingFormProps) => {
  const dispatch = useAppDispatch();
  const { accessToken, isLoading } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    relationshipWithChild: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    occupation: '',
    educationLevel: '',
    preferredSearchRadius: '15',
    budgetMin: '',
    budgetMax: ''
  });

  const [children, setChildren] = useState([{
    name: '',
    date_of_birth: '',
    gender: '',
    current_standard: '',
    board: '',
    stream: '',
    current_school: '',
    subjects_interested: [] as string[],
    target_exams: [] as string[],
    budget_min: '',
    budget_max: ''
  }]);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showDatePickerDOB, setShowDatePickerDOB] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkLocationStatus();
  }, []);

  // Minimized logs
  useEffect(() => {}, [accessToken]);

  const checkLocationStatus = async () => {
    try {
      // Check current permission status first
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        // Try to get location, but don't fail if it doesn't work
        try {
          await getCurrentLocation();
        } catch (locationError) {
          // Don't reset permission, just mark location as unavailable
          setLocation(null);
        }
      } else {
        setLocationPermission(false);
        setLocation(null);
      }
    } catch (error) {
      console.error('Error checking location status:', error);
      setLocationPermission(false);
      setLocation(null);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        // Try to get location after permission is granted
        try {
          await getCurrentLocation();
        } catch (locationError) {
          // Keep permission granted but mark location as unavailable
          setLocation(null);
        }
      } else if (status === 'denied') {
        setLocationPermission(false);
        setLocation(null);
        Toast.show({
          type: 'error',
          text1: 'Location Permission Denied',
          text2: 'Please enable location access in your device settings.',
        });
        Alert.alert(
          'Location Permission Denied',
          'Location access is required to submit this form. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // On Android, we can try to open app settings
                if (Platform.OS === 'android') {
                  // This will open app-specific settings
                  Location.enableNetworkProviderAsync();
                }
              }
            }
          ]
        );
      } else {
        setLocationPermission(false);
        setLocation(null);
        Alert.alert(
          'Location Permission Required',
          'Location access is required to submit this form. This helps us find coaching centers near you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Try Again', 
              onPress: () => requestLocationPermission() 
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      setLocation(null);
      
      let errorMessage = 'Failed to request location permission. Please try again.';
      let errorTitle = 'Permission Error';
      
      if (error.message?.includes('Location request failed due to unsatisfied device settings')) {
        errorTitle = 'Device Settings Issue';
        errorMessage = 'Location services are not properly configured on your device. Please check your device settings and ensure location is enabled.';
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => {
              setTimeout(() => {
                requestLocationPermission();
              }, 1000);
            }
          }
        ]
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000, // Increased timeout
        distanceInterval: 10,
        mayShowUserSettingsDialog: true, // Show settings if needed
      });
      
      // Round coordinates to 4 decimal places to match API requirements
      const roundedLatitude = Math.round(currentLocation.coords.latitude * 10000) / 10000;
      const roundedLongitude = Math.round(currentLocation.coords.longitude * 10000) / 10000;

      setLocation({
        latitude: roundedLatitude,
        longitude: roundedLongitude
      });
      
      console.log('Location obtained successfully:', {
        original: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        rounded: {
          latitude: roundedLatitude,
          longitude: roundedLongitude,
        }
      });
      
    } catch (error: any) {
      console.error('Error getting current location:', error);
      
      let errorMessage = 'Could not get your current location. Please try again.';
      let errorTitle = 'Location Error';
      
      // Handle specific error cases
      if (error.message?.includes('Location request failed due to unsatisfied device settings')) {
        errorTitle = 'Device Settings Issue';
        errorMessage = 'Location services are not properly configured. Please check your device settings and ensure location is enabled.';
      } else if (error.message?.includes('Location is unavailable')) {
        errorTitle = 'Location Unavailable';
        errorMessage = 'Location is currently unavailable. Please try again in a few moments.';
      } else if (error.message?.includes('Location request timed out')) {
        errorTitle = 'Location Timeout';
        errorMessage = 'Location request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('Location permission denied')) {
        errorTitle = 'Permission Denied';
        errorMessage = 'Location permission was denied. Please enable location access in settings.';
        setLocationPermission(false);
      }
      
      // Don't show alert for every error, just log and update state
      setLocation(null);
      
      // Only show alert for critical errors
      if (errorTitle !== 'Location Error') {
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry', 
              onPress: () => {
                // Wait a bit before retrying
                setTimeout(() => {
                  getCurrentLocation();
                }, 2000);
              }
            }
          ]
        );
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerDOB(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePickerDOB(true);
  };



  const handleChildChange = (index: number, field: string, value: string) => {
    setChildren(prev => prev.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ));
  };

  const handleChildArrayChange = (index: number, field: string, value: string) => {
    setChildren(prev => prev.map((child, i) => {
      if (i === index) {
        const currentArray = [...child[field as keyof typeof child]] as string[];
        if (currentArray.includes(value)) {
          return { ...child, [field]: currentArray.filter(item => item !== value) };
        } else {
          return { ...child, [field]: [...currentArray, value] };
        }
      }
      return child;
    }));
  };

  const addChild = () => {
    setChildren(prev => [...prev, {
      name: '',
      date_of_birth: '',
      gender: '',
      current_standard: '',
      board: '',
      stream: '',
      current_school: '',
      subjects_interested: [],
      target_exams: [],
      budget_min: '',
      budget_max: ''
    }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(prev => prev.filter((_, i) => i !== index));
    }
  };

  const checkDeviceLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Toast.show({
          type: 'error',
          text1: 'Location Services Disabled',
          text2: 'Please enable location services in your device settings.',
        });
        Alert.alert(
          'Device Location Services Disabled',
          'Location services are disabled on your device. Please enable them in your device settings to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'android') {
                  // Try to open location settings
                  Location.enableNetworkProviderAsync();
                }
              }
            }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking device location services:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Failed to check location services.',
      });
      return false;
    }
  };

  const getLocationStatusText = () => {
    if (!locationPermission) {
      return 'Permission Required';
    }
    if (!location) {
      return 'Permission Granted - Getting Location...';
    }
    return 'Enabled & Available';
  };

  const isFormValid = () => {
    // At least one child is required
    if (children.length === 0) return false;
    
    const parentValid = formData.fullName && formData.relationshipWithChild && formData.dateOfBirth && formData.gender && formData.city && formData.state && formData.pincode;
    const childrenValid = children.every(child => 
      child.name && child.date_of_birth && child.gender && child.current_standard && child.board && child.target_exams.length > 0
    );
    return parentValid && childrenValid;
  };

  const handleSubmit = async () => {
    console.log('🚀 ParentOnboarding: Complete Setup button pressed');
    console.log('📋 Parent Form Data:', formData);
    console.log('👶 Children Data:', children);
    console.log('✅ Form Valid:', isFormValid());
    
    // Validate at least one child
    if (children.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'At Least One Child Required',
        text2: 'Please add at least one child before submitting.',
      });
      return;
    }

    if (!isFormValid()) {
      console.log('❌ Form Incomplete - Required fields missing');
      Toast.show({
        type: 'error',
        text1: 'Form Incomplete',
        text2: 'Please fill all required fields for parent and all children.',
      });
      return;
    }

    console.log('✅ All validations passed, proceeding with profile creation...');
    
    try {
      // Prepare children data in API format
      const childrenData = children.map(child => ({
        name: child.name,
        date_of_birth: child.date_of_birth,
        gender: child.gender,
        current_standard: child.current_standard,
        board: child.board,
        stream: child.stream || null,
        subjects_interested: child.subjects_interested,
        target_exams: child.target_exams,
        budget_min: child.budget_min ? parseInt(child.budget_min) : null,
        budget_max: child.budget_max ? parseInt(child.budget_max) : null,
      }));

      // Create parent profile with children in single API call
      const profileData = {
        user_type: 'parent',
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        relationship_with_child: formData.relationshipWithChild,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        occupation: formData.occupation || null,
        budget_min: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        children: childrenData // Include children in the same request
      };

      console.log('📤 Dispatching createProfile with parent + children data:', profileData);
      const result = await dispatch(createProfile(profileData));
      console.log('📥 createProfile result:', result);
      
      if (createProfile.fulfilled.match(result)) {
        console.log('✅ Profile created successfully!');
        Toast.show({
          type: 'success',
          text1: 'Profile Created',
          text2: `Your profile with ${childrenData.length} child${childrenData.length > 1 ? 'ren' : ''} has been created successfully!`,
        });
        console.log('🔄 Navigating to Home screen...');
        navigation.navigate('Home');
      } else if (createProfile.rejected.match(result)) {
        console.log('❌ Profile creation failed:', result.error);
        
        // Handle specific API errors
        if (result.payload && typeof result.payload === 'object' && 'data' in result.payload) {
          const apiResponse = result.payload.data as any;
          if (apiResponse && apiResponse.errors && typeof apiResponse.errors === 'object') {
            const errorMessages = Object.values(apiResponse.errors).flat();
            const errorText = errorMessages.join(', ');
            
            Toast.show({
              type: 'error',
              text1: 'Validation Error',
              text2: errorText,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Profile Creation Failed',
              text2: (apiResponse?.message as string) || 'Something went wrong. Please try again.',
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Profile Creation Failed',
            text2: 'Something went wrong. Please try again.',
          });
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error during profile creation:', error);
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Parent & Child Details</Text>
            <Text style={styles.headerSubtitle}>Help us find the perfect coaching for your child</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.formContainer}>
          {/* Header Icon */}
          <View style={styles.headerIcon}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
            </View>
          </View>

          {/* Location Status */}
          <View style={[
            styles.locationStatus, 
            !locationPermission || !location ? styles.locationStatusWarning : styles.locationStatusSuccess
          ]}>
            <Text style={[
              styles.locationStatusText,
              !locationPermission || !location ? styles.locationStatusTextWarning : styles.locationStatusTextSuccess
            ]}>
              📍 Location: {(() => {
                try {
                  if (!locationPermission) return 'Permission Required';
                  if (!location) return 'Permission Granted - Getting Location...';
                  return 'Enabled & Available';
                } catch (error) {
                  return 'Status Unknown';
                }
              })()}
            </Text>
            
            <View style={styles.locationButtonContainer}>
              {(() => {
                try {
                  if (!locationPermission) {
                    return (
                      <TouchableOpacity onPress={requestLocationPermission} style={styles.enableLocationButton}>
                        <Text style={styles.enableLocationButtonText}>Enable Location</Text>
                      </TouchableOpacity>
                    );
                  } else if (!location) {
                    return (
                      <TouchableOpacity onPress={getCurrentLocation} style={styles.enableLocationButton}>
                        <Text style={styles.enableLocationButtonText}>Get Location</Text>
                      </TouchableOpacity>
                    );
                  } else {
                    return <Text style={styles.locationSuccessText}>✓ Location Ready</Text>;
                  }
                } catch (error) {
                  return (
                    <TouchableOpacity onPress={requestLocationPermission} style={styles.enableLocationButton}>
                      <Text style={styles.enableLocationButtonText}>Enable Location</Text>
                    </TouchableOpacity>
                  );
                }
              })()}
              
              <TouchableOpacity onPress={checkLocationStatus} style={styles.refreshLocationButton}>
                <Text style={styles.refreshLocationButtonText}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={checkDeviceLocationServices} style={styles.deviceLocationButton}>
                <Text style={styles.deviceLocationButtonText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Warning Banner */}
          {(!locationPermission || !location) && (
            <View style={styles.locationWarningBanner}>
              <Text style={styles.locationWarningText}>
                ⚠️ Location access is mandatory to submit this form. We need your location to find coaching centers near you.
              </Text>
            </View>
          )}

          {/* Parent Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="DD-MM-YYYY"
                  value={formData.dateOfBirth}
                  onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                  editable={false}
                />
                <TouchableOpacity onPress={showDatePickerModal} style={styles.calendarButton}>
                  <Text style={styles.calendarButtonText}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship with Child *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.relationshipWithChild}
                  onValueChange={(value) => handleInputChange('relationshipWithChild', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select relationship" value="" />
                  {relationships.map((relation) => (
                    <Picker.Item key={relation.value} label={relation.label} value={relation.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                placeholder="Your occupation"
                value={formData.occupation}
                onChangeText={(value) => handleInputChange('occupation', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Education Level</Text>
              <TextInput
                style={styles.input}
                placeholder="Your education level"
                value={formData.educationLevel}
                onChangeText={(value) => handleInputChange('educationLevel', value)}
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your city"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your state"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your pincode"
                value={formData.pincode}
                onChangeText={(value) => handleInputChange('pincode', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Your complete address"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget Range (per month)</Text>
              <View style={styles.budgetContainer}>
                <TextInput
                  style={[styles.input, styles.budgetInput]}
                  placeholder="Min"
                  value={formData.budgetMin}
                  onChangeText={(value) => handleInputChange('budgetMin', value)}
                  keyboardType="numeric"
                />
                <Text style={styles.budgetSeparator}>to</Text>
                <TextInput
                  style={[styles.input, styles.budgetInput]}
                  placeholder="Max"
                  value={formData.budgetMax}
                  onChangeText={(value) => handleInputChange('budgetMax', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Children Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Children ({children.length})</Text>
              <TouchableOpacity onPress={addChild} style={styles.addChildButton}>
                <Text style={styles.addChildButtonText}>+ Add Child</Text>
              </TouchableOpacity>
            </View>

            {children.map((child, index) => (
              <View key={index} style={styles.childCard}>
                <View style={styles.childHeader}>
                  <Text style={styles.childTitle}>Child {index + 1}</Text>
                  {children.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeChild(index)}
                      style={styles.removeChildButton}>
                      <Text style={styles.removeChildButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Child's full name"
                    value={child.name}
                    onChangeText={(value) => handleChildChange(index, 'name', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD-MM-YYYY"
                    value={child.date_of_birth}
                    onChangeText={(value) => handleChildChange(index, 'date_of_birth', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.gender}
                      onValueChange={(value) => handleChildChange(index, 'gender', value)}
                      style={styles.picker}>
                      <Picker.Item label="Select gender" value="" />
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Standard *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.current_standard}
                      onValueChange={(value) => handleChildChange(index, 'current_standard', value)}
                      style={styles.picker}>
                      <Picker.Item label="Select standard" value="" />
                      {standards.map((standard) => (
                        <Picker.Item key={standard.value} label={standard.label} value={standard.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Board *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.board}
                      onValueChange={(value) => handleChildChange(index, 'board', value)}
                      style={styles.picker}>
                      <Picker.Item label="Select board" value="" />
                      {boards.map((board) => (
                        <Picker.Item key={board.value} label={board.label} value={board.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stream</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={child.stream}
                      onValueChange={(value) => handleChildChange(index, 'stream', value)}
                      style={styles.picker}>
                      <Picker.Item label="Select stream (optional)" value="" />
                      {streams.map((stream) => (
                        <Picker.Item key={stream.value} label={stream.label} value={stream.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>School/College Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Child's current school/college"
                    value={child.current_school}
                    onChangeText={(value) => handleChildChange(index, 'current_school', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Subjects Interested</Text>
                  <View style={styles.checkboxContainer}>
                    {subjects.map((subject) => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.checkbox,
                          child.subjects_interested.includes(subject) && styles.checkboxSelected
                        ]}
                        onPress={() => handleChildArrayChange(index, 'subjects_interested', subject)}>
                        <Text style={[
                          styles.checkboxText,
                          child.subjects_interested.includes(subject) && styles.checkboxTextSelected
                        ]}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Target Exams *</Text>
                  <View style={styles.checkboxContainer}>
                    {targetExams.map((exam) => (
                      <TouchableOpacity
                        key={exam.value}
                        style={[
                          styles.checkbox,
                          child.target_exams.includes(exam.value) && styles.checkboxSelected
                        ]}
                        onPress={() => handleChildArrayChange(index, 'target_exams', exam.value)}>
                        <Text style={[
                          styles.checkboxText,
                          child.target_exams.includes(exam.value) && styles.checkboxTextSelected
                        ]}>
                          {exam.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Budget Range (per month)</Text>
                  <View style={styles.budgetContainer}>
                    <TextInput
                      style={[styles.input, styles.budgetInput]}
                      placeholder="Min"
                      value={child.budget_min}
                      onChangeText={(value) => handleChildChange(index, 'budget_min', value)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.budgetSeparator}>to</Text>
                    <TextInput
                      style={[styles.input, styles.budgetInput]}
                      placeholder="Max"
                      value={child.budget_max}
                      onChangeText={(value) => handleChildChange(index, 'budget_max', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

             {/* Fixed Bottom Button */}
       <View style={styles.bottomButton}>
         <TouchableOpacity
           style={[styles.submitButton, (!isFormValid()) && styles.submitButtonDisabled]}
           onPress={handleSubmit}
           disabled={!isFormValid() || isLoading}>
           {isLoading ? (
             <ActivityIndicator color="#ffffff" />
           ) : (
             <Text style={styles.submitButtonText}>Complete Setup</Text>
           )}
                   </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        {showDatePickerDOB && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
                             <DateTimePicker
                 value={selectedDate}
                 mode="date"
                 display="default"
                 onChange={handleDateChange}
                 maximumDate={new Date()}
                 minimumDate={new Date(1900, 0, 1)}
               />

                 
                 
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowDatePickerDOB(false)} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePickerDOB(false)} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  headerIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
  },
  locationStatus: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  locationStatusWarning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  locationStatusSuccess: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationStatusText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
  },
  locationStatusTextWarning: {
    color: '#92400e',
  },
  locationStatusTextSuccess: {
    color: '#065f46',
  },
  locationSuccessText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  locationButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationWarningBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  locationWarningText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  enableLocationButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enableLocationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshLocationButton: {
    backgroundColor: '#6b7280',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshLocationButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  deviceLocationButton: {
    backgroundColor: '#8b5cf6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceLocationButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  datePicker: {
    width: '100%',
    height: 300,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addChildButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addChildButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  childCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  childTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  removeChildButton: {
    backgroundColor: '#fecaca',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeChildButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetSeparator: {
    fontSize: 14,
    color: '#6b7280',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkbox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxText: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkboxTextSelected: {
    color: '#ffffff',
  },
  bottomButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentOnboardingScreen;
