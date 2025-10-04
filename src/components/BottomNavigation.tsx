import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  activeTab: 'offline' | 'online' | 'private' | 'chat' | 'profile';
  onTabPress: (tab: 'offline' | 'online' | 'private' | 'chat' | 'profile') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    { id: 'offline', label: 'Offline', icon: 'people-outline' },
    { id: 'online', label: 'Online', icon: 'laptop-outline' },
    { id: 'private', label: 'Private', icon: 'school-outline' },
    { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' },
  ] as const;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          style={styles.tab}
          activeOpacity={0.7}
          delayPressIn={0}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10, // For Android
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
