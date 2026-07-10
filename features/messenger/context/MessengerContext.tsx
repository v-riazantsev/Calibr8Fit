import { useProfile } from "@/features/profile/hooks/useProfile";
import * as Crypto from "expo-crypto";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { chatHubService } from "../services/chatHub";
import { chatService } from "../services/chatService";
import { ChatPreview, ChatReadDto } from "../types/chat";
import { ChatMessage } from "../types/chatMessage";

interface MessengerContextProps {
  isConnected: boolean;

  getDirectChat: (username: string) => Promise<ChatPreview | undefined>;
  openChat: (chatId: string) => Promise<void>;
  closeChat: () => void;

  chatPreviews: Record<string, ChatPreview>;
  fetchChatPreviews: () => Promise<ChatPreview[]>;

  currentChatMessages: ChatMessage[];
  currentChatPreview: ChatPreview | undefined;
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

  const currentChatPreview = useMemo(() => {
    if (!activeChatId) return undefined;
    return chatPreviews[activeChatId];
  }, [chatPreviews, activeChatId]);

  const updateChatPreviewLastMessage = (message: ChatMessage) => {
    setChatPreviews(prev => {
      const preview = prev[message.chatId];

      if (!preview) return prev;

      const currentLastMessage = preview.lastMessage;

      const isNewer =
        !currentLastMessage ||
        new Date(message.sentAt).getTime() >
        new Date(currentLastMessage.sentAt).getTime();

      if (!isNewer) return prev;

      return {
        ...prev,
        [message.chatId]: {
          ...preview,
          lastMessage: message,
        },
      };
    });
  }

  const updateLastReadByUserMessageSentAt = (chatId: string, sentAt: Date) => {
    setChatPreviews(prev => {
      const preview = prev[chatId];

      if (!preview) return prev;

      return {
        ...prev,
        [chatId]: {
          ...preview,
          lastReadByUserMessageSentAt: sentAt,
        },
      };
    });
  }

  const updateLastReadByOtherMembersMessageSentAt = (chatId: string, sentAt: Date) => {
    setChatPreviews(prev => {
      const preview = prev[chatId];

      if (!preview) return prev;

      return {
        ...prev,
        [chatId]: {
          ...preview,
          lastReadByOtherMembersMessageSentAt: sentAt,
        },
      };
    });
  }

  // Keep preview's last message in sync with the messagesByChatId state
  useEffect(() => {
    for (const [chatId, messages] of Object.entries(messagesByChatId)) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage) {
        updateChatPreviewLastMessage(lastMessage);
      }
    }
  }, [messagesByChatId]);

  const fetchChatPreviews = async (): Promise<ChatPreview[]> => {
    const fetchedChatsPreviews = await chatService.fetchChatPreviews();

    setChatPreviews(
      fetchedChatsPreviews.reduce<Record<string, ChatPreview>>((acc, chat) => {
        acc[chat.id] = chat;
        return acc;
      }, {})
    );

    return fetchedChatsPreviews;
  };

  const getDirectChat = async (username: string): Promise<ChatPreview | undefined> => {
    let directChat = Object.values(chatPreviews).find(chat => chat.directMember?.username === username);
    if (!directChat) {
      directChat = await chatService.getDirectChat(username);

      setChatPreviews(prev => {
        if (!directChat) return prev;

        return {
          ...prev,
          [directChat.id]: directChat,
        };
      });
    }

    return directChat;
  };

  const updateUnreadCount = (chatId: string, change: number) => {
    setChatPreviews(prev => {
      const preview = prev[chatId];

      if (!preview) return prev;

      return {
        ...prev,
        [chatId]: {
          ...preview,
          unreadMessagesCount: Math.max(0, preview.unreadMessagesCount + change),
        },
      };
    });
  };

  const markPreviewAsRead = (chatId: string) => {
    setChatPreviews(prev => {
      const preview = prev[chatId];

      if (!preview) return prev;

      return {
        ...prev,
        [chatId]: {
          ...preview,
          unreadMessagesCount: 0,
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

  const updateMessageInChat = (updatedMessage: ChatMessage) => {
    setMessagesByChatId(prev => {
      const currentMessages = prev[updatedMessage.chatId] || [];

      return {
        ...prev,
        [updatedMessage.chatId]: currentMessages.map(msg =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        ),
      };
    });
  };

  const fetchChatMessages = async (chatId: string, before?: string, size: number = 50): Promise<ChatMessage[]> => {
    const fetchedMessages = await chatService.fetchChatMessages(chatId, before, size);

    if (fetchedMessages.length > 0) {
      // Add the fetched messages to the appropriate chat
      addMessagesToChat(chatId, fetchedMessages);
    }

    return fetchedMessages;
  }

  const readChat = async (
    chatId: string,
    fromMessage: ChatMessage
  ): Promise<ChatReadDto | undefined> => {
    if (fromMessage.isOwnMessage || fromMessage.sentAt <= (chatPreviews[chatId]?.lastReadByUserMessageSentAt || new Date(0)))
      return undefined;

    let chatReadDto: ChatReadDto;
    try {
      chatReadDto = await chatHubService.readMessages(fromMessage.id);
    } catch (error) {
      console.error("Error reading messages with id:", fromMessage.id, error);
      return undefined;
    }

    updateLastReadByUserMessageSentAt(chatId, new Date(chatReadDto.fromMessageSentAt));
    markPreviewAsRead(chatId);
  };

  // TODO: add new event on first message in chat incoming
  const onMessageIncoming = async (message: ChatMessage) => {
    const isActiveChat = activeChatIdRef.current === message.chatId;

    addMessagesToChat(message.chatId, [message]);

    if (isActiveChat && !message.isOwnMessage) {
      await readChat(message.chatId, message);
      return;
    }

    if (!message.isOwnMessage) {
      updateUnreadCount(message.chatId, 1);
    }
  };

  const onMessageReadByOthers = (dto: any) => {
    updateLastReadByOtherMembersMessageSentAt(dto.chatId, new Date(dto.fromMessageSentAt));
  };

  const getLatestIncomingMessage = (
    messages: ChatMessage[]
  ): ChatMessage | undefined => {
    return [...messages]
      .reverse()
      .find(message => !message.isOwnMessage);
  };


  const openChat = async (chatId: string) => {
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;

    const alreadyLoadedMessages = messagesByChatId[chatId] || [];

    let messages = alreadyLoadedMessages;

    if (messages.length === 0) {
      messages = await fetchChatMessages(chatId, undefined, 50);
    }

    const latestIncomingMessage = getLatestIncomingMessage(messages);

    if (!latestIncomingMessage) {
      return;
    }

    await readChat(chatId, latestIncomingMessage);
  };

  const closeChat = () => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
  };

  const sendChatMessage = async (chatId: string, content: string) => {
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
      isOwnMessage: true
    };

    addMessagesToChat(chatId, [optimisticMessage]);
    updateChatPreviewLastMessage(optimisticMessage);

    const message = await chatHubService.sendChatMessage({
      id: optimisticMessage.id,
      chatId,
      content,
    });

    updateMessageInChat(message);
    updateChatPreviewLastMessage(message);
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
      chatHubService.on("MessagesRead", onMessageReadByOthers);

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
        currentChatPreview,
        getDirectChat,
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
