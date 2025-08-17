import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Recipe, RecipeIngredient } from '../types';
import { mockRecipes } from '../data/mockData';

export function useRecipes() {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', mockRecipes);
  const [searchQuery, setSearchQuery] = useState('');

const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteRecipes = filteredRecipes.filter(r => r.is_favorite);

const addRecipe = (recipe: Omit<Recipe, 'id' | 'is_favorite'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      is_favorite: false,
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };

const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev =>
      prev.map(recipe => (recipe.id === id ? { ...recipe, ...updates } : recipe))
    );
  };

  const toggleFavorite = (id: string) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === id ? { ...recipe, is_favorite: !recipe.is_favorite } : recipe
      )
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  const getRecipeById = (id: string) => {
    return recipes.find(recipe => recipe.id === id);
  };

return {
    recipes: filteredRecipes,
    favorites: favoriteRecipes,
    allRecipes: recipes,
    searchQuery,
    setSearchQuery,
    addRecipe,
    updateRecipe,
    toggleFavorite,
    deleteRecipe,
    getRecipeById,
  };
}