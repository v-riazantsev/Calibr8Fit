import { UserSummary } from "@/features/social/types/user";
import IconButton from "@/shared/components/IconButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { Typography } from "@/styles/typography";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import AppText from "./AppText";
import PaginatedFlatList from "./PaginatedFlatList";

type LoadPage = (
  query: string,
  page: number,
  pageSize: number,
) => Promise<UserSummary[]>;

type Props = {
  loadPage: LoadPage;
  onUserPress?: (username: string) => void;
  onChatPress?: (username: string) => void;
};

export default function UserSearchScreen({ loadPage, onUserPress, onChatPress }: Props) {
  const theme = useTheme();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const { debounced: onDebouncedQueryChange } = useDebouncedCallback(
    (text: string) => {
      setQuery(text);
    },
    350,
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setInput(text);
      onDebouncedQueryChange(text);
    },
    [onDebouncedQueryChange],
  );

  const handleLoadPage = useCallback(
    (page: number, pageSize: number) => loadPage(query, page, pageSize),
    [loadPage, query],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.searchRow}>
        <IconButton
          icon={{
            name: "arrow-back",
            library: "MaterialIcons",
            size: 32,
          }}
          variant="icon"
          onPress={() => router.back()}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor={theme.onSurfaceVariant}
          value={input}
          onChangeText={handleTextChange}
          style={[Typography["title-medium"], styles.searchInput]}
        />
        {input !== "" && (
          <IconButton
            icon={{
              name: "close",
              library: "MaterialIcons",
              size: 24,
            }}
            variant="icon"
            onPress={() => {
              setInput("");
              setQuery("");
            }}
          />
        )}
      </View>
      <PaginatedFlatList
        loadPage={handleLoadPage}
        args={query}
        pageSize={15}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.flex1}
              onPress={() => onUserPress?.(item.username)}
            >
              <View style={styles.row}>
                <Image
                  style={styles.avatar}
                  source={item.profilePictureUrl}
                  placeholder={require("@/assets/images/avatar-placeholder.png")}
                />
                <View style={styles.userInfo}>
                  <AppText type="title-large">{`${item.firstName} ${item.lastName}`}</AppText>
                  <AppText type="title-medium">{`@${item.username}`}</AppText>
                </View>
              </View>
            </TouchableOpacity>
            <IconButton
              icon={{
                name: "chat-bubble-outline",
                library: "MaterialIcons",
                size: 48,
              }}
              variant="icon"
              onPress={() => onChatPress?.(item.username)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
  flex1: {
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
});
