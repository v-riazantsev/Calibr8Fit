import { useActivityRecord } from "@/features/activity/hooks/useActivityRecord";
import { useWaterIntake } from "@/features/hydration/hooks/useWaterIntake";
import { useConsumptionRecord } from "@/features/nutrition/hooks/useConsumptionRecord";
import { calcCaloricValue } from "@/features/nutrition/types/consumptionRecord";
import { useRecommendations } from "@/features/profile/hooks/useRecommendations";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import AppText from "./AppText";
import CircularProgress from "./CircularProgress";

const TOTAL_DAYS = 30;

interface SummaryItem {
  waterProgress: number;
  burnProgress: number;
  rationProgress: number;
  date: string;
}

export default function ProgressCarousel() {
  const theme = useTheme();

  const {
    waterIntakeTarget: waterIntake,
    burnTarget,
    consumptionTarget,
  } = useRecommendations();

  const { todayWaterIntakeInMl, loadInTimeNumberRange: loadInRangeWater } =
    useWaterIntake();
  const { todayCaloriesBurned, loadInTimeNumberRange: loadInRangeActivity } =
    useActivityRecord();
  const {
    todayCaloriesConsumed,
    loadInTimeNumberRange: loadInRangeConsumption,
  } = useConsumptionRecord();

  const [monthSummary, setMonthSummary] = useState<SummaryItem[]>();

  const [containerWidth, setContainerWidth] = useState(0);
  const onLayout = (e: any) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // derive sizes from the measured width
  const { ITEM_SIZE, SIDE_PADDING } = useMemo(() => {
    if (!containerWidth) return { ITEM_SIZE: 0, SIDE_PADDING: 0 };
    const itemSize = containerWidth / 3;
    const sidePadding = (containerWidth - itemSize) / 2;
    return { ITEM_SIZE: itemSize, SIDE_PADDING: sidePadding };
  }, [containerWidth]);

  const getMonthSummary = async () => {
    const startOfRange =
      new Date().getTime() - TOTAL_DAYS * 24 * 60 * 60 * 1000;
    const endOfRange = new Date().getTime();

    const waterRecords = await loadInRangeWater(startOfRange, endOfRange);
    const activityRecords = await loadInRangeActivity(startOfRange, endOfRange);
    const consumptionRecords = await loadInRangeConsumption(
      startOfRange,
      endOfRange,
    );

    let result = new Array<SummaryItem>();

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const startOfDay = new Date().setDate(new Date().getDate() - i);
      const start = new Date(startOfDay).setHours(0, 0, 0, 0);
      const end = start + 24 * 60 * 60 * 1000;

      const dayWaterRecords = waterRecords.filter(
        (record) => record.time >= start && record.time < end,
      );
      const dayWaterTotal = dayWaterRecords.reduce(
        (sum, record) => sum + record.amountInMl,
        0,
      );
      const dayActivityRecords = activityRecords.filter(
        (record) => record.time >= start && record.time < end,
      );
      const dayActivityTotal = dayActivityRecords.reduce(
        (sum, record) => sum + record.caloriesBurned,
        0,
      );
      const dayConsumptionRecords = consumptionRecords.filter(
        (record) => record.time >= start && record.time < end,
      );
      const dayConsumptionTotal = dayConsumptionRecords.reduce(
        (sum, record) => sum + calcCaloricValue(record),
        0,
      );

      const waterProgress = dayWaterTotal / 1000 / waterIntake;
      const burnProgress = burnTarget
        ? Math.min(dayActivityTotal / burnTarget, 1)
        : 1;
      const rationProgress = consumptionTarget
        ? Math.min(dayConsumptionTotal / consumptionTarget, 1)
        : 0;

      result.push({
        waterProgress: waterProgress,
        burnProgress: burnProgress,
        rationProgress: rationProgress,
        date: new Date(start).toLocaleDateString([], {
          weekday: "short",
          day: "numeric",
          month: "numeric",
        }),
      });
    }

    // Flip back to chronological order for the carousel.
    result.reverse();

    const tomorrowDate = new Date().setDate(new Date().getDate() + 1);
    // Keep one empty slot at the end so the last real day stays aligned.
    result.push({
      waterProgress: 0,
      burnProgress: 0,
      rationProgress: 0,
      date: new Date(tomorrowDate).toLocaleDateString([], {
        weekday: "short",
        day: "numeric",
        month: "numeric",
      }),
    });

    return result;
  };

  useEffect(() => {
    getMonthSummary().then(setMonthSummary);
  }, [todayWaterIntakeInMl, todayCaloriesBurned, todayCaloriesConsumed]);

  const renderItem = (item: SummaryItem) => {
    return (
      <View style={[styles.itemContainer, { width: ITEM_SIZE }]}>
        <CircularProgress
          size={ITEM_SIZE - 24}
          strokeWidth={6}
          rings={[
            {
              color: theme.orange,
              backgroundColor: theme.surfaceContainer,
              progress: item.burnProgress,
            },
            {
              color: theme.yellow,
              backgroundColor: theme.surfaceContainer,
              progress: item.rationProgress,
            },
            {
              color: theme.blue,
              backgroundColor: theme.surfaceContainer,
              progress: item.waterProgress,
            },
          ]}
          icons={[
            {
              name: "local-fire-department",
              library: "MaterialIcons",
              color:
                item.burnProgress >= 1 ? theme.orange : theme.surfaceContainer,
            },
            {
              name: "fastfood",
              library: "MaterialIcons",
              color:
                item.rationProgress >= 1
                  ? theme.yellow
                  : theme.surfaceContainer,
            },
            {
              name: "water-drop",
              library: "MaterialIcons",
              color:
                item.waterProgress >= 1 ? theme.blue : theme.surfaceContainer,
            },
          ]}
        />
        <AppText type="label-small">{item.date}</AppText>
      </View>
    );
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  return (
    <View onLayout={onLayout} style={styles.outerContainer}>
      {/* only render once width is known */}
      {ITEM_SIZE > 0 && (
        <Animated.FlatList
          data={monthSummary}
          keyExtractor={(i) => i.date}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
          decelerationRate="fast"
          snapToInterval={ITEM_SIZE}
          snapToAlignment="start"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          renderItem={(i) => renderItem(i.item)}
          windowSize={3}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          initialScrollIndex={TOTAL_DAYS - 1}
          getItemLayout={(_, index) => ({
            length: ITEM_SIZE,
            offset: ITEM_SIZE * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
  },
  itemContainer: {
    alignItems: "center",
  },
});
