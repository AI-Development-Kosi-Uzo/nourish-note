import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing the hook
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { useFoodInventory } from '../../hooks/useFoodInventory';
import { supabase } from '../../lib/supabase';

const mockSupabase = vi.mocked(supabase);

describe('useFoodInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load items on mount', async () => {
    const mockItems = [
      {
        id: 1,
        name: 'Apple',
        brand: 'Test Brand',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        unit_of_measure: 'kg',
        unit_quantity: 1,
        carbs_per_serving: 25,
        fat_per_serving: 0.3,
        protein_per_serving: 0.5,
        servings_per_container: 1,
        last_edited: '2025-01-01T00:00:00Z',
        image_url: null,
        nutrition_source: 'manual',
        barcode: null,
        normalized_name: 'apple',
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockItems,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useFoodInventory());

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allItems).toHaveLength(1);
    expect(result.current.allItems[0].name).toBe('Apple');
    expect(result.current.allItems[0].id).toBe('1');
  });

  it('should handle errors when loading items', async () => {
    const mockError = new Error('Database error');
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: null,
          error: mockError,
        })),
      })),
    } as any);

    const { result } = renderHook(() => useFoodInventory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.allItems).toHaveLength(0);
  });

  it('should add new item', async () => {
    const mockInsertedItem = {
      id: 2,
      name: 'Banana',
      brand: null,
      category: 'Fruit',
      in_stock: true,
      price: 1.99,
      unit_of_measure: 'kg',
      unit_quantity: 1,
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

    // Mock initial load
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
    } as any);

    // Mock insert
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockInsertedItem,
            error: null,
          })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useFoodInventory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newItem = {
      name: 'Banana',
      category: 'Fruit',
      in_stock: true,
      unit: 'kg',
      quantity: 1,
      price: 1.99,
      nutrition: {
        calories_per_100g: 89,
        protein_per_100g: 1.1,
        carbs_per_100g: 27,
        fat_per_100g: 0.3,
        fiber_per_100g: 2.6,
      },
    };

    await result.current.addItem(newItem);

    expect(result.current.allItems).toHaveLength(1);
    expect(result.current.allItems[0].name).toBe('Banana');
  });

  it('should filter items by search query', async () => {
    const mockItems = [
      {
        id: 1,
        name: 'Apple',
        brand: 'Brand A',
        category: 'Fruit',
        in_stock: true,
        price: 2.99,
        unit_of_measure: 'kg',
        unit_quantity: 1,
        carbs_per_serving: 25,
        fat_per_serving: 0.3,
        protein_per_serving: 0.5,
        servings_per_container: 1,
        last_edited: '2025-01-01T00:00:00Z',
        image_url: null,
        nutrition_source: 'manual',
        barcode: null,
        normalized_name: 'apple',
      },
      {
        id: 2,
        name: 'Banana',
        brand: 'Brand B',
        category: 'Fruit',
        in_stock: false,
        price: 1.99,
        unit_of_measure: 'kg',
        unit_quantity: 1,
        carbs_per_serving: 27,
        fat_per_serving: 0.3,
        protein_per_serving: 1.1,
        servings_per_container: 1,
        last_edited: '2025-01-01T00:00:00Z',
        image_url: null,
        nutrition_source: 'manual',
        barcode: null,
        normalized_name: 'banana',
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: mockItems,
          error: null,
        })),
      })),
    } as any);

    const { result } = renderHook(() => useFoodInventory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial state - should show all items
    expect(result.current.items).toHaveLength(2);

    // Filter by name
    result.current.setSearchQuery('apple');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Apple');

    // Filter by brand
    result.current.setSearchQuery('Brand B');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Banana');
  });
});