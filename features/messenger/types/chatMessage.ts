import { UserSummary } from "@/features/social/types/user";

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: UserSummary;
  content: string;
  sentAt: Date;
  isOwnMessage: boolean;
}

export interface SendChatMessageRequestDto {
  id?: string;
  chatId: string;
  content: string;
  sentAt?: Date;
}