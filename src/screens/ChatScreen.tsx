import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Keyboard,
  StatusBar,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversationDetail,
  fetchMessages,
  fetchMessagesRecent,
  ChatMessage,
  markConversationAsRead,
  markAsReadBackend,
  clearCurrentConversation,
  fetchConversations,
  sendMessage,
} from '../store/slices/chatSlice';
import { api, API_CONFIG } from '../config/api';
import { BackHandler } from 'react-native';
import { useRealtimeChat } from '../hooks/useRealtimeChat';

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

  // Set up real-time chat listener
  useRealtimeChat({
    conversationId,
    enabled: true
  });

  useEffect(() => {
    // Fetch conversation detail and messages
    dispatch(fetchConversationDetail(conversationId));
    dispatch(fetchMessages(conversationId));
    dispatch(markAsReadBackend(conversationId));
    dispatch(markConversationAsRead(conversationId));
  }, [conversationId, dispatch]);

  // Poll lightweight recent-messages API every 3s while user is on this chat screen
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchMessagesRecent(conversationId));
    }, 3000);
    return () => clearInterval(intervalId);
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

      // Check if there are unread messages from coaching/tutor
      const hasUnread = currentConversation.messages.some(
        msg => (msg.sender_type === 'coaching' || msg.sender_type === 'coaching_center' || msg.sender_type === 'tutor') && !msg.is_read
      );
      if (hasUnread) {
        console.log('💬 [ChatScreen] New unread messages from coaching detected, marking as read');
        dispatch(markAsReadBackend(conversationId));
        dispatch(markConversationAsRead(conversationId));
      }
    }
  }, [currentConversation?.messages, conversationId, dispatch]);

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

  const getFullUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      handleSendAttachment(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      handleSendAttachment(result.assets[0]);
    }
  };

  const handleSendAttachment = async (asset: ImagePicker.ImagePickerAsset) => {
    setSending(true);
    try {
      const result = await dispatch(sendMessage({
        conversationId,
        attachment: {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        }
      }));

      if (sendMessage.fulfilled.match(result)) {
        dispatch(fetchMessages(conversationId));
      } else {
        Alert.alert('Error', result.payload as string || 'Failed to send image');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send image');
    } finally {
      setSending(false);
    }
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

  const openDocument = async (rawUrl: string) => {
    try {
      if (!rawUrl) return;
      const url = getFullUrl(rawUrl);

      // For web URLs, always try to open directly first
      if (url.startsWith('http://') || url.startsWith('https://')) {
        await Linking.openURL(url);
        return;
      }

      // Try to open the URL directly first (more direct "open" experience for other protocols)
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }

      // Fallback for native: Download and Share
      if (Platform.OS !== 'web') {
        const filename = url.split('/').pop() || 'document.pdf';
        const fileUri = FileSystem.documentDirectory + filename;

        const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
        const result = await downloadResumable.downloadAsync();

        if (result && result.uri) {
          await Sharing.shareAsync(result.uri);
        }
      }
    } catch (error) {
      console.error('Error opening document:', error);
      // Last resort fallback for URL
      try {
        await Linking.openURL(getFullUrl(rawUrl));
      } catch (innerError) {
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'Failed to open document');
        }
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = parseDate(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTimeOrJustNow = (dateString: string) => {
    const date = parseDate(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs >= 0 && diffMs < 60 * 1000) return 'Just now';
    return formatTime(dateString);
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
    const isAdminMessage = item.sender_type === 'admin';
    const isMyMessage = isUserMessage;

    const prevMessage = index > 0 && currentConversation?.messages ? currentConversation.messages[index - 1] : null;
    const showDate = !prevMessage ||
      (item.created_at && prevMessage.created_at &&
        parseDate(item.created_at).toDateString() !== parseDate(prevMessage.created_at).toDateString());
    const showAvatar = !prevMessage || prevMessage.sender_type !== item.sender_type;

    let defaultName = 'Coaching';
    if (currentConversation?.conversation_type === 'tutor' && currentConversation.private_tutor) {
      defaultName = currentConversation.private_tutor.teacher_name;
    } else if (currentConversation?.coaching) {
      defaultName = currentConversation.coaching.branch_name || 'Coaching';
    }

    const displaySenderName = isAdminMessage ? '👑 Admin' : (item.sender_name || defaultName);
    const displayTime = isAdminMessage ? formatTimeOrJustNow(item.created_at) : formatTime(item.created_at);

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
            <View style={[styles.otherAvatar, isAdminMessage && styles.adminAvatar]}>
              <Ionicons
                name={isAdminMessage ? 'shield-checkmark' : (currentConversation?.conversation_type === 'tutor' ? 'person' : 'school')}
                size={16}
                color={isAdminMessage ? '#7c3aed' : '#059669'}
              />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myBubble : (isAdminMessage ? styles.adminBubble : styles.otherBubble),
            ]}
          >
            {!isMyMessage && (
              <Text style={[styles.senderName, isAdminMessage && styles.adminSenderName]}>{displaySenderName}</Text>
            )}
            {item.content_type === 'image' && item.attachment && (
              <TouchableOpacity
                onPress={() => item.attachment && Sharing.shareAsync(getFullUrl(item.attachment))}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: getFullUrl(item.attachment) }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {item.content_type === 'document' && item.attachment && (
              <TouchableOpacity
                onPress={() => item.attachment && openDocument(item.attachment)}
                style={[
                  styles.documentContainer,
                  isMyMessage ? styles.myDocument : styles.otherDocument
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={24}
                  color={isMyMessage ? '#ffffff' : '#059669'}
                />
                <Text style={[
                  styles.documentText,
                  isMyMessage ? styles.myDocumentText : styles.otherDocumentText
                ]}>
                  View Document
                </Text>
              </TouchableOpacity>
            )}

            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : (isAdminMessage ? styles.adminMessageText : styles.otherMessageText),
              ]}
            >
              {item.text || item.message || ''}
            </Text>
            <View style={styles.messageFooter}>
              {item.created_at && (
                <Text
                  style={[
                    styles.messageTime,
                    isMyMessage ? styles.myMessageTime : (isAdminMessage ? styles.adminMessageTime : styles.otherMessageTime),
                  ]}
                >
                  {displayTime}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={pickImage}
              disabled={sending}
            >
              <Ionicons name="image-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={takePhoto}
              disabled={sending}
            >
              <Ionicons name="camera-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
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
  adminBubble: {
    backgroundColor: '#f5f3ff',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  adminSenderName: {
    color: '#7c3aed',
  },
  adminMessageText: {
    color: '#1f2937',
  },
  adminMessageTime: {
    color: '#7c3aed',
    fontWeight: '500',
  },
  adminAvatar: {
    backgroundColor: '#ede9fe',
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
  attachmentButton: {
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  messageImage: {
    width: '100%',
    height: '100%',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  myDocument: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherDocument: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  documentText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  myDocumentText: {
    color: '#ffffff',
  },
  otherDocumentText: {
    color: '#059669',
  },
});

export default ChatScreen;

