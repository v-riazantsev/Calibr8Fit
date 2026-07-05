import { StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";
import AppText from "./AppText";

type Props = {
  text?: string;
  textColor?: keyof Omit<ReturnType<typeof useTheme>, "isDark">;
  backgroundColor?: string;
}
export default function NotificationBadge({ text, textColor, backgroundColor }: Props) {
  const theme = useTheme();

  return text ? (
    <AppText
      type="body-medium-bold"
      color={textColor ?? "onPrimary"}
      style={[styles.badge, { backgroundColor: backgroundColor ?? theme.error }]}
    >
      {text}
    </AppText>
  ) : null;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    paddingHorizontal: 2,
    textAlign: "center"
  }
});