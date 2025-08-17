import { useState } from 'react';
import { Plus, Search, Clock, Users, Edit, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layout } from '../components/Layout';
import { AddRecipeDialog } from '../components/AddRecipeDialog';
import { useRecipes } from '../hooks/useRecipes';
import { useFoodInventory } from '../hooks/useFoodInventory';

export default function Recipes() {
  const { recipes, searchQuery, setSearchQuery, addRecipe, updateRecipe, toggleFavorite } = useRecipes();
  const { allItems } = useFoodInventory();
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const displayedRecipes = (favoritesOnly ? recipes.filter(r => r.is_favorite) : recipes);
  const toggleRecipeExpansion = (recipeId: string) => {
    setExpandedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe.id);
    setIsAddDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
<h1 className="text-2xl font-bold">Recipes</h1>
           <p className="text-muted-foreground">Manage your recipes and favorites</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
<div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="favorites-only" checked={favoritesOnly} onCheckedChange={setFavoritesOnly} />
            <Label htmlFor="favorites-only" className="text-sm">Favorites only</Label>
          </div>
        </div>

        {/* Recipes List */}
        <div className="space-y-3">
{displayedRecipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recipes found</p>
            </div>
          ) : (
            displayedRecipes.map(recipe => (
              <Card key={recipe.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{recipe.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings} servings
                        </div>
                        {recipe.prep_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.prep_time_minutes} min
                          </div>
                        )}
                      </div>
                    </div>
<div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(recipe.id)}
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          className={`h-4 w-4 ${recipe.is_favorite ? 'text-primary' : ''}`}
                          fill={recipe.is_favorite ? 'currentColor' : 'none'}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRecipe(recipe)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecipeExpansion(recipe.id)}
                      >
                        {expandedRecipes.has(recipe.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Nutrition per serving */}
                  <div className="flex gap-4 text-xs">
                    <Badge variant="secondary">
                      {recipe.nutrition.calories_per_serving} cal
                    </Badge>
                    <span className="text-muted-foreground">
                      P: {recipe.nutrition.protein_per_serving}g
                    </span>
                    <span className="text-muted-foreground">
                      C: {recipe.nutrition.carbs_per_serving}g
                    </span>
                    <span className="text-muted-foreground">
                      F: {recipe.nutrition.fat_per_serving}g
                    </span>
                  </div>

                  {/* Ingredients list */}
<div className="space-y-1">
                    <p className="text-sm font-medium">Ingredients ({recipe.ingredients.length}):</p>
                    <div className="text-sm text-muted-foreground space-y-1" aria-live="polite">
                      {(expandedRecipes.has(recipe.id) ? recipe.ingredients : recipe.ingredients.slice(0, 3)).map((ingredient, idx) => {
                        const item = allItems.find(item => item.id === ingredient.item_id);
                        return (
                          <div key={idx}>
                            {ingredient.quantity} {ingredient.unit} {item?.name || 'Unknown item'}
                          </div>
                        );
                      })}
                      {!expandedRecipes.has(recipe.id) && recipe.ingredients.length > 3 && (
                        <div className="text-xs">+ {recipe.ingredients.length - 3} more ingredients</div>
                      )}
                    </div>
                  </div>

                  {/* Instructions - only show when expanded */}
                  {expandedRecipes.has(recipe.id) && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-medium">Instructions:</p>
                      <div className="space-y-2">
                        {recipe.instructions.split('\n').filter(step => step.trim()).map((step, idx) => (
                          <div key={idx} className="flex gap-3 text-sm">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </div>
                            <div className="text-muted-foreground">{step.trim()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Floating Add Button */}
        <Button
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Add/Edit Recipe Dialog */}
        <AddRecipeDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingRecipe(null);
          }}
          onSave={(recipeData) => {
            if (editingRecipe) {
              updateRecipe(editingRecipe, recipeData);
            } else {
              addRecipe(recipeData);
            }
            setIsAddDialogOpen(false);
            setEditingRecipe(null);
          }}
          editingRecipe={editingRecipe ? recipes.find(r => r.id === editingRecipe) : undefined}
        />
      </div>
    </Layout>
  );
}