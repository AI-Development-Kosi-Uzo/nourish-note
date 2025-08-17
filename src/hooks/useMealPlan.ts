import { useLocalStorage } from './useLocalStorage';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
}

export function useMealPlan() {
  const [plan, setPlan] = useLocalStorage<MealPlanEntry[]>('meal-plan', []);

  const setMeal = (date: string, mealType: MealType, recipeId: string) => {
    setPlan((prev) => {
      const idx = prev.findIndex((p) => p.date === date && p.mealType === mealType);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], recipeId };
        return updated;
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          date,
          mealType,
          recipeId,
        },
      ];
    });
  };

  const clearMeal = (date: string, mealType: MealType) => {
    setPlan((prev) => prev.filter((p) => !(p.date === date && p.mealType === mealType)));
  };

  const getPlanForDate = (date: string) => {
    const byMeal: Record<MealType, string | undefined> = {
      breakfast: undefined,
      lunch: undefined,
      dinner: undefined,
    };
    for (const p of plan) {
      if (p.date === date) byMeal[p.mealType] = p.recipeId;
    }
    return byMeal;
  };

  const getPlansInRange = (startDate: string, endDate: string) =>
    plan.filter((p) => p.date >= startDate && p.date <= endDate);

  return { plan, setMeal, clearMeal, getPlanForDate, getPlansInRange };
}
