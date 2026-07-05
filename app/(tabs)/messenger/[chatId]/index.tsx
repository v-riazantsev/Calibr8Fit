import { useTheme } from "@/shared/hooks/useTheme";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function Chat() {
  const theme = useTheme();
  const { chatId } = useLocalSearchParams();

  return (
    <View style={[{ flex: 1, backgroundColor: theme.surfaceContainer }]}>
      <Text>Chat ID: {chatId}</Text>
    </View>
  );
}