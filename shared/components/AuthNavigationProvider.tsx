import { router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthNavigationProvider() {
  const { authenticated, isChecking, registrationComplete } = useAuth();
  const segments = useSegments();

  // Prevent splash screen from hiding while checking authentication
  useEffect(() => {
    if (isChecking)
      SplashScreen.preventAutoHideAsync();
    else
      SplashScreen.hideAsync();
  }, [isChecking]);

  // Redirect based on authentication status
  useEffect(() => {
    if (!isChecking) {
      if (authenticated) {
        if (registrationComplete) {
          console.log("Root layout - Navigating to tabs");
          router.replace("/(app)/(tabs)/home");
        } else {
          console.log("Root layout - Navigating to profile setup");
          router.push("/(auth)/user-info");
        }
      } else if (segments[0] !== "(auth)") {
        console.log("Root layout - Navigating to auth");
        router.replace("/(auth)");
      }
    }
  }, [isChecking, authenticated, registrationComplete]);

  return null;
}