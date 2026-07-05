import { createContext, useEffect, useState } from "react";
import { chatHub } from "../services/chatHub";
import { chatService } from "../services/chatService";
import { ChatPreview } from "../types/chat";
import { ChatMessage } from "../types/chatMessage";

interface MessengerContextProps {
  isConnected: boolean;
  chatPreviews: Record<string, ChatPreview>;
  fetchChatPreviews: () => Promise<ChatPreview[]>;
  messagesByChatId: Record<string, ChatMessage[]>;
  fetchChatMessages: (chatId: string, before?: string, size?: number) => Promise<ChatMessage[]>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
}

export const MessengerContext = createContext<MessengerContextProps | null>(
  null,
);

export const MessengerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [chatPreviews, setChatPreviews] = useState<Record<string, ChatPreview>>({});
  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, ChatMessage[]>>({});

  const updatePreviewWithMessage = (
    message: ChatMessage
  ) => {
    setChatPreviews(prev => {
      const preview = prev[message.chatId];

      if (!preview) {
        console.warn(`No chat preview found for chatId: ${message.chatId}`);
        return prev;
      }

      const currentLastMessage = preview.lastMessage;

      const isNewer =
        !currentLastMessage ||
        new Date(message.sentAt).getTime() >
        new Date(currentLastMessage.sentAt).getTime();

      if (!isNewer) return prev;

      const shouldIncrementUnread =
        !message.isOwnMessage;

      return {
        ...prev,
        [message.chatId]: {
          ...preview,
          lastMessage: {
            senderUsername: message.sender.username,
            content: message.content,
            sentAt: message.sentAt,
            isOwnMessage: message.isOwnMessage,
            isRead: message.isOwnMessage,
          },
          unreadMessagesCount: preview.unreadMessagesCount + (shouldIncrementUnread ? 1 : 0),
        },
      };
    });
  };

  const mergeMessages = (
    current: ChatMessage[],
    incoming: ChatMessage[]
  ): ChatMessage[] => {
    const byId = new Map<string, ChatMessage>();

    for (const message of current) {
      byId.set(message.id, message);
    }

    for (const message of incoming) {
      byId.set(message.id, message);
    }

    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
  };

  const addMessagesToChat = (chatId: string, messages: ChatMessage[]) => {
    setMessagesByChatId(prev => ({
      ...prev,
      [chatId]: mergeMessages(prev[chatId] || [], messages),
    }));
  };


  const fetchChatPreviews = async (): Promise<ChatPreview[]> => {
    const fetchedChatsPreviews = await chatService.fetchChatPreviews();

    // Update the chat preview state
    setChatPreviews(fetchedChatsPreviews.reduce<Record<string, ChatPreview>>((acc, chat) => {
      acc[chat.id] = chat;
      return acc;
    }, {}));

    return fetchedChatsPreviews;
  }

  const fetchChatMessages = async (chatId: string, before?: string, size: number = 50): Promise<ChatMessage[]> => {
    const fetchedMessages = await chatService.fetchChatMessages(chatId, before, size);

    // Add the fetched messages to the appropriate chat
    addMessagesToChat(chatId, fetchedMessages);

    // Update the last message for the chat preview
    if (fetchedMessages.length > 0) {
      const lastMessage = fetchedMessages[fetchedMessages.length - 1];
      updatePreviewWithMessage(lastMessage);
    }

    return fetchedMessages;
  }

  const sendMessage = async (chatId: string, content: string) => {
    // Implement the logic to send a message via the chatHub
    //await chatHub.sendMessage(chatId, content);
  }

  // TODO: add new event on first message in chat incoming
  const onMessageIncoming = (message: ChatMessage) => {
    // Add the incoming message to the appropriate chat
    addMessagesToChat(message.chatId, [message]);

    // Update the last message for the chat preview
    updatePreviewWithMessage(message);
  }

  // Hook up the SignalR connection and event handlers
  useEffect(() => {
    async function start() {
      // Fetch chats
      await fetchChatPreviews();


      chatHub.on("MessageIncoming", (message: any) =>
        onMessageIncoming(chatService.mapChatMessageDtoToChatMessage(message)));

      await chatHub.connect();
      setIsConnected(true);
    }

    start();

    return () => {
      //chatHub.off("MessageIncoming", () => {});
      chatHub.disconnect();
      setIsConnected(false);
    };
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        isConnected,
        chatPreviews,
        fetchChatPreviews,
        messagesByChatId,
        fetchChatMessages,
        sendMessage
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
