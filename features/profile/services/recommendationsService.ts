import { ActivityLevel } from "@/shared/types/enums/activityLevel";
import { Climate } from "@/shared/types/enums/climate";
import { Gender } from "@/shared/types/enums/gender";

const activityEstimateCaloriesBurned = (met: number, minutes: number, weight: number) => {
  const result = weight * met * minutes / 60;
  return Math.round(result);
};

// Mifflin-St Jeor Equation
const rmrCalculator = (
  gender: Gender,
  activityLevel: ActivityLevel,
  weight: number,
  height: number,
  age: number
) => {
  const genderValue = gender === Gender.Male ? 5 : -161;

  let activityMultiplier = 0;
  switch (activityLevel) {
    case ActivityLevel.Sedentary:
      activityMultiplier = 1.2;
      break;
    case ActivityLevel.Light:
      activityMultiplier = 1.375;
      break;
    case ActivityLevel.Moderately:
      activityMultiplier = 1.55;
      break;
    case ActivityLevel.High:
      activityMultiplier = 1.725;
      break;
    case ActivityLevel.Extreme:
      activityMultiplier = 1.9;
      break;
  }

  const result =
    ((10 * weight) +
      (6.25 * height) -
      (5 * age) +
      genderValue) *
    activityMultiplier;

  return Math.round(result);
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

const DIET_SHARE = 0.7;
const KCAL_PER_KG = 7700;
const MAX_WEEKLY_LOSS = 0.75;
const MAX_WEEKLY_GAIN = 0.5;

const dailyDelta = (
  weight: number,
  targetWeight: number,
) => {
  console.log("dailyDelta", weight, targetWeight);
  const diff = targetWeight - weight;

  if (diff === 0) return 0;

  const weeklyChange =
    diff < 0
      ? Math.min(Math.abs(diff), MAX_WEEKLY_LOSS)
      : Math.min(diff, MAX_WEEKLY_GAIN);

  const kcal =
    weeklyChange / 7 * KCAL_PER_KG;

  return diff < 0 ? -Math.round(kcal) : Math.round(kcal);
};

const consumptionCalculator = (
  gender: Gender,
  activityLevel: ActivityLevel,
  weight: number,
  targetWeight: number,
  height: number,
  age: number
) => {
  const maintenance = rmrCalculator(gender, activityLevel, weight, height, age); // should be TDEE
  const delta = dailyDelta(weight, targetWeight);
  return Math.round(maintenance + delta * DIET_SHARE);
};

const burningCalculator = (
  weight: number,
  targetWeight: number,
) =>
  Math.max(0, Math.round(-dailyDelta(weight, targetWeight) * 0.3));

// Daily water intake calculator 
const waterCalculator = (
  gender: Gender,
  activityLevel: ActivityLevel,
  weight: number,
  userClimate: Climate
) => {
  const genderMultiplier = gender === Gender.Male ? 0.035 : 0.03;

  const weightMultiplier = genderMultiplier * weight;

  let activityValue = 0;
  switch (activityLevel) {
    case ActivityLevel.Sedentary:
      activityValue = 0.09;
      break;
    case ActivityLevel.Light:
      activityValue = 0.18;
      break;
    case ActivityLevel.Moderately:
      activityValue = 0.35;
      break;
    case ActivityLevel.High:
      activityValue = 0.7;
      break;
    case ActivityLevel.Extreme:
      activityValue = 0.95;
      break;
  }

  let climateValue = 0;
  switch (userClimate) {
    case Climate.Cold:
      climateValue = 0;
      break;
    case Climate.Temperate:
      climateValue = 0.25;
      break;
    case Climate.Tropical:
      climateValue = 0.5;
      break;
  }

  const result = weightMultiplier + activityValue + climateValue;
  return Math.round(result * 10) / 10;
}

export const recommendationsService = {
  activityEstimateCaloriesBurned,
  rmrCalculator,
  waterCalculator,
  burningCalculator,
  consumptionCalculator,
};