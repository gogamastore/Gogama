"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, push, query as rtdbQuery, orderByChild, equalTo, get } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import type { ChatMessage } from '@/types/chat';

// Helper to create a consistent, unique chat ID between two users
const getChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export default function ResellerChatBox({ isOpen }: { isOpen: boolean; }) {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<{ id: string, name: string, email: string } | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Find an admin to chat with
  useEffect(() => {
    const findAdmin = async () => {
        try {
            const q = firestoreQuery(collection(db, "user"), where("role", "==", "admin"));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const adminDoc = querySnapshot.docs[0]; // Chat with the first admin found
                setAdmin({ id: adminDoc.id, ...adminDoc.data() } as { id: string, name: string, email: string });
            } else {
                 console.error("No admin user found to chat with.");
            }
        } catch(error) {
            console.error("Error finding admin:", error);
        }
    };
    findAdmin();
  }, []);

  // Initialize Chat ID once user and admin are available
  useEffect(() => {
    if (user && admin) {
        const newChatId = getChatId(user.uid, admin.id);
        setChatId(newChatId);
        setIsInitialized(true);
    }
  }, [user, admin]);

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
    if (!newMessage.trim() || !user || !admin || !chatId) return;
    setIsSending(true);

    try {
        const userDocRef = doc(db, 'user', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userName = userDoc.exists() ? userDoc.data().name : user.displayName || "Reseller";
        
        const updates: { [key: string]: any } = {};
        const messageKey = push(ref(rtdb, `chats/${chatId}/messages`)).key;

        const messageData = {
            id: messageKey,
            senderId: user.uid,
            text: newMessage,
            timestamp: serverTimestamp(),
        };

        const lastMessageUpdate = {
             lastMessage: newMessage,
             timestamp: serverTimestamp(),
        };

        // 1. Add new message
        updates[`/chats/${chatId}/messages/${messageKey}`] = messageData;

        // 2. Update last message metadata for both users
        updates[`/userChats/${user.uid}/${admin.id}`] = { ...lastMessageUpdate, withUser: { id: admin.id, name: admin.name, email: admin.email } };
        updates[`/userChats/${admin.id}/${user.uid}`] = { ...lastMessageUpdate, withUser: { id: user.uid, name: userName, email: user.email } };

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

  if (!user || !admin) {
    return (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
            <Card className="h-[60vh]">
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{!user ? "Silakan login untuk memulai percakapan." : "Layanan chat tidak tersedia saat ini."}</p>
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
            {messages.map((chat) => (
                <div key={chat.id} className={`flex items-end gap-2 ${chat.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
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
