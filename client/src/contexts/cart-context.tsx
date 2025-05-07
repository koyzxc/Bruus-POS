import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product, OrderSummary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  total: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  processOrder: () => Promise<void>;
  isProcessing: boolean;
};

type OrderCompletionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (amountPaid: number) => void;
  isProcessing: boolean;
};

type OrderSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderSummary: OrderSummary | null;
};

// Modal for collecting payment amount
function OrderCompletionModal({
  isOpen,
  onClose,
  total,
  onConfirmPayment,
  isProcessing,
}: OrderCompletionModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>("");
  const change = Math.max(0, parseFloat(amountPaid || "0") - total);
  const isValid = !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) >= total;
  
  // Reset amount when dialog opens or total changes
  React.useEffect(() => {
    if (isOpen) {
      // Initialize with empty string instead of pre-filling
      setAmountPaid("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Order</DialogTitle>
          <DialogDescription>
            Enter the amount paid by the customer to complete the order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="total">Order Total</Label>
            <div className="flex items-center border rounded px-3 py-2 bg-gray-50">
              <span className="text-gray-500 mr-1">₱</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <div className="flex items-center border rounded overflow-hidden">
              <span className="text-gray-500 px-3 py-2 bg-gray-50">₱</span>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                min={total}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="change">Change</Label>
            <div className="flex items-center border rounded px-3 py-2 bg-gray-50">
              <span className="text-gray-500 mr-1">₱</span>
              <span>{change.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirmPayment(parseFloat(amountPaid))} 
            disabled={!isValid || isProcessing}
            className="bg-[#F15A29] hover:bg-[#D84A19]"
          >
            {isProcessing ? "Processing..." : "Complete Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal for displaying order summary
function OrderSummaryModal({
  isOpen,
  onClose,
  orderSummary,
}: OrderSummaryModalProps) {
  if (!orderSummary) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Completed</DialogTitle>
          <DialogDescription>
            Order #{orderSummary.order.id} has been successfully processed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Order Items</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {orderSummary.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded overflow-hidden">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.product.name}</span>
                      {item.product.size && (
                        <span className="text-xs text-gray-500">Size: {item.product.size}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>{item.quantity} × ₱{Number(item.price).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">₱{(Number(item.price) * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 border-t pt-2">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-bold">₱{Number(orderSummary.order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>₱{orderSummary.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>₱{orderSummary.change.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-[#F15A29] hover:bg-[#D84A19]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const { toast } = useToast();

  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  // Add item to cart
  const addItem = (product: Product) => {
    setItems((prevItems) => {
      // For products with size variants, check both product ID and size
      const existingItem = prevItems.find(
        (item) => {
          if (product.size) {
            // Match both product ID and size when size exists
            return item.product.id === product.id && item.product.size === product.size;
          } else {
            // For products without size, just match ID
            return item.product.id === product.id;
          }
        }
      );

      if (existingItem) {
        return prevItems.map((item) => {
          // When checking for match, consider size as well
          const isMatch = product.size 
            ? (item.product.id === product.id && item.product.size === product.size) 
            : (item.product.id === product.id);
          
          return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
        });
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });
    
    // Show a toast notification when adding products
    toast({
      title: "Added to order",
      description: `${product.name} ${product.size ? `(${product.size})` : ''} added to your order`,
      duration: 1500,
    });
  };

  // Remove item from cart
  const removeItem = (productId: number) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = async (amountPaid: number) => {
    if (items.length === 0) {
      toast({
        title: "No items in order",
        description: "Please add items to your order first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create order payload
      const orderData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total,
        amountPaid,
      };
      
      // Submit order to API
      const res = await apiRequest("POST", "/api/orders", orderData);
      const orderSummaryData = await res.json();
      setOrderSummary(orderSummaryData);
      
      // Update cache for products, inventory, and sales
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      
      // Close payment modal and show order summary
      setShowPaymentModal(false);
      setShowOrderSummary(true);
      
      // Clear cart after successful order
      clearCart();
    } catch (error) {
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process order
  const processOrder = async () => {
    if (items.length === 0) {
      toast({
        title: "No items in order",
        description: "Please add items to your order first",
        variant: "destructive",
      });
      return;
    }

    // Open payment modal
    setShowPaymentModal(true);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        addItem,
        removeItem,
        clearCart,
        processOrder,
        isProcessing,
      }}
    >
      {children}
      
      {/* Payment Modal */}
      <OrderCompletionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onConfirmPayment={handlePaymentConfirmation}
        isProcessing={isProcessing}
      />
      
      {/* Order Summary Modal */}
      <OrderSummaryModal
        isOpen={showOrderSummary}
        onClose={() => setShowOrderSummary(false)}
        orderSummary={orderSummary}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
