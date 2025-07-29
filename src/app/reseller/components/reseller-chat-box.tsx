
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, push, increment, get } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import type { ChatMessage } from '@/types/chat';

export default function ResellerChatBox({ isOpen }: { isOpen: boolean; }) {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize: Check if a chatId already exists. For a reseller, it's always their UID.
  useEffect(() => {
    if (user) {
        const userChatId = user.uid;
        setChatId(userChatId);
    }
    setIsInitialized(true);
  }, [user]);

  // Effect to listen for new messages from the active chat
  useEffect(() => {
    if (!chatId || !isOpen || !isInitialized) return;

    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages: ChatMessage[] = data ? Object.values(data) : [];
        loadedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(loadedMessages);
    }, (error) => {
        console.error("Error fetching messages:", error);
    });

    return () => off(messagesRef, 'value', listener);
  }, [chatId, isOpen, isInitialized]);


  // Automatically scroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Main function to send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return;
    setIsSending(true);
    
    try {
        const updates: { [key: string]: any } = {};
        const messageKey = push(ref(rtdb, `chats/${chatId}/messages`)).key;
        
        const chatMetadataRef = ref(rtdb, `chats/${chatId}/metadata`);
        const chatSnapshot = await get(chatMetadataRef);

        if (!chatSnapshot.exists()) {
             const userDocRef = doc(db, 'user', user.uid);
             const userDoc = await getDoc(userDocRef);
             const userName = userDoc.exists() ? userDoc.data().name : user.displayName || "Reseller";
             const userAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;

            // 1. Create chat metadata
            updates[`/chats/${chatId}/metadata`] = {
                buyerId: user.uid,
                adminId: "not_assigned",
                buyerName: userName,
                avatar: userAvatar,
                lastMessage: newMessage,
                timestamp: serverTimestamp(),
            };
            // 2. Create conversation entry for admin dashboard
            updates[`/conversations/${chatId}`] = {
                chatId: chatId,
                buyerName: userName,
                avatar: userAvatar,
                lastMessage: newMessage,
                timestamp: serverTimestamp(),
                unreadByAdmin: 1,
            };
        } else {
            // Update existing metadata and conversation
            updates[`/chats/${chatId}/metadata/lastMessage`] = newMessage;
            updates[`/chats/${chatId}/metadata/timestamp`] = serverTimestamp();
            updates[`/conversations/${chatId}/lastMessage`] = newMessage;
            updates[`/conversations/${chatId}/timestamp`] = serverTimestamp();
            updates[`/conversations/${chatId}/unreadByAdmin`] = increment(1);
        }

        // 3. Add the new message itself
        updates[`/chats/${chatId}/messages/${messageKey}`] = {
            senderId: user.uid,
            text: newMessage,
            timestamp: serverTimestamp(),
        };

        await update(ref(rtdb), updates);

        setNewMessage('');
    } catch(error) {
        console.error("Failed to send message: ", error);
    } finally {
        setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }
  
  if (!isInitialized) {
      return (
          <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
             <Card className="h-[60vh] flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin" />
             </Card>
          </div>
      )
  }

  if (!user) {
    return (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
            <Card className="h-[60vh]">
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Silakan login untuk memulai percakapan.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
      <Card className="flex h-[60vh] flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center border-b p-4">
          <div className="flex-1">
            <CardTitle>Chat dengan Admin</CardTitle>
            <CardDescription>Kami siap membantu Anda</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((chat, index) => (
                <div key={index} className={`flex items-end gap-2 ${chat.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                    {chat.senderId !== user.uid && <Avatar className="h-8 w-8"><AvatarImage src="/logo.svg" /><AvatarFallback>A</AvatarFallback></Avatar>}
                    <div className={`max-w-[75%] rounded-lg p-3 ${chat.senderId === user.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{chat.text}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
            <Input placeholder="Ketik pesan..." className="pr-12" value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isSending} />
            <Button type="submit" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2" disabled={isSending}>
                {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
            </Button>
            </form>
        </div>
      </Card>
    </div>
  );
}
