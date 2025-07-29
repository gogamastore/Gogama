"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Send, Loader2 } from 'lucide-react';
import { rtdb, db } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, push, get, set } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { ChatMessage } from '@/types/chat';

interface ChatParticipant {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

// Helper to create a consistent, unique chat ID between two users
const getChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export default function ChatBox({ isOpen }: { isOpen: boolean; }) {
  const { user: adminUser } = useAuth();
  const [activeChat, setActiveChat] = useState<{ participant: ChatParticipant, chatId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to load all potential chat participants (resellers) for the admin
  useEffect(() => {
    if (!adminUser || !isOpen) return;

    setLoading(true);
    const fetchUsers = async () => {
        try {
            // Fetch all users with the 'reseller' role from Firestore
            const q = query(collection(db, "user"), where("role", "==", "reseller"));
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || 'Unknown User',
                email: doc.data().email,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name || 'U')}&background=random`
            } as ChatParticipant));
            setAllUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    };
    fetchUsers();
  }, [adminUser, isOpen]);
  
  // Effect to load messages from the active chat
   useEffect(() => {
    if (activeChat?.chatId) {
      const messagesRef = ref(rtdb, `chats/${activeChat.chatId}/messages`);
      const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages: ChatMessage[] = data ? Object.values(data) : [];
        loadedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(loadedMessages);
      }, (error) => {
        console.error("Failed to fetch messages for active chat:", error);
        setMessages([]);
      });
      
      // Mark as read by admin (optional, can be implemented later)
      // update(ref(rtdb), { [`/userChats/${adminUser?.uid}/${activeChat.participant.id}/unread`]: 0 });

      return () => off(messagesRef, 'value', listener);
    } else {
        setMessages([]);
    }
  }, [activeChat, adminUser]);


  // Scroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to send a message as an admin
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !adminUser) return;
    setIsSending(true);

    const { participant, chatId } = activeChat;

    try {
        const updates: { [key: string]: any } = {};
        const messageKey = push(ref(rtdb)).key;
        
        const messageData = {
            id: messageKey,
            senderId: adminUser.uid,
            text: newMessage,
            timestamp: serverTimestamp(),
        };

        // 1. Add the new message to the chat
        updates[`/chats/${chatId}/messages/${messageKey}`] = messageData;
        
        // 2. Update last message metadata for both users in their chat lists
        const lastMessageUpdate = {
             lastMessage: newMessage,
             timestamp: serverTimestamp(),
             // you can add unread counts here
        };
        updates[`/userChats/${adminUser.uid}/${participant.id}`] = { ...lastMessageUpdate, withUser: participant };
        updates[`/userChats/${participant.id}/${adminUser.uid}`] = { ...lastMessageUpdate, withUser: { id: adminUser.uid, name: adminUser.displayName || "Admin", email: adminUser.email } };

        await update(ref(rtdb), updates);

        setNewMessage('');
    } catch (error) {
      console.error("Failed to send message: ", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectUser = (user: ChatParticipant) => {
    if (!adminUser) return;
    const newChatId = getChatId(adminUser.uid, user.id);
    setActiveChat({ participant: user, chatId: newChatId });
  };


  if (!isOpen) {
    return null;
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm">
      <Card className="flex h-[60vh] flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center border-b p-4">
          {activeChat && (
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setActiveChat(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle>{activeChat ? activeChat.participant.name : 'Pesan'}</CardTitle>
            <CardDescription>{activeChat ? 'Online' : `${allUsers.length} pengguna reseller`}</CardDescription>
          </div>
        </CardHeader>

        {activeChat ? (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((chat) => (
                    <div key={chat.id} className={`flex items-end gap-2 ${chat.senderId === adminUser?.uid ? 'justify-end' : 'justify-start'}`}>
                       {chat.senderId !== adminUser?.uid && <Avatar className="h-8 w-8"><AvatarImage src={activeChat.participant.avatar || undefined} /><AvatarFallback>{activeChat.participant.name?.charAt(0)}</AvatarFallback></Avatar>}
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
                    placeholder="Cari reseller..."
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
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
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
