import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {logout} from '../store/slices/authSlice';

const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const {user, profileStatus} = useAppSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to CoachFinder</Text>
          <Text style={styles.subtitle}>
            {user?.username ? `Hello, ${user.username}!` : 'Hello!'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Status</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Profile Created:</Text>
            <Text style={[styles.statusValue, {color: profileStatus?.hasProfile ? '#10b981' : '#ef4444'}]}>
              {profileStatus?.hasProfile ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Profile Complete:</Text>
            <Text style={[styles.statusValue, {color: profileStatus?.isCompleted ? '#10b981' : '#ef4444'}]}>
              {profileStatus?.isCompleted ? 'Yes' : 'No'}
            </Text>
          </View>
          {profileStatus?.userType && (
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>User Type:</Text>
              <Text style={styles.statusValue}>{profileStatus.userType}</Text>
            </View>
          )}
          {profileStatus?.nextSteps && profileStatus.nextSteps.length > 0 && (
            <View style={styles.nextSteps}>
              <Text style={styles.nextStepsTitle}>Next Steps:</Text>
              {profileStatus.nextSteps.map((step, index) => (
                <Text key={index} style={styles.nextStep}>• {step}</Text>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextSteps: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  nextStep: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
