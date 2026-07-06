import { createHub } from "@/shared/services/signalr";
import { ChatMessage, SendChatMessageRequestDto } from "../types/chatMessage";
import { chatService } from "./chatService";

const chatHub = createHub({ endpoint: "/chat" });

const sendChatMessage = async (request: SendChatMessageRequestDto): Promise<ChatMessage> => {
  const response = await chatHub.invoke("SendChatMessage", request);
  return chatService.mapChatMessageDtoToChatMessage(response);
}

export const chatHubService = {
  ...chatHub,
  sendChatMessage,
};