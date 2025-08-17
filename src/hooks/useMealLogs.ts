import { useLocalStorage } from './useLocalStorage';
import { MealLog } from '../types';
import { mockMealLogs } from '../data/mockData';

export function useMealLogs() {
  const [mealLogs, setMealLogs] = useLocalStorage<MealLog[]>('meal-logs', mockMealLogs);

  const addMealLog = (mealLog: Omit<MealLog, 'id'>) => {
    const newMealLog: MealLog = {
      ...mealLog,
      id: Date.now().toString(),
    };
    setMealLogs(prev => [newMealLog, ...prev]);
    return newMealLog;
  };

  const updateMealLog = (id: string, updatedData: Omit<MealLog, 'id'>) => {
    setMealLogs(prev => prev.map(log => 
      log.id === id ? { ...updatedData, id } : log
    ));
  };

  const deleteMealLog = (id: string) => {
    setMealLogs(prev => prev.filter(log => log.id !== id));
  };

  const getMealLogsByDateRange = (startDate: string, endDate: string) => {
    return mealLogs.filter(log => log.date >= startDate && log.date <= endDate);
  };

  const getRecentMealLogs = (days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    
    return mealLogs.filter(log => log.date >= cutoffDateString);
  };

  return {
    mealLogs,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    getMealLogsByDateRange,
    getRecentMealLogs,
  };
}