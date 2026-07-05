import { useFriends, usePosts, useUser } from "@/features/social";
import PostCard from "@/features/social/components/PostCard";
import PostCreationCard from "@/features/social/components/PostCreationCard";
import PressableCount from "@/features/social/components/PressableCount";
import AppText from "@/shared/components/AppText";
import IconButton from "@/shared/components/IconButton";
import PaginatedFlatList from "@/shared/components/PaginatedFlatList";
import { useAuth } from "@/shared/hooks/useAuth";
import { useTheme } from "@/shared/hooks/useTheme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function MyProfile() {
  const theme = useTheme();

  const { currentUser, fetchCurrentUserProfile } = useUser();
  const { pendingFriendRequests } = useFriends();
  const { getMyPosts } = usePosts();

  const { logout } = useAuth();

  const handleRefresh = useCallback(async () => {
    await fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleAddedPost = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleDeletedPost = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleLoadPostsPage = useCallback(
    (page: number, pageSize: number) => getMyPosts(page, pageSize),
    [getMyPosts],
  );

  return (
    <PaginatedFlatList
      onRefresh={handleRefresh}
      args={refreshKey}
      contentContainerStyle={[
        styles.listContent,
        { backgroundColor: theme.surface },
      ]}
      ListHeaderComponentStyle={[
        styles.listHeader,
        { backgroundColor: theme.surface },
      ]}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <AppText
              type="title-large-bold"
              style={styles.flex1}
            >{`@${currentUser?.username}`}</AppText>
            <IconButton
              icon={{
                name: "search",
                library: "MaterialIcons",
                size: 28,
              }}
              variant="icon"
              onPress={() => router.push("/profile/userSearch")}
            />
            <IconButton
              icon={{
                name: "settings",
                library: "MaterialIcons",
                size: 28,
              }}
              variant="icon"
              //onPress={() => logout()}
              onPress={() => router.push("/profile/settings")}
            />
          </View>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: currentUser?.profilePictureUrl }}
              placeholder={require("@/assets/images/avatar-placeholder.png")}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <AppText type="title-large">{`${currentUser?.firstName} ${currentUser?.lastName}`}</AppText>
              <View style={styles.countsRow}>
                <PressableCount
                  count={currentUser?.friendsCount || 0}
                  label="Friends"
                  onPress={() => router.push("/profile/myFriends")}
                  notificationCount={pendingFriendRequests.length}
                />
                <PressableCount
                  count={currentUser?.followersCount || 0}
                  label="Followers"
                  onPress={() =>
                    router.push(`/profile/${currentUser?.username}/followers`)
                  }
                />
                <PressableCount
                  count={currentUser?.followingCount || 0}
                  label="Following"
                  onPress={() =>
                    router.push(`/profile/${currentUser?.username}/following`)
                  }
                />
              </View>
            </View>
          </View>
          <PostCreationCard onPostCreated={handleAddedPost} />
        </>
      }
      loadPage={handleLoadPostsPage}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard post={item} onDelete={handleDeletedPost} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 16,
    paddingHorizontal: 16,
  },
  listHeader: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  profileRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileInfo: {
    marginLeft: 16,
    justifyContent: "center",
    gap: 8,
  },
  countsRow: {
    flexDirection: "row",
    gap: 16,
  },
});
