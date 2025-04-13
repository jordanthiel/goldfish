import { supabase } from '@/integrations/supabase/client';

// This should be stored in environment variables in production
const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isFromUser: boolean;
}

export const messagingService = {
    async getMessages(userId: string, clientId: string): Promise<Message[]> {
        try {
          const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .or(`sender_id.eq.${clientId},receiver_id.eq.${clientId}`)
            .order('created_at', { ascending: false });
    
          if (error) {
            console.error('Error fetching messages:', error);
            return [];
          }
    
          return Promise.all(messages.map(async msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: await this._decryptMessage(msg.content), // Decrypt the message content
            timestamp: msg.created_at,
            isFromUser: msg.is_from_user
          })));
    
        } catch (error) {
          console.error('Error in getMessages:', error);
          return [];
        }
      },
      
      async sendMessage(clientId: string, message: string): Promise<boolean> {
        try {
          const encryptedContent = await this._encryptMessage(message); // Encrypt the message content
          
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: clientId,
              receiver_id: null, // TODO: Get therapist ID from relationship
              content: encryptedContent,
              is_from_user: true,
              is_read: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
    
          if (error) {
            console.error('Error sending message:', error);
            return false;
          }
    
          return true;
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return false;
        }
      },
    
      // Helper methods for encryption/decryption using Web Crypto API
      async _encryptMessage(message: string): Promise<string> {
        try {
          // Generate a random 96-bit IV
          const iv = crypto.getRandomValues(new Uint8Array(12));
          
          // Convert the encryption key to a format usable by Web Crypto API
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(ENCRYPTION_KEY),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
          );
          
          // Encrypt the message
          const encodedMessage = new TextEncoder().encode(message);
          const encryptedData = await crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: iv
            },
            keyMaterial,
            encodedMessage
          );
          
          // Convert both IV and encrypted data to base64 separately and combine
          const ivBase64 = btoa(String.fromCharCode(...iv));
          const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
          
          // Combine with a separator that won't appear in base64
          return `${ivBase64}:${encryptedBase64}`;
        } catch (error) {
          console.error('Encryption error:', error);
          throw new Error('Failed to encrypt message');
        }
      },
    
      async _decryptMessage(encryptedData: string): Promise<string> {
        try {
          // Validate input
          if (!encryptedData) {
            throw new Error('No encrypted data provided');
          }

          // Split the combined data
          const [ivBase64, encryptedBase64] = encryptedData.split(':');
          if (!ivBase64 || !encryptedBase64) {
            throw new Error('Invalid encrypted data format');
          }

          // Convert IV from base64
          const iv = new Uint8Array(
            atob(ivBase64)
              .split('')
              .map(char => char.charCodeAt(0))
          );

          // Convert encrypted data from base64
          const encrypted = new Uint8Array(
            atob(encryptedBase64)
              .split('')
              .map(char => char.charCodeAt(0))
          );
          
          // Import the key
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(ENCRYPTION_KEY),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
          );
          
          // Decrypt the data
          const decryptedData = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: iv
            },
            keyMaterial,
            encrypted
          );
          
          // Convert back to string
          return new TextDecoder().decode(decryptedData);
        } catch (error) {
          console.error('Decryption error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to decrypt message: ${errorMessage}`);
        }
      }
}