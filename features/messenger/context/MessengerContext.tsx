import { createContext, useEffect, useState } from "react";
import { chatHub } from "../services/chatHub";
import { Chat } from "../types/chat";

interface MessengerContextProps {
  // Define any properties or methods you want to provide in the context
}

export const MessengerContext = createContext<MessengerContextProps | null>(
  null,
);

export const MessengerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  //const [directChatMessages, setDirectChatMessages] = useState<DirectChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);

  // Hook up the SignalR connection and event handlers
  useEffect(() => {
    async function start() {
      // Fetch chats
      


      chatHub.on("MessageIncoming", (message: any) => {
        console.log("Received message:", message);
        // Handle the received message (e.g., update state)
      });

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
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
