
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, set, push, serverTimestamp, get } from "firebase/database";
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
    if (!user) {
        setIsInitialized(true);
        return;
    };
    
    const userChatRef = ref(rtdb, `userChats/${user.uid}`);
    get(userChatRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userChatData = snapshot.val();
            const existingChatId = Object.keys(userChatData)[0];
            setChatId(existingChatId);
        }
        setIsInitialized(true);
    }).catch(error => {
        console.error("Error fetching user chat id:", error);
        setIsInitialized(true);
    });

  }, [user]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages = data ? Object.values(data) as Message[] : [];
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
    });

    return () => off(messagesRef, 'value', listener);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const createNewChat = async (firstMessage: Message) => {
    if (!user) return null;

    const userDocRef = doc(db, 'user', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ? userDoc.data().name : user.displayName || "Reseller";
    const userAvatar = user.photoURL || `https://placehold.co/40x40.png`;
    
    const newChatId = generatePushID();
    const chatRef = ref(rtdb, `chats/${newChatId}`);
    
    const chatData = {
        metadata: {
            buyerId: user.uid,
            buyerName: userName,
            avatar: userAvatar,
            lastMessage: firstMessage.text,
            timestamp: serverTimestamp(),
            adminId: "admin_placeholder",
            unreadByAdmin: 1,
        },
        messages: {
            [generatePushID()]: firstMessage
        }
    };
    await set(chatRef, chatData);
    
    // Also save the chat id under the user's private data
    const userChatRef = ref(rtdb, `userChats/${user.uid}/${newChatId}`);
    await set(userChatRef, true);
    
    return newChatId;
  };


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);

    const messageData: Message = {
      senderId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp(),
    };
    
    try {
        let currentChatId = chatId;
        
        if (!currentChatId) {
            currentChatId = await createNewChat(messageData);
            if(currentChatId) {
                setChatId(currentChatId);
            }
        } else {
            const chatRef = ref(rtdb, `chats/${currentChatId}`);
            
            // Push new message
            const messagesListRef = ref(rtdb, `chats/${currentChatId}/messages`);
            const newMessageRef = push(messagesListRef);
            await set(newMessageRef, messageData);
            
            // Update metadata
            const metadataRef = ref(rtdb, `chats/${currentChatId}/metadata`);
            const currentUnread = (await get(ref(rtdb, `chats/${currentChatId}/metadata/unreadByAdmin`))).val() || 0;
            
            await set(metadataRef, {
              lastMessage: newMessage,
              timestamp: serverTimestamp(),
              unreadByAdmin: currentUnread + 1,
            });
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
