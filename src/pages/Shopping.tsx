import { ShoppingCart, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '../components/Layout';
import { useFoodInventory } from '../hooks/useFoodInventory';
import { useToast } from '@/hooks/use-toast';

export default function Shopping() {
  const { outOfStockItems, updateItem } = useFoodInventory();
  const { toast } = useToast();

  const markAsPurchased = (itemId: string) => {
    updateItem(itemId, { in_stock: true, quantity: 1 });
    toast({
      title: "Item purchased",
      description: "Item has been moved back to inventory.",
    });
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
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{outOfStockItems.length}</div>
          <div className="text-sm text-muted-foreground">Items to buy</div>
        </Card>

        {/* Shopping List */}
        <div className="space-y-3">
          {outOfStockItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">All items are in stock!</p>
            </div>
          ) : (
            outOfStockItems.map(item => (
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
                      {item.price && (
                        <span className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as purchased button */}
                  <Button
                    size="sm"
                    onClick={() => markAsPurchased(item.id)}
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

        {/* Estimated Total */}
        {outOfStockItems.length > 0 && (
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Total:</span>
              <span className="text-lg font-bold">
                ${outOfStockItems.reduce((total, item) => total + (item.price || 0), 0).toFixed(2)}
              </span>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}