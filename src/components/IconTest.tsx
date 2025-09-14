import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const IconTest: React.FC = () => {
  const testIcons = [
    { name: 'people', description: 'People icon' },
    { name: 'laptop', description: 'Laptop icon' },
    { name: 'star', description: 'Star icon' },
    { name: 'person', description: 'Person icon' },
    { name: 'location', description: 'Location icon' },
    { name: 'search', description: 'Search icon' },
    { name: 'arrow-back', description: 'Arrow back icon' },
    { name: 'chevron-down', description: 'Chevron down icon' },
    { name: 'wifi', description: 'Wifi icon' },
    { name: 'car', description: 'Car icon' },
    { name: 'restaurant', description: 'Restaurant icon' },
    { name: 'library', description: 'Library icon' },
    { name: 'snow', description: 'Snow icon' },
    { name: 'bus', description: 'Bus icon' },
    { name: 'bed', description: 'Bed icon' },
    { name: 'medical', description: 'Medical icon' },
    { name: 'flask', description: 'Flask icon' },
    { name: 'checkmark-circle', description: 'Checkmark circle icon' },
    { name: 'ellipsis-horizontal', description: 'Ellipsis horizontal icon' },
    { name: 'close-circle', description: 'Close circle icon' },
    { name: 'refresh', description: 'Refresh icon' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Icon Test Component</Text>
      <Text style={styles.subtitle}>Testing all icons used in the app</Text>
      
      {testIcons.map((icon, index) => (
        <View key={index} style={styles.iconRow}>
          <Ionicons 
            name={icon.name as any} 
            size={24} 
            color="#3b82f6" 
            style={styles.icon}
          />
          <View style={styles.iconInfo}>
            <Text style={styles.iconName}>{icon.name}</Text>
            <Text style={styles.iconDescription}>{icon.description}</Text>
          </View>
        </View>
      ))}
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status Check:</Text>
        <Text style={styles.statusText}>
          If you can see all icons above, the @expo/vector-icons package is working correctly.
        </Text>
        <Text style={styles.statusText}>
          If some icons are missing or showing as squares, there might be an issue with the icon names or package installation.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    marginRight: 16,
  },
  iconInfo: {
    flex: 1,
  },
  iconName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  iconDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default IconTest;

