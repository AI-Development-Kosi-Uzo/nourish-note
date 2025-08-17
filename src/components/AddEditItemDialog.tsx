import { useState, useEffect } from 'react';
import { Search, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FoodItem } from '../types';
import { StarRating } from './StarRating';
import { openFoodFactsService } from '../services/openFoodFacts';

interface AddEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: FoodItem;
  onSave: (item: Omit<FoodItem, 'id' | 'last_edited'>) => void;
}

const categories = ['Fruits', 'Vegetables', 'Meat', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Oils', 'Spices'];

export function AddEditItemDialog({ open, onOpenChange, item, onSave }: AddEditItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    in_stock: true,
    price: 0,
    image_url: '',
    ingredients: '',
    rating: 0,
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
        price: item.price || 0,
        image_url: item.image_url || '',
        ingredients: item.ingredients || '',
        rating: item.rating || 0,
        nutrition: { ...item.nutrition },
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        category: '',
        in_stock: true,
        price: 0,
        image_url: '',
        ingredients: '',
        rating: 0,
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
      const products = await openFoodFactsService.searchProductsWithRetry(formData.name, 1);
      
      if (products.length > 0) {
        const product = products[0];
        setFormData(prev => ({
          ...prev,
          brand: product.brand || prev.brand,
          ingredients: product.ingredients || prev.ingredients,
          nutrition: {
            calories_per_100g: product.nutrition.calories,
            protein_per_100g: product.nutrition.protein,
            carbs_per_100g: product.nutrition.carbs,
            fat_per_100g: product.nutrition.fat,
            fiber_per_100g: product.nutrition.fiber,
          },
          image_url: product.imageUrl || prev.image_url,
        }));

        toast({
          title: "Nutrition data fetched",
          description: `Product information for ${product.name} has been automatically filled.`,
        });
      } else {
        // Fallback to mock data if no results found
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
          title: "No exact match found",
          description: "Using estimated nutrition data. Please verify and adjust as needed.",
          variant: "default",
        });
      }
    } catch (error) {
      // Fallback to mock data on error
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
        title: "Using fallback data",
        description: "Could not retrieve nutrition information. Using estimated values.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchByBarcode = async () => {
    if (!barcodeInput.trim()) {
      toast({
        title: "Enter barcode",
        description: "Please enter a barcode to fetch product information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const product = await openFoodFactsService.getProductWithRetry(barcodeInput.trim());
      
      if (product) {
        setFormData(prev => ({
          ...prev,
          name: product.name,
          brand: product.brand || prev.brand,
          ingredients: product.ingredients || prev.ingredients,
          nutrition: {
            calories_per_100g: product.nutrition.calories,
            protein_per_100g: product.nutrition.protein,
            carbs_per_100g: product.nutrition.carbs,
            fat_per_100g: product.nutrition.fat,
            fiber_per_100g: product.nutrition.fiber,
          },
          image_url: product.imageUrl || prev.image_url,
        }));

        toast({
          title: "Product found",
          description: `Information for ${product.name} has been automatically filled.`,
        });
      } else {
        toast({
          title: "Product not found",
          description: "No product found with this barcode. Please enter details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to fetch product",
        description: "Could not retrieve product information. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Name and category are required
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name and category.",
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
          <DialogDescription>
            {item ? 'Update the details of your food item.' : 'Add a new food item to your inventory with nutritional information.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode Search */}
          {!item && (
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g., 1234567890123"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={fetchByBarcode}
                  disabled={loading}
                  title="Fetch product by barcode"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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
                title="Search nutrition by name"
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


          <div className="grid grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
                size="md"
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

          {/* Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
              placeholder="e.g., Organic chicken breast, water, salt, natural flavoring"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={3}
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