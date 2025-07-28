'use server';

/**
 * @fileOverview A flow to handle sending chat messages to Firebase Realtime Database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { rtdb } from '@/lib/firebase';
import { ref, push, update, serverTimestamp, increment } from 'firebase/database';

const ChatMessageSchema = z.object({
  sender: z.enum(['admin', 'user']),
  text: z.string(),
});

export const SendChatMessageInputSchema = z.object({
  conversationId: z.string().describe('The ID of the user who is part of the conversation.'),
  message: ChatMessageSchema,
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

export async function sendChatMessage(input: SendChatMessageInput): Promise<{ success: boolean }> {
  return sendChatMessageFlow(input);
}

const sendChatMessageFlow = ai.defineFlow(
  {
    name: 'sendChatMessageFlow',
    inputSchema: SendChatMessageInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ conversationId, message }) => {
    try {
      const chatRef = ref(rtdb, `chats/${conversationId}/messages`);
      const conversationRef = ref(rtdb, `conversations/${conversationId}`);
      
      // 1. Push new message
      const newMessageRef = push(chatRef);
      await update(newMessageRef, {
        ...message,
        timestamp: serverTimestamp(),
      });
      
      // 2. Update conversation metadata
      const updates: any = {
          lastMessage: message.text,
          timestamp: serverTimestamp(),
      };
      
      // Increment unread counter
      if (message.sender === 'admin') {
          updates.unreadByUser = increment(1);
      } else { // sender is 'user'
          updates.unreadByAdmin = increment(1);
      }

      await update(conversationRef, updates);

      return { success: true };
    } catch (error) {
      console.error("Error sending chat message:", error);
      return { success: false };
    }
  }
);
