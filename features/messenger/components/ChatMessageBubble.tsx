import AppText from "@/shared/components/AppText";
import DynamicIcon from "@/shared/components/DynamicIcon";
import { useTheme } from "@/shared/hooks/useTheme";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ChatMessage } from "../types/chatMessage";

type Props = {
  message: ChatMessage;
  displaySenderName?: boolean;
  onMessageRead?: (messageId: string) => void;
};

export default function ChatMessageBubble({ message, displaySenderName = true, onMessageRead }: Props) {
  const theme = useTheme();

  const [lastLineWidth, setLastLineWidth] = useState(0);
  const [fullWidth, setFullWidth] = useState(0);
  const [metaWidth, setMetaWidth] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  const addLine = useMemo(() => {
    console.log("fullWidth", fullWidth, "lastLineWidth", lastLineWidth, "metaWidth", metaWidth);
    return (fullWidth - lastLineWidth - 16) < metaWidth;
  }, [fullWidth, lastLineWidth, metaWidth]);

  const meta = (
    <View style={styles.metaRow}>
      <AppText type="label-small" style={{ color: theme.onSurfaceVariant, paddingHorizontal: 2 }}>
        {message.sentAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </AppText>

      {message.isOwnMessage && (
        <DynamicIcon
          name={message.isReadByOthers ? "check-all" : "check"}
          library="MaterialCommunityIcons"
          size={14}
          color={theme.primary}
        />
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, {
        marginLeft: message.isOwnMessage ? 64 : 0,
        marginRight: message.isOwnMessage ? 0 : 64,
        alignItems: message.isOwnMessage ? "flex-end" : "flex-start",
      }]}
      onLayout={(event) => {
        setFullWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={[styles.bubble, { backgroundColor: theme.primaryVariant }]}>
        {displaySenderName && (
          <AppText type="body-medium-bold" style={{ color: theme.onPrimaryVariant }}>
            {message.sender.username}
          </AppText>
        )}
        <AppText
          type="body-medium"
          style={{
            color: theme.onSurface,
            paddingRight: lineCount === 1 && !addLine ? metaWidth : 0,
            paddingBottom: addLine ? 12 : 0,
          }}
          onTextLayout={async (event) => {
            const lines = event.nativeEvent.lines;
            const lastLine = lines[lines.length - 1];

            setLineCount(lines.length);
            setLastLineWidth(lastLine.width);
          }}
        >
          {message.content}
        </AppText>
        <View
          style={styles.metaContainer}
          onLayout={(event) => {
            setMetaWidth(event.nativeEvent.layout.width);
          }}
        >
          {meta}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubble: {
    padding: 8,
    borderRadius: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  metaContainer: {
    position: "absolute",
    right: 4,
    bottom: 4,
  },
});