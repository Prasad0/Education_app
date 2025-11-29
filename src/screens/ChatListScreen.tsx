import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchConversations, Conversation, markConversationAsRead } from '../store/slices/chatSlice';
import BottomNavigation from '../components/BottomNavigation';

interface ChatListScreenProps {
  onTabPress?: (tab: 'offline' | 'online' | 'private' | 'chat' | 'profile') => void;
  onOpenChat?: (conversationId: number, participantName: string) => void;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ onTabPress, onOpenChat }) => {
  const dispatch = useAppDispatch();
  const { conversations, loading } = useAppSelector(state => state.chat);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch conversations when component mounts
    dispatch(fetchConversations());
  }, [dispatch]);

  // Refresh conversations when screen comes into focus (when navigating back from chat detail)
  useEffect(() => {
    const focusHandler = () => {
      dispatch(fetchConversations());
    };
    
    // Refresh on mount and when component comes into focus
    focusHandler();
    
    // Optional: Refresh periodically to get new conversations
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchConversations());
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
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

  const handleConversationPress = (conversation: Conversation) => {
    // Mark as read
    dispatch(markConversationAsRead(conversation.id));
    // Open chat - use coaching branch_name or name
    const coachingName = conversation.coaching?.branch_name || conversation.coaching?.tagline || 'Coaching Center';
    onOpenChat?.(conversation.id, coachingName);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    if (!item || !item.id || !item.coaching) {
      return null;
    }
    
    const coachingName = item.coaching.branch_name || item.coaching.tagline || 'Coaching Center';
    const unreadCount = item.user_unread_count || 0;
    const avatarImage = item.coaching.featured_image?.image || item.coaching.icon;
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {avatarImage ? (
            <Image
              source={{ uri: avatarImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="school" size={24} color="#059669" />
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName} numberOfLines={1}>
              {coachingName}
            </Text>
            {item.last_message?.created_at && (
              <Text style={styles.timeText}>
                {formatTime(item.last_message.created_at)}
              </Text>
            )}
            {!item.last_message && item.updated_at && (
              <Text style={styles.timeText}>
                {formatTime(item.updated_at)}
              </Text>
            )}
          </View>
          {item.last_message?.text || item.last_message?.message ? (
            <Text 
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.lastMessageUnread
              ]} 
              numberOfLines={1}
            >
              {item.last_message.text || item.last_message.message}
            </Text>
          ) : (
            <Text style={styles.noMessageText}>No messages yet</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation from a coaching center detail page
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, index) => item?.id?.toString() || `conversation-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
        />
      )}

      <BottomNavigation
        activeTab="chat"
        onTabPress={(tab) => {
          if (tab === 'chat') return;
          onTabPress?.(tab);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#111827',
  },
  noMessageText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default ChatListScreen;

