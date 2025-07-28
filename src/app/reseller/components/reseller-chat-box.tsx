
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off, update } from "firebase/database";
import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/ai/flows/send-chat-message';

interface Message {
    sender: string; // 'admin' or 'user'
    text: string;
    timestamp: any;
}

export default function ResellerChatBox({ isOpen }: { isOpen: boolean; }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
        const messagesRef = ref(rtdb, `chats/${user.uid}/messages`);
        const listener = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            setMessages(data ? Object.values(data) : []);
        });

        // Mark messages as read
        update(ref(rtdb, `conversations/${user.uid}`), {
          unreadByUser: 0
        });

        return () => off(messagesRef, 'value', listener);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      sender: 'user',
      text: newMessage,
    };
    
    await sendChatMessage({ conversationId: user.uid, message: messageData });
    setNewMessage('');
  };

  if (!isOpen) {
    return null;
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
                <div key={index} className={`flex items-end gap-2 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {chat.sender === 'admin' && <Avatar className="h-8 w-8"><AvatarImage src="/logo.svg" /><AvatarFallback>A</AvatarFallback></Avatar>}
                    <div className={`max-w-[75%] rounded-lg p-3 ${chat.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{chat.text}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
            <Input placeholder="Ketik pesan..." className="pr-12" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            <Button type="submit" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2">
                <Send className="h-5 w-5" />
            </Button>
            </form>
        </div>
      </Card>
    </div>
  );
}
