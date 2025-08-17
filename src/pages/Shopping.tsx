import { ShoppingCart, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '../components/Layout';
import { useShoppingList } from '../hooks/useShoppingList';
import { useToast } from '@/hooks/use-toast';

export default function Shopping() {
  const { shoppingItems, summary, markAsPurchased, getItemTotal } = useShoppingList();
  const { toast } = useToast();

  const handleMarkAsPurchased = async (item: typeof shoppingItems[0]) => {
    try {
      const result = await markAsPurchased(item);
      toast({
        title: "Item purchased",
        description: `${result.name} has been moved back to inventory with ${result.quantity} ${result.unit}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark item as purchased.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Shopping List</h1>
          <p className="text-muted-foreground">Items you need to buy</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.totalItems}</div>
            <div className="text-sm text-muted-foreground">Items to buy</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalUnits}</div>
            <div className="text-sm text-muted-foreground">Total units</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${summary.estimatedTotal.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Estimated total</div>
          </Card>
        </div>

        {/* Shopping List */}
        <div className="space-y-3">
          {shoppingItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">All items are in stock!</p>
            </div>
          ) : (
            shoppingItems.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    {item.brand && (
                      <p className="text-sm text-muted-foreground truncate">{item.brand}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                      {item.price && (
                        <>
                          <span className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            ${getItemTotal(item).toFixed(2)} total
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mark as purchased button */}
                  <Button
                    size="sm"
                    onClick={() => handleMarkAsPurchased(item)}
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Purchased
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Shopping Summary */}
        {shoppingItems.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Items to buy:</span>
              <span>{summary.totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total units:</span>
              <span>{summary.totalUnits}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium">Estimated Total:</span>
              <span className="text-lg font-bold text-green-600">
                ${summary.estimatedTotal.toFixed(2)}
              </span>
            </div>
            {summary.itemsWithoutPrices > 0 && (
              <p className="text-xs text-muted-foreground">
                * {summary.itemsWithoutPrices} item{summary.itemsWithoutPrices > 1 ? 's' : ''} without prices - actual total may vary
              </p>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}