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
import {setOtp, verifyOtp, clearError, checkProfileStatus} from '../../store/slices/authSlice';

const OtpScreen = ({navigation}: any) => {
  const [otp, setOtpLocal] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const dispatch = useAppDispatch();
  const {phoneNumber, isLoading, error} = useAppSelector(state => state.auth);

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

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (text: string) => {
    // Only allow numeric input and limit to 4 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setOtpLocal(numericText);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 4) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter complete OTP',
      });
      return;
    }

    dispatch(setOtp(otp));
    dispatch(verifyOtp({phoneNumber, otp})).then((result) => {
      if (verifyOtp.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'OTP verified successfully',
        });
        
        // Check profile status after successful OTP verification
        dispatch(checkProfileStatus()).then((profileResult) => {
          if (checkProfileStatus.fulfilled.match(profileResult)) {
            if (profileResult.payload.isCompleted) {
              // Profile is complete, navigate to home
              navigation.navigate('Home');
            } else {
              // Profile incomplete, navigate to user type selection
              navigation.navigate('UserTypeSelection');
            }
          } else {
            // If profile check fails, default to user type selection
            navigation.navigate('UserTypeSelection');
          }
        });
      }
    });
  };

  const handleResendOtp = () => {
    setTimer(30);
    setCanResend(false);
    Toast.show({
      type: 'info',
      text1: 'Info',
      text2: 'OTP resent successfully',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
              <Text style={styles.backButtonLabel}>Back</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>📱</Text>
              </View>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                Enter the 4-digit code sent to{'\n'}
                <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>
              </Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.otpSection}>
                <Text style={styles.label}>Enter OTP</Text>
                
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="numeric"
                  maxLength={4}
                  selectTextOnFocus
                  autoFocus
                  placeholder="1234"
                  placeholderTextColor="#9ca3af"
                />
                
                <TouchableOpacity
                  style={[styles.verifyButton, otp.length !== 4 && styles.verifyButtonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 4 || isLoading}>
                  <Text style={styles.verifyButtonText}>
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.changeMobileButton}
                  onPress={() => navigation.goBack()}>
                  <Text style={styles.changeMobileButtonText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.resendContainer}>
                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={!canResend}>
                  <Text style={styles.resendButtonText}>
                    {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  },
  backButtonContainer: {
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  backButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
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
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '500',
    color: '#111827',
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
  otpSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 8,  // This creates spacing between digits like tracking-widest
    backgroundColor: '#ffffff',
    marginBottom: 16,
    paddingHorizontal: 16,
    color: '#111827',
  },
  verifyButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  changeMobileButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeMobileButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    minHeight: 44,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
});

export default OtpScreen;
