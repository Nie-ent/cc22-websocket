// ============================================================
// types/index.ts — รวม TypeScript types ทั้งหมดไว้ที่เดียว
// เวลาแก้ type ไม่ต้องงมหาในหลาย file
// ============================================================

export interface Sender {
  id: number;
  username: string;
}

export interface Message {
  id: number | string; // string สำหรับ optimistic temp id
  content: string;
  createdAt: string;
  roomId: number;
  sender: Sender;
  isOptimistic?: boolean; // true = รอ server confirm อยู่
}

export interface Room {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  username: string;
}
