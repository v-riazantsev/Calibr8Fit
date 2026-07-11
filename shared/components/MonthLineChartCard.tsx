import { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "../hooks/useTheme";
import AppText from "./AppText";

type Props = {
  headline?: string;
  color?: string;
  yAxisLabelSuffix?: string;
  referenceLine1Position?: number;
  data: { date: Date; value: number }[];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthLineChartCard({
  headline,
  color,
  yAxisLabelSuffix,
  referenceLine1Position,
  data,
}: Props) {
  const theme = useTheme();

  const yAxisLabelWidth = 72;
  const [chartSpacing, setChartSpacing] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    const next = width - yAxisLabelWidth - 33;
    setChartSpacing((prev) => (prev === next ? prev : next));
  }, []);

  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { day: "numeric" }),
    [],
  );
  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short" }),
    [],
  );

  const displayData = useMemo(
    () =>
      data.map((r) => {
        const day = r.date.getDate();
        return {
          value: Math.round(r.value),
          label: day % 5 === 1 ? dayFmt.format(r.date) : undefined,
          pointerLabel: `${day} ${monthFmt.format(r.date)}`,
        };
      }),
    [data, dayFmt, monthFmt],
  );

  const maxDataValue = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => Math.round(d.value)));
  }, [data]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.outline,
        },
      ]}
      onLayout={handleLayout}
    >
      <AppText type="headline-small">{headline}</AppText>

      <LineChart
        areaChart
        curved
        disableScroll
        hideDataPoints
        noOfSections={5}
        yAxisLabelWidth={yAxisLabelWidth}
        yAxisTextStyle={{
          color: theme.onSurfaceVariant,
          flex: 1,
          paddingRight: 4,
          textAlign: "right",
        }}
        initialSpacing={0}
        adjustToWidth
        spacing={data.length === 0 ? 0 : chartSpacing / data.length}
        data={displayData}
        startFillColor={color}
        startOpacity={1}
        endFillColor={theme.surface}
        endOpacity={0}
        xAxisLabelTextStyle={{ width: 20, marginLeft: 5, color: theme.onSurfaceVariant }}
        yAxisLabelSuffix={yAxisLabelSuffix}
        thickness={2}
        color={color}
        hideOrigin
        xAxisColor={theme.onSurfaceVariant}
        yAxisColor={theme.onSurfaceVariant}
        formatYLabel={(label) => Math.round(Number(label)).toString()}
        rulesColor={theme.surfaceContainer}
        rulesType="solid"
        showReferenceLine1={!!referenceLine1Position}
        maxValue={
          maxDataValue < (referenceLine1Position ?? 0)
            ? referenceLine1Position
            : maxDataValue
        }
        referenceLine1Position={referenceLine1Position}
        referenceLine1Config={{ color: theme.onSurfaceVariant }}
        pointerConfig={{
          pointerStripColor: theme.onSurfaceVariant,
          pointerStripUptoDataPoint: true,
          pointerColor: theme.onSurfaceVariant,
          pointerLabelHeight: 40,
          pointerLabelWidth: 64,
          autoAdjustPointerLabelPosition: true,
          strokeDashArray: [4, 8],
          pointerLabelComponent: (item: (typeof displayData)[number][]) => {
            return (
              <View
                style={[
                  styles.pointerLabel,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.outline,
                  },
                ]}
              >
                <AppText
                  type="label-medium"
                  style={{ color: theme.onSurfaceVariant }}
                >
                  {item[0].value.toFixed(0)}
                </AppText>
                <AppText
                  type="label-small"
                  style={{ color: theme.onSurfaceVariant }}
                >
                  {item[0].pointerLabel}
                </AppText>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    overflow: "hidden",
    gap: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  pointerLabel: {
    flex: 1,
    height: 32,
    width: 64,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
