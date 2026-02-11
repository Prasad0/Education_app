import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

interface NotificationsScreenProps {
    onBack: () => void;
}

interface Notification {
    uuid: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    category?: {
        name: string;
        icon?: string;
    };
    action?: {
        name: string;
    };
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await api.get('/notifications/');
            setNotifications(response.data.results || response.data || []);
        } catch (err: any) {
            console.error('Error fetching notifications:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (uuid: string) => {
        try {
            await api.post('/notifications/mark/', {
                notification_ids: [uuid],
                mark_as_read: true
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.uuid === uuid ? { ...notif, is_read: true } : notif
                )
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications
                .filter(n => !n.is_read)
                .map(n => n.uuid);

            if (unreadIds.length === 0) return;

            await api.post('/notifications/mark/', {
                notification_ids: unreadIds,
                mark_as_read: true
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, is_read: true }))
            );
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    };

    const getIconName = (category?: { icon?: string; name?: string }): any => {
        if (!category) return 'notifications-outline';

        const iconMap: { [key: string]: any } = {
            'system': 'settings-outline',
            'booking': 'calendar-outline',
            'message': 'chatbubble-outline',
            'promotion': 'pricetag-outline',
            'update': 'information-circle-outline',
        };

        const lowerName = category.name?.toLowerCase() || '';
        for (const key in iconMap) {
            if (lowerName.includes(key)) {
                return iconMap[key];
            }
        }

        return 'notifications-outline';
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Ionicons name="checkmark-done" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchNotifications(true)}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
            >
                {loading && !refreshing && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                        <Text style={styles.errorTitle}>Failed to load notifications</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchNotifications()}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={80} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>
                            You're all caught up! New notifications will appear here.
                        </Text>
                    </View>
                )}

                {!loading && !error && notifications.length > 0 && (
                    <View style={styles.notificationsList}>
                        {notifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.uuid}
                                style={[
                                    styles.notificationCard,
                                    !notification.is_read && styles.notificationCardUnread
                                ]}
                                onPress={() => !notification.is_read && handleMarkAsRead(notification.uuid)}
                            >
                                <View style={styles.notificationIcon}>
                                    <Ionicons
                                        name={getIconName(notification.category)}
                                        size={24}
                                        color={notification.is_read ? '#6b7280' : '#3b82f6'}
                                    />
                                </View>
                                <View style={styles.notificationContent}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.is_read && styles.notificationTitleUnread
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        {!notification.is_read && (
                                            <View style={styles.unreadDot} />
                                        )}
                                    </View>
                                    <Text style={styles.notificationMessage} numberOfLines={2}>
                                        {notification.message}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatDate(notification.created_at)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    unreadBadge: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    markAllButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 24,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    errorContainer: {
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
    },
    errorMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
    notificationsList: {
        paddingTop: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    notificationCardUnread: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notificationTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    notificationTitleUnread: {
        fontWeight: '600',
        color: '#111827',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
});

export default NotificationsScreen;
