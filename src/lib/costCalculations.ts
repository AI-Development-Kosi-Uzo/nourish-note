import { FoodItem, RecipeIngredient } from '../types';

/**
 * Calculate the cost per unit for a food item based on its price and quantity
 */
export function calculateCostPerUnit(item: FoodItem): number {
  if (!item.price || !item.quantity || item.quantity === 0) {
    return 0;
  }
  return item.price / item.quantity;
}

/**
 * Calculate the total cost for a recipe ingredient based on quantity used
 */
export function calculateIngredientCost(
  item: FoodItem, 
  quantityUsed: number, 
  unitUsed: string
): number {
  const costPerUnit = calculateCostPerUnit(item);
  
  // For now, assume 1:1 unit conversion
  // In a real system, you'd have unit conversion logic here
  let adjustedQuantity = quantityUsed;
  
  // Simple unit conversion logic
  if (item.unit !== unitUsed) {
    // Convert common units
    adjustedQuantity = convertUnits(quantityUsed, unitUsed, item.unit);
  }
  
  return costPerUnit * adjustedQuantity;
}

/**
 * Simple unit conversion function
 * In production, this would be much more comprehensive
 */
function convertUnits(quantity: number, fromUnit: string, toUnit: string): number {
  // Normalize unit names
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  
  if (from === to) return quantity;
  
  // Simple conversions (this would be expanded in production)
  const conversions: Record<string, Record<string, number>> = {
    'cup': { 'cups': 1, 'oz': 8, 'ml': 236.588 },
    'cups': { 'cup': 1, 'oz': 8, 'ml': 236.588 },
    'oz': { 'cup': 0.125, 'cups': 0.125, 'g': 28.3495 },
    'g': { 'oz': 0.035274, 'kg': 0.001 },
    'kg': { 'g': 1000, 'lbs': 2.20462 },
    'lbs': { 'kg': 0.453592, 'oz': 16 },
    'piece': { 'pieces': 1 },
    'pieces': { 'piece': 1 }
  };
  
  if (conversions[from] && conversions[from][to]) {
    return quantity * conversions[from][to];
  }
  
  // If no conversion found, assume 1:1
  return quantity;
}

/**
 * Calculate the total cost for a recipe based on its ingredients
 */
export function calculateRecipeTotalCost(
  ingredients: RecipeIngredient[],
  foodItems: FoodItem[]
): { totalCost: number; costPerServing: number; servings: number } {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    const item = foodItems.find(item => item.id === ingredient.item_id);
    if (item) {
      const ingredientCost = calculateIngredientCost(
        item, 
        ingredient.quantity, 
        ingredient.unit
      );
      totalCost += ingredientCost;
    }
  }
  
  return {
    totalCost,
    costPerServing: 0, // Will be calculated based on servings
    servings: 1 // Default, should be passed in
  };
}

/**
 * Calculate cost breakdown for each ingredient in a recipe
 */
export function calculateRecipeCostBreakdown(
  ingredients: RecipeIngredient[],
  foodItems: FoodItem[]
): Array<{
  ingredient: RecipeIngredient;
  item: FoodItem | undefined;
  costPerUnit: number;
  totalCost: number;
  percentage: number;
}> {
  const breakdown = ingredients.map(ingredient => {
    const item = foodItems.find(item => item.id === ingredient.item_id);
    const costPerUnit = item ? calculateCostPerUnit(item) : 0;
    const totalCost = item ? calculateIngredientCost(item, ingredient.quantity, ingredient.unit) : 0;
    
    return {
      ingredient,
      item,
      costPerUnit,
      totalCost,
      percentage: 0 // Will be calculated after we have total
    };
  });
  
  const totalRecipeCost = breakdown.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate percentages
  breakdown.forEach(item => {
    item.percentage = totalRecipeCost > 0 ? (item.totalCost / totalRecipeCost) * 100 : 0;
  });
  
  return breakdown;
}

/**
 * Update recipe ingredient costs with current prices
 */
export function updateRecipeIngredientCosts(
  ingredients: RecipeIngredient[],
  foodItems: FoodItem[]
): RecipeIngredient[] {
  return ingredients.map(ingredient => {
    const item = foodItems.find(item => item.id === ingredient.item_id);
    if (item) {
      const costPerUnit = calculateCostPerUnit(item);
      const totalCost = calculateIngredientCost(item, ingredient.quantity, ingredient.unit);
      
      return {
        ...ingredient,
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        cost_calculated_at: new Date().toISOString()
      };
    }
    return ingredient;
  });
}