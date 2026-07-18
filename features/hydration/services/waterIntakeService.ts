import { db } from "@/db/db";
import { waterIntakeRecords } from "@/db/schema";
import { createSyncService } from "@/shared/services/createSyncService";
import { createTimeSeriesQueryService } from "@/shared/services/createTimeSeriesQueryService";
import { SyncEntityType } from "@/shared/services/syncTimeService";
import { eq, sql } from "drizzle-orm";
import { WaterIntakeRecord } from "../types/WaterIntakeRecord";

const syncService = createSyncService<
  typeof waterIntakeRecords,
  WaterIntakeRecord,
  {
    id: string;
    amountInMilliliters: number;
    time: string;
    modifiedAt: string;
    deleted: boolean;
  }
>({
  entityType: SyncEntityType.WaterIntakeRecords,
  table: waterIntakeRecords,
  endpoint: "/water-intake",
  collectionKey: "waterIntakeRecords",
  mapRemoteArrayToLocal: async (remote) =>
    // Normalize server field names and timestamps for local storage.
    remote.map(({ amountInMilliliters, ...record }) => ({
      ...record,
      amountInMl: amountInMilliliters,
      time: new Date(record.time).getTime(),
      modifiedAt: new Date(record.modifiedAt).getTime(),
    })),
  mapLocalArrayToRemote: async (local) =>
    // Convert local timestamps back to ISO strings before sync.
    local.map(({ amountInMl, ...record }) => ({
      ...record,
      amountInMilliliters: amountInMl,
      time: new Date(record.time).toISOString(),
      modifiedAt: new Date(record.modifiedAt).toISOString(),
    })),
  primaryKey: waterIntakeRecords.id,
  upsertSet: {
    amountInMl: sql.raw(`excluded.${waterIntakeRecords.amountInMl.name}`),
    time: sql.raw(`excluded.${waterIntakeRecords.time.name}`),
    modifiedAt: sql.raw(`excluded.${waterIntakeRecords.modifiedAt.name}`),
    deleted: sql.raw(`excluded.${waterIntakeRecords.deleted.name}`),
  },
});

const timeSeriesQueryService = createTimeSeriesQueryService(
  db.query.waterIntakeRecords,
  "amountInMl",
  undefined,
  eq(waterIntakeRecords.deleted, false),
);

export const waterIntakeService = {
  ...syncService,
  ...timeSeriesQueryService,
  loadInTimeNumberRange: (start: number, end: number) =>
    timeSeriesQueryService.loadInTimeNumberRange(start, end) as Promise<
      WaterIntakeRecord[]
    >,
  loadToday: () =>
    timeSeriesQueryService.loadToday() as Promise<WaterIntakeRecord[]>,
};
