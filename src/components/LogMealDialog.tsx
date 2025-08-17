import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRecipes } from '../hooks/useRecipes';
import { MealLog } from '../types';

interface LogMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mealLog: Omit<MealLog, 'id'>) => void;
  editingMealLog?: MealLog;
}

export function LogMealDialog({ open, onOpenChange, onSave, editingMealLog }: LogMealDialogProps) {
  const { toast } = useToast();
  const { allRecipes } = useRecipes();
  
  const [formData, setFormData] = useState({
    recipe_id: '',
    date: new Date().toISOString().split('T')[0],
    meal_name: '',
    notes: '',
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    estimated_cost: 0,
  });

  // Update form data when editingMealLog changes
  useEffect(() => {
    if (editingMealLog) {
      setFormData({
        recipe_id: editingMealLog.recipe_id || '',
        date: editingMealLog.date,
        meal_name: editingMealLog.meal_name,
        notes: editingMealLog.notes || '',
        nutrition: editingMealLog.nutrition,
        estimated_cost: editingMealLog.estimated_cost || 0,
      });
    } else if (open) {
      // Reset form when opening for new meal log
      setFormData({
        recipe_id: '',
        date: new Date().toISOString().split('T')[0],
        meal_name: '',
        notes: '',
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        estimated_cost: 0,
      });
    }
  }, [editingMealLog, open]);

  const selectedRecipe = formData.recipe_id ? allRecipes.find(r => r.id === formData.recipe_id) : null;

  const handleRecipeSelect = (recipeId: string) => {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        recipe_id: recipeId,
        meal_name: recipe.name,
        nutrition: {
          calories: recipe.nutrition.calories_per_serving,
          protein: recipe.nutrition.protein_per_serving,
          carbs: recipe.nutrition.carbs_per_serving,
          fat: recipe.nutrition.fat_per_serving,
        },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meal_name.trim()) {
      toast({
        title: "Missing meal name",
        description: "Please enter a meal name.",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    
    // Reset form
    setFormData({
      recipe_id: '',
      date: new Date().toISOString().split('T')[0],
      meal_name: '',
      notes: '',
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      estimated_cost: 0,
    });

    toast({
      title: "Meal logged",
      description: `${formData.meal_name} has been added to your meal log.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMealLog ? 'Edit Meal' : 'Log a Meal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.estimated_cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe">Recipe (optional)</Label>
            <Select value={formData.recipe_id} onValueChange={handleRecipeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe or leave blank for custom meal" />
              </SelectTrigger>
              <SelectContent>
                {allRecipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal Name *</Label>
            <Input
              id="meal-name"
              value={formData.meal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, meal_name: e.target.value }))}
              placeholder="e.g., Breakfast Smoothie"
            />
          </div>

          {/* Nutrition */}
          <div className="space-y-3">
            <Label>Nutrition</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="calories" className="text-xs">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.nutrition.calories || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, calories: parseInt(e.target.value) || 0 }
                  }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.nutrition.protein || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, protein: parseInt(e.target.value) || 0 }
                  }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.nutrition.carbs || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, carbs: parseInt(e.target.value) || 0 }
                  }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.nutrition.fat || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, fat: parseInt(e.target.value) || 0 }
                  }))}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this meal..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingMealLog ? 'Update Meal' : 'Log Meal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}