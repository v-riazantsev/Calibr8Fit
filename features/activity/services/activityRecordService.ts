import { db } from "@/db/db";
import { activities, activityRecords } from "@/db/schema";
import { createSyncService } from "@/shared/services/createSyncService";
import { createTimeSeriesQueryService } from "@/shared/services/createTimeSeriesQueryService";
import { SyncEntityType } from "@/shared/services/syncTimeService";
import { eq, inArray, sql } from "drizzle-orm";
import { ActivityRecord } from "../types/activityRecord";

const syncService = createSyncService<
  typeof activityRecords,
  ActivityRecord,
  {
    id: string;
    activityId: string;
    duration: number;
    caloriesBurned: number;
    time: string;
    modifiedAt: string;
    deleted: boolean;
  }
>({
  entityType: SyncEntityType.ActivityRecords,
  table: activityRecords,
  endpoint: "/activity-record",
  collectionKey: "activityRecords",
  mapRemoteArrayToLocal: async (remote) => {
    const activitiesIdSet = new Set(
      (
        await db
          .select({ id: activities.id })
          .from(activities)
          .where(
            inArray(
              activities.id,
              remote.map((record) => record.id),
            ),
          )
      ).map((row) => row.id),
    );

    return remote.map((record) => ({
      ...record,
      // Keep custom activities when the record no longer points to a built-in one.
      activityId: activitiesIdSet.has(record.activityId)
        ? record.activityId
        : null,
      userActivityId: activitiesIdSet.has(record.activityId)
        ? null
        : record.activityId,
      time: new Date(record.time).getTime(), // Convert to unix timestamp
      modifiedAt: new Date(record.modifiedAt).getTime(), // Convert to unix timestamp
    })) as ActivityRecord[];
  },
  mapLocalArrayToRemote: async (local) =>
    local.map(({ userActivityId, ...record }) => ({
      ...record,
      activityId: record.activityId || userActivityId!, // Use activityId or userActivityId
      modifiedAt: new Date(record.modifiedAt).toISOString(), // Convert to ISO string for the server
      time: new Date(record.time).toISOString(), // Convert to ISO string for the server
    })),
  primaryKey: activityRecords.id,
  upsertSet: {
    activityId: sql.raw(`excluded.${activityRecords.activityId.name}`),
    userActivityId: sql.raw(`excluded.${activityRecords.userActivityId.name}`),
    duration: sql.raw(`excluded.${activityRecords.duration.name}`),
    caloriesBurned: sql.raw(`excluded.${activityRecords.caloriesBurned.name}`),
    time: sql.raw(`excluded.${activityRecords.time.name}`),
    modifiedAt: sql.raw(`excluded.${activityRecords.modifiedAt.name}`),
    deleted: sql.raw(`excluded.${activityRecords.deleted.name}`),
  },
});

const timeSeriesQueryService = createTimeSeriesQueryService(
  db.query.activityRecords,
  "caloriesBurned",
  {
    activity: true,
    userActivity: true,
  } as const,
  eq(activityRecords.deleted, false),
);

export const activityRecordService = {
  ...syncService,
  ...timeSeriesQueryService,
  loadToday: () =>
    timeSeriesQueryService.loadToday() as Promise<ActivityRecord[]>,
  loadInTimeNumberRange: (start: number, end: number) =>
    timeSeriesQueryService.loadInTimeNumberRange(start, end) as Promise<
      ActivityRecord[]
    >,
};
