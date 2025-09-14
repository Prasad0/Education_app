import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  activeTab: 'offline' | 'online' | 'starred' | 'profile';
  onTabPress: (tab: 'offline' | 'online' | 'starred' | 'profile') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    { id: 'offline', label: 'Offline', icon: 'people-outline' },
    { id: 'online', label: 'Online', icon: 'laptop-outline' },
    { id: 'starred', label: 'Starred', icon: 'star-outline' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' },
  ] as const;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          style={styles.tab}
        >
          <Ionicons 
            name={activeTab === tab.id ? tab.icon.replace('-outline', '') : tab.icon as any} 
            size={20} 
            color={activeTab === tab.id ? '#10b981' : '#6b7280'} 
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
          {activeTab === tab.id && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 40, // Increased padding bottom for better spacing
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 60,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  activeIndicator: {
    width: 24,
    height: 2,
    backgroundColor: '#10b981',
    borderRadius: 1,
    marginTop: 4,
  },
});

export default BottomNavigation;
