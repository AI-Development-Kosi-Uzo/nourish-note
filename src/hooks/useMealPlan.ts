import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
}

export function useMealPlan() {
  const [plan, setPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const mappedPlan: MealPlanEntry[] = data.map((dbEntry: Record<string, unknown>) => ({
        id: dbEntry.id.toString(),
        date: dbEntry.date,
        mealType: dbEntry.meal_type as MealType,
        recipeId: dbEntry.recipe_id.toString(),
      }));
      
      setPlan(mappedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const setMeal = async (date: string, mealType: MealType, recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .upsert([{
          date,
          meal_type: mealType,
          recipe_id: parseInt(recipeId),
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newEntry: MealPlanEntry = {
        id: data.id.toString(),
        date,
        mealType,
        recipeId,
      };
      
      setPlan((prev) => {
        const idx = prev.findIndex((p) => p.date === date && p.mealType === mealType);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newEntry;
          return updated;
        }
        return [...prev, newEntry];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set meal');
      throw err;
    }
  };

  const clearMeal = async (date: string, mealType: MealType) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('date', date)
        .eq('meal_type', mealType);
      
      if (error) throw error;
      
      setPlan((prev) => prev.filter((p) => !(p.date === date && p.mealType === mealType)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear meal');
      throw err;
    }
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

  return { 
    plan, 
    loading,
    error,
    setMeal, 
    clearMeal, 
    getPlanForDate, 
    getPlansInRange,
    refetch: loadMealPlan,
  };
}
