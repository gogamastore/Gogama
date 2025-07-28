
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Send, Loader2 } from 'lucide-react';
import { db, rtdb } from '@/lib/firebase';
import { ref, onValue, off, push, serverTimestamp, update, increment } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs } from 'firebase/firestore';

interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    unread: number;
    avatar: string;
    timestamp: number;
}

interface Message {
    sender: string; // 'admin' or 'user'
    text: string;
    timestamp: any;
}

interface User {
    id: string;
    name: string;
    photoURL?: string;
}

export default function ChatBox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: adminUser } = useAuth();
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function fetchUsers() {
        const querySnapshot = await getDocs(collection(db, "user"));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    setLoading(true);
    const convosRef = ref(rtdb, 'conversations');
    const listener = onValue(convosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const convosList: Conversation[] = Object.keys(data).map(key => {
                const user = users.find(u => u.id === key);
                return {
                    id: key,
                    name: user?.name || 'Unknown User',
                    lastMessage: data[key].lastMessage,
                    timestamp: data[key].timestamp,
                    unread: data[key].unreadByAdmin || 0,
                    avatar: user?.photoURL || `https://placehold.co/40x40.png`
                };
            }).sort((a, b) => b.timestamp - a.timestamp);
            setConversations(convoList);
        }
        setLoading(false);
    });

    return () => off(convosRef, 'value', listener);
  }, [users]);
  
  useEffect(() => {
    if (activeChatUserId) {
        const messagesRef = ref(rtdb, `chats/${activeChatUserId}/messages`);
        const listener = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            setMessages(data ? Object.values(data) : []);
        });
        
        // Mark messages as read
        update(ref(rtdb, `conversations/${activeChatUserId}`), {
          unreadByAdmin: 0
        });

        return () => off(messagesRef, 'value', listener);
    }
  }, [activeChatUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatUserId) return;

    const messageData = {
      sender: 'admin',
      text: newMessage,
      timestamp: serverTimestamp(),
    };

    const conversationData = {
      lastMessage: newMessage,
      timestamp: serverTimestamp(),
      unreadByUser: increment(1)
    };
    
    // Create a new message reference
    const chatRef = ref(rtdb, `chats/${activeChatUserId}/messages`);
    const newMessageRef = push(chatRef);
    
    // Create updates object for atomic operation
    const updates: { [key: string]: any } = {};
    updates[`/chats/${activeChatUserId}/messages/${newMessageRef.key}`] = messageData;
    updates[`/conversations/${activeChatUserId}`] = conversationData;

    try {
        await update(ref(rtdb), updates);
        setNewMessage('');
    } catch(error) {
        console.error("Failed to send message: ", error);
        // Add toast notification here if you have one
    }
  };

  const handleSelectChat = (userId: string) => {
      setActiveChatUserId(userId);
  }

  if (!isOpen) {
    return null;
  }

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeUser = users.find(u => u.id === activeChatUserId);


  return (
    <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
      <Card className="flex h-[60vh] flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center border-b p-4">
          {activeChatUserId && (
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setActiveChatUserId(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle>{activeChatUserId ? activeUser?.name : 'Pesan'}</CardTitle>
            <CardDescription>{activeChatUserId ? 'Online' : `${conversations.length} percakapan`}</CardDescription>
          </div>
        </CardHeader>

        {activeChatUserId ? (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((chat, index) => (
                    <div key={index} className={`flex items-end gap-2 ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                       {chat.sender !== 'admin' && <Avatar className="h-8 w-8"><AvatarImage src={activeUser?.photoURL} /><AvatarFallback>{activeUser?.name?.charAt(0)}</AvatarFallback></Avatar>}
                       <div className={`max-w-[75%] rounded-lg p-3 ${chat.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           <p className="text-sm">{chat.text}</p>
                       </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                <Input placeholder="Ketik pesan..." className="pr-12" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <Button type="submit" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2">
                  <Send className="h-5 w-5" />
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
                  {filteredConversations.map(convo => (
                    <div
                      key={convo.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectChat(convo.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={convo.avatar} alt={convo.name} />
                        <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{convo.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                      {convo.unread > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {convo.unread}
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
