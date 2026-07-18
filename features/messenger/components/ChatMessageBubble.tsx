import AppText from "@/shared/components/AppText";
import DynamicIcon from "@/shared/components/DynamicIcon";
import { useTheme } from "@/shared/hooks/useTheme";
import { memo, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { ChatMessage } from "../types/chatMessage";

type Props = {
  message: ChatMessage;
  lastReadByOthersMessageSentAt?: Date;
  displaySenderName?: boolean;
};

function ChatMessageBubble({
  message,
  lastReadByOthersMessageSentAt = new Date(0),
  displaySenderName = true,
}: Props) {
  const theme = useTheme();

  const [lastLineWidth, setLastLineWidth] = useState(0);
  const [fullWidth, setFullWidth] = useState(0);
  const [metaWidth, setMetaWidth] = useState(0);
  const [lineCount, setLineCount] = useState(0);

  // Reserve room for the timestamp/check row when the last line is too wide.
  const addLine = fullWidth - lastLineWidth - 16 < metaWidth;

  const formattedTime = useMemo(
    () =>
      message.sentAt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.sentAt]
  );

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;

    setFullWidth((prev) => (prev === width ? prev : width));
  };

  const handleMetaLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;

    setMetaWidth((prev) => (prev === width ? prev : width));
  };

  const handleTextLayout = (event: any) => {
    const lines = event.nativeEvent.lines;

    const lastLineWidth = lines.at(-1)?.width ?? 0;

    setLineCount((prev) =>
      prev === lines.length ? prev : lines.length
    );

    setLastLineWidth((prev) =>
      prev === lastLineWidth ? prev : lastLineWidth
    );
  };

  const isOwnMessage = message.isOwnMessage;

  return (
    <View
      style={[
        styles.container,
        {
          marginLeft: isOwnMessage ? 64 : 0,
          marginRight: isOwnMessage ? 0 : 64,
          alignItems: isOwnMessage ? "flex-end" : "flex-start",
        },
      ]}
      onLayout={handleContainerLayout}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.primaryVariant,
          },
        ]}
      >
        {displaySenderName && (
          <AppText
            type="body-medium-bold"
            style={{
              color: theme.onPrimaryVariant,
            }}
          >
            {message.sender.username}
          </AppText>
        )}

        <AppText
          type="body-medium"
          style={{
            color: theme.onSurface,
            paddingRight:
              lineCount === 1 && !addLine ? metaWidth : 0,
            paddingBottom: addLine ? 12 : 0,
          }}
          onTextLayout={handleTextLayout}
        >
          {message.content}
        </AppText>

        <View
          style={styles.metaContainer}
          onLayout={handleMetaLayout}
        >
          <View style={styles.metaRow}>
            <AppText
              type="label-small"
              style={{
                color: theme.onSurfaceVariant,
                paddingHorizontal: 2,
              }}
            >
              {formattedTime}
            </AppText>

            {isOwnMessage && (
              <DynamicIcon
                name={
                  message.sentAt <= lastReadByOthersMessageSentAt
                    ? "check-all"
                    : "check"
                }
                library="MaterialCommunityIcons"
                size={16}
                color={theme.primary}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(ChatMessageBubble);

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