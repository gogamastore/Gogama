
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ChatBox from '@/components/chat-box';
import { MessageSquare, X } from 'lucide-react';

export default function ChatTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
        </Button>
      </div>
      <ChatBox isOpen={isOpen} />
    </>
  );
}
