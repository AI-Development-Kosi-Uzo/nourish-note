import { useState } from 'react';
import { Plus, Calendar, Utensils, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '../components/Layout';
import { LogMealDialog } from '../components/LogMealDialog';
import { useMealLogs } from '../hooks/useMealLogs';
import { useRecipes } from '../hooks/useRecipes';

export default function Meals() {
  const { mealLogs, addMealLog, updateMealLog } = useMealLogs();
  const { getRecipeById } = useRecipes();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [editingMealLog, setEditingMealLog] = useState(null);

  const recentLogs = mealLogs.slice(0, 20); // Show last 20 meals

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Meal Log</h1>
          <p className="text-muted-foreground">Track your daily meals and nutrition</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{mealLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total Meals</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mealLogs.reduce((sum, log) => sum + log.nutrition.calories, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Calories</div>
          </Card>
        </div>

        {/* Recent Meals */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Meals</h2>
          
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No meals logged yet</p>
            </div>
          ) : (
            recentLogs.map(log => {
              const recipe = log.recipe_id ? getRecipeById(log.recipe_id) : null;
              
              return (
                <Card key={log.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{log.meal_name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(log.date)}
                        </div>
                        {recipe && (
                          <Badge variant="outline" className="mt-2">
                            Recipe: {recipe.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMealLog(log);
                            setIsLogDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {log.estimated_cost && (
                          <Badge variant="secondary">
                            ${log.estimated_cost.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Nutrition */}
                    <div className="flex gap-4 text-xs">
                      <span className="font-medium">
                        {log.nutrition.calories} cal
                      </span>
                      <span className="text-muted-foreground">
                        P: {log.nutrition.protein}g
                      </span>
                      <span className="text-muted-foreground">
                        C: {log.nutrition.carbs}g
                      </span>
                      <span className="text-muted-foreground">
                        F: {log.nutrition.fat}g
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-sm text-muted-foreground">{log.notes}</p>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Floating Add Button */}
        <Button
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsLogDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Log Meal Dialog */}
        <LogMealDialog
          open={isLogDialogOpen}
          onOpenChange={(open) => {
            setIsLogDialogOpen(open);
            if (!open) {
              setEditingMealLog(null);
            }
          }}
          editingMealLog={editingMealLog}
          onSave={(mealData) => {
            if (editingMealLog) {
              updateMealLog(editingMealLog.id, mealData);
            } else {
              addMealLog(mealData);
            }
            setIsLogDialogOpen(false);
            setEditingMealLog(null);
          }}
        />
      </div>
    </Layout>
  );
}