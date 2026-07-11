import { and, desc, gte, lt, SQL, TableRelationalConfig } from "drizzle-orm";
import { RelationalQueryBuilder } from "drizzle-orm/sqlite-core/query-builders/query";

const DAY_MS = 24 * 60 * 60 * 1000;

export function createTimeSeriesQueryService<
  Entity extends TableRelationalConfig,
  TValueKey extends keyof Entity["columns"],
>(
  qb: RelationalQueryBuilder<any, any, any, Entity>,
  valueKey: TValueKey,
  extraWith?: any,
  persistentFilter?: SQL<unknown>,
) {
  const loadInTimeNumberRange = async (
    start: number,
    end: number,
  ): Promise<unknown[]> => {
    return (await qb.findMany({
      with: extraWith,
      where: (t: any, { and, gte, lt }: any) =>
        and(persistentFilter ?? and(), gte(t.time, start), lt(t.time, end)),
    })) as unknown as Entity[];
  };

  const loadToday = async (): Promise<unknown[]> =>
    loadInTimeNumberRange(
      new Date().setHours(0, 0, 0, 0),
      new Date().setHours(24, 0, 0, 0),
    );

  const loadDailyTotalInNumberRange = async (
    start: number | Date,
    end: number | Date,
    fillDateGaps: boolean = true,
  ): Promise<{ date: Date; value: number }[]> => {
    start = typeof start === "number" ? start : Math.floor(start.getTime());
    end = typeof end === "number" ? end : Math.floor(end.getTime());

    const LOCAL_OFFSET = new Date().getTimezoneOffset() * -60_000;

    const rows = await qb.findMany({
      with: extraWith,
      where: (table: any) =>
        and(
          persistentFilter ?? and(),
          gte(table.time, start),
          lt(table.time, end),
        ),
      columns: {
        time: true,
        [valueKey]: true,
      },
    });

    const totalsByDay = new Map<number, number>();

    for (const r of rows) {
      const day =
        Math.floor((((r as any).time as number) + LOCAL_OFFSET) / DAY_MS) *
        DAY_MS -
        LOCAL_OFFSET;

      const raw = (r as any)[valueKey];
      const value = typeof raw === "number" ? raw : Number(raw ?? 0);

      totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + value);
    }

    if (fillDateGaps) {
      for (let dt = start; dt < end; dt += DAY_MS) {
        if (!totalsByDay.has(dt)) totalsByDay.set(dt, 0);
      }
    }

    return Array.from(totalsByDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([date, value]) => ({ date: new Date(date), value }));
  };

  const loadTodayTotal = async (): Promise<number> =>
    (
      await loadDailyTotalInNumberRange(
        new Date().setHours(0, 0, 0, 0),
        new Date().setHours(24, 0, 0, 0),
        true,
      )
    )[0].value;

  const loadLast = async (): Promise<unknown> => {
    const row = await qb.findFirst({
      with: extraWith,
      where: persistentFilter ?? and(),
      orderBy: (table: any) => [desc(table.time)],
      columns: {
        time: true,
        [valueKey]: true,
      },
    });

    return row as unknown as Entity[];
  }

  return {
    loadInTimeNumberRange,
    loadToday,
    loadDailyTotalInNumberRange,
    loadTodayTotal,
    loadLast,
  };
}
