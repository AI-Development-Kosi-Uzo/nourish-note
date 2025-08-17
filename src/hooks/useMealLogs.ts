import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MealLog, DbMealLog } from '../types';
import { dbMealLogToMealLog, mealLogToDbInsert } from '../lib/typeMappers';

export function useMealLogs() {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMealLogs();
  }, []);

  const loadMealLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .order('cooked_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedMealLogs = data.map(dbMealLogToMealLog).filter(Boolean) as MealLog[];
      setMealLogs(mappedMealLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal logs');
    } finally {
      setLoading(false);
    }
  };

  const addMealLog = async (mealLog: Omit<MealLog, 'id'>) => {
    try {
      const dbMealLog = mealLogToDbInsert(mealLog);
      
      const { data, error } = await supabase
        .from('meal_logs')
        .insert([dbMealLog])
        .select()
        .single();
      
      if (error) throw error;
      
      const newMealLog = dbMealLogToMealLog(data as DbMealLog);
      setMealLogs(prev => [newMealLog, ...prev]);
      return newMealLog;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal log');
      throw err;
    }
  };

  const updateMealLog = async (id: string, updatedData: Omit<MealLog, 'id'>) => {
    try {
      const numericId = parseInt(id);
      const dbMealLog = mealLogToDbInsert(updatedData);
      
      const { error } = await supabase
        .from('meal_logs')
        .update(dbMealLog)
        .eq('id', numericId);
      
      if (error) throw error;
      
      setMealLogs(prev => prev.map(log => 
        log.id === id ? { ...updatedData, id } : log
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal log');
      throw err;
    }
  };

  const deleteMealLog = async (id: string) => {
    try {
      const numericId = parseInt(id);
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', numericId);
      
      if (error) throw error;
      
      setMealLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal log');
      throw err;
    }
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
    loading,
    error,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    getMealLogsByDateRange,
    getRecentMealLogs,
    refetch: loadMealLogs,
  };
}