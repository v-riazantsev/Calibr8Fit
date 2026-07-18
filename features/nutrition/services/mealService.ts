import { db } from "@/db/db";
import { foods, userFoods, userMealIngredients, userMeals } from "@/db/schema";
import { createSyncService } from "@/shared/services/createSyncService";
import { SyncEntityType } from "@/shared/services/syncTimeService";
import { eq, gt, inArray, InferInsertModel, sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { AddMeal, Meal, MealIngredient } from "../types/meal";

const upsert = async (data: Meal[]) => {
  // Select all food IDs and make a Set
  const foodIdsArray = await db.select({ id: foods.id }).from(foods);
  const userFoodIdsArray = await db
    .select({ id: userFoods.id })
    .from(userFoods);
  const foodIdsSet = new Set(foodIdsArray.map((f) => f.id));
  const userFoodIdsSet = new Set(userFoodIdsArray.map((f) => f.id));

  // Clear existing meal ingredients for the meals being upserted
  const mealIds = data.map((meal) => meal.id);
  await db
    .delete(userMealIngredients)
    .where(inArray(userMealIngredients.userMealId, mealIds));

  // Upsert meal ingredients
  await db.insert(userMealIngredients).values(
    data.flatMap((meal) =>
      meal.ingredients.map((ingredient) => ({
        id: Crypto.randomUUID(),
        userMealId: meal.id,
        foodId: foodIdsSet.has(ingredient.foodId!)
          ? ingredient.foodId
          : undefined,
        userFoodId: userFoodIdsSet.has(ingredient.foodId!)
          ? ingredient.foodId
          : undefined,
        quantity: ingredient.quantity,
      })),
    ),
  );

  // Upsert meals
  await db
    .insert(userMeals)
    .values(
      data.map((meal) => ({
        id: meal.id,
        name: meal.name,
        notes: meal.notes,
        modifiedAt: meal.modifiedAt,
        deleted: meal.deleted,
      })),
    )
    .onConflictDoUpdate({
      target: userMeals.id,
      set: {
        name: sql.raw(`excluded.${userMeals.name.name}`),
        notes: sql.raw(`excluded.${userMeals.notes.name}`),
        modifiedAt: sql.raw(`excluded.${userMeals.modifiedAt.name}`),
        deleted: sql.raw(`excluded.${userMeals.deleted.name}`),
      },
    });
};

const getModifiedSince = async (since: number): Promise<Meal[]> => {
  // Fetch meals modified since the given timestamp
  const meals = await db
    .select()
    .from(userMeals)
    .where(gt(userMeals.modifiedAt, since));

  if (meals.length === 0) return [];

  const mealIds = meals.map((meal) => meal.id);
  const ingredients = await db
    .select()
    .from(userMealIngredients)
    .where(inArray(userMealIngredients.userMealId, mealIds));

  const ingredientsByMealId: Record<string, typeof ingredients> = {};
  for (const ingredient of ingredients) {
    if (!ingredientsByMealId[ingredient.userMealId])
      ingredientsByMealId[ingredient.userMealId] = [];
    ingredientsByMealId[ingredient.userMealId].push(ingredient);
  }

  return meals.map((meal) => ({
    ...meal,
    mealIngredients: (ingredientsByMealId[meal.id] || []).map((ingredient) => ({
      ...ingredient,
      foodId: ingredient.foodId === null ? undefined : ingredient.foodId,
      userFoodId:
        ingredient.userFoodId === null ? undefined : ingredient.userFoodId,
    })),
  }));
};

const add = async (meal: AddMeal) => {
  try {
    const mealId = Crypto.randomUUID();

    // Insert meal ingredients
    await db.insert(userMealIngredients).values(
      meal.mealIngredients.map((ingredient) => ({
        id: Crypto.randomUUID(),
        userMealId: mealId,
        foodId: ingredient.foodId,
        userFoodId: ingredient.userFoodId,
        quantity: ingredient.quantity,
      })),
    );

    // Insert meal
    await db.insert(userMeals).values({
      id: mealId,
      name: meal.name,
      notes: meal.notes,
      modifiedAt: Date.now(),
    } as InferInsertModel<typeof userMeals>);
  } catch (error) {
    console.error("Failed to insert local data:", error);
    throw error;
  }
  await syncService.sync();
};

const load = async (): Promise<Meal[]> => {
  const meals = await db.select().from(userMeals);

  if (meals.length === 0) return [];

  const mealIds = meals.map((meal) => meal.id);
  const ingredients = (
    await db
      .select()
      .from(userMealIngredients)
      .where(inArray(userMealIngredients.userMealId, mealIds))
      .leftJoin(foods, eq(userMealIngredients.foodId, foods.id))
      .leftJoin(userFoods, eq(userMealIngredients.userFoodId, userFoods.id))
  ).map(({ user_meal_ingredients, foods, user_foods }) => ({
    ...user_meal_ingredients,
    food: foods,
    userFood: user_foods,
  })) as MealIngredient[];

  const ingredientsByMealId: Record<string, MealIngredient[]> = {};
  for (const ingredient of ingredients) {
    if (!ingredientsByMealId[ingredient.userMealId])
      ingredientsByMealId[ingredient.userMealId] = [];
    ingredientsByMealId[ingredient.userMealId].push(ingredient);
  }

  return meals.map((meal) => ({
    ...meal,
    mealIngredients: (ingredientsByMealId[meal.id] || []).map((ingredient) => ({
      ...ingredient,
      foodId: ingredient.foodId === null ? undefined : ingredient.foodId,
      userFoodId:
        ingredient.userFoodId === null ? undefined : ingredient.userFoodId,
    })),
  }));
};

const syncService = createSyncService<
  typeof userMeals,
  Meal,
  {
    id: string;
    name: string;
    notes: string | null;
    mealItems: {
      foodId: string;
      quantity: number;
    }[];
    modifiedAt: string; // ISO date string from the server
    deleted: boolean;
  }
>({
  entityType: SyncEntityType.Meals,
  table: userMeals,
  endpoint: "/user-meal",
  collectionKey: "userMeals",
  mapRemoteArrayToLocal: async (remote) =>
    remote.map((meal) => ({
      ...meal,
      mealIngredients: meal.mealItems.map((item) => ({
        id: "",
        ...item,
        userMealId: meal.id,
      })),
      modifiedAt: new Date(meal.modifiedAt).getTime(), // Convert to unix timestamp
    })),
  mapLocalArrayToRemote: async (local) =>
    local.map((meal) => ({
      ...meal,
      mealItems: meal.ingredients.map((item) => ({
        ...item,
        foodId: item.foodId ?? item.userFoodId!,
        mealId: item.id,
      })),
      modifiedAt: new Date(meal.modifiedAt).toISOString(), // Convert to ISO string for the server
    })),
  primaryKey: userMeals.id,
  upsertSet: {
    name: sql.raw(`excluded.${userMeals.name.name}`),
    notes: sql.raw(`excluded.${userMeals.notes.name}`),
    modifiedAt: sql.raw(`excluded.${userMeals.modifiedAt.name}`),
    deleted: sql.raw(`excluded.${userMeals.deleted.name}`),
  },
  // Meals need a custom merge because ingredients live in a separate table.
  customUpsert: upsert,
  customModifiedSince: getModifiedSince,
});

export const mealService = {
  ...syncService,
  add,
  load,
};
