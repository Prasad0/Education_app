import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchStudyMaterials, refreshStudyMaterials, downloadStudyMaterial, clearError, clearDownloadError } from '../../store/slices/studyMaterialsSlice';
import { StudyMaterial as ApiStudyMaterial } from '../../store/slices/studyMaterialsSlice';
import { TabComponentProps } from './types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api';

// Helper function to format file size
const formatFileSize = (sizeInMB: string): string => {
  const size = parseFloat(sizeInMB);
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} GB`;
  }
  return `${size} MB`;
};

// Helper function to get subjects display text
const getSubjectsText = (subjects: any[]): string => {
  if (!subjects || subjects.length === 0) return 'General';
  if (subjects.length === 1) return subjects[0].name;
  if (subjects.length <= 3) return subjects.map(s => s.name).join(', ');
  return `${subjects[0].name} +${subjects.length - 1} more`;
};

const MaterialsTab: React.FC<TabComponentProps> = ({ searchQuery }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { materials, loading, error, refreshing, downloading, downloadError } = useSelector((state: RootState) => state.studyMaterials);

  useEffect(() => {
    dispatch(fetchStudyMaterials(1));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Study materials error:', error);
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    dispatch(refreshStudyMaterials());
  };

  const handleDownload = async (material: ApiStudyMaterial) => {
    try {
      // Ask server for a secure download URL (tracks count, auth, etc.)
      const result = await dispatch(downloadStudyMaterial(material.id) as any).unwrap?.()
        // Fallback if unwrap isn't available due to typings
        ?? (await (dispatch(downloadStudyMaterial(material.id)) as unknown as Promise<any>));

      const serverUrl: string | undefined = result?.downloadUrl;
      const rawUrl = serverUrl || material.file || '';
      if (!rawUrl) {
        Alert.alert('Error', 'No file available for download');
        return;
      }

      // Ensure absolute URL
      const sourceUrl = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `${API_CONFIG.BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

      // Output path
      const filename = material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      const fileUri = (FileSystem as any).documentDirectory + filename;

      // Auth header if token exists
      let headers: Record<string, string> | undefined;
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) headers = { Authorization: `Bearer ${token}` };
      } catch {}

      // Download the file using createDownloadResumable (non-deprecated approach)
      const downloadResumable = FileSystem.createDownloadResumable(
        sourceUrl,
        fileUri,
        headers ? { headers } : undefined
      );

      const downloadResult = await downloadResumable.downloadAsync();

      if (downloadResult && downloadResult.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', 'File downloaded successfully');
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult?.status}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const filteredMaterials = materials.filter(material => {
    if (!material) return false;
    
    const titleMatch = material.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const subjectMatch = material.subjects?.some(subject => 
      subject.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || false;
    const typeMatch = material.material_type?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    return titleMatch || subjectMatch || typeMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'document-text-outline';
      case 'video':
        return 'videocam-outline';
      case 'notes':
        return 'book-outline';
      case 'formula':
        return 'calculator-outline';
      default:
        return 'document-text-outline';
    }
  };

  const MaterialCard = ({ material }: { material: ApiStudyMaterial }) => {
    if (!material) return null;

    const isDownloading = downloading[material.id] || false;
    const downloadErr = downloadError[material.id];

    return (
      <TouchableOpacity style={styles.materialCard} activeOpacity={0.9}>
        <View style={styles.materialContent}>
          <View style={styles.materialIconContainer}>
            <Ionicons name={getTypeIcon(material.material_type)} size={20} color="#6b7280" />
          </View>
          
          <View style={styles.materialInfo}>
            <View style={styles.materialHeader}>
              <Text style={styles.materialTitle} numberOfLines={2}>
                {material.title || 'Untitled Material'}
              </Text>
              {material.is_free ? (
                <View style={styles.freeMaterialBadge}>
                  <Text style={styles.freeMaterialBadgeText}>FREE</Text>
                </View>
              ) : (
                <View style={styles.paidMaterialBadge}>
                  <Ionicons name="star-outline" size={12} color="#3b82f6" />
                  <Text style={styles.paidMaterialBadgeText}>₹{material.price}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.materialSubject}>
              {getSubjectsText(material.subjects)} • {material.material_type?.toUpperCase() || 'DOCUMENT'}
            </Text>
            
            <View style={styles.materialStats}>
              <View style={styles.materialStat}>
                <Ionicons name="download-outline" size={12} color="#6b7280" />
                <Text style={styles.materialStatText}>
                  {material.download_count?.toLocaleString() || 0} downloads
                </Text>
              </View>
              <Text style={styles.materialSize}>
                {formatFileSize(material.file_size_mb || '0')}
              </Text>
            </View>

            {downloadErr && (
              <Text style={styles.downloadErrorText}>{downloadErr}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.downloadButton, 
            material.is_free ? styles.downloadButtonFree : styles.downloadButtonPaid,
            isDownloading && styles.downloadButtonDisabled
          ]}
          onPress={() => handleDownload(material)}
          disabled={isDownloading || !material.file}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="download-outline" size={16} color="#ffffff" />
          )}
          <Text style={styles.downloadButtonText}>
            {isDownloading ? 'Downloading...' : 
             material.is_free ? 'Download Free' : 'Buy & Download'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderMaterial = ({ item }: { item: ApiStudyMaterial }) => (
    <MaterialCard material={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No materials found</Text>
      <Text style={styles.emptySubtitle}>Start exploring study materials to see them here</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={styles.loadingText}>Loading study materials...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Failed to load materials</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchStudyMaterials(1))}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && materials.length === 0) {
    return renderLoading();
  }

  if (error && materials.length === 0) {
    return renderError();
  }

  return (
    <FlatList
      data={filteredMaterials}
      renderItem={renderMaterial}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.materialsList}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#059669']}
          tintColor="#059669"
        />
      }
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
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
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
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MaterialsTab;
