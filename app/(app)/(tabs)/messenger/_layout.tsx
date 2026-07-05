import { Stack } from "expo-router";

export default function MessengerStack() {
  // FIXME: header is too wide, because of the safe area insets
  return (
    <Stack>
      <Stack.Screen name="chatList" options={{ headerShown: false }} />
    </Stack>
  );
}
