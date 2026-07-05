import { api } from "@/shared/services/api";
import { ChatPreview } from "../types/chat";
import { ChatMessage, ChatMessagePreview } from "../types/chatMessage";

const mapChatMessageDtoToChatMessage = (dto: any): any => ({
  ...dto,
  // sender: {
  //   ...dto.sender
  // },
  sentAt: new Date(dto.sentAt),
});

const fetchChatPreviews = async (): Promise<ChatPreview[]> => {
  const response = await api.request({
    endpoint: "/chat",
    method: "GET",
  });

  return response.map((dto: any) => ({
    ...dto,
    createdAt: new Date(dto.createdAt),

    lastMessage: dto.lastMessage
      ? ({
        ...dto.lastMessage,
        sentAt: new Date(dto.lastMessage.sentAt),
      }) as ChatMessagePreview
      : undefined,
  })) as ChatPreview[];
}

// const fetchDirectChatMessages = async (
//   username: string,
//   before: string,
//   size: number = 100,
// ): Promise<ChatMessage[]> => {
//   const response = await api.request({
//     endpoint: `/chat/direct/${encodeURIComponent(username)}?before=${encodeURIComponent(before)}&size=${size}`,
//     method: "GET",
//   });

//   return response.map((dto: any) => mapChatMessageDtoToChatMessage(dto));
// }

const fetchChatMessages = async (
  chatId: string,
  before?: string,
  size: number = 100,
): Promise<ChatMessage[]> => {
  const response = await api.request({
    endpoint: `/chat/messages?${encodeURIComponent(chatId)}${before ? `&before=${encodeURIComponent(before)}` : ''}&size=${size}`,
    method: "GET",
  });

  return response.map((dto: any) => mapChatMessageDtoToChatMessage(dto));
}

export const chatService = {
  fetchChatPreviews,
  mapChatMessageDtoToChatMessage,
  //fetchDirectChatMessages,
  fetchChatMessages,
};
