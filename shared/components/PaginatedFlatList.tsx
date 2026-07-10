import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import AppText from "./AppText";

type LoadPage<TArgs = any, TItem = any> = (
  page: number,
  pageSize: number,
  args?: TArgs,
) => Promise<TItem[]>;

type Props<TArgs = any, TItem = any> = {
  loadPage: LoadPage<TArgs, TItem>;
  args?: TArgs;
  pageSize?: number;

  onRefresh?: () => Promise<void>;
  ListHeaderComponent?: React.ReactElement;
  ListHeaderComponentStyle?: StyleProp<ViewStyle>;
  ListEmptyComponent?: React.ReactElement;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ItemSeparatorComponent?: React.ComponentType<any>;
  renderItem: ({ item }: { item: TItem }) => React.ReactElement;
  keyExtractor: (item: TItem, index: number) => string;
};

export default function PaginatedFlatList<TArgs = any, TItem = any>({
  loadPage,
  args,
  pageSize = 20,
  ...props
}: Props<TArgs, TItem>) {
  const theme = useTheme();

  const [items, setItems] = useState<TItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (page: number, replace = false) => {
      setLoading(true);

      const data = await loadPage(page, pageSize, args);

      setItems(prev => replace ? data : [...prev, ...data]);
      setHasMore(data.length === pageSize);

      setLoading(false);
    },
    [args, loadPage, pageSize],
  );

  // Load next page
  const onEndReached = useCallback(() => {
    if (loading || !hasMore) return;
    setPage(page + 1);
    fetchPage(page + 1);
  }, [loading, hasMore, page, fetchPage]);

  // Refetch when args change
  useEffect(() => {
    setPage(0);
    fetchPage(0, true);
  }, [args, fetchPage]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setPage(0);

    await fetchPage(0, true);

    await props.onRefresh?.();
  }, [fetchPage, props]);

  const listFooter = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator />
        </View>
      );
    }
    if (!hasMore && items.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <AppText type="body-medium" style={{ color: theme.onSurfaceVariant }}>
            You have reached the end.
          </AppText>
        </View>
      );
    }
    return null;
  }, [loading, hasMore, items.length, theme.onSurfaceVariant]);

  return (
    <FlatList
      {...props}
      style={{ backgroundColor: theme.surface }}
      refreshing={loading}
      onRefresh={handleRefresh}
      data={items}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={listFooter}
    />
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: 16,
  },
  footerEnd: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
