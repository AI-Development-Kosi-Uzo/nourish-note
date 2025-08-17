import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FoodItem } from '../types';
import { StarRating } from './StarRating';
import { format, parseISO } from 'date-fns';

interface FoodItemCardProps {
  item: FoodItem;
  onToggleStock: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRatingChange?: (rating: number) => void;
}

export function FoodItemCard({ item, onToggleStock, onEdit, onDelete, onRatingChange }: FoodItemCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {/* Image */}
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate leading-tight">{item.name}</h3>
              {item.brand && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{item.brand}</p>
              )}
            </div>
            
            {/* Stock Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {item.in_stock ? 'In Stock' : 'Out'}
              </span>
              <Switch
                checked={item.in_stock}
                onCheckedChange={onToggleStock}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {item.category}
            </Badge>
          </div>

          {/* Purchase Date - Separate from other info */}
          {item.last_purchased && (
            <div className="mb-3">
              <span className="text-xs text-muted-foreground">
                Purchased: {format(parseISO(item.last_purchased), 'MMM d')}
              </span>
            </div>
          )}

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRating
                rating={item.rating}
                onRatingChange={onRatingChange}
                size="sm"
              />
              {item.rating > 0 && (
                <span className="text-xs text-muted-foreground">
                  {item.rating}/5
                </span>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Nutrition Info - Only show if significant data exists */}
          {(item.nutrition.calories_per_100g || item.nutrition.protein_per_100g) && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {item.nutrition.calories_per_100g > 0 && (
                  <span className="font-medium">{item.nutrition.calories_per_100g.toFixed(0)} cal</span>
                )}
                {item.nutrition.protein_per_100g > 0 && (
                  <span>Protein: {item.nutrition.protein_per_100g.toFixed(1)}g</span>
                )}
                {item.nutrition.carbs_per_100g > 0 && (
                  <span>Carbs: {item.nutrition.carbs_per_100g.toFixed(1)}g</span>
                )}
                {item.nutrition.fat_per_100g > 0 && (
                  <span>Fat: {item.nutrition.fat_per_100g.toFixed(1)}g</span>
                )}
              </div>
            </div>
          )}

          {/* Ingredients - Show if available */}
          {item.ingredients && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs">
                <span className="font-medium text-muted-foreground mb-1 block">Ingredients:</span>
                <p className="text-muted-foreground leading-relaxed">{item.ingredients}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}