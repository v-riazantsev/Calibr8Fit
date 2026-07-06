import { useMessenger } from "@/features/messenger/hooks/useMessegner";
import IconButton from "@/shared/components/IconButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function Chat() {
  const theme = useTheme();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const {
    currentChatMessages,
    openChat,
    closeChat,
    fetchChatMessages,
    sendChatMessage
  } = useMessenger();

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    setHasMoreOlder(true);
    openChat(chatId);

    return () => {
      closeChat();
    };
  }, [chatId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!chatId) return;

      await sendChatMessage(chatId, content);
    },
    [chatId, sendChatMessage]
  );

  const invertedMessages = useMemo(() => {
    return [...currentChatMessages].reverse();
  }, [currentChatMessages]);

  const loadOlderMessages = async () => {
    if (!chatId || loadingOlder || !hasMoreOlder) return;

    const oldestMessage = currentChatMessages[0];

    if (!oldestMessage) return;

    setLoadingOlder(true);

    try {
      const olderMessages = await fetchChatMessages(
        chatId,
        oldestMessage.id,
        50
      );

      if (olderMessages.length < 50) {
        setHasMoreOlder(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <FlatList
        inverted
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        data={invertedMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={{ color: theme.onSurface }}>{item.content}</Text>
          </View>
        )}
        onEndReached={loadOlderMessages}
        refreshing={loadingOlder}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type a message..."
          style={styles.input}
        />
        <IconButton
          icon={{
            name: "send",
            library: "MaterialIcons",
            size: 24,
          }}
          onPress={() => handleSendMessage("Hello!")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 8,
  },
  messageBubble: {
    padding: 8,
  },
  loader: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 8,
  },
});