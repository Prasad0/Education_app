import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createProfile } from "../../store/slices/authSlice";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";

interface StudentOnboardingFormProps {
  navigation: any;
}

const courseStreams = [
  { label: "Science (PCM)", value: "science_pcm" },
  { label: "Science (PCB)", value: "science_pcb" },
  { label: "Science (PCMB)", value: "science_pcmb" },
  { label: "Commerce (with Maths)", value: "commerce_with_maths" },
  { label: "Commerce (without Maths)", value: "commerce_without_maths" },
  { label: "Arts/Humanities", value: "arts_humanities" },
  { label: "Vocational", value: "vocational" },
];

const standards = [
  { label: "Class 8", value: "8th" },
  { label: "Class 9", value: "9th" },
  { label: "Class 10", value: "10th" },
  { label: "Class 11", value: "11th" },
  { label: "Class 12", value: "12th" },
  { label: "Dropout (11th)", value: "dropout_11th" },
  { label: "Dropout (12th)", value: "dropout_12th" },
  { label: "Graduate", value: "graduate" },
];

const competitiveExams = [
  { label: "JEE Main & Advanced", value: "jee_main" },
  { label: "NEET", value: "neet" },
  { label: "CET", value: "cet" },
  { label: "BITSAT", value: "bitsat" },
  { label: "CLAT", value: "clat" },
  { label: "NDA", value: "nda" },
  { label: "CA Foundation", value: "ca_foundation" },
  { label: "Board Exam Focus", value: "board_exam" },
  { label: "Other", value: "other" },
];

const boards = [
  { label: "CBSE", value: "cbse" },
  { label: "ICSE", value: "icse" },
  { label: "State Board", value: "state_board" },
  { label: "International Board", value: "international" },
];

const StudentOnboardingScreen = ({
  navigation,
}: StudentOnboardingFormProps) => {
  const dispatch = useAppDispatch();
  const { accessToken, isLoading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    courseStream: "",
    currentStandard: "",
    board: "",
    targetExams: [] as string[],
    currentSchool: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    occupation: "",
    educationLevel: "",
  });

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showDatePickerDOB, setShowDatePickerDOB] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkLocationStatus();
  }, []);

  const checkLocationStatus = async () => {
    try {
      // Check current permission status first
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
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
      console.error("Error checking location status:", error);
      setLocationPermission(false);
      setLocation(null);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setLocationPermission(true);
        // Try to get location after permission is granted
        try {
          await getCurrentLocation();
        } catch (locationError) {
          // Keep permission granted but mark location as unavailable
          setLocation(null);
        }
      } else if (status === "denied") {
        setLocationPermission(false);
        setLocation(null);
        Toast.show({
          type: "error",
          text1: "Location Permission Denied",
          text2: "Please enable location access in your device settings.",
        });
        Alert.alert(
          "Location Permission Denied",
          "Location access is required to submit this form. Please enable location permissions in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                // On Android, we can try to open app settings
                if (Platform.OS === "android") {
                  // This will open app-specific settings
                  Location.enableNetworkProviderAsync();
                }
              },
            },
          ]
        );
      } else {
        setLocationPermission(false);
        setLocation(null);
        Alert.alert(
          "Location Permission Required",
          "Location access is required to submit this form. This helps us find coaching centers near you.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Try Again",
              onPress: () => requestLocationPermission(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error requesting location permission:", error);
      setLocationPermission(false);
      setLocation(null);

      let errorMessage =
        "Failed to request location permission. Please try again.";
      let errorTitle = "Permission Error";

      if (
        error.message?.includes(
          "Location request failed due to unsatisfied device settings"
        )
      ) {
        errorTitle = "Device Settings Issue";
        errorMessage =
          "Location services are not properly configured on your device. Please check your device settings and ensure location is enabled.";
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retry",
          onPress: () => {
            setTimeout(() => {
              requestLocationPermission();
            }, 1000);
          },
        },
      ]);
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
        longitude: roundedLongitude,
      });

    } catch (error: any) {
      console.error("Error getting current location:", error);

      let errorMessage =
        "Could not get your current location. Please try again.";
      let errorTitle = "Location Error";

      // Handle specific error cases
      if (
        error.message?.includes(
          "Location request failed due to unsatisfied device settings"
        )
      ) {
        errorTitle = "Device Settings Issue";
        errorMessage =
          "Location services are not properly configured. Please check your device settings and ensure location is enabled.";
      } else if (error.message?.includes("Location is unavailable")) {
        errorTitle = "Location Unavailable";
        errorMessage =
          "Location is currently unavailable. Please try again in a few moments.";
      } else if (error.message?.includes("Location request timed out")) {
        errorTitle = "Location Timeout";
        errorMessage =
          "Location request timed out. Please check your internet connection and try again.";
      } else if (error.message?.includes("Location permission denied")) {
        errorTitle = "Permission Denied";
        errorMessage =
          "Location permission was denied. Please enable location access in settings.";
        setLocationPermission(false);
      }

      // Don't show alert for every error, just log and update state
      setLocation(null);

      // Only show alert for critical errors
      if (errorTitle !== "Location Error") {
        Alert.alert(errorTitle, errorMessage, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
            onPress: () => {
              // Wait a bit before retrying
              setTimeout(() => {
                getCurrentLocation();
              }, 2000);
            },
          },
        ]);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePickerDOB(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePickerDOB(true);
  };

  const checkDeviceLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Toast.show({
          type: "error",
          text1: "Location Services Disabled",
          text2: "Please enable location services in your device settings.",
        });
        Alert.alert(
          "Device Location Services Disabled",
          "Location services are disabled on your device. Please enable them in your device settings to continue.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "android") {
                  // Try to open location settings
                  Location.enableNetworkProviderAsync();
                }
              },
            },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking device location services:", error);
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Failed to check location services.",
      });
      return false;
    }
  };

  const handleTargetExamChange = (exam: string) => {
    setFormData((prev) => {
      const currentExams = [...prev.targetExams];
      if (currentExams.includes(exam)) {
        return { ...prev, targetExams: currentExams.filter((e) => e !== exam) };
      } else {
        return { ...prev, targetExams: [...currentExams, exam] };
      }
    });
  };

  const isFormValid = () => {
    return (
      formData.fullName &&
      formData.courseStream &&
      formData.currentStandard &&
      formData.targetExams.length > 0 &&
      locationPermission &&
      location
    );
  };

  const handleSubmit = async () => {

    // Check location first with a clear popup
    if (!locationPermission) {
      Alert.alert(
        "Location Permission Required",
        "Location access is required to submit this form. This helps us find coaching centers near you.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable Location",
            onPress: () => requestLocationPermission(),
          },
        ]
      );
      return;
    }

    if (!location) {
      Alert.alert(
        "Location Not Available",
        "Your current location could not be determined. Please ensure location services are enabled and try again.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry Location",
            onPress: () => getCurrentLocation(),
          },
        ]
      );
      return;
    }

    if (!isFormValid()) {
      Toast.show({
        type: "error",
        text1: "Form Incomplete",
        text2: "Please fill all required fields.",
      });
      return;
    }

    

    try {
      const profileData = {
        user_type: "student",
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        current_standard: formData.currentStandard,
        stream: formData.courseStream,
        board: formData.board,
        target_exams: formData.targetExams,
        current_school: formData.currentSchool,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        address: formData.address,
        latitude: location!.latitude,
        longitude: location!.longitude,
        occupation: formData.occupation || null,
        education_level:
          formData.educationLevel ||
          `${formData.currentStandard} ${formData.courseStream} Student`,
      };

      
      const result = await dispatch(createProfile(profileData));
      
      
      if (createProfile.fulfilled.match(result)) {
        Toast.show({
          type: "success",
          text1: "Profile Created",
          text2: "Your student profile has been created successfully!",
        });
        navigation.navigate("Home");
      } else if (createProfile.rejected.match(result)) {
        
        // Handle specific API errors
        if (result.payload && typeof result.payload === 'object' && 'data' in result.payload) {
          const apiResponse = result.payload.data as any;
          if (apiResponse && apiResponse.errors && typeof apiResponse.errors === 'object') {
            // Show specific error messages
            const errorMessages = Object.values(apiResponse.errors).flat();
            const errorText = errorMessages.join(', ');
            
            Toast.show({
              type: "error",
              text1: "Validation Error",
              text2: errorText,
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Profile Creation Failed",
              text2: (apiResponse?.message as string) || "Something went wrong. Please try again.",
            });
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Profile Creation Failed",
            text2: "Something went wrong. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error during profile creation:", error);
      Toast.show({
        type: "error",
        text1: "Unexpected Error",
        text2: "Something went wrong. Please try again.",
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
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Student Details</Text>
            <Text style={styles.headerSubtitle}>
              Help us find the perfect coaching for you
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
                <Text style={styles.icon}>🎓</Text>
              </View>
            </View>

            {/* Location Status */}
            <View
              style={[
                styles.locationStatus,
                !locationPermission || !location
                  ? styles.locationStatusWarning
                  : styles.locationStatusSuccess,
              ]}
            >
              <Text
                style={[
                  styles.locationStatusText,
                  !locationPermission || !location
                    ? styles.locationStatusTextWarning
                    : styles.locationStatusTextSuccess,
                ]}
              >
                📍 Location:{" "}
                {(() => {
                  try {
                    if (!locationPermission) return "Permission Required";
                    if (!location)
                      return "Permission Granted - Getting Location...";
                    return "Enabled & Available";
                  } catch (error) {
                    return "Status Unknown";
                  }
                })()}
              </Text>

              <View style={styles.locationButtonContainer}>
                {(() => {
                  try {
                    if (!locationPermission) {
                      return (
                        <TouchableOpacity
                          onPress={requestLocationPermission}
                          style={styles.enableLocationButton}
                        >
                          <Text style={styles.enableLocationButtonText}>
                            Enable Location
                          </Text>
                        </TouchableOpacity>
                      );
                    } else if (!location) {
                      return (
                        <TouchableOpacity
                          onPress={getCurrentLocation}
                          style={styles.enableLocationButton}
                        >
                          <Text style={styles.enableLocationButtonText}>
                            Get Location
                          </Text>
                        </TouchableOpacity>
                      );
                    } else {
                      return (
                        <Text style={styles.locationSuccessText}>
                          ✓ Location Ready
                        </Text>
                      );
                    }
                  } catch (error) {
                    return (
                      <TouchableOpacity
                        onPress={requestLocationPermission}
                        style={styles.enableLocationButton}
                      >
                        <Text style={styles.enableLocationButtonText}>
                          Enable Location
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                })()}

                <TouchableOpacity
                  onPress={checkLocationStatus}
                  style={styles.refreshLocationButton}
                >
                  <Text style={styles.refreshLocationButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={checkDeviceLocationServices}
                  style={styles.deviceLocationButton}
                >
                  <Text style={styles.deviceLocationButtonText}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Warning Banner */}
            {(!locationPermission || !location) && (
              <View style={styles.locationWarningBanner}>
                <Text style={styles.locationWarningText}>
                  ⚠️ Location access is mandatory to submit this form. We need
                  your location to find coaching centers near you.
                </Text>
              </View>
            )}

            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange("fullName", value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="DD-MM-YYYY"
                    value={formData.dateOfBirth}
                    onChangeText={(value) =>
                      handleInputChange("dateOfBirth", value)
                    }
                    editable={false}
                  />
                  <TouchableOpacity
                    onPress={showDatePickerModal}
                    style={styles.calendarButton}
                  >
                    <Text style={styles.calendarButtonText}>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
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
                <Text style={styles.label}>Course Stream *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.courseStream}
                    onValueChange={(value) =>
                      handleInputChange("courseStream", value)
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your course stream" value="" />
                    {courseStreams.map((stream) => (
                      <Picker.Item
                        key={stream.value}
                        label={stream.label}
                        value={stream.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Standard *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.currentStandard}
                    onValueChange={(value) =>
                      handleInputChange("currentStandard", value)
                    }
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Select your current standard"
                      value=""
                    />
                    {standards.map((standard) => (
                      <Picker.Item
                        key={standard.value}
                        label={standard.label}
                        value={standard.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Board</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.board}
                    onValueChange={(value) => handleInputChange("board", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select board" value="" />
                    {boards.map((board) => (
                      <Picker.Item
                        key={board.value}
                        label={board.label}
                        value={board.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Exam/Goal *</Text>
                <View style={styles.checkboxContainer}>
                  {competitiveExams.map((exam) => (
                    <TouchableOpacity
                      key={exam.value}
                      style={[
                        styles.checkbox,
                        formData.targetExams.includes(exam.value) &&
                          styles.checkboxSelected,
                      ]}
                      onPress={() => handleTargetExamChange(exam.value)}
                    >
                      <Text
                        style={[
                          styles.checkboxText,
                          formData.targetExams.includes(exam.value) &&
                            styles.checkboxTextSelected,
                        ]}
                      >
                        {exam.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Contact & Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact & Address</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>School/College Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your current school/college"
                  value={formData.currentSchool}
                  onChangeText={(value) =>
                    handleInputChange("currentSchool", value)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your city"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange("city", value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your state"
                  value={formData.state}
                  onChangeText={(value) => handleInputChange("state", value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your pincode"
                  value={formData.pincode}
                  onChangeText={(value) => handleInputChange("pincode", value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your complete address"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange("address", value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Occupation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your occupation (if any)"
                  value={formData.occupation}
                  onChangeText={(value) =>
                    handleInputChange("occupation", value)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Education Level</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your education level"
                  value={formData.educationLevel}
                  onChangeText={(value) =>
                    handleInputChange("educationLevel", value)
                  }
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || !locationPermission || !location) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !isFormValid() || !locationPermission || !location || isLoading
          }
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : !locationPermission || !location ? (
            <Text style={styles.submitButtonText}>Location Required</Text>
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
              <TouchableOpacity
                onPress={() => setShowDatePickerDOB(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePickerDOB(false)}
                style={styles.modalButton}
              >
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
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: "#6b7280",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
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
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#dcfce7",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 32,
  },
  locationStatus: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  locationStatusWarning: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  locationStatusSuccess: {
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  locationStatusText: {
    fontSize: 14,
    color: "#92400e",
    marginBottom: 8,
  },
  locationStatusTextWarning: {
    color: "#92400e",
  },
  locationStatusTextSuccess: {
    color: "#065f46",
  },
  locationSuccessText: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "600",
  },
  locationButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationWarningBanner: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  locationWarningText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "500",
  },
  enableLocationButton: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enableLocationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  refreshLocationButton: {
    backgroundColor: "#6b7280",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshLocationButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  deviceLocationButton: {
    backgroundColor: "#8b5cf6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceLocationButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    backgroundColor: "#3b82f6",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButtonText: {
    fontSize: 18,
    color: "#ffffff",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  datePickerContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  datePicker: {
    width: "100%",
    height: 300,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  picker: {
    height: 50,
  },
  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checkbox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkboxText: {
    fontSize: 14,
    color: "#6b7280",
  },
  checkboxTextSelected: {
    color: "#ffffff",
  },
  bottomButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 20,
  },
  submitButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StudentOnboardingScreen;
