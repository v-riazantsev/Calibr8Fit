import AppText from "@/shared/components/AppText";
import DynamicIcon from "@/shared/components/DynamicIcon";
import NotificationBadge from "@/shared/components/NotificationBadge";
import { useTheme } from "@/shared/hooks/useTheme";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ChatPreview } from "../types/chat";

type Props = {
  chatPreview: ChatPreview;
  onPress: (chatId: string) => void;
}

export default function ChatCard({ chatPreview, onPress }: Props) {
  const theme = useTheme();
  const message = chatPreview.lastMessage;

  return (
    <TouchableOpacity
      onPress={() => onPress(chatPreview.id)}
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.outline }]}
    >
      <Image
        source={{ uri: chatPreview.avatarUrl }}
        placeholder={require("@/assets/images/avatar-placeholder.png")}
        style={styles.avatar}
      />
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={styles.row}>
          <AppText
            type="title-medium"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.flex1}
          >{chatPreview.displayName}</AppText>
          {message?.isOwnMessage && chatPreview.lastReadByOtherMembersMessageSentAt && (
            <DynamicIcon
              name={message.sentAt <= chatPreview.lastReadByOtherMembersMessageSentAt ? "check-all" : "check"}
              library="MaterialCommunityIcons"
              size={16}
              color={theme.primary}
            />
          )}
          <AppText
            type="body-small"
          >{message?.sentAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</AppText>
        </View>
        <View style={styles.row}>
          <AppText
            type="body-medium"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.flex1}
          >{message?.content || "No messages yet."}
          </AppText>
          <NotificationBadge text={chatPreview.unreadMessagesCount > 0 ? chatPreview.unreadMessagesCount.toString() : undefined} />
        </View>
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 8,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});