import { ChatMessagePreview } from "./chatMessage";

export interface ChatPreview {
  id: string;
  displayName: string;
  isGroupChat: boolean;
  avatarUrl?: string;
  createdAt: Date;
  memberCount: number;
  lastMessage?: ChatMessagePreview;
  lastReadMessageId?: string;
  unreadMessagesCount: number;
}
