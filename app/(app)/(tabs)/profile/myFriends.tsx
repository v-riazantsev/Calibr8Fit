import { useFriends } from "@/features/social/hooks/useFriends";
import AppText from "@/shared/components/AppText";
import { useTheme } from "@/shared/hooks/useTheme";
import { Typography } from "@/styles/typography";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, TouchableNativeFeedback, View } from "react-native";
import Friends from "./[username]/friends";

export default function MyFriends() {
  const theme = useTheme();

  const { pendingFriendRequests } = useFriends();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Friends isCurrentUser />
      {pendingFriendRequests.length > 0 && (
        <TouchableNativeFeedback
          onPress={() => router.push("/profile/friendRequests")}
        >
          <View style={[styles.requestRow, { borderTopColor: theme.outline }]}>
            <Image
              source={{
                uri: pendingFriendRequests[0].requester.profilePictureUrl,
              }}
              placeholder={require("@/assets/images/avatar-placeholder.png")}
              style={styles.avatar}
            />
            <AppText type="title-large" style={styles.flex1}>
              Friend Requests
            </AppText>
            <AppText
              type="title-large"
              color="surface"
              style={[
                styles.badge,
                {
                  minWidth: Typography["title-large"].lineHeight,
                  backgroundColor: theme.onSurfaceVariant,
                },
              ]}
            >
              {pendingFriendRequests.length}
            </AppText>
          </View>
        </TouchableNativeFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  requestRow: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    alignItems: "center",
    borderTopWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  flex1: {
    flex: 1,
  },
  badge: {
    textAlign: "center",
    borderRadius: 100,
    paddingHorizontal: 2,
  },
});
