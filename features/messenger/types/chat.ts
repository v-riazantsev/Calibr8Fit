import { UserSummary } from "@/features/social";
import { ChatMessage } from "./chatMessage";

export interface ChatPreview {
  id: string;
  displayName: string;
  isGroupChat: boolean;
  avatarUrl?: string;
  createdAt: Date;
  memberCount: number;
  lastMessage?: ChatMessage;

  directMember?: UserSummary;
  typingUsers: string[];

  lastReadByUserMessageSentAt?: Date;
  lastReadByOtherMembersMessageSentAt?: Date;
  unreadMessagesCount: number;
}

export interface ChatReadDto {
  chatId: string;
  fromMessageSentAt: string;
}