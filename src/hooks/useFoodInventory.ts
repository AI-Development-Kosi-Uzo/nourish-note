import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { FoodItem } from '../types';
import { mockFoodItems } from '../data/mockData';

export function useFoodInventory() {
  const [items, setItems] = useLocalStorage<FoodItem[]>('food-inventory', mockFoodItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in-stock' && item.in_stock) ||
                        (stockFilter === 'out-of-stock' && !item.in_stock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const addItem = (item: Omit<FoodItem, 'id' | 'last_edited'>) => {
    const newItem: FoodItem = {
      ...item,
      id: Date.now().toString(),
      last_edited: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<FoodItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, last_edited: new Date().toISOString() }
        : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleStock = (id: string) => {
    updateItem(id, { in_stock: !items.find(item => item.id === id)?.in_stock });
  };

  const outOfStockItems = items.filter(item => !item.in_stock);

  return {
    items: filteredItems,
    allItems: items,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    categories,
    addItem,
    updateItem,
    deleteItem,
    toggleStock,
    outOfStockItems,
  };
}