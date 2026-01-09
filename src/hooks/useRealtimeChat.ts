/**
 * Hook for real-time chat updates using Firebase Firestore
 */
import { useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit,
  QuerySnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { getFirestoreDB } from '../config/firebase';
import { ChatMessage } from '../store/slices/chatSlice';
import { useAppDispatch } from '../store/hooks';
import { addMessageLocally } from '../store/slices/chatSlice';

interface UseRealtimeChatOptions {
  conversationId: number | null;
  enabled?: boolean;
}

export const useRealtimeChat = ({ conversationId, enabled = true }: UseRealtimeChatOptions) => {
  const dispatch = useAppDispatch();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const processedMessageIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled || !conversationId) {
      // Clean up existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    try {
      const db = getFirestoreDB();
      const conversationRef = collection(db, 'conversations', String(conversationId), 'messages');
      
      // Query for messages ordered by created_at, limit to recent messages
      const q = query(
        conversationRef,
        orderBy('created_at', 'desc'),
        limit(50) // Listen to last 50 messages
      );

      console.log('🔥 [Firestore] Setting up real-time listener for conversation:', conversationId);

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          console.log('🔥 [Firestore] Received snapshot with', snapshot.docs.length, 'messages');
          
          snapshot.docChanges().forEach((change) => {
            try {
              const data = change.doc.data();
              
              // Skip if we've already processed this message
              const messageId = parseInt(String(data.id || change.doc.id), 10);
              if (isNaN(messageId) || processedMessageIdsRef.current.has(messageId)) {
                return;
              }

              // Only process new messages (added)
              if (change.type === 'added') {
                console.log('🔥 [Firestore] New message detected:', messageId);
                
                // Convert Firestore data to ChatMessage format
                // Handle both 'coaching' and 'coaching_center' sender types
                let senderType: 'user' | 'coaching_center' | 'coaching' | 'student' | 'tutor' = 'user';
                if (data.sender_type === 'coaching' || data.sender_type === 'coaching_center') {
                  senderType = 'coaching_center';
                } else if (data.sender_type === 'user') {
                  senderType = 'user';
                }

                // Parse created_at - handle both string and Timestamp
                let createdAt = data.created_at;
                if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
                  // Firestore Timestamp
                  createdAt = (createdAt as Timestamp).toDate().toISOString();
                } else if (!createdAt || typeof createdAt !== 'string') {
                  createdAt = new Date().toISOString();
                }

                const message: ChatMessage = {
                  id: messageId,
                  conversation: parseInt(String(data.conversation_id || conversationId), 10),
                  sender_type: senderType,
                  text: data.text || '',
                  message: data.text || '',
                  content_type: data.content_type || 'text',
                  attachment: data.attachment || null,
                  is_read: data.is_read || false,
                  created_at: createdAt,
                  updated_at: createdAt,
                };

                // Add to processed set
                processedMessageIdsRef.current.add(messageId);

                // Dispatch to Redux store
                dispatch(addMessageLocally(message));
                console.log('✅ [Firestore] Message added to store:', messageId);
              }
            } catch (error) {
              console.error('❌ [Firestore] Error processing message change:', error);
            }
          });
        },
        (error) => {
          console.error('❌ [Firestore] Error in real-time listener:', error);
        }
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          console.log('🔥 [Firestore] Cleaning up real-time listener');
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        processedMessageIdsRef.current.clear();
      };
    } catch (error) {
      console.error('❌ [Firestore] Error setting up real-time listener:', error);
    }
  }, [conversationId, enabled, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);
};

