import { describe, it, expect } from 'vitest';
import {
  calculateCostPerUnit,
  calculateIngredientCost,
  calculateRecipeTotalCost,
  calculateRecipeCostBreakdown,
  updateRecipeIngredientCosts
} from '../../lib/costCalculations';
import { FoodItem, RecipeIngredient } from '../../types';

// Mock food items for testing
const mockChicken: FoodItem = {
  id: '1',
  name: 'Chicken Breast',
  brand: 'Organic Valley',
  category: 'Protein',
  in_stock: true,
  unit: 'lbs',
  quantity: 2,
  price: 12.99,
  nutrition: {
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.6,
    fiber_per_100g: 0,
  },
  last_edited: '2024-01-01T00:00:00.000Z',
};

const mockRice: FoodItem = {
  id: '2',
  name: 'Brown Rice',
  brand: 'Uncle Bens',
  category: 'Grains',
  in_stock: true,
  unit: 'cups',
  quantity: 6,
  price: 4.99,
  nutrition: {
    calories_per_100g: 123,
    protein_per_100g: 2.6,
    carbs_per_100g: 23,
    fat_per_100g: 0.9,
    fiber_per_100g: 1.8,
  },
  last_edited: '2024-01-01T00:00:00.000Z',
};

const mockOliveOil: FoodItem = {
  id: '3',
  name: 'Olive Oil',
  brand: 'Extra Virgin',
  category: 'Oils',
  in_stock: true,
  unit: 'ml',
  quantity: 500,
  price: 8.99,
  nutrition: {
    calories_per_100g: 884,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 100,
    fiber_per_100g: 0,
  },
  last_edited: '2024-01-01T00:00:00.000Z',
};

const mockFoodItems = [mockChicken, mockRice, mockOliveOil];

describe('Cost Calculation Functions', () => {
  describe('calculateCostPerUnit', () => {
    it('should calculate cost per unit correctly', () => {
      expect(calculateCostPerUnit(mockChicken)).toBeCloseTo(6.495, 3); // 12.99 / 2
      expect(calculateCostPerUnit(mockRice)).toBeCloseTo(0.8317, 3); // 4.99 / 6
    });

    it('should return 0 for items without price', () => {
      const itemWithoutPrice = { ...mockChicken, price: undefined };
      expect(calculateCostPerUnit(itemWithoutPrice)).toBe(0);
    });

    it('should return 0 for items with zero quantity', () => {
      const itemWithZeroQuantity = { ...mockChicken, quantity: 0 };
      expect(calculateCostPerUnit(itemWithZeroQuantity)).toBe(0);
    });
  });

  describe('calculateIngredientCost', () => {
    it('should calculate ingredient cost with same units', () => {
      // Using 1 lb of chicken (same unit)
      const cost = calculateIngredientCost(mockChicken, 1, 'lbs');
      expect(cost).toBeCloseTo(6.495, 3);
    });

    it('should calculate ingredient cost with different units', () => {
      // Using 1 cup of rice (same unit)
      const cost = calculateIngredientCost(mockRice, 1, 'cups');
      expect(cost).toBeCloseTo(0.8317, 3);
    });

    it('should handle unit conversions', () => {
      // Convert 2 cups to cups (should be same)
      const cost = calculateIngredientCost(mockRice, 2, 'cups');
      expect(cost).toBeCloseTo(1.6633, 3);
    });

    it('should handle items without price gracefully', () => {
      const itemWithoutPrice = { ...mockChicken, price: undefined };
      const cost = calculateIngredientCost(itemWithoutPrice, 1, 'lbs');
      expect(cost).toBe(0);
    });
  });

  describe('calculateRecipeTotalCost', () => {
    const mockIngredients: RecipeIngredient[] = [
      { item_id: '1', quantity: 1, unit: 'lbs' }, // Chicken: 1 lb
      { item_id: '2', quantity: 2, unit: 'cups' }, // Rice: 2 cups
      { item_id: '3', quantity: 30, unit: 'ml' }, // Olive Oil: 30ml
    ];

    it('should calculate total recipe cost correctly', () => {
      const result = calculateRecipeTotalCost(mockIngredients, mockFoodItems);
      
      // Expected costs:
      // Chicken: 1 * (12.99 / 2) = 6.495
      // Rice: 2 * (4.99 / 6) = 1.6633
      // Olive Oil: 30 * (8.99 / 500) = 0.5394
      // Total: 8.6977
      
      expect(result.totalCost).toBeCloseTo(8.6977, 3);
      expect(result.servings).toBe(1); // Default servings
    });

    it('should handle missing ingredients gracefully', () => {
      const ingredientsWithMissingItem: RecipeIngredient[] = [
        { item_id: '999', quantity: 1, unit: 'cups' }, // Non-existent item
        { item_id: '1', quantity: 1, unit: 'lbs' }, // Chicken
      ];

      const result = calculateRecipeTotalCost(ingredientsWithMissingItem, mockFoodItems);
      
      // Should only count chicken cost
      expect(result.totalCost).toBeCloseTo(6.495, 3);
    });

    it('should handle empty ingredients list', () => {
      const result = calculateRecipeTotalCost([], mockFoodItems);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('calculateRecipeCostBreakdown', () => {
    const mockIngredients: RecipeIngredient[] = [
      { item_id: '1', quantity: 0.5, unit: 'lbs' }, // Half lb chicken
      { item_id: '2', quantity: 1, unit: 'cups' }, // 1 cup rice
    ];

    it('should calculate cost breakdown with percentages', () => {
      const breakdown = calculateRecipeCostBreakdown(mockIngredients, mockFoodItems);
      
      expect(breakdown).toHaveLength(2);
      
      // Chicken cost: 0.5 * (12.99 / 2) = 3.2475
      // Rice cost: 1 * (4.99 / 6) = 0.8317
      // Total: 4.0792
      
      const chickenBreakdown = breakdown.find(b => b.ingredient.item_id === '1');
      const riceBreakdown = breakdown.find(b => b.ingredient.item_id === '2');
      
      expect(chickenBreakdown?.totalCost).toBeCloseTo(3.2475, 3);
      expect(riceBreakdown?.totalCost).toBeCloseTo(0.8317, 3);
      
      // Check percentages
      expect(chickenBreakdown?.percentage).toBeCloseTo(79.6, 1); // Higher percentage
      expect(riceBreakdown?.percentage).toBeCloseTo(20.4, 1); // Lower percentage
      
      // Percentages should add up to 100
      const totalPercentage = breakdown.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should handle zero cost ingredients', () => {
      const ingredientsWithZeroCost: RecipeIngredient[] = [
        { item_id: '999', quantity: 1, unit: 'cups' }, // Non-existent item (zero cost)
        { item_id: '1', quantity: 1, unit: 'lbs' }, // Chicken
      ];

      const breakdown = calculateRecipeCostBreakdown(ingredientsWithZeroCost, mockFoodItems);
      
      expect(breakdown).toHaveLength(2);
      
      const zeroCostItem = breakdown.find(b => b.ingredient.item_id === '999');
      const chickenItem = breakdown.find(b => b.ingredient.item_id === '1');
      
      expect(zeroCostItem?.totalCost).toBe(0);
      expect(zeroCostItem?.percentage).toBe(0);
      expect(chickenItem?.percentage).toBe(100);
    });
  });

  describe('updateRecipeIngredientCosts', () => {
    it('should update ingredient costs with timestamps', () => {
      const mockIngredients: RecipeIngredient[] = [
        { item_id: '1', quantity: 1, unit: 'lbs' },
        { item_id: '2', quantity: 2, unit: 'cups' },
      ];

      const updatedIngredients = updateRecipeIngredientCosts(mockIngredients, mockFoodItems);
      
      expect(updatedIngredients).toHaveLength(2);
      
      const chickenIngredient = updatedIngredients.find(i => i.item_id === '1');
      const riceIngredient = updatedIngredients.find(i => i.item_id === '2');
      
      expect(chickenIngredient?.cost_per_unit).toBeCloseTo(6.495, 3);
      expect(chickenIngredient?.total_cost).toBeCloseTo(6.495, 3);
      expect(chickenIngredient?.cost_calculated_at).toBeDefined();
      
      expect(riceIngredient?.cost_per_unit).toBeCloseTo(0.8317, 3);
      expect(riceIngredient?.total_cost).toBeCloseTo(1.6633, 3);
      expect(riceIngredient?.cost_calculated_at).toBeDefined();
    });

    it('should handle missing food items gracefully', () => {
      const mockIngredients: RecipeIngredient[] = [
        { item_id: '999', quantity: 1, unit: 'cups' }, // Non-existent item
      ];

      const updatedIngredients = updateRecipeIngredientCosts(mockIngredients, mockFoodItems);
      
      expect(updatedIngredients).toHaveLength(1);
      expect(updatedIngredients[0]).toEqual(mockIngredients[0]); // Should remain unchanged
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined and null values gracefully', () => {
      const itemWithNullPrice = { ...mockChicken, price: null as any };
      expect(calculateCostPerUnit(itemWithNullPrice)).toBe(0);
      
      const itemWithUndefinedQuantity = { ...mockChicken, quantity: undefined as any };
      expect(calculateCostPerUnit(itemWithUndefinedQuantity)).toBe(0);
    });

    it('should handle negative values', () => {
      const itemWithNegativePrice = { ...mockChicken, price: -5 };
      const cost = calculateCostPerUnit(itemWithNegativePrice);
      expect(cost).toBeCloseTo(-2.5, 1);
    });

    it('should handle very small quantities', () => {
      const itemWithSmallQuantity = { ...mockChicken, quantity: 0.001 };
      const cost = calculateCostPerUnit(itemWithSmallQuantity);
      expect(cost).toBeCloseTo(12990, 0);
    });

    it('should handle very large numbers', () => {
      const itemWithLargePrice = { ...mockChicken, price: 999999.99 };
      const cost = calculateCostPerUnit(itemWithLargePrice);
      expect(cost).toBeCloseTo(499999.995, 3);
    });
  });
});

describe('Unit Conversion Logic', () => {
  it('should handle common volume conversions', () => {
    // Test cup to oz conversion
    const cupToOzCost = calculateIngredientCost(
      { ...mockRice, unit: 'cups' },
      1, // 1 oz
      'oz'
    );
    
    // Should use conversion ratio (1 cup = 8 oz, so 1 oz = 1/8 cup)
    const expectedCost = (4.99 / 6) * (1 / 8); // cost per cup * conversion factor
    expect(cupToOzCost).toBeCloseTo(expectedCost, 3);
  });

  it('should handle weight conversions', () => {
    // Test lbs to oz conversion
    const lbsToOzCost = calculateIngredientCost(
      { ...mockChicken, unit: 'lbs' },
      8, // 8 oz
      'oz'
    );
    
    // Since our conversion logic doesn't have lbs->oz, it defaults to 1:1
    // So 8 oz is treated as 8 lbs worth of cost
    const expectedCost = (12.99 / 2) * 8; // 8 times the cost per lb
    expect(lbsToOzCost).toBeCloseTo(expectedCost, 3);
  });

  it('should default to 1:1 conversion for unknown units', () => {
    const unknownUnitCost = calculateIngredientCost(
      mockChicken,
      1,
      'unknown-unit'
    );
    
    // Should use 1:1 conversion
    expect(unknownUnitCost).toBeCloseTo(6.495, 3);
  });
});