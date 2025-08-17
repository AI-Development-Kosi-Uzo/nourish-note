export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  in_stock: boolean;
  unit: string;
  quantity: number;
  price?: number;
  image_url?: string;
  nutrition: {
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    fiber_per_100g: number;
  };
  last_purchased?: string;
  last_edited: string;
}

export interface Recipe {
  id: string;
  name: string;
  instructions: string;
  servings: number;
  prep_time_minutes?: number;
  ingredients: RecipeIngredient[];
  nutrition: {
    calories_per_serving: number;
    protein_per_serving: number;
    carbs_per_serving: number;
    fat_per_serving: number;
  };
  is_favorite?: boolean;
}

export interface RecipeIngredient {
  item_id: string;
  quantity: number;
  unit: string;
}

export interface MealLog {
  id: string;
  recipe_id?: string;
  date: string;
  meal_name: string;
  notes?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  estimated_cost?: number;
}

export interface ShoppingListItem {
  item_id: string;
  added_at: string;
}