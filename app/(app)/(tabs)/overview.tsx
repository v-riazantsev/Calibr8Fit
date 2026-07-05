import ActivitiesListCard from "@/features/activity/components/ActivitiesListCard";
import ActivitiesListPopupContent from "@/features/activity/components/ActivitiesListPopupContent";
import ActivityRecordPopupContent from "@/features/activity/components/ActivityRecordPopupContent";
import DailyBurnListCard from "@/features/activity/components/DailyBurnListCard";
import DailyBurnPopupContent from "@/features/activity/components/DailyBurnPopupContent";
import { useActivityRecord } from "@/features/activity/hooks/useActivityRecord";
import { useDailyBurn } from "@/features/activity/hooks/useDailyBurn";
import { ActivityItem } from "@/features/activity/types/activityRecord";
import WaterIntakeRecordPopupContent from "@/features/hydration/components/WaterIntakeRecordPopupContent";
import { useWaterIntake } from "@/features/hydration/hooks/useWaterIntake";
import FoodListPopupContent from "@/features/nutrition/components/FoodListPopupContent";
import FoodRecordPopupContent from "@/features/nutrition/components/FoodRecordPopupContent";
import RationListCard from "@/features/nutrition/components/RationListCard";
import { useConsumptionRecord } from "@/features/nutrition/hooks/useConsumptionRecord";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useRecommendations } from "@/features/profile/hooks/useRecommendations";
import WeightRecordPopup from "@/features/weight/components/WeightRecordPopupContent";
import { useWeightRecord } from "@/features/weight/hooks/useWeightRecord";
import IconTile from "@/shared/components/IconTile";
import Popup from "@/shared/components/Popup";
import ProgressCarousel from "@/shared/components/ProgressCarousel";
import { useTheme } from "@/shared/hooks/useTheme";
import { AppTheme } from "@/styles/themes";
import React, { useCallback, useState } from "react";
import { NativeSyntheticEvent, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const PAGE_COUNT = 3;

const PageIndicator = ({
  progress,
  activeColor,
  inactiveColor,
}: {
  progress: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) => {
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return <Animated.View style={[staticStyles.circleIndicator, style]} />;
};

const usePagerProgress = (pageCount: number) =>
  Array.from({ length: pageCount }, (_, i) => useSharedValue(i === 0 ? 1 : 0));

const useStyles = (theme: AppTheme) =>
  React.useMemo(
    () =>
      StyleSheet.create({
        cardPage: {
          flex: 1,
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.outline,
        },
      }),
    [theme],
  );

export default function Overview() {
  const theme = useTheme();
  const styles = useStyles(theme);

  const [popupContent, setPopupContent] = useState<React.ReactNode>();

  const { profileSettings } = useProfile();
  const { waterIntakeTarget, burnTarget, consumptionTarget } =
    useRecommendations();
  const { todayWaterIntakeInMl } = useWaterIntake();
  const { weight } = useWeightRecord();
  const { todayCaloriesConsumed } = useConsumptionRecord();
  const { todayCaloriesBurned } = useActivityRecord();

  const progressArray = usePagerProgress(PAGE_COUNT);
  const HandlePageScroll = useCallback(
    (
      e: NativeSyntheticEvent<
        Readonly<{
          position: number;
          offset: number;
        }>
      >,
    ) => {
      const { offset, position } = e.nativeEvent;
      for (let i = 0; i < PAGE_COUNT; i++)
        progressArray[i].value =
          i === position ? 1 - offset : i === position + 1 ? offset : 0;
    },
    [progressArray],
  );

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

  const openWeightRecordPopup = useCallback(() => {
    setPopupContent(
      <WeightRecordPopup onClose={() => setPopupContent(undefined)} />,
    );
  }, []);

  const { targets } = useDailyBurn();

  const openDailyBurnPopup = useCallback(() => {
    setPopupContent(
      <ActivitiesListPopupContent
        onClose={() => setPopupContent(undefined)}
        bannedIdList={
          new Set(targets.map((t) => t.activityId ?? t.userActivityId!))
        }
        onActivitySelect={(item: ActivityItem) =>
          setPopupContent(
            <DailyBurnPopupContent
              activity={item}
              onClose={() => setPopupContent(undefined)}
            />,
          )
        }
      />,
    );
  }, [targets]);

  return (
    <View style={[staticStyles.container, { backgroundColor: theme.surface }]}>
      <View
        style={[
          staticStyles.carouselWrapper,
          { backgroundColor: theme.surface, borderColor: theme.outline },
        ]}
      >
        <ProgressCarousel />
      </View>
      <View style={staticStyles.tileRow}>
        <IconTile
          style={staticStyles.flex1}
          text={`${todayCaloriesConsumed} kcal`}
          supportingText={`${consumptionTarget} kcal`}
          icon={{
            name: "fastfood",
            library: "MaterialIcons",
          }}
          onPress={openFoodPopup}
        />
        <IconTile
          style={staticStyles.flex1}
          text={`${todayCaloriesBurned} kcal`}
          supportingText={`${burnTarget} kcal`}
          icon={{
            name: "local-fire-department",
            library: "MaterialIcons",
          }}
          onPress={openActivitiesPopup}
        />
      </View>
      <View style={staticStyles.tileRow}>
        <IconTile
          style={staticStyles.flex1}
          text={`${(todayWaterIntakeInMl / 1000).toFixed(2)} l`}
          supportingText={`${waterIntakeTarget} l`}
          icon={{
            name: "water-drop",
            library: "MaterialIcons",
          }}
          onPress={openWaterIntakePopup}
        />
        <IconTile
          style={staticStyles.flex1}
          text={`${weight} kg`}
          supportingText={`${profileSettings?.targetWeight} kg`}
          icon={{
            name: "monitor-weight",
            library: "MaterialIcons",
          }}
          onPress={openWeightRecordPopup}
        />
      </View>
      <View style={staticStyles.pagerWrapper}>
        <PagerView
          style={staticStyles.flex1}
          onPageScroll={(e) => {
            HandlePageScroll(e);
          }}
        >
          <View key="1" style={styles.cardPage}>
            <ActivitiesListCard onAddActivityPress={openActivitiesPopup} />
          </View>
          <View key="2" style={styles.cardPage}>
            <RationListCard onAddPress={openFoodPopup} />
          </View>
          <View key="3" style={styles.cardPage}>
            <DailyBurnListCard onAddTargetPress={openDailyBurnPopup} />
          </View>
        </PagerView>
        <View style={staticStyles.indicatorRow}>
          {progressArray.map((progress, index) => (
            <PageIndicator
              key={index}
              progress={progress}
              activeColor={theme.onSurfaceVariant}
              inactiveColor={theme.surfaceContainer}
            />
          ))}
        </View>
      </View>
      <Popup
        visible={!!popupContent}
        onClose={() => setPopupContent(undefined)}
        children={popupContent}
      />
    </View>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    paddingHorizontal: 16,
  },
  carouselWrapper: {
    height: 144,
    marginVertical: 8,
    borderRadius: 16,
    justifyContent: "center",
    borderWidth: 1,
  },
  tileRow: {
    flexDirection: "row",
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  pagerWrapper: {
    flex: 1,
    paddingTop: 8,
    marginHorizontal: -16,
  },
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    padding: 4,
  },
  circleIndicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
});
