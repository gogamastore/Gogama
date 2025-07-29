
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Send, Loader2 } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off, update, serverTimestamp, push } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';

interface ConversationMetadata {
    chatId: string;
    buyerId: string;
    buyerName: string;
    lastMessage: string;
    timestamp: any;
    avatar?: string;
    unreadByAdmin?: number;
    adminId?: string;
}

interface Message {
    senderId: string;
    text: string;
    timestamp: any;
}

export default function ChatBox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: adminUser } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allConversations, setAllConversations] = useState<ConversationMetadata[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminUser || !isOpen) return;

    setLoading(true);
    const conversationsRef = ref(rtdb, 'conversations');

    const listener = onValue(conversationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const conversationsData = snapshot.val();
            const conversationList: ConversationMetadata[] = Object.keys(conversationsData).map(buyerId => {
                const convo = conversationsData[buyerId];
                return {
                    buyerId: buyerId,
                    ...convo
                };
            }).sort((a, b) => b.timestamp - a.timestamp);
            setAllConversations(conversationList);
        } else {
            setAllConversations([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching conversations:", error);
        setAllConversations([]);
        setLoading(false);
    });

    return () => off(conversationsRef, 'value', listener);
  }, [adminUser, isOpen]);
  
   useEffect(() => {
    if (activeChatId) {
      const messagesRef = ref(rtdb, `chats/${activeChatId}/messages`);
      const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages = data ? Object.values(data) as Message[] : [];
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
      }, (error) => {
        console.error("Failed to fetch messages for active chat:", error);
        setMessages([]);
      });
      
      const activeConversation = allConversations.find(c => c.chatId === activeChatId);
      if (activeConversation?.unreadByAdmin && activeConversation.unreadByAdmin > 0) {
        const conversationRef = ref(rtdb, `conversations/${activeConversation.buyerId}`);
        update(conversationRef, { unreadByAdmin: 0 });
      }

      return () => off(messagesRef, 'value', listener);
    } else {
        setMessages([]);
    }
  }, [activeChatId, allConversations]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatId || !adminUser) return;
    setIsSending(true);

    const activeConversation = allConversations.find(c => c.chatId === activeChatId);
    if (!activeConversation) {
        setIsSending(false);
        return;
    }
    
    try {
        const updates: { [key: string]: any } = {};
        
        const messageKey = push(ref(rtdb)).key;
        
        updates[`/chats/${activeChatId}/messages/${messageKey}`] = {
            senderId: adminUser.uid,
            text: newMessage,
            timestamp: serverTimestamp(),
        };

        updates[`/chats/${activeChatId}/metadata/lastMessage`] = newMessage;
        updates[`/chats/${activeChatId}/metadata/timestamp`] = serverTimestamp();
        updates[`/chats/${activeChatId}/metadata/adminId`] = adminUser.uid;

        updates[`/conversations/${activeConversation.buyerId}/lastMessage`] = newMessage;
        updates[`/conversations/${activeConversation.buyerId}/timestamp`] = serverTimestamp();

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

  const filteredConversations = allConversations.filter(c =>
    c.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeChat = allConversations.find(c => c.chatId === activeChatId);

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
            <CardTitle>{activeChatId ? activeChat?.buyerName : 'Pesan'}</CardTitle>
            <CardDescription>{activeChatId ? 'Online' : `${allConversations.length} percakapan`}</CardDescription>
          </div>
        </CardHeader>

        {activeChatId ? (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((chat, index) => (
                    <div key={index} className={`flex items-end gap-2 ${chat.senderId === adminUser?.uid ? 'justify-end' : 'justify-start'}`}>
                       {chat.senderId !== adminUser?.uid && <Avatar className="h-8 w-8"><AvatarImage src={activeChat?.avatar || undefined} /><AvatarFallback>{activeChat?.buyerName?.charAt(0)}</AvatarFallback></Avatar>}
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
                  {filteredConversations.map(convo => (
                    <div
                      key={convo.chatId}
                      className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectChat(convo.chatId)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={convo.avatar} alt={convo.buyerName} />
                        <AvatarFallback>{convo.buyerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{convo.buyerName}</p>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                      {convo.unreadByAdmin && convo.unreadByAdmin > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {convo.unreadByAdmin}
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
