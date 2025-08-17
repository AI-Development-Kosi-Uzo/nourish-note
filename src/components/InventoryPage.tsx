import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FoodItemCard } from './FoodItemCard';
import { AddEditItemDialog } from './AddEditItemDialog';
import { useFoodInventory } from '../hooks/useFoodInventory';

export function InventoryPage() {
  const {
    items,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    ratingFilter,
    setRatingFilter,
    categories,
    addItem,
    updateItem,
    deleteItem,
    toggleStock,
    usingMockData,
    error,
  } = useFoodInventory();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const inStockCount = items.filter(item => item.in_stock).length;
  const outOfStockCount = items.filter(item => !item.in_stock).length;

  return (
    <div className="space-y-6">
      {/* Mock Data Indicator */}
      {usingMockData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
            <p className="text-sm text-amber-800">
              <strong>Demo Mode:</strong> Showing sample data with beautiful food images. 
              Connect to Supabase to see your real inventory.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !usingMockData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
          <div className="text-sm text-muted-foreground">In Stock</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{outOfStockCount}</div>
          <div className="text-sm text-muted-foreground">Out of Stock</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="unrated">Unrated</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          items.map(item => (
            <FoodItemCard
              key={item.id}
              item={item}
              onToggleStock={() => toggleStock(item.id)}
              onEdit={() => setEditingItem(item.id)}
              onDelete={() => deleteItem(item.id)}
              onRatingChange={(rating) => updateItem(item.id, { rating })}
            />
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

      {/* Add/Edit Dialog */}
      <AddEditItemDialog
        open={isAddDialogOpen || editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingItem(null);
          }
        }}
        item={editingItem ? items.find(item => item.id === editingItem) : undefined}
        onSave={(itemData) => {
          if (editingItem) {
            updateItem(editingItem, itemData);
          } else {
            addItem(itemData);
          }
          setIsAddDialogOpen(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}