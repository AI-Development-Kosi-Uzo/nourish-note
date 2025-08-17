import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '../components/Layout';
import { useMealLogs } from '../hooks/useMealLogs';
import { useFoodInventory } from '../hooks/useFoodInventory';

export default function Analytics() {
  const { mealLogs, getRecentMealLogs } = useMealLogs();
  const { allItems } = useFoodInventory();

  const recentLogs = getRecentMealLogs(7);
  
  // Calculate averages
  const totalMeals = recentLogs.length;
  const avgCalories = totalMeals > 0 ? Math.round(recentLogs.reduce((sum, log) => sum + log.nutrition.calories, 0) / totalMeals) : 0;
  const avgCost = totalMeals > 0 ? recentLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) / totalMeals : 0;
  const totalCost = recentLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);

  // Nutrition totals for the week
  const weeklyNutrition = recentLogs.reduce(
    (totals, log) => ({
      calories: totals.calories + log.nutrition.calories,
      protein: totals.protein + log.nutrition.protein,
      carbs: totals.carbs + log.nutrition.carbs,
      fat: totals.fat + log.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Most used categories
  const categoryUsage = allItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Your food tracking insights</p>
        </div>

        {/* Weekly Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week (Last 7 Days)
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalMeals}</div>
              <div className="text-sm text-muted-foreground">Meals Logged</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{avgCalories}</div>
              <div className="text-sm text-muted-foreground">Avg Calories/Day</div>
            </Card>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Nutrition
          </h2>
          
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">{weeklyNutrition.calories}</div>
                <div className="text-sm text-muted-foreground">Total Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold">{weeklyNutrition.protein}g</div>
                <div className="text-sm text-muted-foreground">Total Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold">{weeklyNutrition.carbs}g</div>
                <div className="text-sm text-muted-foreground">Total Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold">{weeklyNutrition.fat}g</div>
                <div className="text-sm text-muted-foreground">Total Fat</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Cost Analysis */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Analysis
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">${totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Weekly Total</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">${avgCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Avg per Meal</div>
            </Card>
          </div>
        </div>

        {/* Inventory Insights */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Categories
          </h2>
          
          <Card className="p-4">
            <div className="space-y-3">
              {topCategories.map(([category, count], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{category}</span>
                  </div>
                  <span className="text-muted-foreground">{count} items</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{allItems.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {allItems.filter(item => item.in_stock).length}
            </div>
            <div className="text-sm text-muted-foreground">In Stock</div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}