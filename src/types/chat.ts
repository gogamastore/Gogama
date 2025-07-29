// Definisikan tipe data untuk sebuah pesan chat
export interface ChatMessage {
  id?: string;         // ID unik pesan (opsional, dari Firebase key)
  senderId: string;   // UID pengirim
  text: string;       // Isi pesan
  timestamp: any;     // Timestamp dari Firebase (bisa berupa objek ServerValue)
}

// Definisikan tipe data untuk metadata sebuah sesi chat
export interface ChatMetadata {
  buyerId: string;    // UID pembeli
  adminId: string;    // UID admin yang merespon (bisa 'not_assigned')
  lastMessage: string;
  timestamp: number;
}

// Definisikan tipe data untuk item di daftar percakapan admin
export interface ChatListItem {
  chatId: string;     // ID unik chat
  buyerName: string;  // Nama pembeli
  avatar?: string;    // URL Avatar pembeli
  lastMessage: string;
  timestamp: number;
  unreadByAdmin?: number; // Jumlah pesan yang belum dibaca admin
}
