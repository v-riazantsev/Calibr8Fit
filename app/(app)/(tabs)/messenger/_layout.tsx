import { Stack } from "expo-router";

export default function MessengerStack() {
  return (
    <Stack>
      <Stack.Screen name="chatList" options={{ headerShown: false }} />
    </Stack>
  );
}
