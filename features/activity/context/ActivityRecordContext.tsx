import { activityRecords } from "@/db/schema";
import { InferInsertModel } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { createContext, useEffect, useState } from "react";
import { activityRecordService } from "../services/activityRecordService";
import { ActivityRecord } from "../types/activityRecord";

interface ActivityRecordContextProps {
  todayRecords: ActivityRecord[];
  todayCaloriesBurned: number;
  addActivityRecord: (
    record: Omit<InferInsertModel<typeof activityRecords>, "id" | "modifiedAt">,
  ) => Promise<void>;
  deleteActivityRecord: (id: string) => Promise<void>;
  syncActivityRecords: () => Promise<void>;
  loadActivityRecords: () => Promise<ActivityRecord[]>;
  loadToday: () => Promise<ActivityRecord[]>;
  loadInTimeNumberRange: (
    start: number,
    end: number,
  ) => Promise<ActivityRecord[]>;
  todayActivityCaloriesBurned: (activityId: string) => number;
  loadDailyTotalInNumberRange: (
    start: Date,
    end: Date,
  ) => Promise<{ date: Date; value: number }[]>;
}

export const ActivityRecordContext =
  createContext<ActivityRecordContextProps | null>(null);

export const ActivityRecordProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [todayRecords, setTodayRecords] = useState<ActivityRecord[]>([]);
  const [todayCaloriesBurned, setTodayCaloriesBurned] = useState<number>(0);

  useEffect(() => {
    setTodayCaloriesBurned(
      todayRecords.reduce((total, record) => total + record.caloriesBurned, 0),
    );
  }, [todayRecords]);

  // Sync activity records when the component mounts
  useEffect(() => {
    syncActivityRecords();
  }, []);

  const addActivityRecord = async (
    record: Omit<InferInsertModel<typeof activityRecords>, "id" | "modifiedAt">,
  ) => {
    // Optimistically add the new record before the backend round trip.
    setTodayRecords((prevRecords) => [
      ...prevRecords,
      {
        ...record,
        id: Crypto.randomUUID(),
      } as ActivityRecord,
    ]);
    await activityRecordService.add(record);
    loadToday();
  };

  const deleteActivityRecord = async (id: string) => {
    // Remove the record locally first so the list feels immediate.
    setTodayRecords((prevRecords) =>
      prevRecords.filter((record) => record.id !== id),
    );
    await activityRecordService.softDelete(id);
    loadToday();
  };

  const syncActivityRecords = async () => {
    await activityRecordService.sync();
    loadToday();
  };

  const loadActivityRecords = async () => {
    const loadedRecords = await activityRecordService.load();
    return loadedRecords;
  };

  const loadToday = async () => {
    const loadedRecords = await activityRecordService.loadToday();
    setTodayRecords(loadedRecords);
    return loadedRecords;
  };

  const todayActivityCaloriesBurned = (activityId: string) =>
    // Sum both built-in and custom activities under the same identifier.
    todayRecords
      .filter(
        (record) =>
          record.activityId === activityId ||
          record.userActivityId === activityId,
      )
      .reduce((total, record) => total + record.caloriesBurned, 0);

  return (
    <ActivityRecordContext.Provider
      value={{
        ...activityRecordService,
        todayRecords,
        todayCaloriesBurned,
        addActivityRecord,
        deleteActivityRecord,
        syncActivityRecords,
        loadActivityRecords,
        loadToday,
        todayActivityCaloriesBurned,
      }}
    >
      {children}
    </ActivityRecordContext.Provider>
  );
};
