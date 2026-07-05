import ActivitiesListPopupContent from "@/features/activity/components/ActivitiesListPopupContent";
import ActivityRecordPopupContent from "@/features/activity/components/ActivityRecordPopupContent";
import DailyBurnProgressList from "@/features/activity/components/DailyBurnProgressList";
import { useActivity } from "@/features/activity/hooks/useActivity";
import { useActivityRecord } from "@/features/activity/hooks/useActivityRecord";
import { ActivityItem } from "@/features/activity/types/activityRecord";
import WaterIntakeRecordPopupContent from "@/features/hydration/components/WaterIntakeRecordPopupContent";
import { useWaterIntake } from "@/features/hydration/hooks/useWaterIntake";
import FoodListPopupContent from "@/features/nutrition/components/FoodListPopupContent";
import FoodRecordPopupContent from "@/features/nutrition/components/FoodRecordPopupContent";
import { useConsumptionRecord } from "@/features/nutrition/hooks/useConsumptionRecord";
import { useFood } from "@/features/nutrition/hooks/useFood";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useRecommendations } from "@/features/profile/hooks/useRecommendations";
import { usePosts } from "@/features/social";
import PostCard from "@/features/social/components/PostCard";
import AppText from "@/shared/components/AppText";
import IconAddProgressIndicator from "@/shared/components/IconAddProgressIndicator";
import PaginatedFlatList from "@/shared/components/PaginatedFlatList";
import Popup from "@/shared/components/Popup";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Home() {
  const [popupContent, setPopupContent] = useState<React.ReactNode>();

  const openFoodPopup = useCallback(() => {
    setPopupContent(
      <FoodListPopupContent
        onClose={() => setPopupContent(undefined)}
        onFoodSelect={(item) =>
          setPopupContent(
            <FoodRecordPopupContent
              item={item}
              onClose={() => setPopupContent(undefined)}
            />,
          )
        }
      />,
    );
  }, []);

  const openActivitiesPopup = useCallback(() => {
    setPopupContent(
      <ActivitiesListPopupContent
        onClose={() => setPopupContent(undefined)}
        onActivitySelect={(item: ActivityItem) =>
          setPopupContent(
            <ActivityRecordPopupContent
              activity={item}
              onClose={() => setPopupContent(undefined)}
            />,
          )
        }
      />,
    );
  }, []);

  const openWaterIntakePopup = useCallback(() => {
    setPopupContent(
      <WaterIntakeRecordPopupContent
        onClose={() => setPopupContent(undefined)}
      />,
    );
  }, []);

  const { profileSettings } = useProfile();
  const {
    waterIntakeTarget: waterIntake,
    burnTarget,
    consumptionTarget,
  } = useRecommendations();
  const { todayWaterIntakeInMl, syncWaterIntake } = useWaterIntake();
  const { syncFoods } = useFood();
  const { todayCaloriesConsumed, syncConsumptionRecords } =
    useConsumptionRecord();
  const { todayCaloriesBurned, syncActivityRecords } = useActivityRecord();
  const { syncActivities } = useActivity();

  const burnProgress = burnTarget
    ? Math.min(todayCaloriesBurned / burnTarget, 1)
    : 1;
  const rationProgress = consumptionTarget
    ? Math.min(todayCaloriesConsumed / consumptionTarget, 1)
    : 0;
  const waterProgress = todayWaterIntakeInMl / 1000 / waterIntake;

  // Feed handling
  const { getMyFeed } = usePosts();

  const handleLoadFeed = useCallback(
    (page: number, pageSize: number) => getMyFeed(page, pageSize),
    [getMyFeed],
  );

  // Handle refresh
  const handleRefresh = async () => {
    await syncWaterIntake();
    await syncActivities();
    await syncFoods();
    await syncConsumptionRecords();
    await syncActivityRecords();
  };

  return (
    <>
      <PaginatedFlatList
        loadPage={handleLoadFeed}
        contentContainerStyle={styles.listContent}
        ListHeaderComponentStyle={styles.listHeader}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <AppText type="headline-medium">{`Hi ${profileSettings?.firstName}`}</AppText>
            </View>
            <IconAddProgressIndicator
              progress={burnProgress}
              icon={{
                name: "local-fire-department",
                library: "MaterialIcons",
                size: 24,
              }}
              onAddPress={openActivitiesPopup}
            />
            <IconAddProgressIndicator
              progress={rationProgress}
              icon={{
                name: "fastfood",
                library: "MaterialIcons",
                size: 24,
              }}
              onAddPress={openFoodPopup}
            />
            <IconAddProgressIndicator
              progress={waterProgress}
              icon={{
                name: "water-drop",
                library: "MaterialIcons",
                size: 24,
              }}
              onAddPress={openWaterIntakePopup}
            />
            <DailyBurnProgressList />
          </>
        }
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
      />
      <Popup
        visible={!!popupContent}
        onClose={() => setPopupContent(undefined)}
      >
        {popupContent}
      </Popup>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 8,
  },
  listHeader: {
    gap: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
