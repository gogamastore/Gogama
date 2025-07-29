// Definisikan tipe data untuk sebuah pesan chat
export interface ChatMessage {
  id?: string;         // ID unik pesan (opsional, dari Firebase key)
  senderId: string;   // UID pengirim
  text: string;       // Isi pesan
  timestamp: any;     // Timestamp dari Firebase (bisa berupa objek ServerValue)
}

// Tipe data untuk daftar percakapan pengguna
export interface UserChat {
    lastMessage: string;
    timestamp: number;
    withUser: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    }
    unreadCount?: number;
}

// Definisikan tipe data untuk item di daftar percakapan admin (legacy, bisa dihapus nanti)
export interface ChatListItem {
  chatId: string;     // ID unik chat
  buyerName: string;  // Nama pembeli
  avatar?: string;    // URL Avatar pembeli
  lastMessage: string;
  timestamp: number;
  unreadByAdmin?: number; // Jumlah pesan yang belum dibaca admin
}
