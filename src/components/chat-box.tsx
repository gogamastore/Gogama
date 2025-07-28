
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Send, Loader2 } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, set } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';

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


interface ChatMetadata {
    buyerId: string;
    buyerName: string;
    adminId?: string;
    lastMessage: string;
    timestamp: any;
    avatar?: string;
    unreadByAdmin?: number;
}

interface Message {
    senderId: string;
    text: string;
    timestamp: any;
}

interface Chat {
    id: string;
    metadata: ChatMetadata;
    messages?: { [key: string]: Message };
}

export default function ChatBox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: adminUser } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminUser || !isOpen) return;

    setLoading(true);
    const chatsRef = ref(rtdb, 'chats');
    const listener = onValue(chatsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const chatList: Chat[] = Object.keys(data).map(key => ({
                id: key,
                metadata: data[key].metadata
            })).sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
            setAllChats(chatList);
        } else {
            setAllChats([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Permission error fetching chats:", error);
        setLoading(false);
    });

    return () => off(chatsRef, 'value', listener);
  }, [adminUser, isOpen]);

  useEffect(() => {
    if (activeChatId) {
        const messagesRef = ref(rtdb, `chats/${activeChatId}/messages`);
        const listener = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedMessages = data ? Object.values(data) as Message[] : [];
            loadedMessages.sort((a,b) => a.timestamp - b.timestamp);
            setMessages(loadedMessages);
        }, (error) => {
          console.error("Permission error fetching messages:", error);
          setMessages([]);
        });
        
        // Mark as read by setting unreadByAdmin to 0
        const metadataRef = ref(rtdb, `chats/${activeChatId}/metadata/unreadByAdmin`);
        update(ref(rtdb), { [`/chats/${activeChatId}/metadata/unreadByAdmin`]: 0 })
          .catch(err => console.error("Could not mark as read:", err));

        return () => off(messagesRef, 'value', listener);
    } else {
        setMessages([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatId || !adminUser) return;
    setIsSending(true);

    const messageId = generatePushID();
    const updates: { [key: string]: any } = {};
    
    const messageData = {
        senderId: adminUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
    };

    updates[`/chats/${activeChatId}/messages/${messageId}`] = messageData;
    updates[`/chats/${activeChatId}/metadata/lastMessage`] = newMessage;
    updates[`/chats/${activeChatId}/metadata/timestamp`] = serverTimestamp();
    updates[`/chats/${activeChatId}/metadata/adminId`] = adminUser.uid;

    try {
        await update(ref(rtdb), updates);
        setNewMessage('');
    } catch (error) {
      console.error("Failed to send message: ", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
      setActiveChatId(chatId);
  }

  if (!isOpen) {
    return null;
  }

  const filteredChats = allChats.filter(c =>
    c.metadata.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeChat = allChats.find(c => c.id === activeChatId);

  return (
    <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
      <Card className="flex h-[60vh] flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center border-b p-4">
          {activeChatId && (
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setActiveChatId(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle>{activeChatId ? activeChat?.metadata.buyerName : 'Pesan'}</CardTitle>
            <CardDescription>{activeChatId ? 'Online' : `${allChats.length} percakapan`}</CardDescription>
          </div>
        </CardHeader>

        {activeChatId ? (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((chat, index) => (
                    <div key={index} className={`flex items-end gap-2 ${chat.senderId === adminUser?.uid ? 'justify-end' : 'justify-start'}`}>
                       {chat.senderId !== adminUser?.uid && <Avatar className="h-8 w-8"><AvatarImage src={activeChat?.metadata.avatar || undefined} /><AvatarFallback>{activeChat?.metadata.buyerName?.charAt(0)}</AvatarFallback></Avatar>}
                       <div className={`max-w-[75%] rounded-lg p-3 ${chat.senderId === adminUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           <p className="text-sm">{chat.text}</p>
                       </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                <Input placeholder="Ketik pesan..." className="pr-12" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={isSending} />
                <Button type="submit" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2" disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Cari percakapan..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map(chat => (
                    <div
                      key={chat.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chat.metadata.avatar} alt={chat.metadata.buyerName} />
                        <AvatarFallback>{chat.metadata.buyerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{chat.metadata.buyerName}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.metadata.lastMessage}</p>
                      </div>
                      {chat.metadata.unreadByAdmin && chat.metadata.unreadByAdmin > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {chat.metadata.unreadByAdmin}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
