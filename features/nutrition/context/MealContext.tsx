import { createContext, useEffect, useState } from "react";
import { mealService } from "../services/mealService";
import { AddMeal, Meal } from "../types/meal";

interface MealContextProps {
  meals: Meal[];
  addMeal: (
    meal: AddMeal
  ) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  syncMeals: () => Promise<void>;
  loadMeals: () => Promise<Meal[]>;
  fetchMeals: () => Promise<Meal[]>;
}

export const MealContext = createContext<MealContextProps | null>(null);

export const MealProvider = (
  { children }: { children: React.ReactNode }
) => {
  const [meals, setMeals] = useState<Meal[]>([]);

  // Sync meals when the component mounts
  useEffect(() => {
    syncMeals();
  }, []);

  const addMeal = async (meal: AddMeal) => {
    await mealService.add(meal);
    loadMeals();
  };

  const deleteMeal = async (id: string) => {
    await mealService.softDelete(id);
    loadMeals();
  };

  const syncMeals = async () => {
    await mealService.sync();
    // Reload after sync so the UI reflects remote changes immediately.
    loadMeals();
  };

  const fetchMeals = async () => await mealService.fetch();

  const loadMeals = async () => {
    const loadedMeals = await mealService.load();
    setMeals(loadedMeals);
    return loadedMeals;
  };


  return (
    <MealContext.Provider value={{
      meals,
      addMeal,
      deleteMeal,
      syncMeals,
      fetchMeals,
      loadMeals
    }}>
      {children}
    </MealContext.Provider>
  );
};
