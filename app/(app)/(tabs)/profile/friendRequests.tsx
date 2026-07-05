import { useFriends } from "@/features/social";
import AppText from "@/shared/components/AppText";
import Header from "@/shared/components/Header";
import TextButton from "@/shared/components/TextButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { Image } from "expo-image";
import { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function FriendRequestsScreen() {
  const theme = useTheme();

  const { pendingFriendRequests, acceptFriendRequest, rejectFriendRequest } =
    useFriends();

  const handleAccept = useCallback(
    async (username: string) => {
      try {
        await acceptFriendRequest(username);
      } catch (error) {
        console.error("Failed to accept friend request:", error);
      }
    },
    [acceptFriendRequest],
  );

  const handleReject = useCallback(
    async (username: string) => {
      try {
        await rejectFriendRequest(username);
      } catch (error) {
        console.error("Failed to reject friend request:", error);
      }
    },
    [rejectFriendRequest],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Header title="Friend Requests" />
      <FlatList
        data={pendingFriendRequests}
        keyExtractor={(item) => item.requester.username}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Image
              style={styles.avatar}
              source={{ uri: item.requester.profilePictureUrl }}
              placeholder={require("@/assets/images/avatar-placeholder.png")}
              contentFit="cover"
            />
            <View style={styles.itemContent}>
              <AppText type="title-large">{`${item.requester.firstName} ${item.requester.lastName}`}</AppText>
              <AppText type="title-medium">{`@${item.requester.username}`}</AppText>
              <View style={styles.buttonRow}>
                <TextButton
                  label="Add friend"
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.success },
                  ]}
                  onPress={() => handleAccept(item.requester.username)}
                />
                <TextButton
                  label="Decline"
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.error },
                  ]}
                  onPress={() => handleReject(item.requester.username)}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <AppText type="body-medium" color="onSurfaceVariant">
              No pending friend requests
            </AppText>
          </View>
        )}
        style={[styles.list, { backgroundColor: theme.surface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  avatar: {
    aspectRatio: 1,
    alignSelf: "stretch",
    borderRadius: 100,
  },
  itemContent: {
    flex: 1,
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 8,
    padding: 4,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  list: {
    flex: 1,
  },
});
