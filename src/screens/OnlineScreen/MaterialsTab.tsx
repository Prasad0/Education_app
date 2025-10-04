import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudyMaterial, TabComponentProps } from './types';

// Mock data for study materials
const studyMaterials: StudyMaterial[] = [
  {
    id: '1',
    title: 'JEE Main Previous Year Papers (2020-2024)',
    subject: 'All Subjects',
    type: 'PDF',
    downloads: 15420,
    size: '45 MB',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    isFree: true
  },
  {
    id: '2',
    title: 'NEET Biology Important Notes',
    subject: 'Biology',
    type: 'Notes',
    downloads: 8965,
    size: '22 MB',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    isFree: true
  },
  {
    id: '3',
    title: 'Physics Formula Bank & Quick Revision',
    subject: 'Physics',
    type: 'PDF',
    downloads: 12378,
    size: '18 MB',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    isFree: false,
    price: '₹199'
  }
];

const MaterialsTab: React.FC<TabComponentProps> = ({ searchQuery }) => {
  const filteredMaterials = studyMaterials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'document-text-outline';
      case 'Video':
        return 'videocam-outline';
      case 'Notes':
        return 'book-outline';
      default:
        return 'document-text-outline';
    }
  };

  const MaterialCard = ({ material }: { material: StudyMaterial }) => (
    <TouchableOpacity style={styles.materialCard} activeOpacity={0.9}>
      <View style={styles.materialContent}>
        <View style={styles.materialIconContainer}>
          <Ionicons name={getTypeIcon(material.type)} size={20} color="#6b7280" />
        </View>
        
        <View style={styles.materialInfo}>
          <View style={styles.materialHeader}>
            <Text style={styles.materialTitle} numberOfLines={2}>{material.title}</Text>
            {material.isFree ? (
              <View style={styles.freeMaterialBadge}>
                <Text style={styles.freeMaterialBadgeText}>FREE</Text>
              </View>
            ) : (
              <View style={styles.paidMaterialBadge}>
                <Ionicons name="star-outline" size={12} color="#3b82f6" />
                <Text style={styles.paidMaterialBadgeText}>{material.price}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.materialSubject}>{material.subject} • {material.type}</Text>
          
          <View style={styles.materialStats}>
            <View style={styles.materialStat}>
              <Ionicons name="download-outline" size={12} color="#6b7280" />
              <Text style={styles.materialStatText}>{material.downloads.toLocaleString()} downloads</Text>
            </View>
            <Text style={styles.materialSize}>{material.size}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.downloadButton, material.isFree ? styles.downloadButtonFree : styles.downloadButtonPaid]}
      >
        <Ionicons name="download-outline" size={16} color="#ffffff" />
        <Text style={styles.downloadButtonText}>
          {material.isFree ? 'Download Free' : 'Buy & Download'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMaterial = ({ item }: { item: StudyMaterial }) => (
    <MaterialCard material={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No materials found</Text>
    </View>
  );

  return (
    <FlatList
      data={filteredMaterials}
      renderItem={renderMaterial}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.materialsList}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  materialsList: {
    padding: 16,
    paddingBottom: 120, // Account for bottom navigation
    gap: 12,
  },
  materialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  materialContent: {
    flexDirection: 'row',
    gap: 12,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: {
    flex: 1,
    gap: 4,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    lineHeight: 20,
  },
  freeMaterialBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeMaterialBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  paidMaterialBadge: {
    backgroundColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  paidMaterialBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  materialSubject: {
    fontSize: 12,
    color: '#6b7280',
  },
  materialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  materialStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  materialSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  downloadButtonFree: {
    backgroundColor: '#059669',
  },
  downloadButtonPaid: {
    backgroundColor: '#3b82f6',
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
});

export default MaterialsTab;
