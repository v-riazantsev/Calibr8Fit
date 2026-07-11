import { db } from "@/db/db";
import { weightRecords } from "@/db/schema";
import { createSyncService } from "@/shared/services/createSyncService";
import { createTimeSeriesQueryService } from "@/shared/services/createTimeSeriesQueryService";
import { SyncEntityType } from "@/shared/services/syncTimeService";
import { eq, sql } from "drizzle-orm";
import { WeightRecord } from "../types/WeightRecord";

const syncService = createSyncService<
  typeof weightRecords,
  WeightRecord,
  {
    id: string;
    weight: number;
    time: string;
    modifiedAt: string;
    deleted: boolean;
  }
>({
  entityType: SyncEntityType.WeightRecords,
  table: weightRecords,
  endpoint: "/weight",
  collectionKey: "weightRecords",
  mapRemoteArrayToLocal: async (remote) =>
    remote.map((record) => ({
      ...record,
      time: new Date(record.time).getTime(),
      modifiedAt: new Date(record.modifiedAt).getTime(),
    })),
  mapLocalArrayToRemote: async (local) =>
    local.map((record) => ({
      ...record,
      time: new Date(record.time).toISOString(),
      modifiedAt: new Date(record.modifiedAt).toISOString(),
    })),
  primaryKey: weightRecords.id,
  upsertSet: {
    weight: sql.raw(`excluded.${weightRecords.weight.name}`),
    time: sql.raw(`excluded.${weightRecords.time.name}`),
    modifiedAt: sql.raw(`excluded.${weightRecords.modifiedAt.name}`),
    deleted: sql.raw(`excluded.${weightRecords.deleted.name}`),
  },
});

const timeSeriesQueryService = createTimeSeriesQueryService(
  db.query.weightRecords,
  "weight",
  undefined,
  eq(weightRecords.deleted, false),
);

export const weightRecordService = {
  ...syncService,
  ...timeSeriesQueryService,
  loadInTimeNumberRange: (start: number, end: number) =>
    timeSeriesQueryService.loadInTimeNumberRange(start, end) as Promise<
      WeightRecord[]
    >,
  loadToday: () =>
    timeSeriesQueryService.loadToday() as Promise<WeightRecord[]>,
  loadLast: () =>
    timeSeriesQueryService.loadLast() as Promise<WeightRecord>,
};
