import { describe, it, expect, vi } from 'vitest';

// Mock the useFoodInventory hook
vi.mock('../../hooks/useFoodInventory', () => ({
  useFoodInventory: () => ({
    outOfStockItems: [
      {
        id: '1',
        name: 'Milk',
        price: 3.99,
        quantity: 2,
        unit: 'liter',
        category: 'Dairy',
        in_stock: false,
      },
      {
        id: '2',
        name: 'Bread',
        price: 2.50,
        quantity: 1,
        unit: 'loaf',
        category: 'Bakery',
        in_stock: false,
      },
      {
        id: '3',
        name: 'Organic Apples',
        price: undefined, // No price set
        quantity: 3,
        unit: 'kg',
        category: 'Produce',
        in_stock: false,
      },
    ],
    updateItem: vi.fn(),
  }),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { useShoppingList } from '../../hooks/useShoppingList';
import { renderHook } from '@testing-library/react';

describe('useShoppingList', () => {
  it('should calculate shopping list summary correctly', () => {
    const { result } = renderHook(() => useShoppingList());

    expect(result.current.summary.totalItems).toBe(3);
    expect(result.current.summary.totalUnits).toBe(6); // 2 + 1 + 3
    expect(result.current.summary.estimatedTotal).toBe(10.48); // (3.99 * 2) + (2.50 * 1) + (0 * 3)
    expect(result.current.summary.itemsWithoutPrices).toBe(1);
  });

  it('should calculate individual item total correctly', () => {
    const { result } = renderHook(() => useShoppingList());

    const milkItem = result.current.shoppingItems.find(item => item.name === 'Milk');
    const breadItem = result.current.shoppingItems.find(item => item.name === 'Bread');
    const appleItem = result.current.shoppingItems.find(item => item.name === 'Organic Apples');

    expect(result.current.getItemTotal(milkItem!)).toBe(7.98); // 3.99 * 2
    expect(result.current.getItemTotal(breadItem!)).toBe(2.50); // 2.50 * 1
    expect(result.current.getItemTotal(appleItem!)).toBe(0); // undefined price
  });

  it('should handle items without prices', () => {
    const { result } = renderHook(() => useShoppingList());

    const appleItem = result.current.shoppingItems.find(item => item.name === 'Organic Apples');
    
    // Item without price should still calculate quantity correctly
    expect(appleItem?.quantity).toBe(3);
    expect(result.current.getItemTotal(appleItem!)).toBe(0);
    expect(result.current.summary.itemsWithoutPrices).toBe(1);
  });
});