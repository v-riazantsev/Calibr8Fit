import ChatCard from "@/features/messenger/components/ChatCard";
import { useMessenger } from "@/features/messenger/hooks/useMessegner";
import { useTheme } from "@/shared/hooks/useTheme";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

export default function ChatList() {
  const theme = useTheme();
  const { chatPreviews, fetchChatPreviews: fetchChats, messagesByChatId, fetchChatMessages, sendMessage } = useMessenger();

  const [refreshing, setRefreshing] = useState(false);

  const handleLoadPage = useCallback(
    (page: number, pageSize: number) => fetchChats(),
    [fetchChats]
  );

  const sortedChatPreviews = useMemo(() => {
    return Object.values(chatPreviews).sort((a, b) => {
      const aLastMessageTime = new Date(a.lastMessage?.sentAt ?? 0).getTime();
      const bLastMessageTime = new Date(b.lastMessage?.sentAt ?? 0).getTime();

      return bLastMessageTime - aLastMessageTime;
    });
  }, [chatPreviews]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, [fetchChats]);

  const handleChatCardPress = useCallback((chatId: string) => {
    router.push(`/messenger/${chatId}`);
  }, []);

  return (
    <FlatList
      contentContainerStyle={[styles.container, { backgroundColor: theme.surface }]}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      data={sortedChatPreviews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatCard
          chatPreview={item}
          onPress={handleChatCardPress}
        />
      )}
    />
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    padding: 16,
  },
});
