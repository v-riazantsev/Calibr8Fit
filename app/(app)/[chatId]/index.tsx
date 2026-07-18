import ChatMessageBubble from "@/features/messenger/components/ChatMessageBubble";
import { useMessenger } from "@/features/messenger/hooks/useMessegner";
import AppText from "@/shared/components/AppText";
import IconButton from "@/shared/components/IconButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const PAGE_SIZE = 50;

export default function Chat() {
  const theme = useTheme();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const [input, setInput] = useState("");
  const inputRef = useRef("");

  const {
    currentChatMessages,
    openChat,
    closeChat,
    fetchChatMessages,
    sendChatMessage,
    currentChatPreview,
  } = useMessenger();

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    setHasMoreOlder(true);
    openChat(chatId);

    return closeChat;
  }, [chatId, openChat, closeChat]);

  const handleInputChange = useCallback((text: string) => {
    inputRef.current = text;
    setInput(text);
  }, []);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputRef.current.trim();

    if (!trimmed || !chatId) return;

    inputRef.current = "";
    setInput("");

    await sendChatMessage(chatId, trimmed);
  }, [chatId, sendChatMessage]);

  const loadOlderMessages = useCallback(async () => {
    if (
      !chatId ||
      loadingOlder ||
      !hasMoreOlder ||
      currentChatMessages.length === 0
    ) {
      return;
    }

    const oldestMessage = currentChatMessages[0];

    setLoadingOlder(true);

    try {
      const olderMessages = await fetchChatMessages(
        chatId,
        oldestMessage.id,
        PAGE_SIZE
      );

      if (olderMessages.length < PAGE_SIZE) {
        setHasMoreOlder(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [
    chatId,
    loadingOlder,
    hasMoreOlder,
    currentChatMessages,
    fetchChatMessages,
  ]);

  const handleChatInfoPress = useCallback(() => {
    if (!chatId) return;

    if (!currentChatPreview?.isGroupChat) {
      const username = currentChatPreview?.directMember?.username;

      if (username) {
        router.push(`../(tabs)/profile/${username}`);
      }

      return;
    }

    router.push(`/messenger/chat/${chatId}/info`);
  }, [chatId, currentChatPreview]);

  const invertedMessages = useMemo(
    () => [...currentChatMessages].reverse(),
    [currentChatMessages]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof currentChatMessages)[number] }) => (
      <ChatMessageBubble
        message={item}
        lastReadByOthersMessageSentAt={
          currentChatPreview?.lastReadByOtherMembersMessageSentAt
        }
        displaySenderName={
          currentChatPreview?.isGroupChat && !item.isOwnMessage
        }
      />
    ),
    [
      currentChatPreview?.lastReadByOtherMembersMessageSentAt,
      currentChatPreview?.isGroupChat,
    ]
  );

  const backButton = useCallback(() => {
    router.back();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[
        styles.screen,
        { backgroundColor: theme.surface },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.headerRow,
          { borderColor: theme.outline },
        ]}
        onPress={handleChatInfoPress}
      >
        <IconButton
          icon={BACK_ICON}
          variant="icon"
          onPress={backButton}
        />

        <Image
          source={{
            uri: currentChatPreview?.avatarUrl,
          }}
          placeholder={require("@/assets/images/avatar-placeholder.png")}
          style={styles.avatar}
        />

        <AppText type="title-large">
          {currentChatPreview?.displayName}
        </AppText>
      </TouchableOpacity>

      <FlatList
        inverted
        style={styles.list}
        contentContainerStyle={styles.container}
        data={invertedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={loadOlderMessages}
        onEndReachedThreshold={0.2}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        ListFooterComponent={
          loadingOlder ? <View style={styles.loader} /> : null
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type a message..."
          style={[
            styles.input,
            { color: theme.onSurface },
          ]}
          value={input}
          onChangeText={handleInputChange}
        />

        <IconButton
          icon={SEND_ICON}
          onPress={handleSendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const BACK_ICON = {
  name: "arrow-back",
  library: "MaterialIcons",
  size: 32,
} as const;

const SEND_ICON = {
  name: "send",
  library: "MaterialIcons",
  size: 24,
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  list: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 4,
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
    paddingHorizontal: 8,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 8,
  },

  loader: {
    height: 20,
  },
});