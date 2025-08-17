import { FoodItem, DbItem, Recipe, DbRecipe, MealLog, DbMealLog, RecipeIngredient } from '../types';

// Convert database item to FoodItem format
export function dbItemToFoodItem(dbItem: DbItem): FoodItem {
  return {
    id: dbItem.id.toString(),
    name: dbItem.name,
    brand: dbItem.brand || undefined,
    category: dbItem.category || 'Other',
    in_stock: dbItem.in_stock ?? true,
    price: dbItem.price !== null ? Number(dbItem.price) : undefined,
    image_url: dbItem.image_url || undefined,
    ingredients: dbItem.ingredients || undefined,
    nutrition: {
      calories_per_100g: calculateCaloriesPer100g(dbItem),
      protein_per_100g: (dbItem.protein_per_serving || 0) * 100 / (dbItem.servings_per_container || 1),
      carbs_per_100g: (dbItem.carbs_per_serving || 0) * 100 / (dbItem.servings_per_container || 1),
      fat_per_100g: (dbItem.fat_per_serving || 0) * 100 / (dbItem.servings_per_container || 1),
      fiber_per_100g: 0, // Not in database schema
    },
    last_purchased: dbItem.last_purchased || undefined,
    rating: dbItem.rating || undefined,
    last_edited: dbItem.last_edited || new Date().toISOString(),
  };
}

// Convert FoodItem to database insert format
export function foodItemToDbInsert(item: Omit<FoodItem, 'id'>): Omit<DbItem, 'id' | 'normalized_name'> {
  return {
    name: item.name,
    brand: item.brand || null,
    category: item.category,
    in_stock: item.in_stock,
    price: item.price || null,
    carbs_per_serving: item.nutrition.carbs_per_100g / 100,
    fat_per_serving: item.nutrition.fat_per_100g / 100,
    protein_per_serving: item.nutrition.protein_per_100g / 100,
    servings_per_container: 1,
    image_url: item.image_url || null,
    ingredients: item.ingredients || null,
    nutrition_source: 'manual',
    barcode: null,
    rating: item.rating || null,
    last_edited: item.last_edited,
  };
}

// Convert database recipe to Recipe format
export function dbRecipeToRecipe(dbRecipe: DbRecipe, ingredients: RecipeIngredient[] = []): Recipe {
  const nutrition = dbRecipe.nutrition_per_serving || {};
  
  return {
    id: dbRecipe.id.toString(),
    name: dbRecipe.name,
    instructions: dbRecipe.instructions || '',
    servings: dbRecipe.servings || 1,
    prep_time_minutes: dbRecipe.prep_time || undefined,
    ingredients,
    nutrition: {
      calories_per_serving: nutrition.calories || 0,
      protein_per_serving: nutrition.protein || 0,
      carbs_per_serving: nutrition.carbs || 0,
      fat_per_serving: nutrition.fat || 0,
    },
    cost_per_serving: dbRecipe.cost_per_serving || undefined,
    total_cost: dbRecipe.total_cost || undefined,
    cost_last_calculated: dbRecipe.cost_last_calculated || undefined,
    is_favorite: dbRecipe.average_rating ? dbRecipe.average_rating >= 4 : false,
  };
}

// Convert Recipe to database insert format
export function recipeToDbInsert(recipe: Omit<Recipe, 'id'>): Omit<DbRecipe, 'id' | 'created_at' | 'updated_at' | 'times_cooked' | 'average_rating' | 'last_cooked'> {
  return {
    name: recipe.name,
    cuisine_type: null,
    meal_type: null,
    difficulty: null,
    prep_time: recipe.prep_time_minutes || null,
    cook_time: null,
    total_time: recipe.prep_time_minutes || null,
    servings: recipe.servings,
    instructions: recipe.instructions,
    nutrition_per_serving: recipe.nutrition,
    tags: null,
    rating: recipe.is_favorite ? 5 : null,
    source_link: null,
    cost_per_serving: null,
    notes: null,
  };
}

// Convert database meal log to MealLog format
export function dbMealLogToMealLog(dbMealLog: DbMealLog): MealLog | null {
  // Skip meal logs without recipe_id as they are now mandatory
  if (!dbMealLog.recipe_id) {
    return null;
  }
  
  const macros = dbMealLog.macros || {};
  
  return {
    id: dbMealLog.id.toString(),
    recipe_id: dbMealLog.recipe_id.toString(),
    date: dbMealLog.cooked_at || new Date().toISOString().split('T')[0],
    meal_name: 'Meal', // Default name since it's not in the database
    notes: dbMealLog.notes || undefined,
    nutrition: {
      calories: macros.calories || 0,
      protein: macros.protein || 0,
      carbs: macros.carbs || 0,
      fat: macros.fat || 0,
    },
    estimated_cost: dbMealLog.cost || 0,
  };
}

// Convert MealLog to database insert format
export function mealLogToDbInsert(mealLog: Omit<MealLog, 'id'>): Omit<DbMealLog, 'id' | 'created_at'> {
  return {
    recipe_id: parseInt(mealLog.recipe_id), // Now mandatory, no null check needed
    cooked_at: mealLog.date,
    notes: mealLog.notes || null,
    rating: null,
    macros: mealLog.nutrition,
    cost: mealLog.estimated_cost,
  };
}

// Helper function to calculate calories per 100g
function calculateCaloriesPer100g(dbItem: DbItem): number {
  const caloriesPerServing = (dbItem.protein_per_serving || 0) * 4 + 
                            (dbItem.carbs_per_serving || 0) * 4 + 
                            (dbItem.fat_per_serving || 0) * 9;
  return caloriesPerServing * 100 / (dbItem.servings_per_container || 1);
}