import { ActivityProvider } from "@/features/activity/context/ActivityContext";
import { ActivityRecordProvider } from "@/features/activity/context/ActivityRecordContext";
import { DailyBurnProvider } from "@/features/activity/context/DailyBurnContext";
import { UserActivityProvider } from "@/features/activity/context/UserActivityContext";
import { WaterIntakeProvider } from "@/features/hydration/context/WaterIntakeContext";
import { MessengerProvider } from "@/features/messenger/context/MessengerContext";
import { ConsumptionRecordProvider } from "@/features/nutrition/context/ConsumptionRecordContext";
import { FoodProvider } from "@/features/nutrition/context/FoodContext";
import { MealProvider } from "@/features/nutrition/context/MealContext";
import { UserFoodProvider } from "@/features/nutrition/context/UserFoodContext";
import { ProfileProvider } from "@/features/profile/context/ProfileContext";
import { RecommendationsProvider } from "@/features/profile/context/RecommendationsContext";
import { SocialProvider } from "@/features/social";
import { WeightRecordProvider } from "@/features/weight/context/WeightRecordContext";
import DynamicIcon, { IconItem } from "@/shared/components/DynamicIcon";
import { useTheme } from "@/shared/hooks/useTheme";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const screenConfigs: Record<string, IconItem> = {
  home: { name: "home", library: "MaterialIcons" },
  overview: { name: "calendar-month", library: "MaterialCommunityIcons" },
  statistics: { name: "stats-chart", library: "Ionicons" },
  messenger: { name: "message-outline", library: "MaterialCommunityIcons" },
  profile: { name: "person", library: "MaterialIcons" },
};

export default function TabLayout() {
  const theme = useTheme();

  return (
    <ProfileProvider>
      <SocialProvider>
        <WeightRecordProvider>
          <RecommendationsProvider>
            <ActivityProvider>
              <UserActivityProvider>
                <ActivityRecordProvider>
                  <FoodProvider>
                    <UserFoodProvider>
                      <MealProvider>
                        <ConsumptionRecordProvider>
                          <WaterIntakeProvider>
                            <DailyBurnProvider>
                              <MessengerProvider>
                                <SafeAreaView
                                  edges={["top"]}
                                  style={{ backgroundColor: theme.surface }}
                                ></SafeAreaView>
                                <Tabs
                                  screenOptions={({ route }) => {
                                    const config = screenConfigs[route.name];
                                    return {
                                      headerShown: false,
                                      tabBarShowLabel: false,
                                      tabBarActiveTintColor: theme.primary,
                                      tabBarInactiveTintColor: theme.onSurface,
                                      tabBarStyle: {
                                        backgroundColor: theme.surfaceContainer,
                                        borderTopWidth: 0,
                                        height: 64 + 24,
                                      },
                                      tabBarIconStyle: styles.tabBarIcon,
                                      tabBarButton: (props) => (
                                        <PlatformPressable
                                          {...props}
                                          android_ripple={{
                                            color: "transparent",
                                          }}
                                        />
                                      ),
                                      tabBarIcon: (props) => (
                                        <DynamicIcon
                                          name={config.name}
                                          size={32}
                                          library={config.library}
                                          color={props.color}
                                        />
                                      ),
                                    };
                                  }}
                                >
                                  <Tabs.Screen name="home" />
                                  <Tabs.Screen name="overview" />
                                  <Tabs.Screen name="statistics" />
                                  <Tabs.Screen name="messenger" />
                                  <Tabs.Screen name="profile" />
                                </Tabs>
                              </MessengerProvider>
                            </DailyBurnProvider>
                          </WaterIntakeProvider>
                        </ConsumptionRecordProvider>
                      </MealProvider>
                    </UserFoodProvider>
                  </FoodProvider>
                </ActivityRecordProvider>
              </UserActivityProvider>
            </ActivityProvider>
          </RecommendationsProvider>
        </WeightRecordProvider>
      </SocialProvider>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    height: "100%",
    alignContent: "center",
    justifyContent: "center",
  },
});
