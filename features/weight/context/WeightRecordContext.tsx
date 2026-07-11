import { useProfile } from "@/features/profile/hooks/useProfile";
import * as Crypto from "expo-crypto";
import { createContext, useEffect, useState } from "react";
import { weightRecordService } from "../services/weightRecordService";
import { WeightRecord } from "../types/WeightRecord";

interface WeightRecordContextProps {
  weight: number;
  syncWeightRecords: () => Promise<void>;
  loadWeightRecords: () => Promise<WeightRecord[]>;
  loadToday: () => Promise<WeightRecord[]>;
  addWeightRecord: (record: { time: number; weight: number }) => Promise<void>;
  loadInTimeNumberRange: (
    start: number,
    end: number,
  ) => Promise<WeightRecord[]>;
  loadDailyTotalInNumberRange: (
    start: Date,
    end: Date,
  ) => Promise<{ date: Date; value: number }[]>;
}

export const WeightRecordContext =
  createContext<WeightRecordContextProps | null>(null);

export const WeightRecordProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { profileSettings, updateProfileSettings } = useProfile();

  const [weight, setWeight] = useState<number>(0);
  const [todayWeightRecords, setTodayWeightRecords] = useState<WeightRecord[]>(
    [],
  );
  const [lastWeightRecord, setLastWeightRecord] = useState<WeightRecord | null>(
    null,
  );

  // Sync weight records when the component mounts
  useEffect(() => {
    syncWeightRecords();
  }, []);

  useEffect(() => {
    setWeight(
      todayWeightRecords.length > 0
        ? todayWeightRecords[todayWeightRecords.length - 1].weight
        : lastWeightRecord?.weight ?? 0,
    );
  }, [todayWeightRecords, lastWeightRecord]);

  const syncWeightRecords = async () => {
    await weightRecordService.sync();
    loadToday();
  };

  const addWeightRecord = async (record: { time: number; weight: number }) => {
    setTodayWeightRecords((prevRecords) => [
      ...prevRecords,
      {
        ...record,
        id: Crypto.randomUUID(),
      } as WeightRecord,
    ]);

    await weightRecordService.add(record);

    loadToday();
  };

  const loadWeightRecords = weightRecordService.load;

  const loadToday = async () => {
    const records = await weightRecordService.loadToday();
    setTodayWeightRecords(records);
    const lastRecord = records.length > 0 ? records[records.length - 1] : await weightRecordService.loadLast();
    setLastWeightRecord(lastRecord);
    return records;
  };

  return (
    <WeightRecordContext.Provider
      value={{
        ...weightRecordService,
        weight,
        syncWeightRecords,
        loadWeightRecords,
        addWeightRecord,
        loadToday,
      }}
    >
      {children}
    </WeightRecordContext.Provider>
  );
};
