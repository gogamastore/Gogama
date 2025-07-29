
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, set, push, get, increment, child } from "firebase/database";
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

  // Inisialisasi: Cek apakah sudah ada chatId di localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // Cek localStorage hanya jika user sudah terautentikasi
        if(user) {
            const savedChatId = localStorage.getItem(`chatId_${user.uid}`);
            if (savedChatId) {
                setChatId(savedChatId);
            }
        }
    }
    setIsInitialized(true);
  }, [user]);

  // Efek untuk mendengarkan pesan baru dari chat yang aktif
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


  // Scroll otomatis ke pesan terakhir
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fungsi untuk membuat chat baru jika belum ada
  const createNewChat = async (firstMessageText: string) => {
    if (!user) return null;

    const userDocRef = doc(db, 'user', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ? userDoc.data().name : user.displayName || "Reseller";
    const userAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
    
    // Chat ID sekarang adalah UID pembeli itu sendiri untuk kemudahan
    const newChatId = user.uid;
    const updates: { [key: string]: any } = {};

    // 1. Buat node chat baru dengan metadata
    updates[`/chats/${newChatId}/metadata`] = {
        buyerId: user.uid,
        adminId: "not_assigned", // Admin belum ada yang membalas
        buyerName: userName,
        avatar: userAvatar,
        lastMessage: firstMessageText,
        timestamp: serverTimestamp(),
    };

    // 2. Tambahkan pesan pertama
    const firstMessageKey = push(child(ref(rtdb), `chats/${newChatId}/messages`)).key;
    updates[`/chats/${newChatId}/messages/${firstMessageKey}`] = {
        senderId: user.uid,
        text: firstMessageText,
        timestamp: serverTimestamp(),
    };
    
    // 3. Buat entri di list percakapan untuk admin
    updates[`/conversations/${newChatId}`] = {
        chatId: newChatId,
        buyerName: userName,
        avatar: userAvatar,
        lastMessage: firstMessageText,
        timestamp: serverTimestamp(),
        unreadByAdmin: 1,
    };

    try {
      await update(ref(rtdb), updates);
      return newChatId;
    } catch(error) {
      console.error("Failed to create new chat:", error);
      return null;
    }
  };


  // Fungsi utama untuk mengirim pesan
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);
    
    try {
        let currentChatId = chatId;
        
        // Jika belum ada chat, buat dulu
        if (!currentChatId) {
            currentChatId = await createNewChat(newMessage);
            if(currentChatId) {
                localStorage.setItem(`chatId_${user.uid}`, currentChatId);
                setChatId(currentChatId);
            }
        } else { // Jika sudah ada, langsung kirim pesan
            const updates: { [key: string]: any } = {};
            const messageKey = push(ref(rtdb, `chats/${currentChatId}/messages`)).key;
            
            // 1. Tambah pesan baru
            updates[`/chats/${currentChatId}/messages/${messageKey}`] = {
                senderId: user.uid,
                text: newMessage,
                timestamp: serverTimestamp(),
            };
            // 2. Update metadata
            updates[`/chats/${currentChatId}/metadata/lastMessage`] = newMessage;
            updates[`/chats/${currentChatId}/metadata/timestamp`] = serverTimestamp();
            
            // 3. Update list percakapan dan notifikasi untuk admin
            updates[`/conversations/${currentChatId}/lastMessage`] = newMessage;
            updates[`/conversations/${currentChatId}/timestamp`] = serverTimestamp();
            updates[`/conversations/${currentChatId}/unreadByAdmin`] = increment(1);

            await update(ref(rtdb), updates);
        }
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
