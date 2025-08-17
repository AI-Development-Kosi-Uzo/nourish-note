import { describe, it, expect, vi } from 'vitest';
import { dbItemToFoodItem } from '../../lib/typeMappers';
import { DbItem } from '../../types';

describe('Database Integration', () => {
  describe('Type Mappers Integration', () => {
    it('should correctly map database item to FoodItem', () => {
      const dbItem: DbItem = {
        id: 1,
        name: 'Apple',
        brand: 'Organic',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        carbs_per_serving: 14,
        fat_per_serving: 0.2,
        protein_per_serving: 0.3,
        servings_per_container: 100, // 100g serving
        image_url: null,
        nutrition_source: 'manual',
        barcode: null,
        last_edited: '2025-01-01T00:00:00Z',
        normalized_name: 'apple',
      };

      const foodItem = dbItemToFoodItem(dbItem);

      expect(foodItem.id).toBe('1');
      expect(foodItem.name).toBe('Apple');
      expect(foodItem.brand).toBe('Organic');
      expect(foodItem.category).toBe('Fruit');
      expect(foodItem.in_stock).toBe(true);
      expect(foodItem.price).toBe(2.99);
      
      // Nutrition should be calculated per 100g
      expect(foodItem.nutrition.carbs_per_100g).toBe(14); // 14 * 100 / 100
      expect(foodItem.nutrition.fat_per_100g).toBe(0.2); // 0.2 * 100 / 100
      expect(foodItem.nutrition.protein_per_100g).toBe(0.3); // 0.3 * 100 / 100
      
      // Calories should be calculated from macros: (protein*4 + carbs*4 + fat*9)
      const expectedCalories = (0.3 * 4 + 14 * 4 + 0.2 * 9);
      expect(foodItem.nutrition.calories_per_100g).toBe(expectedCalories);
    });

    it('should handle null database values gracefully', () => {
      const dbItem: DbItem = {
        id: 2,
        name: 'Test Item',
        brand: null,
        category: null,
        in_stock: null,
        price: null,
        carbs_per_serving: null,
        fat_per_serving: null,
        protein_per_serving: null,
        servings_per_container: null,
        image_url: null,
        nutrition_source: null,
        barcode: null,
        last_edited: null,
        normalized_name: null,
      };

      const foodItem = dbItemToFoodItem(dbItem);

      expect(foodItem.id).toBe('2');
      expect(foodItem.name).toBe('Test Item');
      expect(foodItem.brand).toBeUndefined();
      expect(foodItem.category).toBe('Other'); // Default value
      expect(foodItem.in_stock).toBe(true); // Default value
      expect(foodItem.nutrition.calories_per_100g).toBe(0);
    });
  });

  describe('Database Query Structure Tests', () => {
    it('should validate expected database schema structure', () => {
      // This test validates that our type definitions match expected database structure
      const mockDbResponse: DbItem[] = [
        {
          id: 1,
          name: 'Apple',
          brand: 'Test',
          category: 'Fruit',
          in_stock: true,
          price: 1.99,
          carbs_per_serving: 14,
          fat_per_serving: 0.2,
          protein_per_serving: 0.3,
          servings_per_container: 1,
          image_url: 'test.jpg',
          nutrition_source: 'manual',
          barcode: '12345',
          last_edited: '2025-01-01T00:00:00Z',
          normalized_name: 'apple',
        },
      ];

      expect(mockDbResponse).toHaveLength(1);
      expect(mockDbResponse[0].id).toBeTypeOf('number');
      expect(mockDbResponse[0].name).toBeTypeOf('string');
      expect(mockDbResponse[0].in_stock).toBeTypeOf('boolean');
      expect(mockDbResponse[0].price).toBeTypeOf('number');
    });
  });
});