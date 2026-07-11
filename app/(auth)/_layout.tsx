import { useTheme } from "@/shared/hooks/useTheme";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack>
      <Stack.Screen name="index" options={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTitleStyle: {
          color: theme.onSurface,
        },
        headerTintColor: theme.onSurface,
      }} />
      <Stack.Screen name="sign-up" options={{
        title: 'Sign up',
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTitleStyle: {
          color: theme.onSurface,
        },
        headerTintColor: theme.onSurface,
      }} />
      <Stack.Screen
        name="user-info"
        options={{
          title: 'Personal info',
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTitleStyle: {
            color: theme.onSurface,
          },
          headerTintColor: theme.onSurface,
        }}
      />
    </Stack>
  );
}