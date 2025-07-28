'use server';
/**
 * @fileOverview A server-side flow to handle sending chat messages.
 * This is used by admins to bypass security rules that only allow users to write to their own chat paths.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { rtdb } from '@/lib/firebase';
import { ref, push, update, serverTimestamp, increment, get } from "firebase/database";

const SendChatMessageInputSchema = z.object({
  text: z.string(),
  userId: z.string(),
  senderId: z.string(),
  senderType: z.enum(['admin', 'user']),
});

export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

export async function sendChatMessage(input: SendChatMessageInput) {
    return sendChatMessageFlow(input);
}


const sendChatMessageFlow = ai.defineFlow(
  {
    name: 'sendChatMessageFlow',
    inputSchema: SendChatMessageInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ text, userId, senderId, senderType }) => {
    try {
        const messageData = {
            sender: senderType,
            text: text,
            timestamp: serverTimestamp(),
        };

        const chatMessagesRef = ref(rtdb, `chats/${userId}/messages`);
        await push(chatMessagesRef, messageData);
        
        const conversationRef = ref(rtdb, `conversations/${userId}`);
        const currentConvoSnap = await get(conversationRef);
        const currentConvoData = currentConvoSnap.val() || {};

        const updateData: any = {
            ...currentConvoData,
            lastMessage: text,
            timestamp: serverTimestamp(),
        };

        if (senderType === 'admin') {
            updateData.unreadByUser = increment(1);
        } else {
            updateData.unreadByAdmin = increment(1);
        }

        await update(conversationRef, updateData);

        return { success: true };
    } catch (error) {
      console.error("Error in sendChatMessageFlow: ", error);
      // In a real app, you'd want more robust error handling/logging
      return { success: false };
    }
  }
);
