export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  in_stock: boolean;
  price?: number;
  image_url?: string;
  ingredients?: string;
  nutrition: {
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    fiber_per_100g: number;
  };
  last_purchased?: string;
  rating?: number;
  last_edited: string;
}

// Database row type for items table
export interface DbItem {
  id: number;
  name: string;
  brand?: string | null;
  category?: string | null;
  in_stock?: boolean | null;
  price?: number | null;
  carbs_per_serving?: number | null;
  fat_per_serving?: number | null;
  protein_per_serving?: number | null;
  servings_per_container?: number | null;
  image_url?: string | null;
  ingredients?: string | null;
  nutrition_source?: string | null;
  barcode?: string | null;
  last_purchased?: string | null;
  purchase_count?: number | null;
  rating?: number | null;
  last_edited?: string | null;
  normalized_name?: string | null;
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
  cost_per_serving?: number;
  total_cost?: number;
  cost_last_calculated?: string;
  is_favorite?: boolean;
}

// Database row type for recipes table
export interface DbRecipe {
  id: number;
  name: string;
  cuisine_type?: string | null;
  meal_type?: string[] | null;
  difficulty?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
  servings?: number | null;
  instructions?: string | null;
  nutrition_per_serving?: Record<string, unknown> | null;
  tags?: string[] | null;
  rating?: number | null;
  source_link?: string | null;
  cost_per_serving?: number | null;
  total_cost?: number | null;
  cost_last_calculated?: string | null;
  notes?: string | null;
  times_cooked?: number | null;
  average_rating?: number | null;
  last_cooked?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RecipeIngredient {
  item_id: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
  cost_calculated_at?: string;
}

export interface MealLog {
  id: string;
  recipe_id: string; // Now mandatory
  date: string;
  meal_name: string;
  notes?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  estimated_cost: number; // Now mandatory, derived from recipe
}

// Database row type for meal_logs table
export interface DbMealLog {
  id: number;
  recipe_id?: number | null;
  cooked_at?: string | null;
  notes?: string | null;
  rating?: number | null;
  macros?: Record<string, unknown> | null;
  cost?: number | null;
  created_at?: string | null;
}

// ShoppingListItem interface removed - using in_stock toggle instead of separate shopping_list table