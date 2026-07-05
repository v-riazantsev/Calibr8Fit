import { MessengerProvider } from "@/features/messenger/context/MessengerContext";
import { ProfileProvider } from "@/features/profile/context/ProfileContext";
import { useTheme } from "@/shared/hooks/useTheme";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
  const theme = useTheme();

  return (
    <ProfileProvider>
      <MessengerProvider>
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: theme.surface }}
        ></SafeAreaView>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="[chatId]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </MessengerProvider>
    </ProfileProvider>
  );
}