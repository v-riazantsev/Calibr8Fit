import { db } from "@/db/db";
import migrations from "@/drizzle/migrations";
import AuthNavigationProvider from "@/shared/components/AuthNavigationProvider";
import { AuthProvider } from "@/shared/context/AuthContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { useTheme } from "@/shared/hooks/useTheme";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import * as FileSystem from "expo-file-system";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

function ThemedStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: theme.isDark ? "light" : "dark",
      }}
    >
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Run DB migrations
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    (async () => {
      if (error) {
        console.error(`Failed to run migrations: ${error.message}`);
        const dbPath = `${FileSystem.documentDirectory}SQLite/db.db`;
        const info = await FileSystem.getInfoAsync(dbPath);
        if (info.exists) {
          await FileSystem.deleteAsync(dbPath, { idempotent: true });
          console.warn("Database deleted");
        } else {
          console.error("Database file does not exist");
        }
      }
      if (success) console.log("Migrations completed successfully");
    })();
  }, [success, error]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <KeyboardProvider>
          <AuthNavigationProvider />
          <ThemedStack />
        </KeyboardProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
