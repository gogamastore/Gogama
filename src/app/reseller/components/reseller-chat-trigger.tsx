
"use client";

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

// Nomor WhatsApp Admin (ganti dengan nomor yang benar)
const ADMIN_WHATSAPP_NUMBER = "6281234567890"; // Contoh: 62812...

// Pesan default yang akan dikirim
const DEFAULT_MESSAGE = "Halo Admin, saya ingin bertanya tentang produk.";

export default function ResellerChatTrigger() {

  const handleChatClick = () => {
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleChatClick}
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label="Chat with Admin on WhatsApp"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>
    </div>
  );
}
