import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FoodItem } from '../types';
import { format, parseISO } from 'date-fns';

interface FoodItemCardProps {
  item: FoodItem;
  onToggleStock: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FoodItemCard({ item, onToggleStock, onEdit, onDelete }: FoodItemCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{item.name}</h3>
              {item.brand && (
                <p className="text-sm text-muted-foreground truncate">{item.brand}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit}
                </span>
                {item.price && (
                  <span className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)}
                  </span>
                )}
              </div>
              {item.last_purchased && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last purchased: {format(parseISO(item.last_purchased), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.in_stock ? 'In Stock' : 'Out'}
                </span>
                <Switch
                  checked={item.in_stock}
                  onCheckedChange={onToggleStock}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              
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
          </div>

          {/* Nutrition Info */}
          {item.nutrition.calories_per_100g && (
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>{item.nutrition.calories_per_100g} cal/100g</span>
              <span>P: {item.nutrition.protein_per_100g}g</span>
              <span>C: {item.nutrition.carbs_per_100g}g</span>
              <span>F: {item.nutrition.fat_per_100g}g</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}