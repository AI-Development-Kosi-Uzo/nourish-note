import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FoodItem } from '../types';

interface AddEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: FoodItem;
  onSave: (item: Omit<FoodItem, 'id' | 'last_edited'>) => void;
}

const categories = ['Fruits', 'Vegetables', 'Meat', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Oils', 'Spices'];
const units = ['pieces', 'lbs', 'kg', 'cups', 'bottles', 'cans', 'packages', 'oz', 'g'];

export function AddEditItemDialog({ open, onOpenChange, item, onSave }: AddEditItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    in_stock: true,
    unit: '',
    quantity: 0,
    price: 0,
    image_url: '',
    nutrition: {
      calories_per_100g: 0,
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      fiber_per_100g: 0,
    },
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        brand: item.brand || '',
        category: item.category,
        in_stock: item.in_stock,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price || 0,
        image_url: item.image_url || '',
        nutrition: { ...item.nutrition },
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        category: '',
        in_stock: true,
        unit: '',
        quantity: 0,
        price: 0,
        image_url: '',
        nutrition: {
          calories_per_100g: 0,
          protein_per_100g: 0,
          carbs_per_100g: 0,
          fat_per_100g: 0,
          fiber_per_100g: 0,
        },
      });
    }
  }, [item, open]);

  const fetchNutritionData = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Enter product name",
        description: "Please enter a product name to fetch nutrition data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock nutrition data
      const mockNutrition = {
        calories_per_100g: Math.floor(Math.random() * 300) + 50,
        protein_per_100g: Math.floor(Math.random() * 20) + 1,
        carbs_per_100g: Math.floor(Math.random() * 50) + 5,
        fat_per_100g: Math.floor(Math.random() * 15) + 1,
        fiber_per_100g: Math.floor(Math.random() * 8) + 1,
      };

      setFormData(prev => ({
        ...prev,
        nutrition: mockNutrition,
        image_url: prev.image_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=400&fit=crop',
      }));

      toast({
        title: "Nutrition data fetched",
        description: "Product information has been automatically filled.",
      });
    } catch (error) {
      toast({
        title: "Failed to fetch data",
        description: "Could not retrieve nutrition information. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category || !formData.unit) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, category, and unit.",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    toast({
      title: item ? "Item updated" : "Item added",
      description: `${formData.name} has been ${item ? 'updated' : 'added to your inventory'}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Organic Bananas"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchNutritionData}
                disabled={loading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g., Whole Foods"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="in_stock">Currently in stock</Label>
            <Switch
              id="in_stock"
              checked={formData.in_stock}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: checked }))}
            />
          </div>

          {/* Nutrition Info */}
          <div className="space-y-3">
            <Label>Nutrition (per 100g)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="calories" className="text-xs">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.nutrition.calories_per_100g || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, calories_per_100g: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.nutrition.protein_per_100g || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, protein_per_100g: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.nutrition.carbs_per_100g || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, carbs_per_100g: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.nutrition.fat_per_100g || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutrition: { ...prev.nutrition, fat_per_100g: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Fetching...' : (item ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}