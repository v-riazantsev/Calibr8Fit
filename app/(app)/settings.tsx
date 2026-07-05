import { useProfile } from "@/features/profile/hooks/useProfile";
import { ProfileSettings } from "@/features/profile/types/interfaces/profile";
import AppText from "@/shared/components/AppText";
import Header from "@/shared/components/Header";
import SettingsItem from "@/shared/components/SettingsItem";
import TextButton from "@/shared/components/TextButton";
import { useAuth } from "@/shared/hooks/useAuth";
import { useTheme } from "@/shared/hooks/useTheme";
import { ActivityLevel } from "@/shared/types/enums/activityLevel";
import { Climate } from "@/shared/types/enums/climate";
import { Gender } from "@/shared/types/enums/gender";
import { useCallback, useState } from "react";
import {
  Appearance,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const { logout } = useAuth();

  // Dark mode state management
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
  const handleDarkModeToggle = useCallback(() => {
    const newColorScheme = colorScheme === "dark" ? "light" : "dark";
    Appearance.setColorScheme(newColorScheme);
    setIsDarkMode(newColorScheme === "dark");
  }, [colorScheme]);

  // Profile settings state management
  const { profileSettings, updateProfileSettings } = useProfile();
  const handleProfileSettingsChange = useCallback(
    (newSettings: ProfileSettings) => {
      updateProfileSettings(newSettings);
    },
    [updateProfileSettings],
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleNotificationsChange = useCallback((value: boolean) => {
    // TODO: Implement
    setNotificationsEnabled(value);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Header title="Settings" />
      <ScrollView style={styles.scrollView}>
        <AppText type="title-large">General</AppText>

        <SettingsItem
          type="boolean"
          icon={{ name: "dark-mode", library: "MaterialIcons", size: 24 }}
          label="Dark Mode"
          value={isDarkMode}
          onValueChange={handleDarkModeToggle}
        />

        <SettingsItem
          type="boolean"
          icon={{ name: "notifications", library: "MaterialIcons", size: 24 }}
          label="Notifications"
          value={notificationsEnabled}
          onValueChange={handleNotificationsChange}
        />

        <AppText type="title-large" style={styles.sectionTitle}>
          Profile Information
        </AppText>

        <SettingsItem
          type="text"
          icon={{ name: "person", library: "MaterialIcons", size: 24 }}
          label="First Name"
          value={profileSettings!.firstName}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              firstName: value,
            })
          }
        />

        <SettingsItem
          type="text"
          icon={{ name: "person-outline", library: "MaterialIcons", size: 24 }}
          label="Last Name"
          value={profileSettings!.lastName}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              lastName: value,
            })
          }
        />

        <SettingsItem
          type="date"
          icon={{ name: "cake", library: "MaterialIcons", size: 24 }}
          label="Date of Birth"
          value={profileSettings!.dateOfBirth}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              dateOfBirth: value,
            })
          }
        />

        <AppText type="title-large" style={styles.sectionTitle}>
          Body and Lifestyle
        </AppText>

        <SettingsItem<Gender>
          type="select"
          icon={{ name: "wc", library: "MaterialIcons", size: 24 }}
          label="Gender"
          value={profileSettings!.gender}
          onValueChange={(value) =>
            handleProfileSettingsChange({ ...profileSettings!, gender: value })
          }
          options={[
            { label: "Male", value: Gender.Male },
            { label: "Female", value: Gender.Female },
          ]}
        />

        <SettingsItem
          type="number"
          icon={{ name: "height", library: "MaterialIcons", size: 24 }}
          label="Height"
          value={profileSettings!.height}
          onValueChange={(value) =>
            handleProfileSettingsChange({ ...profileSettings!, height: value })
          }
          unit="cm"
          integer={true}
          minValue={0}
          maxValue={300}
        />

        <SettingsItem
          type="number"
          icon={{ name: "monitor-weight", library: "MaterialIcons", size: 24 }}
          label="Target Weight"
          value={profileSettings!.targetWeight}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              targetWeight: value,
            })
          }
          unit="kg"
          integer={false}
          minValue={0}
          maxValue={500}
        />

        <SettingsItem<ActivityLevel>
          type="select"
          icon={{ name: "directions-run", library: "MaterialIcons", size: 24 }}
          label="Activity Level"
          value={profileSettings!.activityLevel}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              activityLevel: value,
            })
          }
          options={[
            { label: "Sedentary", value: ActivityLevel.Sedentary },
            { label: "Light", value: ActivityLevel.Light },
            { label: "Moderately Active", value: ActivityLevel.Moderately },
            { label: "High", value: ActivityLevel.High },
            { label: "Extreme", value: ActivityLevel.Extreme },
          ]}
        />

        <SettingsItem<Climate>
          type="select"
          icon={{ name: "wb-sunny", library: "MaterialIcons", size: 24 }}
          label="Climate"
          value={profileSettings!.climate}
          onValueChange={(value) =>
            handleProfileSettingsChange({ ...profileSettings!, climate: value })
          }
          options={[
            { label: "Tropical", value: Climate.Tropical },
            { label: "Temperate", value: Climate.Temperate },
            { label: "Cold", value: Climate.Cold },
          ]}
        />

        <AppText type="title-large" style={styles.sectionTitle}>
          Goals
        </AppText>

        <SettingsItem
          type="number"
          icon={{ name: "fastfood", library: "MaterialIcons", size: 24 }}
          label="Consumption Target"
          value={profileSettings!.forcedConsumptionTarget}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              forcedConsumptionTarget: value,
            })
          }
          unit="kcal"
          integer={true}
          minValue={0}
          maxValue={50000}
        />

        <SettingsItem
          type="number"
          icon={{
            name: "local-fire-department",
            library: "MaterialIcons",
            size: 24,
          }}
          label="Burn Target"
          value={profileSettings!.forcedBurnTarget ?? null}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              forcedBurnTarget: value,
            })
          }
          unit="kcal"
          integer={true}
          minValue={0}
          maxValue={50000}
        />

        <SettingsItem
          type="number"
          icon={{ name: "water-drop", library: "MaterialIcons", size: 24 }}
          label="Hydration Target"
          value={profileSettings!.forcedHydrationTarget ?? null}
          onValueChange={(value) =>
            handleProfileSettingsChange({
              ...profileSettings!,
              forcedHydrationTarget: value,
            })
          }
          unit="ml"
          integer={true}
          minValue={0}
          maxValue={10000}
        />

        <TextButton
          label="Logout"
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          labelStyle={{ color: theme.onError }}
          onPress={() => {
            logout();
          }}
        ></TextButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    marginTop: 16,
  },
  logoutButton: {
    marginVertical: 16,
  },
});
