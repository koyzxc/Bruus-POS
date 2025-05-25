import { Product } from "@shared/schema";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Info } from "lucide-react";
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

type SizeOption = {
  id: number;
  size: string;
  price: string;
};

type ProductWithSizes = Product & {
  sizeOptions?: SizeOption[];
};

type ProductCardProps = {
  product: ProductWithSizes;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [selectedSizeOption, setSelectedSizeOption] = useState<SizeOption | null>(
    product.sizeOptions && product.sizeOptions.length > 0 
      ? product.sizeOptions[0] 
      : null
  );
  
  // Fetch product ingredients
  const { data: ingredients, isLoading: loadingIngredients } = useQuery<any[]>({
    queryKey: [`/api/products/${selectedSizeOption?.id || product.id}/ingredients`, selectedSizeOption?.id || product.id],
    enabled: isIngredientsDialogOpen,
  });
  
  // Delete mutation for products (owner only)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      // Check if this is a sales history error
      if (error.message.includes("sales history")) {
        toast({
          title: "Cannot Delete Product",
          description: "This product has sales history and cannot be deleted to maintain data integrity. Consider making it inactive instead.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
    },
  });
  
  const confirmDelete = async () => {
    try {
      // If the product has size options, handle them differently
      if (product.sizeOptions && product.sizeOptions.length > 0) {
        // We'll only attempt to delete the first size variant initially
        // If that succeeds, continue with others
        const firstOption = product.sizeOptions[0];
        deleteMutation.mutate(firstOption.id);
        
        // Note: We don't try to delete all variants simultaneously because
        // if one fails due to sales history, we want to show just one error message
        // The backend will validate each product variant individually
      } else {
        // For products without size variants, delete directly
        deleteMutation.mutate(product.id);
      }
    } catch (error) {
      console.error("Error during product deletion:", error);
    }
  };
  
  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // If we have size options, use the selected one
    if (selectedSizeOption) {
      const productToAdd = {
        ...product,
        id: selectedSizeOption.id,
        price: selectedSizeOption.price,
        size: selectedSizeOption.size
      };
      addItem(productToAdd);
    } else {
      // Otherwise use the product as is
      addItem(product);
    }
  };
  
  const handleSizeChange = (size: string) => {
    if (product.sizeOptions) {
      const option = product.sizeOptions.find(opt => opt.size === size);
      if (option) {
        setSelectedSizeOption(option);
      }
    }
  };
  
  // Get the current price to display
  const currentPrice = selectedSizeOption ? selectedSizeOption.price : product.price;
  
  return (
    <div className="product-card rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition duration-300 relative">
      {/* Admin controls overlay */}
      {user && (user.role === "owner" || user.role === "barista") && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button 
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsIngredientsDialogOpen(true);
            }}
          >
            <Info className="h-4 w-4 text-blue-600" />
          </Button>
          
          {user.role === "owner" && (
            <Button 
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      )}
      
      <div className="h-32 w-full overflow-hidden relative bg-gray-50">
        {product.imageUrl && (
          <div className="w-full h-full relative">
            {product.imageUrl.endsWith('.svg') ? (
              <object
                data={product.imageUrl}
                type="image/svg+xml"
                className="w-full h-full object-cover"
                aria-label={product.name}
              >
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain"
                />
              </object>
            ) : (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-md"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
      <div className="p-3 text-center">
        <h3 className="text-base md:text-lg font-medium uppercase tracking-wide truncate">
          {product.name}
        </h3>
        
        {/* Size options */}
        {product.sizeOptions && product.sizeOptions.length > 1 ? (
          <div className="mt-1">
            <Select 
              value={selectedSizeOption?.size || "M"} 
              onValueChange={handleSizeChange}
            >
              <SelectTrigger className="h-7 w-24 mx-auto text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizeOptions.map(option => (
                  <SelectItem key={option.id} value={option.size}>
                    {option.size} - ₱{parseFloat(option.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          product.size && (
            <div className="mt-1">
              <span className="text-xs md:text-sm bg-gray-100 px-2 py-1 rounded-sm font-normal">
                {product.size}
              </span>
            </div>
          )
        )}
        
        <p className="text-base md:text-lg font-semibold text-gray-700 mt-2">
          ₱{parseFloat(currentPrice).toFixed(2)}
        </p>
        
        {/* Add to cart button */}
        <Button 
          className="mt-2 w-full bg-[#F15A29] hover:bg-[#d94f24] text-white"
          size="sm"
          onClick={handleAddToCart}
        >
          Add to Order
        </Button>
      </div>
      
      {/* Ingredients Dialog */}
      <Dialog 
        open={isIngredientsDialogOpen} 
        onOpenChange={(open) => {
          // Allow the X button to close the dialog
          if (!open) {
            setIsIngredientsDialogOpen(false);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md" 
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}>
          <DialogHeader>
            <DialogTitle>{product.name} Ingredients</DialogTitle>
            <DialogDescription>
              List of ingredients used in this product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingIngredients ? (
              <p>Loading ingredients...</p>
            ) : ingredients && Array.isArray(ingredients) && ingredients.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {ingredients.map((ing: any) => (
                  <li key={ing.id || ing.inventoryId} className="flex justify-between items-center border-b pb-2">
                    <span>
                      <span className="font-medium">{ing.inventoryName}</span>
                      <span className="text-gray-500 ml-2">
                        {ing.quantityUsed} {ing.unit}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No ingredients defined for this product.</p>
            )}
          </div>
          {user?.role === "owner" && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsIngredientsDialogOpen(false);
                  // Trigger the edit product functionality
                  window.dispatchEvent(new CustomEvent('editProduct', { 
                    detail: { 
                      product: {
                        ...product,
                        id: selectedSizeOption?.id || product.id
                      }
                    } 
                  }));
                }}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Ingredients
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete {product.sizeOptions && product.sizeOptions.length > 1 ? 'all size variants of' : ''} "{product.name}".
              </p>
              <p className="text-amber-600 font-medium">
                Note: Products with sales history cannot be deleted to maintain data integrity and reporting accuracy.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
