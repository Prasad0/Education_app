import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string, ...string[]];
  imageUrl?: string;
}

interface PromotionalBannerProps {
  banners: PromotionalBanner[];
}

const { width: screenWidth } = Dimensions.get('window');

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ banners }) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={styles.bannerContainer}>
            <LinearGradient
              colors={banner.gradientColors}
              style={styles.banner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // Reduced from 24 to 16 to reduce gap
    marginTop: 0, // Remove any top margin
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 0, // Ensure no top padding
    gap: 12,
  },
  bannerContainer: {
    width: screenWidth * 0.8,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
});

export default PromotionalBanner;
