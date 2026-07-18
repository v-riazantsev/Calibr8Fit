import { createContext, useCallback, useEffect, useState } from "react";
import { waterIntakeService } from "../services/waterIntakeService";
import { WaterIntakeRecord } from "../types/WaterIntakeRecord";

interface WaterIntakeContextProps {
  todayWaterIntakeInMl: number;
  syncWaterIntake: () => Promise<void>;
  loadWaterIntake: () => Promise<WaterIntakeRecord[]>;
  loadToday: () => Promise<WaterIntakeRecord[]>;
  addWaterIntakeRecord: (record: {
    time: number;
    amountInMl: number;
  }) => Promise<void>;
  loadInTimeNumberRange: (
    start: number,
    end: number,
  ) => Promise<WaterIntakeRecord[]>;
  loadDailyTotalInNumberRange: (
    start: Date,
    end: Date,
  ) => Promise<{ date: Date; value: number }[]>;
}

export const WaterIntakeContext = createContext<WaterIntakeContextProps | null>(
  null,
);

export const WaterIntakeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [todayWaterIntakeInMl, setTodayWaterIntakeInMl] = useState<number>(0);
  const [todayWaterIntakeRecords, setTodayWaterIntakeRecords] = useState<
    WaterIntakeRecord[]
  >([]);

  const syncWaterIntake = useCallback(async () => {
    await waterIntakeService.sync();
    // Reload after sync so the daily total reflects remote updates.
    loadToday();
  }, []);

  // Sync water intake records when the component mounts
  useEffect(() => {
    syncWaterIntake();
  }, [syncWaterIntake]);

  useEffect(() => {
    setTodayWaterIntakeInMl(
      todayWaterIntakeRecords.reduce(
        (total, record) => total + record.amountInMl,
        0,
      ),
    );
  }, [todayWaterIntakeRecords]);

  const addWaterIntakeRecord = async (record: {
    time: number;
    amountInMl: number;
  }) => {
    console.log("Adding water intake record:", record);
    await waterIntakeService.add(record);
    // Re-read today's records after inserting a new entry.
    loadToday();
  };

  const loadWaterIntake = waterIntakeService.load;

  const loadToday = async () => {
    const records = await waterIntakeService.loadToday();
    setTodayWaterIntakeRecords(records);
    return records;
  };

  return (
    <WaterIntakeContext.Provider
      value={{
        ...waterIntakeService,
        todayWaterIntakeInMl,
        syncWaterIntake,
        loadWaterIntake,
        addWaterIntakeRecord,
        loadToday,
      }}
    >
      {children}
    </WaterIntakeContext.Provider>
  );
};
