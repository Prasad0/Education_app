import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAppDispatch} from '../../store/hooks';
import {setProfileStatus} from '../../store/slices/authSlice';
import Toast from 'react-native-toast-message';

interface UserTypeSelectionProps {
  navigation: any;
  onUserTypeSelect?: (userType: 'student' | 'parent') => void;
}

const UserTypeSelectionScreen = ({ navigation, onUserTypeSelect }: UserTypeSelectionProps) => {
  const dispatch = useAppDispatch();

  const handleUserTypeSelect = (userType: 'student' | 'parent') => {
    if (onUserTypeSelect) {
      onUserTypeSelect(userType);
    } else {
      // Navigate to the appropriate onboarding form
      if (userType === 'student') {
        navigation.navigate('StudentOnboarding');
      } else {
        navigation.navigate('ParentOnboarding');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.targetEmoji}>🎯</Text>
            </View>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Help us personalize your experience</Text>
          </View>
          
          <View style={styles.cardsContainer}>
            {/* Student Card */}
            <TouchableOpacity
              style={[styles.card, styles.studentCard]}
              onPress={() => handleUserTypeSelect('student')}
              activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, styles.studentIcon]}>
                  <Text style={styles.icon}>🎓</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>I'm a Student</Text>
                  <Text style={styles.cardSubtitle}>Looking for coaching for myself</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Parent Card */}
            <TouchableOpacity
              style={[styles.card, styles.parentCard]}
              onPress={() => handleUserTypeSelect('parent')}
              activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, styles.parentIcon]}>
                  <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>I'm a Parent</Text>
                  <Text style={styles.cardSubtitle}>Looking for coaching for my child</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            You can change this later in your profile settings
          </Text>
        </View>
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
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  targetEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentCard: {
    borderColor: '#22c55e',
  },
  parentCard: {
    borderColor: '#3b82f6',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentIcon: {
    backgroundColor: '#dcfce7',
  },
  parentIcon: {
    backgroundColor: '#dbeafe',
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});

export default UserTypeSelectionScreen;
