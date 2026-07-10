import { api } from "@/shared/services/api";
import { ChatPreview } from "../types/chat";
import { ChatMessage } from "../types/chatMessage";

const mapChatMessageDtoToChatMessage = (dto: any): ChatMessage => ({
  ...dto,
  sender: {
    ...dto.sender,
    username: dto.sender.userName,
  },
  sentAt: new Date(dto.sentAt),
});

const mapChatPreviewDtoToChatPreview = (dto: any): ChatPreview => ({
  ...dto,
  createdAt: new Date(dto.createdAt),
  lastReadByUserMessageSentAt:
    dto.lastReadByUserMessageSentAt ? new Date(dto.lastReadByUserMessageSentAt) : undefined,
  lastReadByOtherMembersMessageSentAt:
    dto.lastReadByOtherMembersMessageSentAt ? new Date(dto.lastReadByOtherMembersMessageSentAt) : undefined,

  lastMessage: dto.lastMessage
    ? ({
      ...dto.lastMessage,
      sentAt: new Date(dto.lastMessage.sentAt),
    }) as ChatMessage
    : undefined,

  directMember: dto.directMember
    ? ({
      ...dto.directMember,
      username: dto.directMember.userName,
    })
    : undefined,
});

const fetchChatPreviews = async (): Promise<ChatPreview[]> => {
  const response = await api.request({
    endpoint: "/chat",
    method: "GET",
  });

  console.log("/chat response:", response);

  return response.map((dto: any) => mapChatPreviewDtoToChatPreview(dto));
}

const fetchChatMessages = async (
  chatId: string,
  before?: string,
  size: number = 100,
): Promise<ChatMessage[]> => {
  const query = new URLSearchParams({
    chatId,
    size: size.toString(),
  });

  if (before) {
    query.append("before", before);
  }

  const response = await api.request({
    endpoint: `/chat/messages?${query.toString()}`,
    method: "GET",
  });

  console.log(`/chat/messages?${query.toString()}, response:`, response.length);

  return response.map((dto: any) => mapChatMessageDtoToChatMessage(dto));
}

export const chatService = {
  fetchChatPreviews,
  mapChatMessageDtoToChatMessage,
  //fetchDirectChatMessages,
  fetchChatMessages,
};
