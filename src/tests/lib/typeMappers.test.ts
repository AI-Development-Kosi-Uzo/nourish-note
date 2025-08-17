import { describe, it, expect } from 'vitest';
import {
  dbItemToFoodItem,
  foodItemToDbInsert,
  dbRecipeToRecipe,
  recipeToDbInsert,
} from '../../lib/typeMappers';
import { DbItem, FoodItem, DbRecipe, Recipe } from '../../types';

describe('typeMappers', () => {
  describe('dbItemToFoodItem', () => {
    it('should convert database item to FoodItem format', () => {
      const dbItem: DbItem = {
        id: 1,
        name: 'Apple',
        brand: 'Organic Brand',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        carbs_per_serving: 25,
        fat_per_serving: 0.3,
        protein_per_serving: 0.5,
        servings_per_container: 1,
        image_url: 'https://example.com/apple.jpg',
        nutrition_source: 'manual',
        barcode: null,
        last_edited: '2025-01-01T00:00:00Z',
        normalized_name: 'apple',
      };

      const result = dbItemToFoodItem(dbItem);

      expect(result).toEqual({
        id: '1',
        name: 'Apple',
        brand: 'Organic Brand',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        image_url: 'https://example.com/apple.jpg',
        nutrition: {
          calories_per_100g: 10470, // Calculated: (0.5*4 + 25*4 + 0.3*9) * 100 / 1
          protein_per_100g: 50, // 0.5 * 100 / 1
          carbs_per_100g: 2500, // 25 * 100 / 1
          fat_per_100g: 30, // 0.3 * 100 / 1
          fiber_per_100g: 0,
        },
        last_edited: '2025-01-01T00:00:00Z',
      });
    });

    it('should handle null/undefined values', () => {
      const dbItem: DbItem = {
        id: 2,
        name: 'Banana',
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

      const result = dbItemToFoodItem(dbItem);

      expect(result.brand).toBeUndefined();
      expect(result.category).toBe('Other');
      expect(result.in_stock).toBe(true);
      expect(result.price).toBeUndefined();
    });
  });

  describe('foodItemToDbInsert', () => {
    it('should convert FoodItem to database insert format', () => {
      const foodItem: Omit<FoodItem, 'id'> = {
        name: 'Apple',
        brand: 'Organic Brand',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        image_url: 'https://example.com/apple.jpg',
        nutrition: {
          calories_per_100g: 52,
          protein_per_100g: 0.3,
          carbs_per_100g: 14,
          fat_per_100g: 0.2,
          fiber_per_100g: 2.4,
        },
        last_edited: '2025-01-01T00:00:00Z',
      };

      const result = foodItemToDbInsert(foodItem);

      expect(result).toEqual({
        name: 'Apple',
        brand: 'Organic Brand',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        carbs_per_serving: 0.14,
        fat_per_serving: 0.002,
        protein_per_serving: 0.003,
        servings_per_container: 1,
        image_url: 'https://example.com/apple.jpg',
        ingredients: null,
        nutrition_source: 'manual',
        barcode: null,
        rating: null,
        last_edited: '2025-01-01T00:00:00Z',
      });
    });

    it('should handle undefined optional fields', () => {
      const foodItem: Omit<FoodItem, 'id'> = {
        name: 'Banana',
        category: 'Fruit',
        in_stock: true,
        nutrition: {
          calories_per_100g: 89,
          protein_per_100g: 1.1,
          carbs_per_100g: 23,
          fat_per_100g: 0.3,
          fiber_per_100g: 2.6,
        },
        last_edited: '2025-01-01T00:00:00Z',
      };

      const result = foodItemToDbInsert(foodItem);

      expect(result.brand).toBe(null);
      expect(result.price).toBe(null);
      expect(result.image_url).toBe(null);
    });
  });

  describe('dbRecipeToRecipe', () => {
    it('should convert database recipe to Recipe format', () => {
      const dbRecipe: DbRecipe = {
        id: 1,
        name: 'Apple Pie',
        cuisine_type: 'American',
        meal_type: ['dessert'],
        difficulty: 'medium',
        prep_time: 30,
        cook_time: 45,
        total_time: 75,
        servings: 8,
        instructions: 'Mix ingredients and bake',
        nutrition_per_serving: {
          calories: 250,
          protein: 3,
          carbs: 35,
          fat: 12,
        },
        tags: ['dessert', 'fruit'],
        rating: 4.5,
        source_link: 'https://example.com/recipe',
        cost_per_serving: 2.50,
        notes: 'Great for holidays',
        times_cooked: 5,
        average_rating: 4.2,
        last_cooked: '2025-01-01',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const ingredients = [
        { item_id: '1', quantity: 6, unit: 'pieces' },
        { item_id: '2', quantity: 2, unit: 'cups' },
      ];

      const result = dbRecipeToRecipe(dbRecipe, ingredients);

      expect(result).toEqual({
        id: '1',
        name: 'Apple Pie',
        instructions: 'Mix ingredients and bake',
        servings: 8,
        prep_time_minutes: 30,
        ingredients,
        nutrition: {
          calories_per_serving: 250,
          protein_per_serving: 3,
          carbs_per_serving: 35,
          fat_per_serving: 12,
        },
        is_favorite: true, // average_rating >= 4
        cost_per_serving: 2.50,
        total_cost: undefined,
        cost_last_calculated: undefined,
      });
    });

    it('should handle null/undefined values', () => {
      const dbRecipe: DbRecipe = {
        id: 2,
        name: 'Simple Recipe',
        cuisine_type: null,
        meal_type: null,
        difficulty: null,
        prep_time: null,
        cook_time: null,
        total_time: null,
        servings: null,
        instructions: null,
        nutrition_per_serving: null,
        tags: null,
        rating: null,
        source_link: null,
        cost_per_serving: null,
        notes: null,
        times_cooked: null,
        average_rating: null,
        last_cooked: null,
        created_at: null,
        updated_at: null,
      };

      const result = dbRecipeToRecipe(dbRecipe);

      expect(result.instructions).toBe('');
      expect(result.servings).toBe(1);
      expect(result.prep_time_minutes).toBeUndefined();
      expect(result.is_favorite).toBe(false);
      expect(result.nutrition).toEqual({
        calories_per_serving: 0,
        protein_per_serving: 0,
        carbs_per_serving: 0,
        fat_per_serving: 0,
      });
    });
  });

  describe('recipeToDbInsert', () => {
    it('should convert Recipe to database insert format', () => {
      const recipe: Omit<Recipe, 'id'> = {
        name: 'Apple Pie',
        instructions: 'Mix ingredients and bake',
        servings: 8,
        prep_time_minutes: 30,
        ingredients: [
          { item_id: '1', quantity: 6, unit: 'pieces' },
        ],
        nutrition: {
          calories_per_serving: 250,
          protein_per_serving: 3,
          carbs_per_serving: 35,
          fat_per_serving: 12,
        },
        is_favorite: true,
      };

      const result = recipeToDbInsert(recipe);

      expect(result).toEqual({
        name: 'Apple Pie',
        cuisine_type: null,
        meal_type: null,
        difficulty: null,
        prep_time: 30,
        cook_time: null,
        total_time: 30,
        servings: 8,
        instructions: 'Mix ingredients and bake',
        nutrition_per_serving: {
          calories_per_serving: 250,
          protein_per_serving: 3,
          carbs_per_serving: 35,
          fat_per_serving: 12,
        },
        tags: null,
        rating: 5, // is_favorite = true
        source_link: null,
        cost_per_serving: null,
        notes: null,
      });
    });

    it('should handle non-favorite recipes', () => {
      const recipe: Omit<Recipe, 'id'> = {
        name: 'Simple Recipe',
        instructions: 'Just cook it',
        servings: 2,
        ingredients: [],
        nutrition: {
          calories_per_serving: 100,
          protein_per_serving: 5,
          carbs_per_serving: 15,
          fat_per_serving: 3,
        },
        is_favorite: false,
      };

      const result = recipeToDbInsert(recipe);

      expect(result.rating).toBe(null);
      expect(result.prep_time).toBe(null);
      expect(result.total_time).toBe(null);
    });
  });
});