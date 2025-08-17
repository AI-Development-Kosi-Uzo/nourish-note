import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Recipe, RecipeIngredient, DbRecipe } from '../types';
import { dbRecipeToRecipe, recipeToDbInsert } from '../lib/typeMappers';
import { mockRecipes } from '../data/mockData';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Attempting to load recipes from Supabase...');
      
      // Try to connect to Supabase first
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_items (
            quantity,
            unit,
            item_id
          )
        `)
        .order('name');
      
      if (recipesError) {
        console.warn('⚠️ Supabase connection failed, falling back to mock data:', recipesError.message);
        // Fall back to mock data
        setRecipes(mockRecipes);
        setUsingMockData(true);
        console.log('✅ Loaded mock data:', mockRecipes.length, 'recipes');
        return;
      }
      
      if (recipesData && recipesData.length > 0) {
        console.log('✅ Loaded data from Supabase:', recipesData.length, 'recipes');
        const mappedRecipes = recipesData.map((dbRecipe: Record<string, unknown>) => {
          const ingredients: RecipeIngredient[] = (dbRecipe.recipe_items as Record<string, unknown>[]).map((ri: Record<string, unknown>) => ({
            item_id: ri.item_id.toString(),
            quantity: ri.quantity,
            unit: ri.unit,
          }));
          
          return dbRecipeToRecipe(dbRecipe, ingredients);
        });
        setRecipes(mappedRecipes);
        setUsingMockData(false);
      } else {
        // Database is empty, use mock data
        console.log('ℹ️ Database is empty, using mock data');
        setRecipes(mockRecipes);
        setUsingMockData(true);
        console.log('✅ Loaded mock data:', mockRecipes.length, 'recipes');
      }
    } catch (err) {
      console.warn('❌ Failed to load from Supabase, using mock data:', err);
      // Fall back to mock data on any error
      setRecipes(mockRecipes);
      setUsingMockData(true);
      setError('Using mock data - database connection unavailable');
      console.log('✅ Loaded mock data:', mockRecipes.length, 'recipes');
    } finally {
      setLoading(false);
    }
  };

const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteRecipes = filteredRecipes.filter(r => r.is_favorite);

const addRecipe = async (recipe: Omit<Recipe, 'id' | 'is_favorite'>) => {
    try {
      const dbRecipe = recipeToDbInsert(recipe);
      
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([dbRecipe])
        .select()
        .single();
      
      if (recipeError) throw recipeError;
      
      // Insert recipe ingredients
      if (recipe.ingredients.length > 0) {
        const recipeIngredients = recipe.ingredients.map(ingredient => ({
          recipe_id: recipeData.id,
          item_id: parseInt(ingredient.item_id),
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        }));
        
        const { error: ingredientsError } = await supabase
          .from('recipe_items')
          .insert(recipeIngredients);
        
        if (ingredientsError) throw ingredientsError;
      }
      
      // Calculate recipe cost after ingredients are inserted
      try {
        await supabase.rpc('calculate_recipe_cost', { p_recipe_id: recipeData.id });
        // Refetch all recipes to get the updated cost values
        await loadRecipes();
        // Find and return the newly created recipe with correct costs
        const updatedRecipe = recipes.find(r => r.id === recipeData.id.toString());
        return updatedRecipe || dbRecipeToRecipe(recipeData, recipe.ingredients);
      } catch (costError) {
        console.warn('Failed to calculate recipe cost:', costError);
        // Fall back to adding without cost calculation
        const newRecipe = dbRecipeToRecipe(recipeData, recipe.ingredients);
        setRecipes(prev => [...prev, newRecipe]);
        return newRecipe;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe');
      throw err;
    }
  };

const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    console.log('🎯 updateRecipe called for ID:', id, 'Updates:', updates);
    console.log('📝 Updates includes ingredients?', !!updates.ingredients, 'Ingredient count:', updates.ingredients?.length);
    try {
      const numericId = parseInt(id);
      
      // Use the nutrition provided in updates (calculated by AddRecipeDialog)
      let nutritionToSave = updates.nutrition;
      
      // Update recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: updates.name,
          instructions: updates.instructions,
          servings: updates.servings,
          prep_time: updates.prep_time_minutes,
          nutrition_per_serving: nutritionToSave,
          rating: updates.is_favorite ? 5 : null,
        })
        .eq('id', numericId);
      
      if (recipeError) throw recipeError;
      
      // Update ingredients if provided
      if (updates.ingredients) {
        // Delete existing ingredients
        await supabase
          .from('recipe_items')
          .delete()
          .eq('recipe_id', numericId);
        
        // Insert new ingredients
        if (updates.ingredients.length > 0) {
          const recipeIngredients = updates.ingredients.map(ingredient => ({
            recipe_id: numericId,
            item_id: parseInt(ingredient.item_id),
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          }));
          
          const { error: ingredientsError } = await supabase
            .from('recipe_items')
            .insert(recipeIngredients);
          
          if (ingredientsError) throw ingredientsError;
        }
      }
      
      // Recalculate recipe cost if ingredients were updated
      if (updates.ingredients) {
        console.log('🔄 Updating recipe with ingredients, triggering cost calculation for recipe ID:', numericId);
        try {
          console.log('📞 Calling calculate_recipe_cost RPC function...');
          const { data: rpcResult, error: rpcError } = await supabase.rpc('calculate_recipe_cost', { p_recipe_id: numericId });
          console.log('📊 RPC Result:', rpcResult, 'RPC Error:', rpcError);
          
          // Fetch just the updated cost values instead of refetching everything
          console.log('📖 Fetching updated cost values...');
          const { data: updatedRecipe, error: fetchError } = await supabase
            .from('recipes')
            .select('cost_per_serving, total_cost, cost_last_calculated')
            .eq('id', numericId)
            .single();
            
          console.log('💰 Updated cost data:', updatedRecipe, 'Fetch Error:', fetchError);
          if (fetchError) throw fetchError;
          
          // Update local state with the calculated nutrition and fetched costs
          setRecipes(prev =>
            prev.map(recipe => (recipe.id === id ? { 
              ...recipe, 
              ...updates,
              cost_per_serving: updatedRecipe.cost_per_serving || 0,
              total_cost: updatedRecipe.total_cost || 0,
              cost_last_calculated: updatedRecipe.cost_last_calculated || undefined,
            } : recipe))
          );
        } catch (costError) {
          console.warn('Failed to calculate recipe cost:', costError);
          // Still update local state even if cost calculation fails
          setRecipes(prev =>
            prev.map(recipe => (recipe.id === id ? { ...recipe, ...updates } : recipe))
          );
        }
      } else {
        // Update local state for non-ingredient changes
        setRecipes(prev =>
          prev.map(recipe => (recipe.id === id ? { ...recipe, ...updates } : recipe))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
      throw err;
    }
  };

  const toggleFavorite = async (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
      await updateRecipe(id, { is_favorite: !recipe.is_favorite });
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const numericId = parseInt(id);
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', numericId);
      
      if (error) throw error;
      
      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      throw err;
    }
  };

  const getRecipeById = (id: string) => {
    return recipes.find(recipe => recipe.id === id);
  };

  return {
    recipes: filteredRecipes,
    favorites: favoriteRecipes,
    allRecipes: recipes,
    loading,
    error,
    usingMockData,
    searchQuery,
    setSearchQuery,
    addRecipe,
    updateRecipe,
    toggleFavorite,
    deleteRecipe,
    getRecipeById,
    refetch: loadRecipes,
  };
}