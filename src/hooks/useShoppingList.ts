import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFoodInventory } from './useFoodInventory';
import { FoodItem } from '../types';

export interface ShoppingListSummary {
  totalItems: number;
  totalUnits: number;
  estimatedTotal: number;
  itemsWithoutPrices: number;
}

export function useShoppingList() {
  const { outOfStockItems, updateItem } = useFoodInventory();

  // Calculate shopping list summary
  const getSummary = (): ShoppingListSummary => {
    const totalItems = outOfStockItems.length;
    const totalUnits = outOfStockItems.reduce((total, item) => total + item.quantity, 0);
    const estimatedTotal = outOfStockItems.reduce(
      (total, item) => total + ((item.price || 0) * item.quantity), 
      0
    );
    const itemsWithoutPrices = outOfStockItems.filter(item => !item.price).length;

    return {
      totalItems,
      totalUnits,
      estimatedTotal,
      itemsWithoutPrices,
    };
  };

  // Mark item as purchased and update inventory
  const markAsPurchased = async (item: FoodItem, purchasedQuantity?: number) => {
    const quantityToSet = purchasedQuantity || Math.max(item.quantity, 1);
    
    await updateItem(item.id, {
      in_stock: true,
      quantity: quantityToSet,
      last_purchased: new Date().toISOString().split('T')[0],
    });

    return {
      name: item.name,
      quantity: quantityToSet,
      unit: item.unit,
    };
  };

  // Add item to shopping list (mark as out of stock)
  const addToShoppingList = async (itemId: string, quantity: number = 1) => {
    await updateItem(itemId, {
      in_stock: false,
      quantity: quantity,
    });
  };

  // Remove item from shopping list (without purchasing - just mark as in stock)
  const removeFromShoppingList = async (itemId: string) => {
    await updateItem(itemId, {
      in_stock: true,
    });
  };

  // Calculate individual item total
  const getItemTotal = (item: FoodItem): number => {
    return (item.price || 0) * item.quantity;
  };

  return {
    shoppingItems: outOfStockItems,
    summary: getSummary(),
    markAsPurchased,
    addToShoppingList,
    removeFromShoppingList,
    getItemTotal,
  };
}