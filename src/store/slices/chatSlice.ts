import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../config/api';

// Types
export interface ChatMessage {
  id: number;
  conversation: number;
  sender?: number;
  sender_name?: string;
  sender_type: 'student' | 'coaching_center' | 'tutor' | 'user';
  message?: string;
  text?: string; // API returns 'text' field
  content_type?: string;
  attachment?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CoachingCenterBasic {
  id: number;
  uuid: string;
  branch_name: string;
  slug: string;
  tagline?: string;
  city: string;
  state: string;
  coaching_type: string;
  featured_image?: {
    id: number;
    image: string;
    image_type: string;
    caption: string;
    is_featured: boolean;
    order: number;
  } | null;
  icon?: string | null;
  contact_number?: string;
  average_rating?: number;
  total_reviews?: number;
}

export interface Conversation {
  id: number;
  coaching: CoachingCenterBasic;
  user_unread_count: number;
  coaching_unread_count: number;
  last_message?: ChatMessage | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages?: ChatMessage[];
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  loading: boolean;
  error: string | null;
  conversationDetailLoading: boolean;
  conversationDetailError: string | null;
  messagesLoading: boolean;
  messagesError: string | null;
  startingConversation: boolean;
  startingError: string | null;
  sendingMessage: boolean;
  sendingError: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null,
  conversationDetailLoading: false,
  conversationDetailError: null,
  messagesLoading: false,
  messagesError: null,
  startingConversation: false,
  startingError: null,
  sendingMessage: false,
  sendingError: null,
};

// Fetch all conversations
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📤 [Chat] Fetching conversations - API: GET /chat/conversations/');
      const { data } = await api.get('/chat/conversations/');
      console.log('📥 [Chat] Conversations API response:', JSON.stringify(data, null, 2));
      console.log('📥 [Chat] Response structure:', {
        success: data?.success,
        resultsCount: data?.results?.length || 0,
        hasResults: !!data?.results,
      });
      
      // Handle the response format: { success: true, results: [...] }
      const conversations = data?.results || (Array.isArray(data) ? data : []);
      console.log('📥 [Chat] Processed conversations:', conversations.length);
      console.log('📥 [Chat] First conversation sample:', conversations[0] ? JSON.stringify(conversations[0], null, 2) : 'No conversations');
      
      return conversations;
    } catch (error: any) {
      console.error('❌ [Chat] Error fetching conversations:', error);
      console.error('❌ [Chat] Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch conversations';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch conversation detail
export const fetchConversationDetail = createAsyncThunk(
  'chat/fetchConversationDetail',
  async (conversationId: number, { rejectWithValue }) => {
    try {
      console.log('📤 [Chat] Fetching conversation detail - API: GET /chat/conversations/' + conversationId + '/');
      console.log('📤 [Chat] Conversation ID:', conversationId);
      const { data } = await api.get(`/chat/conversations/${conversationId}/`);
      console.log('📥 [Chat] Conversation detail response:', JSON.stringify(data, null, 2));
      console.log('📥 [Chat] Response structure:', {
        id: data?.id,
        hasCoaching: !!data?.coaching,
      });
      return data;
    } catch (error: any) {
      console.error('❌ [Chat] Error fetching conversation detail:', error);
      console.error('❌ [Chat] Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch conversation';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch messages for a conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: number, { rejectWithValue }) => {
    try {
      console.log('📤 [Chat] Fetching messages - API: GET /chat/conversations/' + conversationId + '/messages/');
      console.log('📤 [Chat] Conversation ID:', conversationId);
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages/`);
      console.log('📥 [Chat] Messages response:', JSON.stringify(data, null, 2));
      console.log('📥 [Chat] Response structure:', {
        isArray: Array.isArray(data),
        hasResults: !!data?.results,
        messagesCount: Array.isArray(data) ? data.length : (data?.results?.length || 0),
      });
      
      // Handle both array and paginated response
      const rawMessages = Array.isArray(data) ? data : (data?.results || []);
      console.log('📥 [Chat] Processed messages:', rawMessages.length);
      console.log('📥 [Chat] First message sample:', rawMessages[0] ? JSON.stringify(rawMessages[0], null, 2) : 'No messages');
      
      // Map API response to ChatMessage format
      const messages = rawMessages.map((msg: any) => ({
        id: msg.id,
        conversation: msg.conversation,
        sender_type: msg.sender_type || 'user',
        text: msg.text || '',
        message: msg.text || msg.message || '', // Support both 'text' and 'message'
        content_type: msg.content_type || 'text',
        attachment: msg.attachment || null,
        is_read: msg.is_read || false,
        created_at: msg.created_at || '',
        updated_at: msg.updated_at || msg.created_at || '',
      }));
      
      return { conversationId, messages };
    } catch (error: any) {
      console.error('❌ [Chat] Error fetching messages:', error);
      console.error('❌ [Chat] Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch messages';
      return rejectWithValue(errorMessage);
    }
  }
);

// Start a new conversation
export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async (coachingId: number, { rejectWithValue }) => {
    try {
      const requestBody = {
        coaching_id: coachingId,
      };
      console.log('📤 [Chat] Starting conversation - API: POST /chat/conversations/start/');
      console.log('📤 [Chat] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📤 [Chat] Coaching ID:', coachingId, '(type:', typeof coachingId, ')');
      
      const { data } = await api.post('/chat/conversations/start/', requestBody);
      console.log('📥 [Chat] Start conversation response:', JSON.stringify(data, null, 2));
      console.log('📥 [Chat] Response structure:', {
        id: data?.id,
        hasCoaching: !!data?.coaching,
        coachingId: data?.coaching?.id,
        coachingName: data?.coaching?.branch_name,
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ [Chat] Error starting conversation:', error);
      console.error('❌ [Chat] Error response:', error.response?.data);
      console.error('❌ [Chat] Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to start conversation';
      return rejectWithValue(errorMessage);
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { conversationId, text }: { conversationId: number; text: string },
    { rejectWithValue }
  ) => {
    try {
      const requestBody = {
        text: text,
        content_type: 'text',
      };
      console.log('📤 [Chat] Sending message - API: POST /chat/conversations/' + conversationId + '/send/');
      console.log('📤 [Chat] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📤 [Chat] Conversation ID:', conversationId);
      
      const { data } = await api.post(`/chat/conversations/${conversationId}/send/`, requestBody);
      console.log('📥 [Chat] Send message response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error: any) {
      console.error('❌ [Chat] Error sending message:', error);
      console.error('❌ [Chat] Error response:', error.response?.data);
      console.error('❌ [Chat] Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to send message';
      return rejectWithValue(errorMessage);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearCurrentConversation(state) {
      state.currentConversation = null;
      state.conversationDetailError = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearStartingError(state) {
      state.startingError = null;
    },
    clearSendingError(state) {
      state.sendingError = null;
    },
    addMessageLocally(state, action: PayloadAction<ChatMessage>) {
      if (state.currentConversation) {
        if (!state.currentConversation.messages) {
          state.currentConversation.messages = [];
        }
        state.currentConversation.messages.push(action.payload);
        state.currentConversation.last_message = action.payload;
        state.currentConversation.updated_at = action.payload.created_at;
      }
      // Update in conversations list
      const conversation = state.conversations.find(c => c.id === action.payload.conversation);
      if (conversation) {
        conversation.last_message = action.payload;
        conversation.updated_at = action.payload.created_at;
        // Increment unread count if message is from coaching
        if (action.payload.sender_type === 'coaching_center') {
          conversation.user_unread_count = (conversation.user_unread_count || 0) + 1;
        }
      }
    },
    markConversationAsRead(state, action: PayloadAction<number>) {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.user_unread_count = 0;
      }
      if (state.currentConversation && state.currentConversation.id === action.payload) {
        state.currentConversation.user_unread_count = 0;
        // Mark all messages as read
        if (state.currentConversation.messages) {
          state.currentConversation.messages.forEach(msg => {
            msg.is_read = true;
          });
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        // Action payload is already the conversations array (processed in thunk)
        const conversations = Array.isArray(action.payload) ? action.payload : [];
        // Filter out any invalid conversations
        state.conversations = conversations.filter((conv: any) => conv && conv.id && conv.coaching);
        console.log('✅ [Chat] Conversations stored in state:', state.conversations.length);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch conversation detail
      .addCase(fetchConversationDetail.pending, (state) => {
        state.conversationDetailLoading = true;
        state.conversationDetailError = null;
      })
      .addCase(fetchConversationDetail.fulfilled, (state, action) => {
        state.conversationDetailLoading = false;
        if (action.payload && action.payload.id) {
          // Update or create current conversation
          if (state.currentConversation && state.currentConversation.id === action.payload.id) {
            // Merge with existing, preserve messages that were already loaded
            const existingMessages = state.currentConversation.messages || [];
            state.currentConversation = {
              ...state.currentConversation,
              ...action.payload,
              messages: existingMessages.length > 0 ? existingMessages : (action.payload.messages || []),
            };
          } else {
            // Create new conversation detail, preserve messages if they exist
            const existingMessages = state.currentConversation?.messages || [];
            state.currentConversation = {
              ...action.payload,
              messages: existingMessages.length > 0 ? existingMessages : (action.payload.messages || []),
            };
          }
          // Update in conversations list if exists
          const existingIndex = state.conversations.findIndex(c => c.id === action.payload.id);
          if (existingIndex >= 0) {
            state.conversations[existingIndex] = {
              ...state.conversations[existingIndex],
              ...action.payload,
            };
          }
        }
      })
      .addCase(fetchConversationDetail.rejected, (state, action) => {
        state.conversationDetailLoading = false;
        state.conversationDetailError = action.payload as string;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        if (action.payload && action.payload.conversationId) {
          // Ensure currentConversation exists or create it
          if (!state.currentConversation || state.currentConversation.id !== action.payload.conversationId) {
            // Create a basic conversation structure if it doesn't exist
            state.currentConversation = {
              id: action.payload.conversationId,
              coaching: {} as any, // Will be populated by fetchConversationDetail
              user_unread_count: 0,
              coaching_unread_count: 0,
              messages: action.payload.messages,
              created_at: '',
              updated_at: '',
            };
          } else {
            // Update messages in current conversation
            state.currentConversation.messages = action.payload.messages;
          }
          console.log('✅ [Chat] Messages loaded:', action.payload.messages.length);
          console.log('✅ [Chat] Current conversation messages:', state.currentConversation.messages?.length || 0);
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload as string;
      })
      // Start conversation
      .addCase(startConversation.pending, (state) => {
        state.startingConversation = true;
        state.startingError = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.startingConversation = false;
        if (action.payload && action.payload.id) {
          console.log('✅ [Chat] Conversation started successfully:', action.payload.id);
          // Ensure messages array exists for current conversation
          const conversationData = {
            ...action.payload,
            messages: action.payload.messages || [],
          };
          
          // Add to conversations list if not already there
          const exists = state.conversations.find(c => c.id === action.payload.id);
          if (!exists) {
            state.conversations.unshift(action.payload);
            console.log('✅ [Chat] Added new conversation to list');
          } else {
            // Update existing conversation
            const index = state.conversations.findIndex(c => c.id === action.payload.id);
            if (index >= 0) {
              state.conversations[index] = action.payload;
              console.log('✅ [Chat] Updated existing conversation in list');
            }
          }
          // Set as current conversation with messages array
          state.currentConversation = conversationData;
        }
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.startingConversation = false;
        state.startingError = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.sendingError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        if (action.payload && state.currentConversation) {
          console.log('✅ [Chat] Message sent successfully');
          console.log('✅ [Chat] Message response:', JSON.stringify(action.payload, null, 2));
          
          // The API might return the message object directly or in a nested structure
          const rawMessage = action.payload.message || action.payload;
          
          // Map API response to ChatMessage format
          const message: ChatMessage = {
            id: rawMessage.id,
            conversation: rawMessage.conversation,
            sender_type: rawMessage.sender_type || 'user',
            text: rawMessage.text || '',
            message: rawMessage.text || rawMessage.message || '',
            content_type: rawMessage.content_type || 'text',
            attachment: rawMessage.attachment || null,
            is_read: rawMessage.is_read || false,
            created_at: rawMessage.created_at || '',
            updated_at: rawMessage.updated_at || rawMessage.created_at || '',
          };
          
          // Add message to current conversation
          if (!state.currentConversation.messages) {
            state.currentConversation.messages = [];
          }
          // Check if message already exists (avoid duplicates)
          const messageExists = state.currentConversation.messages.some(m => m.id === message.id);
          if (!messageExists) {
            state.currentConversation.messages.push(message);
          }
          state.currentConversation.last_message = message;
          state.currentConversation.updated_at = message.created_at || new Date().toISOString();
          
          // Update in conversations list
          const conversation = state.conversations.find(c => c.id === state.currentConversation?.id);
          if (conversation) {
            conversation.last_message = message;
            conversation.updated_at = message.created_at || new Date().toISOString();
          }
          
          console.log('✅ [Chat] Message added to conversation');
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendingError = action.payload as string;
      });
  },
});

export const { 
  clearCurrentConversation, 
  clearError, 
  clearStartingError,
  clearSendingError,
  addMessageLocally, 
  markConversationAsRead 
} = chatSlice.actions;
export default chatSlice.reducer;

