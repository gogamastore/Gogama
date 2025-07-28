
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, set } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
    senderId: string;
    text: string;
    timestamp: any;
}

// Helper to generate a unique ID, similar to Firebase's push keys
function generatePushID() {
    const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
    let lastPushTime = 0;
    const lastRandChars: number[] = [];
    
    return (function() {
      let now = new Date().getTime();
      let duplicateTime = (now === lastPushTime);
      lastPushTime = now;
  
      let timeStampChars = new Array(8);
      for (var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        now = Math.floor(now / 64);
      }
  
      let id = timeStampChars.join('');
  
      if (!duplicateTime) {
        for (i = 0; i < 12; i++) {
          lastRandChars[i] = Math.floor(Math.random() * 64);
        }
      } else {
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
          lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
      }
      for (i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
      }
      return id;
    })();
}


export default function ResellerChatBox({ isOpen }: { isOpen: boolean; }) {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedChatId = localStorage.getItem('chatId');
    if (savedChatId) {
        setChatId(savedChatId);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!chatId || !isOpen) return;

    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages = data ? Object.values(data) as Message[] : [];
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
    }, (error) => {
        console.error("Error fetching messages:", error);
        if (error.message.includes('permission_denied')) {
            localStorage.removeItem('chatId');
            setChatId(null);
        }
    });

    return () => off(messagesRef, 'value', listener);
  }, [chatId, isOpen]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const createNewChat = async (firstMessageText: string) => {
    if (!user) return null;

    const userDocRef = doc(db, 'user', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ? userDoc.data().name : user.displayName || "Reseller";
    const userAvatar = user.photoURL || `https://placehold.co/40x40.png`;
    
    const newChatId = generatePushID();
    const firstMessageId = generatePushID();

    const newChatData = {
        metadata: {
            buyerId: user.uid,
            buyerName: userName,
            avatar: userAvatar,
            lastMessage: firstMessageText,
            timestamp: serverTimestamp(),
            unreadByAdmin: 1,
            adminId: "not_assigned",
        },
        messages: {
            [firstMessageId]: {
                senderId: user.uid,
                text: firstMessageText,
                timestamp: serverTimestamp(),
            }
        }
    };

    try {
      const chatRef = ref(rtdb, `chats/${newChatId}`);
      await set(chatRef, newChatData);
      return newChatId;
    } catch(error) {
      console.error("Failed to create new chat:", error);
      return null;
    }
  };


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);
    
    try {
        let currentChatId = chatId;
        
        if (!currentChatId) {
            currentChatId = await createNewChat(newMessage);
            if(currentChatId) {
                localStorage.setItem('chatId', currentChatId);
                setChatId(currentChatId);
            }
        } else {
            const messageId = generatePushID();
            const updates: { [key: string]: any } = {};

            const messageData = {
                senderId: user.uid,
                text: newMessage,
                timestamp: serverTimestamp(),
            };

            updates[`/chats/${currentChatId}/messages/${messageId}`] = messageData;
            updates[`/chats/${currentChatId}/metadata/lastMessage`] = newMessage;
            updates[`/chats/${currentChatId}/metadata/timestamp`] = serverTimestamp();
            
            const unreadRef = ref(rtdb, `chats/${currentChatId}/metadata/unreadByAdmin`);
            onValue(unreadRef, (snapshot) => {
              const currentUnread = snapshot.val() || 0;
              updates[`/chats/${currentChatId}/metadata/unreadByAdmin`] = currentUnread + 1;
            }, { onlyOnce: true });

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
