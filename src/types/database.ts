export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: number
          name: string
          brand: string | null
          category: string | null
          in_stock: boolean | null
          price: number | null
          carbs_per_serving: number | null
          fat_per_serving: number | null
          protein_per_serving: number | null
          servings_per_container: number | null
          image_url: string | null
          nutrition_source: string | null
          barcode: string | null
          last_purchased: string | null
          purchase_count: number | null
          rating: number | null
          last_edited: string | null
          normalized_name: string | null
          ingredients: string | null
        }
        Insert: {
          id?: never
          name: string
          brand?: string | null
          category?: string | null
          in_stock?: boolean | null
          price?: number | null
          carbs_per_serving?: number | null
          fat_per_serving?: number | null
          protein_per_serving?: number | null
          servings_per_container?: number | null
          image_url?: string | null
          nutrition_source?: string | null
          barcode?: string | null
          last_purchased?: string | null
          purchase_count?: number | null
          rating?: number | null
          last_edited?: string | null
          normalized_name?: never
          ingredients?: string | null
        }
        Update: {
          id?: never
          name?: string
          brand?: string | null
          category?: string | null
          in_stock?: boolean | null
          price?: number | null
          carbs_per_serving?: number | null
          fat_per_serving?: number | null
          protein_per_serving?: number | null
          servings_per_container?: number | null
          image_url?: string | null
          nutrition_source?: string | null
          barcode?: string | null
          last_purchased?: string | null
          purchase_count?: number | null
          rating?: number | null
          last_edited?: string | null
          normalized_name?: never
          ingredients?: string | null
        }
      }
      recipes: {
        Row: {
          id: number
          name: string
          cuisine_type: string | null
          meal_type: string[] | null
          difficulty: string | null
          prep_time: number | null
          cook_time: number | null
          total_time: number | null
          servings: number | null
          instructions: string | null
          nutrition_per_serving: Record<string, unknown> | null
          tags: string[] | null
          rating: number | null
          source_link: string | null
          cost_per_serving: number | null
          total_cost: number | null
          cost_last_calculated: string | null
          notes: string | null
          times_cooked: number | null
          average_rating: number | null
          last_cooked: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: never
          name: string
          cuisine_type?: string | null
          meal_type?: string[] | null
          difficulty?: string | null
          prep_time?: number | null
          cook_time?: number | null
          total_time?: number | null
          servings?: number | null
          instructions?: string | null
          nutrition_per_serving?: Record<string, unknown> | null
          tags?: string[] | null
          rating?: number | null
          source_link?: string | null
          cost_per_serving?: number | null
          total_cost?: number | null
          cost_last_calculated?: string | null
          notes?: string | null
          times_cooked?: number | null
          average_rating?: number | null
          last_cooked?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: never
          name?: string
          cuisine_type?: string | null
          meal_type?: string[] | null
          difficulty?: string | null
          prep_time?: number | null
          cook_time?: number | null
          total_time?: number | null
          servings?: number | null
          instructions?: string | null
          nutrition_per_serving?: Record<string, unknown> | null
          tags?: string[] | null
          rating?: number | null
          source_link?: string | null
          cost_per_serving?: number | null
          total_cost?: number | null
          cost_last_calculated?: string | null
          notes?: string | null
          times_cooked?: number | null
          average_rating?: number | null
          last_cooked?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      recipe_items: {
        Row: {
          recipe_id: number
          item_id: number
          quantity: number | null
          unit: string | null
          cost_per_unit: number | null
          total_cost: number | null
          cost_calculated_at: string | null
        }
        Insert: {
          recipe_id: number
          item_id: number
          quantity?: number | null
          unit?: string | null
          cost_per_unit?: number | null
          total_cost?: number | null
          cost_calculated_at?: string | null
        }
        Update: {
          recipe_id?: number
          item_id?: number
          quantity?: number | null
          unit?: string | null
          cost_per_unit?: number | null
          total_cost?: number | null
          cost_calculated_at?: string | null
        }
      }
      meal_logs: {
        Row: {
          id: number
          recipe_id: number | null
          cooked_at: string | null
          notes: string | null
          rating: number | null
          macros: Record<string, unknown> | null
          cost: number | null
          created_at: string | null
        }
        Insert: {
          id?: never
          recipe_id?: number | null
          cooked_at?: string | null
          notes?: string | null
          rating?: number | null
          macros?: Record<string, unknown> | null
          cost?: number | null
          created_at?: string | null
        }
        Update: {
          id?: never
          recipe_id?: number | null
          cooked_at?: string | null
          notes?: string | null
          rating?: number | null
          macros?: Record<string, unknown> | null
          cost?: number | null
          created_at?: string | null
        }
      }
      meal_plans: {
        Row: {
          id: number
          date: string
          meal_type: string
          recipe_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: never
          date: string
          meal_type: string
          recipe_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: never
          date?: string
          meal_type?: string
          recipe_id?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_item_by_name: {
        Args: {
          p_name: string
          p_brand: string
          p_price: number
          p_category?: string
          p_in_stock?: boolean
        }
        Returns: Database['public']['Tables']['items']['Row']
      }
      batch_upsert_items: {
        Args: {
          items_data: Record<string, unknown>
        }
        Returns: Database['public']['Tables']['items']['Row'][]
      }
      get_suggested_recipes: {
        Args: {
          p_limit?: number
        }
        Returns: {
          recipe_id: number
          recipe_name: string
          total_ingredients: number
          available_ingredients: number
          availability_percentage: number
        }[]
      }
      get_analytics_data: {
        Args: {
          p_days_back?: number
        }
        Returns: {
          avg_meal_cost: number
          avg_calories: number
          avg_protein: number
          avg_carbs: number
          avg_fat: number
          total_meals: number
          top_recipes: Record<string, unknown>
        }[]
      }
      update_recipe_stats: {
        Args: {
          p_recipe_id: number
        }
        Returns: void
      }
      calculate_recipe_cost: {
        Args: {
          p_recipe_id: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}