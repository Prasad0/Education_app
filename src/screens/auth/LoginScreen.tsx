import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setPhoneNumber, sendOtp, clearError} from '../../store/slices/authSlice';

const LoginScreen = ({navigation}: any) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleMobileSubmit = () => {
    if (mobileNumber.length === 10) {
      dispatch(setPhoneNumber(mobileNumber));
      dispatch(sendOtp(mobileNumber)).then((result) => {
        if (sendOtp.fulfilled.match(result)) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: result.payload.message || 'OTP sent successfully',
          });
          navigation.navigate('Otp');
        }
      });
    }
  };

  const handleSocialLogin = (provider: string) => {
    
    // In a real app, this would handle OAuth flow
    Alert.alert('Info', `${provider} login coming soon!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>📚</Text>
            </View>
            <Text style={styles.title}>Welcome to CoachFinder</Text>
            <Text style={styles.subtitle}>Choose your preferred login method</Text>
          </View>

          <View style={styles.card}>
            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Google')}>
                <View style={[styles.socialIcon, styles.googleIcon]}>
                  <Text style={styles.socialIconText}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Facebook')}>
                <View style={[styles.socialIcon, styles.facebookIcon]}>
                  <Text style={styles.socialIconText}>f</Text>
                </View>
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Instagram')}>
                <View style={[styles.socialIcon, styles.instagramIcon]}>
                  <Text style={styles.socialIconText}>📷</Text>
                </View>
                <Text style={styles.socialButtonText}>Continue with Instagram</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with mobile</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Mobile Login */}
            <View style={styles.mobileSection}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.mobileInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.mobileInput}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChangeText={(text) => setMobileNumber(text.slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.sendOtpButton, mobileNumber.length !== 10 && styles.sendOtpButtonDisabled]}
                onPress={handleMobileSubmit}
                disabled={mobileNumber.length !== 10 || isLoading}>
                <Text style={styles.sendOtpButtonText}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service & Privacy Policy
            </Text>
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 0 : 20, // Add padding for Android
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'ios' ? 0 : 20, // Add margin for Android
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#dcfce7',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialButtons: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    backgroundColor: '#4285F4',
  },
  facebookIcon: {
    backgroundColor: '#1877F2',
  },
  instagramIcon: {
    backgroundColor: '#E4405F',
  },
  socialIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#6b7280',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
  },
  mobileSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCode: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  mobileInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  sendOtpButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendOtpButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendOtpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
