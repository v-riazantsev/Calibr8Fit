import { db } from "@/db/db";
import { foods } from "@/db/schema";
import { api } from "@/shared/services/api";
import { SyncEntityType, syncTimeService } from "@/shared/services/syncTimeService";
import { Food } from "../types/food";

const loadFoods = async (): Promise<Food[]> => {
  return db.select().from(foods);
}

const syncFoods = async (): Promise<Food[]> => {
  // Get the last sync time for foods in unix seconds
  const lastSyncTime = await syncTimeService.getLastSyncTimeMilliseconds(SyncEntityType.Foods);

  try {
    // Fetch foods last update time
    const updatedAt = new Date(await api.request({
      endpoint: '/food/last-updated-at',
      method: 'GET',
    })).getTime();

    if (updatedAt < lastSyncTime)
      return loadFoods(); // No new updates, return local data

    const fetchedFoods = await fetchFoods();

    // Update the last sync time
    await syncTimeService.setLastSyncTimeMilliseconds(SyncEntityType.Foods, updatedAt);

    return fetchedFoods;
  } catch (e) {
    console.error('Failed to fetch last updated time for foods:', e);
    return loadFoods(); // Fallback to local data if API call fails
  }
}

const fetchFoods = async (): Promise<Food[]> => {
  const response = await api.request({
    endpoint: '/food',
    method: 'GET',
  }) as Food[];

  // Replace the cached food list in one shot.
  // Clear existing foods
  await db.delete(foods);

  // If no foods are returned, return an empty array
  if (response.length === 0) return [];

  // Insert new foods
  await db.insert(foods).values(response);

  return response;
}

export const foodService = {
  fetchFoods,
  loadFoods,
  syncFoods,
};
