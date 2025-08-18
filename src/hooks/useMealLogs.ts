import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MealLog, DbMealLog } from '../types';
import { dbMealLogToMealLog, mealLogToDbInsert } from '../lib/typeMappers';
import { mockMealLogs } from '../data/mockData';

export function useMealLogs() {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadMealLogs();
    
    // Fallback timeout to ensure we don't get stuck loading
    const timeoutId = setTimeout(() => {
      if (loading && mealLogs.length === 0) {
        console.log('⏰ Timeout fallback: Using mock data after 5 seconds');
        setMealLogs(mockMealLogs);
        setUsingMockData(true);
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const loadMealLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Attempting to load meal logs from Supabase...');
      
      // Try to connect to Supabase first
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .order('cooked_at', { ascending: false });
      
      if (error) {
        console.warn('⚠️ Supabase connection failed, falling back to mock data:', error.message);
        // Fall back to mock data
        setMealLogs(mockMealLogs);
        setUsingMockData(true);
        console.log('✅ Loaded mock data:', mockMealLogs.length, 'meal logs');
        return;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Loaded data from Supabase:', data.length, 'meal logs');
        const mappedMealLogs = data.map(dbMealLogToMealLog).filter(Boolean) as MealLog[];
        setMealLogs(mappedMealLogs);
        setUsingMockData(false);
      } else {
        // Database is empty, use mock data
        console.log('ℹ️ Database is empty, using mock data');
        setMealLogs(mockMealLogs);
        setUsingMockData(true);
      }
    } catch (err) {
      console.warn('⚠️ Error loading meal logs, falling back to mock data:', err);
      // Fall back to mock data on any error
      setMealLogs(mockMealLogs);
      setUsingMockData(true);
      setError(err instanceof Error ? err.message : 'Failed to load meal logs');
    } finally {
      setLoading(false);
    }
  };

  // Ensure we always have valid data, even if something goes wrong
  useEffect(() => {
    if (!loading && mealLogs.length === 0 && !usingMockData) {
      console.log('🔄 Fallback: No data loaded, using mock data');
      setMealLogs(mockMealLogs);
      setUsingMockData(true);
    }
  }, [loading, mealLogs.length, usingMockData]);

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
    usingMockData,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    getMealLogsByDateRange,
    getRecentMealLogs,
    refetch: loadMealLogs,
  };
}