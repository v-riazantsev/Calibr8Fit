import { db } from "@/db/db";
import { and, eq, gt, InferInsertModel, SQL } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import * as Crypto from "expo-crypto";
import { SyncConfig, SyncEntity } from "../types/sync";
import { api } from "./api";
import { syncTimeService } from "./syncTimeService";

export function createSyncService<
  TTable extends SQLiteTable,
  TLocal extends SyncEntity,
  TRemote,
>(config: SyncConfig<TTable, TLocal, TRemote>) {
  const {
    entityType,
    table,
    endpoint,
    collectionKey,
    mapRemoteArrayToLocal,
    mapLocalArrayToRemote,
    primaryKey,
    upsertSet,
    customLoad,
    customUpsert,
    customModifiedSince,
  } = config;

  const load = async (
    includeDeleted: boolean = false,
    loadWhere: ((alias: TTable) => SQL) | undefined = undefined,
  ): Promise<TLocal[]> => {
    if (customLoad) return await customLoad(includeDeleted);

    const base = eq((table as any).deleted, includeDeleted);
    const extra = loadWhere ? loadWhere(table) : loadWhere;
    const where = extra ? and(base, extra) : base;

    // Load data from the local database
    return (await db.select().from(table).where(where)) as unknown as TLocal[];
  };

  const fetch = async (): Promise<TLocal[]> => {
    try {
      // Fetch data from the server
      const response = (await api.request({
        endpoint,
        method: "GET",
      })) as TRemote[];
      // Map remote data to local format if a mapping function is provided
      return mapRemoteArrayToLocal
        ? mapRemoteArrayToLocal(response)
        : (response as unknown as TLocal[]);
    } catch (error) {
      console.error("Failed to fetch:", error);
      throw error;
    }
  };

  const add = async (
    data: Omit<InferInsertModel<TTable>, "id" | "modifiedAt">,
  ) => {
    try {
      // Insert a new entry into the database
      console.log("createdRecord", data);

      await db.insert(table).values({
        ...data,
        modifiedAt: Date.now(),
        id: Crypto.randomUUID(),
      } as TTable["$inferInsert"]);
    } catch (error) {
      console.error("Failed to insert local data:", error);
      throw error;
    }
    // Sync to ensure the data is synced with the server
    await sync();
  };

  const softDelete = async (id: string) => {
    try {
      // Mark the entry as deleted in the local database
      await db
        .update(table)
        .set({
          deleted: true,
          modifiedAt: Date.now(), // Update modifiedAt to current time
        } as TTable["$inferInsert"])
        .where(eq((table as any).id, id));
    } catch (error) {
      console.error("Failed to mark local data as deleted:", error);
      throw error;
    }
    // Sync to ensure the deletion is synced with the server
    await sync();
  };

  const lastUpdatedAt = async () =>
    new Date(
      await api.request({
        endpoint: `${endpoint}/last-updated-at`,
        method: "GET",
      }),
    ).getTime();

  const getModifiedSince = async (since: number): Promise<TLocal[]> => {
    if (customModifiedSince) return await customModifiedSince(since);
    return (await db
      .select()
      .from(table)
      .where(gt((table as any).modifiedAt, since))) as TLocal[];
  };

  const upsert = async (data: TLocal[]) => {
    if (customUpsert) await customUpsert(data);
    else
      await db
        .insert(table)
        .values(data)
        .onConflictDoUpdate({
          target: primaryKey as any,
          set: upsertSet as any,
        });
  };

  const sync = async () => {
    // Get the last sync time for the entity table
    const lastSync =
      await syncTimeService.getLastSyncTimeMilliseconds(entityType);
    try {
      // Fetch the last updated time from the server
      const updatedAt = await lastUpdatedAt();

      // Fetch modified entities since the last sync time
      const modifiedEntities = await getModifiedSince(lastSync);

      console.log(`Syncing ${entityType}:`, modifiedEntities);

      // If no new updates on either side, return local data
      if (updatedAt === lastSync && modifiedEntities.length === 0) return;

      // Sync modified entities with the server
      const response = (await api.request({
        endpoint: `${endpoint}/sync`,
        method: "POST",
        body: {
          lastSyncedAt: new Date(lastSync).toISOString(), // Convert to ISO string
          [collectionKey]: mapLocalArrayToRemote
            ? await mapLocalArrayToRemote(modifiedEntities)
            : (modifiedEntities as unknown as TRemote[]),
        },
      })) as {
        lastSyncedAt: string;
      } & Record<string, TRemote[]>;

      // Map remote data to local format if a mapping function is provided
      const inserts = mapRemoteArrayToLocal
        ? await mapRemoteArrayToLocal(response[collectionKey])
        : (response[collectionKey] as unknown as TLocal[]);

      // Insert new/updated entries
      if (inserts.length) await upsert(inserts);

      await syncTimeService.setLastSyncTimeMilliseconds(
        entityType,
        new Date(response.lastSyncedAt).getTime(),
      );
    } catch (e) {
      console.error("Failed to sync entities:", e);
      console.log(entityType);
    }
  };

  return { load, fetch, sync, add, softDelete };
}
