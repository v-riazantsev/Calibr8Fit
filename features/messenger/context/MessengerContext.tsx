import { useProfile } from "@/features/profile/hooks/useProfile";
import * as Crypto from "expo-crypto";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { chatHubService } from "../services/chatHub";
import { chatService } from "../services/chatService";
import { ChatPreview } from "../types/chat";
import { ChatMessage } from "../types/chatMessage";

interface MessengerContextProps {
  isConnected: boolean;

  openChat: (chatId: string) => Promise<void>;
  closeChat: () => void;

  chatPreviews: Record<string, ChatPreview>;
  fetchChatPreviews: () => Promise<ChatPreview[]>;

  currentChatMessages: ChatMessage[];
  fetchChatMessages: (
    chatId: string,
    before?: string,
    size?: number
  ) => Promise<ChatMessage[]>;

  sendChatMessage: (chatId: string, content: string) => Promise<void>;
}

export const MessengerContext = createContext<MessengerContextProps | null>(
  null,
);

export const MessengerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { profileSettings } = useProfile();

  const [isConnected, setIsConnected] = useState(false);
  const [chatPreviews, setChatPreviews] = useState<Record<string, ChatPreview>>({});
  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, ChatMessage[]>>({});

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const currentChatMessages = useMemo(() => {
    if (!activeChatId) return [];
    return messagesByChatId[activeChatId] || [];
  }, [messagesByChatId, activeChatId]);

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
        !message.isOwnMessage && !message.isReadByUser;

      return {
        ...prev,
        [message.chatId]: {
          ...preview,
          lastMessage: {
            senderUsername: message.sender.username,
            content: message.content,
            sentAt: message.sentAt,
            isOwnMessage: message.isOwnMessage,
            isRead: message.isOwnMessage || message.isReadByUser,
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

    const lastMessage = messages[messages.length - 1];
    updatePreviewWithMessage(lastMessage);
  };

  const updateMessageInChat = (chatId: string, updatedMessage: ChatMessage) => {
    setMessagesByChatId(prev => {
      const currentMessages = prev[chatId] || [];
      const updatedMessages = currentMessages.map(msg =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      );

      return {
        ...prev,
        [chatId]: updatedMessages,
      };
    });

    updatePreviewWithMessage(updatedMessage);
  }


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

    if (fetchedMessages.length > 0) {
      // Add the fetched messages to the appropriate chat
      addMessagesToChat(chatId, fetchedMessages);
    }

    return fetchedMessages;
  }

  const openChat = async (chatId: string) => {
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;

    // FIXME: what about already loaded messages? should we fetch them again? 
    const alreadyLoaded = messagesByChatId[chatId]?.length > 0;

    if (!alreadyLoaded) {
      await fetchChatMessages(chatId, undefined, 50);
    }

    setChatPreviews(prev => {
      const preview = prev[chatId];

      if (!preview) return prev;

      return {
        ...prev,
        [chatId]: {
          ...preview,
          unreadMessagesCount: 0,
          lastMessage: preview.lastMessage
            ? {
              ...preview.lastMessage,
              isRead: true,
            }
            : preview.lastMessage,
        },
      };
    });

    // await chatService.markChatAsRead(chatId);
  };

  const closeChat = () => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
  };

  const sendChatMessage = async (chatId: string, content: string) => {
    // Add the message optimistically to the chat
    const optimisticMessage: ChatMessage = {
      id: Crypto.randomUUID(),
      chatId,
      sender: {
        username: profileSettings?.userName || "Unknown",
        firstName: profileSettings?.firstName || "Unknown",
        lastName: profileSettings?.lastName || "Unknown",
      },
      content,
      sentAt: new Date(),
      isOwnMessage: true,
      isReadByUser: true,
      isReadByOthers: false,
    };

    addMessagesToChat(chatId, [optimisticMessage]);

    const message = await chatHubService.sendChatMessage({
      id: optimisticMessage.id,
      chatId,
      content
    });

    // Update the message in the chat with the actual data from the server
    updateMessageInChat(chatId, message);
  }

  // TODO: add new event on first message in chat incoming
  const onMessageIncoming = (message: ChatMessage) => {
    const isActiveChat = activeChatIdRef.current === message.chatId;

    const normalizedMessage: ChatMessage = {
      ...message,
      isReadByUser: isActiveChat || message.isReadByUser,
    };

    addMessagesToChat(normalizedMessage.chatId, [normalizedMessage]);

    if (isActiveChat && !normalizedMessage.isOwnMessage) {
      // await chatService.markChatAsRead(normalizedMessage.chatId);
    }
  };

  // Hook up the SignalR connection and event handlers
  useEffect(() => {
    const handler = (messageDto: any) => {
      const message = chatService.mapChatMessageDtoToChatMessage(messageDto);
      onMessageIncoming(message);
    };

    async function start() {
      await fetchChatPreviews();

      chatHubService.on("MessageIncoming", handler);

      await chatHubService.connect();
      setIsConnected(true);
    }

    start();

    return () => {
      chatHubService.off("MessageIncoming", handler);
      chatHubService.disconnect();
      setIsConnected(false);
    };
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        isConnected,

        openChat,
        closeChat,

        chatPreviews,
        fetchChatPreviews,
        currentChatMessages,
        fetchChatMessages,
        sendChatMessage,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
