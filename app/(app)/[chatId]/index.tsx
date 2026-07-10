import ChatMessageBubble from "@/features/messenger/components/ChatMessageBubble";
import { useMessenger } from "@/features/messenger/hooks/useMessegner";
import AppText from "@/shared/components/AppText";
import IconButton from "@/shared/components/IconButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function Chat() {
  const theme = useTheme();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const [input, setInput] = useState("");

  const {
    currentChatMessages,
    openChat,
    closeChat,
    fetchChatMessages,
    sendChatMessage,
    currentChatPreview
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

  const handleSendMessage = useCallback(async (content: string) => {
    if (!chatId) return;

    setInput("");

    await sendChatMessage(chatId, content);
  }, [chatId, sendChatMessage]);

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

  const handleChatInfoPress = () => {
    if (!chatId) return;

    if (!currentChatPreview?.isGroupChat)
      router.push(`../(tabs)/profile/${currentChatPreview?.directMember?.username}`);
    else
      router.push(`/messenger/chat/${chatId}/info`);
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: theme.surface }}
    >
      <TouchableOpacity
        style={[styles.headerRow, { borderColor: theme.outline }]}
        onPress={handleChatInfoPress}
      >
        <IconButton
          icon={{
            name: "arrow-back",
            library: "MaterialIcons",
            size: 32,
          }}
          variant="icon"
          onPress={router.back}
        />
        <Image
          source={{ uri: currentChatPreview?.avatarUrl }}
          placeholder={require("@/assets/images/avatar-placeholder.png")}
          style={styles.avatar}
        />
        <AppText type="title-large">
          {currentChatPreview?.displayName}
        </AppText>
      </TouchableOpacity>
      <FlatList
        inverted
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        data={invertedMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessageBubble
            message={item}
            lastReadByOthersMessageSentAt={currentChatPreview?.lastReadByOtherMembersMessageSentAt}
            displaySenderName={currentChatPreview?.isGroupChat && !item.isOwnMessage}
          />
        )}
        onEndReached={loadOlderMessages}
        refreshing={loadingOlder}
      />
      <View
        style={styles.inputRow}
      >
        <TextInput
          placeholder="Type a message..."
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />
        <IconButton
          icon={{
            name: "send",
            library: "MaterialIcons",
            size: 24,
          }}
          onPress={() => handleSendMessage(input)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 4,
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
  headerRow: {
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 8,
  },
});