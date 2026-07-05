import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="friends"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="followers"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="following"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}