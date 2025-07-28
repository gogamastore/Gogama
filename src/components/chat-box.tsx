
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Send } from 'lucide-react';

// Placeholder data
const conversations = [
  { id: 'user1', name: 'Budi Santoso', lastMessage: 'Apakah produk ini masih ada?', unread: 2, avatar: 'https://placehold.co/40x40.png' },
  { id: 'user2', name: 'Citra Lestari', lastMessage: 'Baik, saya akan transfer sekarang.', unread: 0, avatar: 'https://placehold.co/40x40.png' },
  { id: 'user3', name: 'Dewi Anggraini', lastMessage: 'Terima kasih atas bantuannya.', unread: 0, avatar: 'https://placehold.co/40x40.png' },
];

const chatHistory = [
    { sender: 'other', message: 'Halo, apakah produk Kemeja Batik Modern masih tersedia untuk ukuran L?' },
    { sender: 'me', message: 'Halo! Tentu, produknya masih tersedia. Silakan dipesan.' },
    { sender: 'other', message: 'Warnanya hanya ada satu ya?' },
    { sender: 'me', message: 'Betul, untuk model ini hanya tersedia satu warna sesuai gambar.' },
    { sender: 'other', message: 'Baik, terima kasih infonya. Saya pesan satu ya.' },
]


export default function ChatBox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) {
    return null;
  }

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <CardTitle>{activeChat ? conversations.find(c => c.id === activeChat)?.name : 'Pesan'}</CardTitle>
            <CardDescription>{activeChat ? 'Online' : 'Daftar percakapan Anda'}</CardDescription>
          </div>
        </CardHeader>

        {/* Conditional rendering based on activeChat */}
        {activeChat ? (
          // Chat View
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex items-end gap-2 ${chat.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                       {chat.sender === 'other' && <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/40x40.png" /><AvatarFallback>B</AvatarFallback></Avatar>}
                       <div className={`max-w-[75%] rounded-lg p-3 ${chat.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           <p className="text-sm">{chat.message}</p>
                       </div>
                    </div>
                ))}
            </CardContent>
            <div className="border-t p-4">
              <div className="relative">
                <Input placeholder="Ketik pesan..." className="pr-12" />
                <Button variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Conversation List View
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
              <div className="divide-y">
                {filteredConversations.map(convo => (
                  <div
                    key={convo.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                    onClick={() => setActiveChat(convo.id)}
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
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
