import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Add item to cart
  const addItem = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });

    toast({
      title: "Added to order",
      description: `${product.name} added to your order`,
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
      };
      
      // Submit order to API
      await apiRequest("POST", "/api/orders", orderData);
      
      // Update cache for products, inventory, and sales
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      
      toast({
        title: "Order completed",
        description: `Total: ₱${total.toFixed(2)}`,
      });
      
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
