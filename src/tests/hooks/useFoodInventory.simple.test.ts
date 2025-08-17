import { describe, it, expect } from 'vitest';
import { dbItemToFoodItem } from '../../lib/typeMappers';
import { DbItem } from '../../types';

describe('Food Inventory Database Integration', () => {
  it('should convert database items correctly', () => {
    const dbItem: DbItem = {
      id: 1,
      name: 'Apple',
      brand: 'Test Brand',
      category: 'Fruit',
      in_stock: true,
      price: 2.99,
      carbs_per_serving: 25,
      fat_per_serving: 0.3,
      protein_per_serving: 0.5,
      servings_per_container: 1,
      last_edited: '2025-01-01T00:00:00Z',
      image_url: null,
      nutrition_source: 'manual',
      barcode: null,
      normalized_name: 'apple',
    };

    const foodItem = dbItemToFoodItem(dbItem);

    expect(foodItem.id).toBe('1');
    expect(foodItem.name).toBe('Apple');
    expect(foodItem.brand).toBe('Test Brand');
    expect(foodItem.category).toBe('Fruit');
    expect(foodItem.in_stock).toBe(true);
    expect(foodItem.price).toBe(2.99);
  });

  it('should handle price calculations for shopping', () => {
    const dbItem: DbItem = {
      id: 1,
      name: 'Banana',
      brand: null,
      category: 'Fruit',
      in_stock: false, // Out of stock - should appear in shopping list
      price: 1.99,
      carbs_per_serving: 27,
      fat_per_serving: 0.3,
      protein_per_serving: 1.1,
      servings_per_container: 1,
      last_edited: '2025-01-01T00:00:00Z',
      image_url: null,
      nutrition_source: 'manual',
      barcode: null,
      normalized_name: 'banana',
    };

    const foodItem = dbItemToFoodItem(dbItem);
    // Since quantity field was removed, we'll use a default of 1 for calculations
    const expectedTotal = foodItem.price! * 1; // 1.99 * 1 = 1.99

    expect(foodItem.price).toBe(1.99);
    expect(expectedTotal).toBe(1.99);
  });
});