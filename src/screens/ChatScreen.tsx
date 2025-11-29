import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversationDetail,
  fetchMessages,
  ChatMessage,
  markConversationAsRead,
  clearCurrentConversation,
  fetchConversations,
  sendMessage,
} from '../store/slices/chatSlice';
import { api } from '../config/api';
import { BackHandler } from 'react-native';

interface ChatScreenProps {
  conversationId: number;
  participantName: string;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  participantName,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const { currentConversation, conversationDetailLoading, messagesLoading, messagesError, sendingMessage, sendingError } = useAppSelector(
    state => state.chat
  );
  const { profile, user } = useAppSelector(state => state.auth);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = profile?.id || user?.id;

  useEffect(() => {
    // Fetch conversation detail and messages
    dispatch(fetchConversationDetail(conversationId));
    dispatch(fetchMessages(conversationId));
    dispatch(markConversationAsRead(conversationId));
  }, [conversationId, dispatch]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Refresh conversations list when going back
      dispatch(fetchConversations());
      onBack();
      return true;
    });

    return () => {
      backHandler.remove();
      dispatch(clearCurrentConversation());
    };
  }, [onBack, dispatch]);

  useEffect(() => {
    if (currentConversation?.messages && currentConversation.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentConversation?.messages]);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        if (Platform.OS === 'android') {
          setKeyboardHeight(event.endCoordinates.height);
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        if (Platform.OS === 'android') {
          setKeyboardHeight(0);
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchConversationDetail(conversationId)),
      dispatch(fetchMessages(conversationId)),
    ]);
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending || sendingMessage) return;

    const messageToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      console.log('💬 [ChatScreen] Sending message');
      console.log('💬 [ChatScreen] Conversation ID:', conversationId);
      console.log('💬 [ChatScreen] Message text:', messageToSend);
      
      // Send message via API
      const result = await dispatch(sendMessage({ 
        conversationId, 
        text: messageToSend 
      }));

      if (sendMessage.fulfilled.match(result)) {
        console.log('✅ [ChatScreen] Message sent successfully');
        // Refresh messages to get updated list
        await dispatch(fetchMessages(conversationId));
      } else {
        // Restore message text on error
        setMessageText(messageToSend);
        Alert.alert('Error', result.payload as string || 'Failed to send message. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ [ChatScreen] Failed to send message:', error);
      // Restore message text on error
      setMessageText(messageToSend);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const parseDate = (dateString: string) => {
    // Handle API format: "29-11-2025 21:29:26" (DD-MM-YYYY HH:mm:ss)
    if (dateString.includes('-') && dateString.match(/^\d{2}-\d{2}-\d{4}/)) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const date = new Date(`${year}-${month}-${day}${timePart ? ' ' + timePart : ''}`);
      return isNaN(date.getTime()) ? new Date(dateString) : date;
    }
    return new Date(dateString);
  };

  const formatTime = (dateString: string) => {
    const date = parseDate(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    if (!item || !item.id) {
      return null;
    }
    
    // User messages go on the right side, other messages on the left
    const isUserMessage = item.sender_type === 'user';
    const isMyMessage = isUserMessage; // User messages go on right side
    
    const prevMessage = index > 0 && currentConversation?.messages ? currentConversation.messages[index - 1] : null;
    const showDate = !prevMessage || 
      (item.created_at && prevMessage.created_at && 
       parseDate(item.created_at).toDateString() !== parseDate(prevMessage.created_at).toDateString());
    const showAvatar = !prevMessage || prevMessage.sender_type !== item.sender_type;

    return (
      <View>
        {showDate && item.created_at && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          {!isMyMessage && showAvatar && (
            <View style={styles.otherAvatar}>
              <Ionicons name="person" size={16} color="#059669" />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myBubble : styles.otherBubble,
            ]}
          >
            {!isMyMessage && (
              <Text style={styles.senderName}>{item.sender_name}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.text || item.message || ''}
            </Text>
            <View style={styles.messageFooter}>
              {item.created_at && (
                <Text
                  style={[
                    styles.messageTime,
                    isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                  ]}
                >
                  {formatTime(item.created_at)}
                </Text>
              )}
              {isUserMessage && (
                <Ionicons
                  name={item.is_read ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.is_read ? '#059669' : '#9ca3af'}
                  style={styles.readIcon}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Filter out invalid messages (must have id)
  const messages = (currentConversation?.messages || []).filter((msg): msg is ChatMessage => {
    return !!(msg && msg.id);
  });
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [ChatScreen] Current conversation:', {
      id: currentConversation?.id,
      rawMessagesCount: currentConversation?.messages?.length || 0,
      filteredMessagesCount: messages.length,
      hasMessages: messages.length > 0,
      firstMessage: messages[0] ? {
        id: messages[0].id,
        text: messages[0].text || messages[0].message,
        sender_type: messages[0].sender_type,
        created_at: messages[0].created_at,
      } : null,
      allMessages: messages.map(m => ({
        id: m.id,
        text: m.text || m.message,
        sender_type: m.sender_type,
      })),
    });
  }, [currentConversation?.id, messages.length]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {participantName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={Platform.OS === 'ios'}
      >
        {(conversationDetailLoading || messagesLoading) && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messagesError && messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={styles.emptyText}>Failed to load messages</Text>
            <Text style={styles.emptySubtext}>{messagesError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchMessages(conversationId))}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
            extraData={messages.length}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#059669']}
                tintColor="#059669"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={[
          styles.inputWrapper,
          Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight }
        ]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || sending || sendingMessage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || sending || sendingMessage}
            >
              {(sending || sendingMessage) ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
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
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  otherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#059669',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 22 : 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputContainerKeyboardVisible: {
    // This style helps ensure proper restoration on Android
    paddingBottom: 36,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatScreen;

