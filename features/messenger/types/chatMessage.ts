import { UserSummary } from "@/features/social/types/user";

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: UserSummary;
  content: string;
  sentAt: Date;
  isOwnMessage: boolean;
  isReadByUser: boolean;
  isReadByOthers: boolean;
}

export interface ChatMessagePreview {
  senderUsername: string;
  content: string;
  sentAt: Date;
  isOwnMessage: boolean;
  isRead: boolean;
}

export interface SendChatMessageRequestDto {
  id?: string;
  chatId: string;
  content: string;
  sentAt?: Date;
}